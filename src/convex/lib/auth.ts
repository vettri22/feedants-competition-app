import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { AppError } from "./errors";

export interface SessionUser {
  _id: any;
  name?: string;
  email?: string;
  image?: string;
  role?: "admin" | "user" | "member";
  preferredLanguage?: "ENG" | "HINDI";
  referralCode?: string;
}

export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<SessionUser | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return (await ctx.db.get(userId)) as unknown as SessionUser | null;
}

/** Throws UNAUTHENTICATED when there is no signed-in user. */
export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<SessionUser & { _id: any }> {
  const user = await getCurrentUser(ctx);
  if (!user) throw new AppError("UNAUTHENTICATED", "Please sign in to continue.");
  return user as SessionUser & { _id: any };
}

/** Role-based authorization guard for admin endpoints. */
export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<SessionUser & { _id: any }> {
  const user = await requireUser(ctx);
  if (user.role !== "admin") {
    throw new AppError("FORBIDDEN", "Admin access required.");
  }
  return user;
}
