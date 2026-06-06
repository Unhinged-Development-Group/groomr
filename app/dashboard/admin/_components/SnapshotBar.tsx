"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { PlusIcon, CloseIcon } from "@/components/ui/GroomrIcons";
import { adminSavePreferences } from "@/app/actions/admin";
import type { AdminOverviewStats, AdminFinancials } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

// ─── Available metrics ────────────────────────────────────────────────────────

export interface SnapshotMetric {
  key: string;
  label: string;
  category: "Users" | "Bookings" | "Revenue";
  getValue: (stats: AdminOverviewStats | null, financials: AdminFinancials | null) => string;
}

export const SNAPSHOT_METRICS: SnapshotMetric[] = [
  // Users
  { key: "total_owners",      label: "Total owners",       category: "Users",    getValue: (s) => s ? s.totalOwners.toLocaleString() : "—" },
  { key: "total_groomers",    label: "Total groomers",     category: "Users",    getValue: (s) => s ? s.totalGroomers.toLocaleString() : "—" },
  { key: "listed_groomers",   label: "Listed groomers",    category: "Users",    getValue: (s) => s ? s.listedGroomers.toLocaleString() : "—" },
  { key: "unverified",        label: "Pending verification", category: "Users",  getValue: (s) => s ? s.unverifiedGroomers.toLocaleString() : "—" },
  { key: "total_dogs",        label: "Total dogs",         category: "Users",    getValue: (s) => s ? s.totalDogs.toLocaleString() : "—" },
  // Bookings
  { key: "total_appointments", label: "Total bookings",    category: "Bookings", getValue: (s) => s ? s.totalAppointments.toLocaleString() : "—" },
  { key: "bookings_30d",      label: "Bookings (30 days)", category: "Bookings", getValue: (s) => s ? s.appointmentsLast30Days.toLocaleString() : "—" },
  { key: "open_disputes",     label: "Open disputes",      category: "Bookings", getValue: (s) => s ? s.openDisputes.toLocaleString() : "—" },
  { key: "open_support",      label: "Open support tickets", category: "Bookings", getValue: (s) => s ? s.openSupportRequests.toLocaleString() : "—" },
  // Revenue
  {
    key: "gross_revenue",
    label: "Gross revenue",
    category: "Revenue",
    getValue: (s) => s ? gbp(s.grossRevenuePence) : "—",
  },
  {
    key: "platform_fee",
    label: "Commission earned",
    category: "Revenue",
    getValue: (s) => s ? gbp(s.platformFeePence) : "—",
  },
  {
    key: "groomer_payouts",
    label: "Groomer payouts",
    category: "Revenue",
    getValue: (s) => s ? gbp(s.groomerPayoutPence) : "—",
  },
  {
    key: "pending_payouts",
    label: "Pending payouts",
    category: "Revenue",
    getValue: (_, f) => f ? gbp(f.pendingPayoutsPence) : "—",
  },
  {
    key: "total_tips",
    label: "Tips collected",
    category: "Revenue",
    getValue: (_, f) => f ? gbp(f.totalTipsPence) : "—",
  },
];

function gbp(pence: number) {
  return (pence / 100).toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  });
}

const CATEGORIES: SnapshotMetric["category"][] = ["Users", "Bookings", "Revenue"];

// ─── Snapshot card ────────────────────────────────────────────────────────────

function SnapshotCard({
  metricKey,
  stats,
  financials,
  onEdit,
  onRemove,
}: {
  metricKey: string;
  stats: AdminOverviewStats | null;
  financials: AdminFinancials | null;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const metric = SNAPSHOT_METRICS.find((m) => m.key === metricKey);
  if (!metric) return null;

  return (
    <div className="group relative bg-white border border-pebble-grey/20 rounded-[16px] px-4 py-3 min-w-[140px] flex-1">
      <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider leading-tight pr-4">
        {metric.label}
      </p>
      <p className="font-fredoka text-2xl text-deep-slate mt-0.5 leading-tight">
        {metric.getValue(stats, financials)}
      </p>
      {/* Hover actions */}
      <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          title="Change metric"
          className="w-5 h-5 rounded-full bg-pebble-grey/15 hover:bg-pebble-grey/30 flex items-center justify-center focus-ring transition-colors"
        >
          <span className="text-[9px] text-pebble-grey font-bold">✎</span>
        </button>
        <button
          onClick={onRemove}
          title="Remove snapshot"
          className="w-5 h-5 rounded-full bg-pebble-grey/15 hover:bg-muted-terracotta/20 flex items-center justify-center focus-ring transition-colors"
        >
          <CloseIcon size={8} className="text-pebble-grey" />
        </button>
      </div>
    </div>
  );
}

function EmptySlot({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="flex items-center gap-1.5 px-4 py-3 rounded-[16px] border border-dashed border-pebble-grey/30 text-pebble-grey hover:border-pebble-grey/50 hover:text-deep-slate transition-colors focus-ring min-w-[120px] flex-1"
    >
      <PlusIcon size={14} />
      <span className="text-xs font-bold">Add snapshot</span>
    </button>
  );
}

// ─── Picker modal ─────────────────────────────────────────────────────────────

function MetricPicker({
  open,
  currentKey: _currentKey,
  usedKeys,
  onPick,
  onClose,
}: {
  open: boolean;
  currentKey: string | null;
  usedKeys: string[];
  onPick: (key: string) => void;
  onClose: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState<SnapshotMetric["category"]>("Users");

  const available = SNAPSHOT_METRICS.filter(
    (m) => !usedKeys.includes(m.key) || m.key === _currentKey
  );
  const inCategory = available.filter((m) => m.category === activeCategory);

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="p-5 space-y-4">
        <h2 className="font-fredoka text-xl text-deep-slate">Choose a metric</h2>

        {/* Category tabs */}
        <div className="flex gap-1 bg-alabaster-cream rounded-[12px] p-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "flex-1 py-1.5 rounded-[9px] text-xs font-bold transition-colors focus-ring",
                activeCategory === cat
                  ? "bg-white text-deep-slate shadow-sm"
                  : "text-pebble-grey hover:text-deep-slate"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Metric options */}
        <div className="space-y-1">
          {inCategory.map((metric) => (
            <button
              key={metric.key}
              onClick={() => { onPick(metric.key); onClose(); }}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-[10px] font-bold text-sm transition-colors focus-ring",
                metric.key === _currentKey
                  ? "bg-groomr-gold/20 text-deep-slate"
                  : "hover:bg-alabaster-cream text-deep-slate"
              )}
            >
              {metric.label}
            </button>
          ))}
          {inCategory.length === 0 && (
            <p className="text-sm text-pebble-grey text-center py-4">
              All {activeCategory} metrics are already pinned.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  initialSnapshots: (string | null)[];
  stats: AdminOverviewStats | null;
  financials: AdminFinancials | null;
}

export function SnapshotBar({ initialSnapshots, stats, financials }: Props) {
  const [snapshots, setSnapshots] = useState<(string | null)[]>(
    // ensure always 4 slots
    [...initialSnapshots, null, null, null, null].slice(0, 4)
  );
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  function persist(next: (string | null)[]) {
    setSnapshots(next);
    startTransition(async () => {
      await adminSavePreferences({ snapshots: next });
    });
  }

  function handlePick(key: string) {
    if (pickerSlot === null) return;
    const next = [...snapshots];
    next[pickerSlot] = key;
    persist(next);
  }

  function handleRemove(slot: number) {
    const next = [...snapshots];
    next[slot] = null;
    persist(next);
  }

  const filledSlots = snapshots.filter(Boolean).length;
  const usedKeys = snapshots.filter(Boolean) as string[];

  // Only render the bar if there are filled slots or the user can still add
  return (
    <>
      <div className="flex flex-wrap gap-2 items-stretch">
        {snapshots.map((key, i) =>
          key ? (
            <SnapshotCard
              key={i}
              metricKey={key}
              stats={stats}
              financials={financials}
              onEdit={() => setPickerSlot(i)}
              onRemove={() => handleRemove(i)}
            />
          ) : filledSlots < 4 ? (
            <EmptySlot key={i} onAdd={() => setPickerSlot(i)} />
          ) : null
        )}
      </div>

      <MetricPicker
        open={pickerSlot !== null}
        currentKey={pickerSlot !== null ? snapshots[pickerSlot] : null}
        usedKeys={usedKeys}
        onPick={handlePick}
        onClose={() => setPickerSlot(null)}
      />
    </>
  );
}
