"use client";

import { useState, useTransition } from "react";
import { SearchPill } from "@/components/ui/SearchPill";
import { Toast } from "@/components/ui/Toast";
import { adminCancelAppointment, adminUpdateAppointmentNotes, adminMarkNoShow } from "@/app/actions/admin";
import { AppointmentStatsBar } from "./AppointmentStatsBar";
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

type SortKey = "date_desc" | "date_asc" | "status" | "groomer" | "owner";

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
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function gbp(pence: number) {
  return (pence / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

function AppointmentRow({
  appt,
  onCancelled,
  onNotesUpdated,
  onNoShow,
}: {
  appt: AdminAppointmentRow;
  onCancelled: (id: string) => void;
  onNotesUpdated: (id: string, groomerNote: string | null, ownerNote: string | null) => void;
  onNoShow: (id: string) => void;
  onToast: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [adminNoteGroomer, setAdminNoteGroomer] = useState(appt.admin_note_groomer ?? "");
  const [adminNoteOwner, setAdminNoteOwner] = useState(appt.admin_note_owner ?? "");
  const [cancelPending, startCancel] = useTransition();
  const [notesPending, startNotes] = useTransition();
  const [noShowPending, startNoShow] = useTransition();

  const canCancel = appt.status === "pending" || appt.status === "confirmed";
  const isPastConfirmed = appt.status === "confirmed" && new Date(appt.scheduled_at) < new Date();

  function handleCancel() {
    startCancel(async () => {
      const res = await adminCancelAppointment(appt.id, cancelReason);
      if ("error" in res) { onToast(res.error); return; }
      onToast("Appointment cancelled.");
      onCancelled(appt.id);
      setExpanded(false);
    });
  }

  function handleSaveNotes() {
    startNotes(async () => {
      const res = await adminUpdateAppointmentNotes(appt.id, {
        groomerNote: adminNoteGroomer || null,
        ownerNote: adminNoteOwner || null,
      });
      if ("error" in res) { onToast(res.error); return; }
      onNotesUpdated(appt.id, adminNoteGroomer || null, adminNoteOwner || null);
      onToast("Notes saved.");
    });
  }

  function handleNoShow() {
    startNoShow(async () => {
      const res = await adminMarkNoShow(appt.id);
      if ("error" in res) { onToast(res.error); return; }
      onToast("Marked as no-show.");
      onNoShow(appt.id);
      setExpanded(false);
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
          <p className="text-xs text-pebble-grey">{appt.dog_name ?? ""}</p>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell">
          <p className="text-sm text-deep-slate">{appt.service_name}</p>
          <p className="text-xs text-pebble-grey">{gbp(appt.service_price_pence)}</p>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell">
          <p className="text-xs text-pebble-grey">{formatDateTime(appt.scheduled_at)}</p>
        </td>
        <td className="px-4 py-3">
          <StatusChip status={appt.status} />
          {appt.booking_group_id && (
            <span className="ml-1.5 text-[10px] font-bold text-pebble-grey/60">group</span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="px-4 pb-4 bg-alabaster-cream/40 border-b border-pebble-grey/10">
            <div className="space-y-4 pt-3" onClick={(e) => e.stopPropagation()}>
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-0.5">Service</p>
                  <p className="font-bold text-deep-slate">{appt.service_name}</p>
                  <p className="text-pebble-grey">{gbp(appt.service_price_pence)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-0.5">When</p>
                  <p className="font-bold text-deep-slate">{formatDateTime(appt.scheduled_at)}</p>
                </div>
                {appt.cancellation_reason && (
                  <div>
                    <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-0.5">Cancellation reason</p>
                    <p className="text-deep-slate">{appt.cancellation_reason}</p>
                  </div>
                )}
              </div>

              {/* User notes (read-only reference) */}
              {(appt.owner_notes || appt.groomer_notes) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-pebble-grey/10">
                  {appt.owner_notes && (
                    <div>
                      <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Owner&apos;s note</p>
                      <p className="text-xs text-deep-slate italic bg-white border border-pebble-grey/15 rounded-lg px-3 py-2">&quot;{appt.owner_notes}&quot;</p>
                    </div>
                  )}
                  {appt.groomer_notes && (
                    <div>
                      <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Groomer&apos;s note</p>
                      <p className="text-xs text-deep-slate italic bg-white border border-pebble-grey/15 rounded-lg px-3 py-2">&quot;{appt.groomer_notes}&quot;</p>
                    </div>
                  )}
                </div>
              )}

              {/* Admin support notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-pebble-grey/10">
                <div>
                  <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Note to groomer <span className="text-groomr-gold">(Groomr Support)</span></label>
                  <textarea
                    className="field w-full text-xs min-h-[60px] resize-y"
                    value={adminNoteGroomer}
                    onChange={(e) => setAdminNoteGroomer(e.target.value)}
                    placeholder="Visible to groomer as a support message…"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Note to owner <span className="text-groomr-gold">(Groomr Support)</span></label>
                  <textarea
                    className="field w-full text-xs min-h-[60px] resize-y"
                    value={adminNoteOwner}
                    onChange={(e) => setAdminNoteOwner(e.target.value)}
                    placeholder="Visible to owner as a support message…"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  disabled={notesPending}
                  className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-sage-leaf/10 text-sage-leaf hover:bg-sage-leaf/20 border border-sage-leaf/30 transition-colors focus-ring disabled:opacity-40"
                >
                  {notesPending ? "Saving…" : "Save support notes"}
                </button>
              </div>

              {/* Cancel + no-show actions */}
              <div className="flex flex-wrap gap-3 items-end pt-2 border-t border-pebble-grey/10">
                {canCancel && (
                  <div className="flex flex-1 flex-col sm:flex-row gap-2 items-start sm:items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">
                        Cancellation reason (required)
                      </label>
                      <input
                        className="field w-full"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Reason for admin cancellation…"
                      />
                    </div>
                    <button
                      onClick={handleCancel}
                      disabled={cancelPending || !cancelReason.trim()}
                      className="shrink-0 inline-flex items-center justify-center font-nunito font-bold px-5 py-2 rounded-full text-sm bg-muted-terracotta text-alabaster-cream hover:opacity-90 transition-opacity disabled:opacity-40 focus-ring"
                    >
                      {cancelPending ? "Cancelling…" : "Cancel appointment"}
                    </button>
                  </div>
                )}
                {isPastConfirmed && (
                  <button
                    onClick={handleNoShow}
                    disabled={noShowPending}
                    className="shrink-0 inline-flex items-center justify-center font-nunito font-bold px-5 py-2 rounded-full text-sm bg-pebble-grey text-white hover:opacity-80 transition-opacity disabled:opacity-40 focus-ring"
                  >
                    {noShowPending ? "Marking…" : "Mark as no-show"}
                  </button>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function AppointmentsTab({ initialAppointments }: { initialAppointments: AdminAppointmentRow[] }) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const filtered = appointments
    .filter((a) => filter === "all" || a.status === filter)
    .filter((a) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        a.owner_name?.toLowerCase().includes(q) ||
        a.owner_email?.toLowerCase().includes(q) ||
        a.groomer_business_name?.toLowerCase().includes(q) ||
        a.dog_name?.toLowerCase().includes(q) ||
        a.service_name?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sort === "date_asc") return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      if (sort === "status") return a.status.localeCompare(b.status);
      if (sort === "groomer") return (a.groomer_business_name ?? "").localeCompare(b.groomer_business_name ?? "");
      if (sort === "owner") return (a.owner_name ?? "").localeCompare(b.owner_name ?? "");
      // date_desc (default)
      return new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime();
    });

  function handleCancelled(id: string) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));
  }

  function handleNotesUpdated(id: string, groomerNote: string | null, ownerNote: string | null) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, admin_note_groomer: groomerNote, admin_note_owner: ownerNote } : a)));
  }

  function handleNoShow(id: string) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "no_show" } : a)));
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <AppointmentStatsBar appointments={appointments} />

      {/* Controls */}
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
                <span className="ml-1.5 opacity-60">({appointments.filter((a) => a.status === f.id).length})</span>
              )}
            </button>
          ))}
        </div>
        <SearchPill value={search} onChange={setSearch} placeholder="Search appointments…" size="sm" />
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-pebble-grey uppercase tracking-wider">Sort</span>
        {([
          { id: "date_desc", label: "Date ↓" },
          { id: "date_asc", label: "Date ↑" },
          { id: "status", label: "Status" },
          { id: "groomer", label: "Groomer" },
          { id: "owner", label: "Owner" },
        ] as { id: SortKey; label: string }[]).map((s) => (
          <button
            key={s.id}
            onClick={() => setSort(s.id)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors focus-ring ${
              sort === s.id
                ? "bg-deep-slate text-alabaster-cream border-deep-slate"
                : "bg-white text-pebble-grey border-pebble-grey/20 hover:border-pebble-grey/50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
        <div className="px-4 py-2 border-b border-pebble-grey/10">
          <p className="text-xs font-bold text-pebble-grey">
            {filtered.length === appointments.length
              ? `${appointments.length} appointments`
              : `${filtered.length} of ${appointments.length}`}
            {" "}· Click a row to expand
          </p>
        </div>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-pebble-grey font-bold">No appointments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pebble-grey/10">
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">Owner</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden md:table-cell">Groomer / Dog</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden lg:table-cell">Service</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden sm:table-cell">When</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pebble-grey/10">
                {filtered.map((a) => (
                  <AppointmentRow
                    key={a.id}
                    appt={a}
                    onCancelled={handleCancelled}
                    onNotesUpdated={handleNotesUpdated}
                    onNoShow={handleNoShow}
                    onToast={setToast}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
