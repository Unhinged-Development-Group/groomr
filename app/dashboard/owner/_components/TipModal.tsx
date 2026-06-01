"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { getStripeClient } from "@/lib/stripe-client";
import { createTipPaymentIntent } from "@/app/actions/tips";
import { Modal } from "@/components/ui/Modal";
import type { Appointment } from "@/app/actions/appointments";

const stripePromise = getStripeClient();

const PRESETS = [
  { label: "£2", pence: 200 },
  { label: "£5", pence: 500 },
  { label: "£10", pence: 1000 },
];

// ─── Outer modal — amount selection ─────────────────────────────────────────

interface TipModalProps {
  appointment: Appointment;
  onClose: () => void;
  onTipSent: (appointmentId: string) => void;
}

export function TipModal({ appointment, onClose, onTipSent }: TipModalProps) {
  const [selectedPence, setSelectedPence] = useState<number | null>(null);
  const [customValue, setCustomValue] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groomerName = appointment.groomer_profiles?.business_name || "your groomer";

  function getAmountPence(): number | null {
    if (isCustom) {
      const val = parseFloat(customValue);
      if (isNaN(val) || val < 1 || val > 100) return null;
      return Math.round(val * 100);
    }
    return selectedPence;
  }

  async function handleContinue() {
    const amountPence = getAmountPence();
    if (!amountPence) return;

    setLoading(true);
    setError(null);

    const result = await createTipPaymentIntent(appointment.id, amountPence);

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setClientSecret(result.clientSecret);
  }

  // Once we have a client secret, show the payment step
  if (clientSecret) {
    const amountPence = getAmountPence()!;
    return (
      <Modal open onClose={onClose} size="md">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "flat",
              variables: {
                colorPrimary: "#2c3e50",
                colorBackground: "#ffffff",
                colorText: "#2c3e50",
                colorDanger: "#c87964",
                fontFamily: "Nunito, Helvetica, Arial, sans-serif",
                borderRadius: "10px",
              },
            },
          }}
        >
          <PaymentStep
            groomerName={groomerName}
            amountPence={amountPence}
            appointmentId={appointment.id}
            onBack={() => setClientSecret(null)}
            onClose={onClose}
            onTipSent={onTipSent}
          />
        </Elements>
      </Modal>
    );
  }

  const amountPence = getAmountPence();
  const customError =
    isCustom && customValue !== "" && (parseFloat(customValue) < 1 || parseFloat(customValue) > 100)
      ? "Enter an amount between £1 and £100."
      : null;

  return (
    <Modal open onClose={onClose} size="md">
      <div className="space-y-6">
        <div>
          <h2 className="font-fredoka text-2xl text-deep-slate">Leave a tip</h2>
          <p className="text-sm text-pebble-grey font-nunito mt-0.5">
            For {groomerName} · {appointment.service_snapshot_name || "Grooming"} for {appointment.dogs?.name}
          </p>
        </div>

        {/* Preset buttons */}
        <div>
          <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-3">
            Choose an amount
          </p>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p.pence}
                type="button"
                onClick={() => { setSelectedPence(p.pence); setIsCustom(false); setCustomValue(""); }}
                className={`px-5 py-2.5 rounded-full font-nunito font-bold text-sm border-2 transition-all focus-ring ${
                  !isCustom && selectedPence === p.pence
                    ? "bg-deep-slate text-white border-deep-slate"
                    : "bg-white text-deep-slate border-pebble-grey/30 hover:border-deep-slate"
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setIsCustom(true); setSelectedPence(null); }}
              className={`px-5 py-2.5 rounded-full font-nunito font-bold text-sm border-2 transition-all focus-ring ${
                isCustom
                  ? "bg-deep-slate text-white border-deep-slate"
                  : "bg-white text-deep-slate border-pebble-grey/30 hover:border-deep-slate"
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Custom input */}
        {isCustom && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
              Amount (£)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-nunito font-bold text-pebble-grey">£</span>
              <input
                type="number"
                min="1"
                max="100"
                step="0.01"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="0.00"
                className="field w-full pl-7"
                autoFocus
              />
            </div>
            {customError && (
              <p className="text-xs font-bold text-muted-terracotta">{customError}</p>
            )}
          </div>
        )}

        {/* Transparency note */}
        <div className="bg-sage-leaf/10 border border-sage-leaf/20 rounded-xl px-4 py-3">
          <p className="text-xs font-nunito text-deep-slate">
            <strong>100% of your tip goes directly to {groomerName}.</strong> Groomr takes no commission on tips.
          </p>
        </div>

        {error && (
          <p className="text-sm font-bold text-muted-terracotta">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary font-nunito font-bold py-3 rounded-full focus-ring"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={!amountPence || !!customError || loading}
            className="flex-1 btn-primary font-nunito font-bold py-3 rounded-full focus-ring disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Loading…" : amountPence ? `Continue — £${(amountPence / 100).toFixed(2)}` : "Continue"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Payment step — Stripe Elements card entry ────────────────────────────────

function PaymentStep({
  groomerName,
  amountPence,
  appointmentId,
  onBack,
  onClose,
  onTipSent,
}: {
  groomerName: string;
  amountPence: number;
  appointmentId: string;
  onBack: () => void;
  onClose: () => void;
  onTipSent: (appointmentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handlePay() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setError(submitErr.message ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    const { error: confirmErr } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    setSubmitting(false);

    if (confirmErr) {
      setError(confirmErr.message ?? "Payment failed. Please try again.");
      return;
    }

    setDone(true);
    setTimeout(() => {
      onTipSent(appointmentId);
      onClose();
    }, 1800);
  }

  if (done) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-16 h-16 bg-groomr-gold rounded-full flex items-center justify-center mx-auto text-3xl">
          🎉
        </div>
        <p className="font-fredoka text-2xl text-deep-slate">Tip sent!</p>
        <p className="text-sm text-pebble-grey font-nunito">
          {groomerName} will receive the full £{(amountPence / 100).toFixed(2)}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-bold text-pebble-grey hover:text-deep-slate transition-colors font-nunito focus-ring rounded-full px-2 py-1 mb-3"
        >
          ← Back
        </button>
        <h2 className="font-fredoka text-2xl text-deep-slate">Pay tip</h2>
        <p className="text-sm text-pebble-grey font-nunito mt-0.5">
          Sending <strong className="text-deep-slate">£{(amountPence / 100).toFixed(2)}</strong> to {groomerName}
        </p>
      </div>

      <PaymentElement />

      {error && (
        <p className="text-sm font-bold text-muted-terracotta">{error}</p>
      )}

      <button
        onClick={handlePay}
        disabled={submitting || !stripe || !elements}
        className="w-full btn-primary font-nunito font-bold py-3 rounded-full focus-ring disabled:opacity-60"
      >
        {submitting ? "Processing…" : `Send £${(amountPence / 100).toFixed(2)} tip`}
      </button>
    </div>
  );
}
