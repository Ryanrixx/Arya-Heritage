import "server-only";

/**
 * Two distinct signatures matter in a Razorpay integration:
 *
 * 1. Checkout signature: returned to the browser when the customer completes
 *    payment in the Razorpay Checkout modal. Signed over
 *    `${razorpay_order_id}|${razorpay_payment_id}` with RAZORPAY_KEY_SECRET.
 *
 * 2. Webhook signature: sent by Razorpay servers on the X-Razorpay-Signature
 *    header, signed with a separate RAZORPAY_WEBHOOK_SECRET over the raw
 *    request body.
 *
 * The utils live in razorpay/dist/utils/razorpay-utils — NOT on the class
 * itself. The TypeScript definitions incorrectly placed them on the class
 * in some SDK versions, so we import from the source module directly.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rzpUtils = require("razorpay/dist/utils/razorpay-utils") as {
  validatePaymentVerification: (
    body: { order_id: string; payment_id: string },
    signature: string,
    secret: string
  ) => boolean;
  validateWebhookSignature: (
    body: string,
    signature: string,
    secret: string
  ) => boolean;
};

export interface VerifyCheckoutSignatureInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export function verifyCheckoutSignature(input: VerifyCheckoutSignatureInput): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET is not set.");
  try {
    return rzpUtils.validatePaymentVerification(
      { order_id: input.razorpayOrderId, payment_id: input.razorpayPaymentId },
      input.razorpaySignature,
      secret
    );
  } catch {
    return false;
  }
}

/**
 * `rawBody` must be the *unparsed* request body text. Always read the request
 * with `await req.text()` before calling this — never `req.json()`.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not set.");
  try {
    return rzpUtils.validateWebhookSignature(rawBody, signature, secret);
  } catch {
    return false;
  }
}
