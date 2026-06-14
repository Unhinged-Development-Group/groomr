"use client";

import { useMemo, useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PlusIcon, PencilIcon, TrashIcon, StarIcon, UploadIcon, ChevronDownIcon } from "@/components/ui/GroomrIcons";
import { cn } from "@/lib/utils";
import { saveProfile, saveServices, saveAvailability, getCoverPhotoSignature, saveCoverPhoto, deleteCoverPhoto, getProfileImageSignature, saveProfileImage, deleteProfileImage, toggleAcceptingBookings, getVerificationDocSignature, saveVerificationDoc, saveHasEmployees } from "@/app/actions/profile-editor";
import { inviteTeamMember, removeTeamMember } from "@/app/actions/team-members";
import { CloseAccountModal } from "@/app/_components/CloseAccountModal";
import { saveContractTerms, getClientTermsStatus } from "@/app/actions/contract-terms";
import type { ProfileFormData, ServiceRow, AvailabilityRow, BreakSlot, TeamMemberRow, VerificationDocs, VerificationDocType } from "@/types/groomer-dashboard";

const DOG_SIZES = [
  { key: "xs",     label: "XS" },
  { key: "small",  label: "S"  },
  { key: "medium", label: "M"  },
  { key: "large",  label: "L"  },
  { key: "xl",     label: "XL" },
] as const;

const SERVICE_TEMPLATES: Array<{ name: string; duration: number }> = [
  { name: "Bath & Brush",          duration: 45  },
  { name: "Full Groom",            duration: 90  },
  { name: "Hand Strip",            duration: 120 },
  { name: "Nail Clip",             duration: 15  },
  { name: "Teeth Brushing",        duration: 15  },
  { name: "Ear Clean",             duration: 10  },
  { name: "Dematting",             duration: 60  },
  { name: "Puppy First Groom",     duration: 45  },
  { name: "Anal Gland Expression", duration: 10  },
];

// Controlled currency input that avoids the toFixed reformatting glitch.
// Maintains a local display string so decimal entry works smoothly.
// Syncs from the external `pence` prop only while the field is not focused.
function PriceInput({ pence, onChange, className }: {
  pence: number;
  onChange: (pence: number) => void;
  className?: string;
}) {
  const [display, setDisplay] = useState(() => pence === 0 ? "" : String(pence / 100));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDisplay(pence === 0 ? "" : String(pence / 100));
  }, [pence, focused]);

  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-pebble-grey pointer-events-none">£</span>
      <input
        type="text"
        inputMode="decimal"
        className={cn("field w-full pl-4 text-sm text-center", className)}
        value={display}
        placeholder="0"
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          const n = parseFloat(display);
          const cleaned = isNaN(n) || n < 0 ? 0 : Math.round(n * 100);
          setDisplay(cleaned === 0 ? "" : String(cleaned / 100));
          onChange(cleaned);
        }}
        onChange={(e) => {
          const v = e.target.value;
          setDisplay(v);
          const n = parseFloat(v);
          if (!isNaN(n) && n >= 0) onChange(Math.round(n * 100));
        }}
      />
    </div>
  );
}

function DurationInput({ minutes, onChange, className }: {
  minutes: number;
  onChange: (minutes: number) => void;
  className?: string;
}) {
  const [display, setDisplay] = useState(() => minutes > 0 ? String(minutes) : "");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDisplay(minutes > 0 ? String(minutes) : "");
  }, [minutes, focused]);

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        className={cn("field w-full pr-7 text-sm text-center", className)}
        value={display}
        placeholder="—"
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          const n = parseInt(display, 10);
          const cleaned = isNaN(n) || n < 1 ? 0 : n;
          setDisplay(cleaned > 0 ? String(cleaned) : "");
          onChange(cleaned);
        }}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "");
          setDisplay(v);
          const n = parseInt(v, 10);
          if (!isNaN(n) && n > 0) onChange(n);
        }}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-pebble-grey pointer-events-none">min</span>
    </div>
  );
}

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
  open,
  onToggle,
}: {
  id?: string;
  eyebrow: string;
  headerRight?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div id={id} className="bg-white border border-pebble-grey/20 rounded-[20px]">
      <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4">
        <button
          type="button"
          onClick={onToggle}
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
  portfolioCount: number;
  initialContractTerms: { id: string; version: number; content: string } | null;
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
  portfolioCount,
  initialContractTerms,
}: Props) {
  const [formData, setFormData] = useState<ProfileFormData>(initialProfile);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(initialCoverPhotoUrl);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverDeleting, setCoverDeleting] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(initialProfileImageUrl);
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [profileImageDeleting, setProfileImageDeleting] = useState(false);
  const [profileImageError, setProfileImageError] = useState<string | null>(null);
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
  const [contractContent, setContractContent] = useState(initialContractTerms?.content ?? "");
  const [contractVersion, setContractVersion] = useState(initialContractTerms?.version ?? 0);
  const [contractSaving, startContractSave] = useTransition();
  const [contractSaved, setContractSaved] = useState(false);
  const [clientTermsStatus, setClientTermsStatus] = useState<Awaited<ReturnType<typeof getClientTermsStatus>>>([]);
  const [termsStatusLoaded, setTermsStatusLoaded] = useState(false);
  const prePauseRef = useRef<AvailabilityRow[] | null>(null);
  const [savedAvailability, setSavedAvailability] = useState(initialAvailability);
  const router = useRouter();
  const [verificationDocs, setVerificationDocs] = useState<VerificationDocs>(initialVerificationDocs);
  const [docUploading, setDocUploading] = useState<Partial<Record<VerificationDocType, number>>>({});
  const docInputRefs = useRef<Partial<Record<VerificationDocType, HTMLInputElement | null>>>({});
  const [hasEmployeesSaving, setHasEmployeesSaving] = useState(false);

  // Accordion state — only one section open at a time
  type SectionId = "basics" | "operation" | "services" | "availability" | "team" | "verification" | "danger";
  const [openSection, setOpenSection] = useState<SectionId>("basics");
  function toggleSection(id: SectionId) {
    setOpenSection((cur) => (cur === id ? ("" as SectionId) : id));
  }

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

  function addBreak(dayOfWeek: number) {
    setAvailability((arr) =>
      arr.map((row) =>
        row.dayOfWeek === dayOfWeek
          ? { ...row, breaks: [...row.breaks, { startTime: "12:00", endTime: "13:00" }] }
          : row
      )
    );
  }

  function updateBreak(dayOfWeek: number, index: number, patch: Partial<BreakSlot>) {
    setAvailability((arr) =>
      arr.map((row) =>
        row.dayOfWeek === dayOfWeek
          ? { ...row, breaks: row.breaks.map((b, i) => (i === index ? { ...b, ...patch } : b)) }
          : row
      )
    );
  }

  function removeBreak(dayOfWeek: number, index: number) {
    setAvailability((arr) =>
      arr.map((row) =>
        row.dayOfWeek === dayOfWeek
          ? { ...row, breaks: row.breaks.filter((_, i) => i !== index) }
          : row
      )
    );
  }

  function applyBreaksToAllDays(breaks: BreakSlot[]) {
    setAvailability((arr) =>
      arr.map((row) => (row.isActive ? { ...row, breaks } : row))
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
      { id: null, name: tpl.name, description: "", duration: tpl.duration, price: 0, sizePrices: {}, sizeDurations: {}, sortOrder: arr.length },
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
      form.append("allowed_formats", sig.allowedFormats);

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

  function resizeToSquare(file: File, size = 500): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(file); return; }
        // Centre-crop to square
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.9
        );
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Failed to load image")); };
      img.src = objectUrl;
    });
  }

  async function handleProfileImageUpload(file: File) {
    setProfileImageUploading(true);
    setProfileImageError(null);
    try {
      const resized = await resizeToSquare(file);
      const sig = await getProfileImageSignature(groomerProfileId);
      const form = new FormData();
      form.append("file", resized);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      form.append("allowed_formats", sig.allowedFormats);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: "POST", body: form }
      );
      const json = await res.json();
      if (!json.secure_url) throw new Error(json.error?.message ?? "Photo upload failed");

      const result = await saveProfileImage(groomerProfileId, json.secure_url);
      if (result?.error) throw new Error(result.error);
      setProfileImageUrl(json.secure_url);
    } catch (e) {
      setProfileImageError(e instanceof Error ? e.message : "Photo upload failed — please try again");
    } finally {
      setProfileImageUploading(false);
    }
  }

  async function handleDeleteProfileImage() {
    if (profileImageDeleting) return;
    setProfileImageDeleting(true);
    try {
      await deleteProfileImage(groomerProfileId);
      setProfileImageUrl(null);
    } finally {
      setProfileImageDeleting(false);
    }
  }

  async function handleDeleteCoverPhoto() {
    if (coverDeleting) return;
    setCoverDeleting(true);
    try {
      await deleteCoverPhoto(groomerProfileId);
      setCoverPhotoUrl(null);
    } finally {
      setCoverDeleting(false);
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
    setDocUploading((d) => ({ ...d, [docType]: 0 }));
    try {
      const sig = await getVerificationDocSignature(groomerProfileId);
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      form.append("allowed_formats", sig.allowedFormats);

      const json = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
            setDocUploading((d) => ({ ...d, [docType]: pct }));
          }
        };
        xhr.onload = () => {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { reject(new Error("Upload failed")); }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`);
        xhr.send(form);
      });

      if (!json.secure_url) throw new Error((json.error as any)?.message ?? "Upload failed");

      setDocUploading((d) => ({ ...d, [docType]: 100 }));
      const result = await saveVerificationDoc(groomerProfileId, docType, json.secure_url as string);
      if (result?.error) throw new Error(result.error);
      const docMeta = VERIFICATION_DOC_META.find((m) => m.type === docType)!;
      setVerificationDocs((d) => ({ ...d, [docMeta.stateKey]: json.secure_url }));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Document upload failed — please try again");
    } finally {
      setDocUploading((d) => { const next = { ...d }; delete next[docType]; return next; });
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
          open={openSection === "basics"}
          onToggle={() => toggleSection("basics")}
          headerRight={
            <Link
              href={`/groomers/${groomerProfileId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-bold text-deep-slate text-link shrink-0"
            >
              Preview public profile →
            </Link>
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
            <div className="mt-4 space-y-4">
              <FieldGroup label="Tagline (max 80 chars)">
                <input
                  className="field"
                  value={formData.tagline}
                  onChange={(e) => setField("tagline", e.target.value.slice(0, 80))}
                  placeholder="e.g. Award-winning mobile groomer for all breeds"
                />
                <p className="text-[10px] font-bold text-pebble-grey mt-1">{formData.tagline.length}/80 · Shown on search results and your public profile</p>
              </FieldGroup>
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
          <SectionCard id="section-operation" eyebrow="How you operate" open={openSection === "operation"} onToggle={() => toggleSection("operation")}>
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
            open={openSection === "services"}
            onToggle={() => toggleSection("services")}
            headerRight={
              <button
                onClick={() =>
                  setServices((s) => [
                    ...s,
                    { id: null, name: "New service", description: "", duration: 30, price: 0, sizePrices: {}, sizeDurations: {}, sortOrder: s.length },
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

            <div className="space-y-3">
              {services.map((s, i) => (
                <div key={i} className="bg-alabaster-cream border border-pebble-grey/20 rounded-2xl p-4 space-y-4">
                  {/* Service name + duration + delete */}
                  <div className="flex items-center gap-2">
                    <input
                      className="field flex-1 min-w-0"
                      value={s.name}
                      placeholder="Service name"
                      onChange={(e) => updateService(i, { name: e.target.value })}
                    />
                    <div className="w-20 shrink-0">
                      <DurationInput
                        minutes={s.duration}
                        onChange={(m) => updateService(i, { duration: m || 30 })}
                      />
                    </div>
                    <button
                      onClick={() => setServices((arr) => arr.filter((_, j) => j !== i))}
                      className="shrink-0 rounded-full p-1.5 text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors focus-ring"
                      aria-label="Remove service"
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>

                  {/* Short description */}
                  <textarea
                    className="field w-full resize-none text-sm"
                    rows={2}
                    value={s.description}
                    placeholder="Short description (optional) — shown on your public profile"
                    maxLength={200}
                    onChange={(e) => updateService(i, { description: e.target.value })}
                  />

                  {/* Per-size pricing & duration */}
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Size pricing &amp; duration</p>
                      {Object.keys(s.sizePrices).length > 0 && (
                        <p className="text-[9px] font-bold text-pebble-grey/50">£ price · min duration</p>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {DOG_SIZES.map(({ key, label }) => {
                        const enabled = key in s.sizePrices;
                        const pence   = s.sizePrices[key] ?? 0;
                        const mins    = s.sizeDurations[key] ?? 0;
                        return (
                          <div key={key} className="space-y-1.5">
                            <label className="flex items-center justify-center gap-1 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => {
                                  const nextPrices    = { ...s.sizePrices };
                                  const nextDurations = { ...s.sizeDurations };
                                  if (e.target.checked) {
                                    nextPrices[key] = 0;
                                  } else {
                                    delete nextPrices[key];
                                    delete nextDurations[key];
                                  }
                                  updateService(i, { sizePrices: nextPrices, sizeDurations: nextDurations });
                                }}
                                className="rounded shrink-0"
                              />
                              <span className="text-xs font-bold text-deep-slate">{label}</span>
                            </label>
                            {enabled ? (
                              <>
                                <PriceInput
                                  pence={pence}
                                  onChange={(p) => updateService(i, { sizePrices: { ...s.sizePrices, [key]: p } })}
                                />
                                <DurationInput
                                  minutes={mins}
                                  onChange={(m) => updateService(i, { sizeDurations: { ...s.sizeDurations, [key]: m } })}
                                />
                              </>
                            ) : (
                              <>
                                <div className="h-9 rounded-lg bg-pebble-grey/8 border border-pebble-grey/10 flex items-center justify-center">
                                  <span className="text-xs text-pebble-grey/40">—</span>
                                </div>
                                <div className="h-9 rounded-lg bg-pebble-grey/8 border border-pebble-grey/10 flex items-center justify-center">
                                  <span className="text-xs text-pebble-grey/40">—</span>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {Object.keys(s.sizePrices).length === 0 && (
                      <p className="text-[10px] text-pebble-grey/70 mt-2">
                        Tick the sizes this service is available for, then set a price and duration for each.
                      </p>
                    )}
                  </div>
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
            open={openSection === "availability"}
            onToggle={() => toggleSection("availability")}
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
                  breaks: [],
                };
                return (
                  <div key={dow} className={cn(
                    "rounded-xl border transition-colors",
                    row.isActive ? "border-deep-slate/20 bg-alabaster-cream" : "border-pebble-grey/15 bg-white"
                  )}>
                    {/* Single inline row: toggle + hours + breaks + actions */}
                    <div className="px-4 py-3 flex flex-wrap items-center gap-2 sm:gap-3">
                      {/* Toggle + day label */}
                      <button
                        type="button"
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
                        <span className={cn("font-bold text-sm w-8 shrink-0", !row.isActive && "opacity-40")}>
                          {DAY_LABELS[dow]}
                        </span>
                      </button>

                      {/* Main time inputs */}
                      <input type="time" value={row.startTime} disabled={!row.isActive}
                        onChange={(e) => updateAvailability(dow, { startTime: e.target.value })}
                        className={cn("field py-1.5 text-sm w-28 sm:w-32 min-w-0 disabled:cursor-not-allowed", !row.isActive && "opacity-40")} />
                      <span className={cn("text-xs font-bold text-pebble-grey shrink-0", !row.isActive && "opacity-40")}>to</span>
                      <input type="time" value={row.endTime} disabled={!row.isActive}
                        onChange={(e) => updateAvailability(dow, { endTime: e.target.value })}
                        className={cn("field py-1.5 text-sm w-28 sm:w-32 min-w-0 disabled:cursor-not-allowed", !row.isActive && "opacity-40")} />

                      {/* Inline break inputs */}
                      {row.isActive && row.breaks.map((brk, bi) => (
                        <div key={bi} className="flex items-center gap-2 sm:gap-3">
                          <span className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider shrink-0">
                            {row.breaks.length > 1 ? `Break ${bi + 1}` : "Break"}
                          </span>
                          <input type="time" value={brk.startTime}
                            onChange={(e) => updateBreak(dow, bi, { startTime: e.target.value })}
                            className="field py-1 text-xs w-28 sm:w-32 min-w-0" />
                          <span className="text-xs font-bold text-pebble-grey shrink-0">to</span>
                          <input type="time" value={brk.endTime}
                            onChange={(e) => updateBreak(dow, bi, { endTime: e.target.value })}
                            className="field py-1 text-xs w-28 sm:w-32 min-w-0" />
                          <button type="button"
                            onClick={() => removeBreak(dow, bi)}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-deep-slate/20 text-deep-slate bg-white hover:bg-pebble-grey/10 transition-colors focus-ring whitespace-nowrap shrink-0">
                            − Remove
                          </button>
                        </div>
                      ))}

                      {/* + Break button */}
                      {row.isActive && (
                        <button type="button"
                          onClick={() => addBreak(dow)}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-pebble-grey/30 text-pebble-grey hover:border-deep-slate hover:text-deep-slate transition-colors focus-ring whitespace-nowrap shrink-0 ml-auto">
                          + Break
                        </button>
                      )}
                    </div>
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
          open={openSection === "team"}
          onToggle={() => toggleSection("team")}
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
            open={openSection === "verification"}
            onToggle={() => toggleSection("verification")}
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
                const uploadProgress = docUploading[meta.type];
                const uploading = uploadProgress !== undefined;
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
                        <span className="relative overflow-hidden inline-flex items-center text-[10px] font-bold text-deep-slate border border-pebble-grey/30 px-2 py-0.5 rounded-full min-w-[58px] justify-center bg-pebble-grey/10">
                          <span
                            className="absolute left-0 top-0 bottom-0 rounded-full bg-groomr-gold/60 transition-[width] duration-150 ease-out"
                            style={{ width: `${uploadProgress ?? 0}%` }}
                          />
                          <span className="relative">{(uploadProgress ?? 0) < 100 ? `${uploadProgress ?? 0}%` : "Saving…"}</span>
                        </span>
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
                            className="relative overflow-hidden btn-secondary font-nunito font-bold px-3 py-1.5 rounded-full text-xs focus-ring disabled:opacity-50 whitespace-nowrap"
                          >
                            {uploading && (
                              <span
                                className="absolute left-0 top-0 bottom-0 rounded-full bg-groomr-gold/40 transition-[width] duration-150 ease-out"
                                style={{ width: `${uploadProgress ?? 0}%` }}
                              />
                            )}
                            <span className="relative">
                              {uploading
                                ? (uploadProgress ?? 0) < 100 ? `${uploadProgress ?? 0}%` : "Saving…"
                                : url ? "Replace" : "Upload"}
                            </span>
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
              className="relative w-20 h-20 rounded-full overflow-hidden bg-alabaster-cream flex items-center justify-center group shrink-0 focus-ring"
              aria-label="Upload profile photo"
            >
              {profileImageUrl ? (
                <Image src={profileImageUrl} alt="Profile photo" fill className="object-cover" sizes="80px" />
              ) : (
                <Image src="/assets/default-profile-photo.svg" alt="" fill className="object-contain p-3" sizes="80px" />
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
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => profileImageInputRef.current?.click()}
                  disabled={profileImageUploading || profileImageDeleting}
                  className="btn-secondary font-nunito font-bold px-4 py-2 rounded-full text-xs focus-ring disabled:opacity-50"
                >
                  {profileImageUploading ? "Uploading…" : profileImageUrl ? "Replace photo" : "Upload photo"}
                </button>
                {profileImageUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteProfileImage}
                    disabled={profileImageDeleting || profileImageUploading}
                    className="p-2 rounded-full text-pebble-grey hover:text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors focus-ring disabled:opacity-50"
                    aria-label="Remove profile photo"
                  >
                    {profileImageDeleting
                      ? <div className="w-4 h-4 border-2 border-pebble-grey/30 border-t-pebble-grey rounded-full animate-spin" />
                      : <TrashIcon size={16} />
                    }
                  </button>
                )}
              </div>
              <p className="text-[10px] font-bold text-pebble-grey">JPG or PNG · max 5 MB</p>
            </div>
          </div>
          {profileImageError && (
            <p className="mt-2 text-[11px] font-bold text-muted-terracotta">{profileImageError}</p>
          )}
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
          <div className="mt-3 aspect-[5/3] rounded-xl bg-alabaster-cream overflow-hidden relative">
            {coverPhotoUrl ? (
              <Image
                src={coverPhotoUrl}
                alt="Cover photo"
                fill
                className="object-cover"
                sizes="360px"
              />
            ) : (
              <Image
                src="/assets/default-cover-photo.svg"
                alt=""
                fill
                className="object-contain p-8"
                sizes="360px"
              />
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
            disabled={coverUploading || coverDeleting}
            className="btn-secondary w-full font-nunito font-bold py-2 rounded-full text-xs mt-3 focus-ring disabled:opacity-50"
          >
            {coverUploading ? "Uploading…" : coverPhotoUrl ? "Replace cover photo" : "Upload cover photo"}
          </button>
          {coverPhotoUrl && (
            <button
              onClick={handleDeleteCoverPhoto}
              disabled={coverDeleting || coverUploading}
              className="w-full font-nunito font-bold py-2 rounded-full text-xs mt-2 focus-ring disabled:opacity-50 flex items-center justify-center gap-1.5 text-pebble-grey hover:text-muted-terracotta transition-colors"
            >
              {coverDeleting
                ? <div className="w-3.5 h-3.5 border-2 border-pebble-grey/30 border-t-pebble-grey rounded-full animate-spin" />
                : <TrashIcon size={14} />
              }
              {coverDeleting ? "Removing…" : "Remove cover photo"}
            </button>
          )}
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
              { label: "Portfolio photos",   done: portfolioCount > 0,                                                                                            sectionId: "section-cover"        },
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

        {/* Contract Terms */}
        {viewerRole === "owner" && (
          <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 space-y-4">
            <div>
              <Eyebrow>Contract terms</Eyebrow>
              <p className="text-xs text-pebble-grey font-nunito mt-1">
                New clients must agree to these terms before their first booking. If you update them, all clients will be asked to re-accept.
                {contractVersion > 0 && <span className="ml-1 font-bold">Currently on version {contractVersion}.</span>}
              </p>
            </div>
            <textarea
              value={contractContent}
              onChange={(e) => setContractContent(e.target.value)}
              placeholder="e.g. All dogs must be up to date on flea and tick treatment. Aggressive dogs require a muzzle. 24 hours notice required for cancellations…"
              rows={8}
              className="field w-full resize-y text-sm"
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs text-pebble-grey">{contractContent.length} characters</span>
              <button
                disabled={contractSaving || !contractContent.trim()}
                onClick={() => startContractSave(async () => {
                  const result = await saveContractTerms(contractContent);
                  if ("version" in result) {
                    setContractVersion(result.version);
                    setContractSaved(true);
                    setTimeout(() => setContractSaved(false), 2500);
                  }
                })}
                className="btn-primary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring shadow-subtle disabled:opacity-50"
              >
                {contractSaved ? "Published!" : contractSaving ? "Publishing…" : "Publish new version"}
              </button>
            </div>
            {contractVersion > 0 && (
              <div>
                <button
                  onClick={async () => {
                    if (!termsStatusLoaded) {
                      const status = await getClientTermsStatus();
                      setClientTermsStatus(status);
                      setTermsStatusLoaded(true);
                    } else {
                      setTermsStatusLoaded(false);
                      setClientTermsStatus([]);
                    }
                  }}
                  className="text-xs font-bold text-pebble-grey hover:text-deep-slate transition-colors focus-ring rounded"
                >
                  {termsStatusLoaded ? "▲ Hide" : "▼ View acceptance status"}
                </button>
                {termsStatusLoaded && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-pebble-grey/15">
                    {clientTermsStatus.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-pebble-grey font-bold">No clients yet.</p>
                    ) : (
                      clientTermsStatus.map((c, i) => (
                        <div key={c.ownerId} className={`grid grid-cols-[1fr_auto] gap-3 px-4 py-3 items-center ${i ? "border-t border-pebble-grey/10" : ""}`}>
                          <span className="text-sm font-bold text-deep-slate">{c.ownerName}</span>
                          {c.needsReAcceptance ? (
                            <span className="text-xs font-bold text-muted-terracotta bg-muted-terracotta/10 px-2.5 py-1 rounded-full">Needs re-acceptance</span>
                          ) : (
                            <span className="text-xs font-bold text-sage-leaf bg-sage-leaf/10 px-2.5 py-1 rounded-full">Up to date</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
