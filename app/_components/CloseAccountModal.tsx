"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { exportAccountData, closeOwnerAccount, closeGroomerAccount } from "@/app/actions/close-account";
import { CheckIcon, TrashIcon, CloseIcon } from "@/components/ui/GroomrIcons";

type Step = "confirm" | "closing";

interface Props {
  open: boolean;
  onClose: () => void;
  role: "owner" | "groomer";
}

export function CloseAccountModal({ open, onClose, role }: Props) {
  const [step, setStep] = useState<Step>("confirm");
  const [typed, setTyped] = useState("");
  const [exported, setExported] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const confirmed = typed.trim().toUpperCase() === "DELETE";

  function handleClose() {
    setStep("confirm");
    setTyped("");
    setExported(false);
    setError(null);
    onClose();
  }

  async function handleExport() {
    setExporting(true);
    const result = await exportAccountData();
    setExporting(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    // Trigger browser download
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `groomr-data-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  }

  function handleDelete() {
    if (!confirmed) return;
    setStep("closing");
    startTransition(async () => {
      const action = role === "groomer" ? closeGroomerAccount : closeOwnerAccount;
      const result = await action();
      if (result?.error) {
        setError(result.error);
        setStep("confirm");
      }
      // On success the server redirects to "/" — nothing more needed here
    });
  }

  return (
    <Modal open={open} onClose={handleClose} size="md">
      {step === "closing" ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-pebble-grey/30 border-t-muted-terracotta animate-spin" />
          <p className="font-fredoka text-2xl text-deep-slate">Closing account…</p>
          <p className="text-sm text-pebble-grey font-bold">This only takes a moment.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted-terracotta/15 flex items-center justify-center shrink-0">
              <TrashIcon size={18} className="text-muted-terracotta" />
            </div>
            <div>
              <h2 className="font-fredoka text-2xl text-deep-slate">Close your account</h2>
              <p className="text-sm text-pebble-grey font-bold mt-0.5">This is permanent and cannot be undone.</p>
            </div>
          </div>

          {/* What gets deleted */}
          <div className="bg-muted-terracotta/8 border border-muted-terracotta/20 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-terracotta">What will be deleted</p>
            <ul className="space-y-1.5 text-sm text-deep-slate">
              {role === "owner" ? (
                <>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-terracotta shrink-0" />Your profile and account details</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-terracotta shrink-0" />All your dogs and their records</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-terracotta shrink-0" />Your booking history</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-terracotta shrink-0" />Saved favourites</li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-terracotta shrink-0" />Your profile and business details</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-terracotta shrink-0" />All services and availability</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-terracotta shrink-0" />All bookings and client records</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-terracotta shrink-0" />Reviews and earnings history</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-terracotta shrink-0" />Team members and time blocks</li>
                </>
              )}
            </ul>
          </div>

          {/* Export */}
          <div className="bg-white border border-pebble-grey/20 rounded-2xl p-4">
            <p className="text-sm font-bold text-deep-slate mb-1">Export your data first</p>
            <p className="text-xs text-pebble-grey mb-3">Download a copy of everything — dogs, bookings, profile — as a JSON file before it&apos;s gone.</p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 text-sm font-bold text-deep-slate border border-pebble-grey/25 px-4 py-2 rounded-full hover:border-deep-slate transition-colors focus-ring disabled:opacity-50"
            >
              {exported
                ? <><CheckIcon size={14} className="text-sage-leaf" /> Downloaded</>
                : exporting
                ? "Exporting…"
                : "Download my data"}
            </button>
          </div>

          {/* Confirm */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-deep-slate block">
              Type DELETE to confirm
            </label>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder="DELETE"
              className="field w-full font-bold tracking-widest"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-muted-terracotta bg-muted-terracotta/10 border border-muted-terracotta/20 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleDelete}
              disabled={!confirmed || isPending}
              className="bg-muted-terracotta text-white font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring hover:bg-muted-terracotta/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <TrashIcon size={14} /> Close my account
            </button>
            <button
              onClick={handleClose}
              className="btn-secondary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring flex items-center gap-2"
            >
              <CloseIcon size={14} /> Cancel
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
