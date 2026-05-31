"use client";

import { useState, useTransition } from "react";
import {
  createConnectOnboardingLink,
  createConnectDashboardLink,
} from "@/app/actions/stripe-connect";

interface Props {
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  stripeAccountId: string | null;
}

export function StripeConnectBanner({ chargesEnabled, detailsSubmitted, stripeAccountId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Fully set up — show a quiet link to Stripe Express dashboard
  if (chargesEnabled && detailsSubmitted) {
    return (
      <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-sage-leaf/10 border border-sage-leaf/20">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-sage-leaf shrink-0" />
          <p className="text-sm font-nunito font-bold text-deep-slate">
            Stripe payouts active
          </p>
          <span className="text-xs text-pebble-grey font-nunito">
            Earnings are transferred weekly to your bank account.
          </span>
        </div>
        <button
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await createConnectDashboardLink();
              if ("error" in res) { setError(res.error); return; }
              window.open(res.url, "_blank");
            });
          }}
          disabled={isPending}
          className="text-xs font-bold font-nunito text-sage-leaf hover:underline shrink-0 disabled:opacity-50"
        >
          {isPending ? "Opening…" : "View Stripe dashboard ↗"}
        </button>
        {error && <p className="text-xs text-muted-terracotta font-nunito">{error}</p>}
      </div>
    );
  }

  // Details submitted but not yet approved
  if (detailsSubmitted && !chargesEnabled) {
    return (
      <div className="px-4 py-3 rounded-xl bg-groomr-gold/10 border border-groomr-gold/30">
        <p className="text-sm font-bold font-nunito text-deep-slate mb-0.5">
          Stripe verification in progress
        </p>
        <p className="text-xs text-pebble-grey font-nunito">
          Stripe is reviewing your account. This usually takes a few minutes.
          You&apos;ll be able to accept payments once it&apos;s approved.
        </p>
        <button
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await createConnectOnboardingLink();
              if ("error" in res) { setError(res.error); return; }
              window.location.href = res.url;
            });
          }}
          disabled={isPending}
          className="mt-2 text-xs font-bold font-nunito text-deep-slate hover:underline disabled:opacity-50"
        >
          {isPending ? "Loading…" : "Continue setup →"}
        </button>
        {error && <p className="mt-1 text-xs text-muted-terracotta font-nunito">{error}</p>}
      </div>
    );
  }

  // Not started or incomplete — primary CTA
  return (
    <div className="px-4 py-4 rounded-xl bg-deep-slate text-white">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-fredoka text-lg leading-tight mb-1">
            Connect Stripe to accept payments
          </p>
          <p className="text-xs font-nunito text-white/70 leading-relaxed">
            Groomr uses Stripe to handle bookings securely. Set up takes about
            5 minutes — you&apos;ll need your bank details and ID.{" "}
            <span className="text-white/50">
              Groomr takes 8% per booking; the rest goes straight to your account.
            </span>
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await createConnectOnboardingLink();
              if ("error" in res) { setError(res.error); return; }
              window.location.href = res.url;
            });
          }}
          disabled={isPending}
          className="shrink-0 bg-groomr-gold text-deep-slate font-nunito font-bold text-sm px-4 py-2 rounded-full hover:bg-[#d4ce4a] transition-colors disabled:opacity-60"
        >
          {isPending ? "Loading…" : stripeAccountId ? "Continue setup" : "Connect Stripe"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-groomr-gold font-nunito">{error}</p>
      )}
    </div>
  );
}
