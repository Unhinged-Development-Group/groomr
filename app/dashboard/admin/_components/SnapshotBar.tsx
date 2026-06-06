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
  { key: "total_owners",       label: "Total owners",          category: "Users",    getValue: (s)    => s ? s.totalOwners.toLocaleString() : "—" },
  { key: "total_groomers",     label: "Total groomers",        category: "Users",    getValue: (s)    => s ? s.totalGroomers.toLocaleString() : "—" },
  { key: "listed_groomers",    label: "Listed groomers",       category: "Users",    getValue: (s)    => s ? s.listedGroomers.toLocaleString() : "—" },
  { key: "unverified",         label: "Pending verification",  category: "Users",    getValue: (s)    => s ? s.unverifiedGroomers.toLocaleString() : "—" },
  { key: "total_dogs",         label: "Total dogs",            category: "Users",    getValue: (s)    => s ? s.totalDogs.toLocaleString() : "—" },
  // Bookings
  { key: "total_appointments", label: "Total bookings",        category: "Bookings", getValue: (s)    => s ? s.totalAppointments.toLocaleString() : "—" },
  { key: "bookings_30d",       label: "Bookings (30 days)",    category: "Bookings", getValue: (s)    => s ? s.appointmentsLast30Days.toLocaleString() : "—" },
  { key: "open_disputes",      label: "Open disputes",         category: "Bookings", getValue: (s)    => s ? s.openDisputes.toLocaleString() : "—" },
  { key: "open_support",       label: "Open support",          category: "Bookings", getValue: (s)    => s ? s.openSupportRequests.toLocaleString() : "—" },
  // Revenue
  { key: "gross_revenue",      label: "Gross revenue",         category: "Revenue",  getValue: (s)    => s ? gbp(s.grossRevenuePence) : "—" },
  { key: "platform_fee",       label: "Commission earned",     category: "Revenue",  getValue: (s)    => s ? gbp(s.platformFeePence) : "—" },
  { key: "groomer_payouts",    label: "Groomer payouts",       category: "Revenue",  getValue: (s)    => s ? gbp(s.groomerPayoutPence) : "—" },
  { key: "pending_payouts",    label: "Pending payouts",       category: "Revenue",  getValue: (_, f) => f ? gbp(f.pendingPayoutsPence) : "—" },
  { key: "total_tips",         label: "Tips collected",        category: "Revenue",  getValue: (_, f) => f ? gbp(f.totalTipsPence) : "—" },
];

function gbp(pence: number) {
  return (pence / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
}

const CATEGORIES: SnapshotMetric["category"][] = ["Users", "Bookings", "Revenue"];

// ─── Empty circle slot ────────────────────────────────────────────────────────

function EmptySlot({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      aria-label="Add snapshot"
      className="w-24 h-24 sm:w-[118px] sm:h-[118px] rounded-full border-2 border-dashed border-pebble-grey/35 flex items-center justify-center text-pebble-grey/40 hover:border-deep-slate hover:bg-deep-slate/8 hover:text-deep-slate transition-all hover:scale-105 focus-ring shrink-0"
    >
      <PlusIcon size={36} />
    </button>
  );
}

// ─── Filled circle slot ───────────────────────────────────────────────────────

function FilledSlot({
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
    <div className="relative group w-24 h-24 sm:w-[118px] sm:h-[118px] rounded-full bg-deep-slate shadow-sm flex flex-col items-center justify-center text-center px-3 shrink-0">
      {/* Content */}
      <p className="text-[8px] sm:text-[9px] font-bold text-alabaster-cream/60 uppercase tracking-wider leading-tight line-clamp-2 w-full text-center">
        {metric.label}
      </p>
      <p className="font-fredoka text-xl sm:text-2xl text-alabaster-cream leading-tight mt-0.5">
        {metric.getValue(stats, financials)}
      </p>

      {/* Hover overlay — groomr gold */}
      <div className="absolute inset-0 rounded-full bg-groomr-gold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
        <button
          onClick={onEdit}
          title="Change metric"
          className="flex flex-col items-center gap-0.5 text-deep-slate/70 hover:text-deep-slate transition-colors focus-ring rounded"
        >
          <span className="text-sm leading-none">✎</span>
          <span className="text-[8px] font-bold">Change</span>
        </button>
        <button
          onClick={onRemove}
          title="Remove"
          className="flex flex-col items-center gap-0.5 text-deep-slate/70 hover:text-deep-slate transition-colors focus-ring rounded"
        >
          <CloseIcon size={12} />
          <span className="text-[8px] font-bold">Remove</span>
        </button>
      </div>
    </div>
  );
}

// ─── Metric picker modal ──────────────────────────────────────────────────────

function MetricPicker({
  open,
  currentKey,
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
    (m) => !usedKeys.includes(m.key) || m.key === currentKey
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

        {/* Metric list */}
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {inCategory.map((metric) => (
            <button
              key={metric.key}
              onClick={() => { onPick(metric.key); onClose(); }}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-[10px] font-bold text-sm transition-colors focus-ring",
                metric.key === currentKey
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

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  initialSnapshots: (string | null)[];
  stats: AdminOverviewStats | null;
  financials: AdminFinancials | null;
}

export function SnapshotBar({ initialSnapshots, stats, financials }: Props) {
  const [snapshots, setSnapshots] = useState<(string | null)[]>(
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

  const filledCount = snapshots.filter(Boolean).length;
  // Progressive reveal: show all filled slots + one empty slot (up to 4 total)
  const visibleCount = Math.min(filledCount + 1, 4);
  const visibleSlots = snapshots.slice(0, visibleCount);
  const usedKeys = snapshots.filter(Boolean) as string[];

  return (
    <>
      <div className="flex gap-3 items-center">
        {visibleSlots.map((key, i) =>
          key ? (
            <FilledSlot
              key={i}
              metricKey={key}
              stats={stats}
              financials={financials}
              onEdit={() => setPickerSlot(i)}
              onRemove={() => handleRemove(i)}
            />
          ) : (
            <EmptySlot key={i} onAdd={() => setPickerSlot(i)} />
          )
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
