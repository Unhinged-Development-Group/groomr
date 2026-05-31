"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { useState, useMemo } from "react";
import { ChevronLeftIcon } from "@/components/ui/GroomrIcons";
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
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

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

    const active = appointments.filter(a => a.status !== "cancelled" && a.status !== "no_show");

    const earnedAppts = active.filter(a => {
      const d = new Date(a.scheduled_at);
      if (d > now) return false;
      return pastCutoff ? d >= pastCutoff : true;
    });

    // Upcoming always means "before the next payout" — consistent across all range views
    const upcomingAppts = active.filter(a => {
      const d = new Date(a.scheduled_at);
      return d > now && d < nextMonday;
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
  const completedAppts     = earned;
  const completedGross     = earnedGross;
  const earnedCommission   = earnedGross * GROOMR_COMMISSION_RATE;
  const upcomingCommission = upcomingGross * GROOMR_COMMISSION_RATE;
  const groomrFees         = 0;   // £0 in year 1; subscription fee applies from year 2
  const refunds            = 0;   // £0 unless a customer refund is being processed
  const totalNet           = totalGross - (totalGross * GROOMR_COMMISSION_RATE) - groomrFees - refunds;
  const maxVal             = chartData.length > 0 ? Math.max(...chartData.map(d => d[1])) : 100;

  // Processed payouts: past appointments in the selected range that predate the current
  // payout cycle — these have already been paid out to the groomer
  const processedAppts = earned.filter(a => new Date(a.scheduled_at) < lastMonday);
  const processedGross = processedAppts.reduce((s, a) => s + (a.service_snapshot_price || 0), 0) / 100;
  const processedNet   = processedGross * (1 - GROOMR_COMMISSION_RATE);

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
            <div className="flex items-end gap-6 flex-wrap">
              <div>
                <p className="font-fredoka text-4xl sm:text-5xl text-deep-slate leading-none">
                  £{totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-pebble-grey font-bold mt-1.5">Total services booked</p>
              </div>
              <div className="pb-0.5">
                <p className="font-fredoka text-2xl sm:text-3xl text-sage-leaf leading-none">
                  £{totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-pebble-grey font-bold mt-1.5 text-xs">After commission</p>
              </div>
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

            {/* Net earnings subtotal */}
            <div className="flex justify-between items-center px-5 py-3 bg-sage-leaf/8">
              <span className="font-bold text-deep-slate">Net earnings</span>
              <span className="font-fredoka text-xl text-sage-leaf">
                £{totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Payouts already processed */}
            <div className="flex justify-between items-center px-5 py-3">
              <span className="text-pebble-grey font-bold flex items-center gap-2">
                Payouts processed
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${processedAppts.length > 0 ? "bg-sage-leaf/15 text-sage-leaf" : "bg-pebble-grey/15 text-pebble-grey"}`}>
                  {processedAppts.length > 0 ? `${processedAppts.length} paid` : "None"}
                </span>
              </span>
              <span className={`font-fredoka ${processedAppts.length > 0 ? "text-sage-leaf" : "text-pebble-grey"}`}>
                £{processedNet.toFixed(2)}
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
            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-pebble-grey font-bold text-sm">
                No completed bookings for this period
              </div>
            ) : (
              <>
                {/* Bars — fixed height so percentage resolves correctly */}
                <div className="h-44 flex items-end gap-1.5">
                  {chartData.map((d, i) => {
                    const pct = d[1] / maxVal;
                    return (
                      <div
                        key={i}
                        className="relative flex-1 group rounded-t-lg overflow-visible"
                        style={{ height: `${Math.max(4, pct * 100)}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-groomr-gold/80 to-groomr-gold rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-deep-slate text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-10">
                          £{d[1].toFixed(0)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Labels — separate row so they don't affect bar heights */}
                <div className="flex gap-1.5">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-[10px] font-bold text-pebble-grey">{d[0]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Activity sidebar */}
        <aside className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 flex flex-col h-[500px]">
          {selectedActivity ? (() => {
            const a = selectedActivity;
            const isFuture = new Date(a.scheduled_at) > now;
            const gross = (a.service_snapshot_price || 0) / 100;
            const net = gross * (1 - GROOMR_COMMISSION_RATE);
            const duration = a.service_snapshot_duration as number | null;
            const dog = a.dogs as { name?: string; breed?: string; coat_type?: string } | null;
            const owner = a.profiles as { full_name?: string; email?: string; phone?: string } | null;
            const statusColour: Record<string, string> = {
              confirmed: "text-sage-leaf bg-sage-leaf/10",
              completed: "text-deep-slate bg-pebble-grey/10",
              pending: "text-groomr-gold bg-groomr-gold/20",
              no_show: "text-muted-terracotta bg-muted-terracotta/10",
            };
            return (
              <>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="flex items-center gap-1.5 text-xs font-bold text-pebble-grey hover:text-deep-slate transition-colors mb-4 focus-ring rounded-lg -ml-1 px-1 py-0.5 self-start"
                >
                  <ChevronLeftIcon size={14} />
                  Activity
                </button>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1">
                  <div>
                    <Eyebrow className="mb-1">Booking detail</Eyebrow>
                    <h3 className="font-fredoka text-lg text-deep-slate leading-tight">
                      {a.service_snapshot_name || "Appointment"}
                    </h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-[0.12em]">Date & time</p>
                      <p className="font-bold text-deep-slate">
                        {new Date(a.scheduled_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-pebble-grey text-xs">
                        {new Date(a.scheduled_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        {duration ? ` · ${duration} min` : ""}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-[0.12em]">Dog</p>
                      <p className="font-bold text-deep-slate">{dog?.name || "—"}</p>
                      {(dog?.breed || dog?.coat_type) && (
                        <p className="text-pebble-grey text-xs capitalize">{[dog.breed, dog.coat_type].filter(Boolean).join(" · ")}</p>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-[0.12em]">Client</p>
                      <p className="font-bold text-deep-slate">{owner?.full_name || "—"}</p>
                      {owner?.email && <p className="text-pebble-grey text-xs truncate">{owner.email}</p>}
                      {owner?.phone && <p className="text-pebble-grey text-xs">{owner.phone}</p>}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-[0.12em]">Earnings</p>
                      <p className="font-fredoka text-xl text-deep-slate leading-none">£{gross.toFixed(2)}</p>
                      <p className="text-pebble-grey text-xs">£{net.toFixed(2)} after commission</p>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full capitalize mt-1 ${isFuture ? "text-sage-leaf bg-sage-leaf/10" : a.status === "no_show" ? "text-muted-terracotta bg-muted-terracotta/10" : "text-deep-slate bg-pebble-grey/10"}`}>
                        {isFuture ? "Upcoming" : a.status === "no_show" ? "No show" : "Completed"}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            );
          })() : (
            <>
              <Eyebrow className="mb-4">Activity</Eyebrow>
              <div className="flex-1 overflow-y-auto space-y-1 pr-2 -mr-2">
                {activityList.length === 0 ? (
                  <p className="text-sm text-pebble-grey font-bold">No bookings in this period.</p>
                ) : activityList.map(a => {
                  const isFuture = new Date(a.scheduled_at) > now;
                  const price = (a.service_snapshot_price || 0) / 100;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedActivity(a)}
                      className="w-full text-left flex justify-between items-start text-sm rounded-xl px-3 py-3 transition-colors focus-ring hover:bg-alabaster-cream/60"
                    >
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
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
