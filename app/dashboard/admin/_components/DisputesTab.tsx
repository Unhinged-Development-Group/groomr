"use client";

import { useState, useTransition } from "react";
import { Toast } from "@/components/ui/Toast";
import { updateDisputeStatus } from "@/app/actions/admin";
import type { AdminDisputeRow } from "@/app/actions/admin";

type DisputeStatus = "open" | "in_review" | "resolved";

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "in_review", label: "In Review" },
  { id: "resolved", label: "Resolved" },
];

function StatusChip({ status }: { status: DisputeStatus }) {
  const cls: Record<DisputeStatus, string> = {
    open: "bg-muted-terracotta/10 text-muted-terracotta border-muted-terracotta/30",
    in_review: "bg-groomr-gold/20 text-deep-slate border-groomr-gold/40",
    resolved: "bg-sage-leaf/10 text-sage-leaf border-sage-leaf/30",
  };
  const labels: Record<DisputeStatus, string> = { open: "Open", in_review: "In Review", resolved: "Resolved" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls[status]}`}>
      {labels[status]}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function DisputeRow({ dispute, onUpdated }: { dispute: AdminDisputeRow; onUpdated: (id: string, status: DisputeStatus, notes: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<DisputeStatus>(dispute.status);
  const [notes, setNotes] = useState(dispute.admin_notes ?? "");
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateDisputeStatus(dispute.id, status, notes);
      if ("error" in result) {
        setToast(result.error);
      } else {
        setToast("Dispute updated.");
        onUpdated(dispute.id, status, notes);
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
          <p className="font-bold text-deep-slate leading-tight">{dispute.subject}</p>
          <p className="text-xs text-pebble-grey mt-0.5">{formatDate(dispute.created_at)}</p>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <p className="text-sm font-bold text-deep-slate">{dispute.owner_name ?? "—"}</p>
          <p className="text-xs text-pebble-grey">{dispute.owner_email}</p>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <p className="text-sm font-bold text-deep-slate">{dispute.groomer_name ?? "—"}</p>
          <p className="text-xs text-pebble-grey">{dispute.groomer_email}</p>
        </td>
        <td className="px-4 py-3">
          <StatusChip status={dispute.status} />
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={4} className="px-4 pb-4 bg-alabaster-cream/40 border-b border-pebble-grey/10">
            <div className="space-y-3 pt-2" onClick={(e) => e.stopPropagation()}>
              {dispute.description && (
                <div>
                  <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-deep-slate">{dispute.description}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Admin notes</label>
                  <textarea
                    className="field w-full min-h-[80px] resize-y text-sm"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Internal notes…"
                  />
                </div>
                <div className="sm:w-48">
                  <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Status</label>
                  <select
                    className="field w-full"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DisputeStatus)}
                  >
                    <option value="open">Open</option>
                    <option value="in_review">In Review</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  className="btn-primary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring"
                  onClick={handleSave}
                  disabled={pending}
                >
                  {pending ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
      {toast && (
        <Toast message={toast} onDismiss={() => setToast(null)} />
      )}
    </>
  );
}

export function DisputesTab({ initialDisputes }: { initialDisputes: AdminDisputeRow[] }) {
  const [disputes, setDisputes] = useState<AdminDisputeRow[]>(initialDisputes);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? disputes : disputes.filter((d) => d.status === filter);

  function handleUpdated(id: string, status: DisputeStatus, notes: string) {
    setDisputes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status, admin_notes: notes } : d))
    );
  }

  return (
    <div className="space-y-4">
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
                ({disputes.filter((d) => d.status === f.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-pebble-grey font-bold">No disputes found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pebble-grey/10">
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden md:table-cell">Owner</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden md:table-cell">Groomer</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pebble-grey/10">
                {filtered.map((d) => (
                  <DisputeRow key={d.id} dispute={d} onUpdated={handleUpdated} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
