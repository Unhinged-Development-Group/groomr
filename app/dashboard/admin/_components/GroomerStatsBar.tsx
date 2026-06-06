"use client";

import { useState, useEffect } from "react";
import { adminGetGroomerStats } from "@/app/actions/admin";
import type { AdminGroomerStats } from "@/app/actions/admin";

interface Props {
  onCityFilter: (city: string | null) => void;
}

export function GroomerStatsBar({ onCityFilter }: Props) {
  const [stats, setStats] = useState<AdminGroomerStats | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("");

  useEffect(() => {
    adminGetGroomerStats().then((res) => {
      if ("data" in res) setStats(res.data);
    });
  }, []);

  function handleCityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectedCity(val);
    onCityFilter(val || null);
  }

  if (!stats) {
    return (
      <div className="h-10 bg-white border border-pebble-grey/20 rounded-[20px] animate-pulse" />
    );
  }

  return (
    <div className="bg-white border border-pebble-grey/20 rounded-[20px] px-4 sm:px-5 py-3 flex items-center gap-4 sm:gap-6 flex-wrap">
      <Chip label="Total" value={stats.totalGroomers.toLocaleString()} />
      <Chip label="Listed" value={stats.listedGroomers.toLocaleString()} />
      <Chip label="Verified" value={stats.verifiedGroomers.toLocaleString()} />
      <Chip label="Avg appts/groomer/wk" value={stats.avgAppointmentsPerGroomerPerWeek.toString()} />

      {stats.groomersByCity.length > 0 && (
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs font-bold text-pebble-grey uppercase tracking-wider shrink-0">Filter by city</label>
          <select
            className="field text-xs py-1 pl-2 pr-6"
            value={selectedCity}
            onChange={handleCityChange}
          >
            <option value="">All cities</option>
            {stats.groomersByCity.map(({ city, count }) => (
              <option key={city} value={city}>{city} ({count})</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider">{label}</span>
      <span className="font-fredoka text-base text-deep-slate leading-none">{value}</span>
    </div>
  );
}
