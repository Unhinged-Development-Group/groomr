"use client";

import { useState, useEffect } from "react";
import { adminGetAppointmentStats } from "@/app/actions/admin";
import type { AdminAppointmentStats } from "@/app/actions/admin";

export function AppointmentStatsBar() {
  const [stats, setStats] = useState<AdminAppointmentStats | null>(null);
  const [cancellationOpen, setCancellationOpen] = useState(false);

  useEffect(() => {
    adminGetAppointmentStats().then((res) => {
      if ("data" in res) setStats(res.data);
    });
  }, []);

  if (!stats) {
    return (
      <div className="space-y-2">
        <div className="h-14 bg-white border border-pebble-grey/20 rounded-[20px] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Primary stats row */}
      <div className="bg-white border border-pebble-grey/20 rounded-[20px] px-4 sm:px-5 py-3 flex items-center gap-4 sm:gap-6 flex-wrap">
        <Chip label="Total" value={stats.totalAppointments.toLocaleString()} />
        <Chip label="Completed" value={stats.completedCount.toLocaleString()} tone="sage" />
        <Chip label="Cancelled" value={stats.cancelledCount.toLocaleString()} tone="terra" />
        <Chip label="No shows" value={stats.noShowCount.toLocaleString()} tone="grey" />
        <Chip label="Last 30 days" value={stats.appointmentsLast30Days.toLocaleString()} />
        <div className="ml-auto flex items-center gap-4">
          <Chip label="Avg/groomer" value={stats.avgPerGroomer.toString()} />
          <Chip label="Avg/owner" value={stats.avgPerOwner.toString()} />
        </div>
      </div>

      {/* Popular services */}
      {stats.mostPopularServices.length > 0 && (
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] px-4 sm:px-5 py-3">
          <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider mb-2">Most popular services</p>
          <div className="flex items-center gap-3 flex-wrap">
            {stats.mostPopularServices.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-groomr-gold/20 text-[10px] font-bold text-deep-slate">
                  {i + 1}
                </span>
                <span className="text-sm font-bold text-deep-slate">{s.name}</span>
                <span className="text-xs text-pebble-grey">({s.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancellation leaders (collapsible) */}
      {(stats.highestCancellationGroomers.length > 0 || stats.highestCancellationOwners.length > 0) && (
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
          <button
            onClick={() => setCancellationOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3 text-left hover:bg-alabaster-cream/60 transition-colors"
          >
            <span className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider">Cancellation records</span>
            <span className="text-pebble-grey text-xs">{cancellationOpen ? "▲" : "▼"}</span>
          </button>
          {cancellationOpen && (
            <div className="px-4 sm:px-5 pb-4 border-t border-pebble-grey/10 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div>
                <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider mb-2">Groomers</p>
                <div className="space-y-1.5">
                  {stats.highestCancellationGroomers.map((g, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-deep-slate truncate">{g.name}</span>
                      <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted-terracotta/10 text-muted-terracotta border border-muted-terracotta/30">{g.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider mb-2">Owners</p>
                <div className="space-y-1.5">
                  {stats.highestCancellationOwners.map((o, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-deep-slate truncate">{o.name}</span>
                      <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted-terracotta/10 text-muted-terracotta border border-muted-terracotta/30">{o.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ label, value, tone }: { label: string; value: string; tone?: "sage" | "terra" | "grey" }) {
  const valueClass =
    tone === "sage" ? "text-sage-leaf" :
    tone === "terra" ? "text-muted-terracotta" :
    tone === "grey" ? "text-pebble-grey" :
    "text-deep-slate";

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider">{label}</span>
      <span className={`font-fredoka text-base leading-none ${valueClass}`}>{value}</span>
    </div>
  );
}
