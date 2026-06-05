"use client";

import { useState } from "react";
import { SearchPill } from "@/components/ui/SearchPill";
import { Badge } from "@/components/ui/Badge";
import { PencilIcon, ChevronDownIcon, ChevronRightIcon } from "@/components/ui/GroomrIcons";
import { getUserDogs } from "@/app/actions/admin";
import { UserEditModal } from "./UserEditModal";
import { ContactModal } from "./ContactModal";
import { DogManagerModal } from "./DogManagerModal";
import type { AdminUserRow, AdminUserDog } from "@/app/actions/admin";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function DogSizeLabel({ size }: { size: string | null }) {
  const map: Record<string, string> = { xs: "XS", small: "Small", medium: "Medium", large: "Large", xl: "XL" };
  return <span>{map[size ?? ""] ?? size ?? "—"}</span>;
}

function UserRow({ user, onEdit, onContact, onManageDogs }: { user: AdminUserRow; onEdit: () => void; onContact: () => void; onManageDogs: () => void }) {
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
          <p className="font-bold text-deep-slate leading-tight">{user.full_name ?? "—"}</p>
          <p className="text-xs text-pebble-grey">{user.email}</p>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <div className="flex flex-wrap gap-1">
            {user.roles.map((r) => (
              <Badge key={r} tone="grey">{r}</Badge>
            ))}
            {user.is_admin && <Badge tone="terra">admin</Badge>}
          </div>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell text-pebble-grey">{formatDate(user.created_at)}</td>
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
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={onManageDogs}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sage-leaf/10 text-sage-leaf hover:bg-sage-leaf/20 border border-sage-leaf/30 transition-colors focus-ring"
            >
              🐾 Dogs
            </button>
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pebble-grey/10 text-deep-slate hover:bg-pebble-grey/20 border border-pebble-grey/20 transition-colors focus-ring"
            >
              <PencilIcon size={12} />
              Edit
            </button>
            {user.email && (
              <button
                onClick={onContact}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-groomr-gold/20 text-deep-slate hover:bg-groomr-gold/40 border border-groomr-gold/40 transition-colors focus-ring"
              >
                Email
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && dogs && dogs.length > 0 && (
        <tr>
          <td colSpan={5} className="px-4 pb-3 bg-alabaster-cream/40">
            <div className="flex flex-wrap gap-2 pt-1">
              {dogs.map((d) => (
                <span key={d.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-pebble-grey/20 rounded-full text-xs font-bold text-deep-slate">
                  🐾 {d.name}
                  {d.breed && <span className="text-pebble-grey font-normal">· {d.breed}</span>}
                  {d.size && <><span className="text-pebble-grey font-normal">·</span> <DogSizeLabel size={d.size} /></>}
                </span>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function UsersTab({ initialUsers }: { initialUsers: AdminUserRow[] }) {
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [contactUser, setContactUser] = useState<AdminUserRow | null>(null);
  const [dogsUser, setDogsUser] = useState<AdminUserRow | null>(null);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-bold text-pebble-grey">{users.length} users total</p>
          <SearchPill value={search} onChange={setSearch} placeholder="Search users…" size="sm" />
        </div>

        <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-pebble-grey font-bold">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pebble-grey/10">
                    <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden md:table-cell">Roles</th>
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
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
          toName={contactUser.full_name ?? "User"}
          onClose={() => setContactUser(null)}
        />
      )}

      {dogsUser && (
        <DogManagerModal
          ownerProfileId={dogsUser.profile_id}
          ownerName={dogsUser.full_name ?? "User"}
          onClose={() => setDogsUser(null)}
        />
      )}
    </>
  );
}
