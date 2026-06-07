"use client";

import { useState, useTransition } from "react";
import { Toast } from "@/components/ui/Toast";
import {
  updateDisputeStatus,
  adminProposeResolution,
  adminSendFinalResolution,
  adminCloseDispute,
} from "@/app/actions/admin";
import type { AdminDisputeRow } from "@/app/actions/admin";

type DisputeStatus = AdminDisputeRow["status"];

const ALL_STATUSES: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "open", label: "Open" },
  { id: "in_review", label: "In Review" },
  { id: "awaiting_agreement", label: "Awaiting Agreement" },
  { id: "final_review", label: "Final Review" },
  { id: "awaiting_final_agreement", label: "Awaiting Final" },
  { id: "resolved", label: "Resolved" },
];

const STATUS_CHIP: Record<string, string> = {
  pending: "bg-pebble-grey/10 text-pebble-grey border-pebble-grey/30",
  open: "bg-muted-terracotta/10 text-muted-terracotta border-muted-terracotta/30",
  in_review: "bg-groomr-gold/20 text-deep-slate border-groomr-gold/40",
  awaiting_agreement: "bg-blue-50 text-blue-700 border-blue-200",
  final_review: "bg-orange-50 text-orange-700 border-orange-200",
  awaiting_final_agreement: "bg-red-50 text-red-700 border-red-200",
  resolved: "bg-sage-leaf/10 text-sage-leaf border-sage-leaf/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  open: "Open",
  in_review: "In Review",
  awaiting_agreement: "Awaiting Agreement",
  final_review: "Final Review",
  awaiting_final_agreement: "Awaiting Final",
  resolved: "Resolved",
};

function AgreementBadge({ agreed, label }: { agreed: boolean | null; label: string }) {
  const icon = agreed === true ? "✓" : agreed === false ? "✗" : "—";
  const cls =
    agreed === true
      ? "text-sage-leaf"
      : agreed === false
      ? "text-muted-terracotta"
      : "text-pebble-grey";
  return (
    <span className="flex items-center gap-1 text-xs font-bold">
      <span className={cls}>{icon}</span>
      <span className="text-pebble-grey">{label}</span>
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DisputeRow({
  dispute,
  onUpdated,
}: {
  dispute: AdminDisputeRow;
  onUpdated: (updated: AdminDisputeRow) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<DisputeStatus>(dispute.status);
  const [notes, setNotes] = useState(dispute.admin_notes ?? "");
  const [resolution, setResolution] = useState(dispute.proposed_resolution ?? "");
  const [finalRes, setFinalRes] = useState(dispute.final_resolution ?? "");
  const [toast, setToast] = useState<string | null>(null);

  const [savePending, startSave] = useTransition();
  const [proposeResoPending, startProposeReso] = useTransition();
  const [finalResoPending, startFinalReso] = useTransition();
  const [closePending, startClose] = useTransition();

  function handleSave() {
    startSave(async () => {
      const result = await updateDisputeStatus(dispute.id, status, notes);
      if ("error" in result) {
        setToast(result.error);
      } else {
        setToast("Saved.");
        onUpdated({ ...dispute, status, admin_notes: notes });
      }
    });
  }

  function handleProposeResolution() {
    if (!resolution.trim()) return;
    startProposeReso(async () => {
      const result = await adminProposeResolution(dispute.id, resolution.trim());
      if ("error" in result) {
        setToast(result.error);
      } else {
        setToast("Resolution sent to both parties.");
        onUpdated({
          ...dispute,
          status: "awaiting_agreement",
          proposed_resolution: resolution.trim(),
          owner_agreed: null,
          groomer_agreed: null,
        });
        setStatus("awaiting_agreement");
      }
    });
  }

  function handleFinalResolution() {
    if (!finalRes.trim()) return;
    startFinalReso(async () => {
      const result = await adminSendFinalResolution(dispute.id, finalRes.trim());
      if ("error" in result) {
        setToast(result.error);
      } else {
        setToast("Final resolution sent to both parties.");
        onUpdated({
          ...dispute,
          status: "awaiting_final_agreement",
          final_resolution: finalRes.trim(),
          owner_agreed_final: null,
          groomer_agreed_final: null,
        });
        setStatus("awaiting_final_agreement");
      }
    });
  }

  function handleClose() {
    startClose(async () => {
      const result = await adminCloseDispute(dispute.id);
      if ("error" in result) {
        setToast(result.error);
      } else {
        setToast("Dispute closed as resolved.");
        onUpdated({ ...dispute, status: "resolved" });
        setStatus("resolved");
      }
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://groomr.uk";
  const disputeLink = `${appUrl}/disputes/${dispute.id}`;

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
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_CHIP[dispute.status] ?? STATUS_CHIP.open}`}>
            {STATUS_LABELS[dispute.status] ?? dispute.status}
          </span>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={4} className="px-4 pb-5 bg-alabaster-cream/40 border-b border-pebble-grey/10">
            <div className="space-y-4 pt-3" onClick={(e) => e.stopPropagation()}>

              {/* Party cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-pebble-grey/20 rounded-[14px] p-4 space-y-1">
                  <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider">Owner</p>
                  <p className="font-bold text-deep-slate text-sm">{dispute.owner_name ?? "—"}</p>
                  {dispute.owner_email && (
                    <a
                      href={`mailto:${dispute.owner_email}`}
                      className="text-xs text-pebble-grey hover:text-deep-slate transition-colors block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {dispute.owner_email}
                    </a>
                  )}
                </div>
                <div className="bg-white border border-pebble-grey/20 rounded-[14px] p-4 space-y-1">
                  <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider">Groomer</p>
                  <p className="font-bold text-deep-slate text-sm">{dispute.groomer_name ?? "—"}</p>
                  {dispute.groomer_email && (
                    <a
                      href={`mailto:${dispute.groomer_email}`}
                      className="text-xs text-pebble-grey hover:text-deep-slate transition-colors block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {dispute.groomer_email}
                    </a>
                  )}
                </div>
              </div>

              {/* Dispute link */}
              <div className="flex items-center gap-2">
                <p className="text-xs text-pebble-grey">Party page:</p>
                <a
                  href={disputeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-groomr-gold font-bold hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  /disputes/{dispute.id.slice(0, 8)}…
                </a>
              </div>

              {/* Description */}
              {dispute.description && (
                <div>
                  <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Dispute description</p>
                  <p className="text-sm text-deep-slate bg-white border border-pebble-grey/10 rounded-xl p-3 leading-relaxed">
                    {dispute.description}
                  </p>
                </div>
              )}

              {/* Statements */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Owner's statement</p>
                  <div className="bg-white border border-pebble-grey/10 rounded-xl p-3 min-h-[60px]">
                    {dispute.owner_comment ? (
                      <p className="text-sm text-deep-slate leading-relaxed">{dispute.owner_comment}</p>
                    ) : (
                      <p className="text-sm text-pebble-grey italic">No statement yet</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Groomer's statement</p>
                  <div className="bg-white border border-pebble-grey/10 rounded-xl p-3 min-h-[60px]">
                    {dispute.groomer_comment ? (
                      <p className="text-sm text-deep-slate leading-relaxed">{dispute.groomer_comment}</p>
                    ) : (
                      <p className="text-sm text-pebble-grey italic">No statement yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin notes + status */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Admin notes (internal)</label>
                  <textarea
                    className="field w-full min-h-[80px] resize-y text-sm"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Internal notes…"
                  />
                </div>
                <div className="sm:w-52">
                  <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Status</label>
                  <select
                    className="field w-full"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DisputeStatus)}
                  >
                    <option value="pending">Pending</option>
                    <option value="open">Open</option>
                    <option value="in_review">In Review</option>
                    <option value="awaiting_agreement">Awaiting Agreement</option>
                    <option value="final_review">Final Review</option>
                    <option value="awaiting_final_agreement">Awaiting Final Agreement</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <div className="mt-2 flex justify-end">
                    <button
                      className="btn-secondary text-xs px-3 py-1.5"
                      onClick={handleSave}
                      disabled={savePending}
                    >
                      {savePending ? "Saving…" : "Save notes/status"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Resolution panel — context-sensitive */}
              {(status === "in_review" || status === "open") && (
                <div className="border border-groomr-gold/40 bg-groomr-gold/5 rounded-[14px] p-4 space-y-3">
                  <p className="text-xs font-bold text-deep-slate uppercase tracking-wider">Propose Resolution (Round 1)</p>
                  <textarea
                    className="field w-full min-h-[100px] resize-y text-sm"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Describe your proposed resolution. This will be sent to both parties…"
                  />
                  <button
                    className="btn-primary text-sm"
                    onClick={handleProposeResolution}
                    disabled={proposeResoPending || !resolution.trim()}
                  >
                    {proposeResoPending ? "Sending…" : "Send resolution to both parties →"}
                  </button>
                </div>
              )}

              {status === "awaiting_agreement" && dispute.proposed_resolution && (
                <div className="border border-blue-200 bg-blue-50 rounded-[14px] p-4 space-y-3">
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Resolution Sent (Round 1)</p>
                  <p className="text-sm text-deep-slate bg-white border border-blue-100 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                    {dispute.proposed_resolution}
                  </p>
                  <div className="flex items-center gap-4">
                    <AgreementBadge agreed={dispute.owner_agreed} label="Owner" />
                    <AgreementBadge agreed={dispute.groomer_agreed} label="Groomer" />
                  </div>
                </div>
              )}

              {(status === "final_review") && (
                <div className="border border-orange-300 bg-orange-50 rounded-[14px] p-4 space-y-3">
                  <p className="text-xs font-bold text-orange-800 uppercase tracking-wider">Send Final Resolution</p>
                  <p className="text-xs text-orange-700">At least one party rejected the initial proposal. This final resolution email will include a platform-removal warning.</p>
                  <textarea
                    className="field w-full min-h-[100px] resize-y text-sm"
                    value={finalRes}
                    onChange={(e) => setFinalRes(e.target.value)}
                    placeholder="Write your final, binding resolution…"
                  />
                  <button
                    className="btn-primary text-sm bg-orange-600 hover:bg-orange-700 focus:ring-orange-400"
                    onClick={handleFinalResolution}
                    disabled={finalResoPending || !finalRes.trim()}
                  >
                    {finalResoPending ? "Sending…" : "Send final resolution to both parties →"}
                  </button>
                </div>
              )}

              {status === "awaiting_final_agreement" && dispute.final_resolution && (
                <div className="border border-red-200 bg-red-50 rounded-[14px] p-4 space-y-3">
                  <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Final Resolution Sent</p>
                  <p className="text-sm text-deep-slate bg-white border border-red-100 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                    {dispute.final_resolution}
                  </p>
                  <div className="flex items-center gap-4">
                    <AgreementBadge agreed={dispute.owner_agreed_final} label="Owner" />
                    <AgreementBadge agreed={dispute.groomer_agreed_final} label="Groomer" />
                  </div>
                  <button
                    className="btn-primary text-sm"
                    onClick={handleClose}
                    disabled={closePending}
                  >
                    {closePending ? "Closing…" : "Close dispute as resolved"}
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

export function DisputesTab({ initialDisputes }: { initialDisputes: AdminDisputeRow[] }) {
  const [disputes, setDisputes] = useState<AdminDisputeRow[]>(initialDisputes);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? disputes : disputes.filter((d) => d.status === filter);

  function handleUpdated(updated: AdminDisputeRow) {
    setDisputes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }

  // Stats
  const counts = {
    pending: disputes.filter((d) => d.status === "pending").length,
    open: disputes.filter((d) => d.status === "open").length,
    in_review: disputes.filter((d) => d.status === "in_review").length,
    final_review: disputes.filter((d) => d.status === "final_review").length,
    resolved: disputes.filter((d) => d.status === "resolved").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: "Total", value: disputes.length, tone: "" },
          { label: "Pending", value: counts.pending, tone: "pebble" },
          { label: "Open", value: counts.open, tone: "terra" },
          { label: "In Review", value: counts.in_review, tone: "gold" },
          { label: "Final Review", value: counts.final_review, tone: "orange" },
        ].map(({ label, value, tone }) => (
          <div
            key={label}
            className={`bg-white border rounded-[14px] p-3 sm:p-4 space-y-0.5 ${
              tone === "terra" && value > 0
                ? "border-muted-terracotta/30 bg-muted-terracotta/5"
                : tone === "orange" && value > 0
                ? "border-orange-200 bg-orange-50"
                : "border-pebble-grey/20"
            }`}
          >
            <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider">{label}</p>
            <p className={`font-fredoka text-2xl sm:text-3xl leading-tight ${
              tone === "terra" && value > 0 ? "text-muted-terracotta" :
              tone === "orange" && value > 0 ? "text-orange-700" : "text-deep-slate"
            }`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {ALL_STATUSES.map((f) => {
          const count = f.id === "all" ? undefined : disputes.filter((d) => d.status === f.id).length;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors focus-ring ${
                filter === f.id
                  ? "bg-deep-slate text-alabaster-cream border-deep-slate"
                  : "bg-white text-deep-slate border-pebble-grey/30 hover:bg-alabaster-cream"
              }`}
            >
              {f.label}
              {count !== undefined && <span className="ml-1.5 opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Table */}
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
