"use client";

import { useState, useTransition } from "react";
import { Toast } from "@/components/ui/Toast";
import { submitDisputeComment, respondToDisputeResolution } from "@/app/actions/disputes";
import type { DisputeView } from "@/app/actions/disputes";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type DisputeStatus = DisputeView["status"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  open: "Open",
  in_review: "In Review",
  awaiting_agreement: "Awaiting Agreement",
  final_review: "Final Review",
  awaiting_final_agreement: "Awaiting Final Agreement",
  resolved: "Resolved",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-pebble-grey/10 text-pebble-grey border-pebble-grey/30",
  open: "bg-muted-terracotta/10 text-muted-terracotta border-muted-terracotta/30",
  in_review: "bg-groomr-gold/20 text-deep-slate border-groomr-gold/40",
  awaiting_agreement: "bg-blue-50 text-blue-700 border-blue-200",
  final_review: "bg-orange-50 text-orange-700 border-orange-200",
  awaiting_final_agreement: "bg-red-50 text-red-700 border-red-200",
  resolved: "bg-sage-leaf/10 text-sage-leaf border-sage-leaf/30",
};

interface Props {
  dispute: DisputeView;
}

export function DisputeResponseClient({ dispute: initial }: Props) {
  const [dispute, setDispute] = useState(initial);
  const [toast, setToast] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [commentPending, startCommentTransition] = useTransition();
  const [responsePending, startResponseTransition] = useTransition();

  const myComment = dispute.viewer_role === "owner" ? dispute.owner_comment : dispute.groomer_comment;
  const theirComment = dispute.viewer_role === "owner" ? dispute.groomer_comment : dispute.owner_comment;
  const theirName = dispute.viewer_role === "owner" ? dispute.groomer_name : dispute.owner_name;
  const myAgreed = dispute.viewer_role === "owner" ? dispute.owner_agreed : dispute.groomer_agreed;
  const myAgreedFinal = dispute.viewer_role === "owner" ? dispute.owner_agreed_final : dispute.groomer_agreed_final;

  function handleSubmitComment() {
    if (!comment.trim()) return;
    startCommentTransition(async () => {
      const result = await submitDisputeComment(dispute.id, comment.trim());
      if ("error" in result) {
        setToast(result.error);
      } else {
        const updatedComment = comment.trim();
        setComment("");
        setToast("Comment submitted.");
        setDispute((prev) => ({
          ...prev,
          owner_comment: prev.viewer_role === "owner" ? updatedComment : prev.owner_comment,
          groomer_comment: prev.viewer_role === "groomer" ? updatedComment : prev.groomer_comment,
          status: (prev.owner_comment || prev.viewer_role === "owner") &&
                  (prev.groomer_comment || prev.viewer_role === "groomer") &&
                  prev.status === "pending" ? "open" : prev.status,
        }));
      }
    });
  }

  function handleRespond(agreed: boolean) {
    startResponseTransition(async () => {
      const result = await respondToDisputeResolution(dispute.id, agreed);
      if ("error" in result) {
        setToast(result.error);
      } else {
        setToast(agreed ? "You have accepted the resolution." : "You have declined the resolution.");
        setDispute((prev) => {
          if (prev.status === "awaiting_agreement") {
            const ownerAgreed = prev.viewer_role === "owner" ? agreed : prev.owner_agreed;
            const groomerAgreed = prev.viewer_role === "groomer" ? agreed : prev.groomer_agreed;
            const newStatus = ownerAgreed === true && groomerAgreed === true
              ? "resolved"
              : ownerAgreed === false || groomerAgreed === false
              ? "final_review"
              : prev.status;
            return {
              ...prev,
              owner_agreed: ownerAgreed ?? null,
              groomer_agreed: groomerAgreed ?? null,
              status: newStatus as DisputeStatus,
            };
          } else {
            return {
              ...prev,
              owner_agreed_final: prev.viewer_role === "owner" ? agreed : prev.owner_agreed_final,
              groomer_agreed_final: prev.viewer_role === "groomer" ? agreed : prev.groomer_agreed_final,
            };
          }
        });
      }
    });
  }

  const isAwaitingRes = dispute.status === "awaiting_agreement";
  const isAwaitingFinal = dispute.status === "awaiting_final_agreement";
  const showResolutionSection = isAwaitingRes || isAwaitingFinal || dispute.status === "resolved";

  return (
    <div className="page-fade min-h-screen bg-alabaster-cream/50">
      <div className="w-full max-w-2xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h1 className="font-fredoka text-2xl md:text-3xl text-deep-slate leading-tight">
              {dispute.subject}
            </h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${STATUS_COLORS[dispute.status] ?? STATUS_COLORS.open}`}>
              {STATUS_LABELS[dispute.status] ?? dispute.status}
            </span>
          </div>
          <p className="text-sm text-pebble-grey">Raised on {formatDate(dispute.created_at)}</p>
        </div>

        {/* Party cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`bg-white border rounded-[16px] p-4 space-y-0.5 ${dispute.viewer_role === "owner" ? "border-groomr-gold/50 ring-1 ring-groomr-gold/20" : "border-pebble-grey/20"}`}>
            <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider">Owner</p>
            <p className="font-bold text-deep-slate text-sm leading-snug">{dispute.owner_name ?? "Unknown"}</p>
            {dispute.viewer_role === "owner" && <p className="text-[10px] text-groomr-gold font-bold">You</p>}
          </div>
          <div className={`bg-white border rounded-[16px] p-4 space-y-0.5 ${dispute.viewer_role === "groomer" ? "border-groomr-gold/50 ring-1 ring-groomr-gold/20" : "border-pebble-grey/20"}`}>
            <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider">Groomer</p>
            <p className="font-bold text-deep-slate text-sm leading-snug">{dispute.groomer_name ?? "Unknown"}</p>
            {dispute.viewer_role === "groomer" && <p className="text-[10px] text-groomr-gold font-bold">You</p>}
          </div>
        </div>

        {/* Dispute description */}
        {dispute.description && (
          <div className="bg-white border border-pebble-grey/20 rounded-[16px] p-5 space-y-2">
            <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">Dispute details</p>
            <p className="text-sm text-deep-slate leading-relaxed">{dispute.description}</p>
          </div>
        )}

        {/* Statements */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">Statements</p>

          {/* My comment */}
          <div className="bg-white border border-pebble-grey/20 rounded-[16px] p-5 space-y-3">
            <p className="text-xs font-bold text-deep-slate">Your statement</p>
            {myComment ? (
              <p className="text-sm text-deep-slate leading-relaxed bg-alabaster-cream rounded-xl p-3">{myComment}</p>
            ) : dispute.status === "resolved" ? (
              <p className="text-sm text-pebble-grey italic">No statement submitted.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-pebble-grey">Please provide your account of what happened. This will be reviewed by Groomr.</p>
                <textarea
                  className="field w-full min-h-[120px] resize-y text-sm"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe the situation from your perspective…"
                  disabled={commentPending}
                />
                <button
                  className="btn-primary text-sm"
                  onClick={handleSubmitComment}
                  disabled={commentPending || !comment.trim()}
                >
                  {commentPending ? "Submitting…" : "Submit statement"}
                </button>
              </div>
            )}
          </div>

          {/* Their comment */}
          <div className="bg-white border border-pebble-grey/20 rounded-[16px] p-5 space-y-2">
            <p className="text-xs font-bold text-deep-slate">{theirName ?? "Other party"}'s statement</p>
            {theirComment ? (
              <p className="text-sm text-deep-slate leading-relaxed bg-alabaster-cream rounded-xl p-3">{theirComment}</p>
            ) : (
              <p className="text-sm text-pebble-grey italic">Awaiting their response…</p>
            )}
          </div>
        </div>

        {/* Resolution section */}
        {showResolutionSection && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
              {isAwaitingFinal ? "Final Resolution" : "Proposed Resolution"}
            </p>

            {/* Final resolution warning */}
            {isAwaitingFinal && (
              <div className="bg-red-50 border border-red-200 rounded-[16px] p-4 flex gap-3">
                <span className="text-red-600 mt-0.5 shrink-0">⚠</span>
                <p className="text-sm text-red-800 leading-relaxed">
                  <strong>This is Groomr's final decision.</strong> Continued non-compliance with this resolution may result in removal from the Groomr platform.
                </p>
              </div>
            )}

            {/* Resolution text */}
            <div className={`border rounded-[16px] p-5 space-y-3 ${isAwaitingFinal ? "bg-orange-50 border-orange-200" : "bg-groomr-gold/10 border-groomr-gold/40"}`}>
              <p className="text-sm text-deep-slate leading-relaxed whitespace-pre-wrap">
                {isAwaitingFinal ? dispute.final_resolution : dispute.proposed_resolution}
              </p>
            </div>

            {/* Response buttons */}
            {(isAwaitingRes || isAwaitingFinal) && (
              <div>
                {(isAwaitingRes ? myAgreed : myAgreedFinal) !== null && (isAwaitingRes ? myAgreed : myAgreedFinal) !== undefined ? (
                  <div className={`rounded-[12px] px-4 py-3 text-sm font-bold border ${(isAwaitingRes ? myAgreed : myAgreedFinal) ? "bg-sage-leaf/10 text-sage-leaf border-sage-leaf/30" : "bg-muted-terracotta/10 text-muted-terracotta border-muted-terracotta/30"}`}>
                    {(isAwaitingRes ? myAgreed : myAgreedFinal) ? "✓ You accepted this resolution" : "✗ You declined this resolution"}
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      className="flex-1 btn-primary text-sm"
                      onClick={() => handleRespond(true)}
                      disabled={responsePending}
                    >
                      {responsePending ? "…" : "I agree to this resolution"}
                    </button>
                    <button
                      className="flex-1 btn-secondary text-sm"
                      onClick={() => handleRespond(false)}
                      disabled={responsePending}
                    >
                      {responsePending ? "…" : "I do not agree"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {dispute.status === "resolved" && (
              <div className="bg-sage-leaf/10 border border-sage-leaf/30 rounded-[12px] px-4 py-3 text-sm font-bold text-sage-leaf">
                ✓ This dispute has been resolved
              </div>
            )}
          </div>
        )}

        {/* Waiting state */}
        {dispute.status === "open" && (
          <div className="bg-white border border-pebble-grey/20 rounded-[16px] p-5 text-center space-y-1">
            <p className="font-bold text-deep-slate">Under review</p>
            <p className="text-sm text-pebble-grey">Groomr is reviewing all statements. We'll be in touch once a resolution has been proposed.</p>
          </div>
        )}

        {dispute.status === "in_review" && (
          <div className="bg-white border border-pebble-grey/20 rounded-[16px] p-5 text-center space-y-1">
            <p className="font-bold text-deep-slate">In review</p>
            <p className="text-sm text-pebble-grey">Our team is actively reviewing your dispute. A resolution will be proposed soon.</p>
          </div>
        )}

        {dispute.status === "final_review" && (
          <div className="bg-orange-50 border border-orange-200 rounded-[16px] p-5 text-center space-y-1">
            <p className="font-bold text-orange-800">Awaiting final decision</p>
            <p className="text-sm text-orange-700">The resolution was not accepted by all parties. Groomr is preparing a final decision.</p>
          </div>
        )}

      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
