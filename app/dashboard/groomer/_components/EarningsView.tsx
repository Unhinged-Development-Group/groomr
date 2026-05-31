"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { useState, useMemo } from "react";
import type { Payment } from "@/app/actions/groomer";

const GROOMR_COMMISSION_RATE = 0.08; // 8% — 0% for founding groomers for first 6 months

function getPayoutWindow(now: Date): { lastMonday: Date; nextMonday: Date } {
  const day = now.getDay(); // 0=Sun … 6=Sat
  const daysToLastMonday = day === 0 ? 6 : day - 1;
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - daysToLastMonday);
  lastMonday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(lastMonday);
  nextMonday.setDate(lastMonday.getDate() + 7);
  return { lastMonday, nextMonday };
}

export function EarningsView({ payments: _payments, appointments = [] }: { payments: Payment[]; appointments?: any[] }) {
  const [range, setRange] = useState<"7d" | "30d" | "ytd" | "all">("all");

  const now = new Date();
  const { lastMonday, nextMonday } = getPayoutWindow(now);

  // Current payout cycle: completed/past appointments since last Monday
  const payoutCycleAppts = appointments.filter(a => {
    if (a.status === "cancelled" || a.status === "no_show") return false;
    const d = new Date(a.scheduled_at);
    return d >= lastMonday && d < nextMonday && d <= now;
  });
  const payoutCycleGross = payoutCycleAppts.reduce((s, a) => s + (a.service_snapshot_price || 0), 0) / 100;
  const payoutCycleNet = payoutCycleGross * (1 - GROOMR_COMMISSION_RATE);
  const nextPayoutDate = nextMonday.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  const { earned, upcoming, chartData } = useMemo(() => {
    const pastCutoff = (() => {
      if (range === "7d")  { const d = new Date(); d.setDate(d.getDate() - 7);  return d; }
      if (range === "30d") { const d = new Date(); d.setDate(d.getDate() - 30); return d; }
      if (range === "ytd") { return new Date(new Date().getFullYear(), 0, 1); }
      return null;
    })();

    const futureCutoff = (() => {
      if (range === "7d" || range === "30d") return now; // backward-looking only
      if (range === "ytd") { return new Date(new Date().getFullYear(), 11, 31, 23, 59, 59); }
      return null;
    })();

    const active = appointments.filter(a => a.status !== "cancelled" && a.status !== "no_show");

    const earnedAppts = active.filter(a => {
      const d = new Date(a.scheduled_at);
      if (d > now) return false;
      return pastCutoff ? d >= pastCutoff : true;
    });

    const upcomingAppts = active.filter(a => {
      const d = new Date(a.scheduled_at);
      if (d <= now) return false;
      return futureCutoff ? d <= futureCutoff : true;
    });

    // Chart: group earned by day (7d/30d) or month (ytd/all)
    const grouped = new Map<string, number>();
    earnedAppts.forEach(a => {
      const d = new Date(a.scheduled_at);
      const key = (range === "7d" || range === "30d")
        ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
        : d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      grouped.set(key, (grouped.get(key) || 0) + (a.service_snapshot_price || 0) / 100);
    });

    const seriesData = Array.from(grouped.entries()).sort((a, b) => {
      // Sort chronologically by parsing the first appointment date with that key
      const da = earnedAppts.find(ap => {
        const d = new Date(ap.scheduled_at);
        const k = (range === "7d" || range === "30d")
          ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
          : d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
        return k === a[0];
      });
      const db = earnedAppts.find(ap => {
        const d = new Date(ap.scheduled_at);
        const k = (range === "7d" || range === "30d")
          ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
          : d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
        return k === b[0];
      });
      return new Date(da?.scheduled_at ?? 0).getTime() - new Date(db?.scheduled_at ?? 0).getTime();
    });

    return { earned: earnedAppts, upcoming: upcomingAppts, chartData: seriesData };
  }, [appointments, range]); // eslint-disable-line react-hooks/exhaustive-deps

  const earnedGross     = earned.reduce((s, a) => s + (a.service_snapshot_price || 0), 0) / 100;
  const upcomingGross   = upcoming.reduce((s, a) => s + (a.service_snapshot_price || 0), 0) / 100;
  const totalGross      = earnedGross + upcomingGross;
  const totalBookings   = earned.length + upcoming.length;
  const avgValue        = totalBookings > 0 ? totalGross / totalBookings : 0;
  const completedAppts     = earned; // all past non-cancelled appointments count as completed
  const completedGross     = earnedGross;
  const earnedCommission   = earnedGross * GROOMR_COMMISSION_RATE;
  const upcomingCommission = upcomingGross * GROOMR_COMMISSION_RATE;
  const earnedNet          = earnedGross - earnedCommission;
  const upcomingNet        = upcomingGross - upcomingCommission;
  const groomrFees         = 0;   // £0 in year 1; subscription fee applies from year 2
  const refunds            = 0;   // £0 unless a customer refund is being processed
  const maxVal             = chartData.length > 0 ? Math.max(...chartData.map(d => d[1])) : 100;

  // Activity list: upcoming first (soonest), then past (most recent)
  const activityList = [
    ...upcoming.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    ...earned.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()),
  ].slice(0, 20);

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Eyebrow>Earnings</Eyebrow>
          <h2 className="font-fredoka text-2xl text-deep-slate mt-1">Payment overview</h2>
        </div>
        <div className="flex items-center gap-2 bg-white border border-pebble-grey/20 rounded-full p-1.5">
          {([["7d","Last 7d"],["30d","Last 30d"],["ytd","YTD"],["all","All time"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setRange(k)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors focus-ring ${range === k ? "bg-deep-slate text-alabaster-cream" : "text-deep-slate hover:bg-pebble-grey/10"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          {/* Headline */}
          <div className="space-y-3">
            <div>
              <p className="font-fredoka text-4xl sm:text-5xl text-deep-slate leading-none">
                £{totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-pebble-grey font-bold mt-1.5">Total services booked</p>
            </div>
            {/* Key metrics strip — spans to match the breakdown card below */}
            <div className="bg-white border border-pebble-grey/20 rounded-2xl grid grid-cols-3 divide-x divide-pebble-grey/10">
              <div className="px-4 sm:px-6 py-4">
                <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-[0.12em]">Bookings</p>
                <p className="font-fredoka text-2xl sm:text-3xl text-deep-slate mt-1 leading-none">{totalBookings}</p>
              </div>
              <div className="px-4 sm:px-6 py-4">
                <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-[0.12em]">Avg value</p>
                <p className="font-fredoka text-2xl sm:text-3xl text-deep-slate mt-1 leading-none">£{avgValue.toFixed(2)}</p>
              </div>
              <div className="px-4 sm:px-6 py-4 bg-groomr-gold/15 rounded-r-2xl">
                <p className="text-[10px] font-bold text-deep-slate/60 uppercase tracking-[0.12em] whitespace-nowrap">Payout {nextPayoutDate}</p>
                <p className="font-fredoka text-2xl sm:text-3xl text-deep-slate mt-1 leading-none">£{payoutCycleNet.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Full breakdown */}
          <div className="bg-white border border-pebble-grey/20 rounded-2xl divide-y divide-pebble-grey/10 text-sm">

            {/* Completed bookings */}
            <div className="flex justify-between px-5 py-3">
              <span className="text-pebble-grey font-bold flex items-center gap-2">
                Completed bookings
                <span className="text-[10px] font-bold bg-pebble-grey/15 text-pebble-grey px-2 py-0.5 rounded-full">{completedAppts.length}</span>
              </span>
              <span className="font-fredoka text-deep-slate">£{completedGross.toFixed(2)}</span>
            </div>

            {/* Upcoming bookings */}
            <div className="flex justify-between px-5 py-3">
              <span className="text-pebble-grey font-bold flex items-center gap-2">
                Upcoming bookings
                <span className="text-[10px] font-bold bg-sage-leaf/15 text-sage-leaf px-2 py-0.5 rounded-full">{upcoming.length} confirmed</span>
              </span>
              <span className="font-fredoka text-deep-slate">£{upcomingGross.toFixed(2)}</span>
            </div>

            {/* Groomr commission */}
            <div className="flex justify-between px-5 py-3">
              <span className="text-pebble-grey font-bold flex items-center gap-2">
                Groomr commission
                <span className="text-[10px] font-bold bg-pebble-grey/15 text-pebble-grey px-2 py-0.5 rounded-full">{GROOMR_COMMISSION_RATE * 100}%</span>
              </span>
              <span className="font-fredoka text-muted-terracotta">−£{(totalGross * GROOMR_COMMISSION_RATE).toFixed(2)}</span>
            </div>

            {/* Groomr fees */}
            <div className="flex justify-between px-5 py-3">
              <span className="text-pebble-grey font-bold">
                Groomr fees
              </span>
              <span className="font-fredoka text-muted-terracotta">−£{groomrFees.toFixed(2)}</span>
            </div>

            {/* Refunds */}
            <div className="flex justify-between px-5 py-3">
              <span className="text-pebble-grey font-bold flex items-center gap-2">
                Refunds
                {refunds > 0
                  ? <span className="text-[10px] font-bold bg-muted-terracotta/15 text-muted-terracotta px-2 py-0.5 rounded-full">Processing</span>
                  : <span className="text-[10px] font-bold bg-pebble-grey/15 text-pebble-grey px-2 py-0.5 rounded-full">None</span>
                }
              </span>
              <span className="font-fredoka text-muted-terracotta">
                {refunds > 0 ? `−£${refunds.toFixed(2)}` : "−£0.00"}
              </span>
            </div>

            {/* Next payout total */}
            <div className="flex justify-between items-center px-5 py-4 bg-groomr-gold/20 rounded-b-2xl">
              <div>
                <span className="font-bold text-deep-slate text-base">Next payout</span>
                <p className="text-xs text-deep-slate/60 font-bold mt-0.5">Due {nextPayoutDate} · this week&apos;s earnings</p>
              </div>
              <span className="font-fredoka text-2xl text-deep-slate">£{payoutCycleNet.toFixed(2)}</span>
            </div>
          </div>

          {/* Chart */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-pebble-grey uppercase tracking-[0.12em]">
              Earnings — {range === "7d" ? "last 7 days" : range === "30d" ? "last 30 days" : range === "ytd" ? "year to date" : "all time"}
            </p>
          <div className="h-56 flex items-end gap-2">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-pebble-grey font-bold text-sm">
                No completed bookings for this period
              </div>
            ) : chartData.map((d, i) => {
              const pct = d[1] / maxVal;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full bg-pebble-grey/10 rounded-t-lg relative transition-colors group-hover:bg-pebble-grey/20"
                    style={{ height: `${Math.max(5, pct * 100)}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-groomr-gold/80 to-groomr-gold rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-deep-slate text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap">
                      £{d[1].toFixed(0)}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-pebble-grey">{d[0]}</span>
                </div>
              );
            })}
          </div>
          </div>
        </section>

        {/* Activity sidebar */}
        <aside className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 flex flex-col h-[500px]">
          <Eyebrow className="mb-4">Activity</Eyebrow>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
            {activityList.length === 0 ? (
              <p className="text-sm text-pebble-grey font-bold">No bookings in this period.</p>
            ) : activityList.map(a => {
              const isFuture = new Date(a.scheduled_at) > now;
              const price = (a.service_snapshot_price || 0) / 100;
              return (
                <div key={a.id} className="flex justify-between items-start text-sm border-b border-pebble-grey/10 pb-4 last:border-0 last:pb-0">
                  <div className="min-w-0 pr-3">
                    <p className="font-bold text-deep-slate truncate">{a.service_snapshot_name || "Appointment"}</p>
                    <p className="text-xs text-pebble-grey mt-0.5">
                      {new Date(a.scheduled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      {a.dogs?.name ? ` · ${a.dogs.name}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold ${isFuture ? "text-sage-leaf" : "text-deep-slate"}`}>
                      +£{price.toFixed(0)}
                    </p>
                    <p className={`text-[10px] uppercase tracking-wide font-bold mt-0.5 ${isFuture ? "text-sage-leaf/70" : "text-pebble-grey"}`}>
                      {isFuture ? "Upcoming" : "Completed"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
