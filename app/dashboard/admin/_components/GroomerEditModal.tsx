"use client";

import { useState, useEffect, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { ChevronRightIcon, ChevronDownIcon, PlusIcon, TrashIcon } from "@/components/ui/GroomrIcons";
import {
  adminGetGroomerFull,
  updateGroomerProfile,
  updateUserProfile,
  adminUpdateVerificationStatus,
  adminSaveGroomerDocVerified,
  adminVerifyDoc,
  adminRejectDoc,
  adminSaveAvailability,
  adminSaveService,
  adminDeleteService,
} from "@/app/actions/admin";
import type {
  AdminGroomerRow,
  GroomerFullProfile,
  AdminAvailabilityRow,
  AdminServiceRow,
  AdminGroomerTeamMember,
  DocVerifyKey,
} from "@/app/actions/admin";

interface Props {
  groomer: AdminGroomerRow;
  onClose: () => void;
  onSaved: (updated: Partial<AdminGroomerRow>) => void;
  initialSection?: string;
}

const DEPOSIT_TYPES = [
  { value: "none", label: "No deposit" },
  { value: "percentage", label: "Percentage of service price" },
  { value: "full", label: "Full payment upfront" },
];

const VERIFICATION_OPTIONS = [
  { value: "not_submitted", label: "Not submitted" },
  { value: "awaiting",      label: "Awaiting review" },
  { value: "verified",      label: "Verified" },
  { value: "revoked_temp",  label: "Revoked (temporary)" },
  { value: "revoked_perm",  label: "Revoked (permanent)" },
];

const BUFFER_OPTIONS = [
  { value: 0, label: "No buffer" },
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
];

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ─── Sub-components ──────────────────────────────────────────────────────────

function docViewUrl(url: string): string {
  if (/\.pdf($|\?)/i.test(url)) {
    return url.replace("/image/upload/", "/raw/upload/");
  }
  return url;
}

function SectionHeader({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 py-3 text-left hover:opacity-80 transition-opacity"
    >
      <span className="font-bold text-deep-slate text-sm">{title}</span>
      {open ? <ChevronDownIcon size={16} className="text-pebble-grey shrink-0" /> : <ChevronRightIcon size={16} className="text-pebble-grey shrink-0" />}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">
      {children}
    </label>
  );
}

function SaveRow({
  onSave,
  pending,
  disabled,
}: {
  onSave: () => void;
  pending: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-end pt-3 border-t border-pebble-grey/10 mt-4">
      <button
        type="button"
        onClick={onSave}
        disabled={pending || disabled}
        className="btn-primary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring disabled:opacity-40"
      >
        {pending ? "Saving…" : "Save section"}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GroomerEditModal({ groomer, onClose, onSaved, initialSection }: Props) {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(initialSection ?? "basics");

  // Data state
  const [profile, setProfile] = useState<GroomerFullProfile | null>(null);
  const [availability, setAvailability] = useState<AdminAvailabilityRow[]>([]);
  const [services, setServices] = useState<AdminServiceRow[]>([]);
  const [teamMembers, setTeamMembers] = useState<AdminGroomerTeamMember[]>([]);

  // Transitions per section
  const [basicsPending, startBasics] = useTransition();
  const [operationPending, startOperation] = useTransition();
  const [settingsPending, startSettings] = useTransition();
  const [availPending, startAvail] = useTransition();
  const [verifyPending, startVerify] = useTransition();
  const [docPending, setDocPending] = useState<Partial<Record<DocVerifyKey, "verifying" | "rejecting">>>({});

  useEffect(() => {
    adminGetGroomerFull(groomer.groomer_profile_id).then((res) => {
      if ("data" in res) {
        setProfile(res.data.profile);
        setAvailability(res.data.availability);
        setServices(res.data.services);
        setTeamMembers(res.data.teamMembers);
      } else {
        setToast(res.error);
      }
      setLoading(false);
    });
  }, [groomer.groomer_profile_id]);

  function updateProfile(fields: Partial<GroomerFullProfile>) {
    setProfile((p) => (p ? { ...p, ...fields } : p));
  }

  function toggleSection(id: string) {
    setOpenSection((cur) => (cur === id ? null : id));
  }

  // ── Section saves ──

  function saveBasics() {
    if (!profile) return;
    startBasics(async () => {
      const [groomerRes, profileRes] = await Promise.all([
        updateGroomerProfile(groomer.groomer_profile_id, {
          business_name: profile.business_name,
          tagline: profile.tagline,
          bio: profile.bio,
          is_founding_groomer: profile.is_founding_groomer,
        }),
        updateUserProfile(groomer.profile_id, { phone: profile.phone ?? undefined }),
      ]);
      if ("error" in groomerRes) { setToast(groomerRes.error); return; }
      if ("error" in profileRes) { setToast(profileRes.error); return; }
      onSaved({ business_name: profile.business_name });
      setToast("Business basics saved.");
    });
  }

  function saveOperation() {
    if (!profile) return;
    startOperation(async () => {
      const res = await updateGroomerProfile(groomer.groomer_profile_id, {
        is_mobile: profile.is_mobile,
        travel_radius_miles: profile.travel_radius_miles,
        address_line_1: profile.address_line_1,
        address_line_2: profile.address_line_2,
        city: profile.city,
        postcode: profile.postcode,
      });
      if ("error" in res) { setToast(res.error); return; }
      setToast("Operation details saved.");
    });
  }

  function saveSettings() {
    if (!profile) return;
    startSettings(async () => {
      const res = await updateGroomerProfile(groomer.groomer_profile_id, {
        is_listed: profile.is_listed,
        is_accepting_bookings: profile.is_accepting_bookings,
        years_experience: profile.years_experience,
        qualifications: profile.qualifications,
        deposit_type: profile.deposit_type,
        deposit_percentage: profile.deposit_percentage,
        default_buffer_minutes: profile.default_buffer_minutes,
        has_employees: profile.has_employees,
      });
      if ("error" in res) { setToast(res.error); return; }
      onSaved({ is_listed: profile.is_listed });
      setToast("Account settings saved.");
    });
  }

  function saveAvailability() {
    if (!profile) return;
    startAvail(async () => {
      const [availRes, profileRes] = await Promise.all([
        adminSaveAvailability(
          groomer.groomer_profile_id,
          availability.map(({ day_of_week, start_time, end_time, is_active }) => ({
            day_of_week,
            start_time,
            end_time,
            is_active,
          }))
        ),
        updateGroomerProfile(groomer.groomer_profile_id, {
          is_accepting_bookings: profile.is_accepting_bookings,
          default_buffer_minutes: profile.default_buffer_minutes,
        }),
      ]);
      if ("error" in availRes) { setToast(availRes.error); return; }
      if ("error" in profileRes) { setToast(profileRes.error); return; }
      setToast("Availability saved.");
    });
  }

  function saveVerification() {
    if (!profile) return;
    startVerify(async () => {
      const status = profile.verification_status as "not_submitted" | "awaiting" | "verified" | "revoked_temp" | "revoked_perm";
      const [statusRes, docsRes] = await Promise.all([
        adminUpdateVerificationStatus(groomer.groomer_profile_id, status),
        adminSaveGroomerDocVerified(groomer.groomer_profile_id, {
          insurance_doc_verified: profile.insurance_doc_verified,
          qualification_doc_verified: profile.qualification_doc_verified,
          first_aid_doc_verified: profile.first_aid_doc_verified,
          photo_id_doc_verified: profile.photo_id_doc_verified,
          employers_liability_doc_verified: profile.employers_liability_doc_verified,
        }),
      ]);
      if ("error" in statusRes) { setToast(statusRes.error); return; }
      if ("error" in docsRes) { setToast(docsRes.error); return; }
      // Photo ID is deleted server-side after verification — clear from local state too
      if (profile.photo_id_doc_verified) {
        updateProfile({ photo_id_doc_url: null });
      }
      onSaved({ is_verified: status === "verified", verification_status: status });
      setToast("Verification status updated.");
    });
  }

  // ── Per-doc verify / reject ──

  async function handleVerifyDoc(docType: DocVerifyKey) {
    if (!profile) return;
    setDocPending((p) => ({ ...p, [docType]: "verifying" }));
    const res = await adminVerifyDoc(profile.id, docType);
    setDocPending((p) => { const next = { ...p }; delete next[docType]; return next; });
    if ("error" in res) { setToast(res.error); return; }
    // Reflect verified state locally
    const verifiedKey = `${docType}_doc_verified` as keyof GroomerFullProfile;
    const updates: Partial<GroomerFullProfile> = { [verifiedKey]: true };
    if (docType === "photo_id") updates.photo_id_doc_url = null;
    if (res.autoVerified) {
      updates.verification_status = "verified";
      onSaved({ is_verified: true, verification_status: "verified" });
      setToast("All required docs verified — profile automatically marked as Verified.");
    } else {
      setToast("Document verified.");
    }
    updateProfile(updates);
  }

  async function handleRejectDoc(docType: DocVerifyKey) {
    if (!profile) return;
    setDocPending((p) => ({ ...p, [docType]: "rejecting" }));
    const res = await adminRejectDoc(profile.id, docType);
    setDocPending((p) => { const next = { ...p }; delete next[docType]; return next; });
    if ("error" in res) { setToast(res.error); return; }
    const urlKey = `${docType}_doc_url` as keyof GroomerFullProfile;
    const verifiedKey = `${docType}_doc_verified` as keyof GroomerFullProfile;
    updateProfile({ [urlKey]: null, [verifiedKey]: false } as Partial<GroomerFullProfile>);
    setToast("Document rejected — groomer must resubmit.");
  }

  // ── Availability helpers ──

  function ensureDayRow(dow: number) {
    if (!availability.find((r) => r.day_of_week === dow)) {
      setAvailability((prev) => [
        ...prev,
        { id: `new-${dow}`, day_of_week: dow, start_time: "09:00", end_time: "17:00", is_active: false },
      ]);
    }
  }

  function updateDayRow(dow: number, fields: Partial<AdminAvailabilityRow>) {
    setAvailability((prev) =>
      prev.map((r) => (r.day_of_week === dow ? { ...r, ...fields } : r))
    );
  }

  function toggleDay(dow: number, active: boolean) {
    ensureDayRow(dow);
    updateDayRow(dow, { is_active: active });
  }

  // ── Service helpers ──

  async function handleAddService() {
    const res = await adminSaveService(groomer.groomer_profile_id, null, {
      name: "New service",
      price_pence: 0,
      is_active: true,
      sort_order: services.length,
    });
    if ("error" in res) { setToast(res.error); return; }
    setServices((prev) => [...prev, res.data]);
  }

  async function handleUpdateService(id: string, fields: Partial<AdminServiceRow>) {
    const current = services.find((s) => s.id === id);
    if (!current) return;
    const updated = { ...current, ...fields };
    const res = await adminSaveService(groomer.groomer_profile_id, id, {
      name: updated.name,
      description: updated.description,
      duration_minutes: updated.duration_minutes,
      price_pence: updated.price_pence,
      is_active: updated.is_active,
      sort_order: updated.sort_order,
      applicable_sizes: updated.applicable_sizes,
    });
    if ("error" in res) { setToast(res.error); return; }
    setServices((prev) => prev.map((s) => (s.id === id ? res.data : s)));
  }

  async function handleDeleteService(id: string) {
    const res = await adminDeleteService(id);
    if ("error" in res) { setToast(res.error); return; }
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Modal open size="lg" onClose={onClose}>
        {/* Sticky header — lives inside the Modal's single overflow-y-auto container */}
        <div className="sticky top-0 bg-alabaster-cream z-10 pb-3 border-b border-pebble-grey/10 -mt-2 pt-2">
          <h2 className="font-fredoka text-2xl text-deep-slate pr-10">Edit groomer</h2>
          <p className="text-sm text-pebble-grey font-bold mt-0.5">{groomer.business_name}</p>
        </div>

        <div>
          {loading ? (
            <div className="py-12 text-center text-pebble-grey font-bold">Loading…</div>
          ) : !profile ? (
            <div className="py-10 text-center text-muted-terracotta font-bold">Failed to load profile.</div>
          ) : (
            <div className="divide-y divide-pebble-grey/10">

              {/* ── Business Basics ── */}
              <div>
                <SectionHeader title="Business basics" open={openSection === "basics"} onToggle={() => toggleSection("basics")} />
                {openSection === "basics" && (
                  <div className="pb-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <FieldLabel>Business name</FieldLabel>
                        <input className="field w-full" value={profile.business_name ?? ""} onChange={(e) => updateProfile({ business_name: e.target.value })} />
                      </div>
                      <div>
                        <FieldLabel>Tagline</FieldLabel>
                        <input className="field w-full" value={profile.tagline ?? ""} onChange={(e) => updateProfile({ tagline: e.target.value || null })} placeholder="Short tagline…" maxLength={80} />
                      </div>
                      <div>
                        <FieldLabel>Owner phone</FieldLabel>
                        <input className="field w-full" value={profile.phone ?? ""} onChange={(e) => updateProfile({ phone: e.target.value || null })} placeholder="+44 7700 900000" />
                      </div>
                      <div className="flex items-center gap-3 pt-5">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={profile.is_founding_groomer} onChange={(e) => updateProfile({ is_founding_groomer: e.target.checked })} className="w-4 h-4 accent-groomr-gold" />
                          <span className="text-sm font-bold text-deep-slate">Founding groomer (status badge)</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Bio</FieldLabel>
                      <textarea className="field w-full min-h-[80px] resize-y" value={profile.bio ?? ""} onChange={(e) => updateProfile({ bio: e.target.value || null })} placeholder="Groomer bio…" maxLength={280} />
                    </div>
                    <SaveRow onSave={saveBasics} pending={basicsPending} />
                  </div>
                )}
              </div>

              {/* ── How You Operate ── */}
              <div>
                <SectionHeader title="How you operate" open={openSection === "operation"} onToggle={() => toggleSection("operation")} />
                {openSection === "operation" && (
                  <div className="pb-4 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={profile.is_mobile} onChange={(e) => updateProfile({ is_mobile: e.target.checked })} className="w-4 h-4 accent-groomr-gold" />
                      <span className="text-sm font-bold text-deep-slate">Mobile groomer</span>
                    </label>
                    {/* Address always shown — mobile groomers need it as their radius centre point */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <FieldLabel>Address line 1</FieldLabel>
                        <input className="field w-full" value={profile.address_line_1 ?? ""} onChange={(e) => updateProfile({ address_line_1: e.target.value || null })} />
                      </div>
                      <div>
                        <FieldLabel>Address line 2</FieldLabel>
                        <input className="field w-full" value={profile.address_line_2 ?? ""} onChange={(e) => updateProfile({ address_line_2: e.target.value || null })} />
                      </div>
                      <div>
                        <FieldLabel>City</FieldLabel>
                        <input className="field w-full" value={profile.city ?? ""} onChange={(e) => updateProfile({ city: e.target.value || null })} placeholder="e.g. Edinburgh" />
                      </div>
                      <div>
                        <FieldLabel>Postcode</FieldLabel>
                        <input className="field w-full" value={profile.postcode ?? ""} onChange={(e) => updateProfile({ postcode: e.target.value || null })} placeholder="e.g. EH1 1AB" />
                      </div>
                    </div>
                    {profile.is_mobile && (
                      <div>
                        <FieldLabel>Travel radius (miles)</FieldLabel>
                        <input type="number" min={1} max={50} className="field w-full sm:w-32" value={profile.travel_radius_miles ?? ""} onChange={(e) => updateProfile({ travel_radius_miles: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 10" />
                        <p className="text-xs text-pebble-grey mt-1">Radius is measured from the address above.</p>
                      </div>
                    )}
                    <SaveRow onSave={saveOperation} pending={operationPending} />
                  </div>
                )}
              </div>

              {/* ── Services & Pricing ── */}
              <div>
                <SectionHeader title="Services & pricing" open={openSection === "services"} onToggle={() => toggleSection("services")} />
                {openSection === "services" && (
                  <div className="pb-4 space-y-4">
                    {/* Deposit settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <FieldLabel>Deposit policy</FieldLabel>
                        <select className="field w-full" value={profile.deposit_type ?? "none"} onChange={(e) => updateProfile({ deposit_type: e.target.value })}>
                          {DEPOSIT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </div>
                      {profile.deposit_type === "percentage" && (
                        <div>
                          <FieldLabel>Deposit %</FieldLabel>
                          <input type="number" min={0} max={100} className="field w-full" value={profile.deposit_percentage ?? ""} onChange={(e) => updateProfile({ deposit_percentage: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 25" />
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-pebble-grey/10">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">Services ({services.length})</p>
                        <button type="button" onClick={handleAddService} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sage-leaf/10 text-sage-leaf hover:bg-sage-leaf/20 border border-sage-leaf/30 transition-colors">
                          <PlusIcon size={12} /> Add service
                        </button>
                      </div>
                      {services.length === 0 && (
                        <p className="text-sm text-pebble-grey text-center py-4">No services yet.</p>
                      )}
                      <div className="space-y-2">
                        {services.map((svc) => (
                          <div key={svc.id} className="bg-alabaster-cream/60 rounded-xl p-3 space-y-2">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <div className="col-span-2 sm:col-span-1">
                                <FieldLabel>Name</FieldLabel>
                                <input className="field w-full text-xs py-1" value={svc.name} onChange={(e) => setServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, name: e.target.value } : s))} onBlur={() => handleUpdateService(svc.id, { name: svc.name })} />
                              </div>
                              <div>
                                <FieldLabel>Price (£)</FieldLabel>
                                <input type="number" min={0} step={0.01} className="field w-full text-xs py-1" value={(svc.price_pence / 100).toFixed(2)} onChange={(e) => setServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, price_pence: Math.round(Number(e.target.value) * 100) } : s))} onBlur={() => handleUpdateService(svc.id, { price_pence: svc.price_pence })} />
                              </div>
                              <div>
                                <FieldLabel>Duration (min)</FieldLabel>
                                <input type="number" min={0} className="field w-full text-xs py-1" value={svc.duration_minutes ?? ""} onChange={(e) => setServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, duration_minutes: e.target.value ? Number(e.target.value) : null } : s))} onBlur={() => handleUpdateService(svc.id, { duration_minutes: svc.duration_minutes })} />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={svc.is_active} onChange={(e) => handleUpdateService(svc.id, { is_active: e.target.checked })} className="w-3.5 h-3.5 accent-groomr-gold" />
                                <span className="text-xs font-bold text-pebble-grey">Active</span>
                              </label>
                              <button type="button" onClick={() => handleDeleteService(svc.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors">
                                <TrashIcon size={12} /> Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-pebble-grey">Services save automatically on field blur. Deposit policy saves with the button below.</p>
                    <SaveRow onSave={saveSettings} pending={settingsPending} />
                  </div>
                )}
              </div>

              {/* ── Hours & Availability ── */}
              <div>
                <SectionHeader title="Hours & availability" open={openSection === "availability"} onToggle={() => toggleSection("availability")} />
                {openSection === "availability" && (
                  <div className="pb-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={profile.is_accepting_bookings} onChange={(e) => updateProfile({ is_accepting_bookings: e.target.checked })} className="w-4 h-4 accent-groomr-gold" />
                        <span className="text-sm font-bold text-deep-slate">Accepting bookings</span>
                      </label>
                      <div>
                        <FieldLabel>Buffer between appointments</FieldLabel>
                        <select className="field w-full" value={profile.default_buffer_minutes ?? 0} onChange={(e) => updateProfile({ default_buffer_minutes: Number(e.target.value) })}>
                          {BUFFER_OPTIONS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-pebble-grey/10">
                      {DAY_LABELS.map((day, dow) => {
                        const row = availability.find((r) => r.day_of_week === dow);
                        const active = row?.is_active ?? false;
                        return (
                          <div key={dow} className="flex items-center gap-3 flex-wrap">
                            <label className="flex items-center gap-2 cursor-pointer w-24 shrink-0">
                              <input type="checkbox" checked={active} onChange={(e) => toggleDay(dow, e.target.checked)} className="w-4 h-4 accent-groomr-gold" />
                              <span className="text-sm font-bold text-deep-slate">{day.slice(0, 3)}</span>
                            </label>
                            {active && (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <input type="time" className="field py-1 text-xs" value={row?.start_time ?? "09:00"} onChange={(e) => updateDayRow(dow, { start_time: e.target.value })} />
                                  <span className="text-pebble-grey text-xs">to</span>
                                  <input type="time" className="field py-1 text-xs" value={row?.end_time ?? "17:00"} onChange={(e) => updateDayRow(dow, { end_time: e.target.value })} />
                                </div>
                              </>
                            )}
                            {!active && <span className="text-xs text-pebble-grey">Closed</span>}
                          </div>
                        );
                      })}
                    </div>
                    <SaveRow onSave={saveAvailability} pending={availPending} />
                  </div>
                )}
              </div>

              {/* ── Team Groomers ── */}
              <div>
                <SectionHeader title="Team groomers" open={openSection === "team"} onToggle={() => toggleSection("team")} />
                {openSection === "team" && (
                  <div className="pb-4">
                    {teamMembers.length === 0 ? (
                      <p className="text-sm text-pebble-grey py-2">No team members.</p>
                    ) : (
                      <div className="space-y-2 pt-1">
                        {teamMembers.map((m) => (
                          <div key={m.id} className="flex items-center justify-between gap-3 py-2 border-b border-pebble-grey/10 last:border-0">
                            <div>
                              <p className="font-bold text-deep-slate text-sm leading-tight">{m.name}</p>
                              <p className="text-xs text-pebble-grey">{m.role}{m.email ? ` · ${m.email}` : ""}</p>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              m.invite_status === "accepted"
                                ? "bg-sage-leaf/10 text-sage-leaf border-sage-leaf/30"
                                : m.invite_status === "revoked"
                                ? "bg-muted-terracotta/10 text-muted-terracotta border-muted-terracotta/30"
                                : "bg-groomr-gold/20 text-deep-slate border-groomr-gold/40"
                            }`}>
                              {m.invite_status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Verification ── */}
              <div>
                <SectionHeader title="Verification" open={openSection === "verification"} onToggle={() => toggleSection("verification")} />
                {openSection === "verification" && (() => {
                  const docs: { type: DocVerifyKey; label: string; required: boolean | "if_employees" }[] = [
                    { type: "insurance",            label: "Public liability insurance", required: true },
                    { type: "photo_id",             label: "Photo ID",                  required: true },
                    { type: "employers_liability",  label: "Employers' liability",       required: "if_employees" },
                    { type: "qualification",        label: "Qualifications",             required: false },
                    { type: "first_aid",            label: "Pet first aid certificate",  required: false },
                  ];

                  const requiredDocs = docs.filter((d) =>
                    d.required === true || (d.required === "if_employees" && profile.has_employees)
                  );
                  const verifiedCount = requiredDocs.filter((d) => (profile as any)[`${d.type}_doc_verified`]).length;
                  const allRequiredVerified = verifiedCount === requiredDocs.length;

                  return (
                    <div className="pb-4 space-y-4">
                      {/* Status override */}
                      <div>
                        <FieldLabel>Status override</FieldLabel>
                        <div className="flex gap-2">
                          <select className="field flex-1" value={profile.verification_status} onChange={(e) => updateProfile({ verification_status: e.target.value })}>
                            {VERIFICATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                          <button
                            type="button"
                            onClick={saveVerification}
                            disabled={verifyPending}
                            className="btn-primary font-nunito font-bold px-4 py-2 rounded-full text-sm focus-ring disabled:opacity-40 shrink-0"
                          >
                            {verifyPending ? "Saving…" : "Save"}
                          </button>
                        </div>
                        <p className="text-[11px] text-pebble-grey mt-1">Use to revoke or manually override. Verified status is set automatically when all required docs pass.</p>
                      </div>

                      {/* Required docs progress */}
                      <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-pebble-grey/20 bg-alabaster-cream/60">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${allRequiredVerified ? "bg-sage-leaf text-white" : "bg-pebble-grey/20 text-deep-slate"}`}>
                          {allRequiredVerified ? "✓" : `${verifiedCount}/${requiredDocs.length}`}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-deep-slate">
                            {allRequiredVerified ? "All required documents verified" : "Required documents"}
                          </p>
                          <p className="text-[11px] text-pebble-grey">
                            {allRequiredVerified
                              ? "Profile will auto-upgrade to Verified on next doc approval."
                              : `${requiredDocs.length - verifiedCount} remaining before profile can be verified.`}
                          </p>
                        </div>
                      </div>

                      {/* Doc cards */}
                      <div className="space-y-2 pt-1 border-t border-pebble-grey/10">
                        {docs.map(({ type, label, required }) => {
                          const url = (profile as any)[`${type}_doc_url`] as string | null;
                          const verified = (profile as any)[`${type}_doc_verified`] as boolean;
                          const isRequired = required === true || (required === "if_employees" && profile.has_employees);
                          const pending = docPending[type];
                          const isPhotoIdVerified = type === "photo_id" && verified;

                          return (
                            <div
                              key={type}
                              className={`rounded-xl p-3 border transition-colors ${
                                verified
                                  ? "bg-sage-leaf/5 border-sage-leaf/20"
                                  : url
                                  ? "bg-groomr-gold/5 border-groomr-gold/30"
                                  : "bg-alabaster-cream/60 border-pebble-grey/15"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-deep-slate">{label}</span>
                                  {isRequired ? (
                                    <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted-terracotta/10 text-muted-terracotta uppercase tracking-wide">Required</span>
                                  ) : (
                                    <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-pebble-grey/10 text-pebble-grey uppercase tracking-wide">Optional</span>
                                  )}
                                </div>
                                {/* Status chip */}
                                {verified ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sage-leaf/15 text-sage-leaf border border-sage-leaf/25 shrink-0">✓ Verified</span>
                                ) : url ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-groomr-gold/20 text-deep-slate border border-groomr-gold/40 shrink-0">Pending review</span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-pebble-grey/10 text-pebble-grey border border-pebble-grey/20 shrink-0">Not submitted</span>
                                )}
                              </div>

                              {/* View link */}
                              {isPhotoIdVerified ? (
                                <p className="text-[11px] text-pebble-grey mb-2">Identity confirmed · document deleted</p>
                              ) : url ? (
                                <a
                                  href={docViewUrl(url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-sage-leaf font-bold hover:opacity-70 mb-2"
                                >
                                  View document ↗
                                </a>
                              ) : (
                                <p className="text-[11px] text-pebble-grey mb-2">No document uploaded</p>
                              )}

                              {/* Actions — only when doc is uploaded and not yet verified */}
                              {url && !verified && (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyDoc(type)}
                                    disabled={!!pending}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-sage-leaf text-white hover:opacity-80 disabled:opacity-40 transition-opacity"
                                  >
                                    {pending === "verifying" ? "Verifying…" : "✓ Verify"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectDoc(type)}
                                    disabled={!!pending}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-muted-terracotta/10 text-muted-terracotta border border-muted-terracotta/30 hover:bg-muted-terracotta/20 disabled:opacity-40 transition-colors"
                                  >
                                    {pending === "rejecting" ? "Rejecting…" : "✗ Reject"}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ── Account Settings ── */}
              <div>
                <SectionHeader title="Account settings" open={openSection === "settings"} onToggle={() => toggleSection("settings")} />
                {openSection === "settings" && (
                  <div className="pb-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      <div className="space-y-2.5">
                        {(
                          [
                            ["is_listed", "Listed in search results"],
                            ["has_employees", "Has employees"],
                          ] as [keyof GroomerFullProfile, string][]
                        ).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={!!profile[key]} onChange={(e) => updateProfile({ [key]: e.target.checked } as any)} className="w-4 h-4 accent-groomr-gold" />
                            <span className="text-sm font-bold text-deep-slate">{label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <FieldLabel>Years experience</FieldLabel>
                          <input type="number" min={0} className="field w-full" value={profile.years_experience ?? ""} onChange={(e) => updateProfile({ years_experience: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 5" />
                        </div>
                        <div>
                          <FieldLabel>Qualifications</FieldLabel>
                          <input className="field w-full" value={profile.qualifications ?? ""} onChange={(e) => updateProfile({ qualifications: e.target.value || null })} placeholder="e.g. City & Guilds Level 3" />
                        </div>
                      </div>
                    </div>
                    <SaveRow onSave={saveSettings} pending={settingsPending} />
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Sticky footer — stays visible at the bottom of the Modal's scroll */}
        <div className="sticky bottom-0 bg-alabaster-cream z-10 pt-3 border-t border-pebble-grey/10 mt-4 flex justify-end">
          <button
            className="btn-secondary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
