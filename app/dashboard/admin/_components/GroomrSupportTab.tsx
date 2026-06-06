"use client";

import { SupportTab } from "./SupportTab";
import type { AdminSupportRow } from "@/app/actions/admin";

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "sage" | "terra" | "gold" }) {
  const bg =
    tone === "terra"
      ? "bg-muted-terracotta/10 border-muted-terracotta/20"
      : tone === "gold"
      ? "bg-groomr-gold/10 border-groomr-gold/30"
      : "bg-white border-pebble-grey/20";
  const text =
    tone === "terra"
      ? "text-muted-terracotta"
      : tone === "gold"
      ? "text-deep-slate"
      : "text-deep-slate";

  return (
    <div className={`rounded-[20px] p-5 border ${bg} space-y-1`}>
      <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">{label}</p>
      <p className={`font-fredoka text-4xl leading-tight ${text}`}>{value}</p>
    </div>
  );
}

interface Props {
  initialSupport: AdminSupportRow[];
}

export function GroomrSupportTab({ initialSupport }: Props) {
  const open = initialSupport.filter((s) => s.status === "open").length;
  const inProgress = initialSupport.filter((s) => s.status === "in_progress").length;
  const closed = initialSupport.filter((s) => s.status === "closed").length;
  const total = initialSupport.length;

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total requests" value={total} />
        <StatCard label="Open" value={open} tone={open > 0 ? "terra" : undefined} />
        <StatCard label="In progress" value={inProgress} tone={inProgress > 0 ? "gold" : undefined} />
        <StatCard label="Closed" value={closed} tone="sage" />
      </div>

      {/* Request management (reuses existing SupportTab component) */}
      <SupportTab initialSupport={initialSupport} />
    </div>
  );
}
