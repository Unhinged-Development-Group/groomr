"use client";

import { useState, useTransition } from "react";
import { SearchPill } from "@/components/ui/SearchPill";
import { Badge } from "@/components/ui/Badge";
import { Toast } from "@/components/ui/Toast";
import { PencilIcon, CheckIcon } from "@/components/ui/GroomrIcons";
import { verifyGroomer } from "@/app/actions/admin";
import { GroomerEditModal } from "./GroomerEditModal";
import { ContactModal } from "./ContactModal";
import { ServiceManagerModal } from "./ServiceManagerModal";
import type { AdminGroomerRow } from "@/app/actions/admin";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function GroomersTab({ initialGroomers }: { initialGroomers: AdminGroomerRow[] }) {
  const [groomers, setGroomers] = useState<AdminGroomerRow[]>(initialGroomers);
  const [search, setSearch] = useState("");
  const [editGroomer, setEditGroomer] = useState<AdminGroomerRow | null>(null);
  const [contactGroomer, setContactGroomer] = useState<AdminGroomerRow | null>(null);
  const [servicesGroomer, setServicesGroomer] = useState<AdminGroomerRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = groomers.filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.business_name?.toLowerCase().includes(q) ||
      g.owner_name?.toLowerCase().includes(q) ||
      g.email?.toLowerCase().includes(q)
    );
  });

  function handleVerify(g: AdminGroomerRow) {
    const next = !g.is_verified;
    setVerifyingId(g.groomer_profile_id);
    startTransition(async () => {
      const result = await verifyGroomer(g.groomer_profile_id, next);
      setVerifyingId(null);
      if ("error" in result) {
        setToast(result.error);
      } else {
        setGroomers((prev) =>
          prev.map((r) =>
            r.groomer_profile_id === g.groomer_profile_id ? { ...r, is_verified: next } : r
          )
        );
        setToast(next ? "Groomer verified." : "Verification revoked.");
      }
    });
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-bold text-pebble-grey">{groomers.length} groomers total</p>
          <SearchPill
            value={search}
            onChange={setSearch}
            placeholder="Search groomers…"
            size="sm"
          />
        </div>

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
                    <th className="text-center px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">Verified</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pebble-grey/10">
                  {filtered.map((g) => (
                    <tr key={g.groomer_profile_id} className="hover:bg-alabaster-cream/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-deep-slate leading-tight">{g.business_name}</p>
                        {g.average_rating > 0 && (
                          <p className="text-xs text-pebble-grey mt-0.5">★ {g.average_rating.toFixed(1)} ({g.total_reviews})</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-deep-slate font-bold leading-tight">{g.owner_name ?? "—"}</p>
                        <p className="text-xs text-pebble-grey">{g.email}</p>
                      </td>
                      <td className="px-4 py-3 text-pebble-grey hidden lg:table-cell">{formatDate(g.created_at)}</td>
                      <td className="px-4 py-3 text-center">
                        {g.is_listed ? (
                          <Badge tone="sage">Listed</Badge>
                        ) : (
                          <Badge tone="grey">Unlisted</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {g.is_verified ? (
                          <Badge tone="sage">Verified</Badge>
                        ) : (
                          <Badge tone="terra">Unverified</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleVerify(g)}
                            disabled={verifyingId === g.groomer_profile_id}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors focus-ring ${
                              g.is_verified
                                ? "bg-muted-terracotta/10 text-muted-terracotta hover:bg-muted-terracotta/20 border border-muted-terracotta/30"
                                : "bg-sage-leaf/10 text-sage-leaf hover:bg-sage-leaf/20 border border-sage-leaf/30"
                            } disabled:opacity-50`}
                          >
                            <CheckIcon size={12} />
                            {verifyingId === g.groomer_profile_id ? "…" : g.is_verified ? "Revoke" : "Verify"}
                          </button>
                          <button
                            onClick={() => setServicesGroomer(g)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sage-leaf/10 text-sage-leaf hover:bg-sage-leaf/20 border border-sage-leaf/30 transition-colors focus-ring"
                          >
                            Services
                          </button>
                          <button
                            onClick={() => setEditGroomer(g)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pebble-grey/10 text-deep-slate hover:bg-pebble-grey/20 border border-pebble-grey/20 transition-colors focus-ring"
                          >
                            <PencilIcon size={12} />
                            Edit
                          </button>
                          {g.email && (
                            <button
                              onClick={() => setContactGroomer(g)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-groomr-gold/20 text-deep-slate hover:bg-groomr-gold/40 border border-groomr-gold/40 transition-colors focus-ring"
                            >
                              Email
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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

      {servicesGroomer && (
        <ServiceManagerModal
          groomerProfileId={servicesGroomer.groomer_profile_id}
          businessName={servicesGroomer.business_name}
          onClose={() => setServicesGroomer(null)}
        />
      )}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
