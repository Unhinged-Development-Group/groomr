import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
});

/** Groomr platform commission: 8% */
export const PLATFORM_FEE_PCT = 0.08;

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
