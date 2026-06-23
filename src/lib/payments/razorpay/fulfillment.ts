import "server-only";
import { db } from "@/lib/db";
import { orders, payments, orderItems, productVariants } from "@/lib/db/schema";
import { eq, sql, type InferSelectModel } from "drizzle-orm";
import { getRazorpayClient } from "./client";
import { paiseToRupees, rupeesToPaise } from "@/lib/payments/money";

type BatchOp = Parameters<typeof db.batch>[0][number];
type Order = InferSelectModel<typeof orders>;

const FULFILLED_STATUSES = new Set(["paid", "processing", "shipped", "delivered"]);

export interface ConfirmPaymentInput {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string | null;
}

export interface ConfirmPaymentResult {
  alreadyProcessed: boolean;
  order: Order;
}

/**
 * Idempotently marks an order as paid: records the successful payment and
 * decrements stock for each line item. Safe to call more than once for the
 * same payment_id — e.g. once from the client-side verify route right after
 * checkout, and again moments later from the asynchronous webhook (the
 * recommended Razorpay pattern is to treat the webhook as the source of
 * truth and the client redirect as a same-result UX fast path).
 *
 * Idempotency is enforced at the database level via a unique index on
 * payments.razorpayPaymentId (see schema/payments.ts), not just an
 * in-memory check, so it's correct even if both call sites race.
 */
export async function confirmRazorpayPayment(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
  const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
  if (!order) {
    throw new Error(`confirmRazorpayPayment: order ${input.orderId} not found`);
  }

  if (order.razorpayOrderId && order.razorpayOrderId !== input.razorpayOrderId) {
    throw new Error(
      `confirmRazorpayPayment: razorpay order id mismatch (order has ${order.razorpayOrderId}, got ${input.razorpayOrderId})`
    );
  }

  // Defense in depth beyond the checkout signature: ask Razorpay directly
  // whether this payment really is captured before we trust it. This
  // protects against a forged or replayed client-side callback carrying a
  // technically-valid-looking signature for a payment that was never
  // actually captured (e.g. only authorized, or later failed).
  const verified = await getRazorpayClient().payments.fetch(input.razorpayPaymentId);
  if (verified.status !== "captured") {
    throw new Error(
      `confirmRazorpayPayment: Razorpay reports payment ${input.razorpayPaymentId} as "${verified.status}", not "captured" — refusing to mark order paid.`
    );
  }
  const capturedRupees = paiseToRupees(Number(verified.amount));

  // The unique index on razorpayPaymentId is what makes this race-safe: if
  // two requests for the same payment arrive concurrently, only one INSERT
  // wins. The loser sees an empty `inserted` array and exits without
  // touching order status or stock — the winner already did both.
  const inserted = await db
    .insert(payments)
    .values({
      orderId: order.id,
      method: "razorpay",
      status: "captured",
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: input.razorpaySignature ?? null,
      amount: String(capturedRupees),
      currency: (verified.currency || order.currency || "INR").toUpperCase(),
      paidAt: new Date(),
    })
    .onConflictDoNothing({ target: payments.razorpayPaymentId })
    .returning({ id: payments.id });

  if (inserted.length === 0) {
    return { alreadyProcessed: true, order };
  }

  if (FULFILLED_STATUSES.has(order.status)) {
    // A different successful payment already fulfilled this order (rare,
    // but possible with retried attempts) — keep the audit row we just
    // inserted, but don't decrement stock or move status backwards.
    return { alreadyProcessed: true, order };
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  const ops: BatchOp[] = [
    db.update(orders).set({ status: "paid", updatedAt: new Date() }).where(eq(orders.id, order.id)) as BatchOp,
    ...items.map(
      (item) =>
        db
          .update(productVariants)
          .set({ inStock: sql`GREATEST(${productVariants.inStock} - ${item.quantity}, 0)` })
          .where(eq(productVariants.id, item.productVariantId)) as BatchOp
    ),
  ];

  await db.batch(ops as [BatchOp, ...BatchOp[]]);

  const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, order.id)).limit(1);
  return { alreadyProcessed: false, order: updatedOrder ?? order };
}

export interface RecordFailedPaymentInput {
  orderId: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  amount: number;
  reason?: string | null;
  code?: string | null;
}

/** Records a failed payment attempt for audit/support purposes. Never touches order status — the order stays open for retry. */
export async function recordFailedPayment(input: RecordFailedPaymentInput): Promise<void> {
  await db.insert(payments).values({
    orderId: input.orderId,
    method: "razorpay",
    status: "failed",
    razorpayOrderId: input.razorpayOrderId ?? null,
    razorpayPaymentId: input.razorpayPaymentId ?? null,
    amount: String(input.amount),
    failureReason: input.reason ?? null,
    failureCode: input.code ?? null,
  });
}

export interface RefundResult {
  refundId: string;
  status: string;
  amountRefunded: number;
}

/**
 * Issues a real refund through the Razorpay Refunds API and updates our
 * records to match. `amountRupees` omitted means a full refund of whatever
 * was captured.
 */
export async function refundOrderPayment(orderId: string, amountRupees?: number): Promise<RefundResult> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new Error(`refundOrderPayment: order ${orderId} not found`);
  if (order.status !== "paid" && order.status !== "shipped" && order.status !== "processing") {
    throw new Error(`refundOrderPayment: order ${orderId} is "${order.status}", not eligible for refund`);
  }

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .orderBy(sql`${payments.paidAt} DESC NULLS LAST`)
    .limit(1);

  if (!payment || payment.method !== "razorpay" || !payment.razorpayPaymentId) {
    throw new Error(`refundOrderPayment: no captured Razorpay payment found for order ${orderId}`);
  }

  const refund = await getRazorpayClient().payments.refund(payment.razorpayPaymentId, {
    amount: amountRupees !== undefined ? rupeesToPaise(amountRupees) : undefined,
    speed: "normal",
    notes: { orderId },
  });

  const refundedRupees = paiseToRupees(Number(refund.amount ?? 0));

  await db.batch([
    db
      .update(payments)
      .set({
        status: "refunded",
        refundId: refund.id,
        amountRefunded: String(refundedRupees),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id)) as BatchOp,
    db.update(orders).set({ status: "refunded", updatedAt: new Date() }).where(eq(orders.id, orderId)) as BatchOp,
  ] as [BatchOp, ...BatchOp[]]);

  return { refundId: refund.id, status: refund.status, amountRefunded: refundedRupees };
}
