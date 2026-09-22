/**
 * Registration service — concurrency-safe registration business logic.
 *
 * CONCURRENCY MODEL (see README §Concurrency):
 * Convex mutations run inside *serializable* transactions with optimistic
 * concurrency control (OCC). A registration transaction reads
 * `currentParticipants`, verifies capacity, then writes the incremented value.
 * If two users register concurrently, Convex detects the conflicting write on
 * the same competition document and automatically retries one transaction
 * against fresh state — the loser re-reads capacity and cleanly fails with
 * COMPETITION_FULL. This is exactly the Mongo atomic-conditional-update /
 * transaction pattern: currentParticipants can NEVER exceed maxParticipants,
 * and the unique (userId, competitionId) index is enforced by a unique key
 * check before insert (same effect as the Mongo unique compound index).
 *
 * ROLLBACK: any failure after the increment (duplicate registration, payment
 * creation error) throws before commit, so the whole transaction — increment
 * AND registration document — rolls back atomically. No orphan increments.
 */
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { deriveCompetitionStatus } from "../../lib/competition-lifecycle";
import { AppError } from "./errors";
import { getCompetitionOr404 } from "./competitions";
import type { CompetitionDoc } from "./competitions";

export async function getRegistration(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  competitionId: Id<"competitions">,
) {
  return await ctx.db
    .query("competitionRegistrations")
    .withIndex("by_user_competition", (q) =>
      q.eq("userId", userId).eq("competitionId", competitionId),
    )
    .first();
}

function assertRegistrationPossible(comp: CompetitionDoc, now: number) {
  const hasCapacity = comp.currentParticipants < comp.maxParticipants;
  const status = deriveCompetitionStatus(now, comp, comp.manualStatusOverride, hasCapacity);

  if (comp.manualStatusOverride === "CANCELLED") {
    throw new AppError("CONFLICT", "This competition has been cancelled.");
  }
  if (status !== "REGISTRATION_OPEN") {
    if (!hasCapacity) {
      throw new AppError("COMPETITION_FULL", "Competition is full.", {
        maxParticipants: comp.maxParticipants,
      });
    }
    throw new AppError("REGISTRATION_CLOSED", "Registration has closed for this competition.");
  }
}

/**
 * Registers a user for a competition atomically:
 *   1. validate lifecycle state (dates/capacity/cancelled)
 *   2. reject duplicates (unique user+competition)
 *   3. increment participants ONLY if under capacity — committed together with
 *      the registration doc in ONE serializable transaction
 */
export async function registerUserAtomically(
  ctx: MutationCtx,
  args: { userId: Id<"users">; competitionIdOrSlug: string; referralCodeUsed?: string },
): Promise<{ registrationId: Id<"competitionRegistrations">; competition: CompetitionDoc }> {
  const now = Date.now();
  const comp = await getCompetitionOr404(ctx, args.competitionIdOrSlug);
  assertRegistrationPossible(comp, now);

  // Unique-constraint equivalent (userId + competitionId compound index).
  const existing = await getRegistration(ctx, args.userId, comp._id);
  if (existing && existing.status !== "CANCELLED") {
    throw new AppError("ALREADY_REGISTERED", "User is already registered.");
  }

  // Atomic conditional increment — throws when full; both the increment and
  // the insert commit together or not at all.
  const updated = await ctx.db
    .query("competitions")
    .withIndex("by_slug", (q) => q.eq("slug", comp.slug))
    .first();
  if (!updated) throw new AppError("NOT_FOUND", "Competition not found.");
  if (updated.currentParticipants >= updated.maxParticipants) {
    throw new AppError("COMPETITION_FULL", "Competition is full.");
  }
  ctx.db.patch(updated._id, { currentParticipants: updated.currentParticipants + 1 });

  let registrationId: Id<"competitionRegistrations">;
  try {
    registrationId = await ctx.db.insert("competitionRegistrations", {
      userId: args.userId,
      competitionId: updated._id,
      status: "REGISTERED",
      paymentStatus: updated.entryFee > 0 ? "PENDING" : "PAID",
      registeredAt: now,
      submissionStatus: undefined,
      referralCodeUsed: args.referralCodeUsed,
    });
  } catch (err) {
    // Rollback the participant increment if registration insert fails.
    ctx.db.patch(updated._id, {
      currentParticipants: Math.max(0, updated.currentParticipants),
    });
    throw err;
  }

  return { registrationId, competition: updated };
}

/** Cancels a registration and frees the spot atomically. */
export async function cancelRegistration(
  ctx: MutationCtx,
  args: { userId: Id<"users">; competitionIdOrSlug: string },
): Promise<void> {
  const comp = await getCompetitionOr404(ctx, args.competitionIdOrSlug);
  const reg = await getRegistration(ctx, args.userId, comp._id);
  if (!reg || reg.status === "CANCELLED") {
    throw new AppError("NOT_FOUND", "No active registration found.");
  }
  ctx.db.patch(reg._id, { status: "CANCELLED", updatedAt: undefined } as never);
  if (comp.currentParticipants > 0) {
    ctx.db.patch(comp._id, { currentParticipants: comp.currentParticipants - 1 });
  }
}
