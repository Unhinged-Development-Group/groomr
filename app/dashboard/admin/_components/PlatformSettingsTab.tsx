"use client";

import { useState, useTransition } from "react";
import { Toast } from "@/components/ui/Toast";
import { adminSavePlatformSettings } from "@/app/actions/admin";
import type { PlatformSettings } from "@/app/actions/admin";

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
  const [search, setSearch] = useState("");

  const [feePercent, setFeePercent] = useState(
    settings ? (settings.platform_fee_pct * 100).toFixed(1) : "8.0"
  );
  const [incentiveBookings, setIncentiveBookings] = useState(
    settings ? String(settings.signup_incentive_bookings) : "150"
  );

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
      const bookings = parseInt(incentiveBookings, 10);

      if (isNaN(fee) || fee < 0 || fee > 100) {
        setToast("Platform fee must be between 0 and 100.");
        return;
      }
      if (isNaN(bookings) || bookings < 0 || bookings > 10000) {
        setToast("Incentive bookings must be between 0 and 10,000.");
        return;
      }

      const result = await adminSavePlatformSettings(settings.id, {
        platform_fee_pct: fee / 100,
        signup_incentive_bookings: bookings,
      });

      if ("error" in result) {
        setToast(result.error);
      } else {
        setDirty(false);
        setToast("Settings saved.");
      }
    });
  }

  const { integrations } = settings;

  // Derive label for groomers who have exhausted their incentive
  const parsedFee = parseFloat(feePercent);
  const standardFeeLabel = isNaN(parsedFee) ? "standard rate" : `${parsedFee.toFixed(1)}%`;

  const INTEGRATIONS: { key: keyof typeof integrations; label: string }[] = [
    { key: "stripe", label: "Stripe" },
    { key: "resend", label: "Resend" },
    { key: "twilio", label: "Twilio" },
    { key: "gocardless", label: "GoCardless" },
    { key: "googleMaps", label: "Google Maps" },
    { key: "cloudinary", label: "Cloudinary" },
    { key: "clerk", label: "Clerk" },
    { key: "supabase", label: "Supabase" },
  ];

  const filteredUsage = settings.incentive_usage.filter((g) =>
    (g.business_name ?? "Unnamed groomer")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6 max-w-xl">
        {/* Commission rates */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 space-y-5">
          <p className="text-[13px] font-bold text-deep-slate/60 uppercase tracking-wider">
            Commission rates
          </p>

          <div className="flex gap-10 flex-wrap">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-deep-slate" htmlFor="platform-fee">
                Standard platform fee
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="platform-fee"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={feePercent}
                  onChange={(e) => { setFeePercent(e.target.value); setDirty(true); }}
                  className="field w-24 text-right"
                />
                <span className="text-deep-slate font-bold">%</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-deep-slate" htmlFor="incentive-bookings">
                Commission-free allowance
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="incentive-bookings"
                  type="number"
                  min="0"
                  max="10000"
                  step="1"
                  value={incentiveBookings}
                  onChange={(e) => { setIncentiveBookings(e.target.value); setDirty(true); }}
                  className="field w-24 text-right"
                />
                <span className="text-deep-slate font-bold">bookings</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            {settings.updated_by_name ? (
              <p className="text-xs text-pebble-grey">
                Last saved by <strong>{settings.updated_by_name}</strong> on{" "}
                {formatDate(settings.updated_at)}
              </p>
            ) : (
              <span />
            )}
            <button
              onClick={handleSave}
              disabled={isPending || !dirty}
              className="btn-primary px-5 py-2 rounded-full text-sm focus-ring disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save settings"}
            </button>
          </div>
        </div>

        {/* Incentive usage */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-bold text-deep-slate/60 uppercase tracking-wider">
              Incentive usage
            </p>
            <span className="text-xs text-pebble-grey">
              {settings.incentive_usage.length} groomer{settings.incentive_usage.length !== 1 ? "s" : ""}
            </span>
          </div>

          {settings.incentive_usage.length > 4 && (
            <input
              type="text"
              placeholder="Search groomers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field w-full text-sm"
            />
          )}

          {settings.incentive_usage.length === 0 ? (
            <p className="text-sm text-pebble-grey">No groomers registered yet.</p>
          ) : filteredUsage.length === 0 ? (
            <p className="text-sm text-pebble-grey">No groomers match &quot;{search}&quot;.</p>
          ) : (
            <ul className="divide-y divide-pebble-grey/10 overflow-y-auto max-h-72 -mx-1 px-1 scrollbar-thin">
              {filteredUsage.map((g) => {
                const limit = settings.signup_incentive_bookings;
                const done = g.bookings_used >= limit;
                const pct = limit > 0 ? Math.min(100, (g.bookings_used / limit) * 100) : 100;
                const nearLimit = !done && pct >= 80;
                return (
                  <li key={g.id} className="flex items-center justify-between py-2.5 gap-3">
                    <span className="text-sm font-bold text-deep-slate truncate">
                      {g.business_name ?? "Unnamed groomer"}
                      {g.is_founding_groomer && (
                        <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-groomr-gold/30 text-deep-slate align-middle">
                          FOUNDING
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="w-20 h-1.5 rounded-full bg-pebble-grey/15 overflow-hidden hidden sm:block">
                        <span
                          className={`block h-full rounded-full transition-all ${
                            done
                              ? "bg-pebble-grey"
                              : nearLimit
                              ? "bg-muted-terracotta"
                              : "bg-groomr-gold"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          done
                            ? "bg-pebble-grey/15 text-pebble-grey"
                            : nearLimit
                            ? "bg-muted-terracotta/15 text-muted-terracotta"
                            : "bg-groomr-gold/25 text-deep-slate"
                        }`}
                      >
                        {done
                          ? `${limit}/${limit} — at ${standardFeeLabel}`
                          : `${g.bookings_used}/${limit} — free`}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Integration health */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 space-y-4">
          <p className="text-[13px] font-bold text-deep-slate/60 uppercase tracking-wider">
            Integration health
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {INTEGRATIONS.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between px-3 py-2.5 rounded-[12px] bg-alabaster-cream border border-pebble-grey/10"
              >
                <span className="text-sm font-bold text-deep-slate truncate">{label}</span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ml-2"
                  style={
                    integrations[key]
                      ? { background: "#dcfce7", color: "#15803d", borderColor: "#bbf7d0" }
                      : { background: "#fee2e2", color: "#b91c1c", borderColor: "#fecaca" }
                  }
                >
                  {integrations[key] ? "OK" : "Missing"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
