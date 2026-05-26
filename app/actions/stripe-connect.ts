"use server";

import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getGroomerProfile(clerkId: string) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  if (!profile) return null;

  const { data: groomer } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id, stripe_account_id, stripe_charges_enabled, stripe_details_submitted")
    .eq("user_id", profile.id)
    .maybeSingle();
  return groomer ?? null;
}

// ---------------------------------------------------------------------------
// createConnectOnboardingLink
// Creates (or reuses) a Stripe Express account for this groomer and returns
// a one-time account-link URL to send the groomer through onboarding.
// ---------------------------------------------------------------------------
export async function createConnectOnboardingLink(): Promise<
  { url: string } | { error: string }
> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const groomer = await getGroomerProfile(userId);
  if (!groomer) return { error: "Groomer profile not found." };

  try {
    let stripeAccountId = groomer.stripe_account_id;

    // Create a new Express account if one doesn't exist yet
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "GB",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        settings: {
          payouts: {
            // Weekly payouts every Monday — covers the previous Mon–Sun week.
            // Groomers see one clean transfer per week rather than daily trickle.
            schedule: { interval: "weekly", weekly_anchor: "monday" },
          },
        },
      });
      stripeAccountId = account.id;

      // Persist the new account ID immediately
      await supabaseAdmin
        .from("groomer_profiles")
        .update({ stripe_account_id: stripeAccountId })
        .eq("id", groomer.id);
    }

    // Generate a fresh account link (they expire quickly — always generate on demand)
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${APP_URL}/dashboard/groomer?stripe=refresh`,
      return_url: `${APP_URL}/dashboard/groomer?stripe=success`,
      type: "account_onboarding",
    });

    return { url: accountLink.url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[createConnectOnboardingLink]", msg);
    return { error: `Stripe error: ${msg}` };
  }
}

// ---------------------------------------------------------------------------
// getConnectAccountStatus
// Reads live status from Stripe and syncs it back to Supabase.
// Returns whether charges are enabled (i.e. groomer can receive payments).
// ---------------------------------------------------------------------------
export async function getConnectAccountStatus(): Promise<{
  connected: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  stripeAccountId: string | null;
} | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const groomer = await getGroomerProfile(userId);
  if (!groomer) return { error: "Groomer profile not found." };

  if (!groomer.stripe_account_id) {
    return { connected: false, chargesEnabled: false, detailsSubmitted: false, stripeAccountId: null };
  }

  try {
    const account = await stripe.accounts.retrieve(groomer.stripe_account_id);

    const chargesEnabled = account.charges_enabled ?? false;
    const detailsSubmitted = account.details_submitted ?? false;

    // Keep Supabase in sync
    await supabaseAdmin
      .from("groomer_profiles")
      .update({
        stripe_charges_enabled: chargesEnabled,
        stripe_details_submitted: detailsSubmitted,
      })
      .eq("id", groomer.id);

    return {
      connected: true,
      chargesEnabled,
      detailsSubmitted,
      stripeAccountId: groomer.stripe_account_id,
    };
  } catch (err) {
    console.error("[getConnectAccountStatus]", err);
    return { error: "Failed to fetch Stripe account status." };
  }
}

// ---------------------------------------------------------------------------
// createConnectDashboardLink
// Returns a Stripe Express dashboard login link so the groomer can view
// their payouts, transactions, and tax documents.
// ---------------------------------------------------------------------------
export async function createConnectDashboardLink(): Promise<
  { url: string } | { error: string }
> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const groomer = await getGroomerProfile(userId);
  if (!groomer?.stripe_account_id) {
    return { error: "No Stripe account linked." };
  }

  try {
    const link = await stripe.accounts.createLoginLink(groomer.stripe_account_id);
    return { url: link.url };
  } catch (err) {
    console.error("[createConnectDashboardLink]", err);
    return { error: "Failed to generate Stripe dashboard link." };
  }
}
