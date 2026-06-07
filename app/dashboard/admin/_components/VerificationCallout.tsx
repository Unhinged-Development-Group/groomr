"use client";

import { useState, useTransition } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@/components/ui/GroomrIcons";
import { Toast } from "@/components/ui/Toast";
import { adminUpdateVerificationStatus, adminSendVerificationReminder } from "@/app/actions/admin";
import type { AdminGroomerRow } from "@/app/actions/admin";

type VerificationStatus = "not_submitted" | "awaiting" | "verified" | "revoked_temp" | "revoked_perm";

function GroomerVerificationRow({
  groomer,
  onStatusChanged,
}: {
  groomer: AdminGroomerRow;
  onStatusChanged: (id: string, status: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const status = groomer.verification_status as VerificationStatus;
  const isAwaiting = status === "awaiting";
  const isNotSubmitted = status === "not_submitted";

  function setStatus(next: VerificationStatus, label: string) {
    startTransition(async () => {
      const res = await adminUpdateVerificationStatus(groomer.groomer_profile_id, next);
      if ("error" in res) { setToast(res.error); return; }
      onStatusChanged(groomer.groomer_profile_id, next);
      setToast(`${groomer.business_name}: ${label}`);
    });
  }

  function sendReminder() {
    startTransition(async () => {
      const res = await adminSendVerificationReminder(groomer.groomer_profile_id);
      if ("error" in res) { setToast(res.error); return; }
      setToast(`Reminder sent to ${groomer.email}`);
    });
  }

  return (
    <>
      <div className="py-3 border-b border-pebble-grey/10 last:border-0">
        <div className="flex items-start justify-between gap-4 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-deep-slate text-sm leading-tight truncate">{groomer.business_name}</p>
            <p className="text-xs text-pebble-grey truncate mt-0.5">{groomer.owner_name}{groomer.email ? ` · ${groomer.email}` : ""}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            {isNotSubmitted && (
              <button
                onClick={sendReminder}
                disabled={pending}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-groomr-gold/20 text-deep-slate hover:bg-groomr-gold/40 border border-groomr-gold/40 transition-colors focus-ring disabled:opacity-50"
              >
                Send reminder
              </button>
            )}
            {isAwaiting && (
              <>
                <button
                  onClick={() => setStatus("verified", "Verified")}
                  disabled={pending}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sage-leaf/10 text-sage-leaf hover:bg-sage-leaf/20 border border-sage-leaf/30 transition-colors focus-ring disabled:opacity-50"
                >
                  Verify ✓
                </button>
                <button
                  onClick={() => setStatus("not_submitted", "Denied — returned to not submitted")}
                  disabled={pending}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-pebble-grey/10 text-pebble-grey hover:bg-pebble-grey/20 border border-pebble-grey/20 transition-colors focus-ring disabled:opacity-50"
                >
                  Deny
                </button>
              </>
            )}
            <button
              onClick={() => setStatus("revoked_temp", "Revoked (temporary)")}
              disabled={pending}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-muted-terracotta/10 text-muted-terracotta hover:bg-muted-terracotta/20 border border-muted-terracotta/30 transition-colors focus-ring disabled:opacity-50"
            >
              Revoke
            </button>
          </div>
        </div>
      </div>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

interface Props {
  groomers: AdminGroomerRow[];
  onStatusChanged: (id: string, status: string) => void;
}

export function VerificationCallout({ groomers, onStatusChanged }: Props) {
  const [expanded, setExpanded] = useState(false);

  const awaiting = groomers.filter((g) => g.verification_status === "awaiting");
  const notSubmitted = groomers.filter((g) => g.verification_status === "not_submitted");
  const total = awaiting.length + notSubmitted.length;

  if (total === 0) return null;

  return (
    <div className="bg-white border border-muted-terracotta/30 rounded-[20px] overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted-terracotta/5 transition-colors"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-muted-terracotta shrink-0" />
          <span className="font-bold text-deep-slate text-sm">
            {total} groomer{total !== 1 ? "s" : ""} need{total === 1 ? "s" : ""} verification attention
          </span>
          {awaiting.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-groomr-gold/20 text-deep-slate border border-groomr-gold/40">
              {awaiting.length} awaiting review
            </span>
          )}
          {notSubmitted.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pebble-grey/10 text-pebble-grey border border-pebble-grey/20">
              {notSubmitted.length} not submitted
            </span>
          )}
        </div>
        {expanded
          ? <ChevronDownIcon size={16} className="text-pebble-grey shrink-0" />
          : <ChevronRightIcon size={16} className="text-pebble-grey shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-2 border-t border-pebble-grey/10 space-y-4 pt-4">
          {awaiting.length > 0 && (
            <div>
              <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Awaiting your review — docs submitted</p>
              {awaiting.map((g) => (
                <GroomerVerificationRow key={g.groomer_profile_id} groomer={g} onStatusChanged={onStatusChanged} />
              ))}
            </div>
          )}
          {notSubmitted.length > 0 && (
            <div>
              <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Documents not yet submitted</p>
              {notSubmitted.map((g) => (
                <GroomerVerificationRow key={g.groomer_profile_id} groomer={g} onStatusChanged={onStatusChanged} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
