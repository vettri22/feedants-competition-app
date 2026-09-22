import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib/auth";
import { ok, fail } from "./lib/api";
import { AppError } from "./lib/errors";
import { getCompetitionOr404 } from "./lib/competitions";
import { getRegistration } from "./lib/registrations";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Payment service — server-side payment state machine.
 *
 * ABSTRACTION: `createOrder` records a PENDING order tied to the user's
 * registration. Confirming payment ONLY happens through the backend:
 *  - SIMULATED (no Razorpay credentials): `confirmSimulated` flips a
 *    sim-order PENDING→PAID or PENDING→FAILED exactly like a gateway
 *    callback would. The client can never mark payment success directly.
 *  - RAZORPAY: plug `verifyRazorpaySignature` (HMAC SHA256 of
 *    razorpay_order_id|razorpay_payment_id|razorpay_signature) here when
 *    RAZORPAY_KEY_ID/SECRET env vars exist; wire the webhook route as the
 *    source of truth. Simulation path is used when credentials are absent.
 *
 * Never trust the frontend: payment success always flows backend → DB.
 */
const SIMULATED = "simulated";
const RAZORPAY = "razorpay";

function activeProvider(): string {
  const hasKeys = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  return hasKeys ? RAZORPAY : SIMULATED;
}

async function createOrderImpl(
  ctx: any,
  args: { idOrSlug: string },
): Promise<unknown> {
  const user = await requireUser(ctx);
  const comp = await getCompetitionOr404(ctx, args.idOrSlug);
  const reg = await getRegistration(ctx, user._id, comp._id);
  if (!reg || reg.status === "CANCELLED") {
    throw new AppError("REGISTRATION_REQUIRED", "Register before creating a payment order.");
  }
  if (reg.paymentStatus === "PAID") {
    return ok({ alreadyPaid: true, orderId: null }, "Payment already completed.");
  }
  if (comp.entryFee <= 0) {
    return ok({ alreadyPaid: true, orderId: null }, "Free entry — no payment needed.");
  }

  const existing = await ctx.db
    .query("paymentOrders")
    .withIndex("by_registration", (q: any) => q.eq("registrationId", reg._id))
    .order("desc")
    .first();

  // Reuse a still-pending order; otherwise create a fresh one.
  if (existing && existing.status === "PENDING" && existing.provider === activeProvider()) {
    return ok({
      orderId: existing._id,
      providerOrderId: existing.providerOrderId ?? null,
      amount: existing.amount,
      currency: existing.currency,
      provider: existing.provider,
      simulated: existing.simulated,
    });
  }

  const provider = activeProvider();
  const orderId = await ctx.db.insert("paymentOrders", {
    userId: user._id,
    competitionId: comp._id,
    registrationId: reg._id,
    provider,
    providerOrderId: provider === RAZORPAY ? `rzp_order_pending_${Date.now()}` : `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    amount: comp.entryFee,
    currency: "INR",
    status: "PENDING",
    simulated: provider === SIMULATED,
    createdAt: Date.now(),
  });

  return ok({
    orderId,
    providerOrderId: null,
    amount: comp.entryFee,
    currency: "INR",
    provider,
    simulated: provider === SIMULATED,
  });
}

export const createOrder = mutation({
  args: { idOrSlug: v.string() },
  handler: (ctx, args) => createOrderImpl(ctx, args),
});

/**
 * Simulated gateway callback (development path only, clearly labeled).
 * Mirrors what a verified Razorpay webhook/verify call would do:
 * transitions order PENDING → PAID|FAILED and updates the registration.
 */
export const confirmSimulated = mutation({
  args: { orderId: v.id("paymentOrders"), outcome: v.union(v.literal("SUCCESS"), v.literal("FAILED")) },
  handler: async (ctx, args): Promise<unknown> => {
    try {
      const user = await requireUser(ctx);
      const order = await ctx.db.get(args.orderId);
      if (!order) throw new AppError("NOT_FOUND", "Payment order not found.");
      if (order.userId !== user._id) throw new AppError("FORBIDDEN", "Not your payment order.");
      if (order.status !== "PENDING") {
        return ok({ status: order.status }, "Order already finalized.");
      }
      if (!order.simulated) {
        throw new AppError("PAYMENT_FAILED", "Simulated confirmation is only for simulated orders.");
      }

      const paid = args.outcome === "SUCCESS";
      await ctx.db.patch(order._id, {
        status: paid ? "PAID" : "FAILED",
        completedAt: Date.now(),
        failureReason: paid ? undefined : "User chose 'Simulate failure' in the development gateway dialog.",
      });

      // Update registration payment state — backend is the source of truth.
      await ctx.db.patch(order.registrationId, {
        paymentStatus: paid ? "PAID" : "FAILED",
        paymentReference: paid ? order.providerOrderId : undefined,
      });

      // Log payment event (never log secrets/amounts beyond what's here).
      console.log(`[payments] simulated ${args.outcome} order=${order._id} user=${user._id}`);

      return ok({ status: paid ? "PAID" : "FAILED" }, paid ? "Payment successful." : "Payment failed.");
    } catch (err) {
      return fail(err);
    }
  },
});

/** GET /api/payments/orders — recent orders for the signed-in user. */
export const myOrders = query({
  args: {},
  handler: async (ctx): Promise<unknown> => {
    try {
      const user = await requireUser(ctx);
      const orders = await ctx.db
        .query("paymentOrders")
        .withIndex("by_user", (q: any) => q.eq("userId", user._id))
        .order("desc")
        .take(20);
      return ok({
        orders: orders.map((o: Doc<"paymentOrders">) => ({
          id: o._id,
          amount: o.amount,
          currency: o.currency,
          status: o.status,
          provider: o.provider,
          simulated: o.simulated,
          createdAt: o.createdAt,
          completedAt: o.completedAt ?? null,
        })),
      });
    } catch (err) {
      return fail(err);
    }
  },
});
