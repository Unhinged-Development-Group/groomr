import Stripe from "stripe";

/** Groomr platform commission: 8% */
export const PLATFORM_FEE_PCT = 0.08;

// Lazy singleton — initialised on first use, not at module import time.
// This prevents the build from blowing up if STRIPE_SECRET_KEY isn't set
// in the build environment (it only needs to be set at runtime).
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
  return _stripe;
}

// Convenience re-export used by most callers — keeps call sites clean.
// The getter is called on first property access, not at import time.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Calculate the platform application_fee_amount for a given total.
 * Always in pence (integer). Stripe requires integer minor units.
 */
export function calcPlatformFee(totalPence: number): number {
  return Math.round(totalPence * PLATFORM_FEE_PCT);
}

/**
 * Calculate the groomer's net payout after Groomr's fee.
 */
export function calcGroomerPayout(totalPence: number): number {
  return totalPence - calcPlatformFee(totalPence);
}
