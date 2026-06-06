"use client";

import { useState, useTransition } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@/components/ui/GroomrIcons";
import { Toast } from "@/components/ui/Toast";
import { adminUpdateVerificationStatus } from "@/app/actions/admin";
import type { AdminGroomerRow } from "@/app/actions/admin";

type VerificationStatus = "not_submitted" | "awaiting" | "verified" | "revoked_temp" | "revoked_perm";

const STATUS_LABEL: Record<string, string> = {
  not_submitted: "Not submitted",
  awaiting: "Awaiting review",
  verified: "Verified",
  revoked_temp: "Revoked (temp)",
  revoked_perm: "Revoked (perm)",
};

const STATUS_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: "not_submitted", label: "Not submitted" },
  { value: "awaiting", label: "Awaiting review" },
  { value: "verified", label: "Verified" },
  { value: "revoked_temp", label: "Revoke temporarily" },
  { value: "revoked_perm", label: "Revoke permanently" },
];

function GroomerVerificationRow({
  groomer,
  onStatusChanged,
}: {
  groomer: AdminGroomerRow;
  onStatusChanged: (id: string, status: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as VerificationStatus;
    startTransition(async () => {
      const result = await adminUpdateVerificationStatus(groomer.groomer_profile_id, next);
      if ("error" in result) {
        setToast(result.error);
      } else {
        onStatusChanged(groomer.groomer_profile_id, next);
        setToast(`Status updated to "${STATUS_LABEL[next]}"`);
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 py-2.5 border-b border-pebble-grey/10 last:border-0">
        <div className="min-w-0">
          <p className="font-bold text-deep-slate text-sm leading-tight truncate">{groomer.business_name}</p>
          <p className="text-xs text-pebble-grey">{groomer.owner_name} · {groomer.email}</p>
        </div>
        <select
          className="field text-xs py-1 pl-2 pr-6 shrink-0"
          value={groomer.verification_status}
          onChange={handleChange}
          disabled={pending}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
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
        <div className="flex items-center gap-3">
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
        {expanded ? <ChevronDownIcon size={16} className="text-pebble-grey shrink-0" /> : <ChevronRightIcon size={16} className="text-pebble-grey shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-4 border-t border-pebble-grey/10 space-y-4 pt-4">
          {awaiting.length > 0 && (
            <div>
              <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-2">Awaiting your review</p>
              {awaiting.map((g) => (
                <GroomerVerificationRow key={g.groomer_profile_id} groomer={g} onStatusChanged={onStatusChanged} />
              ))}
            </div>
          )}
          {notSubmitted.length > 0 && (
            <div>
              <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-2">Documents not yet submitted</p>
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
