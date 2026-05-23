"use client";

import { useMemo, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PlusIcon, PencilIcon, TrashIcon, StarIcon, UploadIcon } from "@/components/ui/GroomrIcons";
import { cn } from "@/lib/utils";
import { saveProfile, saveServices, saveAvailability, getCoverPhotoSignature, saveCoverPhoto } from "@/app/actions/profile-editor";
import { inviteTeamMember, removeTeamMember } from "@/app/actions/team-members";
import { CloseAccountModal } from "@/app/_components/CloseAccountModal";
import type { ProfileFormData, ServiceRow, AvailabilityRow, TeamMemberRow } from "@/types/groomer-dashboard";

const SERVICE_TEMPLATES: Array<{ name: string; duration: number; price: number }> = [
  { name: "Bath & Brush",          duration: 45,  price: 3800 },
  { name: "Full Groom",            duration: 90,  price: 5800 },
  { name: "Hand Strip",            duration: 120, price: 8000 },
  { name: "Nail Clip",             duration: 15,  price: 1500 },
  { name: "Teeth Brushing",        duration: 15,  price: 1000 },
  { name: "Ear Clean",             duration: 10,  price:  800 },
  { name: "Dematting",             duration: 60,  price: 4000 },
  { name: "Puppy First Groom",     duration: 45,  price: 3500 },
  { name: "Anal Gland Expression", duration: 10,  price: 1200 },
];

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

// Mon-first display order (UK standard): 1,2,3,4,5,6,0
const AVAIL_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  groomerProfileId: string;
  initialProfile: ProfileFormData;
  initialCoverPhotoUrl: string | null;
  initialServices: ServiceRow[];
  initialAvailability: AvailabilityRow[];
  initialTeam: TeamMemberRow[];
  viewerRole: "owner" | "team_member";
}

export function ProfileEditor({
  groomerProfileId,
  initialProfile,
  initialCoverPhotoUrl,
  initialServices,
  initialAvailability,
  initialTeam,
  viewerRole,
}: Props) {
  const [formData, setFormData] = useState<ProfileFormData>(initialProfile);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(initialCoverPhotoUrl);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [services, setServices] = useState<ServiceRow[]>(initialServices);
  const [savedServices, setSavedServices] = useState<ServiceRow[]>(initialServices);
  const [availability, setAvailability] = useState<AvailabilityRow[]>(initialAvailability);
  const [team, setTeam] = useState<TeamMemberRow[]>(initialTeam);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", role: "", email: "" });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [pausing, startPause] = useTransition();
  const [isPaused, setIsPaused] = useState(() => availability.length > 0 && availability.every((r) => !r.isActive));
  const [closeAccountOpen, setCloseAccountOpen] = useState(false);
  const prePauseRef = useRef<AvailabilityRow[] | null>(null);
  // Tracks the last-saved availability so auto-saves (pause/re-open) don't trigger the save button
  const [savedAvailability, setSavedAvailability] = useState(initialAvailability);
  const router = useRouter();

  const isDirty = useMemo(
    () =>
      JSON.stringify(formData) !== JSON.stringify(initialProfile) ||
      JSON.stringify(services) !== JSON.stringify(savedServices) ||
      JSON.stringify(availability) !== JSON.stringify(savedAvailability),
    [formData, initialProfile, services, savedServices, availability, savedAvailability]
  );

  function updateAvailability(dayOfWeek: number, patch: Partial<AvailabilityRow>) {
    setAvailability((arr) =>
      arr.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row))
    );
  }

  function setField<K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) {
    setFormData((d) => ({ ...d, [key]: value }));
  }

  function updateService(index: number, patch: Partial<ServiceRow>) {
    setServices((arr) => arr.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addTemplateService(tpl: (typeof SERVICE_TEMPLATES)[0]) {
    if (services.some((s) => s.name === tpl.name)) return;
    setServices((arr) => [
      ...arr,
      { id: null, name: tpl.name, duration: tpl.duration, price: tpl.price, sortOrder: arr.length },
    ]);
  }

  async function handleCoverPhotoUpload(file: File) {
    setCoverUploading(true);
    try {
      const sig = await getCoverPhotoSignature(groomerProfileId);
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: "POST", body: form }
      );
      const json = await res.json();
      if (!json.secure_url) throw new Error("Upload failed");

      await saveCoverPhoto(groomerProfileId, json.secure_url);
      setCoverPhotoUrl(json.secure_url);
    } catch {
      // silently ignore — user can retry
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);
    setSaveError(null);
    const [profileResult, servicesResult, availabilityResult] = await Promise.all([
      saveProfile(groomerProfileId, formData),
      saveServices(groomerProfileId, services),
      saveAvailability(groomerProfileId, availability),
    ]);
    setSaving(false);
    const err = profileResult.error ?? servicesResult.error ?? availabilityResult.error;
    if (err) {
      setSaveError(err);
    } else {
      // Update saved references so isDirty clears immediately, before router.refresh()
      // brings back new UUIDs from the re-inserted service rows.
      const freshServices = servicesResult.services ?? services;
      setServices(freshServices);
      setSavedServices(freshServices);
      setSavedAvailability(availability);
      router.refresh();
    }
  }

  async function handleDiscard() {
    setFormData(initialProfile);
    setServices(savedServices);
    setAvailability(savedAvailability);
  }

  async function handleAddMember() {
    if (!newMember.name.trim() || !newMember.email.trim()) return;
    setInviting(true);
    setInviteError(null);
    const result = await inviteTeamMember(groomerProfileId, {
      name: newMember.name,
      role: newMember.role || "Groomer",
      email: newMember.email,
    });
    setInviting(false);
    if (result.error) {
      setInviteError(result.error);
      return;
    }
    setTeam((t) => [
      ...t,
      {
        id: result.teamMemberId!,
        name: newMember.name,
        role: newMember.role || "Groomer",
        sinceYear: String(new Date().getFullYear()),
        email: newMember.email,
        userId: null,
        inviteStatus: "pending",
        averageRating: 0,
        totalReviews: 0,
        publicSlug: null,
      },
    ]);
    setNewMember({ name: "", role: "", email: "" });
    setAdding(false);
  }

  async function handleRemoveMember(id: string) {
    const result = await removeTeamMember(id);
    if (!result.error) {
      setTeam((t) => t.filter((m) => m.id !== id));
    }
  }

  return (
    <section className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-6 min-w-0">

        {/* Business basics */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
          <div className="flex items-center justify-between mb-4">
            <Eyebrow>Business basics</Eyebrow>
            <button className="text-xs font-bold text-deep-slate text-link">Preview public profile →</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FieldGroup label="Business name">
              <input
                className="field"
                value={formData.businessName}
                onChange={(e) => setField("businessName", e.target.value)}
                disabled={viewerRole === "team_member"}
              />
            </FieldGroup>
            <FieldGroup label="Owner / lead">
              <input
                className="field bg-alabaster-cream cursor-default"
                value={formData.ownerName}
                readOnly
                title="Update your name in account settings"
              />
              <p className="text-[10px] font-bold text-pebble-grey mt-1">Managed in account settings</p>
            </FieldGroup>
            <FieldGroup label="Email">
              <input
                className="field"
                value={formData.email}
                onChange={(e) => setField("email", e.target.value)}
                disabled={viewerRole === "team_member"}
              />
            </FieldGroup>
            <FieldGroup label="Phone">
              <input
                className="field"
                value={formData.phone}
                onChange={(e) => setField("phone", e.target.value)}
                disabled={viewerRole === "team_member"}
              />
            </FieldGroup>
          </div>
          {viewerRole === "owner" && (
            <div className="mt-4">
              <FieldGroup label="Bio (max 280 chars)">
                <textarea
                  value={formData.bio}
                  onChange={(e) => setField("bio", e.target.value.slice(0, 280))}
                  className="field min-h-[100px]"
                />
                <p className="text-[10px] font-bold text-pebble-grey mt-1">{formData.bio.length}/280</p>
              </FieldGroup>
            </div>
          )}
        </div>

        {/* Mode + radius — owner only */}
        {viewerRole === "owner" && (
          <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
            <Eyebrow>How you operate</Eyebrow>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {([
                { k: "studio", l: "Studio (clients come to us)", sub: "Fixed location" },
                { k: "mobile", l: "Mobile (we drive)",           sub: "You travel to clients" },
              ] as const).map((m) => (
                <button
                  key={m.k}
                  onClick={() => setField("businessMode", m.k)}
                  className={cn(
                    "text-left rounded-2xl p-4 border-2 transition-colors focus-ring",
                    formData.businessMode === m.k
                      ? "border-deep-slate bg-alabaster-cream"
                      : "border-pebble-grey/20 hover:border-deep-slate"
                  )}
                >
                  <p className="font-fredoka text-lg text-deep-slate">{m.l}</p>
                  <p className="text-xs text-pebble-grey font-bold mt-1">{m.sub}</p>
                </button>
              ))}
            </div>
            {formData.businessMode === "mobile" && (
              <div className="mt-4 bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">
                <div className="flex justify-between items-baseline">
                  <p className="text-xs font-bold uppercase tracking-wider text-sage-leaf">Service radius</p>
                  <p className="font-fredoka text-2xl text-deep-slate">{formData.radius} mi</p>
                </div>
                <input
                  type="range" min="1" max="20"
                  value={formData.radius}
                  onChange={(e) => setField("radius", Number(e.target.value))}
                  className="w-full mt-2 accent-deep-slate"
                />
                <div className="flex justify-between text-[10px] font-bold text-pebble-grey mt-1">
                  <span>1 mi</span><span>20 mi</span>
                </div>
              </div>
            )}
            {formData.businessMode === "studio" && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <FieldGroup label="Studio address">
                  <input
                    className="field"
                    value={formData.addressLine1}
                    onChange={(e) => setField("addressLine1", e.target.value)}
                  />
                </FieldGroup>
                <FieldGroup label="Postcode">
                  <input
                    className="field"
                    value={formData.postcode}
                    onChange={(e) => setField("postcode", e.target.value)}
                  />
                </FieldGroup>
              </div>
            )}
          </div>
        )}

        {/* Services & pricing — owner only */}
        {viewerRole === "owner" && (
          <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
            <div className="flex items-center justify-between mb-4">
              <Eyebrow>Services &amp; pricing</Eyebrow>
              <button
                onClick={() =>
                  setServices((s) => [
                    ...s,
                    { id: null, name: "New service", duration: 30, price: 2000, sortOrder: s.length },
                  ])
                }
                className="btn-secondary font-nunito font-bold px-4 py-1.5 rounded-full text-xs focus-ring flex items-center gap-1"
              >
                <PlusIcon size={12} /> Add custom
              </button>
            </div>

            {/* Quick-add templates */}
            <div className="mb-4">
              <button
                onClick={() => setTemplatesOpen((o) => !o)}
                className="text-xs font-bold text-deep-slate flex items-center gap-1 mb-2"
              >
                <span className="text-pebble-grey">{templatesOpen ? "▾" : "▸"}</span>
                Quick-add standard services
              </button>
              {templatesOpen && (
                <div className="flex flex-wrap gap-2">
                  {SERVICE_TEMPLATES.map((tpl) => {
                    const alreadyAdded = services.some((s) => s.name === tpl.name);
                    return (
                      <button
                        key={tpl.name}
                        onClick={() => addTemplateService(tpl)}
                        disabled={alreadyAdded}
                        className={cn(
                          "text-xs font-bold px-3 py-1.5 rounded-full border transition-colors focus-ring",
                          alreadyAdded
                            ? "border-pebble-grey/20 text-pebble-grey/40 cursor-not-allowed"
                            : "border-deep-slate/30 text-deep-slate hover:bg-alabaster-cream"
                        )}
                      >
                        {tpl.name}
                        {alreadyAdded && " ✓"}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-[1fr_100px_100px_40px] gap-3 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-pebble-grey">
                <span>Service</span><span>Duration</span><span>Price</span><span />
              </div>
              {services.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_100px_100px_40px] gap-2 sm:gap-3 items-start sm:items-center">
                  <input
                    className="field"
                    value={s.name}
                    onChange={(e) => updateService(i, { name: e.target.value })}
                  />
                  <div className="relative">
                    <input
                      className="field pr-10"
                      type="number"
                      value={s.duration}
                      onChange={(e) => updateService(i, { duration: Number(e.target.value) })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-pebble-grey">min</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-pebble-grey">£</span>
                    <input
                      className="field pl-7"
                      type="number"
                      step="0.01"
                      value={(s.price / 100).toFixed(2)}
                      onChange={(e) => updateService(i, { price: Math.round(Number(e.target.value) * 100) })}
                    />
                  </div>
                  <button
                    onClick={() => setServices((arr) => arr.filter((_, j) => j !== i))}
                    className="rounded-full p-2 text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors focus-ring"
                    aria-label="Remove"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Deposit policy */}
            <div className="mt-5 pt-4 border-t border-pebble-grey/15 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Deposit policy</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { k: "none"       as const, l: "No deposit",       sub: "Pay on the day"  },
                  { k: "percentage" as const, l: "% Deposit",        sub: "Upfront %"       },
                  { k: "full"       as const, l: "Full pre-payment",  sub: "100% at booking" },
                ]).map((opt) => (
                  <button
                    key={opt.k}
                    onClick={() => setField("depositType", opt.k)}
                    className={cn(
                      "text-left rounded-2xl p-3 border-2 transition-colors focus-ring",
                      formData.depositType === opt.k
                        ? "border-deep-slate bg-alabaster-cream"
                        : "border-pebble-grey/20 hover:border-deep-slate"
                    )}
                  >
                    <p className="font-fredoka text-base text-deep-slate">{opt.l}</p>
                    <p className="text-[10px] text-pebble-grey font-bold mt-0.5">{opt.sub}</p>
                  </button>
                ))}
              </div>
              {formData.depositType === "percentage" && (
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey whitespace-nowrap">
                    Deposit %
                  </label>
                  <select
                    value={formData.depositPercentage}
                    onChange={(e) => setField("depositPercentage", Number(e.target.value))}
                    className="bg-alabaster-cream border border-pebble-grey/20 text-deep-slate text-sm rounded-full focus:ring-2 focus:ring-groomr-gold focus:border-groomr-gold px-4 py-2 outline-none font-bold cursor-pointer"
                  >
                    {[10, 15, 20, 25, 30, 33, 50].map((pct) => (
                      <option key={pct} value={pct}>{pct}%</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hours & availability — owner only */}
        {viewerRole === "owner" && (
          <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
            <Eyebrow>Hours &amp; availability</Eyebrow>
            <p className="text-xs text-pebble-grey font-bold mt-1 mb-4">
              Set the days and hours owners can book appointments.
            </p>

            {/* Buffer time */}
            <div className="mb-4 bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey">Buffer between appointments</p>
                  <p className="text-[10px] font-bold text-pebble-grey/70 mt-0.5">Gap added after each booking — not shown to customers</p>
                </div>
                <select
                  value={formData.bufferMinutes}
                  onChange={(e) => setField("bufferMinutes", Number(e.target.value))}
                  className="bg-white border border-pebble-grey/20 text-deep-slate text-sm rounded-full focus:ring-2 focus:ring-groomr-gold focus:border-groomr-gold px-4 py-2 outline-none font-bold cursor-pointer"
                >
                  {[0, 5, 10, 15, 20, 30].map((m) => (
                    <option key={m} value={m}>{m === 0 ? "No buffer" : `${m} min`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {AVAIL_DISPLAY_ORDER.map((dow) => {
                const row = availability.find((r) => r.dayOfWeek === dow) ?? {
                  dayOfWeek: dow,
                  startTime: "09:00",
                  endTime: "17:00",
                  isActive: false,
                };
                return (
                  <div
                    key={dow}
                    className={cn(
                      "grid grid-cols-[80px_1fr] sm:grid-cols-[80px_auto_auto_1fr] gap-3 items-center rounded-xl px-4 py-3 border transition-colors",
                      row.isActive
                        ? "border-deep-slate/20 bg-alabaster-cream"
                        : "border-pebble-grey/15 bg-white opacity-60"
                    )}
                  >
                    <button
                      onClick={() => updateAvailability(dow, { isActive: !row.isActive })}
                      className={cn(
                        "flex items-center gap-2 focus-ring rounded-full px-1 py-0.5 transition-colors",
                        row.isActive ? "text-deep-slate" : "text-pebble-grey"
                      )}
                      aria-label={`Toggle ${DAY_LABELS[dow]}`}
                    >
                      <span
                        className={cn(
                          "w-8 h-4 rounded-full transition-colors relative shrink-0",
                          row.isActive ? "bg-deep-slate" : "bg-pebble-grey/30"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                            row.isActive ? "left-4" : "left-0.5"
                          )}
                        />
                      </span>
                      <span className="font-bold text-sm w-8">{DAY_LABELS[dow]}</span>
                    </button>

                    <div className="flex items-center gap-2 col-span-1 sm:col-span-3">
                      <input
                        type="time"
                        value={row.startTime}
                        disabled={!row.isActive}
                        onChange={(e) => updateAvailability(dow, { startTime: e.target.value })}
                        className="field py-1.5 text-sm w-32 disabled:cursor-not-allowed"
                      />
                      <span className="text-xs font-bold text-pebble-grey">to</span>
                      <input
                        type="time"
                        value={row.endTime}
                        disabled={!row.isActive}
                        onChange={(e) => updateAvailability(dow, { endTime: e.target.value })}
                        className="field py-1.5 text-sm w-32 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Team */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Eyebrow>Team groomers</Eyebrow>
              <p className="text-xs text-pebble-grey font-bold mt-1">Each groomer gets their own public profile under your business.</p>
            </div>
            {viewerRole === "owner" && (
              <button
                onClick={() => setAdding(true)}
                className="btn-primary font-nunito font-bold px-4 py-1.5 rounded-full text-xs focus-ring shadow-subtle flex items-center gap-1"
              >
                <PlusIcon size={12} /> Add groomer
              </button>
            )}
          </div>

          <div className="space-y-3">
            {team.map((m) => (
              <div key={m.id} className="flex items-center gap-4 bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">
                <div className="w-12 h-12 rounded-2xl bg-sage-leaf text-white font-fredoka text-xl flex items-center justify-center shrink-0">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-fredoka text-lg text-deep-slate">{m.name}</p>
                    <span className="text-xs text-pebble-grey font-bold">· since {m.sinceYear}</span>
                    {m.inviteStatus === "pending" && (
                      <span className="text-[10px] font-bold bg-groomr-gold/20 text-deep-slate border border-groomr-gold/40 px-2 py-0.5 rounded-full">
                        Invite pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-deep-slate font-bold">{m.role}</p>
                  {m.totalReviews > 0 && (
                    <p className="text-xs text-pebble-grey font-bold mt-0.5 flex items-center gap-1">
                      <StarIcon size={10} /> {m.averageRating} · {m.totalReviews} reviews
                    </p>
                  )}
                  {m.email && m.inviteStatus === "pending" && (
                    <p className="text-[11px] font-bold text-pebble-grey mt-0.5 truncate">{m.email}</p>
                  )}
                  {m.publicSlug && m.inviteStatus === "accepted" && (
                    <p className="text-[11px] font-bold text-sage-leaf mt-0.5 truncate">
                      groomr.co/{m.publicSlug}
                    </p>
                  )}
                </div>
                <button
                  className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring"
                  aria-label="Edit"
                >
                  <PencilIcon size={14} />
                </button>
                {viewerRole === "owner" && (
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="rounded-full p-2 text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors focus-ring"
                    aria-label="Remove"
                  >
                    <TrashIcon size={14} />
                  </button>
                )}
              </div>
            ))}

            {adding && (
              <div className="border-2 border-dashed border-deep-slate/30 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FieldGroup label="Name">
                    <input
                      className="field"
                      placeholder="e.g. Hannah Reid"
                      value={newMember.name}
                      onChange={(e) => setNewMember((m) => ({ ...m, name: e.target.value }))}
                    />
                  </FieldGroup>
                  <FieldGroup label="Role">
                    <input
                      className="field"
                      placeholder="e.g. Senior groomer"
                      value={newMember.role}
                      onChange={(e) => setNewMember((m) => ({ ...m, role: e.target.value }))}
                    />
                  </FieldGroup>
                  <FieldGroup label="Email address">
                    <input
                      className="field"
                      type="email"
                      placeholder="e.g. hannah@yoursalon.co.uk"
                      value={newMember.email}
                      onChange={(e) => setNewMember((m) => ({ ...m, email: e.target.value }))}
                    />
                  </FieldGroup>
                </div>
                {inviteError && (
                  <p className="text-xs font-bold text-muted-terracotta">{inviteError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleAddMember}
                    disabled={inviting || !newMember.name.trim() || !newMember.email.trim()}
                    className="btn-primary font-nunito font-bold px-4 py-2.5 rounded-full text-sm focus-ring disabled:opacity-50"
                  >
                    {inviting ? "Sending invite…" : "Send invite"}
                  </button>
                  <button
                    onClick={() => { setAdding(false); setNewMember({ name: "", role: "", email: "" }); setInviteError(null); }}
                    className="btn-secondary font-nunito font-bold px-4 py-2.5 rounded-full text-sm focus-ring"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky save bar — only when dirty */}
        {isDirty && (
          <div className="sticky bottom-4 z-10">
            <div className="bg-deep-slate text-alabaster-cream rounded-[20px] p-4 flex items-center justify-between shadow-lift">
              <p className="text-sm font-bold">You have unsaved changes.</p>
              {saveError && (
                <p className="text-xs text-muted-terracotta font-bold mr-4">{saveError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleDiscard}
                  className="bg-white/10 hover:bg-white/20 font-nunito font-bold px-4 py-2 rounded-full text-sm focus-ring transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-groomr-gold text-deep-slate font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring shadow-subtle disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save profile"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right column */}
      <aside className="space-y-5">
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
          <Eyebrow>Public profile</Eyebrow>
          <div className="mt-3 aspect-[5/3] rounded-xl bg-sage-leaf/20 overflow-hidden relative">
            {coverPhotoUrl ? (
              <Image
                src={coverPhotoUrl}
                alt="Cover photo"
                fill
                className="object-cover"
                sizes="360px"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-sage-leaf/60">
                <UploadIcon size={28} />
                <p className="text-xs font-bold">No cover photo yet</p>
              </div>
            )}
            {coverUploading && (
              <div className="absolute inset-0 bg-deep-slate/50 flex items-center justify-center">
                <p className="text-xs font-bold text-white">Uploading…</p>
              </div>
            )}
          </div>
          {/* Hidden file input */}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCoverPhotoUpload(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={coverUploading}
            className="btn-secondary w-full font-nunito font-bold py-2 rounded-full text-xs mt-3 focus-ring disabled:opacity-50"
          >
            {coverUploading ? "Uploading…" : "Replace cover photo"}
          </button>
          <button
            onClick={() => window.location.href = "/dashboard/groomer/portfolio"}
            className="btn-secondary w-full font-nunito font-bold py-2 rounded-full text-xs mt-2 focus-ring"
          >
            Manage portfolio
          </button>
        </div>

        <div className="bg-deep-slate text-alabaster-cream rounded-[20px] p-5">
          <Eyebrow className="text-groomr-gold">Account health</Eyebrow>
          {(() => {
            const checks = [
              { label: "Business name set",    done: !!initialProfile.businessName },
              { label: "Bio written",          done: !!initialProfile.bio },
              { label: "Phone number added",   done: !!initialProfile.phone },
              { label: "Services added",       done: services.length > 0 },
              { label: "Availability set",     done: availability.some((r) => r.isActive) },
              { label: "Location configured",  done: initialProfile.businessMode === "studio" ? !!initialProfile.addressLine1 : initialProfile.radius > 0 },
            ];
            const done = checks.filter((c) => c.done).length;
            const pct = Math.round((done / checks.length) * 100);
            const next = checks.find((c) => !c.done);
            return (
              <>
                <div className="mt-3 mb-3">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-alabaster-cream/70">Profile complete</span>
                    <span className="text-groomr-gold">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-alabaster-cream/20 rounded-full overflow-hidden">
                    <div className="h-full bg-groomr-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {checks.map((c) => (
                    <div key={c.label} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${c.done ? "bg-sage-leaf" : "bg-pebble-grey/40"}`} />
                      <span className={c.done ? "text-alabaster-cream/40 line-through" : "text-alabaster-cream"}>{c.label}</span>
                    </div>
                  ))}
                </div>
                {next && (
                  <div className="mt-4 pt-4 border-t border-alabaster-cream/10">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-groomr-gold mb-1">Next up</p>
                    <p className="text-xs text-alabaster-cream/80">{next.label}</p>
                    <button
                      onClick={() => {
                        const el = document.querySelector("[data-section='profile-form']");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="mt-2 text-xs font-bold text-groomr-gold hover:underline focus-ring rounded"
                    >
                      Complete now →
                    </button>
                  </div>
                )}
                {pct === 100 && (
                  <div className="mt-4 pt-4 border-t border-alabaster-cream/10">
                    <p className="text-xs font-bold text-sage-leaf">Profile complete — you&apos;re ready to take bookings.</p>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {viewerRole === "owner" && (
          <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
            <Eyebrow>Danger zone</Eyebrow>
            <button
              disabled={pausing}
              onClick={() => startPause(async () => {
                if (isPaused) {
                  const restored = prePauseRef.current ?? availability.map((r) => ({ ...r, isActive: true }));
                  setAvailability(restored);
                  setSavedAvailability(restored);
                  setIsPaused(false);
                  await saveAvailability(groomerProfileId, restored);
                } else {
                  prePauseRef.current = availability;
                  const paused = availability.map((r) => ({ ...r, isActive: false }));
                  setAvailability(paused);
                  setSavedAvailability(paused);
                  setIsPaused(true);
                  await saveAvailability(groomerProfileId, paused);
                }
                router.refresh();
              })}
              className="w-full mt-3 text-xs font-bold text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors py-2 rounded-full disabled:opacity-50">
              {pausing ? "Updating…" : isPaused ? "Re-open bookings" : "Pause new bookings"}
            </button>
            <button
              onClick={() => setCloseAccountOpen(true)}
              className="w-full text-xs font-bold text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors py-2 rounded-full">
              Close my Groomr account
            </button>

            <CloseAccountModal
              open={closeAccountOpen}
              onClose={() => setCloseAccountOpen(false)}
              role="groomer"
            />
          </div>
        )}
      </aside>
    </section>
  );
}
