"use client";

import { useState, useEffect } from "react";
import { adminGetOwnerStats } from "@/app/actions/admin";
import type { AdminOwnerStats } from "@/app/actions/admin";

interface Props {
  onDogFilter?: (hasDogs: boolean | null) => void;
}

export function OwnerStatsBar({ onDogFilter }: Props) {
  const [stats, setStats] = useState<AdminOwnerStats | null>(null);

  useEffect(() => {
    adminGetOwnerStats().then((res) => {
      if ("data" in res) setStats(res.data);
    });
  }, []);

  if (!stats) {
    return <div className="h-10 bg-white border border-pebble-grey/20 rounded-[20px] animate-pulse" />;
  }

  return (
    <div className="bg-white border border-pebble-grey/20 rounded-[20px] px-4 sm:px-5 py-3 flex items-center gap-4 sm:gap-6 flex-wrap">
      <Chip label="Total owners" value={stats.totalOwners.toLocaleString()} />
      <Chip label="Total dogs" value={stats.totalDogs.toLocaleString()} />
      <Chip label="Avg dogs/owner" value={stats.avgDogsPerOwner.toFixed(1)} />
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
