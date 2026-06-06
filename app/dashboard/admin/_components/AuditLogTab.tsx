"use client";

import { useState, useTransition } from "react";
import { adminGetAuditLog } from "@/app/actions/admin";
import type { AdminAuditEntry } from "@/app/actions/admin";

const ACTION_LABELS: Record<string, string> = {
  verify_groomer: "Verified groomer",
  revoke_groomer_verification: "Revoked groomer verification",
  update_groomer_profile: "Updated groomer profile",
  update_user_profile: "Updated user profile",
  cancel_appointment: "Cancelled appointment",
  delete_dog: "Deleted dog",
  delete_service: "Deleted service",
  reply_support_request: "Replied to support request",
  revoke_admin: "Revoked admin access",
  grant_admin: "Granted admin access",
  update_platform_settings: "Updated platform settings",
};

const ACTION_TONES: Record<string, string> = {
  verify_groomer: "text-sage-leaf",
  revoke_groomer_verification: "text-muted-terracotta",
  cancel_appointment: "text-muted-terracotta",
  delete_dog: "text-muted-terracotta",
  delete_service: "text-muted-terracotta",
  revoke_admin: "text-muted-terracotta",
  grant_admin: "text-sage-leaf",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MetadataCell({ metadata }: { metadata: Record<string, unknown> }) {
  const keys = Object.keys(metadata);
  if (keys.length === 0) return <span className="text-pebble-grey">—</span>;
  return (
    <span className="text-xs text-pebble-grey font-mono">
      {keys.map((k) => `${k}: ${JSON.stringify(metadata[k])}`).join(", ")}
    </span>
  );
}

interface Props {
  initialEntries: AdminAuditEntry[];
}

export function AuditLogTab({ initialEntries }: Props) {
  const [entries, setEntries] = useState<AdminAuditEntry[]>(initialEntries);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialEntries.length === 50);
  const [filterAction, setFilterAction] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

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

  const actionOptions = ["all", ...Object.keys(ACTION_LABELS)];
  const filtered =
    filterAction === "all"
      ? entries
      : entries.filter((e) => e.action === filterAction);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-pebble-grey uppercase tracking-wider shrink-0">
          Filter:
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {actionOptions.slice(0, 7).map((a) => (
            <button
              key={a}
              onClick={() => setFilterAction(a)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors focus-ring ${
                filterAction === a
                  ? "bg-deep-slate text-alabaster-cream"
                  : "bg-pebble-grey/10 text-pebble-grey hover:bg-pebble-grey/20"
              }`}
            >
              {a === "all" ? "All" : ACTION_LABELS[a] ?? a}
            </button>
          ))}
          {actionOptions.length > 7 && filterAction !== "all" && !actionOptions.slice(0, 7).includes(filterAction) && (
            <button
              className="px-3 py-1 rounded-full text-xs font-bold bg-deep-slate text-alabaster-cream"
            >
              {ACTION_LABELS[filterAction] ?? filterAction}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
        {filtered.length === 0 ? (
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
                  <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden xl:table-cell">
                    Details
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">
                    When
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pebble-grey/10">
                {filtered.map((entry) => {
                  const tone = ACTION_TONES[entry.action] ?? "text-deep-slate";
                  return (
                    <tr key={entry.id} className="hover:bg-alabaster-cream/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className={`font-bold leading-tight ${tone}`}>
                          {ACTION_LABELS[entry.action] ?? entry.action}
                        </p>
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
                      <td className="px-4 py-3 hidden xl:table-cell max-w-[200px]">
                        <MetadataCell metadata={entry.metadata} />
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-pebble-grey whitespace-nowrap">
                        {formatDateTime(entry.created_at)}
                      </td>
                    </tr>
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
