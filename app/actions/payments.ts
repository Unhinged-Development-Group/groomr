"use server";

import { auth } from "@clerk/nextjs/server";
import { stripe, calcPlatformFee, calcGroomerPayout } from "@/lib/stripe";
import { resolvePlatformFeePct } from "@/lib/fees";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function getProfileId(clerkId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  return data?.id ?? null;
}

// ---------------------------------------------------------------------------
// createBookingPaymentIntent
//
// Called after createAppointment() succeeds.
// Creates a Stripe PaymentIntent for the correct amount (deposit or full),
// wires the application_fee to Groomr, and persists a row in `payments`.
//
// Returns the PaymentIntent client_secret for the client to confirm.
// ---------------------------------------------------------------------------

export interface BookingPaymentIntentInput {
  appointmentId: string;
}

export async function createBookingPaymentIntent(
  input: BookingPaymentIntentInput,
): Promise<{ clientSecret: string | null; amountPence: number } | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const profileId = await getProfileId(userId);
  if (!profileId) return { error: "Profile not found." };

  // Load appointment + service + groomer in one pass
  const { data: appt, error: apptErr } = await supabaseAdmin
    .from("appointments")
    .select(`
      id,
      owner_id,
      service_snapshot_price,
      groomer_profile_id,
      groomer_profiles!inner(
        stripe_account_id,
        stripe_charges_enabled,
        deposit_type,
        deposit_percentage
      )
    `)
    .eq("id", input.appointmentId)
    .eq("owner_id", profileId)
    .single();

  if (apptErr || !appt) return { error: "Appointment not found." };

  const gp = Array.isArray(appt.groomer_profiles)
    ? appt.groomer_profiles[0]
    : appt.groomer_profiles;

  if (!gp?.stripe_account_id) {
    return { error: "This groomer hasn't connected their Stripe account yet." };
  }
  if (!gp.stripe_charges_enabled) {
    return { error: "This groomer's Stripe account isn't fully set up yet." };
  }

  const fullPricePence: number = appt.service_snapshot_price ?? 0;

  // Check for per-client deposit override (trusted client = no deposit)
  const { data: clientSettings } = await supabaseAdmin
    .from("client_settings")
    .select("deposit_override")
    .eq("groomer_profile_id", appt.groomer_profile_id)
    .eq("owner_id", profileId)
    .maybeSingle();

  // Determine charge amount — client override takes priority over groomer default
  let chargePence = fullPricePence;
  if (clientSettings?.deposit_override === "none") {
    // Trusted client — no upfront payment; they pay at the appointment
    return { clientSecret: null, amountPence: 0 };
  } else if (gp.deposit_type === "percentage" && gp.deposit_percentage) {
    chargePence = Math.round(fullPricePence * (gp.deposit_percentage / 100));
  }
  // 'full' → charge everything; 'none' (global) → still charge full for now
  // (Phase 2: 'none' global = pay at salon, skip PaymentIntent)

  const isDeposit = gp.deposit_type === "percentage";
  const platformFeePct = await resolvePlatformFeePct(appt.groomer_profile_id);
  const platformFeePence = calcPlatformFee(chargePence, platformFeePct);
  const groomerPayoutPence = calcGroomerPayout(chargePence, platformFeePct);

  // Check if a payment row already exists for this appointment
  const { data: existingPayment } = await supabaseAdmin
    .from("payments")
    .select("id, stripe_payment_intent_id, deposit_status")
    .eq("appointment_id", input.appointmentId)
    .maybeSingle();

  // If we already have an incomplete PaymentIntent, reuse it
  if (existingPayment?.stripe_payment_intent_id) {
    const existing = await stripe.paymentIntents.retrieve(
      existingPayment.stripe_payment_intent_id,
    );
    if (existing.status !== "succeeded" && existing.status !== "canceled") {
      const secret = existing.client_secret;
      if (!secret) return { error: "Payment intent has no client secret." };
      return { clientSecret: secret, amountPence: chargePence };
    }
  }

  // Create new PaymentIntent with destination charge
  const paymentIntent = await stripe.paymentIntents.create({
    amount: chargePence,
    currency: "gbp",
    application_fee_amount: platformFeePence,
    transfer_data: {
      destination: gp.stripe_account_id,
    },
    metadata: {
      appointment_id: input.appointmentId,
      owner_profile_id: profileId,
      groomer_profile_id: appt.groomer_profile_id,
      is_deposit: String(isDeposit),
      platform_fee_pct: String(platformFeePct),
    },
    description: `Groomr booking${isDeposit ? " deposit" : ""}`,
  });

  if (!paymentIntent.client_secret) {
    return { error: "Failed to create payment intent." };
  }

  // Persist payment row
  const paymentRow = {
    appointment_id: input.appointmentId,
    ...(isDeposit
      ? {
          stripe_payment_intent_id: paymentIntent.id,
          deposit_amount_pence: chargePence,
          deposit_status: "pending",
          full_amount_pence: fullPricePence,
        }
      : {
          full_payment_intent_id: paymentIntent.id,
          full_amount_pence: chargePence,
          deposit_status: "none",
        }),
    platform_fee_pence: platformFeePence,
    platform_fee_pct: platformFeePct,
    groomer_payout_amount_pence: groomerPayoutPence,
    payout_status: "pending",
    currency: "gbp",
  };

  if (existingPayment) {
    await supabaseAdmin
      .from("payments")
      .update(paymentRow)
      .eq("id", existingPayment.id);
  } else {
    await supabaseAdmin.from("payments").insert(paymentRow);
  }

  return { clientSecret: paymentIntent.client_secret, amountPence: chargePence };
}

// ---------------------------------------------------------------------------
// createGroupPaymentIntent
//
// Creates a single Stripe PaymentIntent for all appointments in a booking group.
// Sums prices, applies deposit/override logic, stores one payments row.
// ---------------------------------------------------------------------------

export async function createGroupPaymentIntent(
  bookingGroupId: string,
): Promise<{ clientSecret: string | null; amountPence: number } | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const profileId = await getProfileId(userId);
  if (!profileId) return { error: "Profile not found." };

  // Fetch all appointments in the group that belong to this owner
  const { data: appts, error: apptErr } = await supabaseAdmin
    .from("appointments")
    .select(`
      id,
      owner_id,
      groomer_profile_id,
      service_snapshot_price,
      groomer_profiles!inner(
        stripe_account_id,
        stripe_charges_enabled,
        deposit_type,
        deposit_percentage
      )
    `)
    .eq("booking_group_id", bookingGroupId)
    .eq("owner_id", profileId);

  if (apptErr || !appts || appts.length === 0) return { error: "Appointments not found." };

  const first = appts[0];
  const gp = Array.isArray(first.groomer_profiles) ? first.groomer_profiles[0] : first.groomer_profiles;

  if (!gp?.stripe_account_id) {
    return { error: "This groomer hasn't connected their Stripe account yet." };
  }
  if (!gp.stripe_charges_enabled) {
    return { error: "This groomer's Stripe account isn't fully set up yet." };
  }

  const fullPricePence = appts.reduce((sum, a) => sum + (a.service_snapshot_price ?? 0), 0);

  // Check per-client deposit override
  const { data: clientSettings } = await supabaseAdmin
    .from("client_settings")
    .select("deposit_override")
    .eq("groomer_profile_id", first.groomer_profile_id)
    .eq("owner_id", profileId)
    .maybeSingle();

  if (clientSettings?.deposit_override === "none") {
    return { clientSecret: null, amountPence: 0 };
  }

  let chargePence = fullPricePence;
  if (gp.deposit_type === "percentage" && gp.deposit_percentage) {
    chargePence = Math.round(fullPricePence * (gp.deposit_percentage / 100));
  }

  const isDeposit = gp.deposit_type === "percentage";
  const platformFeePct = await resolvePlatformFeePct(first.groomer_profile_id);
  const platformFeePence = calcPlatformFee(chargePence, platformFeePct);
  const groomerPayoutPence = calcGroomerPayout(chargePence, platformFeePct);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: chargePence,
    currency: "gbp",
    application_fee_amount: platformFeePence,
    transfer_data: { destination: gp.stripe_account_id },
    metadata: {
      booking_group_id: bookingGroupId,
      owner_profile_id: profileId,
      groomer_profile_id: first.groomer_profile_id,
      appointment_count: String(appts.length),
      is_deposit: String(isDeposit),
      platform_fee_pct: String(platformFeePct),
    },
    description: `Groomr group booking (${appts.length} pets)${isDeposit ? " deposit" : ""}`,
  });

  if (!paymentIntent.client_secret) return { error: "Failed to create payment intent." };

  // Store one payments row linked to the first appointment, with group metadata
  await supabaseAdmin.from("payments").insert({
    appointment_id: first.id,
    ...(isDeposit
      ? {
          stripe_payment_intent_id: paymentIntent.id,
          deposit_amount_pence: chargePence,
          deposit_status: "pending",
          full_amount_pence: fullPricePence,
        }
      : {
          full_payment_intent_id: paymentIntent.id,
          full_amount_pence: chargePence,
          deposit_status: "none",
        }),
    platform_fee_pence: platformFeePence,
    platform_fee_pct: platformFeePct,
    groomer_payout_amount_pence: groomerPayoutPence,
    payout_status: "pending",
    currency: "gbp",
  });

  return { clientSecret: paymentIntent.client_secret, amountPence: chargePence };
}

// ---------------------------------------------------------------------------
// initiateRefund
//
// Admin / system action. Refunds a payment and updates the payments row.
// ---------------------------------------------------------------------------

export async function initiateRefund(
  appointmentId: string,
  reason?: string,
): Promise<{ success: true } | { error: string }> {
  // Require admin check (simplified — production should verify is_admin)
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id, stripe_payment_intent_id, full_payment_intent_id, deposit_amount_pence, full_amount_pence, refund_status")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (!payment) return { error: "Payment record not found." };
  if (payment.refund_status !== "none" && payment.refund_status !== "approved") {
    return { error: "Refund already in progress or processed." };
  }

  const intentId = payment.stripe_payment_intent_id ?? payment.full_payment_intent_id;
  if (!intentId) return { error: "No Stripe payment intent found." };

  // Retrieve the PaymentIntent to get the charge ID
  const pi = await stripe.paymentIntents.retrieve(intentId);
  const chargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id;
  if (!chargeId) return { error: "No charge found on this payment intent." };

  const amountToRefund = payment.deposit_amount_pence ?? payment.full_amount_pence;

  try {
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: amountToRefund ?? undefined,
      reason: "requested_by_customer",
    });

    await supabaseAdmin
      .from("payments")
      .update({
        refund_status: "processed",
        refund_amount_pence: refund.amount,
        stripe_refund_id: refund.id,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    return { success: true };
  } catch (err) {
    console.error("[initiateRefund]", err);
    return { error: "Stripe refund failed. Please check the Stripe dashboard." };
  }
}
