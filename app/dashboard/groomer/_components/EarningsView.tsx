"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { useState, useMemo } from "react";
import type { Payment } from "@/app/actions/groomer";

const GROOMR_COMMISSION_RATE = 0.08; // 8% — 0% for founding groomers for first 6 months

export function EarningsView({ payments: _payments, appointments = [] }: { payments: Payment[]; appointments?: any[] }) {
  const [range, setRange] = useState<"7d" | "30d" | "ytd" | "all">("all");

  const now = new Date();

  const { earned, upcoming, chartData } = useMemo(() => {
    const cutoff = (() => {
      if (range === "7d")  { const d = new Date(); d.setDate(d.getDate() - 7);           return d; }
      if (range === "30d") { const d = new Date(); d.setDate(d.getDate() - 30);          return d; }
      if (range === "ytd") { return new Date(new Date().getFullYear(), 0, 1); }
      return null;
    })();

    const active = appointments.filter(a => a.status !== "cancelled" && a.status !== "no_show");

    const earnedAppts = active.filter(a => {
      const d = new Date(a.scheduled_at);
      if (d > now) return false; // future = not yet earned
      return cutoff ? d >= cutoff : true;
    });

    const upcomingAppts = active.filter(a => {
      const d = new Date(a.scheduled_at);
      if (d <= now) return false;
      return cutoff ? d >= cutoff : true;
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
  }, [appointments, range, now]);

  const earnedGross     = earned.reduce((s, a) => s + (a.service_snapshot_price || 0), 0) / 100;
  const upcomingGross   = upcoming.reduce((s, a) => s + (a.service_snapshot_price || 0), 0) / 100;
  const totalGross      = earnedGross + upcomingGross;
  const totalBookings   = earned.length + upcoming.length;
  const avgValue        = totalBookings > 0 ? totalGross / totalBookings : 0;
  const earnedCommission   = earnedGross * GROOMR_COMMISSION_RATE;
  const upcomingCommission = upcomingGross * GROOMR_COMMISSION_RATE;
  const earnedNet       = earnedGross - earnedCommission;
  const upcomingNet     = upcomingGross - upcomingCommission;
  const nextPayout      = totalGross - (totalGross * GROOMR_COMMISSION_RATE);
  const maxVal          = chartData.length > 0 ? Math.max(...chartData.map(d => d[1])) : 100;

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
          <div className="flex flex-wrap gap-4 items-baseline justify-between">
            <div>
              <p className="font-fredoka text-5xl text-deep-slate leading-none">
                £{totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-pebble-grey font-bold mt-2">Total services booked</p>
            </div>
            <div className="flex gap-4 text-right items-end">
              <div>
                <p className="font-fredoka text-2xl text-deep-slate">{totalBookings}</p>
                <p className="text-xs font-bold text-pebble-grey mt-1">Bookings</p>
              </div>
              <div>
                <p className="font-fredoka text-2xl text-deep-slate">£{avgValue.toFixed(2)}</p>
                <p className="text-xs font-bold text-pebble-grey mt-1">Avg value</p>
              </div>
              <div className="bg-groomr-gold rounded-2xl px-4 py-2 text-center min-w-[110px]">
                <p className="font-fredoka text-2xl text-deep-slate leading-none">£{nextPayout.toFixed(2)}</p>
                <p className="text-[10px] font-bold text-deep-slate/70 mt-1 uppercase tracking-wide">Next payout</p>
              </div>
            </div>
          </div>

          {/* Commission breakdown */}
          <div className="bg-white border border-pebble-grey/20 rounded-2xl divide-y divide-pebble-grey/10 text-sm">
            {earned.length > 0 && (
              <>
                <div className="flex justify-between px-5 py-3">
                  <span className="text-pebble-grey font-bold flex items-center gap-2">
                    Completed / past bookings
                    <span className="text-[10px] font-bold bg-pebble-grey/15 text-pebble-grey px-2 py-0.5 rounded-full">{earned.length}</span>
                  </span>
                  <span className="font-fredoka text-deep-slate">£{earnedGross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between px-5 py-3">
                  <span className="text-pebble-grey font-bold flex items-center gap-2">
                    Groomr commission
                    <span className="text-[10px] font-bold bg-pebble-grey/15 text-pebble-grey px-2 py-0.5 rounded-full">{GROOMR_COMMISSION_RATE * 100}%</span>
                  </span>
                  <span className="font-fredoka text-muted-terracotta">−£{earnedCommission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between px-5 py-3 bg-alabaster-cream">
                  <span className="font-bold text-deep-slate">Earned payout</span>
                  <span className="font-fredoka text-deep-slate">£{earnedNet.toFixed(2)}</span>
                </div>
              </>
            )}
            {upcomingGross > 0 && (
              <>
                <div className="flex justify-between px-5 py-3">
                  <span className="text-pebble-grey font-bold flex items-center gap-2">
                    Upcoming bookings
                    <span className="text-[10px] font-bold bg-sage-leaf/15 text-sage-leaf px-2 py-0.5 rounded-full">{upcoming.length} confirmed</span>
                  </span>
                  <span className="font-fredoka text-deep-slate">£{upcomingGross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between px-5 py-3">
                  <span className="text-pebble-grey font-bold flex items-center gap-2">
                    Groomr commission
                    <span className="text-[10px] font-bold bg-pebble-grey/15 text-pebble-grey px-2 py-0.5 rounded-full">{GROOMR_COMMISSION_RATE * 100}%</span>
                  </span>
                  <span className="font-fredoka text-muted-terracotta">−£{upcomingCommission.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between px-5 py-3 bg-groomr-gold/20 rounded-b-2xl">
              <span className="font-bold text-deep-slate">Next payout</span>
              <span className="font-fredoka text-xl text-deep-slate">£{nextPayout.toFixed(2)}</span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64 flex items-end gap-2">
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
                      {isFuture ? "Upcoming" : a.status}
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
