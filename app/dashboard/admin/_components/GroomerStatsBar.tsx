"use client";

import { useState } from "react";
import type { AdminGroomerRow } from "@/app/actions/admin";

interface Props {
  groomers: AdminGroomerRow[];
}

export function GroomerStatsBar({ groomers }: Props) {
  const [selectedCity, setSelectedCity] = useState("");

  const cities = Array.from(
    new Set(groomers.map((g) => g.city).filter(Boolean) as string[])
  ).sort();

  const subset = selectedCity
    ? groomers.filter((g) => g.city === selectedCity)
    : groomers;

  const total = subset.length;
  const listed = subset.filter((g) => g.is_listed).length;
  const verified = subset.filter((g) => g.is_verified).length;
  const awaiting = subset.filter((g) => g.verification_status === "awaiting").length;
  const avgRating =
    subset.length > 0
      ? subset.reduce((sum, g) => sum + (g.average_rating ?? 0), 0) / subset.length
      : 0;

  return (
    <div className="bg-white border border-pebble-grey/20 rounded-[20px] px-4 sm:px-5 py-3 flex items-center gap-4 sm:gap-6 flex-wrap">
      <Chip label="Total" value={total.toLocaleString()} />
      <Chip label="Listed" value={listed.toLocaleString()} />
      <Chip label="Verified" value={verified.toLocaleString()} tone="sage" />
      {awaiting > 0 && <Chip label="Awaiting" value={awaiting.toLocaleString()} tone="gold" />}
      {avgRating > 0 && <Chip label="Avg rating" value={`${avgRating.toFixed(1)} ★`} />}

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
              <option key={city} value={city}>
                {city} ({groomers.filter((g) => g.city === city).length})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function Chip({ label, value, tone }: { label: string; value: string; tone?: "sage" | "gold" }) {
  const valueClass =
    tone === "sage" ? "text-sage-leaf" :
    tone === "gold" ? "text-deep-slate" :
    "text-deep-slate";
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider">{label}</span>
      <span className={`font-fredoka text-base leading-none ${valueClass}`}>{value}</span>
    </div>
  );
}
