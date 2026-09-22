import { query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/auth";
import { ok, fail } from "./lib/api";
import {
  getCompetitionOr404,
  serializeCompetition,
  listCompetitions,
  validateRewardsVsPrizePool,
} from "./lib/competitions";
import type { RegistrationDoc } from "./lib/competitions";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * GET /api/competitions — list with derived status at read time.
 * Reads `now` per call so status transitions surface without cache staleness.
 */
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<unknown> => {
    try {
      const now = Date.now();
      const competitions = await listCompetitions(ctx, now, args.limit ?? 50);
      return ok({ competitions });
    } catch (err) {
      return fail(err);
    }
  },
});

/**
 * GET /api/competitions/:id — frontend-friendly detail response:
 *   { competition: {...}, userState: { authenticated, registered, ... } }
 */
export const get = query({
  args: { idOrSlug: v.string() },
  handler: async (ctx, args): Promise<unknown> => {
    try {
      const now = Date.now();
      const comp = await getCompetitionOr404(ctx, args.idOrSlug);
      const user = await getCurrentUser(ctx);
      const serialized = serializeCompetition(comp, now);

      let registration = null;
      if (user) {
        registration = (await ctx.db
          .query("competitionRegistrations")
          .withIndex("by_user_competition", (q) =>
            q.eq("userId", user._id).eq("competitionId", comp._id),
          )
          .first()) as RegistrationDoc | null;
      }

      const submission = user
        ? ((await ctx.db
            .query("submissions")
            .withIndex("by_user_competition", (q) =>
              q.eq("userId", user._id).eq("competitionId", comp._id),
            )
            .first()) as Doc<"submissions"> | null)
        : null;

      return ok({
        competition: serialized,
        userState: {
          authenticated: !!user,
          registered: !!registration && registration.status !== "CANCELLED",
          registrationId: registration?._id ?? null,
          paymentStatus: registration ? registration.paymentStatus : null,
          submissionStatus: registration?.submissionStatus ?? null,
          hasSubmission: !!submission && submission.status !== "DRAFT",
          submission: submission
            ? {
                id: submission._id,
                title: submission.title,
                description: submission.description ?? null,
                fileName: submission.fileName ?? null,
                fileType: submission.fileType ?? null,
                fileSize: submission.fileSize ?? null,
                status: submission.status,
                submittedAt: submission.submittedAt ?? null,
              }
            : null,
          isAdmin: user?.role === "admin",
        },
        rewardsValidation: validateRewardsVsPrizePool(comp.rewards, comp.prizePool),
      });
    } catch (err) {
      return fail(err);
    }
  },
});

/**
 * GET /api/competitions/:id/status — lightweight polling endpoint for the
 * countdown to refresh lifecycle state when it hits zero.
 */
export const status = query({
  args: { idOrSlug: v.string() },
  handler: async (ctx, args): Promise<unknown> => {
    try {
      const now = Date.now();
      const comp = await getCompetitionOr404(ctx, args.idOrSlug);
      const s = serializeCompetition(comp, now);
      return ok({
        id: s.id,
        status: s.status,
        remainingSpots: s.remainingSpots,
        currentParticipants: s.currentParticipants,
        dates: s.dates,
      });
    } catch (err) {
      return fail(err);
    }
  },
});

/** GET /api/competitions/:id/winners — previous winners carousel data. */
export const winners = query({
  args: { idOrSlug: v.string() },
  handler: async (ctx, args): Promise<unknown> => {
    try {
      const comp = await getCompetitionOr404(ctx, args.idOrSlug);
      return ok({ winners: comp.previousWinners });
    } catch (err) {
      return fail(err);
    }
  },
});

export const validateRewards = query({
  args: { idOrSlug: v.string() },
  handler: async (ctx, args): Promise<unknown> => {
    try {
      const comp = await getCompetitionOr404(ctx, args.idOrSlug);
      return ok(validateRewardsVsPrizePool(comp.rewards, comp.prizePool));
    } catch (err) {
      return fail(err);
    }
  },
});
