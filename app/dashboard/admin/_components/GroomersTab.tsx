"use client";

import { useState, useTransition, useCallback } from "react";
import { SearchPill } from "@/components/ui/SearchPill";
import { Badge } from "@/components/ui/Badge";
import { Toast } from "@/components/ui/Toast";
import { PencilIcon } from "@/components/ui/GroomrIcons";
import { adminSendPasswordReset, adminExportGroomers, adminExportIndividualGroomer } from "@/app/actions/admin";
import { GroomerEditModal } from "./GroomerEditModal";
import { ContactModal } from "./ContactModal";
import { VerificationCallout } from "./VerificationCallout";
import { GroomerStatsBar } from "./GroomerStatsBar";
import type { AdminGroomerRow } from "@/app/actions/admin";

type ListFilter = "all" | "listed" | "unlisted" | "verified" | "awaiting" | "not_submitted";
type ListSort = "joined" | "name" | "rating";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const VERIFICATION_BADGE: Record<string, { label: string; tone: "sage" | "terra" | "grey" | "gold" }> = {
  not_submitted:  { label: "Not submitted",   tone: "grey" },
  awaiting:       { label: "Awaiting review", tone: "gold" },
  verified:       { label: "Verified",        tone: "sage" },
  revoked_temp:   { label: "Revoked (temp)",  tone: "terra" },
  revoked_perm:   { label: "Revoked (perm)",  tone: "terra" },
};

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function objectsToCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join("\n");
}

const FILTER_PILLS: { id: ListFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "listed", label: "Listed" },
  { id: "unlisted", label: "Unlisted" },
  { id: "verified", label: "Verified" },
  { id: "awaiting", label: "Awaiting" },
  { id: "not_submitted", label: "Not submitted" },
];

const SORT_PILLS: { id: ListSort; label: string }[] = [
  { id: "joined", label: "Joined" },
  { id: "name", label: "Name" },
  { id: "rating", label: "Rating" },
];

export function GroomersTab({ initialGroomers }: { initialGroomers: AdminGroomerRow[] }) {
  const [groomers, setGroomers] = useState<AdminGroomerRow[]>(initialGroomers);
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState<ListFilter>("all");
  const [listSort, setListSort] = useState<ListSort>("joined");
  const [editGroomer, setEditGroomer] = useState<AdminGroomerRow | null>(null);
  const [contactGroomer, setContactGroomer] = useState<AdminGroomerRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [exportingBulk, startBulkExport] = useTransition();
  const [resetPendingId, setResetPendingId] = useState<string | null>(null);

  const filtered = groomers
    .filter((g) => {
      if (listFilter === "listed" && !g.is_listed) return false;
      if (listFilter === "unlisted" && g.is_listed) return false;
      if (listFilter === "verified" && g.verification_status !== "verified") return false;
      if (listFilter === "awaiting" && g.verification_status !== "awaiting") return false;
      if (listFilter === "not_submitted" && g.verification_status !== "not_submitted") return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        g.business_name?.toLowerCase().includes(q) ||
        g.owner_name?.toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (listSort === "name") return (a.business_name ?? "").localeCompare(b.business_name ?? "");
      if (listSort === "rating") return (b.average_rating ?? 0) - (a.average_rating ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  function handleStatusChanged(id: string, status: string) {
    setGroomers((prev) =>
      prev.map((g) =>
        g.groomer_profile_id === id
          ? { ...g, verification_status: status, is_verified: status === "verified" }
          : g
      )
    );
  }

  function handlePasswordReset(g: AdminGroomerRow) {
    if (!g.email) return;
    setResetPendingId(g.groomer_profile_id);
    adminSendPasswordReset(g.email, g.owner_name ?? g.business_name).then((res) => {
      setResetPendingId(null);
      setToast("error" in res ? res.error : "Password reset email sent.");
    });
  }

  const handleExportBulk = useCallback(() => {
    startBulkExport(async () => {
      const res = await adminExportGroomers();
      if ("error" in res) { setToast(res.error); return; }
      const csv = objectsToCSV(res.data);
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(`groomr-groomers-${date}.csv`, csv, "text/csv");
    });
  }, []);

  async function handleExportIndividual(groomerProfileId: string, businessName: string) {
    const res = await adminExportIndividualGroomer(groomerProfileId);
    if ("error" in res) { setToast(res.error); return; }
    const date = new Date().toISOString().slice(0, 10);
    downloadBlob(
      `groomr-groomer-${businessName.toLowerCase().replace(/\s+/g, "-")}-${date}.json`,
      JSON.stringify(res.data, null, 2),
      "application/json"
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Stats bar — city filter controls numbers in bar */}
        <GroomerStatsBar groomers={groomers} />

        {/* Verification callout */}
        <VerificationCallout groomers={groomers} onStatusChanged={handleStatusChanged} />

        {/* List controls: filter pills + sort pills | search + export */}
        <div className="flex items-center gap-2 flex-wrap justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter pills */}
            <div className="flex items-center gap-1 flex-wrap">
              {FILTER_PILLS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setListFilter(f.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors focus-ring ${
                    listFilter === f.id
                      ? "bg-deep-slate text-alabaster-cream border-deep-slate"
                      : "bg-white text-pebble-grey border-pebble-grey/20 hover:border-pebble-grey/50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {/* Sort pills */}
            <div className="flex items-center gap-1 border-l border-pebble-grey/20 pl-2 ml-1">
              {SORT_PILLS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setListSort(s.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors focus-ring ${
                    listSort === s.id
                      ? "bg-groomr-gold text-deep-slate border-groomr-gold"
                      : "bg-white text-pebble-grey border-pebble-grey/20 hover:border-pebble-grey/50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-pebble-grey font-bold hidden sm:block">
              {filtered.length === groomers.length ? `${groomers.length}` : `${filtered.length}/${groomers.length}`} groomers
            </span>
            <SearchPill value={search} onChange={setSearch} placeholder="Search…" size="sm" />
            <button
              onClick={handleExportBulk}
              disabled={exportingBulk}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-pebble-grey/10 text-deep-slate hover:bg-pebble-grey/20 border border-pebble-grey/20 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {exportingBulk ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-pebble-grey font-bold">No groomers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pebble-grey/10">
                    <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">Business</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden md:table-cell">Owner</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden lg:table-cell">Joined</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">Listed</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">Verification</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pebble-grey/10">
                  {filtered.map((g) => {
                    const vBadge = VERIFICATION_BADGE[g.verification_status] ?? { label: g.verification_status, tone: "grey" as const };
                    const profileUrl = g.public_slug ? `/groomers/${g.public_slug}` : null;
                    return (
                      <tr key={g.groomer_profile_id} className="hover:bg-alabaster-cream/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-deep-slate leading-tight">{g.business_name}</p>
                          {g.city && <p className="text-xs text-pebble-grey">{g.city}</p>}
                          {g.average_rating > 0 && (
                            <p className="text-xs text-pebble-grey">★ {g.average_rating.toFixed(1)} ({g.total_reviews})</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-deep-slate font-bold leading-tight">{g.owner_name ?? "—"}</p>
                          <p className="text-xs text-pebble-grey">{g.email}</p>
                        </td>
                        <td className="px-4 py-3 text-pebble-grey hidden lg:table-cell">{formatDate(g.created_at)}</td>
                        <td className="px-4 py-3 text-center">
                          {g.is_listed ? <Badge tone="sage">Listed</Badge> : <Badge tone="grey">Unlisted</Badge>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge tone={vBadge.tone}>{vBadge.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {profileUrl && (
                              <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sage-leaf/10 text-sage-leaf hover:bg-sage-leaf/20 border border-sage-leaf/30 transition-colors focus-ring">
                                View
                              </a>
                            )}
                            <button onClick={() => setEditGroomer(g)} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pebble-grey/10 text-deep-slate hover:bg-pebble-grey/20 border border-pebble-grey/20 transition-colors focus-ring">
                              <PencilIcon size={12} /> Edit
                            </button>
                            {g.email && (
                              <>
                                <button onClick={() => setContactGroomer(g)} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-groomr-gold/20 text-deep-slate hover:bg-groomr-gold/40 border border-groomr-gold/40 transition-colors focus-ring">
                                  Email
                                </button>
                                <button onClick={() => handlePasswordReset(g)} disabled={resetPendingId === g.groomer_profile_id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pebble-grey/10 text-pebble-grey hover:bg-pebble-grey/20 border border-pebble-grey/20 transition-colors focus-ring disabled:opacity-50">
                                  {resetPendingId === g.groomer_profile_id ? "…" : "Reset pwd"}
                                </button>
                              </>
                            )}
                            <button onClick={() => handleExportIndividual(g.groomer_profile_id, g.business_name)} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-pebble-grey/10 text-pebble-grey hover:bg-pebble-grey/20 border border-pebble-grey/20 transition-colors focus-ring" title="Download JSON">
                              ↓
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editGroomer && (
        <GroomerEditModal
          groomer={editGroomer}
          onClose={() => setEditGroomer(null)}
          onSaved={(updated) => {
            setGroomers((prev) =>
              prev.map((g) =>
                g.groomer_profile_id === editGroomer.groomer_profile_id ? { ...g, ...updated } : g
              )
            );
          }}
        />
      )}

      {contactGroomer && contactGroomer.email && (
        <ContactModal
          toEmail={contactGroomer.email}
          toName={contactGroomer.owner_name ?? contactGroomer.business_name}
          onClose={() => setContactGroomer(null)}
        />
      )}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
