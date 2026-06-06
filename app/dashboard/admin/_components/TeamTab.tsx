"use client";

import { useState, useTransition } from "react";
import { Toast } from "@/components/ui/Toast";
import { TrashIcon, CheckIcon } from "@/components/ui/GroomrIcons";
import {
  adminRevokeAdmin,
  adminGrantAdmin,
  adminFindProfileByEmail,
} from "@/app/actions/admin";
import type { AdminTeamMember } from "@/app/actions/admin";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  initialTeam: AdminTeamMember[];
}

export function TeamTab({ initialTeam }: Props) {
  const [team, setTeam] = useState<AdminTeamMember[]>(initialTeam);
  const [toast, setToast] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Grant flow state
  const [grantEmail, setGrantEmail] = useState("");
  const [foundProfile, setFoundProfile] = useState<AdminTeamMember | null | "not_found">(null);
  const [finding, setFinding] = useState(false);
  const [granting, setGranting] = useState(false);

  function handleRevoke(member: AdminTeamMember) {
    setRevokingId(member.profile_id);
    startTransition(async () => {
      const result = await adminRevokeAdmin(member.profile_id);
      setRevokingId(null);
      if ("error" in result) {
        setToast(result.error);
      } else {
        setTeam((prev) => prev.filter((m) => m.profile_id !== member.profile_id));
        setToast(`Admin access revoked for ${member.full_name ?? member.email ?? "user"}.`);
      }
    });
  }

  async function handleFind() {
    if (!grantEmail.trim()) return;
    setFinding(true);
    setFoundProfile(null);
    const result = await adminFindProfileByEmail(grantEmail);
    setFinding(false);
    if ("error" in result) {
      setToast(result.error);
    } else {
      setFoundProfile(result.data ?? "not_found");
    }
  }

  async function handleGrant() {
    if (!foundProfile || foundProfile === "not_found") return;
    setGranting(true);
    const result = await adminGrantAdmin(foundProfile.profile_id);
    setGranting(false);
    if ("error" in result) {
      setToast(result.error);
    } else {
      // Add to team list if not already there
      setTeam((prev) => {
        if (prev.some((m) => m.profile_id === (foundProfile as AdminTeamMember).profile_id)) {
          return prev;
        }
        return [...prev, { ...(foundProfile as AdminTeamMember), is_you: false }];
      });
      setToast(`Admin access granted to ${(foundProfile as AdminTeamMember).full_name ?? grantEmail}.`);
      setGrantEmail("");
      setFoundProfile(null);
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Grant admin */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 space-y-4">
          <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
            Grant admin access
          </p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="email"
              value={grantEmail}
              onChange={(e) => { setGrantEmail(e.target.value); setFoundProfile(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleFind(); }}
              placeholder="user@example.com"
              className="field flex-1 min-w-[220px]"
            />
            <button
              onClick={handleFind}
              disabled={finding || !grantEmail.trim()}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {finding ? "Searching…" : "Find user"}
            </button>
          </div>

          {foundProfile === "not_found" && (
            <p className="text-sm text-muted-terracotta font-bold">
              No account found with that email address.
            </p>
          )}

          {foundProfile && foundProfile !== "not_found" && (
            <div className="flex items-center gap-3 p-4 rounded-[14px] bg-alabaster-cream border border-pebble-grey/10 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-deep-slate leading-tight">
                  {foundProfile.full_name ?? "—"}
                  {foundProfile.is_you && (
                    <span className="ml-2 text-xs text-pebble-grey font-normal">(you)</span>
                  )}
                </p>
                <p className="text-xs text-pebble-grey">{foundProfile.email}</p>
              </div>
              {team.some((m) => m.profile_id === (foundProfile as AdminTeamMember).profile_id) ? (
                <span className="text-sm text-sage-leaf font-bold">Already an admin</span>
              ) : (
                <button
                  onClick={handleGrant}
                  disabled={granting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-sage-leaf text-white hover:bg-sage-leaf/90 transition-colors focus-ring disabled:opacity-50"
                >
                  <CheckIcon size={14} />
                  {granting ? "Granting…" : "Grant admin access"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Current admins */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
            Current admins · {team.length}
          </p>
          <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
            {team.length === 0 ? (
              <div className="py-10 text-center text-pebble-grey font-bold text-sm">
                No admins found.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pebble-grey/10">
                    <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden md:table-cell">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden lg:table-cell">
                      Admin since
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pebble-grey/10">
                  {team.map((member) => (
                    <tr key={member.profile_id} className="hover:bg-alabaster-cream/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-deep-slate leading-tight">
                          {member.full_name ?? "—"}
                          {member.is_you && (
                            <span className="ml-2 text-xs text-groomr-gold bg-groomr-gold/20 rounded-full px-2 py-0.5 font-bold">
                              You
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-pebble-grey hidden md:table-cell">
                        {member.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-pebble-grey hidden lg:table-cell">
                        {formatDate(member.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {member.is_you ? (
                          <span className="text-xs text-pebble-grey italic">Cannot revoke self</span>
                        ) : (
                          <button
                            onClick={() => handleRevoke(member)}
                            disabled={revokingId === member.profile_id}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-muted-terracotta/10 text-muted-terracotta hover:bg-muted-terracotta/20 border border-muted-terracotta/30 transition-colors focus-ring disabled:opacity-50"
                          >
                            <TrashIcon size={12} />
                            {revokingId === member.profile_id ? "…" : "Revoke"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
