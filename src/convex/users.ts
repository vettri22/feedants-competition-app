import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx } from "./_generated/server";
import { ok, fail } from "./lib/api";
import { requireUser, requireAdmin } from "./lib/auth";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY its public contract.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

/**
 * PUT /api/users/me — update profile (name, phone, preferred language).
 * Language preference persists per user for the i18n system.
 */
export const updateMe = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    preferredLanguage: v.optional(v.union(v.literal("ENG"), v.literal("HINDI"))),
  },
  handler: async (ctx, args): Promise<unknown> => {
    try {
      const user = await requireUser(ctx);
      const patch: Record<string, unknown> = {};
      if (args.name !== undefined) patch.name = args.name;
      if (args.phone !== undefined) patch.phone = args.phone;
      if (args.preferredLanguage !== undefined) patch.preferredLanguage = args.preferredLanguage;
      if (Object.keys(patch).length === 0) {
        return ok({ updated: false }, "Nothing to update.");
      }
      await ctx.db.patch(user._id, patch);
      return ok({ updated: true });
    } catch (err) {
      return fail(err);
    }
  },
});

/** Admin-only: list users with roles. Role-based authorization demo. */
export const adminListUsers = query({
  args: {},
  handler: async (ctx): Promise<unknown> => {
    try {
      await requireAdmin(ctx);
      const users = await ctx.db.query("users").take(100);
      return ok({
        users: users.map((u) => ({
          id: u._id,
          name: u.name ?? null,
          email: u.email ?? null,
          role: u.role ?? "user",
        })),
      });
    } catch (err) {
      return fail(err);
    }
  },
});
