"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { adminGetAuditLog } from "@/app/actions/admin";
import type { AdminAuditEntry } from "@/app/actions/admin";

const ACTION_LABELS: Record<string, string> = {
  // Account
  update_user_profile: "Updated user profile",
  update_groomer_profile: "Updated groomer profile",
  delete_owner: "Deactivated owner account",
  delete_groomer: "Deactivated groomer account",
  send_password_reset: "Sent password reset",
  contact_user: "Contacted user",
  // Groomer verification
  verify_groomer: "Verified groomer",
  revoke_groomer_verification: "Revoked groomer verification",
  update_verification_status: "Updated verification status",
  send_verification_reminder: "Sent verification reminder",
  update_availability: "Updated availability",
  // Dogs & services
  add_dog: "Added dog",
  update_dog: "Updated dog",
  delete_dog: "Deleted dog",
  add_service: "Added service",
  update_service: "Updated service",
  delete_service: "Deleted service",
  // Appointments & payments
  cancel_appointment: "Cancelled appointment",
  edit_appointment_notes: "Edited appointment notes",
  mark_no_show: "Marked as no-show",
  initiate_refund: "Initiated refund",
  // Disputes
  update_dispute_status: "Updated dispute status",
  propose_resolution: "Proposed dispute resolution",
  send_final_resolution: "Sent final resolution",
  close_dispute: "Closed dispute",
  // Support
  reply_support_request: "Replied to support request",
  update_support_request: "Updated support request",
  // Admin & platform
  grant_admin: "Granted admin access",
  revoke_admin: "Revoked admin access",
  update_platform_settings: "Updated platform settings",
  // System
  stripe_webhook_error: "Stripe webhook error",
};

const ACTION_TONES: Record<string, string> = {
  verify_groomer: "text-sage-leaf",
  grant_admin: "text-sage-leaf",
  close_dispute: "text-sage-leaf",
  revoke_groomer_verification: "text-muted-terracotta",
  delete_owner: "text-muted-terracotta",
  delete_groomer: "text-muted-terracotta",
  cancel_appointment: "text-muted-terracotta",
  delete_dog: "text-muted-terracotta",
  delete_service: "text-muted-terracotta",
  revoke_admin: "text-muted-terracotta",
  initiate_refund: "text-muted-terracotta",
  mark_no_show: "text-muted-terracotta",
  stripe_webhook_error: "text-muted-terracotta",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// Human-readable detail lines derived from action + metadata
function buildDetailLines(action: string, metadata: Record<string, unknown>): string[] {
  const lines: string[] = [];
  const m = metadata as Record<string, string | number | undefined>;

  // Shared entity fields logged across many actions
  if (m.groomer) lines.push(`Groomer: ${m.groomer}`);
  if (m.owner)   lines.push(`Owner: ${m.owner}`);
  if (m.name && !m.groomer && !m.owner) lines.push(`Name: ${m.name}`);
  if (m.email)   lines.push(`Email: ${m.email}`);
  if (m.dog)     lines.push(`Dog: ${m.dog}`);
  if (m.service) lines.push(`Service: ${m.service}`);
  if (m.scheduled_at) lines.push(`Appointment: ${fmtDate(String(m.scheduled_at))}`);

  // Action-specific fields
  switch (action) {
    case "cancel_appointment":
      if (m.reason) lines.push(`Reason: ${m.reason}`);
      break;
    case "contact_user":
      if (m.to) lines.push(`To: ${m.to}`);
      if (m.subject) lines.push(`Subject: ${m.subject}`);
      break;
    case "update_dispute_status":
      if (m.status) lines.push(`New status: ${m.status}`);
      break;
    case "update_verification_status":
      if (m.from) lines.push(`From: ${m.from}`);
      if (m.to)   lines.push(`To: ${m.to}`);
      break;
    case "update_platform_settings":
      if (m.platform_fee_pct !== undefined)
        lines.push(`Fee: ${(Number(m.platform_fee_pct) * 100).toFixed(1)}%`);
      if (m.signup_incentive_bookings !== undefined)
        lines.push(`Incentive: ${m.signup_incentive_bookings} bookings`);
      break;
    case "add_dog":
    case "update_dog":
    case "delete_dog":
      // dog name already covered above
      break;
    case "add_service":
    case "update_service":
    case "delete_service":
      if (m.name) lines.push(`Service: ${m.name}`);
      break;
    case "send_password_reset":
      // email already covered above
      break;
    case "stripe_webhook_error":
      if (m.event_type) lines.push(`Event: ${m.event_type}`);
      if (m.error) lines.push(`Error: ${m.error}`);
      break;
    default:
      // For unknown actions, show any remaining keys not already covered
      const covered = new Set(["groomer","owner","name","email","dog","service","scheduled_at"]);
      for (const [k, v] of Object.entries(metadata)) {
        if (!covered.has(k) && v !== null && v !== undefined && v !== "")
          lines.push(`${k}: ${JSON.stringify(v)}`);
      }
  }
  return lines;
}

function formatDateTimeFull(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
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

interface Props {
  initialEntries: AdminAuditEntry[];
  loadError: string | null;
}

export function AuditLogTab({ initialEntries, loadError }: Props) {
  const [entries, setEntries] = useState<AdminAuditEntry[]>(initialEntries);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialEntries.length === 50);
  const [filterAction, setFilterAction] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newCount, setNewCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Poll for new entries every 5 seconds
  const poll = useCallback(async () => {
    const result = await adminGetAuditLog(0);
    if ("error" in result) return;
    setEntries((prev) => {
      const existingIds = new Set(prev.map((e) => e.id));
      const fresh = result.data.filter((e) => !existingIds.has(e.id));
      if (fresh.length === 0) return prev;
      setNewCount((n) => n + fresh.length);
      return [...fresh, ...prev];
    });
  }, []);

  useEffect(() => {
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [poll]);

  function loadMore() {
    const nextPage = page + 1;
    startTransition(async () => {
      const result = await adminGetAuditLog(nextPage);
      if ("error" in result) return;
      setEntries((prev) => [...prev, ...result.data]);
      setHasMore(result.data.length === 50);
      setPage(nextPage);
    });
  }

  const knownActions = Object.keys(ACTION_LABELS);
  const unknownActions = [...new Set(entries.map((e) => e.action))].filter(
    (a) => !knownActions.includes(a)
  );
  const actionOptions = ["all", ...knownActions, ...unknownActions];
  const filtered =
    filterAction === "all"
      ? entries
      : entries.filter((e) => e.action === filterAction);

  return (
    <div className="space-y-4">
      {/* Filter + live indicator */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-pebble-grey uppercase tracking-wider shrink-0">
          Filter:
        </span>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="field text-sm py-1.5 pr-8 min-w-[200px]"
        >
          <option value="all">All actions</option>
          {actionOptions.slice(1).map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a] ?? a}
            </option>
          ))}
        </select>
        {filterAction !== "all" && (
          <button
            onClick={() => setFilterAction("all")}
            className="text-xs text-pebble-grey hover:text-deep-slate transition-colors"
          >
            Clear
          </button>
        )}
        <span className="ml-auto flex items-center gap-1.5 text-xs text-pebble-grey">
          <span className="w-1.5 h-1.5 rounded-full bg-sage-leaf animate-pulse" />
          Live
          {newCount > 0 && (
            <button
              onClick={() => setNewCount(0)}
              className="ml-1 px-1.5 py-0.5 rounded-full bg-groomr-gold/30 text-deep-slate font-bold text-[10px]"
            >
              +{newCount} new
            </button>
          )}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
        {loadError ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-pebble-grey font-bold">Failed to load audit log.</p>
            <p className="text-xs text-muted-terracotta font-mono bg-muted-terracotta/10 px-3 py-2 rounded-lg inline-block">
              {loadError}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-pebble-grey font-bold">No audit entries yet.</p>
            <p className="text-xs text-pebble-grey mt-1">
              Actions taken in this admin dashboard will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pebble-grey/10">
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">
                    Action
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden md:table-cell">
                    Admin
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden lg:table-cell">
                    Target
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">
                    When
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pebble-grey/10">
                {filtered.map((entry) => {
                  const tone = ACTION_TONES[entry.action] ?? "text-deep-slate";
                  const isExpanded = expanded === entry.id;
                  const detailLines = buildDetailLines(entry.action, entry.metadata);

                  return (
                    <>
                      <tr
                        key={entry.id}
                        onClick={() => setExpanded(isExpanded ? null : entry.id)}
                        className="hover:bg-alabaster-cream/50 transition-colors cursor-pointer select-none"
                      >
                        <td className="px-4 py-3">
                          <p className={`font-bold leading-tight ${tone}`}>
                            {ACTION_LABELS[entry.action] ?? entry.action}
                          </p>
                          {/* Show detail summary inline on mobile */}
                          {detailLines.length > 0 && (
                            <p className="text-[11px] text-pebble-grey mt-0.5 md:hidden truncate">
                              {detailLines[0]}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-deep-slate font-bold leading-tight">
                            {entry.admin_name ?? "—"}
                          </p>
                          {entry.admin_email && (
                            <p className="text-xs text-pebble-grey">{entry.admin_email}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {entry.target_table ? (
                            <div>
                              <p className="text-xs text-pebble-grey font-mono">{entry.target_table}</p>
                              {entry.target_id && (
                                <p className="text-xs text-pebble-grey/60 font-mono truncate max-w-[120px]">
                                  {entry.target_id.slice(0, 8)}…
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-pebble-grey">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-pebble-grey whitespace-nowrap">
                          {formatDateTime(entry.created_at)}
                          <span className="block text-[10px] text-pebble-grey/50 mt-0.5">
                            {isExpanded ? "▲ collapse" : "▼ details"}
                          </span>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${entry.id}-detail`} className="bg-alabaster-cream/60">
                          <td colSpan={4} className="px-6 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-sm">
                              <div>
                                <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider mb-1">Action</p>
                                <p className={`font-bold ${tone}`}>{ACTION_LABELS[entry.action] ?? entry.action}</p>
                                <p className="text-xs text-pebble-grey font-mono mt-0.5">{entry.action}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider mb-1">Admin</p>
                                <p className="font-bold text-deep-slate">{entry.admin_name ?? "—"}</p>
                                {entry.admin_email && <p className="text-xs text-pebble-grey">{entry.admin_email}</p>}
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider mb-1">Time</p>
                                <p className="text-deep-slate">{formatDateTimeFull(entry.created_at)}</p>
                              </div>
                              {entry.target_table && (
                                <div>
                                  <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider mb-1">Target</p>
                                  <p className="text-xs font-mono text-pebble-grey">{entry.target_table}</p>
                                  {entry.target_id && (
                                    <p className="text-xs font-mono text-pebble-grey/70 break-all">{entry.target_id}</p>
                                  )}
                                </div>
                              )}
                              {detailLines.length > 0 && (
                                <div className="sm:col-span-2">
                                  <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider mb-1">Details</p>
                                  <ul className="space-y-0.5">
                                    {detailLines.map((line, i) => (
                                      <li key={i} className="text-xs text-deep-slate">{line}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Load more */}
      {hasMore && filtered.length === entries.length && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            {isPending ? "Loading…" : "Load more entries"}
          </button>
        </div>
      )}
    </div>
  );
}
