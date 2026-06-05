"use client";

import { useState, useTransition } from "react";
import { SearchPill } from "@/components/ui/SearchPill";
import { Toast } from "@/components/ui/Toast";
import { adminCancelAppointment } from "@/app/actions/admin";
import type { AdminAppointmentRow } from "@/app/actions/admin";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "no_show", label: "No show" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-groomr-gold/20 text-deep-slate border-groomr-gold/40",
  confirmed: "bg-sage-leaf/10 text-sage-leaf border-sage-leaf/30",
  completed: "bg-sage-leaf/20 text-sage-leaf border-sage-leaf/40",
  cancelled: "bg-muted-terracotta/10 text-muted-terracotta border-muted-terracotta/30",
  no_show: "bg-pebble-grey/10 text-pebble-grey border-pebble-grey/30",
};

function StatusChip({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-pebble-grey/10 text-pebble-grey border-pebble-grey/30";
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
      {label}
    </span>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function gbp(pence: number) {
  return (pence / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

function AppointmentRow({
  appt,
  onCancelled,
}: {
  appt: AdminAppointmentRow;
  onCancelled: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canCancel = appt.status === "pending" || appt.status === "confirmed";

  function handleCancel() {
    startTransition(async () => {
      const res = await adminCancelAppointment(appt.id, reason);
      if ("error" in res) {
        setToast(res.error);
      } else {
        setToast("Appointment cancelled.");
        onCancelled(appt.id);
        setExpanded(false);
      }
    });
  }

  return (
    <>
      <tr
        className="hover:bg-alabaster-cream/50 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3">
          <p className="font-bold text-deep-slate leading-tight">{appt.owner_name ?? "—"}</p>
          <p className="text-xs text-pebble-grey">{appt.owner_email}</p>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <p className="text-sm font-bold text-deep-slate">{appt.groomer_business_name ?? "—"}</p>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell">
          <p className="text-sm text-deep-slate">{appt.dog_name ?? "—"}</p>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell">
          <p className="text-sm text-deep-slate">{appt.service_name}</p>
          <p className="text-xs text-pebble-grey">{gbp(appt.service_price_pence)}</p>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <p className="text-xs text-pebble-grey">{formatDateTime(appt.scheduled_at)}</p>
        </td>
        <td className="px-4 py-3">
          <StatusChip status={appt.status} />
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="px-4 pb-4 bg-alabaster-cream/40 border-b border-pebble-grey/10">
            <div className="space-y-3 pt-2" onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-0.5">Service</p>
                  <p className="font-bold text-deep-slate">{appt.service_name}</p>
                  <p className="text-pebble-grey">{gbp(appt.service_price_pence)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-0.5">Date & time</p>
                  <p className="font-bold text-deep-slate">{formatDateTime(appt.scheduled_at)}</p>
                </div>
                {appt.cancellation_reason && (
                  <div>
                    <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-0.5">
                      Cancellation reason
                    </p>
                    <p className="text-deep-slate">{appt.cancellation_reason}</p>
                  </div>
                )}
              </div>
              {canCancel && (
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end pt-2 border-t border-pebble-grey/10">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">
                      Cancellation reason (required)
                    </label>
                    <input
                      className="field w-full"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason for admin cancellation…"
                    />
                  </div>
                  <button
                    onClick={handleCancel}
                    disabled={pending || !reason.trim()}
                    className="shrink-0 inline-flex items-center justify-center font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring bg-muted-terracotta text-alabaster-cream hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    {pending ? "Cancelling…" : "Cancel appointment"}
                  </button>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}

export function AppointmentsTab({
  initialAppointments,
}: {
  initialAppointments: AdminAppointmentRow[];
}) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = appointments
    .filter((a) => filter === "all" || a.status === filter)
    .filter((a) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        a.owner_name?.toLowerCase().includes(q) ||
        a.owner_email?.toLowerCase().includes(q) ||
        a.groomer_business_name?.toLowerCase().includes(q) ||
        a.dog_name?.toLowerCase().includes(q)
      );
    });

  function handleCancelled(id: string) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors focus-ring ${
                filter === f.id
                  ? "bg-deep-slate text-alabaster-cream border-deep-slate"
                  : "bg-white text-deep-slate border-pebble-grey/30 hover:bg-alabaster-cream"
              }`}
            >
              {f.label}
              {f.id !== "all" && (
                <span className="ml-1.5 opacity-60">
                  ({appointments.filter((a) => a.status === f.id).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <SearchPill value={search} onChange={setSearch} placeholder="Search appointments…" size="sm" />
      </div>

      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-pebble-grey font-bold">No appointments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pebble-grey/10">
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden md:table-cell">
                    Groomer
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden sm:table-cell">
                    Dog
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden lg:table-cell">
                    Service
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden md:table-cell">
                    When
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pebble-grey/10">
                {filtered.map((a) => (
                  <AppointmentRow key={a.id} appt={a} onCancelled={handleCancelled} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
