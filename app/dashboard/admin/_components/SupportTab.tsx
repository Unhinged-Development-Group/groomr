"use client";

import { useState, useTransition } from "react";
import { Toast } from "@/components/ui/Toast";
import { replyToSupportRequest, updateSupportRequest } from "@/app/actions/admin";
import type { AdminSupportRow } from "@/app/actions/admin";

type SupportStatus = "open" | "in_progress" | "closed";

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "closed", label: "Closed" },
];

function StatusChip({ status }: { status: SupportStatus }) {
  const cls: Record<SupportStatus, string> = {
    open: "bg-muted-terracotta/10 text-muted-terracotta border-muted-terracotta/30",
    in_progress: "bg-groomr-gold/20 text-deep-slate border-groomr-gold/40",
    closed: "bg-sage-leaf/10 text-sage-leaf border-sage-leaf/30",
  };
  const labels: Record<SupportStatus, string> = { open: "Open", in_progress: "In Progress", closed: "Closed" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls[status]}`}>
      {labels[status]}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function SupportRow({
  req,
  onUpdated,
}: {
  req: AdminSupportRow;
  onUpdated: (id: string, status: SupportStatus, adminReply: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<SupportStatus>(req.status);
  const [reply, setReply] = useState(req.admin_reply ?? "");
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateSupportRequest(req.id, status, reply);
      if ("error" in result) {
        setToast(result.error);
      } else {
        setToast("Saved.");
        onUpdated(req.id, status, reply);
      }
    });
  }

  function handleReplyAndClose() {
    if (!reply.trim()) return;
    startTransition(async () => {
      const result = await replyToSupportRequest(req.id, reply);
      if ("error" in result) {
        setToast(result.error);
      } else {
        setToast("Reply sent and request closed.");
        onUpdated(req.id, "closed", reply);
        setStatus("closed");
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
          <p className="font-bold text-deep-slate leading-tight">{req.subject}</p>
          <p className="text-xs text-pebble-grey mt-0.5">{formatDate(req.created_at)}</p>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <p className="text-sm font-bold text-deep-slate">{req.name}</p>
          <p className="text-xs text-pebble-grey">{req.email}</p>
        </td>
        <td className="px-4 py-3">
          <StatusChip status={req.status} />
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={3} className="px-4 pb-4 bg-alabaster-cream/40 border-b border-pebble-grey/10">
            <div className="space-y-3 pt-2" onClick={(e) => e.stopPropagation()}>
              <div>
                <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Message</p>
                <p className="text-sm text-deep-slate whitespace-pre-wrap bg-white border border-pebble-grey/10 rounded-xl p-3">{req.message}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">
                    Admin reply
                  </label>
                  <textarea
                    className="field w-full min-h-[100px] resize-y text-sm"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply to send to the user…"
                  />
                </div>
                <div className="sm:w-48">
                  <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Status</label>
                  <select
                    className="field w-full"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SupportStatus)}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="btn-secondary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring"
                  onClick={handleSave}
                  disabled={pending}
                >
                  {pending ? "Saving…" : "Save"}
                </button>
                <button
                  className="btn-primary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring"
                  onClick={handleReplyAndClose}
                  disabled={pending || !reply.trim()}
                >
                  {pending ? "Sending…" : "Reply & close"}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}

export function SupportTab({ initialSupport }: { initialSupport: AdminSupportRow[] }) {
  const [requests, setRequests] = useState<AdminSupportRow[]>(initialSupport);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  function handleUpdated(id: string, status: SupportStatus, adminReply: string) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, admin_reply: adminReply } : r))
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
                ({requests.filter((r) => r.status === f.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-pebble-grey font-bold">No support requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pebble-grey/10">
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden md:table-cell">From</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pebble-grey/10">
                {filtered.map((r) => (
                  <SupportRow key={r.id} req={r} onUpdated={handleUpdated} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
