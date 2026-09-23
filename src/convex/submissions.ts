import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib/auth";
import { ok, fail } from "./lib/api";
import { AppError } from "./lib/errors";
import { getCompetitionOr404, serializeCompetition } from "./lib/competitions";
import { getRegistration } from "./lib/registrations";
import type { Id } from "./_generated/dataModel";

/**
 * Submission service — real file upload via Convex file storage.
 * Validation (mirrors the assignment's server-side rules):
 *  - user must hold an active registration
 *  - submission window must be open (server clock, not client)
 *  - video mime types only; size capped by UPLOAD_MAX_SIZE
 *  - one submission per user+competition; edits replace the file/fields
 *    without resetting review state
 */
const ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
];

function defaultMaxSize(): number {
  const raw = Number(process.env.UPLOAD_MAX_SIZE);
  return Number.isFinite(raw) && raw > 0 ? raw : 100 * 1024 * 1024; // 100MB
}

async function createOrUpdateImpl(ctx: any, args: {
  idOrSlug: string;
  title: string;
  description?: string;
  fileId?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}): Promise<unknown> {
  try {
    const user = await requireUser(ctx);
    const comp = await getCompetitionOr404(ctx, args.idOrSlug);
    const now = Date.now();
    const s = serializeCompetition(comp, now);

    // Lifecycle gate — server clock decides.
    const inWindow = now >= s.dates.submissionStart && now <= s.dates.submissionEnd;
    if (!inWindow || (s.status !== "SUBMISSION_OPEN" && s.status !== "REGISTRATION_CLOSED")) {
      throw new AppError(
        now > s.dates.submissionEnd ? "SUBMISSION_WINDOW_CLOSED" : "SUBMISSION_WINDOW_NOT_OPEN",
        now > s.dates.submissionEnd
          ? "The submission window has closed."
          : "Submissions are not open yet.",
      );
    }

    // Registration gate.
    const reg = await getRegistration(ctx, user._id, comp._id);
    if (!reg || reg.status === "CANCELLED") {
      throw new AppError("REGISTRATION_REQUIRED", "You must be registered to submit.");
    }
    if (reg.paymentStatus === "PENDING") {
      throw new AppError("PAYMENT_REQUIRED", "Complete payment before uploading your submission.");
    }

    // File validation.
    let fileId: Id<"_storage"> | undefined;
    if (args.fileId) {
      if (!args.fileType || !ALLOWED_TYPES.includes(args.fileType)) {
        throw new AppError("INVALID_FILE", "Only MP4, MOV, WEBM or AVI video files are allowed.");
      }
      if (args.fileSize && args.fileSize > defaultMaxSize()) {
        throw new AppError("INVALID_FILE", "File is too large.", {
          maxSize: defaultMaxSize(),
        });
      }
      fileId = args.fileId as Id<"_storage">;
    } else {
      const existing = await getExisting(ctx, user._id, comp._id);
      if (!existing?.fileId) {
        throw new AppError("INVALID_FILE", "Please attach a video file.");
      }
      fileId = existing.fileId; // keep previous file when editing metadata only
    }

    const existing = await getExisting(ctx, user._id, comp._id);
    if (existing) {
      if (existing.status === "UNDER_REVIEW" || existing.status === "REJECTED") {
        throw new AppError("ALREADY_SUBMITTED", "This submission is locked for review.");
      }
      await ctx.db.patch(existing._id, {
        title: args.title,
        description: args.description,
        fileId,
        fileName: args.fileName ?? existing.fileName,
        fileType: args.fileType ?? existing.fileType,
        fileSize: args.fileSize ?? existing.fileSize,
        status: "SUBMITTED",
        submittedAt: now,
      });
      await ctx.db.patch(reg._id, { submissionStatus: "SUBMITTED" });
      return ok({ submissionId: existing._id, edited: true }, "Submission updated.");
    }

    const submissionId = await ctx.db.insert("submissions", {
      userId: user._id,
      competitionId: comp._id,
      title: args.title,
      description: args.description,
      fileId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      status: "SUBMITTED",
      submittedAt: now,
    });
    await ctx.db.patch(reg._id, { submissionStatus: "SUBMITTED" });
    return ok({ submissionId, edited: false }, "Submission uploaded successfully.");
  } catch (err) {
    return fail(err);
  }
}

async function getExisting(ctx: any, userId: Id<"users">, competitionId: Id<"competitions">) {
  return await ctx.db
    .query("submissions")
    .withIndex("by_user_competition", (q: any) =>
      q.eq("userId", userId).eq("competitionId", competitionId),
    )
    .first();
}

export const upsert = mutation({
  args: {
    idOrSlug: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  },
  handler: (ctx, args) => createOrUpdateImpl(ctx, args),
});

/** GET /api/me/submissions — the signed-in user's submissions across competitions. */
export const listMine = query({
  args: {},
  handler: async (ctx): Promise<unknown> => {
    try {
      const user = await requireUser(ctx);
      const rows = await ctx.db
        .query("submissions")
        .withIndex("by_user", (q: any) => q.eq("userId", user._id))
        .order("desc")
        .collect();
      const items = [];
      for (const row of rows) {
        const comp = await ctx.db.get(row.competitionId);
        items.push({
          id: row._id,
          competitionSlug: comp?.slug ?? null,
          competitionTitle: comp?.title ?? null,
          title: row.title,
          status: row.status,
          submittedAt: row.submittedAt ?? null,
          fileName: row.fileName ?? null,
        });
      }
      return ok({ submissions: items });
    } catch (err) {
      return fail(err);
    }
  },
});

/** GET /api/competitions/:id/submission */
export const get = query({
  args: { idOrSlug: v.string() },
  handler: async (ctx, args): Promise<unknown> => {
    try {
      const user = await requireUser(ctx);
      const comp = await getCompetitionOr404(ctx, args.idOrSlug);
      const existing = await getExisting(ctx, user._id, comp._id);
      if (!existing) return ok({ submission: null });
      return ok({
        submission: {
          id: existing._id,
          title: existing.title,
          description: existing.description ?? null,
          fileName: existing.fileName ?? null,
          fileType: existing.fileType ?? null,
          fileSize: existing.fileSize ?? null,
          status: existing.status,
          submittedAt: existing.submittedAt ?? null,
        },
      });
    } catch (err) {
      return fail(err);
    }
  },
});

/** Generates a short-lived upload URL the client PUTs the raw video to. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx): Promise<unknown> => {
    try {
      await requireUser(ctx);
      return ok({ uploadUrl: await ctx.storage.generateUploadUrl() });
    } catch (err) {
      return fail(err);
    }
  },
});
