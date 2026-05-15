"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";

const REASONS = [
  "Inaccurate information",
  "Inappropriate content",
  "Scam or fraud",
  "No longer in business",
  "Other",
];

export function ReportButton({ groomerName }: { groomerName: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function handleClose() {
    setOpen(false);
    setReason("");
    setMessage("");
    setSubmitted(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setToast("Thanks — we'll review this report.");
    setTimeout(handleClose, 2000);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-bold text-pebble-grey border border-pebble-grey/30 px-4 py-2 rounded-full hover:border-muted-terracotta hover:text-muted-terracotta transition-colors focus-ring"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H12.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
        Report this listing
      </button>

      <Modal open={open} onClose={handleClose} size="sm">
        {submitted ? (
          <div className="text-center py-6 space-y-2">
            <p className="font-fredoka text-2xl text-deep-slate">Report received</p>
            <p className="text-pebble-grey text-sm">
              We&apos;ll look into this listing shortly. Thank you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="font-fredoka text-2xl text-deep-slate">Report listing</h2>
              <p className="text-pebble-grey text-sm mt-1">{groomerName}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-deep-slate">Reason</label>
              <select
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="field w-full"
              >
                <option value="">Select a reason…</option>
                {REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-deep-slate">
                Additional details{" "}
                <span className="font-normal text-pebble-grey">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="field w-full resize-none"
                placeholder="Tell us more…"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full font-nunito font-bold py-2.5 rounded-full text-sm"
            >
              Submit report
            </button>
          </form>
        )}
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
