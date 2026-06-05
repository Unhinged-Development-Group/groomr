"use client";

import { useState, useEffect, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { adminGetGroomerFull, updateGroomerProfile } from "@/app/actions/admin";
import type { AdminGroomerRow, GroomerFullProfile } from "@/app/actions/admin";

interface Props {
  groomer: AdminGroomerRow;
  onClose: () => void;
  onSaved: (updated: Partial<AdminGroomerRow>) => void;
}

const DEPOSIT_TYPES = [
  { value: "none", label: "No deposit" },
  { value: "percentage", label: "Percentage of service price" },
  { value: "full", label: "Full payment upfront" },
];

const TOGGLE_FIELDS: [keyof GroomerFullProfile, string][] = [
  ["is_listed", "Listed in search results"],
  ["is_verified", "Verified"],
  ["is_accepting_bookings", "Accepting bookings"],
  ["is_mobile", "Mobile groomer"],
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider pb-2 border-b border-pebble-grey/10">
      {children}
    </p>
  );
}

export function GroomerEditModal({ groomer, onClose, onSaved }: Props) {
  const [profile, setProfile] = useState<GroomerFullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    adminGetGroomerFull(groomer.groomer_profile_id).then((res) => {
      if ("data" in res) setProfile(res.data);
      else setToast(res.error);
      setLoading(false);
    });
  }, [groomer.groomer_profile_id]);

  function update(fields: Partial<GroomerFullProfile>) {
    setProfile((p) => (p ? { ...p, ...fields } : p));
  }

  function handleSave() {
    if (!profile) return;
    startTransition(async () => {
      const result = await updateGroomerProfile(groomer.groomer_profile_id, {
        business_name: profile.business_name,
        tagline: profile.tagline,
        bio: profile.bio,
        city: profile.city,
        postcode: profile.postcode,
        is_listed: profile.is_listed,
        is_verified: profile.is_verified,
        is_mobile: profile.is_mobile,
        is_accepting_bookings: profile.is_accepting_bookings,
        travel_radius_miles: profile.travel_radius_miles,
        years_experience: profile.years_experience,
        qualifications: profile.qualifications,
        deposit_type: profile.deposit_type,
        deposit_percentage: profile.deposit_percentage,
      });
      if ("error" in result) {
        setToast(result.error);
      } else {
        setToast("Saved.");
        onSaved({
          business_name: profile.business_name,
          is_listed: profile.is_listed,
          is_verified: profile.is_verified,
        });
        setTimeout(onClose, 800);
      }
    });
  }

  return (
    <>
      <Modal open size="lg" onClose={onClose}>
        <div className="space-y-5">
          <div>
            <h2 className="font-fredoka text-2xl text-deep-slate">Edit groomer</h2>
            <p className="text-sm text-pebble-grey font-bold mt-0.5">{groomer.business_name}</p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-pebble-grey font-bold">Loading…</div>
          ) : !profile ? (
            <div className="py-10 text-center text-muted-terracotta font-bold">Failed to load profile data.</div>
          ) : (
            <>
              {/* Business details */}
              <div className="space-y-3">
                <SectionLabel>Business details</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Business name</label>
                    <input
                      className="field w-full"
                      value={profile.business_name ?? ""}
                      onChange={(e) => update({ business_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Tagline</label>
                    <input
                      className="field w-full"
                      value={profile.tagline ?? ""}
                      onChange={(e) => update({ tagline: e.target.value || null })}
                      placeholder="Short tagline…"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">City</label>
                    <input
                      className="field w-full"
                      value={profile.city ?? ""}
                      onChange={(e) => update({ city: e.target.value || null })}
                      placeholder="e.g. Edinburgh"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Postcode</label>
                    <input
                      className="field w-full"
                      value={profile.postcode ?? ""}
                      onChange={(e) => update({ postcode: e.target.value || null })}
                      placeholder="e.g. EH1 1AB"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Bio</label>
                  <textarea
                    className="field w-full min-h-[80px] resize-y"
                    value={profile.bio ?? ""}
                    onChange={(e) => update({ bio: e.target.value || null })}
                    placeholder="Groomer bio…"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-3">
                <SectionLabel>Settings</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <div className="space-y-2.5">
                    {TOGGLE_FIELDS.map(([key, label]) => (
                      <label key={key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!profile[key]}
                          onChange={(e) => update({ [key]: e.target.checked })}
                          className="w-4 h-4 accent-groomr-gold rounded"
                        />
                        <span className="text-sm font-bold text-deep-slate">{label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Travel radius (miles)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="field w-full"
                        value={profile.travel_radius_miles ?? ""}
                        onChange={(e) =>
                          update({ travel_radius_miles: e.target.value ? Number(e.target.value) : null })
                        }
                        placeholder="e.g. 10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Deposit type</label>
                      <select
                        className="field w-full"
                        value={profile.deposit_type ?? "none"}
                        onChange={(e) => update({ deposit_type: e.target.value })}
                      >
                        {DEPOSIT_TYPES.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    {profile.deposit_type === "percentage" && (
                      <div>
                        <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Deposit percentage (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="field w-full"
                          value={profile.deposit_percentage ?? ""}
                          onChange={(e) =>
                            update({ deposit_percentage: e.target.value ? Number(e.target.value) : null })
                          }
                          placeholder="e.g. 25"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Background */}
              <div className="space-y-3">
                <SectionLabel>Background</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Years experience</label>
                    <input
                      type="number"
                      min={0}
                      className="field w-full"
                      value={profile.years_experience ?? ""}
                      onChange={(e) =>
                        update({ years_experience: e.target.value ? Number(e.target.value) : null })
                      }
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Qualifications</label>
                    <input
                      className="field w-full"
                      value={profile.qualifications ?? ""}
                      onChange={(e) => update({ qualifications: e.target.value || null })}
                      placeholder="e.g. City & Guilds Level 3"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              className="btn-secondary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="btn-primary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring"
              onClick={handleSave}
              disabled={pending || loading || !profile}
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
