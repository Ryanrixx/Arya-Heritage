import "server-only";
import Razorpay from "razorpay";

/**
 * Server-side Razorpay client.
 *
 * `server-only` makes it a build error if anything ever tries to import this
 * from a Client Component, which is the structural guarantee that
 * RAZORPAY_KEY_SECRET can never end up in a browser bundle.
 *
 * Only RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are read here. Neither is
 * prefixed with NEXT_PUBLIC_, so Next.js will not inline them into client
 * JavaScript. The key id (not the secret) is handed to the browser only as
 * part of a specific order-creation response — see lib/actions/order.ts.
 */

let cachedClient: Razorpay | null = null;

function getEnv(name: "RAZORPAY_KEY_ID" | "RAZORPAY_KEY_SECRET"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Add it to your environment (see .env.example) before accepting payments.`
    );
  }
  return value;
}

export function getRazorpayClient(): Razorpay {
  if (cachedClient) return cachedClient;

  cachedClient = new Razorpay({
    key_id: getEnv("RAZORPAY_KEY_ID"),
    key_secret: getEnv("RAZORPAY_KEY_SECRET"),
  });

  return cachedClient;
}

/** Safe to send to the browser — Razorpay's key id is a public identifier, not a secret. */
export function getRazorpayPublicKeyId(): string {
  return getEnv("RAZORPAY_KEY_ID");
}
