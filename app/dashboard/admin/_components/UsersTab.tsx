"use client";

import { useState, useTransition, useCallback } from "react";
import { SearchPill } from "@/components/ui/SearchPill";
import { Badge } from "@/components/ui/Badge";
import { Toast } from "@/components/ui/Toast";
import { PencilIcon, ChevronDownIcon, ChevronRightIcon, TrashIcon } from "@/components/ui/GroomrIcons";
import { getUserDogs, adminDeleteOwner, adminSendPasswordReset, adminExportOwners, adminExportIndividualOwner } from "@/app/actions/admin";
import { UserEditModal } from "./UserEditModal";
import { ContactModal } from "./ContactModal";
import { DogManagerModal } from "./DogManagerModal";
import { OwnerStatsBar } from "./OwnerStatsBar";
import type { AdminUserRow, AdminUserDog } from "@/app/actions/admin";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

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

type SortKey = "joined" | "name" | "dogs";
type DogFilter = "all" | "has_dogs" | "no_dogs";

function UserRow({
  user,
  onEdit,
  onContact,
  onManageDogs,
  onDelete,
  onPasswordReset,
  onDownload,
  deleteDisabled,
}: {
  user: AdminUserRow;
  onEdit: () => void;
  onContact: () => void;
  onManageDogs: () => void;
  onDelete: () => void;
  onPasswordReset: () => void;
  onDownload: () => void;
  deleteDisabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [dogs, setDogs] = useState<AdminUserDog[] | null>(null);
  const [loadingDogs, setLoadingDogs] = useState(false);

  async function toggleDogs() {
    if (!expanded && dogs === null && user.dog_count > 0) {
      setLoadingDogs(true);
      const result = await getUserDogs(user.profile_id);
      setDogs("error" in result ? [] : result.data);
      setLoadingDogs(false);
    }
    setExpanded((v) => !v);
  }

  return (
    <>
      <tr className="hover:bg-alabaster-cream/50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div>
              <p className="font-bold text-deep-slate leading-tight">{user.full_name ?? "—"}</p>
              <p className="text-xs text-pebble-grey">{user.email}</p>
            </div>
            {!user.is_active && (
              <Badge tone="terra">Inactive</Badge>
            )}
          </div>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell text-pebble-grey text-sm">{formatDate(user.created_at)}</td>
        <td className="px-4 py-3 text-center">
          {user.dog_count > 0 ? (
            <button
              onClick={toggleDogs}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-groomr-gold/20 text-deep-slate hover:bg-groomr-gold/40 border border-groomr-gold/40 transition-colors focus-ring"
            >
              {expanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
              {loadingDogs ? "…" : user.dog_count}
            </button>
          ) : (
            <span className="text-xs text-pebble-grey">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1.5 flex-wrap">
            <button onClick={onManageDogs} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sage-leaf/10 text-sage-leaf hover:bg-sage-leaf/20 border border-sage-leaf/30 transition-colors focus-ring">
              Dogs
            </button>
            <button onClick={onEdit} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pebble-grey/10 text-deep-slate hover:bg-pebble-grey/20 border border-pebble-grey/20 transition-colors focus-ring">
              <PencilIcon size={12} /> Edit
            </button>
            {user.email && (
              <>
                <button onClick={onContact} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-groomr-gold/20 text-deep-slate hover:bg-groomr-gold/40 border border-groomr-gold/40 transition-colors focus-ring">
                  Email
                </button>
                <button onClick={onPasswordReset} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pebble-grey/10 text-pebble-grey hover:bg-pebble-grey/20 border border-pebble-grey/20 transition-colors focus-ring">
                  Reset pwd
                </button>
              </>
            )}
            <button onClick={onDownload} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-pebble-grey/10 text-pebble-grey hover:bg-pebble-grey/20 border border-pebble-grey/20 transition-colors focus-ring" title="Download JSON">
              ↓
            </button>
            <button onClick={onDelete} disabled={deleteDisabled} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-muted-terracotta/10 text-muted-terracotta hover:bg-muted-terracotta/20 border border-muted-terracotta/30 transition-colors focus-ring disabled:opacity-50" title="Delete account">
              <TrashIcon size={12} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && dogs && dogs.length > 0 && (
        <tr>
          <td colSpan={4} className="px-4 pb-3 bg-alabaster-cream/40">
            <div className="flex flex-wrap gap-2 pt-1">
              {dogs.map((d) => (
                <span key={d.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-pebble-grey/20 rounded-full text-xs font-bold text-deep-slate">
                  {d.name}
                  {d.breed && <span className="text-pebble-grey font-normal">· {d.breed}</span>}
                  {d.size && <span className="text-pebble-grey font-normal">· {d.size}</span>}
                </span>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

interface DeleteConfirm {
  profileId: string;
  name: string;
}

export function UsersTab({ initialUsers }: { initialUsers: AdminUserRow[] }) {
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("joined");
  const [dogFilter, setDogFilter] = useState<DogFilter>("all");
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [contactUser, setContactUser] = useState<AdminUserRow | null>(null);
  const [dogsUser, setDogsUser] = useState<AdminUserRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resetPendingId, setResetPendingId] = useState<string | null>(null);
  const [exportingBulk, startBulkExport] = useTransition();

  const totalDogs = users.reduce((sum, u) => sum + (u.dog_count ?? 0), 0);

  const filtered = users
    .filter((u) => {
      if (dogFilter === "has_dogs" && u.dog_count === 0) return false;
      if (dogFilter === "no_dogs" && u.dog_count > 0) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === "name") return (a.full_name ?? "").localeCompare(b.full_name ?? "");
      if (sort === "dogs") return b.dog_count - a.dog_count;
      // joined (default desc)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  function handlePasswordReset(u: AdminUserRow) {
    if (!u.email) return;
    setResetPendingId(u.profile_id);
    adminSendPasswordReset(u.email, u.full_name ?? "there").then((res) => {
      setResetPendingId(null);
      setToast("error" in res ? res.error : "Password reset email sent.");
    });
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeletingId(deleteConfirm.profileId);
    setDeleteConfirm(null);
    const res = await adminDeleteOwner(deleteConfirm.profileId);
    setDeletingId(null);
    if ("error" in res) {
      setToast(res.error);
    } else {
      setUsers((prev) => prev.filter((u) => u.profile_id !== deleteConfirm.profileId));
      setToast("Owner account deleted.");
    }
  }

  const handleExportBulk = useCallback(() => {
    startBulkExport(async () => {
      const res = await adminExportOwners();
      if ("error" in res) { setToast(res.error); return; }
      const csv = objectsToCSV(res.data);
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(`groomr-owners-${date}.csv`, csv, "text/csv");
    });
  }, []);

  async function handleExportIndividual(profileId: string, name: string) {
    const res = await adminExportIndividualOwner(profileId);
    if ("error" in res) { setToast(res.error); return; }
    const date = new Date().toISOString().slice(0, 10);
    downloadBlob(
      `groomr-owner-${(name || "owner").toLowerCase().replace(/\s+/g, "-")}-${date}.json`,
      JSON.stringify(res.data, null, 2),
      "application/json"
    );
  }

  return (
    <>
      <div className="space-y-4">
        <OwnerStatsBar />

        {/* Header row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-bold text-pebble-grey">
            {filtered.length === users.length
              ? `${users.length} owners · ${totalDogs} dogs`
              : `${filtered.length} of ${users.length} owners`}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleExportBulk} disabled={exportingBulk} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-pebble-grey/10 text-deep-slate hover:bg-pebble-grey/20 border border-pebble-grey/20 transition-colors disabled:opacity-50">
              {exportingBulk ? "Exporting…" : "Export all (CSV)"}
            </button>
            <SearchPill value={search} onChange={setSearch} placeholder="Search owners…" size="sm" />
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-pebble-grey uppercase tracking-wider">Sort</span>
            <div className="flex gap-1">
              {(["joined", "name", "dogs"] as SortKey[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors focus-ring ${
                    sort === s
                      ? "bg-deep-slate text-alabaster-cream border-deep-slate"
                      : "bg-white text-pebble-grey border-pebble-grey/20 hover:border-pebble-grey/50"
                  }`}
                >
                  {s === "joined" ? "Joined" : s === "name" ? "Name" : "Dog count"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-pebble-grey uppercase tracking-wider">Filter</span>
            <div className="flex gap-1">
              {(["all", "has_dogs", "no_dogs"] as DogFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setDogFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors focus-ring ${
                    dogFilter === f
                      ? "bg-deep-slate text-alabaster-cream border-deep-slate"
                      : "bg-white text-pebble-grey border-pebble-grey/20 hover:border-pebble-grey/50"
                  }`}
                >
                  {f === "all" ? "All" : f === "has_dogs" ? "Has dogs" : "No dogs"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-pebble-grey font-bold">No owners found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pebble-grey/10">
                    <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">Owner</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden lg:table-cell">Joined</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">Dogs</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pebble-grey/10">
                  {filtered.map((u) => (
                    <UserRow
                      key={u.profile_id}
                      user={u}
                      onEdit={() => setEditUser(u)}
                      onContact={() => setContactUser(u)}
                      onManageDogs={() => setDogsUser(u)}
                      onDelete={() => setDeleteConfirm({ profileId: u.profile_id, name: u.full_name ?? "this owner" })}
                      onPasswordReset={() => handlePasswordReset(u)}
                      onDownload={() => handleExportIndividual(u.profile_id, u.full_name ?? "")}
                      deleteDisabled={deletingId === u.profile_id || resetPendingId === u.profile_id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-deep-slate/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-[24px] p-6 shadow-modal max-w-sm w-full space-y-4">
            <h3 className="font-fredoka text-xl text-deep-slate">Delete {deleteConfirm.name}?</h3>
            <p className="text-sm text-pebble-grey">
              This permanently deletes the owner account and disables Clerk access. It cannot be undone.
              <span className="block mt-1 font-bold text-muted-terracotta">If they have confirmed or pending appointments, deletion will be blocked — cancel those first.</span>
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring">
                Cancel
              </button>
              <button onClick={handleDelete} className="font-nunito font-bold px-5 py-2 rounded-full text-sm bg-muted-terracotta text-white hover:opacity-90 transition-opacity focus-ring">
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <UserEditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={(updated) => {
            setUsers((prev) =>
              prev.map((u) => (u.profile_id === editUser.profile_id ? { ...u, ...updated } : u))
            );
          }}
        />
      )}

      {contactUser && contactUser.email && (
        <ContactModal
          toEmail={contactUser.email}
          toName={contactUser.full_name ?? "Owner"}
          onClose={() => setContactUser(null)}
        />
      )}

      {dogsUser && (
        <DogManagerModal
          ownerProfileId={dogsUser.profile_id}
          ownerName={dogsUser.full_name ?? "Owner"}
          onClose={() => setDogsUser(null)}
        />
      )}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
