/**
 * Razorpay amounts are always integers in the smallest currency unit — for
 * INR that's paise (1 rupee = 100 paise). Our database stores rupee amounts
 * as decimal strings/numbers (numeric(10,2)) for readability and to match
 * the rest of the catalog (prices, etc). These helpers are the single place
 * that conversion happens, so it's never done ad-hoc (and never gets out of
 * sync) at call sites.
 */

/** Rupees (e.g. 499.5) -> integer paise (e.g. 49950) for the Razorpay API. */
export function rupeesToPaise(rupees: number): number {
  if (!Number.isFinite(rupees) || rupees < 0) {
    throw new Error(`Invalid rupee amount: ${rupees}`);
  }
  return Math.round(rupees * 100);
}

/** Integer paise (e.g. 49950) -> rupees (e.g. 499.5), as returned by Razorpay webhooks/responses. */
export function paiseToRupees(paise: number): number {
  return Math.round(paise) / 100;
}

/** Formats a rupee amount the way Indian customers expect: ₹1,499 (no decimals when whole). */
export function formatINR(rupees: number): string {
  const hasFraction = !Number.isInteger(rupees);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}
