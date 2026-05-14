"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { useState, useMemo } from "react";
import type { Payment } from "@/app/actions/groomer";

interface StatCardProps { label: string; value: string | number; sub: string; tone?: "gold" | "sage" | "terra" | "slate" }

function StatCard({ label, value, sub, tone = "sage" }: StatCardProps) {
  const dot: Record<string, string> = { gold: "#eae45c", sage: "#88a096", terra: "#c87964", slate: "#2c3e50" };
  return (
    <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: dot[tone] }} />
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-pebble-grey">{label}</span>
      </div>
      <p className="font-fredoka text-3xl text-deep-slate mt-2 leading-none">{value}</p>
      <p className="text-xs text-pebble-grey font-bold mt-2">{sub}</p>
    </div>
  );
}

export function EarningsView({ payments, appointments = [] }: { payments: Payment[]; appointments?: any[] }) {
  const [range, setRange] = useState<"7d"|"30d"|"ytd" | "all">("all");

  const now = new Date();
  const upcomingAppointments = appointments.filter(a =>
    a.status === "confirmed" && new Date(a.scheduled_at) > now
  );
  const upcomingRevenue = upcomingAppointments.reduce((sum, a) => sum + (a.service_snapshot_price || 0), 0) / 100;

  const { totalRevenue, totalBookings, chartData, recentHistory } = useMemo(() => {
    const now = new Date();
    let filteredPayments = payments;

    if (range === "7d") {
      const d = new Date(); d.setDate(d.getDate() - 7);
      filteredPayments = payments.filter(p => new Date(p.date) >= d);
    } else if (range === "30d") {
      const d = new Date(); d.setDate(d.getDate() - 30);
      filteredPayments = payments.filter(p => new Date(p.date) >= d);
    } else if (range === "ytd") {
      const d = new Date(now.getFullYear(), 0, 1);
      filteredPayments = payments.filter(p => new Date(p.date) >= d);
    }

    const tRev = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
    const tBook = new Set(filteredPayments.map(p => p.appointment_id)).size;

    const grouped = new Map<string, number>();
    
    filteredPayments.forEach(p => {
      const d = new Date(p.date);
      let key = "";
      if (range === "7d" || range === "30d") {
        key = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      } else {
        key = d.toLocaleDateString('en-GB', { month: 'short' });
      }
      grouped.set(key, (grouped.get(key) || 0) + (p.amount || 0) / 100);
    });

    const seriesData = Array.from(grouped.entries()).sort((a, b) => {
      if (range === "7d" || range === "30d") {
         return new Date(a[0] + " " + now.getFullYear()).getTime() - new Date(b[0] + " " + now.getFullYear()).getTime();
      } else {
         const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
         return m.indexOf(a[0]) - m.indexOf(b[0]);
      }
    });

    const history = [...filteredPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50);

    return { totalRevenue: tRev, totalBookings: tBook, chartData: seriesData, recentHistory: history };
  }, [payments, range]);

  const avgValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const maxVal = chartData.length > 0 ? Math.max(...chartData.map(d => d[1])) : 100;

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
          <div className="flex flex-wrap gap-4 items-baseline justify-between">
            <div>
              <p className="font-fredoka text-5xl text-deep-slate leading-none">£{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
              <p className="text-pebble-grey font-bold mt-2">Gross revenue</p>
            </div>
            <div className="flex gap-6 text-right">
              <div>
                <p className="font-fredoka text-2xl text-deep-slate">{totalBookings}</p>
                <p className="text-xs font-bold text-pebble-grey mt-1">Bookings</p>
              </div>
              <div>
                <p className="font-fredoka text-2xl text-deep-slate">£{avgValue.toFixed(0)}</p>
                <p className="text-xs font-bold text-pebble-grey mt-1">Avg value</p>
              </div>
              {upcomingRevenue > 0 && (
                <div>
                  <p className="font-fredoka text-2xl text-sage-leaf">+£{upcomingRevenue.toFixed(0)}</p>
                  <p className="text-xs font-bold text-pebble-grey mt-1">Upcoming</p>
                </div>
              )}
            </div>
          </div>

          <div className="h-64 flex items-end gap-2 mt-8">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-pebble-grey font-bold text-sm">
                No earning data for this period
              </div>
            ) : chartData.map((d, i) => {
              const pct = d[1] / maxVal;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full bg-pebble-grey/10 rounded-t-lg relative transition-colors group-hover:bg-pebble-grey/20" style={{ height: `${Math.max(5, pct * 100)}%` }}>
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

        <aside className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <Eyebrow>Recent activity</Eyebrow>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
            {upcomingAppointments.slice(0, 5).map(a => (
              <div key={a.id} className="flex justify-between items-center text-sm border-b border-pebble-grey/10 pb-4">
                <div>
                  <p className="font-bold text-deep-slate">{a.service_snapshot_name || "Appointment"}</p>
                  <p className="text-xs text-pebble-grey mt-0.5">{new Date(a.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {a.dogs?.name || "Dog"}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sage-leaf">+£{((a.service_snapshot_price || 0) / 100).toFixed(0)}</p>
                  <p className="text-[10px] uppercase tracking-wide font-bold text-sage-leaf/70 mt-0.5">Upcoming</p>
                </div>
              </div>
            ))}
            {recentHistory.length === 0 && upcomingAppointments.length === 0 ? (
              <p className="text-sm text-pebble-grey">No payment history yet.</p>
            ) : recentHistory.map(h => (
              <div key={h.id} className="flex justify-between items-center text-sm border-b border-pebble-grey/10 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-bold text-deep-slate">{h.status === "Deposit" ? "Deposit Payment" : "Full Payment"}</p>
                  <p className="text-xs text-pebble-grey mt-0.5">{new Date(h.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${h.status === "Deposit" ? "text-sage-leaf" : "text-deep-slate"}`}>
                    +£{(h.amount / 100).toFixed(2)}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide font-bold text-pebble-grey mt-0.5">{h.status}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-xs font-bold text-pebble-grey hover:text-deep-slate transition-colors py-2 focus-ring">View all history</button>
        </aside>
      </div>
    </section>
  );
}
