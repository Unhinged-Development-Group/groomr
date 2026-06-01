"use server";

import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getProfileId(clerkId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function createTipPaymentIntent(
  appointmentId: string,
  amountPence: number,
): Promise<{ clientSecret: string } | { error: string }> {
  if (amountPence < 100 || amountPence > 10000) {
    return { error: "Tip must be between £1 and £100." };
  }

  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const profileId = await getProfileId(userId);
  if (!profileId) return { error: "Profile not found." };

  // Verify ownership, completion status, and load groomer Stripe info
  const { data: appt, error: apptErr } = await supabaseAdmin
    .from("appointments")
    .select(`
      id,
      owner_id,
      status,
      groomer_profile_id,
      groomer_profiles!inner (
        stripe_account_id,
        stripe_charges_enabled
      )
    `)
    .eq("id", appointmentId)
    .eq("owner_id", profileId)
    .single();

  if (apptErr || !appt) return { error: "Appointment not found." };
  if (appt.status !== "completed") return { error: "Tips can only be sent for completed appointments." };

  const gp = Array.isArray(appt.groomer_profiles)
    ? appt.groomer_profiles[0]
    : appt.groomer_profiles;

  if (!gp?.stripe_account_id) {
    return { error: "This groomer hasn't connected their Stripe account yet." };
  }
  if (!gp.stripe_charges_enabled) {
    return { error: "This groomer's Stripe account isn't fully set up yet." };
  }

  // Prevent duplicate tips for the same appointment
  const { data: existing } = await supabaseAdmin
    .from("tips")
    .select("id, status, stripe_payment_intent_id")
    .eq("appointment_id", appointmentId)
    .eq("owner_id", profileId)
    .maybeSingle();

  if (existing?.status === "succeeded") {
    return { error: "You've already tipped for this appointment." };
  }

  // Reuse a pending intent if one exists
  if (existing?.stripe_payment_intent_id) {
    const pi = await stripe.paymentIntents.retrieve(existing.stripe_payment_intent_id);
    if (pi.status !== "succeeded" && pi.status !== "canceled") {
      if (!pi.client_secret) return { error: "Payment intent has no client secret." };
      return { clientSecret: pi.client_secret };
    }
  }

  // Tips pass 100% to the groomer — no platform fee
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountPence,
    currency: "gbp",
    application_fee_amount: 0,
    transfer_data: { destination: gp.stripe_account_id },
    metadata: {
      type: "tip",
      appointment_id: appointmentId,
      owner_profile_id: profileId,
      groomer_profile_id: appt.groomer_profile_id,
    },
    description: "Groomr groomer tip",
  });

  if (!paymentIntent.client_secret) {
    return { error: "Failed to create payment intent." };
  }

  const tipRow = {
    appointment_id: appointmentId,
    owner_id: profileId,
    groomer_profile_id: appt.groomer_profile_id,
    amount_pence: amountPence,
    stripe_payment_intent_id: paymentIntent.id,
    status: "pending",
  };

  if (existing) {
    await supabaseAdmin.from("tips").update(tipRow).eq("id", existing.id);
  } else {
    await supabaseAdmin.from("tips").insert(tipRow);
  }

  return { clientSecret: paymentIntent.client_secret };
}

export interface TipRecord {
  appointment_id: string;
  status: string;
}

export async function getOwnerTips(): Promise<TipRecord[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const profileId = await getProfileId(userId);
  if (!profileId) return [];

  const { data } = await supabaseAdmin
    .from("tips")
    .select("appointment_id, status")
    .eq("owner_id", profileId)
    .eq("status", "succeeded");

  return (data ?? []) as TipRecord[];
}
