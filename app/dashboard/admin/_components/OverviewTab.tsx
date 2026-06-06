"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import type { AdminOverviewStats, PlatformSettings } from "@/app/actions/admin";

function StatCard({
  label,
  value,
  sub,
  tone = "sage",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "gold" | "sage" | "terra" | "slate";
}) {
  const dot: Record<string, string> = {
    gold: "#eae45c",
    sage: "#88a096",
    terra: "#c87964",
    slate: "#2c3e50",
  };
  return (
    <div className="bg-white border border-pebble-grey/20 rounded-[14px] sm:rounded-[20px] p-3 sm:p-5">
      <div className="flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0"
          style={{ background: dot[tone] }}
        />
        <span className="text-[9px] sm:text-xs font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] text-pebble-grey leading-tight">
          {label}
        </span>
      </div>
      <p className="font-fredoka text-xl sm:text-3xl text-deep-slate mt-1.5 leading-none">{value}</p>
      <p className="text-[9px] sm:text-xs text-pebble-grey font-bold mt-1.5 leading-tight">{sub}</p>
    </div>
  );
}

function HealthDot({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: ok ? "#88a096" : "#c87964" }}
      />
      <span className="text-[10px] sm:text-xs font-bold text-deep-slate">{label}</span>
    </div>
  );
}

interface Props {
  stats: AdminOverviewStats | null;
  platformSettings: PlatformSettings | null;
}

export function OverviewTab({ stats, platformSettings }: Props) {
  if (!stats) {
    return (
      <div className="text-center py-12 text-pebble-grey font-bold">
        Could not load stats. Please refresh.
      </div>
    );
  }

  function gbp(pence: number) {
    return (pence / 100).toLocaleString("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    });
  }

  const integrations = platformSettings?.integrations;

  return (
    <section className="space-y-6">
      {/* Users */}
      <div>
        <Eyebrow className="mb-3">Users</Eyebrow>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <StatCard
            label="Total owners"
            value={stats.totalOwners.toLocaleString()}
            sub="registered accounts"
            tone="gold"
          />
          <StatCard
            label="Total groomers"
            value={stats.totalGroomers.toLocaleString()}
            sub={`${stats.listedGroomers} listed`}
            tone="sage"
          />
          <StatCard
            label="Total dogs"
            value={stats.totalDogs.toLocaleString()}
            sub="registered profiles"
            tone="slate"
          />
          <StatCard
            label="Unverified groomers"
            value={stats.unverifiedGroomers.toLocaleString()}
            sub="awaiting verification"
            tone={stats.unverifiedGroomers > 0 ? "terra" : "sage"}
          />
        </div>
      </div>

      {/* Bookings */}
      <div>
        <Eyebrow className="mb-3">Bookings</Eyebrow>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <StatCard
            label="Total appointments"
            value={stats.totalAppointments.toLocaleString()}
            sub="all time"
            tone="gold"
          />
          <StatCard
            label="Last 30 days"
            value={stats.appointmentsLast30Days.toLocaleString()}
            sub="appointments"
            tone="sage"
          />
          <StatCard
            label="Pending"
            value={stats.pendingAppointments.toLocaleString()}
            sub="awaiting confirmation"
            tone="slate"
          />
          <StatCard
            label="No shows"
            value={stats.noShowCount.toLocaleString()}
            sub="all time"
            tone={stats.noShowCount > 0 ? "terra" : "sage"}
          />
        </div>
      </div>

      {/* Financial */}
      <div>
        <Eyebrow className="mb-3">Financial</Eyebrow>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
          <StatCard
            label="Gross revenue"
            value={gbp(stats.grossRevenuePence)}
            sub="total payments collected"
            tone="gold"
          />
          <StatCard
            label="Groomr commission"
            value={gbp(stats.platformFeePence)}
            sub="platform fees earned"
            tone="sage"
          />
          <StatCard
            label="Groomer payouts"
            value={gbp(stats.groomerPayoutPence)}
            sub="paid out to groomers"
            tone="slate"
          />
        </div>
      </div>

      {/* Reviews */}
      <div>
        <Eyebrow className="mb-3">Reviews</Eyebrow>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
          <StatCard
            label="Total reviews"
            value={stats.totalReviews.toLocaleString()}
            sub="platform wide"
            tone="gold"
          />
          <StatCard
            label="Average rating"
            value={stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)} ★` : "—"}
            sub="across all groomers"
            tone="sage"
          />
          <StatCard
            label="Last 30 days"
            value={stats.reviewsLast30Days.toLocaleString()}
            sub="new reviews"
            tone="slate"
          />
        </div>
      </div>

      {/* Needs attention */}
      <div>
        <Eyebrow className="mb-3">Needs attention</Eyebrow>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-4">
          <StatCard
            label="Open disputes"
            value={stats.openDisputes.toLocaleString()}
            sub="requiring review"
            tone={stats.openDisputes > 0 ? "terra" : "sage"}
          />
          <StatCard
            label="Open support requests"
            value={stats.openSupportRequests.toLocaleString()}
            sub="awaiting reply"
            tone={stats.openSupportRequests > 0 ? "terra" : "sage"}
          />
        </div>
      </div>

      {/* Platform health */}
      {integrations && (
        <div>
          <Eyebrow className="mb-3">Platform health</Eyebrow>
          <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-4 sm:p-5">
            <div className="flex flex-wrap gap-x-6 gap-y-2.5">
              <HealthDot label="Stripe" ok={integrations.stripe} />
              <HealthDot label="Resend" ok={integrations.resend} />
              <HealthDot label="Twilio" ok={integrations.twilio} />
              <HealthDot label="Google Maps" ok={integrations.googleMaps} />
              <HealthDot label="Clerk" ok={integrations.clerk} />
              <HealthDot label="Supabase" ok={integrations.supabase} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
