"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import type { AdminOverviewStats, PlatformSettings } from "@/app/actions/admin";

type Mode = "overview" | "user_management" | "groomr_management";

interface Props {
  stats: AdminOverviewStats | null;
  platformSettings: PlatformSettings | null;
  onNavigate: (mode: Mode, tab?: string) => void;
}

// ─── Stat cards ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  tone = "sage",
  onClick,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "gold" | "sage" | "terra" | "slate";
  onClick?: () => void;
}) {
  const dot: Record<string, string> = {
    gold: "#eae45c",
    sage: "#88a096",
    terra: "#c87964",
    slate: "#2c3e50",
  };
  const base = "bg-white border border-pebble-grey/20 rounded-[14px] sm:rounded-[20px] p-3 sm:p-5 text-left";
  const interactive = onClick
    ? "cursor-pointer hover:border-groomr-gold/60 hover:shadow-sm transition-all group"
    : "";

  const inner = (
    <>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0" style={{ background: dot[tone] }} />
        <span className="text-[9px] sm:text-xs font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] text-pebble-grey leading-tight">
          {label}
        </span>
      </div>
      <p className="font-fredoka text-xl sm:text-3xl text-deep-slate mt-1.5 leading-none">{value}</p>
      <p className="text-[9px] sm:text-xs text-pebble-grey font-bold mt-1.5 leading-tight">{sub}</p>
      {onClick && (
        <p className="text-[9px] sm:text-[10px] text-groomr-gold font-bold mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity leading-tight">
          View details →
        </p>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${interactive} w-full`}>
        {inner}
      </button>
    );
  }
  return <div className={base}>{inner}</div>;
}

// Split card: two values separated by a vertical divider (e.g. Last 30d | Next 30d)
function SplitStatCard({
  label,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  tone = "sage",
  onClick,
}: {
  label: string;
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  tone?: "gold" | "sage" | "terra" | "slate";
  onClick?: () => void;
}) {
  const dot: Record<string, string> = {
    gold: "#eae45c",
    sage: "#88a096",
    terra: "#c87964",
    slate: "#2c3e50",
  };
  const base = "bg-white border border-pebble-grey/20 rounded-[14px] sm:rounded-[20px] p-3 sm:p-5 text-left";
  const interactive = onClick
    ? "cursor-pointer hover:border-groomr-gold/60 hover:shadow-sm transition-all group"
    : "";

  const inner = (
    <>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0" style={{ background: dot[tone] }} />
        <span className="text-[9px] sm:text-xs font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] text-pebble-grey leading-tight">
          {label}
        </span>
      </div>
      <div className="flex items-stretch gap-0">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] sm:text-[10px] font-bold text-pebble-grey uppercase tracking-wider leading-tight mb-1">{leftLabel}</p>
          <p className="font-fredoka text-xl sm:text-2xl text-deep-slate leading-none">{leftValue}</p>
        </div>
        <div className="w-px bg-pebble-grey/20 mx-3 sm:mx-4 self-stretch" />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] sm:text-[10px] font-bold text-pebble-grey uppercase tracking-wider leading-tight mb-1">{rightLabel}</p>
          <p className="font-fredoka text-xl sm:text-2xl text-deep-slate leading-none">{rightValue}</p>
        </div>
      </div>
      {onClick && (
        <p className="text-[9px] sm:text-[10px] text-groomr-gold font-bold mt-2 opacity-0 group-hover:opacity-100 transition-opacity leading-tight">
          View details →
        </p>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${interactive} w-full`}>
        {inner}
      </button>
    );
  }
  return <div className={base}>{inner}</div>;
}

function HealthDot({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ok ? "#88a096" : "#c87964" }} />
      <span className="text-[10px] sm:text-xs font-bold text-deep-slate">{label}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function OverviewTab({ stats, platformSettings, onNavigate }: Props) {
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
  const replyRate = stats.totalReviews > 0
    ? Math.round((stats.reviewsWithReply / stats.totalReviews) * 100)
    : 0;
  const reviewRate = stats.completedAppointments > 0
    ? Math.round((stats.totalReviews / stats.completedAppointments) * 100)
    : 0;

  const goUsers = (tab: string) => () => onNavigate("user_management", tab);
  const goGroomr = (tab: string) => () => onNavigate("groomr_management", tab);

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
            onClick={goUsers("users")}
          />
          <StatCard
            label="Total groomers"
            value={stats.totalGroomers.toLocaleString()}
            sub={`${stats.listedGroomers} listed`}
            tone="sage"
            onClick={goUsers("groomers")}
          />
          <StatCard
            label="Total dogs"
            value={stats.totalDogs.toLocaleString()}
            sub="registered profiles"
            tone="slate"
            onClick={goUsers("users")}
          />
          <StatCard
            label="Unverified groomers"
            value={stats.unverifiedGroomers.toLocaleString()}
            sub="awaiting verification"
            tone={stats.unverifiedGroomers > 0 ? "terra" : "sage"}
            onClick={goUsers("groomers")}
          />
        </div>
      </div>

      {/* Bookings */}
      <div>
        <Eyebrow className="mb-3">Bookings</Eyebrow>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          <StatCard
            label="Total appointments"
            value={stats.totalAppointments.toLocaleString()}
            sub="all time"
            tone="gold"
            onClick={goUsers("appointments")}
          />
          <SplitStatCard
            label="30-day comparison"
            leftLabel="Last 30d"
            leftValue={stats.appointmentsLast30Days.toLocaleString()}
            rightLabel="Next 30d"
            rightValue={stats.appointmentsNext30Days.toLocaleString()}
            tone="sage"
            onClick={goUsers("appointments")}
          />
          <StatCard
            label="Confirmed"
            value={stats.confirmedAppointments.toLocaleString()}
            sub="upcoming bookings"
            tone="slate"
            onClick={goUsers("appointments")}
          />
          <StatCard
            label="Completed"
            value={stats.completedAppointments.toLocaleString()}
            sub="all time"
            tone="sage"
            onClick={goUsers("appointments")}
          />
          <StatCard
            label="No shows"
            value={stats.noShowCount.toLocaleString()}
            sub="all time"
            tone={stats.noShowCount > 0 ? "terra" : "sage"}
            onClick={goUsers("appointments")}
          />
        </div>
      </div>

      {/* Financial */}
      <div>
        <Eyebrow className="mb-3">Financial</Eyebrow>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <StatCard
            label="Gross revenue"
            value={gbp(stats.grossRevenuePence)}
            sub="total collected from owners"
            tone="gold"
            onClick={goGroomr("financials")}
          />
          <StatCard
            label="Groomr commission"
            value={gbp(stats.platformFeePence)}
            sub="platform fees earned"
            tone="sage"
            onClick={goGroomr("financials")}
          />
          <StatCard
            label="Net to groomers"
            value={gbp(stats.groomerPayoutPence)}
            sub="paid out to groomers"
            tone="slate"
            onClick={goGroomr("financials")}
          />
          <StatCard
            label="Pending payouts"
            value={gbp(stats.pendingPayoutsAmountPence)}
            sub="owed but not yet transferred"
            tone={stats.pendingPayoutsAmountPence > 0 ? "terra" : "sage"}
            onClick={goGroomr("financials")}
          />
        </div>
      </div>

      {/* Reviews */}
      <div>
        <Eyebrow className="mb-3">Reviews</Eyebrow>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
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
          <StatCard
            label="Groomer reply rate"
            value={stats.totalReviews > 0 ? `${replyRate}%` : "—"}
            sub="reviews with a groomer reply"
            tone={replyRate >= 70 ? "sage" : replyRate >= 40 ? "slate" : "terra"}
          />
          <StatCard
            label="Review rate"
            value={stats.completedAppointments > 0 ? `${reviewRate}%` : "—"}
            sub="completed appts that left a review"
            tone={reviewRate >= 50 ? "sage" : reviewRate >= 25 ? "slate" : "terra"}
          />
          <StatCard
            label="Below 3★ groomers"
            value={stats.groomersBelow3Star.toLocaleString()}
            sub="quality flag (with reviews)"
            tone={stats.groomersBelow3Star > 0 ? "terra" : "sage"}
            onClick={stats.groomersBelow3Star > 0 ? goUsers("groomers") : undefined}
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
            onClick={stats.openDisputes > 0 ? goUsers("disputes") : undefined}
          />
          <StatCard
            label="Open support requests"
            value={stats.openSupportRequests.toLocaleString()}
            sub="awaiting reply"
            tone={stats.openSupportRequests > 0 ? "terra" : "sage"}
            onClick={stats.openSupportRequests > 0 ? goUsers("support") : undefined}
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
