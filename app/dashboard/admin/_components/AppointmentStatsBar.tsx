"use client";

import { useState } from "react";
import type { AdminAppointmentRow } from "@/app/actions/admin";

interface Props {
  appointments: AdminAppointmentRow[];
}

export function AppointmentStatsBar({ appointments }: Props) {
  const [selectedCity, setSelectedCity] = useState("");
  const [cancellationOpen, setCancellationOpen] = useState(false);

  const cities = Array.from(
    new Set(appointments.map((a) => a.groomer_city).filter(Boolean) as string[])
  ).sort();

  const subset = selectedCity
    ? appointments.filter((a) => a.groomer_city === selectedCity)
    : appointments;

  const total = subset.length;
  const completed = subset.filter((a) => a.status === "completed").length;
  const cancelled = subset.filter((a) => a.status === "cancelled").length;
  const noShow = subset.filter((a) => a.status === "no_show").length;
  const pending = subset.filter((a) => a.status === "pending").length;
  const confirmed = subset.filter((a) => a.status === "confirmed").length;

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const last30 = subset.filter((a) => new Date(a.scheduled_at).getTime() >= thirtyDaysAgo).length;

  // Popular services
  const serviceCount: Record<string, number> = {};
  for (const a of subset) {
    if (a.service_name) serviceCount[a.service_name] = (serviceCount[a.service_name] ?? 0) + 1;
  }
  const popularServices = Object.entries(serviceCount)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Cancellation leaders
  const cancelledGroomers: Record<string, number> = {};
  const cancelledOwners: Record<string, number> = {};
  for (const a of subset.filter((x) => x.status === "cancelled")) {
    if (a.groomer_business_name) cancelledGroomers[a.groomer_business_name] = (cancelledGroomers[a.groomer_business_name] ?? 0) + 1;
    if (a.owner_name) cancelledOwners[a.owner_name] = (cancelledOwners[a.owner_name] ?? 0) + 1;
  }
  const topCancelGroomers = Object.entries(cancelledGroomers).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
  const topCancelOwners = Object.entries(cancelledOwners).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-3">
      {/* Primary stats row */}
      <div className="bg-white border border-pebble-grey/20 rounded-[20px] px-4 sm:px-5 py-3 flex items-center gap-4 sm:gap-6 flex-wrap">
        <Chip label="Total" value={total.toLocaleString()} />
        <Chip label="Completed" value={completed.toLocaleString()} tone="sage" />
        <Chip label="Cancelled" value={cancelled.toLocaleString()} tone="terra" />
        <Chip label="No shows" value={noShow.toLocaleString()} tone="grey" />
        <Chip label="Pending" value={pending.toLocaleString()} />
        <Chip label="Confirmed" value={confirmed.toLocaleString()} />
        <Chip label="Last 30 days" value={last30.toLocaleString()} />
        {cities.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs font-bold text-pebble-grey uppercase tracking-wider shrink-0">City</label>
            <select
              className="field text-xs py-1 pl-2 pr-6"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              <option value="">All cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city} ({appointments.filter((a) => a.groomer_city === city).length})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Popular services */}
      {popularServices.length > 0 && (
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] px-4 sm:px-5 py-3">
          <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider mb-2">Most popular services</p>
          <div className="flex items-center gap-3 flex-wrap">
            {popularServices.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-groomr-gold/20 text-[10px] font-bold text-deep-slate">{i + 1}</span>
                <span className="text-sm font-bold text-deep-slate">{s.name}</span>
                <span className="text-xs text-pebble-grey">({s.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancellation leaders */}
      {(topCancelGroomers.length > 0 || topCancelOwners.length > 0) && (
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
          <button onClick={() => setCancellationOpen((v) => !v)} className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3 text-left hover:bg-alabaster-cream/60 transition-colors">
            <span className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider">Cancellation records</span>
            <span className="text-pebble-grey text-xs">{cancellationOpen ? "▲" : "▼"}</span>
          </button>
          {cancellationOpen && (
            <div className="px-4 sm:px-5 pb-4 border-t border-pebble-grey/10 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div>
                <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider mb-2">Groomers</p>
                {topCancelGroomers.map((g, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 py-1">
                    <span className="text-sm text-deep-slate truncate">{g.name}</span>
                    <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted-terracotta/10 text-muted-terracotta border border-muted-terracotta/30">{g.count}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider mb-2">Owners</p>
                {topCancelOwners.map((o, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 py-1">
                    <span className="text-sm text-deep-slate truncate">{o.name}</span>
                    <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted-terracotta/10 text-muted-terracotta border border-muted-terracotta/30">{o.count}</span>
                  </div>
                ))}
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
