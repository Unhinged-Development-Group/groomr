"use client";

import { useState, useTransition, useRef } from "react";
import { SignUp } from "@clerk/nextjs";
import { Check, Plus, X, Info, Shield, Building2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { UploadIcon, CheckIcon } from "@/components/ui/GroomrIcons";
import { registerGroomer, getInsuranceUploadSignature } from "@/app/actions/groomer-registration";

/* ── Types ────────────────────────────────────────────────────────────── */

type BizType = "studio" | "home" | "mobile";
type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

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
  // Step 2 (was Step 1)
  fullName: string;
  phone: string;
  email: string;
  // Step 3 (was Step 2)
  biz: string;
  type: BizType;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  radius: number;
  // Step 4 (was Step 3)
  selectedServices: string[];
  servicePrices: Record<string, number>;
  customServices: CustomService[];
  depositType: 'none' | 'percentage' | 'full';
  depositPercentage: number;
  // Step 5 (was Step 4)
  days: Record<DayKey, DaySlot>;
  lead: number;
  // Step 6
  insuranceDocUrl: string | null;
  insuranceFileName: string | null;
  bankHolderName: string;
  bankSortCode: string;
  bankAccountNumber: string;
}

/* ── Constants ────────────────────────────────────────────────────────── */

const STEPS = [
  { id: "account",  t: "Create account",     s: "Email and password." },
  { id: "you",      t: "About you",          s: "Name, email, phone." },
  { id: "biz",      t: "Your business",      s: "Trading name, type, address." },
  { id: "services", t: "Services & prices",  s: "What you offer, what you charge." },
  { id: "avail",    t: "Availability",       s: "When you work, lead time." },
  { id: "verify",   t: "Verify & launch",    s: "Insurance & payout." },
];

const PRESET_SERVICES = [
  "Bath & Brush",
  "Full Groom",
  "Hand-Strip",
  "Puppy First",
  "Nail Clip",
  "De-shed Treatment",
  "Anal Gland Expression",
  "Teeth Cleaning",
  "Ear Cleaning",
  "Paw Trim & Balm",
  "De-mat & Tidy",
  "Mini Groom / Tidy Up",
  "Blueberry Facial",
  "Flea & Tick Treatment",
  "Bandana / Bow Finish",
  "Senior Dog Groom",
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
  // Step 0 = Create account (skipped when already signed in)
  // Steps 1–5 = groomer wizard (original steps 0–4)
  const firstStep = startAuthenticated ? 1 : 0;
  const [step, setStep] = useState(firstStep);
  const [isPending, startTransition] = useTransition();
  const [insuranceUploading, setInsuranceUploading] = useState(false);
  const [insuranceError, setInsuranceError] = useState<string | null>(null);
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const insuranceInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    fullName: initialName,
    phone: "",
    email: initialEmail,
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
    depositType: 'none',
    depositPercentage: 10,
    days: DEFAULT_DAYS,
    lead: 24,
    insuranceDocUrl: null,
    insuranceFileName: null,
    bankHolderName: "",
    bankSortCode: "",
    bankAccountNumber: "",
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  /* ── Service helpers ── */
  const toggleService = (name: string) => {
    const on = form.selectedServices.includes(name);
    set("selectedServices", on
      ? form.selectedServices.filter((s) => s !== name)
      : [...form.selectedServices, name]
    );
  };

  const setServicePrice = (name: string, price: number) =>
    set("servicePrices", { ...form.servicePrices, [name]: price });

  const addCustomService = () =>
    set("customServices", [
      ...form.customServices,
      { id: crypto.randomUUID(), name: "", price: 0 },
    ]);

  const updateCustomService = (id: string, field: "name" | "price", value: string | number) =>
    set("customServices", form.customServices.map((s) =>
      s.id === id ? { ...s, [field]: value } : s
    ));

  const removeCustomService = (id: string) =>
    set("customServices", form.customServices.filter((s) => s.id !== id));

  /* ── Day helpers ── */
  const toggleDay = (k: DayKey) =>
    set("days", { ...form.days, [k]: { ...form.days[k], on: !form.days[k].on } });

  const setDayTime = (k: DayKey, field: "start" | "end", val: string) =>
    set("days", { ...form.days, [k]: { ...form.days[k], [field]: val } });

  const activeDays = (Object.keys(form.days) as DayKey[]).filter((k) => form.days[k].on);

  /* ── Insurance upload ── */
  const handleInsuranceUpload = async (file: File) => {
    setInsuranceUploading(true);
    setInsuranceError(null);
    try {
      const sig = await getInsuranceUploadSignature();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.apiKey);
      formData.append("timestamp", String(sig.timestamp));
      formData.append("signature", sig.signature);
      formData.append("folder", sig.folder);
      // resource_type=auto handles PDFs, images, etc.
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
        { method: "POST", body: formData }
      );
      const json = await res.json();
      if (!json.secure_url) throw new Error("Upload failed");
      set("insuranceDocUrl", json.secure_url);
      set("insuranceFileName", file.name);
    } catch {
      setInsuranceError("Upload failed — please try again.");
    } finally {
      setInsuranceUploading(false);
    }
  };

  /* ── Sort code formatter (auto-inserts dashes: 123456 → 12-34-56) ── */
  const handleSortCode = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    const formatted = digits.replace(/(\d{2})(\d{1,2})?(\d{1,2})?/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join("-")
    );
    set("bankSortCode", formatted);
  };

  /* ── Submit ── */
  const handleLaunch = () => {
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

      await registerGroomer({
        fullName: form.fullName,
        phone: form.phone,
        businessName: form.biz,
        bizType: form.type,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        postcode: form.postcode,
        radiusMiles: form.type === "mobile" ? form.radius : 0,
        services: allServices,
        depositType: form.depositType,
        depositPercentage: form.depositType === "percentage" ? form.depositPercentage : null,
        days: Object.fromEntries(
          (Object.keys(form.days) as DayKey[]).map((k) => [k, form.days[k]])
        ),
        leadHours: form.lead,
        insuranceDocUrl: form.insuranceDocUrl,
        bankAccountHolder: form.bankHolderName || null,
        bankSortCode: form.bankSortCode || null,
        bankAccountNumber: form.bankAccountNumber || null,
      });
    });
  };

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-10">
      <div className="grid lg:grid-cols-[280px_1fr] gap-10 max-w-6xl mx-auto">

        {/* ── Left rail ── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-1 mb-6">
            <Eyebrow>List your business</Eyebrow>
            <h1 className="font-fredoka text-3xl text-deep-slate">
              5 minutes.<br />That&apos;s all.
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
                // When already authenticated, step 0 always shows as done
                const done = startAuthenticated && i === 0 ? true : i < step;
                const active = i === step;
                // Allow clicking back to step 1 minimum when authenticated (not step 0)
                const minStep = startAuthenticated ? 1 : 0;
                return (
                  <button key={s.id}
                    onClick={() => i <= step && i >= minStep && setStep(i)}
                    disabled={i > step || (startAuthenticated && i === 0)}
                    className={cn(
                      "w-full text-left flex items-start gap-3 p-3 rounded-xl transition-colors focus-ring",
                      active ? "bg-alabaster-cream" : "hover:bg-alabaster-cream/60",
                      (i > step || (startAuthenticated && i === 0)) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                      done ? "bg-sage-leaf text-white" : active ? "bg-deep-slate text-alabaster-cream" : "bg-pebble-grey/15 text-pebble-grey"
                    )}>
                      {done ? <Check size={14} /> : i + 1}
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

          {/* ── STEP 0: Create account ── */}
          {step === 0 && (
            <>
              <header className="space-y-2">
                <Eyebrow>Step 1</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate">Create your account.</h2>
                <p className="text-pebble-grey text-sm font-nunito">
                  Already have an account?{" "}
                  <a href="/sign-in?redirect_url=/register/groomer" className="text-sage-leaf font-bold hover:underline">
                    Sign in instead
                  </a>
                </p>
              </header>
              <div className="flex justify-center">
                <SignUp routing="hash" forceRedirectUrl="/register/groomer" />
              </div>
            </>
          )}

          {/* ── STEP 1: About you ── */}
          {step === 1 && (
            <>
              <header className="space-y-2">
                <Eyebrow>Step 2</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate">Tell us who you are.</h2>
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
              </div>
            </>
          )}

          {/* ── STEP 2: Business ── */}
          {step === 2 && (
            <>
              <header className="space-y-2">
                <Eyebrow>Step 3</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate">About your business.</h2>
              </header>

              <Field label="Trading name">
                <input className="field" value={form.biz} onChange={(e) => set("biz", e.target.value)}
                  placeholder="e.g. Wagington & Co." />
              </Field>

              {/* Business type */}
              <div>
                <p className="text-xs font-bold text-deep-slate uppercase tracking-wider mb-2">
                  Where do you groom?
                </p>
                <div className="grid sm:grid-cols-3 gap-2">
                  {BIZ_TYPES.map((o) => (
                    <button key={o.id} onClick={() => set("type", o.id)}
                      className={cn(
                        "text-left p-4 rounded-2xl border-2 transition-colors focus-ring",
                        form.type === o.id
                          ? "bg-alabaster-cream border-deep-slate"
                          : "bg-white border-pebble-grey/20 hover:border-deep-slate"
                      )}
                    >
                      <p className="font-fredoka text-lg text-deep-slate">{o.t}</p>
                      <p className="text-xs text-pebble-grey">{o.d}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Business address */}
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

              {/* Radius — mobile only */}
              {form.type === "mobile" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-deep-slate uppercase tracking-wider">
                      Service radius
                    </label>
                    <span className="font-fredoka text-xl text-deep-slate">{form.radius} miles</span>
                  </div>
                  <div className="flex items-start gap-2 mb-2">
                    <Info size={14} className="text-pebble-grey shrink-0 mt-0.5" />
                    <p className="text-xs text-pebble-grey">
                      How far you&apos;re willing to travel from your base address. Customers outside
                      this radius won&apos;t see your profile in search results.
                    </p>
                  </div>
                  <input type="range" min="1" max="30" value={form.radius}
                    onChange={(e) => set("radius", +e.target.value)}
                    className="w-full accent-groomr-gold h-2"
                    aria-label="Service radius in miles" />
                  <div className="flex justify-between text-xs text-pebble-grey mt-1">
                    <span>1 mile</span><span>30 miles</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── STEP 3: Services & prices ── */}
          {step === 3 && (
            <>
              <header className="space-y-2">
                <Eyebrow>Step 4</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate">Services &amp; prices.</h2>
              </header>
              <p className="text-pebble-grey text-sm">
                Select each service you offer and set your starting price. You can add more detail —
                like size variations — from your dashboard later.
              </p>

              {/* Preset services */}
              <div className="space-y-2">
                {PRESET_SERVICES.map((name) => {
                  const on = form.selectedServices.includes(name);
                  return (
                    <div key={name}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border-2 transition-colors",
                        on ? "bg-alabaster-cream border-deep-slate" : "bg-white border-pebble-grey/20"
                      )}
                    >
                      <button onClick={() => toggleService(name)} aria-pressed={on}
                        className={cn(
                          "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors focus-ring",
                          on ? "bg-deep-slate border-deep-slate text-alabaster-cream" : "border-pebble-grey/40"
                        )}
                      >
                        {on && <Check size={14} />}
                      </button>
                      <p className="font-bold text-deep-slate flex-1 text-sm">{name}</p>
                      <div className={cn("flex items-center gap-1.5 shrink-0", !on && "invisible pointer-events-none")}>
                        <span className="text-pebble-grey font-bold text-sm">£</span>
                        <input type="number"
                          value={form.servicePrices[name] ?? ""}
                          onChange={(e) => setServicePrice(name, +e.target.value)}
                          placeholder="0"
                          className="field w-20 text-right py-2 text-sm"
                          min="0" step="1"
                          tabIndex={on ? 0 : -1}
                          aria-label={`Price for ${name}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom services */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-deep-slate uppercase tracking-wider">
                  Additional services
                </p>
                {form.customServices.map((svc) => (
                  <div key={svc.id}
                    className="flex items-center gap-3 p-4 rounded-2xl border-2 bg-alabaster-cream border-deep-slate"
                  >
                    <div className="w-6 h-6 rounded-md bg-deep-slate border-2 border-deep-slate flex items-center justify-center shrink-0">
                      <Check size={14} className="text-alabaster-cream" />
                    </div>
                    <input
                      className="flex-1 bg-transparent font-bold text-deep-slate text-sm outline-none border-none placeholder-pebble-grey/50 min-w-0"
                      value={svc.name}
                      onChange={(e) => updateCustomService(svc.id, "name", e.target.value)}
                      placeholder="Service name"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-pebble-grey font-bold text-sm">£</span>
                      <input
                        type="number"
                        value={svc.price || ""}
                        onChange={(e) => updateCustomService(svc.id, "price", +e.target.value)}
                        placeholder="0"
                        className="field w-20 text-right py-2 text-sm"
                        min="0" step="1"
                        aria-label="Custom service price"
                      />
                    </div>
                    <button
                      onClick={() => removeCustomService(svc.id)}
                      className="text-pebble-grey hover:text-muted-terracotta transition-colors focus-ring rounded p-1 shrink-0"
                      aria-label="Remove service"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addCustomService}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-pebble-grey/30 hover:border-deep-slate hover:bg-alabaster-cream/60 transition-colors focus-ring group"
                >
                  <div className="w-6 h-6 rounded-md border-2 border-pebble-grey/40 group-hover:border-deep-slate flex items-center justify-center shrink-0 transition-colors">
                    <Plus size={14} className="text-pebble-grey group-hover:text-deep-slate transition-colors" />
                  </div>
                  <span className="text-sm font-bold text-pebble-grey group-hover:text-deep-slate transition-colors">
                    Add a service
                  </span>
                </button>
              </div>

              {/* Deposit policy */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-deep-slate uppercase tracking-wider">
                  Deposit policy
                </p>
                <p className="text-sm text-pebble-grey">
                  Set a single policy for all bookings. You can change this any time from your dashboard.
                </p>
                <div className="grid sm:grid-cols-3 gap-2">
                  {([
                    { k: "none" as const,       t: "No deposit",       d: "Pay in full on the day" },
                    { k: "percentage" as const, t: "% Deposit",        d: "Take a percentage upfront" },
                    { k: "full" as const,       t: "Full pre-payment", d: "Pay 100% at booking" },
                  ]).map((o) => (
                    <button key={o.k} type="button" onClick={() => set("depositType", o.k)}
                      className={cn(
                        "text-left p-4 rounded-2xl border-2 transition-colors focus-ring",
                        form.depositType === o.k
                          ? "bg-alabaster-cream border-deep-slate"
                          : "bg-white border-pebble-grey/20 hover:border-deep-slate"
                      )}
                    >
                      <p className="font-fredoka text-lg text-deep-slate">{o.t}</p>
                      <p className="text-xs text-pebble-grey">{o.d}</p>
                    </button>
                  ))}
                </div>
                {form.depositType === "percentage" && (
                  <div className="flex items-center gap-3 pt-1">
                    <label className="text-xs font-bold text-deep-slate uppercase tracking-wider whitespace-nowrap">
                      Deposit %
                    </label>
                    <select
                      value={form.depositPercentage}
                      onChange={(e) => set("depositPercentage", Number(e.target.value))}
                      className="bg-alabaster-cream border border-pebble-grey/20 text-deep-slate text-sm rounded-full focus:ring-2 focus:ring-groomr-gold focus:border-groomr-gold px-4 py-2 outline-none font-bold cursor-pointer"
                    >
                      {[10, 15, 20, 25, 30, 33, 50].map((pct) => (
                        <option key={pct} value={pct}>{pct}%</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── STEP 4: Availability ── */}
          {step === 4 && (
            <>
              <header className="space-y-2">
                <Eyebrow>Step 5</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate">When are you working?</h2>
              </header>

              <div>
                <p className="text-xs font-bold text-deep-slate uppercase tracking-wider mb-3">
                  Working days
                </p>
                <div className="grid grid-cols-7 gap-2">
                  {(Object.keys(form.days) as DayKey[]).map((k) => {
                    const on = form.days[k].on;
                    return (
                      <button key={k} onClick={() => toggleDay(k)} aria-pressed={on}
                        className={cn(
                          "py-3 rounded-2xl border-2 font-fredoka text-sm transition-colors focus-ring",
                          on
                            ? "bg-groomr-gold border-groomr-gold text-deep-slate"
                            : "bg-white border-pebble-grey/20 hover:border-deep-slate text-pebble-grey"
                        )}
                      >
                        {DAY_LABELS[k]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeDays.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-deep-slate uppercase tracking-wider">
                    Working hours
                  </p>
                  <div className="space-y-2">
                    {activeDays.map((k) => (
                      <div key={k} className="flex items-center gap-3 bg-alabaster-cream rounded-xl px-4 py-3">
                        <span className="font-fredoka text-deep-slate w-10 shrink-0">{DAY_LABELS[k]}</span>
                        <div className="flex items-center gap-2 flex-1">
                          <input type="time" value={form.days[k].start}
                            onChange={(e) => setDayTime(k, "start", e.target.value)}
                            className="field py-1.5 text-sm w-32"
                            aria-label={`${DAY_LABELS[k]} start time`}
                          />
                          <span className="text-pebble-grey text-sm font-bold">to</span>
                          <input type="time" value={form.days[k].end}
                            onChange={(e) => setDayTime(k, "end", e.target.value)}
                            className="field py-1.5 text-sm w-32"
                            aria-label={`${DAY_LABELS[k]} end time`}
                          />
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
                  <label className="text-xs font-bold text-deep-slate uppercase tracking-wider">
                    Minimum notice
                  </label>
                  <span className="font-fredoka text-xl text-deep-slate">
                    {form.lead === 0 ? "None" : `${form.lead}h`}
                  </span>
                </div>
                <div className="flex items-start gap-2 mb-2">
                  <Info size={14} className="text-pebble-grey shrink-0 mt-0.5" />
                  <p className="text-xs text-pebble-grey">
                    How much notice you need before a booking. Customers can&apos;t book slots
                    sooner than this. Set to 0 for same-day bookings.
                  </p>
                </div>
                <input type="range" min="0" max="72" step="6" value={form.lead}
                  onChange={(e) => set("lead", +e.target.value)}
                  className="w-full accent-groomr-gold h-2"
                  aria-label="Minimum notice in hours"
                />
                <div className="flex justify-between text-xs text-pebble-grey mt-1">
                  <span>Same day</span><span>72h</span>
                </div>
              </div>

              <div className="bg-alabaster-cream rounded-2xl p-5 border border-pebble-grey/15">
                <p className="text-xs font-bold uppercase tracking-wider text-sage-leaf mb-1">Tip</p>
                <p className="text-sm text-deep-slate">
                  You can sync Google Calendar later so out-of-Groomr appointments block
                  availability automatically.
                </p>
              </div>
            </>
          )}

          {/* ── STEP 5: Verify & launch ── */}
          {step === 5 && (
            <>
              <header className="space-y-2">
                <Eyebrow>Step 6 — last one</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate">Verify &amp; get paid.</h2>
                <p className="text-sm text-pebble-grey">
                  Both sections are optional — you can launch now and add them from your dashboard later.
                </p>
              </header>

              {/* ── Insurance ── */}
              <div className="border border-pebble-grey/20 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-4 p-5 border-b border-pebble-grey/10">
                  <Shield size={28} className={form.insuranceDocUrl ? "text-sage-leaf" : "text-pebble-grey"} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-deep-slate">Public liability insurance</p>
                    <p className="text-xs text-pebble-grey">PDF or image of your certificate. Required for the verified badge.</p>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  {form.insuranceDocUrl ? (
                    /* Uploaded state */
                    <div className="flex items-center gap-3 bg-sage-leaf/10 border border-sage-leaf/20 rounded-xl px-4 py-3">
                      <div className="w-7 h-7 rounded-full bg-sage-leaf flex items-center justify-center shrink-0">
                        <CheckIcon size={14} className="text-white" />
                      </div>
                      <p className="text-sm font-bold text-deep-slate flex-1 truncate">
                        {form.insuranceFileName ?? "Document uploaded"}
                      </p>
                      <button
                        onClick={() => { set("insuranceDocUrl", null); set("insuranceFileName", null); }}
                        className="text-xs font-bold text-pebble-grey hover:text-muted-terracotta focus-ring rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    /* Upload prompt */
                    <div className="space-y-2">
                      <input
                        ref={insuranceInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleInsuranceUpload(file);
                          e.target.value = "";
                        }}
                      />
                      <button
                        onClick={() => insuranceInputRef.current?.click()}
                        disabled={insuranceUploading}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-pebble-grey/30 rounded-xl hover:border-deep-slate/40 hover:bg-alabaster-cream/60 transition-colors focus-ring font-bold text-sm text-deep-slate disabled:opacity-50"
                      >
                        <UploadIcon size={16} />
                        {insuranceUploading ? "Uploading…" : "Upload certificate"}
                      </button>
                      {insuranceError && (
                        <p className="text-xs font-bold text-muted-terracotta flex items-center gap-1.5">
                          <AlertCircle size={12} /> {insuranceError}
                        </p>
                      )}
                      <div className="flex items-start gap-2 bg-groomr-gold/15 border border-groomr-gold/30 rounded-xl px-4 py-3">
                        <AlertCircle size={14} className="text-deep-slate shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-deep-slate">
                          Without insurance, your profile won&apos;t receive the verified badge and may have lower visibility in search.
                        </p>
                      </div>
                      <button
                        onClick={() => set("insuranceDocUrl", "skipped")}
                        className="text-xs font-bold text-pebble-grey hover:text-deep-slate underline focus-ring rounded"
                      >
                        I&apos;ll add this later →
                      </button>
                    </div>
                  )}

                  {form.insuranceDocUrl === "skipped" && (
                    <div className="flex items-center gap-2 text-pebble-grey">
                      <p className="text-xs font-bold">Skipped — add from your dashboard after launch.</p>
                      <button
                        onClick={() => set("insuranceDocUrl", null)}
                        className="text-xs font-bold text-sage-leaf hover:underline focus-ring rounded"
                      >
                        Upload now
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Bank details ── */}
              <div className="border border-pebble-grey/20 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-4 p-5 border-b border-pebble-grey/10">
                  <Building2 size={28} className={form.bankHolderName && form.bankSortCode && form.bankAccountNumber ? "text-sage-leaf" : "text-pebble-grey"} />
                  <div className="flex-1">
                    <p className="font-bold text-deep-slate">Bank account for payouts</p>
                    <p className="text-xs text-pebble-grey">UK bank account. Used for weekly payout transfers and fee collection.</p>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <Field label="Account holder name">
                    <input
                      className="field"
                      placeholder="e.g. Lola García"
                      value={form.bankHolderName}
                      onChange={(e) => set("bankHolderName", e.target.value)}
                      autoComplete="name"
                    />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Sort code">
                      <input
                        className="field"
                        placeholder="12-34-56"
                        value={form.bankSortCode}
                        onChange={(e) => handleSortCode(e.target.value)}
                        maxLength={8}
                        inputMode="numeric"
                      />
                    </Field>
                    <Field label="Account number">
                      <input
                        className="field"
                        placeholder="12345678"
                        value={form.bankAccountNumber}
                        onChange={(e) => set("bankAccountNumber", e.target.value.replace(/\D/g, "").slice(0, 8))}
                        maxLength={8}
                        inputMode="numeric"
                      />
                    </Field>
                  </div>
                  {(!form.bankHolderName || !form.bankSortCode || !form.bankAccountNumber) && (
                    <div className="flex items-start gap-2 bg-groomr-gold/15 border border-groomr-gold/30 rounded-xl px-4 py-3">
                      <AlertCircle size={14} className="text-deep-slate shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-deep-slate">
                        Without bank details you won&apos;t be able to receive payouts or pay Groomr&apos;s platform fee.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Policy agreement */}
              <label className="flex items-start gap-3 p-4 bg-alabaster-cream border-2 border-pebble-grey/20 rounded-2xl cursor-pointer hover:border-deep-slate transition-colors group">
                <button
                  type="button"
                  onClick={() => setPolicyAgreed(v => !v)}
                  aria-checked={policyAgreed}
                  role="checkbox"
                  className={cn(
                    "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors focus-ring",
                    policyAgreed ? "bg-deep-slate border-deep-slate text-alabaster-cream" : "border-pebble-grey/40 group-hover:border-deep-slate"
                  )}
                >
                  {policyAgreed && <Check size={12} />}
                </button>
                <span className="text-sm text-deep-slate font-bold leading-snug">
                  I have read and agree to the{" "}
                  <a
                    href="/verification-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sage-leaf underline hover:text-sage-leaf/80"
                    onClick={e => e.stopPropagation()}
                  >
                    Groomr Verification Policy
                  </a>
                  , including the animal welfare standards and document requirements.
                </span>
              </label>

              <div className="bg-deep-slate text-alabaster-cream rounded-2xl p-5">
                <p className="font-fredoka text-xl">You&apos;re ready.</p>
                <p className="text-sage-leaf text-sm mt-1">
                  Hit launch and your profile goes live in your area.
                  {(!form.insuranceDocUrl || form.insuranceDocUrl === "skipped" || !form.bankHolderName) && (
                    <span className="text-alabaster-cream/50"> You can complete verification from your dashboard.</span>
                  )}
                </p>
              </div>
            </>
          )}

          {/* Navigation — hidden on step 0 (Clerk handles its own submit) */}
          {step > 0 && (
            <div className="flex justify-between gap-4 pt-4 border-t border-pebble-grey/15">
              <button
                onClick={() => setStep(Math.max(firstStep, step - 1))}
                disabled={step <= firstStep}
                className="btn-secondary font-nunito font-bold px-6 py-3 rounded-full focus-ring disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <button
                onClick={() => isLast ? handleLaunch() : setStep(step + 1)}
                disabled={isPending || (isLast && !policyAgreed)}
                title={isLast && !policyAgreed ? "Please agree to the Verification Policy to continue" : undefined}
                className="btn-primary font-nunito font-bold px-7 py-3 rounded-full focus-ring shadow-subtle disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPending ? "Launching…" : isLast ? "Launch My Profile" : "Continue"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Field wrapper ────────────────────────────────────────────────────── */

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="text-xs font-bold text-deep-slate uppercase tracking-wider block mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}
