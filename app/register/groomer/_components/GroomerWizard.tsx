"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useClerk } from "@clerk/nextjs";
import { Info, AlertCircle, Eye, EyeOff, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  UploadIcon, CheckIcon, PlusIcon, CloseIcon, ShieldIcon,
  FinancialsIcon,
} from "@/components/ui/GroomrIcons";
import { registerGroomer, getInsuranceUploadSignature } from "@/app/actions/groomer-registration";

/* ── Types ────────────────────────────────────────────────────────────── */

type BizType = "studio" | "home" | "mobile";
type DayKey  = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

interface DaySlot {
  on: boolean;
  start: string;
  end: string;
}

interface CustomService {
  id: string;
  name: string;
  price: number;
}

interface FormState {
  // Step 0 — About you
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Step 1 — Your business
  biz: string;
  type: BizType;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  radius: number;
  // Step 2 — Services & prices
  selectedServices: string[];
  servicePrices: Record<string, number>;
  customServices: CustomService[];
  depositType: "none" | "percentage" | "full";
  depositPercentage: number;
  // Step 3 — Availability
  days: Record<DayKey, DaySlot>;
  lead: number;
  // Step 4 — Verify & launch
  insuranceDocUrl: string | null;
  insuranceFileName: string | null;
  qualificationDocUrl: string | null;
  qualificationFileName: string | null;
  firstAidDocUrl: string | null;
  firstAidFileName: string | null;
  photoIdDocUrl: string | null;
  photoIdFileName: string | null;
  employersLiabilityDocUrl: string | null;
  employersLiabilityFileName: string | null;
  hasEmployees: boolean | null;
}

/* ── Constants ────────────────────────────────────────────────────────── */

const STEPS = [
  { id: "you",      t: "About you",         s: "Name, email, phone." },
  { id: "biz",      t: "Your business",     s: "Trading name, type, address." },
  { id: "services", t: "Services & prices", s: "What you offer, what you charge." },
  { id: "avail",    t: "Availability",      s: "When you work, lead time." },
  { id: "verify",   t: "Verify & launch",   s: "Documents & compliance." },
];

const PRESET_SERVICES = [
  "Bath & Brush", "Full Groom", "Hand-Strip", "Puppy First", "Nail Clip",
  "De-shed Treatment", "Anal Gland Expression", "Teeth Cleaning", "Ear Cleaning",
  "Paw Trim & Balm", "De-mat & Tidy", "Mini Groom / Tidy Up", "Blueberry Facial",
  "Flea & Tick Treatment", "Bandana / Bow Finish", "Senior Dog Groom",
  "Show Trim / Breed Standard",
];

const BIZ_TYPES: { id: BizType; t: string; d: string }[] = [
  { id: "studio", t: "Studio / Salon", d: "Clients come to you" },
  { id: "home",   t: "From Home",      d: "Home-based setup" },
  { id: "mobile", t: "Mobile Van",     d: "You travel to them" },
];

const DEFAULT_DAYS: Record<DayKey, DaySlot> = {
  mon: { on: true,  start: "09:00", end: "17:00" },
  tue: { on: true,  start: "09:00", end: "17:00" },
  wed: { on: false, start: "09:00", end: "17:00" },
  thu: { on: true,  start: "09:00", end: "17:00" },
  fri: { on: true,  start: "09:00", end: "17:00" },
  sat: { on: true,  start: "09:00", end: "17:00" },
  sun: { on: false, start: "09:00", end: "17:00" },
};

const DAY_LABELS: Record<DayKey, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

/* ── Component ────────────────────────────────────────────────────────── */

export function GroomerWizard({
  initialName = "",
  initialEmail = "",
  startAuthenticated = false,
}: {
  initialName?: string;
  initialEmail?: string;
  startAuthenticated?: boolean;
}) {
  const router  = useRouter();
  const { signIn }    = useSignIn();
  const { setActive } = useClerk();

  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  // Upload state — single shared file input, track which doc is uploading
  const fileInputRef      = useRef<HTMLInputElement>(null);
  const pendingUploadRef  = useRef<((file: File) => void) | null>(null);
  const [uploadingDoc, setUploadingDoc]   = useState<string | null>(null);
  const [uploadErrors, setUploadErrors]   = useState<Record<string, string>>({});

  // Agreement checkboxes
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [termsAgreed,  setTermsAgreed]  = useState(false);

  const [form, setForm] = useState<FormState>({
    fullName: initialName,
    phone: "",
    email: initialEmail,
    password: "",
    confirmPassword: "",
    biz: "",
    type: "studio",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    radius: 5,
    selectedServices: [],
    servicePrices: {},
    customServices: [],
    depositType: "none",
    depositPercentage: 10,
    days: DEFAULT_DAYS,
    lead: 24,
    insuranceDocUrl: null,
    insuranceFileName: null,
    qualificationDocUrl: null,
    qualificationFileName: null,
    firstAidDocUrl: null,
    firstAidFileName: null,
    photoIdDocUrl: null,
    photoIdFileName: null,
    employersLiabilityDocUrl: null,
    employersLiabilityFileName: null,
    hasEmployees: null,
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const isLast   = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  // Scroll to top whenever the active step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  /* ── Step 0 validation ── */
  const step0Valid = (() => {
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) return false;
    if (!startAuthenticated) {
      if (form.password.length < 8) return false;
      if (form.password !== form.confirmPassword) return false;
    }
    return true;
  })();

  /* ── Service helpers ── */
  const toggleService = (name: string) => {
    const on = form.selectedServices.includes(name);
    set("selectedServices", on
      ? form.selectedServices.filter((s) => s !== name)
      : [...form.selectedServices, name]);
  };

  const addCustomService = () =>
    set("customServices", [
      ...form.customServices,
      { id: crypto.randomUUID(), name: "", price: 0 },
    ]);

  const updateCustomService = (id: string, field: "name" | "price", value: string | number) =>
    set("customServices", form.customServices.map((s) =>
      s.id === id ? { ...s, [field]: value } : s));

  const removeCustomService = (id: string) =>
    set("customServices", form.customServices.filter((s) => s.id !== id));

  /* ── Day helpers ── */
  const toggleDay = (k: DayKey) =>
    set("days", { ...form.days, [k]: { ...form.days[k], on: !form.days[k].on } });

  const setDayTime = (k: DayKey, field: "start" | "end", val: string) =>
    set("days", { ...form.days, [k]: { ...form.days[k], [field]: val } });

  const activeDays = (Object.keys(form.days) as DayKey[]).filter((k) => form.days[k].on);

  /* ── Shared document upload ── */
  const openFilePicker = (callback: (file: File) => void) => {
    pendingUploadRef.current = callback;
    fileInputRef.current?.click();
  };

  const uploadDoc = async (
    docKey: string,
    file: File,
    onSuccess: (url: string, name: string) => void
  ) => {
    setUploadingDoc(docKey);
    setUploadErrors((e) => ({ ...e, [docKey]: "" }));
    try {
      const sig = await getInsuranceUploadSignature();
      const fd  = new FormData();
      fd.append("file",      file);
      fd.append("api_key",   sig.apiKey);
      fd.append("timestamp", String(sig.timestamp));
      fd.append("signature", sig.signature);
      fd.append("folder",    sig.folder);
      const res  = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
        { method: "POST", body: fd }
      );
      const json = await res.json();
      if (!json.secure_url) throw new Error("Upload failed");
      onSuccess(json.secure_url, file.name);
    } catch {
      setUploadErrors((e) => ({ ...e, [docKey]: "Upload failed — please try again." }));
    } finally {
      setUploadingDoc(null);
    }
  };

  /* ── Submit ── */
  const handleLaunch = () => {
    setLaunchError(null);
    startTransition(async () => {
      const allServices = [
        ...form.selectedServices.map((name) => ({
          name,
          price: form.servicePrices[name] ?? 0,
        })),
        ...form.customServices
          .filter((s) => s.name.trim())
          .map((s) => ({ name: s.name.trim(), price: s.price })),
      ];

      const result = await registerGroomer({
        fullName:     form.fullName,
        phone:        form.phone,
        businessName: form.biz,
        bizType:      form.type,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city:         form.city,
        postcode:     form.postcode,
        radiusMiles:  form.type === "mobile" ? form.radius : 0,
        services:     allServices,
        depositType:  form.depositType,
        depositPercentage: form.depositType === "percentage" ? form.depositPercentage : null,
        days: Object.fromEntries(
          (Object.keys(form.days) as DayKey[]).map((k) => [k, form.days[k]])
        ),
        leadHours:                form.lead,
        insuranceDocUrl:          form.insuranceDocUrl,
        qualificationDocUrl:      form.qualificationDocUrl,
        firstAidDocUrl:           form.firstAidDocUrl,
        photoIdDocUrl:            form.photoIdDocUrl,
        employersLiabilityDocUrl: form.employersLiabilityDocUrl,
        hasEmployees:             form.hasEmployees,
        ...(!startAuthenticated && {
          email:    form.email,
          password: form.password,
        }),
      });

      if (!result.success) {
        setLaunchError(result.error);
        return;
      }

      if (result.signInToken) {
        if (!signIn) {
          router.push("/sign-in?redirect_url=/dashboard/groomer");
          return;
        }
        const { error } = await signIn.ticket({ ticket: result.signInToken });
        if (error) {
          setLaunchError("Profile created! Please sign in to access your dashboard.");
          router.push("/sign-in?redirect_url=/dashboard/groomer");
          return;
        }
        window.location.href = "/dashboard/groomer";
        return;
      }

      router.push("/dashboard/groomer");
    });
  };

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-10">
      {/* Shared hidden file input for all document uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && pendingUploadRef.current) pendingUploadRef.current(file);
          e.target.value = "";
          pendingUploadRef.current = null;
        }}
      />

      <div className="grid lg:grid-cols-[280px_1fr] gap-10 max-w-6xl mx-auto">

        {/* ── Left rail ── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-1 mb-6">
            <Eyebrow>List your business</Eyebrow>
            <h1 className="font-fredoka text-3xl text-deep-slate">
              10 minutes.<br />That&apos;s all.
            </h1>
          </div>
          <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-2">
            <div className="px-3 py-2">
              <div className="h-2 bg-pebble-grey/15 rounded-full overflow-hidden">
                <div className="h-full bg-groomr-gold transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-pebble-grey font-bold mt-2">
                Step {step + 1} of {STEPS.length}
              </p>
            </div>
            <div className="mt-1">
              {STEPS.map((s, i) => {
                const done   = i < step;
                const active = i === step;
                return (
                  <button key={s.id}
                    onClick={() => i <= step && setStep(i)}
                    disabled={i > step}
                    className={cn(
                      "w-full text-left flex items-start gap-3 p-3 rounded-xl transition-colors focus-ring",
                      active ? "bg-alabaster-cream" : "hover:bg-alabaster-cream/60",
                      i > step && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                      done   ? "bg-sage-leaf text-white"
                             : active ? "bg-deep-slate text-alabaster-cream"
                                      : "bg-pebble-grey/15 text-pebble-grey"
                    )}>
                      {done ? <CheckIcon size={14} /> : i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-deep-slate">{s.t}</p>
                      <p className="text-xs text-pebble-grey">{s.s}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── Step body ── */}
        <div className="bg-white border border-pebble-grey/20 rounded-[24px] p-8 md:p-10 shadow-subtle space-y-6">

          {/* ── STEP 0: About you ── */}
          {step === 0 && (
            <>
              <header className="space-y-2">
                <Eyebrow>Step 1</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate">Tell us who you are.</h2>
                {!startAuthenticated && (
                  <p className="text-pebble-grey text-sm font-nunito">
                    Already have an account?{" "}
                    <a href="/sign-in?redirect_url=/register/groomer" className="text-sage-leaf font-bold hover:underline">
                      Sign in instead
                    </a>
                  </p>
                )}
              </header>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Your name">
                  <input className="field" value={form.fullName} onChange={(e) => set("fullName", e.target.value)}
                    placeholder="e.g. Lola García" autoComplete="name" />
                </Field>
                <Field label="Phone">
                  <input className="field" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                    placeholder="+44 7700 900123" type="tel" autoComplete="tel" />
                </Field>
                <Field label="Email" full>
                  <input className="field" value={form.email} onChange={(e) => set("email", e.target.value)}
                    placeholder="you@example.com" type="email" autoComplete="email" />
                </Field>
                {!startAuthenticated && (
                  <>
                    <Field label="Password">
                      <div className="relative">
                        <input className="field pr-10" value={form.password}
                          onChange={(e) => set("password", e.target.value)}
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 8 characters" autoComplete="new-password" />
                        <button type="button" onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-pebble-grey hover:text-deep-slate transition-colors focus-ring rounded"
                          aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </Field>
                    <Field label="Confirm password">
                      <div className="relative">
                        <input className="field pr-10" value={form.confirmPassword}
                          onChange={(e) => set("confirmPassword", e.target.value)}
                          type={showConfirm ? "text" : "password"}
                          placeholder="Repeat your password" autoComplete="new-password" />
                        <button type="button" onClick={() => setShowConfirm(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-pebble-grey hover:text-deep-slate transition-colors focus-ring rounded"
                          aria-label={showConfirm ? "Hide password" : "Show password"}>
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {form.confirmPassword && form.password !== form.confirmPassword && (
                        <p className="text-xs font-bold text-muted-terracotta mt-1">Passwords don&apos;t match</p>
                      )}
                    </Field>
                  </>
                )}
              </div>
            </>
          )}

          {/* ── STEP 1: Business ── */}
          {step === 1 && (
            <>
              <header className="space-y-2">
                <Eyebrow>Step 2</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate">About your business.</h2>
              </header>
              <Field label="Trading name">
                <input className="field" value={form.biz} onChange={(e) => set("biz", e.target.value)}
                  placeholder="e.g. Wagington & Co." />
              </Field>
              <div>
                <p className="text-xs font-bold text-deep-slate uppercase tracking-wider mb-2">Where do you groom?</p>
                <div className="grid sm:grid-cols-3 gap-2">
                  {BIZ_TYPES.map((o) => (
                    <button key={o.id} onClick={() => set("type", o.id)}
                      className={cn(
                        "text-left p-4 rounded-2xl border-2 transition-colors focus-ring",
                        form.type === o.id ? "bg-alabaster-cream border-deep-slate" : "bg-white border-pebble-grey/20 hover:border-deep-slate"
                      )}>
                      <p className="font-fredoka text-lg text-deep-slate">{o.t}</p>
                      <p className="text-xs text-pebble-grey">{o.d}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold text-deep-slate uppercase tracking-wider">
                  {form.type === "mobile" ? "Base address" : "Business address"}
                </p>
                <p className="text-xs text-pebble-grey -mt-2">
                  {form.type === "mobile"
                    ? "Where you're based — used to calculate your service area on the map."
                    : "This address is shared with customers once their booking is confirmed."}
                </p>
                <input className="field" value={form.addressLine1}
                  onChange={(e) => set("addressLine1", e.target.value)}
                  placeholder="Address line 1" autoComplete="address-line1" />
                <input className="field" value={form.addressLine2}
                  onChange={(e) => set("addressLine2", e.target.value)}
                  placeholder="Address line 2 (optional)" autoComplete="address-line2" />
                <div className="grid sm:grid-cols-2 gap-3">
                  <input className="field" value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="City / Town" autoComplete="address-level2" />
                  <input className="field" value={form.postcode}
                    onChange={(e) => set("postcode", e.target.value.toUpperCase())}
                    placeholder="Postcode" autoComplete="postal-code" />
                </div>
              </div>
              {form.type === "mobile" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-deep-slate uppercase tracking-wider">Service radius</label>
                    <span className="font-fredoka text-xl text-deep-slate">{form.radius} miles</span>
                  </div>
                  <div className="flex items-start gap-2 mb-2">
                    <Info size={14} className="text-pebble-grey shrink-0 mt-0.5" />
                    <p className="text-xs text-pebble-grey">How far you&apos;re willing to travel from your base address.</p>
                  </div>
                  <input type="range" min="1" max="30" value={form.radius}
                    onChange={(e) => set("radius", +e.target.value)}
                    className="w-full accent-groomr-gold h-2" aria-label="Service radius in miles" />
                  <div className="flex justify-between text-xs text-pebble-grey mt-1">
                    <span>1 mile</span><span>30 miles</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── STEP 2: Services & prices ── */}
          {step === 2 && (
            <>
              <header className="space-y-2">
                <Eyebrow>Step 3</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate">Services &amp; prices.</h2>
              </header>
              <p className="text-pebble-grey text-sm">
                Select each service you offer and set your starting price. You can add more detail from your dashboard later.
              </p>
              <div className="space-y-2">
                {PRESET_SERVICES.map((name) => {
                  const on = form.selectedServices.includes(name);
                  return (
                    <div key={name} className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-2xl border-2 transition-colors",
                      on ? "bg-alabaster-cream border-deep-slate" : "bg-white border-pebble-grey/20"
                    )}>
                      <button onClick={() => toggleService(name)} aria-pressed={on}
                        className={cn(
                          "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors focus-ring",
                          on ? "bg-deep-slate border-deep-slate text-alabaster-cream" : "border-pebble-grey/40"
                        )}>
                        {on && <CheckIcon size={14} />}
                      </button>
                      <p className="font-bold text-deep-slate flex-1 text-sm min-w-0 truncate">{name}</p>
                      {on && (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-pebble-grey font-bold text-sm">£</span>
                          <input type="number" value={form.servicePrices[name] ?? ""} placeholder="0"
                            onChange={(e) => set("servicePrices", { ...form.servicePrices, [name]: +e.target.value })}
                            className="field w-16 text-right py-1.5 text-sm" min="0" step="1"
                            aria-label={`Price for ${name}`} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-deep-slate uppercase tracking-wider">Additional services</p>
                {form.customServices.map((svc) => (
                  <div key={svc.id} className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border-2 bg-alabaster-cream border-deep-slate">
                    <div className="w-6 h-6 rounded-md bg-deep-slate border-2 border-deep-slate flex items-center justify-center shrink-0">
                      <CheckIcon size={14} className="text-alabaster-cream" />
                    </div>
                    <input className="flex-1 bg-transparent font-bold text-deep-slate text-sm outline-none border-none placeholder-pebble-grey/50 min-w-0"
                      value={svc.name} onChange={(e) => updateCustomService(svc.id, "name", e.target.value)} placeholder="Service name" />
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-pebble-grey font-bold text-sm">£</span>
                      <input type="number" value={svc.price || ""}
                        onChange={(e) => updateCustomService(svc.id, "price", +e.target.value)}
                        placeholder="0" className="field w-16 text-right py-1.5 text-sm" min="0" step="1" aria-label="Custom service price" />
                    </div>
                    <button onClick={() => removeCustomService(svc.id)}
                      className="text-pebble-grey hover:text-muted-terracotta transition-colors focus-ring rounded p-1 shrink-0" aria-label="Remove service">
                      <CloseIcon size={16} />
                    </button>
                  </div>
                ))}
                <button onClick={addCustomService}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-pebble-grey/30 hover:border-deep-slate hover:bg-alabaster-cream/60 transition-colors focus-ring group">
                  <div className="w-6 h-6 rounded-md border-2 border-pebble-grey/40 group-hover:border-deep-slate flex items-center justify-center shrink-0 transition-colors">
                    <PlusIcon size={14} className="text-pebble-grey group-hover:text-deep-slate transition-colors" />
                  </div>
                  <span className="text-sm font-bold text-pebble-grey group-hover:text-deep-slate transition-colors">Add a service</span>
                </button>
              </div>
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-deep-slate uppercase tracking-wider">Deposit policy</p>
                <p className="text-sm text-pebble-grey">Set a single policy for all bookings. You can change this any time from your dashboard.</p>
                <div className="grid sm:grid-cols-3 gap-2">
                  {([
                    { k: "none" as const,       t: "No deposit",       d: "Pay in full on the day" },
                    { k: "percentage" as const, t: "% Deposit",        d: "Take a percentage upfront" },
                    { k: "full" as const,       t: "Full pre-payment", d: "Pay 100% at booking" },
                  ]).map((o) => (
                    <button key={o.k} type="button" onClick={() => set("depositType", o.k)}
                      className={cn(
                        "text-left p-4 rounded-2xl border-2 transition-colors focus-ring",
                        form.depositType === o.k ? "bg-alabaster-cream border-deep-slate" : "bg-white border-pebble-grey/20 hover:border-deep-slate"
                      )}>
                      <p className="font-fredoka text-lg text-deep-slate">{o.t}</p>
                      <p className="text-xs text-pebble-grey">{o.d}</p>
                    </button>
                  ))}
                </div>
                {form.depositType === "percentage" && (
                  <div className="flex items-center gap-3 pt-1">
                    <label className="text-xs font-bold text-deep-slate uppercase tracking-wider whitespace-nowrap">Deposit %</label>
                    <select value={form.depositPercentage}
                      onChange={(e) => set("depositPercentage", Number(e.target.value))}
                      className="bg-alabaster-cream border border-pebble-grey/20 text-deep-slate text-sm rounded-full focus:ring-2 focus:ring-groomr-gold focus:border-groomr-gold px-4 py-2 outline-none font-bold cursor-pointer">
                      {[10, 15, 20, 25, 30, 33, 50].map((pct) => (
                        <option key={pct} value={pct}>{pct}%</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── STEP 3: Availability ── */}
          {step === 3 && (
            <>
              <header className="space-y-2">
                <Eyebrow>Step 4</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate">When are you working?</h2>
              </header>
              <div>
                <p className="text-xs font-bold text-deep-slate uppercase tracking-wider mb-3">Working days</p>
                <div className="grid grid-cols-7 gap-2">
                  {(Object.keys(form.days) as DayKey[]).map((k) => {
                    const on = form.days[k].on;
                    return (
                      <button key={k} onClick={() => toggleDay(k)} aria-pressed={on}
                        className={cn(
                          "py-3 rounded-2xl border-2 font-fredoka text-sm transition-colors focus-ring",
                          on ? "bg-groomr-gold border-groomr-gold text-deep-slate"
                             : "bg-white border-pebble-grey/20 hover:border-deep-slate text-pebble-grey"
                        )}>
                        {DAY_LABELS[k]}
                      </button>
                    );
                  })}
                </div>
              </div>
              {activeDays.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-deep-slate uppercase tracking-wider">Working hours</p>
                  <div className="space-y-2">
                    {activeDays.map((k) => (
                      <div key={k} className="flex items-center gap-3 bg-alabaster-cream rounded-xl px-4 py-3">
                        <span className="font-fredoka text-deep-slate w-10 shrink-0">{DAY_LABELS[k]}</span>
                        <div className="flex items-center gap-2 flex-1">
                          <input type="time" value={form.days[k].start}
                            onChange={(e) => setDayTime(k, "start", e.target.value)}
                            className="field py-1.5 text-sm w-32" aria-label={`${DAY_LABELS[k]} start time`} />
                          <span className="text-pebble-grey text-sm font-bold">to</span>
                          <input type="time" value={form.days[k].end}
                            onChange={(e) => setDayTime(k, "end", e.target.value)}
                            className="field py-1.5 text-sm w-32" aria-label={`${DAY_LABELS[k]} end time`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeDays.length === 0 && (
                <div className="bg-muted-terracotta/10 border border-muted-terracotta/20 rounded-xl p-4">
                  <p className="text-sm text-deep-slate font-bold">Select at least one working day above.</p>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-deep-slate uppercase tracking-wider">Minimum notice</label>
                  <span className="font-fredoka text-xl text-deep-slate">{form.lead === 0 ? "None" : `${form.lead}h`}</span>
                </div>
                <div className="flex items-start gap-2 mb-2">
                  <Info size={14} className="text-pebble-grey shrink-0 mt-0.5" />
                  <p className="text-xs text-pebble-grey">How much notice you need before a booking. Set to 0 for same-day bookings.</p>
                </div>
                <input type="range" min="0" max="72" step="6" value={form.lead}
                  onChange={(e) => set("lead", +e.target.value)}
                  className="w-full accent-groomr-gold h-2" aria-label="Minimum notice in hours" />
                <div className="flex justify-between text-xs text-pebble-grey mt-1">
                  <span>Same day</span><span>72h</span>
                </div>
              </div>
              <div className="bg-alabaster-cream rounded-2xl p-5 border border-pebble-grey/15">
                <p className="text-xs font-bold uppercase tracking-wider text-sage-leaf mb-1">Tip</p>
                <p className="text-sm text-deep-slate">
                  You can sync Google Calendar later so out-of-Groomr appointments block availability automatically.
                </p>
              </div>
            </>
          )}

          {/* ── STEP 4: Verify & launch ── */}
          {step === 4 && (
            <>
              <header className="space-y-2">
                <Eyebrow>Step 5 — last one</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate">Verify &amp; launch.</h2>
                <p className="text-sm text-pebble-grey font-nunito">
                  Everything below is optional — upload what you have now and complete the rest from your dashboard at any time.
                </p>
              </header>

              {/* ── Stripe Connect info ── */}
              <div className="rounded-2xl overflow-hidden border border-deep-slate/15">
                <div className="bg-deep-slate px-5 py-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-groomr-gold flex items-center justify-center shrink-0 mt-0.5">
                    <CreditCard size={20} className="text-deep-slate" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-fredoka text-lg text-white leading-tight">Payments via Stripe Connect</p>
                    <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/70 px-2.5 py-1 rounded-full">
                      Required to go live
                    </span>
                    <p className="text-xs text-white/55 font-nunito mt-1.5">Set up from your dashboard after launching</p>
                  </div>
                </div>
                <div className="bg-alabaster-cream px-5 py-4">
                  <p className="text-sm font-nunito text-deep-slate leading-relaxed">
                    Groomr uses <span className="font-bold">Stripe Connect</span> to process booking payments and send your weekly payouts.
                    You&apos;ll need a Stripe account to accept bookings — it takes about 5 minutes and you&apos;ll need your bank details and photo ID to hand.
                  </p>
                  <p className="text-xs text-pebble-grey font-nunito mt-2">
                    Find the setup under <span className="font-bold text-deep-slate">Dashboard → Financials</span> once you&apos;ve launched.
                  </p>
                </div>
              </div>

              {/* ── Verification documents ── */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-deep-slate uppercase tracking-wider">Verification documents</p>
                  <p className="text-xs text-pebble-grey mt-1 font-nunito">
                    Upload these to earn your <span className="font-bold text-deep-slate">Verified badge</span>, which boosts your visibility in search.
                    All are optional at launch — complete from your dashboard whenever you&apos;re ready.
                  </p>
                </div>

                {/* 1. Public Liability Insurance */}
                <DocUploadCard
                  icon={<ShieldIcon size={22} />}
                  title="Public liability insurance"
                  subtitle="Min. £1M cover — must explicitly cover professional dog grooming"
                  docKey="insurance"
                  url={form.insuranceDocUrl}
                  fileName={form.insuranceFileName}
                  uploading={uploadingDoc === "insurance"}
                  error={uploadErrors["insurance"] ?? null}
                  onUpload={() =>
                    openFilePicker((file) =>
                      uploadDoc("insurance", file, (url, name) => {
                        set("insuranceDocUrl", url);
                        set("insuranceFileName", name);
                      })
                    )
                  }
                  onRemove={() => { set("insuranceDocUrl", null); set("insuranceFileName", null); }}
                  onSkip={() => set("insuranceDocUrl", "skipped")}
                  onUnskip={() => set("insuranceDocUrl", null)}
                />

                {/* 2. Professional grooming qualification */}
                <DocUploadCard
                  icon={<FinancialsIcon size={22} />}
                  title="Grooming qualification"
                  subtitle="Level 2+ from an Ofqual-regulated awarding body (City & Guilds, iPET Network, etc.)"
                  docKey="qualification"
                  url={form.qualificationDocUrl}
                  fileName={form.qualificationFileName}
                  uploading={uploadingDoc === "qualification"}
                  error={uploadErrors["qualification"] ?? null}
                  onUpload={() =>
                    openFilePicker((file) =>
                      uploadDoc("qualification", file, (url, name) => {
                        set("qualificationDocUrl", url);
                        set("qualificationFileName", name);
                      })
                    )
                  }
                  onRemove={() => { set("qualificationDocUrl", null); set("qualificationFileName", null); }}
                  onSkip={() => set("qualificationDocUrl", "skipped")}
                  onUnskip={() => set("qualificationDocUrl", null)}
                />

                {/* 3. Canine first aid certificate */}
                <DocUploadCard
                  icon={
                    <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={1.8} />
                    </svg>
                  }
                  title="Canine first aid certificate"
                  subtitle="Recognised canine/pet first aid course, dated within the last 3 years"
                  docKey="firstAid"
                  url={form.firstAidDocUrl}
                  fileName={form.firstAidFileName}
                  uploading={uploadingDoc === "firstAid"}
                  error={uploadErrors["firstAid"] ?? null}
                  onUpload={() =>
                    openFilePicker((file) =>
                      uploadDoc("firstAid", file, (url, name) => {
                        set("firstAidDocUrl", url);
                        set("firstAidFileName", name);
                      })
                    )
                  }
                  onRemove={() => { set("firstAidDocUrl", null); set("firstAidFileName", null); }}
                  onSkip={() => set("firstAidDocUrl", "skipped")}
                  onUnskip={() => set("firstAidDocUrl", null)}
                />

                {/* 4. Government-issued photo ID */}
                <DocUploadCard
                  icon={
                    <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth={1.8} />
                      <circle cx="8" cy="12" r="2.5" strokeWidth={1.8} />
                      <path strokeLinecap="round" strokeWidth={1.8} d="M13 10h5M13 14h3" />
                    </svg>
                  }
                  title="Government-issued photo ID"
                  subtitle="UK passport or UK driving licence — inspected and discarded immediately after review"
                  docKey="photoId"
                  url={form.photoIdDocUrl}
                  fileName={form.photoIdFileName}
                  uploading={uploadingDoc === "photoId"}
                  error={uploadErrors["photoId"] ?? null}
                  onUpload={() =>
                    openFilePicker((file) =>
                      uploadDoc("photoId", file, (url, name) => {
                        set("photoIdDocUrl", url);
                        set("photoIdFileName", name);
                      })
                    )
                  }
                  onRemove={() => { set("photoIdDocUrl", null); set("photoIdFileName", null); }}
                  onSkip={() => set("photoIdDocUrl", "skipped")}
                  onUnskip={() => set("photoIdDocUrl", null)}
                />

                {/* 5. Employers' liability (conditional) */}
                <div className="border border-pebble-grey/20 rounded-2xl overflow-hidden">
                  <div className="flex items-start gap-4 p-5">
                    <div className="w-10 h-10 rounded-xl bg-alabaster-cream border border-pebble-grey/15 flex items-center justify-center shrink-0 text-pebble-grey">
                      <ShieldIcon size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-deep-slate">Employers&apos; liability insurance</p>
                      <p className="text-xs text-pebble-grey font-nunito mt-0.5">
                        Required by law if you employ any staff. Min. £5M cover.
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 space-y-3">
                    {/* Yes/No toggle */}
                    <div>
                      <p className="text-xs font-bold text-deep-slate uppercase tracking-wider mb-2">Do you employ any staff?</p>
                      <div className="flex gap-2">
                        {([
                          { v: true,  label: "Yes" },
                          { v: false, label: "No" },
                        ] as const).map(({ v, label }) => (
                          <button key={label} type="button" onClick={() => set("hasEmployees", v)}
                            className={cn(
                              "px-5 py-2 rounded-full border-2 text-sm font-bold transition-colors focus-ring",
                              form.hasEmployees === v
                                ? "bg-deep-slate border-deep-slate text-white"
                                : "bg-white border-pebble-grey/20 text-deep-slate hover:border-deep-slate"
                            )}>
                            {label}
                          </button>
                        ))}
                        {form.hasEmployees !== null && (
                          <button type="button" onClick={() => set("hasEmployees", null)}
                            className="text-xs font-bold text-pebble-grey hover:text-deep-slate focus-ring rounded px-2">
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {form.hasEmployees === true && (
                      <DocUploadCard
                        icon={<ShieldIcon size={22} />}
                        title=""
                        subtitle=""
                        docKey="employersLiability"
                        url={form.employersLiabilityDocUrl}
                        fileName={form.employersLiabilityFileName}
                        uploading={uploadingDoc === "employersLiability"}
                        error={uploadErrors["employersLiability"] ?? null}
                        compact
                        onUpload={() =>
                          openFilePicker((file) =>
                            uploadDoc("employersLiability", file, (url, name) => {
                              set("employersLiabilityDocUrl", url);
                              set("employersLiabilityFileName", name);
                            })
                          )
                        }
                        onRemove={() => { set("employersLiabilityDocUrl", null); set("employersLiabilityFileName", null); }}
                        onSkip={() => set("employersLiabilityDocUrl", "skipped")}
                        onUnskip={() => set("employersLiabilityDocUrl", null)}
                      />
                    )}

                    {form.hasEmployees === false && (
                      <p className="text-xs font-bold text-sage-leaf flex items-center gap-1.5">
                        <CheckIcon size={13} /> Not required — no staff employed.
                      </p>
                    )}

                    {form.hasEmployees === null && (
                      <p className="text-xs text-pebble-grey font-nunito italic">
                        Select an answer above — or leave it and complete from your dashboard later.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Agreements ── */}
              <div className="space-y-3">
                {/* Verification policy */}
                <AgreementCheckbox
                  checked={policyAgreed}
                  onChange={() => setPolicyAgreed(v => !v)}
                >
                  I have read and agree to the{" "}
                  <DocLink href="/verification-policy">Groomr Verification Policy</DocLink>
                  , including the animal welfare standards and document requirements.
                </AgreementCheckbox>

                {/* Platform + Groomer terms */}
                <AgreementCheckbox
                  checked={termsAgreed}
                  onChange={() => setTermsAgreed(v => !v)}
                >
                  I agree to the{" "}
                  <DocLink href="/terms/platform">Platform Terms of Service</DocLink>
                  {" "}and the{" "}
                  <DocLink href="/terms/groomer">Groomer Terms of Service</DocLink>.
                </AgreementCheckbox>
              </div>

              {/* You're ready */}
              <div className="bg-deep-slate text-alabaster-cream rounded-2xl p-5">
                <p className="font-fredoka text-xl">You&apos;re ready.</p>
                <p className="text-sage-leaf text-sm mt-1">
                  Hit launch to be taken to your profile setup. Your profile won&apos;t go live until you open for bookings.
                </p>
              </div>

              {/* Launch error */}
              {launchError && (
                <div className="flex items-start gap-2 bg-muted-terracotta/10 border border-muted-terracotta/30 rounded-xl px-4 py-3">
                  <AlertCircle size={14} className="text-muted-terracotta shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-muted-terracotta">{launchError}</p>
                </div>
              )}
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between gap-4 pt-4 border-t border-pebble-grey/15">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="btn-secondary font-nunito font-bold px-6 py-3 rounded-full focus-ring disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              onClick={() => isLast ? handleLaunch() : setStep(step + 1)}
              disabled={
                isPending ||
                (step === 0 && !step0Valid) ||
                (isLast && (!policyAgreed || !termsAgreed))
              }
              title={
                step === 0 && !step0Valid ? "Please fill in all fields above" :
                isLast && (!policyAgreed || !termsAgreed) ? "Please agree to the terms above to continue" :
                undefined
              }
              className="btn-primary font-nunito font-bold px-7 py-3 rounded-full focus-ring shadow-subtle disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? "Launching…" : isLast ? "Launch My Profile" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── DocUploadCard ────────────────────────────────────────────────────── */

function DocUploadCard({
  icon, title, subtitle, docKey, url, fileName,
  uploading, error, compact = false,
  onUpload, onRemove, onSkip, onUnskip,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  docKey: string;
  url: string | null;
  fileName: string | null;
  uploading: boolean;
  error: string | null;
  compact?: boolean;
  onUpload: () => void;
  onRemove: () => void;
  onSkip: () => void;
  onUnskip: () => void;
}) {
  const isSkipped   = url === "skipped";
  const isUploaded  = url && url !== "skipped";

  return (
    <div className={cn(
      "border border-pebble-grey/20 rounded-2xl overflow-hidden",
      compact && "border-pebble-grey/10"
    )}>
      {!compact && (
        <div className="flex items-start gap-4 p-5 border-b border-pebble-grey/10">
          <div className={cn(
            "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0",
            isUploaded
              ? "bg-sage-leaf/10 border-sage-leaf/20 text-sage-leaf"
              : "bg-alabaster-cream border-pebble-grey/15 text-pebble-grey"
          )}>
            {isUploaded ? <CheckIcon size={18} className="text-sage-leaf" /> : icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-deep-slate">{title}</p>
            {subtitle && <p className="text-xs text-pebble-grey font-nunito mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}

      <div className={cn("space-y-2", compact ? "p-0" : "p-5")}>
        {isUploaded ? (
          <div className="flex items-center gap-3 bg-sage-leaf/10 border border-sage-leaf/20 rounded-xl px-4 py-3">
            <div className="w-6 h-6 rounded-full bg-sage-leaf flex items-center justify-center shrink-0">
              <CheckIcon size={12} className="text-white" />
            </div>
            <p className="text-sm font-bold text-deep-slate flex-1 truncate">{fileName ?? "Document uploaded"}</p>
            <button onClick={onRemove} className="text-xs font-bold text-pebble-grey hover:text-muted-terracotta focus-ring rounded">
              Remove
            </button>
          </div>
        ) : isSkipped ? (
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-pebble-grey">Skipped — add from your dashboard after launch.</p>
            <button onClick={onUnskip} className="text-xs font-bold text-sage-leaf hover:underline focus-ring rounded">
              Upload now
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button onClick={onUpload} disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-pebble-grey/30 rounded-xl hover:border-deep-slate/40 hover:bg-alabaster-cream/60 transition-colors focus-ring font-bold text-sm text-deep-slate disabled:opacity-50">
              <UploadIcon size={15} />
              {uploading ? "Uploading…" : "Upload document"}
            </button>
            {error && (
              <p className="text-xs font-bold text-muted-terracotta flex items-center gap-1.5">
                <AlertCircle size={12} /> {error}
              </p>
            )}
            <button onClick={onSkip} className="text-xs font-bold text-pebble-grey hover:text-deep-slate underline focus-ring rounded">
              I&apos;ll complete this later →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── AgreementCheckbox ────────────────────────────────────────────────── */

function AgreementCheckbox({
  checked, onChange, children,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 p-4 bg-alabaster-cream border-2 border-pebble-grey/20 rounded-2xl cursor-pointer hover:border-deep-slate transition-colors group">
      <button type="button" onClick={onChange} aria-checked={checked} role="checkbox"
        className={cn(
          "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors focus-ring",
          checked ? "bg-deep-slate border-deep-slate text-alabaster-cream" : "border-pebble-grey/40 group-hover:border-deep-slate"
        )}>
        {checked && <CheckIcon size={12} />}
      </button>
      <span className="text-sm text-deep-slate font-bold leading-snug">{children}</span>
    </label>
  );
}

/* ── DocLink ──────────────────────────────────────────────────────────── */

function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-sage-leaf underline hover:text-sage-leaf/80"
      onClick={(e) => e.stopPropagation()}>
      {children}
    </a>
  );
}

/* ── Field wrapper ────────────────────────────────────────────────────── */

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="text-xs font-bold text-deep-slate uppercase tracking-wider block mb-2">{label}</span>
      {children}
    </label>
  );
}
