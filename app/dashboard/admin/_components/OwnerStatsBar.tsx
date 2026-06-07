"use client";

import type { AdminUserRow } from "@/app/actions/admin";

interface Props {
  owners: AdminUserRow[];
}

export function OwnerStatsBar({ owners }: Props) {
  const total = owners.length;
  const active = owners.filter((o) => o.is_active).length;
  const totalDogs = owners.reduce((sum, o) => sum + (o.dog_count ?? 0), 0);
  const withDogs = owners.filter((o) => o.dog_count > 0).length;
  const avgDogs = total > 0 ? (totalDogs / total).toFixed(1) : "0.0";

  return (
    <div className="bg-white border border-pebble-grey/20 rounded-[20px] px-4 sm:px-5 py-3 flex items-center gap-4 sm:gap-6 flex-wrap">
      <Chip label="Total owners" value={total.toLocaleString()} />
      <Chip label="Active" value={active.toLocaleString()} tone="sage" />
      <Chip label="Total dogs" value={totalDogs.toLocaleString()} />
      <Chip label="With dogs" value={withDogs.toLocaleString()} />
      <Chip label="Avg dogs/owner" value={avgDogs} />
    </div>
  );
}

function Chip({ label, value, tone }: { label: string; value: string; tone?: "sage" }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider">{label}</span>
      <span className={`font-fredoka text-base leading-none ${tone === "sage" ? "text-sage-leaf" : "text-deep-slate"}`}>{value}</span>
    </div>
  );
}
