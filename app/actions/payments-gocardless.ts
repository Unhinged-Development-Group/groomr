"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getProfileId } from "@/lib/auth-helpers";
import { resolvePlatformFeePct } from "@/lib/fees";
import { calcPlatformFee, calcGroomerPayout } from "@/lib/stripe";
import {
  createBillingRequest,
  createBillingRequestFlow,
  getBillingRequest,
  getGCPayment,
} from "@/lib/gocardless";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// createGCBillingRequest
// Single-appointment GoCardless payment. Returns the authorisation URL for the
// GC-hosted mandate/payment page.
// ---------------------------------------------------------------------------

export async function createGCBillingRequest(
  appointmentId: string,
): Promise<{ authorisationUrl: string; billingRequestId: string } | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const profileId = await getProfileId(userId);
  if (!profileId) return { error: "Profile not found." };

  const { data: appt } = await supabaseAdmin
    .from("appointments")
    .select(`
      id, owner_id, service_snapshot_price, groomer_profile_id,
      groomer_profiles!inner(deposit_type, deposit_percentage)
    `)
    .eq("id", appointmentId)
    .eq("owner_id", profileId)
    .single();

  if (!appt) return { error: "Appointment not found." };

  const gp = Array.isArray(appt.groomer_profiles)
    ? appt.groomer_profiles[0]
    : appt.groomer_profiles;

  const fullPricePence: number = appt.service_snapshot_price ?? 0;

  const { data: clientSettings } = await supabaseAdmin
    .from("client_settings")
    .select("deposit_override")
    .eq("groomer_profile_id", appt.groomer_profile_id)
    .eq("owner_id", profileId)
    .maybeSingle();

  if (clientSettings?.deposit_override === "none") {
    return { error: "No payment required for this booking." };
  }

  let chargePence = fullPricePence;
  if (gp?.deposit_type === "percentage" && gp.deposit_percentage) {
    chargePence = Math.round(fullPricePence * (gp.deposit_percentage / 100));
  }

  const isDeposit = gp?.deposit_type === "percentage";
  const platformFeePct = await resolvePlatformFeePct(appt.groomer_profile_id);
  const platformFeePence = calcPlatformFee(chargePence, platformFeePct);
  const groomerPayoutPence = calcGroomerPayout(chargePence, platformFeePct);

  // Reuse a still-pending billing request if one exists
  const { data: existingPayment } = await supabaseAdmin
    .from("payments")
    .select("id, gc_billing_request_id")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  let billingRequestId: string;

  if (existingPayment?.gc_billing_request_id) {
    try {
      const existing = await getBillingRequest(existingPayment.gc_billing_request_id);
      if (existing.status === "pending") {
        billingRequestId = existing.id;
      } else {
        const brq = await createBillingRequest({
          amountPence: chargePence,
          description: `Groomr booking${isDeposit ? " deposit" : ""}`,
          metadata: { appointment_id: appointmentId },
        });
        billingRequestId = brq.id;
        await supabaseAdmin
          .from("payments")
          .update({ gc_billing_request_id: billingRequestId })
          .eq("id", existingPayment.id);
      }
    } catch {
      const brq = await createBillingRequest({
        amountPence: chargePence,
        description: `Groomr booking${isDeposit ? " deposit" : ""}`,
        metadata: { appointment_id: appointmentId },
      });
      billingRequestId = brq.id;
    }
  } else {
    const brq = await createBillingRequest({
      amountPence: chargePence,
      description: `Groomr booking${isDeposit ? " deposit" : ""}`,
      metadata: { appointment_id: appointmentId },
    });
    billingRequestId = brq.id;

    const paymentRow = {
      appointment_id: appointmentId,
      payment_method: "gocardless",
      gc_billing_request_id: billingRequestId,
      ...(isDeposit
        ? {
            deposit_amount_pence: chargePence,
            deposit_status: "pending",
            full_amount_pence: fullPricePence,
          }
        : {
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
      await supabaseAdmin.from("payments").update(paymentRow).eq("id", existingPayment.id);
    } else {
      await supabaseAdmin.from("payments").insert(paymentRow);
    }
  }

  const flow = await createBillingRequestFlow({
    billingRequestId,
    redirectUri: `${APP_URL}/dashboard/owner?booking=confirmed`,
    exitUri: `${APP_URL}/dashboard/owner`,
  });

  return { authorisationUrl: flow.authorisation_url, billingRequestId };
}

// ---------------------------------------------------------------------------
// createGCGroupBillingRequest
// Group-booking variant — sums all appointment prices.
// ---------------------------------------------------------------------------

export async function createGCGroupBillingRequest(
  bookingGroupId: string,
): Promise<{ authorisationUrl: string; billingRequestId: string } | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const profileId = await getProfileId(userId);
  if (!profileId) return { error: "Profile not found." };

  const { data: appts } = await supabaseAdmin
    .from("appointments")
    .select(`
      id, owner_id, groomer_profile_id, service_snapshot_price,
      groomer_profiles!inner(deposit_type, deposit_percentage)
    `)
    .eq("booking_group_id", bookingGroupId)
    .eq("owner_id", profileId);

  if (!appts || appts.length === 0) return { error: "Appointments not found." };

  const first = appts[0];
  const gp = Array.isArray(first.groomer_profiles)
    ? first.groomer_profiles[0]
    : first.groomer_profiles;

  const { data: clientSettings } = await supabaseAdmin
    .from("client_settings")
    .select("deposit_override")
    .eq("groomer_profile_id", first.groomer_profile_id)
    .eq("owner_id", profileId)
    .maybeSingle();

  if (clientSettings?.deposit_override === "none") {
    return { error: "No payment required for this booking." };
  }

  const fullPricePence = appts.reduce((sum, a) => sum + (a.service_snapshot_price ?? 0), 0);
  let chargePence = fullPricePence;
  if (gp?.deposit_type === "percentage" && gp.deposit_percentage) {
    chargePence = Math.round(fullPricePence * (gp.deposit_percentage / 100));
  }

  const isDeposit = gp?.deposit_type === "percentage";
  const platformFeePct = await resolvePlatformFeePct(first.groomer_profile_id);
  const platformFeePence = calcPlatformFee(chargePence, platformFeePct);
  const groomerPayoutPence = calcGroomerPayout(chargePence, platformFeePct);

  const brq = await createBillingRequest({
    amountPence: chargePence,
    description: `Groomr group booking (${appts.length} pets)${isDeposit ? " deposit" : ""}`,
    metadata: { booking_group_id: bookingGroupId },
  });

  await supabaseAdmin.from("payments").insert({
    appointment_id: first.id,
    payment_method: "gocardless",
    gc_billing_request_id: brq.id,
    ...(isDeposit
      ? {
          deposit_amount_pence: chargePence,
          deposit_status: "pending",
          full_amount_pence: fullPricePence,
        }
      : {
          full_amount_pence: chargePence,
          deposit_status: "none",
        }),
    platform_fee_pence: platformFeePence,
    platform_fee_pct: platformFeePct,
    groomer_payout_amount_pence: groomerPayoutPence,
    payout_status: "pending",
    currency: "gbp",
  });

  const flow = await createBillingRequestFlow({
    billingRequestId: brq.id,
    redirectUri: `${APP_URL}/dashboard/owner?booking=confirmed`,
    exitUri: `${APP_URL}/dashboard/owner`,
  });

  return { authorisationUrl: flow.authorisation_url, billingRequestId: brq.id };
}

// ---------------------------------------------------------------------------
// syncGCPayment
// Called from the owner dashboard on return from GoCardless to update the
// payments row with the mandate/payment IDs GC created during fulfilment.
// ---------------------------------------------------------------------------

export async function syncGCPayment(
  billingRequestId: string,
): Promise<{ status: string } | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id")
    .eq("gc_billing_request_id", billingRequestId)
    .maybeSingle();

  if (!payment) return { error: "Payment record not found." };

  try {
    const brq = await getBillingRequest(billingRequestId);
    const updates: Record<string, unknown> = {};

    if (brq.links?.mandate) updates.gc_mandate_id = brq.links.mandate;
    if (brq.links?.payment) {
      updates.gc_payment_id = brq.links.payment;
      const gcPayment = await getGCPayment(brq.links.payment);
      if (gcPayment.status === "confirmed" || gcPayment.status === "paid_out") {
        updates.deposit_status = "paid";
        updates.deposit_paid_at = new Date().toISOString();
      }
    }

    if (Object.keys(updates).length > 0) {
      await supabaseAdmin.from("payments").update(updates).eq("id", payment.id);
    }

    return { status: brq.status };
  } catch (err) {
    console.error("[syncGCPayment]", err);
    return { error: "Failed to sync payment status." };
  }
}
