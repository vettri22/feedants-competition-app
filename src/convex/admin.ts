import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { ok, fail } from "./lib/api";
import { getCompetitionOr404 } from "./lib/competitions";

/**
 * POST /api/admin/competitions — create with role-based authorization.
 * Dates are epoch millis; localized fields accept {ENG, HINDI?}.
 */
export const createCompetition = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    prizePool: v.number(),
    entryFee: v.number(),
    maxParticipants: v.number(),
    registrationStart: v.number(),
    registrationEnd: v.number(),
    submissionStart: v.number(),
    submissionEnd: v.number(),
    resultDate: v.number(),
    judge: v.object({
      name: v.string(),
      designation: v.string(),
      experience: v.string(),
      avatarUrl: v.optional(v.string()),
      introVideoUrl: v.optional(v.string()),
    }),
    description: v.object({ ENG: v.string(), HINDI: v.optional(v.string()) }),
    disclaimer: v.object({ ENG: v.string(), HINDI: v.optional(v.string()) }),
    refundPolicy: v.object({ ENG: v.string(), HINDI: v.optional(v.string()) }),
    rewards: v.array(v.object({ position: v.number(), label: v.string(), amount: v.number() })),
    rules: v.optional(v.array(v.object({ ENG: v.string(), HINDI: v.optional(v.string()) }))),
    eligibility: v.optional(v.array(v.object({ ENG: v.string(), HINDI: v.optional(v.string()) }))),
    judgingParameters: v.optional(
      v.array(v.object({ name: v.object({ ENG: v.string(), HINDI: v.optional(v.string()) }), weight: v.number() })),
    ),
    previousWinners: v.optional(
      v.array(
        v.object({
          name: v.string(),
          rank: v.number(),
          rankLabel: v.string(),
          imageUrl: v.optional(v.string()),
          videoUrl: v.optional(v.string()),
        }),
      ),
    ),
    certificateEnabled: v.optional(v.boolean()),
    multiWin: v.optional(v.boolean()),
    referralReward: v.optional(v.number()),
    referralEnabled: v.optional(v.boolean()),
    introVideoUrl: v.optional(v.string()),
    manualStatusOverride: v.optional(
      v.union(
        v.literal("DRAFT"),
        v.literal("UPCOMING"),
        v.literal("REGISTRATION_OPEN"),
        v.literal("REGISTRATION_CLOSED"),
        v.literal("SUBMISSION_OPEN"),
        v.literal("SUBMISSION_CLOSED"),
        v.literal("JUDGING"),
        v.literal("RESULTS_PUBLISHED"),
        v.literal("CANCELLED"),
      ),
    ),
  },
  handler: async (ctx, args): Promise<unknown> => {
    try {
      await requireAdmin(ctx);
      const id = await ctx.db.insert("competitions", {
        ...args,
        currentParticipants: 0,
        paymentProvider: "simulated",
        certificateEnabled: args.certificateEnabled ?? true,
        multiWin: args.multiWin ?? true,
        referralReward: args.referralReward ?? 10,
        referralEnabled: args.referralEnabled ?? true,
        languageSupport: ["ENG", "HINDI"],
        rules: args.rules ?? [],
        eligibility: args.eligibility ?? [],
        judgingParameters: args.judgingParameters ?? [],
        previousWinners: args.previousWinners ?? [],
      });
      return ok({ id }, "Competition created.");
    } catch (err) {
      return fail(err);
    }
  },
});

/** PUT /api/admin/competitions/:id — partial update. */
export const updateCompetition = mutation({
  args: {
    id: v.id("competitions"),
    patch: v.object({
      title: v.optional(v.string()),
      prizePool: v.optional(v.number()),
      entryFee: v.optional(v.number()),
      maxParticipants: v.optional(v.number()),
      manualStatusOverride: v.optional(
        v.union(
          v.literal("DRAFT"),
          v.literal("UPCOMING"),
          v.literal("REGISTRATION_OPEN"),
          v.literal("REGISTRATION_CLOSED"),
          v.literal("SUBMISSION_OPEN"),
          v.literal("SUBMISSION_CLOSED"),
          v.literal("JUDGING"),
          v.literal("RESULTS_PUBLISHED"),
          v.literal("CANCELLED"),
        ),
      ),
      registrationEnd: v.optional(v.number()),
      submissionStart: v.optional(v.number()),
      submissionEnd: v.optional(v.number()),
      resultDate: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args): Promise<unknown> => {
    try {
      await requireAdmin(ctx);
      await getCompetitionOr404(ctx, args.id);
      await ctx.db.patch(args.id, args.patch);
      return ok({ id: args.id }, "Competition updated.");
    } catch (err) {
      return fail(err);
    }
  },
});

/** DELETE /api/admin/competitions/:id — soft-cancel preserves registrations. */
export const deleteCompetition = mutation({
  args: { id: v.id("competitions") },
  handler: async (ctx, args): Promise<unknown> => {
    try {
      await requireAdmin(ctx);
      await getCompetitionOr404(ctx, args.id);
      await ctx.db.patch(args.id, { manualStatusOverride: "CANCELLED" });
      return ok({ id: args.id }, "Competition cancelled.");
    } catch (err) {
      return fail(err);
    }
  },
});
