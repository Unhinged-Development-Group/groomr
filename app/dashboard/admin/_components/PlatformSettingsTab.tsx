"use client";

import { useState, useTransition } from "react";
import { Toast } from "@/components/ui/Toast";
import { adminSavePlatformSettings } from "@/app/actions/admin";
import type { PlatformSettings } from "@/app/actions/admin";

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  settings: PlatformSettings | null;
  loadError: string | null;
}

export function PlatformSettingsTab({ settings, loadError }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);

  // Form state (percentage display: 0.08 → "8.0")
  const [feePercent, setFeePercent] = useState(
    settings ? (settings.platform_fee_pct * 100).toFixed(1) : "8.0"
  );
  const [foundingFeePercent, setFoundingFeePercent] = useState(
    settings ? (settings.founding_groomer_fee_pct * 100).toFixed(1) : "0.0"
  );
  const [deadline, setDeadline] = useState(settings?.founding_groomer_deadline ?? "");

  if (!settings) {
    return (
      <div className="py-12 text-center space-y-2">
        <p className="text-pebble-grey font-bold">Failed to load platform settings.</p>
        {loadError && (
          <p className="text-xs text-muted-terracotta font-mono bg-muted-terracotta/10 px-3 py-2 rounded-lg inline-block">
            {loadError}
          </p>
        )}
      </div>
    );
  }

  function handleSave() {
    if (!settings) return;
    startTransition(async () => {
      const fee = parseFloat(feePercent);
      const foundingFee = parseFloat(foundingFeePercent);

      if (isNaN(fee) || fee < 0 || fee > 100) {
        setToast("Platform fee must be between 0 and 100.");
        return;
      }
      if (isNaN(foundingFee) || foundingFee < 0 || foundingFee > 100) {
        setToast("Founding groomer fee must be between 0 and 100.");
        return;
      }

      const result = await adminSavePlatformSettings(settings.id, {
        platform_fee_pct: fee / 100,
        founding_groomer_fee_pct: foundingFee / 100,
        founding_groomer_deadline: deadline.trim() || null,
      });

      if ("error" in result) {
        setToast(result.error);
      } else {
        setDirty(false);
        setToast("Platform settings saved.");
      }
    });
  }

  const { integrations } = settings;

  const INTEGRATIONS: { key: keyof typeof integrations; label: string }[] = [
    { key: "stripe", label: "Stripe" },
    { key: "resend", label: "Resend" },
    { key: "twilio", label: "Twilio" },
    { key: "googleMaps", label: "Google Maps" },
    { key: "clerk", label: "Clerk" },
    { key: "supabase", label: "Supabase" },
  ];

  return (
    <>
      <div className="space-y-6 max-w-xl">
        {/* Commission rates */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 space-y-5">
          <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
            Commission rates
          </p>

          <div className="space-y-1">
            <label className="text-sm font-bold text-deep-slate" htmlFor="platform-fee">
              Standard platform fee
            </label>
            <p className="text-xs text-pebble-grey">
              Applied to all bookings. Currently stored in Stripe Connect as the application fee.
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                id="platform-fee"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={feePercent}
                onChange={(e) => { setFeePercent(e.target.value); setDirty(true); }}
                className="field w-28 text-right"
              />
              <span className="text-deep-slate font-bold">%</span>
              <span className="text-xs text-pebble-grey ml-2">
                (currently{" "}
                <strong>
                  {(settings.platform_fee_pct * 100).toFixed(1)}%
                </strong>{" "}
                in DB)
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-deep-slate" htmlFor="founding-fee">
              Founding groomer fee
            </label>
            <p className="text-xs text-pebble-grey">
              Rate applied to groomers with <code className="text-xs bg-alabaster-cream px-1 rounded">is_founding_groomer = true</code>.
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                id="founding-fee"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={foundingFeePercent}
                onChange={(e) => { setFoundingFeePercent(e.target.value); setDirty(true); }}
                className="field w-28 text-right"
              />
              <span className="text-deep-slate font-bold">%</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-deep-slate" htmlFor="founding-deadline">
              Founding groomer deadline
            </label>
            <p className="text-xs text-pebble-grey">
              Date when founding groomer rate expires. Leave blank for no deadline.
            </p>
            <input
              id="founding-deadline"
              type="date"
              value={deadline}
              onChange={(e) => { setDeadline(e.target.value); setDirty(true); }}
              className="field mt-1.5"
            />
          </div>

          <div className="flex items-center justify-between pt-1 flex-wrap gap-3">
            {settings.updated_by_name && (
              <p className="text-xs text-pebble-grey">
                Last saved by <strong>{settings.updated_by_name}</strong> on{" "}
                {formatDate(settings.updated_at)}
              </p>
            )}
            <button
              onClick={handleSave}
              disabled={isPending || !dirty}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save settings"}
            </button>
          </div>
        </div>

        {/* Founding groomers — 0% period end dates */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
              Founding groomers
            </p>
            <p className="text-xs text-pebble-grey mt-1">
              When each groomer&apos;s founding rate ends and standard commission kicks in.
              Edit individual dates via Groomers → Edit → Business basics.
            </p>
          </div>
          {settings.founding_groomers.length === 0 ? (
            <p className="text-sm text-pebble-grey">No founding groomers yet.</p>
          ) : (
            <ul className="divide-y divide-pebble-grey/10">
              {settings.founding_groomers.map((g) => {
                const ends = g.founding_until ?? settings.founding_groomer_deadline;
                const expired = !!ends && ends < new Date().toISOString().slice(0, 10);
                return (
                  <li key={g.id} className="flex items-center justify-between py-2 gap-3">
                    <span className="text-sm font-bold text-deep-slate truncate">
                      {g.business_name ?? "Unnamed groomer"}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        expired
                          ? "bg-pebble-grey/15 text-pebble-grey"
                          : "bg-groomr-gold/25 text-deep-slate"
                      }`}
                    >
                      {ends
                        ? expired
                          ? `Expired ${formatDay(ends)} — standard rate`
                          : `0% until ${formatDay(ends)}`
                        : "No end date"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Integration health */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
              Integration health
            </p>
            <p className="text-xs text-pebble-grey mt-1">
              Based on whether environment variables are set in this process. Update via Vercel Dashboard → Settings → Environment Variables.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {INTEGRATIONS.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between px-3 py-2.5 rounded-[12px] bg-alabaster-cream border border-pebble-grey/10"
              >
                <span className="text-sm font-bold text-deep-slate">{label}</span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
                  style={integrations[key]
                    ? { background: "#dcfce7", color: "#15803d", borderColor: "#bbf7d0" }
                    : { background: "#fee2e2", color: "#b91c1c", borderColor: "#fecaca" }}
                >
                  {integrations[key] ? "OK" : "Missing"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Info note */}
        <p className="text-xs text-pebble-grey leading-relaxed">
          Rates saved here apply to new payments immediately — the Stripe payment flow reads them
          from the database at charge time. Founding groomers pay the founding rate until their
          individual end date passes, then the standard rate applies automatically.
        </p>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
