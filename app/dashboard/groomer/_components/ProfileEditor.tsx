"use client";

import { useMemo, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PlusIcon, PencilIcon, TrashIcon, StarIcon, UploadIcon, ChevronDownIcon } from "@/components/ui/GroomrIcons";
import { cn } from "@/lib/utils";
import { saveProfile, saveServices, saveAvailability, getCoverPhotoSignature, saveCoverPhoto, getProfileImageSignature, saveProfileImage, toggleAcceptingBookings, getVerificationDocSignature, saveVerificationDoc, saveHasEmployees } from "@/app/actions/profile-editor";
import { inviteTeamMember, removeTeamMember } from "@/app/actions/team-members";
import { CloseAccountModal } from "@/app/_components/CloseAccountModal";
import type { ProfileFormData, ServiceRow, AvailabilityRow, TeamMemberRow, VerificationDocs, VerificationDocType } from "@/types/groomer-dashboard";

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

function SectionCard({
  id,
  eyebrow,
  headerRight,
  description,
  children,
  defaultOpen = false,
}: {
  id?: string;
  eyebrow: string;
  headerRight?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={id} className="bg-white border border-pebble-grey/20 rounded-[20px]">
      <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 min-w-0 focus-ring rounded-lg py-0.5 group"
        >
          <Eyebrow>{eyebrow}</Eyebrow>
          <span className="w-7 h-7 rounded-full flex items-center justify-center transition-colors group-hover:bg-pebble-grey/10 shrink-0">
            <ChevronDownIcon
              size={18}
              className={cn("text-pebble-grey/40 transition-all group-hover:text-deep-slate shrink-0", open && "rotate-180")}
            />
          </span>
        </button>
        {headerRight}
      </div>
      {open && (
        <div className="px-6 pb-6">
          {description && (
            <p className="text-xs text-pebble-grey font-bold -mt-1 mb-4">{description}</p>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

function BookingsToggle({
  groomerProfileId,
  isAcceptingBookings,
  onToggle,
}: {
  groomerProfileId: string;
  isAcceptingBookings: boolean;
  onToggle: (val: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleToggle(next: boolean) {
    const confirmed = window.confirm(
      next
        ? "Open your bookings? Clients will be able to find and book you in search results."
        : "Close your bookings? You will be hidden from search results and new bookings will be paused."
    );
    if (!confirmed) return;
    onToggle(next);
    startTransition(async () => {
      const result = await toggleAcceptingBookings(groomerProfileId, next);
      if (result?.error) {
        onToggle(!next);
        alert(result.error);
      }
    });
  }

  return (
    <div className="mb-4 bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey">Accepting bookings</p>
          <p className="text-[10px] font-bold text-pebble-grey/70 mt-0.5">
            {isAcceptingBookings
              ? "Open — clients can find and book you"
              : "Closed — hidden from search until you open"}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => handleToggle(!isAcceptingBookings)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-ring ${isAcceptingBookings ? "bg-sage-leaf" : "bg-pebble-grey/40"} ${pending ? "opacity-60 cursor-not-allowed" : ""}`}
          role="switch"
          aria-checked={isAcceptingBookings}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${isAcceptingBookings ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
      </div>
    </div>
  );
}

const VERIFICATION_DOC_META: Array<{
  type: VerificationDocType;
  label: string;
  hint: string;
  stateKey: keyof VerificationDocs;
  verifiedKey: keyof VerificationDocs;
  required: boolean | "if_employees";
}> = [
  { type: "insurance",          label: "Public liability insurance",     hint: "Certificate showing current cover",          stateKey: "insuranceDocUrl",          verifiedKey: "insuranceVerified",          required: true           },
  { type: "qualification",      label: "Grooming qualifications",        hint: "City & Guilds, iPET, LANTRA, or equivalent", stateKey: "qualificationDocUrl",      verifiedKey: "qualificationVerified",      required: false          },
  { type: "firstAid",           label: "Pet first aid certificate",      hint: "Must not be expired",                        stateKey: "firstAidDocUrl",           verifiedKey: "firstAidVerified",           required: false          },
  { type: "photoId",            label: "Photo ID",                       hint: "Passport or driving licence — deleted after verification", stateKey: "photoIdDocUrl", verifiedKey: "photoIdVerified",       required: true           },
  { type: "employersLiability", label: "Employers' liability insurance", hint: "Required if you employ staff",               stateKey: "employersLiabilityDocUrl", verifiedKey: "employersLiabilityVerified", required: "if_employees" },
];

// Mon-first display order (UK standard): 1,2,3,4,5,6,0
const AVAIL_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  groomerProfileId: string;
  initialProfile: ProfileFormData;
  initialCoverPhotoUrl: string | null;
  initialProfileImageUrl: string | null;
  initialServices: ServiceRow[];
  initialAvailability: AvailabilityRow[];
  initialTeam: TeamMemberRow[];
  viewerRole: "owner" | "team_member";
  initialVerificationDocs: VerificationDocs;
}

export function ProfileEditor({
  groomerProfileId,
  initialProfile,
  initialCoverPhotoUrl,
  initialProfileImageUrl,
  initialServices,
  initialAvailability,
  initialTeam,
  viewerRole,
  initialVerificationDocs,
}: Props) {
  const [formData, setFormData] = useState<ProfileFormData>(initialProfile);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(initialCoverPhotoUrl);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(initialProfileImageUrl);
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
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
  const [savedAvailability, setSavedAvailability] = useState(initialAvailability);
  const router = useRouter();
  const [verificationDocs, setVerificationDocs] = useState<VerificationDocs>(initialVerificationDocs);
  const [docUploading, setDocUploading] = useState<Partial<Record<VerificationDocType, boolean>>>({});
  const docInputRefs = useRef<Partial<Record<VerificationDocType, HTMLInputElement | null>>>({});
  const [hasEmployeesSaving, setHasEmployeesSaving] = useState(false);

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

  function applyBreakToAllDays(breakStartTime: string, breakEndTime: string) {
    setAvailability((arr) =>
      arr.map((row) =>
        row.isActive ? { ...row, breakStartTime, breakEndTime } : row
      )
    );
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

  async function handleProfileImageUpload(file: File) {
    setProfileImageUploading(true);
    try {
      const sig = await getProfileImageSignature(groomerProfileId);
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

      await saveProfileImage(groomerProfileId, json.secure_url);
      setProfileImageUrl(json.secure_url);
    } catch {
      // silently ignore — user can retry
    } finally {
      setProfileImageUploading(false);
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

  async function handleDocUpload(docType: VerificationDocType, file: File) {
    setDocUploading((d) => ({ ...d, [docType]: true }));
    try {
      const sig = await getVerificationDocSignature(groomerProfileId);
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
        { method: "POST", body: form }
      );
      const json = await res.json();
      if (!json.secure_url) throw new Error("Upload failed");

      await saveVerificationDoc(groomerProfileId, docType, json.secure_url);
      const meta = VERIFICATION_DOC_META.find((m) => m.type === docType)!;
      setVerificationDocs((d) => ({ ...d, [meta.stateKey]: json.secure_url }));
    } catch {
      // user can retry
    } finally {
      setDocUploading((d) => ({ ...d, [docType]: false }));
    }
  }

  async function handleHasEmployeesToggle(next: boolean) {
    setHasEmployeesSaving(true);
    setVerificationDocs((d) => ({ ...d, hasEmployees: next }));
    const result = await saveHasEmployees(groomerProfileId, next);
    if (result.error) setVerificationDocs((d) => ({ ...d, hasEmployees: !next }));
    setHasEmployeesSaving(false);
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

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-4 min-w-0">

        {/* Business basics */}
        <SectionCard
          id="section-basics"
          eyebrow="Business basics"
          headerRight={
            <button className="text-xs font-bold text-deep-slate text-link shrink-0">Preview public profile →</button>
          }
        >
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
        </SectionCard>

        {/* Mode + radius — owner only */}
        {viewerRole === "owner" && (
          <SectionCard id="section-operation" eyebrow="How you operate">
            <div className="grid grid-cols-2 gap-3">
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
          </SectionCard>
        )}

        {/* Services & pricing — owner only */}
        {viewerRole === "owner" && (
          <SectionCard
            id="section-services"
            eyebrow="Services & pricing"
            headerRight={
              <button
                onClick={() =>
                  setServices((s) => [
                    ...s,
                    { id: null, name: "New service", duration: 30, price: 2000, sortOrder: s.length },
                  ])
                }
                className="btn-secondary font-nunito font-bold px-4 py-1.5 rounded-full text-xs focus-ring flex items-center gap-1 shrink-0"
              >
                <PlusIcon size={12} /> Add custom
              </button>
            }
          >
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
                <div key={i} className="grid grid-cols-[1fr_76px_76px_36px] sm:grid-cols-[1fr_100px_100px_40px] gap-2 sm:gap-3 items-center">
                  <input
                    className="field"
                    value={s.name}
                    onChange={(e) => updateService(i, { name: e.target.value })}
                  />
                  <div className="relative">
                    <input
                      className="field w-full pr-8 sm:pr-10"
                      type="number"
                      value={s.duration}
                      onChange={(e) => updateService(i, { duration: Number(e.target.value) })}
                    />
                    <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-bold text-pebble-grey">min</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-bold text-pebble-grey">£</span>
                    <input
                      className="field w-full pl-5 sm:pl-7"
                      type="number"
                      step="0.01"
                      value={(s.price / 100).toFixed(2)}
                      onChange={(e) => updateService(i, { price: Math.round(Number(e.target.value) * 100) })}
                    />
                  </div>
                  <button
                    onClick={() => setServices((arr) => arr.filter((_, j) => j !== i))}
                    className="rounded-full p-1.5 sm:p-2 text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors focus-ring justify-self-center"
                    aria-label="Remove"
                  >
                    <TrashIcon size={15} />
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
          </SectionCard>
        )}

        {/* Hours & availability — owner only */}
        {viewerRole === "owner" && (
          <SectionCard
            id="section-availability"
            eyebrow="Hours & availability"
            description="Set the days and hours owners can book appointments."
          >
            {/* Accepting bookings toggle */}
            <BookingsToggle
              groomerProfileId={groomerProfileId}
              isAcceptingBookings={formData.isAcceptingBookings}
              onToggle={(val) => setField("isAcceptingBookings", val)}
            />

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
                  breakStartTime: null,
                  breakEndTime: null,
                };
                const hasBreak = !!(row.breakStartTime && row.breakEndTime);
                return (
                  <div key={dow} className={cn(
                    "rounded-xl border transition-colors",
                    row.isActive ? "border-deep-slate/20 bg-alabaster-cream" : "border-pebble-grey/15 bg-white opacity-60"
                  )}>
                    {/* Main hours row */}
                    <div className="px-4 py-3 space-y-2">
                      {/* Row 1: day toggle (left) + break button on mobile / full time row on desktop */}
                      <div className="flex items-center justify-between gap-3">
                        {/* Day toggle */}
                        <button
                          onClick={() => updateAvailability(dow, { isActive: !row.isActive })}
                          className={cn(
                            "flex items-center gap-2 focus-ring rounded-full px-1 py-0.5 transition-colors shrink-0",
                            row.isActive ? "text-deep-slate" : "text-pebble-grey"
                          )}
                          aria-label={`Toggle ${DAY_LABELS[dow]}`}
                        >
                          <span className={cn(
                            "w-8 h-4 rounded-full transition-colors relative shrink-0",
                            row.isActive ? "bg-deep-slate" : "bg-pebble-grey/30"
                          )}>
                            <span className={cn(
                              "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                              row.isActive ? "left-4" : "left-0.5"
                            )} />
                          </span>
                          <span className="font-bold text-sm w-8">{DAY_LABELS[dow]}</span>
                        </button>

                        {/* Desktop: time inputs + break button inline */}
                        <div className="hidden sm:flex items-center gap-2">
                          <input type="time" value={row.startTime} disabled={!row.isActive}
                            onChange={(e) => updateAvailability(dow, { startTime: e.target.value })}
                            className="field py-1.5 text-sm w-32 disabled:cursor-not-allowed" />
                          <span className="text-xs font-bold text-pebble-grey">to</span>
                          <input type="time" value={row.endTime} disabled={!row.isActive}
                            onChange={(e) => updateAvailability(dow, { endTime: e.target.value })}
                            className="field py-1.5 text-sm w-32 disabled:cursor-not-allowed" />
                          {row.isActive && (
                            <button type="button"
                              onClick={() => hasBreak
                                ? updateAvailability(dow, { breakStartTime: null, breakEndTime: null })
                                : updateAvailability(dow, { breakStartTime: "12:00", breakEndTime: "13:00" })}
                              className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors focus-ring whitespace-nowrap",
                                hasBreak ? "border-deep-slate/30 text-deep-slate bg-white hover:bg-pebble-grey/10"
                                         : "border-pebble-grey/30 text-pebble-grey hover:border-deep-slate hover:text-deep-slate")}>
                              {hasBreak ? "− Break" : "+ Break"}
                            </button>
                          )}
                        </div>

                        {/* Mobile: break button only (time inputs live in row 2) */}
                        {row.isActive && (
                          <button type="button"
                            onClick={() => hasBreak
                              ? updateAvailability(dow, { breakStartTime: null, breakEndTime: null })
                              : updateAvailability(dow, { breakStartTime: "12:00", breakEndTime: "13:00" })}
                            className={cn("sm:hidden text-[10px] font-bold px-2 py-1 rounded-full border transition-colors focus-ring whitespace-nowrap",
                              hasBreak ? "border-deep-slate/30 text-deep-slate bg-white hover:bg-pebble-grey/10"
                                       : "border-pebble-grey/30 text-pebble-grey hover:border-deep-slate hover:text-deep-slate")}>
                            {hasBreak ? "− Break" : "+ Break"}
                          </button>
                        )}
                      </div>

                      {/* Row 2: mobile-only time inputs (full remaining width) */}
                      <div className="sm:hidden flex items-center gap-2 pl-10">
                        <input type="time" value={row.startTime} disabled={!row.isActive}
                          onChange={(e) => updateAvailability(dow, { startTime: e.target.value })}
                          className="field py-1.5 text-sm flex-1 min-w-0 disabled:cursor-not-allowed" />
                        <span className="text-xs font-bold text-pebble-grey shrink-0">to</span>
                        <input type="time" value={row.endTime} disabled={!row.isActive}
                          onChange={(e) => updateAvailability(dow, { endTime: e.target.value })}
                          className="field py-1.5 text-sm flex-1 min-w-0 disabled:cursor-not-allowed" />
                      </div>
                    </div>

                    {/* Break row */}
                    {row.isActive && hasBreak && (
                      <div className="px-4 pb-3">
                        <div className="flex items-center gap-2 pl-10 sm:pl-[80px]">
                          <span className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider shrink-0">Break</span>
                          <input type="time" value={row.breakStartTime ?? "12:00"}
                            onChange={(e) => updateAvailability(dow, { breakStartTime: e.target.value })}
                            className="field py-1 text-xs flex-1 min-w-0 sm:flex-none sm:w-28" />
                          <span className="text-xs font-bold text-pebble-grey shrink-0">to</span>
                          <input type="time" value={row.breakEndTime ?? "13:00"}
                            onChange={(e) => updateAvailability(dow, { breakEndTime: e.target.value })}
                            className="field py-1 text-xs flex-1 min-w-0 sm:flex-none sm:w-28" />
                          <button type="button"
                            onClick={() => applyBreakToAllDays(row.breakStartTime!, row.breakEndTime!)}
                            className="hidden sm:inline text-[10px] font-bold text-sage-leaf hover:underline focus-ring rounded whitespace-nowrap shrink-0">
                            Copy to all days
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Team */}
        <SectionCard
          id="section-team"
          eyebrow="Team groomers"
          description="Each groomer gets their own public profile under your business."
          headerRight={
            viewerRole === "owner" ? (
              <button
                onClick={() => setAdding(true)}
                className="btn-primary font-nunito font-bold px-4 py-1.5 rounded-full text-xs focus-ring shadow-subtle flex items-center gap-1 shrink-0"
              >
                <PlusIcon size={12} /> Add groomer
              </button>
            ) : undefined
          }
        >
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
        </SectionCard>

        {/* Verification documents — owner only */}
        {viewerRole === "owner" && (
          <SectionCard
            id="section-verification"
            eyebrow="Verification documents"
            description="Reviewed by the Groomr team before your profile is listed publicly. Accepted formats: PDF, JPG, PNG."
          >
            {/* Employees toggle */}
            <div className="mb-4 bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey">I employ staff</p>
                  <p className="text-[10px] font-bold text-pebble-grey/70 mt-0.5">
                    Enables the employers&apos; liability insurance requirement
                  </p>
                </div>
                <button
                  type="button"
                  disabled={hasEmployeesSaving}
                  onClick={() => handleHasEmployeesToggle(!verificationDocs.hasEmployees)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-ring ${verificationDocs.hasEmployees ? "bg-sage-leaf" : "bg-pebble-grey/40"} ${hasEmployeesSaving ? "opacity-60 cursor-not-allowed" : ""}`}
                  role="switch"
                  aria-checked={!!verificationDocs.hasEmployees}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${verificationDocs.hasEmployees ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {VERIFICATION_DOC_META.map((meta) => {
                const url = verificationDocs[meta.stateKey] as string | null;
                const uploading = !!docUploading[meta.type];
                const isRequired =
                  meta.required === true ||
                  (meta.required === "if_employees" && !!verificationDocs.hasEmployees);
                const hidden = meta.required === "if_employees" && !verificationDocs.hasEmployees;
                if (hidden) return null;

                // Once a doc is verified by admin it is considered final — show Verified and hide upload controls.
                // For Photo ID the file is also deleted server-side after verification.
                const docVerified = verificationDocs[meta.verifiedKey] as boolean;

                return (
                  <div key={meta.type} className="flex items-center gap-3 bg-alabaster-cream border border-pebble-grey/15 rounded-2xl px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-deep-slate">{meta.label}</p>
                        {isRequired && !docVerified && (
                          <span className="text-[10px] font-bold text-muted-terracotta uppercase tracking-wider">Required</span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-pebble-grey mt-0.5">{meta.hint}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {docVerified ? (
                        <span className="text-[10px] font-bold text-sage-leaf bg-sage-leaf/10 border border-sage-leaf/20 px-2 py-0.5 rounded-full">Verified</span>
                      ) : uploading ? (
                        <span className="text-[10px] font-bold text-pebble-grey bg-pebble-grey/10 border border-pebble-grey/20 px-2 py-0.5 rounded-full">Uploading…</span>
                      ) : url ? (
                        <>
                          <span className="hidden sm:inline text-[10px] font-bold text-sage-leaf bg-sage-leaf/10 border border-sage-leaf/20 px-2 py-0.5 rounded-full">Uploaded</span>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-deep-slate hover:underline focus-ring rounded px-2 py-1"
                          >
                            View
                          </a>
                        </>
                      ) : (
                        <span className="hidden sm:inline text-[10px] font-bold text-pebble-grey bg-pebble-grey/10 border border-pebble-grey/20 px-2 py-0.5 rounded-full">Not uploaded</span>
                      )}
                      {!docVerified && (
                        <>
                          <button
                            type="button"
                            disabled={uploading}
                            onClick={() => docInputRefs.current[meta.type]?.click()}
                            className="btn-secondary font-nunito font-bold px-3 py-1.5 rounded-full text-xs focus-ring disabled:opacity-50 whitespace-nowrap"
                          >
                            {uploading ? "Uploading…" : url ? "Replace" : "Upload"}
                          </button>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            ref={(el) => { docInputRefs.current[meta.type] = el; }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocUpload(meta.type, file);
                              e.target.value = "";
                            }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Sticky save bar */}
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
        {/* Profile photo */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
          <Eyebrow>Profile photo</Eyebrow>
          <p className="text-[10px] font-bold text-pebble-grey mt-1 mb-3">Shown in chat and on your public profile</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => profileImageInputRef.current?.click()}
              disabled={profileImageUploading}
              className="relative w-20 h-20 rounded-full overflow-hidden bg-sage-leaf/20 flex items-center justify-center group shrink-0 focus-ring"
              aria-label="Upload profile photo"
            >
              {profileImageUrl ? (
                <Image src={profileImageUrl} alt="Profile photo" fill className="object-cover" sizes="80px" />
              ) : (
                <span className="font-fredoka text-2xl text-sage-leaf/60">
                  {(formData.businessName?.[0] ?? formData.ownerName?.[0] ?? "G").toUpperCase()}
                </span>
              )}
              <div className="absolute inset-0 bg-deep-slate/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <UploadIcon size={20} className="text-white" />
              </div>
              {profileImageUploading && (
                <div className="absolute inset-0 bg-deep-slate/60 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </button>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => profileImageInputRef.current?.click()}
                disabled={profileImageUploading}
                className="btn-secondary font-nunito font-bold px-4 py-2 rounded-full text-xs focus-ring disabled:opacity-50 block"
              >
                {profileImageUploading ? "Uploading…" : profileImageUrl ? "Replace photo" : "Upload photo"}
              </button>
              <p className="text-[10px] font-bold text-pebble-grey mt-1.5">JPG or PNG · max 5 MB</p>
            </div>
          </div>
          <input
            ref={profileImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleProfileImageUpload(file);
              e.target.value = "";
            }}
          />
        </div>

        <div id="section-cover" className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
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

        {/* Account health */}
        <div className="bg-deep-slate text-alabaster-cream rounded-[20px] p-5">
          <Eyebrow className="text-groomr-gold">Account health</Eyebrow>
          {(() => {
            const checks: Array<{ label: string; done: boolean; sectionId: string }> = [
              { label: "Profile photo added", done: !!profileImageUrl,                                                                                              sectionId: "section-cover"        },
              { label: "Cover photo added",  done: !!coverPhotoUrl,                                                                                               sectionId: "section-cover"        },
              { label: "Business name set",  done: !!formData.businessName,                                                                                       sectionId: "section-basics"       },
              { label: "Bio written",        done: !!formData.bio,                                                                                                sectionId: "section-basics"       },
              { label: "Phone number added", done: !!formData.phone,                                                                                              sectionId: "section-basics"       },
              { label: "Services added",     done: services.length > 0,                                                                                           sectionId: "section-services"     },
              { label: "Availability set",   done: availability.some((r) => r.isActive),                                                                          sectionId: "section-availability" },
              { label: "Location set",       done: formData.businessMode === "studio" ? !!formData.addressLine1 : formData.radius > 0,                           sectionId: "section-operation"    },
              { label: "Portfolio photos",   done: false,                                                                                                         sectionId: "section-cover"        },
              { label: "Insurance document", done: !!verificationDocs.insuranceDocUrl,                                  sectionId: "section-verification" },
              { label: "Photo ID",          done: verificationDocs.photoIdVerified || !!verificationDocs.photoIdDocUrl, sectionId: "section-verification" },
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
                <div className="space-y-1.5 text-sm">
                  {checks.map((c) => (
                    <div key={c.label}>
                      {c.done ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0 bg-sage-leaf" />
                          <span className="text-alabaster-cream/40 line-through text-xs">{c.label}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (c.sectionId === "section-cover" && c.label === "Portfolio photos") {
                              window.location.href = "/dashboard/groomer/portfolio";
                            } else {
                              scrollToSection(c.sectionId);
                            }
                          }}
                          className="w-full flex items-center gap-2 rounded-lg py-0.5 hover:bg-alabaster-cream/10 transition-colors focus-ring text-left group"
                        >
                          <span className="w-2 h-2 rounded-full shrink-0 bg-pebble-grey/40" />
                          <span className="text-alabaster-cream text-xs group-hover:text-groomr-gold transition-colors">{c.label}</span>
                          <span className="ml-auto text-[10px] text-alabaster-cream/30 group-hover:text-groomr-gold/60 transition-colors shrink-0">→</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {next && (
                  <div className="mt-4 pt-4 border-t border-alabaster-cream/10">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-groomr-gold mb-1">Next up</p>
                    <p className="text-xs text-alabaster-cream/80">{next.label}</p>
                    <button
                      onClick={() => {
                        if (next.sectionId === "section-cover" && next.label === "Portfolio photos") {
                          window.location.href = "/dashboard/groomer/portfolio";
                        } else {
                          scrollToSection(next.sectionId);
                        }
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
