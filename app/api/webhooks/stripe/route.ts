import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

// In Next.js App Router, req.text() already returns the raw body —
// no bodyParser config needed (that was Pages Router only).

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (err) {
    console.error(`[stripe-webhook] Handler error for ${event.type}:`, err);
    // Return 200 anyway — Stripe will retry on 4xx/5xx; handler errors shouldn't cause retries
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Event router
// ---------------------------------------------------------------------------

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    // ---- PaymentIntent events -----------------------------------------------
    case "payment_intent.succeeded":
      await onPaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;

    case "payment_intent.payment_failed":
      await onPaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    // ---- Connect account events ----------------------------------------------
    case "account.updated":
      await onAccountUpdated(event.data.object as Stripe.Account);
      break;

    // ---- Transfer / payout events -------------------------------------------
    case "transfer.created":
      await onTransferCreated(event.data.object as Stripe.Transfer);
      break;

    default:
      // Silently ignore events we don't handle
      break;
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function onPaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  // Tips have their own metadata type — handle separately
  if (pi.metadata?.type === "tip") {
    await supabaseAdmin
      .from("tips")
      .update({ status: "succeeded" })
      .eq("stripe_payment_intent_id", pi.id);
    console.log(`[stripe-webhook] tip payment_intent.succeeded → ${pi.id}`);
    return;
  }

  const appointmentId = pi.metadata?.appointment_id;
  if (!appointmentId) return;

  const isDeposit = pi.metadata?.is_deposit === "true";
  const now = new Date().toISOString();

  // Retrieve the Stripe processing fee from the balance transaction.
  // Webhook payloads don't expand latest_charge, so we fetch it separately.
  let stripeFee = 0;
  if (pi.latest_charge) {
    try {
      const charge = await stripe.charges.retrieve(pi.latest_charge as string, {
        expand: ["balance_transaction"],
      });
      if (typeof charge.balance_transaction === "object" && charge.balance_transaction) {
        stripeFee = charge.balance_transaction.fee;
      }
    } catch (err) {
      console.warn(`[stripe-webhook] Could not retrieve balance_transaction for ${pi.id}:`, err);
    }
  }

  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id, stripe_fee_pence")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (!payment) {
    console.warn(`[stripe-webhook] No payment row for appointment ${appointmentId}`);
    return;
  }

  if (isDeposit) {
    await supabaseAdmin
      .from("payments")
      .update({
        deposit_paid_at: now,
        deposit_status: "paid",
        // Accumulate fees: deposit fee added now, full payment fee added later
        stripe_fee_pence: (payment.stripe_fee_pence ?? 0) + stripeFee,
      })
      .eq("id", payment.id);
  } else {
    await supabaseAdmin
      .from("payments")
      .update({
        full_payment_paid_at: now,
        stripe_fee_pence: (payment.stripe_fee_pence ?? 0) + stripeFee,
      })
      .eq("id", payment.id);
  }

  console.log(
    `[stripe-webhook] payment_intent.succeeded → appointment ${appointmentId}`,
    `stripe_fee=${stripeFee}p`
  );
}

async function onPaymentIntentFailed(pi: Stripe.PaymentIntent) {
  if (pi.metadata?.type === "tip") {
    await supabaseAdmin
      .from("tips")
      .update({ status: "failed" })
      .eq("stripe_payment_intent_id", pi.id);
    console.warn(`[stripe-webhook] tip payment_intent.payment_failed → ${pi.id}`);
    return;
  }

  const appointmentId = pi.metadata?.appointment_id;
  if (!appointmentId) return;

  const isDeposit = pi.metadata?.is_deposit === "true";

  if (isDeposit) {
    await supabaseAdmin
      .from("payments")
      .update({ deposit_status: "failed" })
      .eq("appointment_id", appointmentId);
  }

  console.warn(`[stripe-webhook] payment_intent.payment_failed → appointment ${appointmentId}`);
}

async function onAccountUpdated(account: Stripe.Account) {
  // Sync charges_enabled / details_submitted to groomer_profiles
  const { data: groomer } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("stripe_account_id", account.id)
    .maybeSingle();

  if (!groomer) return;

  await supabaseAdmin
    .from("groomer_profiles")
    .update({
      stripe_charges_enabled: account.charges_enabled ?? false,
      stripe_details_submitted: account.details_submitted ?? false,
    })
    .eq("id", groomer.id);

  console.log(
    `[stripe-webhook] account.updated → groomer ${groomer.id}`,
    `charges_enabled=${account.charges_enabled}`,
  );
}

async function onTransferCreated(transfer: Stripe.Transfer) {
  // Transfers fire when funds move from Groomr platform → groomer's connected account.
  // Update the payments row with the transfer ID and mark payout as paid.
  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id")
    .or(
      `stripe_payment_intent_id.eq.${transfer.source_transaction},full_payment_intent_id.eq.${transfer.source_transaction}`,
    )
    .maybeSingle();

  if (!payment) return;

  await supabaseAdmin
    .from("payments")
    .update({
      stripe_transfer_id: transfer.id,
      payout_status: "paid",
      payout_initiated_at: new Date(transfer.created * 1000).toISOString(),
    })
    .eq("id", payment.id);

  console.log(`[stripe-webhook] transfer.created → payment ${payment.id}`);
}
