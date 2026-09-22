import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// ─── Roles ────────────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

// ─── Competition lifecycle ────────────────────────────────────────────────────
export const COMPETITION_STATUSES = [
  "DRAFT",
  "UPCOMING",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "SUBMISSION_OPEN",
  "SUBMISSION_CLOSED",
  "JUDGING",
  "RESULTS_PUBLISHED",
  "CANCELLED",
] as const;
export const competitionStatusValidator = v.union(
  ...COMPETITION_STATUSES.map((s) => v.literal(s)),
);
export type CompetitionStatus = Infer<typeof competitionStatusValidator>;

// ─── Registration / payment / submission statuses ─────────────────────────────
export const REGISTRATION_STATUSES = ["REGISTERED", "CANCELLED", "COMPLETED"] as const;
export const registrationStatusValidator = v.union(
  ...REGISTRATION_STATUSES.map((s) => v.literal(s)),
);
export type RegistrationStatus = Infer<typeof registrationStatusValidator>;

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;
export const paymentStatusValidator = v.union(
  ...PAYMENT_STATUSES.map((s) => v.literal(s)),
);
export type PaymentStatus = Infer<typeof paymentStatusValidator>;

export const SUBMISSION_STATUSES = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "REJECTED"] as const;
export const submissionStatusValidator = v.union(
  ...SUBMISSION_STATUSES.map((s) => v.literal(s)),
);
export type SubmissionStatus = Infer<typeof submissionStatusValidator>;

export const REFERRAL_STATUSES = ["PENDING", "COMPLETED", "REWARDED"] as const;
export const referralStatusValidator = v.union(
  ...REFERRAL_STATUSES.map((s) => v.literal(s)),
);
export type ReferralStatus = Infer<typeof referralStatusValidator>;

export const LANGUAGE_SUPPORT = ["ENG", "HINDI"] as const;

// ─── Object validators ────────────────────────────────────────────────────────
const judgeValidator = v.object({
  name: v.string(),
  designation: v.string(),
  experience: v.string(),
  avatarUrl: v.optional(v.string()),
  introVideoUrl: v.optional(v.string()),
});

const winnerValidator = v.object({
  name: v.string(),
  rank: v.number(),
  rankLabel: v.string(),
  imageUrl: v.optional(v.string()),
  videoUrl: v.optional(v.string()),
});

const rewardValidator = v.object({
  position: v.number(),
  label: v.string(),
  amount: v.number(),
});

const datesValidator = v.object({
  registrationStart: v.number(),
  registrationEnd: v.number(),
  submissionStart: v.number(),
  submissionEnd: v.number(),
  resultDate: v.number(),
});

// i18n: translations keyed by language code
const localizedStringValidator = v.object({
  ENG: v.string(),
  HINDI: v.optional(v.string()),
});

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = defineSchema(
  {
    // default auth tables using convex auth — do not remove or modify
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),

      // Feedants extensions
      phone: v.optional(v.string()),
      preferredLanguage: v.optional(v.union(v.literal("ENG"), v.literal("HINDI"))),
      referralCode: v.optional(v.string()),
    })
      .index("email", ["email"])
      .index("by_referral_code", ["referralCode"]),

    // ─── Competitions ─────────────────────────────────────────────────────────
    competitions: defineTable({
      slug: v.string(),
      title: v.string(),
      titleLocalized: v.optional(localizedStringValidator),
      category: v.string(),
      tags: v.array(v.string()),
      prizePool: v.number(),
      entryFee: v.number(),
      maxParticipants: v.number(),
      currentParticipants: v.number(),
      manualStatusOverride: v.optional(competitionStatusValidator),
      registrationStart: v.number(),
      registrationEnd: v.number(),
      submissionStart: v.number(),
      submissionEnd: v.number(),
      resultDate: v.number(),
      judge: judgeValidator,
      introVideoUrl: v.optional(v.string()),
      description: localizedStringValidator,
      judgingParameters: v.array(
        v.object({
          name: localizedStringValidator,
          weight: v.number(),
        }),
      ),
      rules: v.array(localizedStringValidator),
      eligibility: v.array(localizedStringValidator),
      rewards: v.array(rewardValidator),
      disclaimer: localizedStringValidator,
      refundPolicy: localizedStringValidator,
      paymentProvider: v.string(), // "razorpay" | "simulated"
      certificateEnabled: v.boolean(),
      multiWin: v.boolean(),
      previousWinners: v.array(winnerValidator),
      referralReward: v.number(),
      referralEnabled: v.boolean(),
      languageSupport: v.array(v.union(v.literal("ENG"), v.literal("HINDI"))),
      heroImageUrl: v.optional(v.string()),
    })
      .index("by_slug", ["slug"])
      .index("by_status", ["manualStatusOverride"])
      .index("by_registration_end", ["registrationEnd"])
      .index("by_submission_start", ["submissionStart"])
      .index("by_submission_end", ["submissionEnd"])
      .index("by_result_date", ["resultDate"]),

    // ─── Registrations (one per user per competition — enforced atomically) ───
    competitionRegistrations: defineTable({
      userId: v.id("users"),
      competitionId: v.id("competitions"),
      status: registrationStatusValidator,
      paymentStatus: paymentStatusValidator,
      registeredAt: v.number(),
      paymentReference: v.optional(v.string()),
      submissionStatus: v.optional(submissionStatusValidator),
      referralCodeUsed: v.optional(v.string()),
    })
      .index("by_user_competition", ["userId", "competitionId"])
      .index("by_competition", ["competitionId"])
      .index("by_user", ["userId"]),

    // ─── Submissions ──────────────────────────────────────────────────────────
    submissions: defineTable({
      userId: v.id("users"),
      competitionId: v.id("competitions"),
      title: v.string(),
      description: v.optional(v.string()),
      fileId: v.optional(v.id("_storage")),
      fileName: v.optional(v.string()),
      fileType: v.optional(v.string()),
      fileSize: v.optional(v.number()),
      externalUrl: v.optional(v.string()),
      status: submissionStatusValidator,
      submittedAt: v.optional(v.number()),
    })
      .index("by_user_competition", ["userId", "competitionId"])
      .index("by_competition", ["competitionId"])
      .index("by_user", ["userId"]),

    // ─── Payment orders (server-side payment state machine) ───────────────────
    paymentOrders: defineTable({
      userId: v.id("users"),
      competitionId: v.id("competitions"),
      registrationId: v.id("competitionRegistrations"),
      provider: v.string(),
      providerOrderId: v.optional(v.string()),
      amount: v.number(),
      currency: v.string(),
      status: paymentStatusValidator,
      simulated: v.boolean(),
      createdAt: v.number(),
      completedAt: v.optional(v.number()),
      failureReason: v.optional(v.string()),
    })
      .index("by_provider_order", ["providerOrderId"])
      .index("by_registration", ["registrationId"])
      .index("by_user", ["userId"]),

    // ─── Referrals ────────────────────────────────────────────────────────────
    referrals: defineTable({
      referrerId: v.id("users"),
      referredUserId: v.optional(v.id("users")),
      referralCode: v.string(),
      status: referralStatusValidator,
      rewardAmount: v.number(),
      competitionId: v.optional(v.id("competitions")),
      createdAt: v.number(),
      rewardedAt: v.optional(v.number()),
    })
      .index("by_referrer", ["referrerId"])
      .index("by_referred_user", ["referredUserId"])
      .index("by_code", ["referralCode"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
