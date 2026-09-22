import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib/auth";
import { ok, fail } from "./lib/api";
import {
  registerUserAtomically,
  getRegistration,
  cancelRegistration,
} from "./lib/registrations";
import { getCompetitionOr404 } from "./lib/competitions";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * POST /api/competitions/:id/register — concurrency-safe registration.
 * Capacity + duplicate checks + increment + insert all commit in ONE
 * serializable transaction. On full/closed/duplicate, throws a typed error
 * that surfaces as a structured 409-style failure to the client.
 */
export const register = mutation({
  args: { idOrSlug: v.string(), referralCodeUsed: v.optional(v.string()) },
  handler: async (ctx, args): Promise<unknown> => {
    try {
      const user = await requireUser(ctx);
      const { registrationId, competition } = await registerUserAtomically(ctx, {
        userId: user._id as Id<"users">,
        competitionIdOrSlug: args.idOrSlug,
        referralCodeUsed: args.referralCodeUsed,
      });
      return ok(
        {
          registrationId,
          competitionId: competition._id,
          paymentStatus: competition.entryFee > 0 ? "PENDING" : "PAID",
          remainingSpots: Math.max(0, competition.maxParticipants - competition.currentParticipants),
        },
        "Registered successfully.",
      );
    } catch (err) {
      return fail(err);
    }
  },
});

/** GET /api/competitions/:id/registration-status */
export const registrationStatus = query({
  args: { idOrSlug: v.string() },
  handler: async (ctx, args): Promise<unknown> => {
    try {
      const user = await requireUser(ctx);
      const comp = await getCompetitionOr404(ctx, args.idOrSlug);
      const reg = await getRegistration(ctx, user._id as Id<"users">, comp._id);
      return ok({
        registered: !!reg && reg.status !== "CANCELLED",
        status: reg?.status ?? null,
        paymentStatus: reg?.paymentStatus ?? null,
        submissionStatus: reg?.submissionStatus ?? null,
        registeredAt: reg?.registeredAt ?? null,
      });
    } catch (err) {
      return fail(err);
    }
  },
});

/** DELETE /api/competitions/:id/register — frees a spot atomically. */
export const cancel = mutation({
  args: { idOrSlug: v.string() },
  handler: async (ctx, args): Promise<unknown> => {
    try {
      const user = await requireUser(ctx);
      await cancelRegistration(ctx, {
        userId: user._id as Id<"users">,
        competitionIdOrSlug: args.idOrSlug,
      });
      return ok({ cancelled: true }, "Registration cancelled.");
    } catch (err) {
      return fail(err);
    }
  },
});
