import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib/auth";
import { ok, fail } from "./lib/api";
import { AppError } from "./lib/errors";
import type { Doc } from "./_generated/dataModel";

/**
 * Referral service:
 *  - POST /api/referrals/generate → idempotent per-user code generation
 *  - GET  /api/referrals/me       → code + referral URL + tracked referrals
 *  - capture()                    → links a new signup to a referrer,
 *    preventing self-referral and duplicate rewards (referrer+referred
 *    uniqueness enforced by scanning the by_referrer index before insert).
 */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no confusing chars

function generateCode(): string {
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export const generate = mutation({
  args: {},
  handler: async (ctx): Promise<unknown> => {
    try {
      const user = await requireUser(ctx);
      if (user.referralCode) {
        return ok({ code: user.referralCode, alreadyExisted: true });
      }
      let code = generateCode();
      for (let attempt = 0; attempt < 5; attempt++) {
        const taken = await ctx.db
          .query("users")
          .withIndex("by_referral_code", (q: any) => q.eq("referralCode", code))
          .first();
        if (!taken) break;
        code = generateCode();
      }
      await ctx.db.patch(user._id, { referralCode: code });
      return ok({ code, alreadyExisted: false });
    } catch (err) {
      return fail(err);
    }
  },
});

export const me = query({
  args: {},
  handler: async (ctx): Promise<unknown> => {
    try {
      const user = await requireUser(ctx);
      const code = user.referralCode ?? null;
      if (!code) {
        return ok({ code: null, referralUrl: null, referrals: [], rewardPerSignup: 10 });
      }
      const referrals = await ctx.db
        .query("referrals")
        .withIndex("by_referrer", (q: any) => q.eq("referrerId", user._id))
        .collect();
      return ok({
        code,
        referralUrl: `https://feedants.com/r/${code}`,
        rewardPerSignup: 10,
        referrals: referrals.map((r: Doc<"referrals">) => ({
          id: r._id,
          referredUserId: r.referredUserId ?? null,
          status: r.status,
          rewardAmount: r.rewardAmount,
          createdAt: r.createdAt,
        })),
      });
    } catch (err) {
      return fail(err);
    }
  },
});

/** Called by signup flow: links referrer↔referred. No self-referral, no dupes. */
export const capture = mutation({
  args: { referralCode: v.string() },
  handler: async (ctx, args): Promise<unknown> => {
    try {
      const user = await requireUser(ctx);
      if (user.referralCode) return ok({ alreadyProcessed: true });
      const owner = await ctx.db
        .query("users")
        .withIndex("by_referral_code", (q: any) => q.eq("referralCode", args.referralCode))
        .first();
      if (!owner) return ok({ linked: false }, "Referral code not recognized.");
      if (owner._id === user._id) {
        throw new AppError("SELF_REFERRAL", "You cannot use your own referral code.");
      }
      const dupe = await ctx.db
        .query("referrals")
        .withIndex("by_referrer", (q: any) => q.eq("referrerId", owner._id))
        .collect();
      if (dupe.some((r: Doc<"referrals">) => r.referredUserId === user._id)) {
        return ok({ alreadyProcessed: true });
      }
      await ctx.db.insert("referrals", {
        referrerId: owner._id,
        referredUserId: user._id,
        referralCode: args.referralCode,
        status: "COMPLETED",
        rewardAmount: 10,
        createdAt: Date.now(),
      });
      return ok({ linked: true }, "Referral applied.");
    } catch (err) {
      return fail(err);
    }
  },
});
