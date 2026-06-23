import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay/signature";
import { confirmRazorpayPayment, recordFailedPayment } from "@/lib/payments/razorpay/fulfillment";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Razorpay webhook endpoint.
 *
 * Configure this URL in the Razorpay Dashboard → Settings → Webhooks:
 *   https://<your-domain>/api/payments/webhook
 *
 * Subscribe to at minimum:
 *   • payment.captured   (primary success event)
 *   • payment.failed     (record failure, keep order open for retry)
 *   • refund.created     (optional — for auditing)
 *
 * Razorpay signs every webhook with a shared secret (RAZORPAY_WEBHOOK_SECRET,
 * set in the Dashboard) using HMAC-SHA256 over the raw request body. We MUST
 * read the raw body before any JSON parsing — once parsed, key-order and
 * whitespace differences can invalidate the signature.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  // 1. Always verify the webhook signature first
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn("[webhook] Invalid signature — request rejected");
    return new NextResponse("Signature mismatch", { status: 400 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const eventType = event.event;
  console.log(`[webhook] Received event: ${eventType}`);

  try {
    switch (eventType) {
      case "payment.captured":
        await handlePaymentCaptured(event);
        break;
      case "payment.failed":
        await handlePaymentFailed(event);
        break;
      case "refund.created":
        // Refund was triggered externally (e.g. from the Dashboard) — we
        // don't need to do anything here since our refundOrderPayment() action
        // already updates the DB when we trigger refunds programmatically.
        // You could add reconciliation logic here if needed.
        console.log(`[webhook] refund.created for payment ${event.payload?.payment?.entity?.id}`);
        break;
      default:
        // Log unknown events but return 200 so Razorpay doesn't retry them.
        console.log(`[webhook] Unhandled event type: ${eventType}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[webhook] Error handling ${eventType}: ${message}`);
    // Return 500 so Razorpay will retry (up to their retry policy)
    return new NextResponse(`Handler error: ${message}`, { status: 500 });
  }

  // Razorpay expects a 200 to acknowledge receipt
  return new NextResponse("OK", { status: 200 });
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handlePaymentCaptured(event: WebhookEvent) {
  const payment = event.payload?.payment?.entity;
  if (!payment) {
    console.warn("[webhook] payment.captured event missing payment entity");
    return;
  }

  const rzpOrderId = payment.order_id;
  if (!rzpOrderId) {
    console.warn("[webhook] payment.captured event missing order_id");
    return;
  }

  // Look up our internal order by Razorpay order id
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.razorpayOrderId, rzpOrderId))
    .limit(1);

  if (!order) {
    console.warn(`[webhook] No internal order found for razorpay_order_id=${rzpOrderId}`);
    // Return without error — this could be an order created outside our system
    return;
  }

  await confirmRazorpayPayment({
    orderId: order.id,
    razorpayOrderId: rzpOrderId,
    razorpayPaymentId: payment.id,
    razorpaySignature: null, // No checkout signature in server-to-server webhooks
  });

  console.log(
    `[webhook] Order ${order.id} confirmed via webhook (payment=${payment.id})`
  );
}

async function handlePaymentFailed(event: WebhookEvent) {
  const payment = event.payload?.payment?.entity;
  if (!payment) return;

  const rzpOrderId = payment.order_id;
  if (!rzpOrderId) return;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.razorpayOrderId, rzpOrderId))
    .limit(1);

  if (!order) return;

  await recordFailedPayment({
    orderId: order.id,
    razorpayOrderId: rzpOrderId,
    razorpayPaymentId: payment.id,
    amount: Number(order.totalAmount),
    reason: payment.error_description ?? null,
    code: payment.error_code ?? null,
  });

  console.log(
    `[webhook] Payment failed for order ${order.id} (payment=${payment.id}, reason=${payment.error_description})`
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface RazorpayPaymentEntity {
  id: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error_code?: string;
  error_description?: string;
}

interface WebhookEvent {
  event: string;
  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
  };
}
