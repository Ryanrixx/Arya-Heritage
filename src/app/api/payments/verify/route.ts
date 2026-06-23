import { NextRequest, NextResponse } from "next/server";
import { verifyCheckoutSignature } from "@/lib/payments/razorpay/signature";
import { confirmRazorpayPayment, recordFailedPayment } from "@/lib/payments/razorpay/fulfillment";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Called by the client (RazorpayCheckout component) immediately after the
 * Razorpay checkout modal fires its `handler` callback. Its job:
 *
 * 1. Verify the checkout signature (HMAC-SHA256 over orderId|paymentId).
 * 2. Ask Razorpay directly whether the payment is really `captured` (defense
 *    in depth — guards against a replayed or forged callback).
 * 3. Mark the order paid + decrement stock (idempotent — safe if the webhook
 *    fires first).
 * 4. Return the internal order id so the browser can redirect to /checkout/success.
 *
 * The webhook (see ../webhook/route.ts) is the *authoritative* confirmation
 * path, but this route lets us give the customer immediate visual feedback
 * without waiting for the async webhook.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    internal_order_id,
  } = body as Record<string, string>;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !internal_order_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 1. Verify the checkout signature
  const signatureOk = verifyCheckoutSignature({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  if (!signatureOk) {
    // Signature check failed — log it but don't expose details to the caller.
    console.error(
      `[payments/verify] Signature mismatch for internal order ${internal_order_id}, ` +
        `rzp_order=${razorpay_order_id}, rzp_payment=${razorpay_payment_id}`
    );
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  // 2. Look up the order to make sure it exists and belongs to this Razorpay order
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, internal_order_id))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "Order ID mismatch" }, { status: 400 });
  }

  try {
    // 3. Idempotently confirm the payment (fetches payment status from Razorpay
    //    to guard against replay attacks, then updates order + stock)
    const result = await confirmRazorpayPayment({
      orderId: internal_order_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    return NextResponse.json({
      ok: true,
      orderId: result.order.id,
      status: result.order.status,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment confirmation failed";
    console.error(`[payments/verify] confirmRazorpayPayment error: ${message}`);

    // Record the failed attempt for support/audit (best-effort)
    try {
      await recordFailedPayment({
        orderId: internal_order_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: Number(order.totalAmount),
        reason: message,
      });
    } catch {
      // swallow — the real error is reported above
    }

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
