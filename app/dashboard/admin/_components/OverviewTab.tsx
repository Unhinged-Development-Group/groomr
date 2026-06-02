"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import type { AdminOverviewStats } from "@/app/actions/admin";

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

export function OverviewTab({ stats }: { stats: AdminOverviewStats | null }) {
  if (!stats) {
    return (
      <div className="text-center py-12 text-pebble-grey font-bold">
        Could not load stats. Please refresh.
      </div>
    );
  }

  const grossRevenueGBP = (stats.grossRevenuePence / 100).toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  });

  return (
    <section className="space-y-6">
      <div>
        <Eyebrow className="mb-3">Platform snapshot</Eyebrow>
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
            tone="terra"
          />
        </div>
      </div>

      <div>
        <Eyebrow className="mb-3">Bookings & revenue</Eyebrow>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
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
            label="Gross revenue"
            value={grossRevenueGBP}
            sub="deposit payments collected"
            tone="slate"
          />
        </div>
      </div>

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
    </section>
  );
}
