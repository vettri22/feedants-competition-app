/**
 * Competition service — serialization layer between raw Mongo-style documents
 * (Convex tables) and the frontend-friendly API contract from the assignment:
 * remainingSpots, derived status, dates, userState, etc. All values shown in
 * the UI originate here from database state; nothing is hardcoded in UI.
 */
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { deriveCompetitionStatus } from "../../lib/competition-lifecycle";
import { AppError } from "./errors";

export type CompetitionDoc = Doc<"competitions">;
export type RegistrationDoc = Doc<"competitionRegistrations">;

export interface SerializedCompetition {
  id: string;
  slug: string;
  title: string;
  titleLocalized: { ENG: string; HINDI?: string } | null;
  category: string;
  tags: string[];
  prizePool: number;
  entryFee: number;
  maxParticipants: number;
  currentParticipants: number;
  remainingSpots: number;
  bookedFraction: number;
  status: string;
  certificateEnabled: boolean;
  multiWin: boolean;
  introVideoUrl?: string;
  judge: {
    name: string;
    designation: string;
    experience: string;
    avatarUrl?: string;
    introVideoUrl?: string;
  };
  dates: {
    registrationStart: number;
    registrationEnd: number;
    submissionStart: number;
    submissionEnd: number;
    resultDate: number;
  };
  description: { ENG: string; HINDI?: string };
  judgingParameters: { name: { ENG: string; HINDI?: string }; weight: number }[];
  rules: { ENG: string; HINDI?: string }[];
  eligibility: { ENG: string; HINDI?: string }[];
  rewards: { position: number; label: string; amount: number }[];
  disclaimer: { ENG: string; HINDI?: string };
  refundPolicy: { ENG: string; HINDI?: string };
  paymentProvider: string;
  previousWinners: { name: string; rank: number; rankLabel: string; imageUrl?: string; videoUrl?: string }[];
  referralReward: number;
  referralEnabled: boolean;
  languageSupport: string[];
  heroImageUrl?: string;
}

export function serializeCompetition(c: CompetitionDoc, now: number): SerializedCompetition {
  const hasCapacity = c.currentParticipants < c.maxParticipants;
  const status = deriveCompetitionStatus(now, c, c.manualStatusOverride, hasCapacity);
  return {
    id: c._id,
    slug: c.slug,
    title: c.title,
    titleLocalized: c.titleLocalized ?? null,
    category: c.category,
    tags: c.tags,
    prizePool: c.prizePool,
    entryFee: c.entryFee,
    maxParticipants: c.maxParticipants,
    currentParticipants: c.currentParticipants,
    remainingSpots: Math.max(0, c.maxParticipants - c.currentParticipants),
    bookedFraction: c.maxParticipants > 0 ? Math.min(1, c.currentParticipants / c.maxParticipants) : 0,
    status,
    certificateEnabled: c.certificateEnabled,
    multiWin: c.multiWin,
    introVideoUrl: c.introVideoUrl,
    judge: c.judge,
    dates: {
      registrationStart: c.registrationStart,
      registrationEnd: c.registrationEnd,
      submissionStart: c.submissionStart,
      submissionEnd: c.submissionEnd,
      resultDate: c.resultDate,
    },
    description: c.description,
    judgingParameters: c.judgingParameters,
    rules: c.rules,
    eligibility: c.eligibility,
    rewards: [...c.rewards].sort((a, b) => a.position - b.position),
    disclaimer: c.disclaimer,
    refundPolicy: c.refundPolicy,
    paymentProvider: c.paymentProvider,
    previousWinners: c.previousWinners,
    referralReward: c.referralReward,
    referralEnabled: c.referralEnabled,
    languageSupport: c.languageSupport,
    heroImageUrl: c.heroImageUrl,
  };
}

/** Loads a competition by id or slug; throws NOT_FOUND when absent. */
export async function getCompetitionOr404(
  ctx: QueryCtx,
  idOrSlug: string,
): Promise<CompetitionDoc> {
  let comp: CompetitionDoc | null = null;
  if (/^[a-z0-9]{20,}$/i.test(idOrSlug)) {
    comp = await ctx.db.get(idOrSlug as Id<"competitions">);
  }
  if (!comp) {
    comp = await ctx.db
      .query("competitions")
      .withIndex("by_slug", (q) => q.eq("slug", idOrSlug))
      .first();
  }
  if (!comp) throw new AppError("NOT_FOUND", "Competition not found.");
  return comp;
}

/**
 * Validates that configured rewards sum to the advertised prize pool.
 * Returns warnings — never silently modifies values.
 */
export function validateRewardsVsPrizePool(
  rewards: { position: number; label: string; amount: number }[],
  prizePool: number,
): { sum: number; prizePool: number; consistent: boolean } {
  const sum = rewards.reduce((acc, r) => acc + r.amount, 0);
  return { sum, prizePool, consistent: sum === prizePool };
}

/** Lists competitions with status derived at read time. */
export async function listCompetitions(
  ctx: QueryCtx,
  now: number,
  limit = 50,
): Promise<SerializedCompetition[]> {
  const page = await ctx.db
    .query("competitions")
    .withIndex("by_registration_end")
    .order("desc")
    .take(limit);
  return page
    .filter((c) => c.manualStatusOverride !== "DRAFT")
    .map((c) => serializeCompetition(c, now));
}
