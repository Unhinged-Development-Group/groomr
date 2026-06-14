"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getDogs } from "@/app/actions/dogs";
import { getAvailableSlots, createAppointment, createGroupAppointment } from "@/app/actions/booking";
import { createBookingPaymentIntent, createGroupPaymentIntent } from "@/app/actions/payments";
import { createGCBillingRequest, createGCGroupBillingRequest } from "@/app/actions/payments-gocardless";
import { checkTermsAcceptance, acceptContractTerms } from "@/app/actions/contract-terms";
import type { Dog } from "@/app/actions/dogs";
import type { AvailableSlot } from "@/app/actions/booking";

// Stripe singleton — initialised once at module level, never inside a component
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

// Stripe Elements appearance — matches Groomr design system
const STRIPE_APPEARANCE = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#2c3e50",
    colorBackground: "#ffffff",
    colorText: "#2c3e50",
    colorDanger: "#c87964",
    colorSuccess: "#88a096",
    fontFamily: "Nunito, system-ui, sans-serif",
    fontSizeBase: "14px",
    borderRadius: "12px",
    spacingUnit: "5px",
  },
  rules: {
    ".Input": {
      border: "1px solid rgba(149,165,166,0.3)",
      boxShadow: "none",
      padding: "10px 14px",
    },
    ".Input:focus": {
      border: "1px solid #2c3e50",
      boxShadow: "0 0 0 2px rgba(234,228,92,0.4)",
    },
    ".Label": {
      fontWeight: "700",
      fontSize: "12px",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      color: "#2c3e50",
    },
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price_pence: number;
  deposit_pence: number | null;
}

interface AvailabilityRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface DepositPolicy {
  type: "none" | "percentage" | "full";
  percentage: number | null;
}

interface BookingFlowProps {
  groomerProfileId: string;
  groomerName: string;
  services: Service[];
  availability: AvailabilityRow[];
  depositPolicy: DepositPolicy;
  onClose: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS = ["Service", "Date & Time", "Your Dog", "Confirm", "Payment"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ---------------------------------------------------------------------------
// PaymentStep — wraps Stripe Elements then renders CheckoutForm inside
// ---------------------------------------------------------------------------

function CheckoutForm({
  amountPence,
  depositPolicy,
  groomerName,
  onSuccess,
  onError,
}: {
  amountPence: number;
  depositPolicy: DepositPolicy;
  groomerName: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  const isDeposit = depositPolicy.type === "percentage";
  const label = isDeposit
    ? `Pay deposit — £${(amountPence / 100).toFixed(2)}`
    : `Pay — £${(amountPence / 100).toFixed(2)}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Redirect after 3DS if needed; for non-3DS cards this won't be visited
        return_url: `${window.location.origin}/dashboard/owner?booking=confirmed`,
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Amount chip */}
      <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-pebble-grey/15">
        <span className="text-sm font-bold text-deep-slate font-nunito">
          {isDeposit
            ? `${depositPolicy.percentage}% deposit to confirm with ${groomerName}`
            : `Full payment to ${groomerName}`}
        </span>
        <span className="font-fredoka text-xl text-deep-slate">
          £{(amountPence / 100).toFixed(2)}
        </span>
      </div>

      {/* Stripe PaymentElement */}
      <div className={`transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}>
        <PaymentElement
          onReady={() => setReady(true)}
          options={{ layout: "tabs" }}
        />
      </div>

      {!ready && (
        <div className="space-y-3">
          {[56, 48, 56].map((h, i) => (
            <div
              key={i}
              className={`bg-pebble-grey/15 rounded-xl animate-pulse`}
              style={{ height: h }}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-pebble-grey font-nunito flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Payments processed securely by Stripe. Groomr never stores card details.
      </p>

      <button
        type="submit"
        disabled={submitting || !stripe || !elements || !ready}
        className="w-full btn-primary font-nunito font-bold py-4 rounded-full text-base shadow-subtle focus-ring disabled:opacity-60"
      >
        {submitting ? "Processing…" : label}
      </button>
    </form>
  );
}

function PaymentStep({
  clientSecret,
  amountPence,
  depositPolicy,
  groomerName,
  onSuccess,
}: {
  clientSecret: string;
  amountPence: number;
  depositPolicy: DepositPolicy;
  groomerName: string;
  onSuccess: () => void;
}) {
  const [payError, setPayError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {payError && (
        <div className="bg-muted-terracotta/10 border border-muted-terracotta/20 rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-muted-terracotta">{payError}</p>
        </div>
      )}
      <Elements
        stripe={stripePromise}
        options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
      >
        <CheckoutForm
          amountPence={amountPence}
          depositPolicy={depositPolicy}
          groomerName={groomerName}
          onSuccess={onSuccess}
          onError={setPayError}
        />
      </Elements>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BookingFlow
// ---------------------------------------------------------------------------

export function BookingFlow({
  groomerProfileId,
  groomerName,
  services,
  availability,
  depositPolicy,
  onClose,
}: BookingFlowProps) {
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();

  const SESSION_KEY = `groomr_booking_resume_${groomerProfileId}`;

  const [step, setStep] = useState<Step>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTimeLabel, setSelectedTimeLabel] = useState<string | null>(null);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);

  // Payment state
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentAmountPence, setPaymentAmountPence] = useState<number>(0);
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "gocardless" | null>(null);
  const [gcAuthorisationUrl, setGcAuthorisationUrl] = useState<string | null>(null);
  const [loadingPaymentMethod, setLoadingPaymentMethod] = useState(false);
  const [paymentMethodError, setPaymentMethodError] = useState<string | null>(null);

  // Contract terms state
  const [termsNeedAcceptance, setTermsNeedAcceptance] = useState(false);
  const [termsContent, setTermsContent] = useState<string | null>(null);
  const [termsChecked, setTermsChecked] = useState(false);
  const termsCheckedForGroomer = useRef<string | null>(null);

  // Multi-pet state
  const [multiPetMode, setMultiPetMode] = useState(false);
  // additionalPets: extra dogs beyond selectedDog, each with their own serviceId
  const [additionalPets, setAdditionalPets] = useState<Array<{ dog: Dog; serviceId: string }>>([]);

  // Restore state saved before sign-in redirect
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    sessionStorage.removeItem(SESSION_KEY);
    try {
      const { serviceId, date, time, timeLabel } = JSON.parse(raw) as {
        serviceId: string;
        date: string;
        time: string;
        timeLabel: string;
      };
      const svc = services.find((s) => s.id === serviceId) ?? null;
      if (svc) setSelectedService(svc);
      if (date) setSelectedDate(date);
      if (time) setSelectedTime(time);
      if (timeLabel) setSelectedTimeLabel(timeLabel);
      if (svc && date && time) setStep(3);
    } catch {
      // ignore malformed data
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [dogs, setDogs] = useState<Dog[]>([]);
  const [dogsLoading, setDogsLoading] = useState(false);
  const [dogsFetched, setDogsFetched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (step === 3 && user && !dogsFetched) {
      setDogsLoading(true);
      getDogs().then((data) => {
        setDogs(data);
        setDogsLoading(false);
        setDogsFetched(true);
      });
    }
  }, [step, user, dogsFetched]);

  const availableDaySet = new Set(availability.map((a) => a.day_of_week));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 1);

  function isDateSelectable(date: Date): boolean {
    if (date < minDate) return false;
    return availableDaySet.has(date.getDay());
  }

  function toDateStr(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function formatDateLong(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  function buildCalendarDays(monthStart: Date): (Date | null)[] {
    const y = monthStart.getFullYear();
    const mo = monthStart.getMonth();
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const rawDow = new Date(y, mo, 1).getDay();
    const offset = (rawDow + 6) % 7;
    const cells: (Date | null)[] = Array(offset).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(y, mo, day));
    }
    return cells;
  }

  const calendarDays = buildCalendarDays(calendarMonth);
  const canPrevMonth = calendarMonth > new Date(today.getFullYear(), today.getMonth(), 1);

  async function handleDateSelect(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setSelectedTimeLabel(null);
    setSlots([]);
    if (!selectedService) return;
    setLoadingSlots(true);
    const result = await getAvailableSlots(groomerProfileId, selectedService.id, dateStr);
    setSlots(result);
    setLoadingSlots(false);
  }

  function depositDisplay(svc: Service): string | null {
    if (depositPolicy.type === "percentage" && depositPolicy.percentage != null) {
      const amt = Math.round((svc.price_pence * depositPolicy.percentage) / 100);
      const display = Number.isInteger(amt / 100) ? `£${amt / 100}` : `£${(amt / 100).toFixed(2)}`;
      return `${depositPolicy.percentage}% deposit (${display}) due today`;
    }
    if (depositPolicy.type === "full") return "Full payment due today";
    return null;
  }

  // Step 4 → "Confirm" button handler
  // Creates the appointment only. Payment method is chosen in step 5.
  async function handleConfirm() {
    if (!selectedService || !selectedDate || !selectedTime || !selectedDog) return;
    setSubmitting(true);
    setBookingError(null);

    // Accept contract terms if required
    if (termsNeedAcceptance && termsChecked) {
      await acceptContractTerms(groomerProfileId);
    }

    const scheduledAt = `${selectedDate}T${selectedTime}:00.000Z`;
    const isGroup = additionalPets.length > 0;

    if (isGroup) {
      const pets = [
        { dogId: selectedDog.id, serviceId: selectedService.id },
        ...additionalPets.map((p) => ({ dogId: p.dog.id, serviceId: p.serviceId })),
      ];

      const groupResult = await createGroupAppointment({ groomerProfileId, scheduledAt, pets });

      if ("error" in groupResult) {
        setBookingError(groupResult.error);
        setSubmitting(false);
        return;
      }

      if (depositPolicy.type === "none") {
        setSubmitting(false);
        setSuccess(true);
        return;
      }

      setCreatedGroupId(groupResult.bookingGroupId);
      setSubmitting(false);
      setStep(5);
      return;
    }

    // ── Single-pet path ──────────────────────────────────────────────────────
    const apptResult = await createAppointment({
      groomerProfileId,
      serviceId: selectedService.id,
      dogId: selectedDog.id,
      scheduledAt,
    });

    if ("error" in apptResult) {
      setBookingError(apptResult.error);
      setSubmitting(false);
      return;
    }

    if (depositPolicy.type === "none") {
      setSubmitting(false);
      setSuccess(true);
      return;
    }

    setCreatedAppointmentId(apptResult.appointmentId);
    setSubmitting(false);
    setStep(5);
  }

  // Step 5 → user chose card payment
  async function handleStripeChosen() {
    setLoadingPaymentMethod(true);
    setPaymentMethodError(null);

    try {
      const result = createdGroupId
        ? await createGroupPaymentIntent(createdGroupId)
        : await createBookingPaymentIntent({ appointmentId: createdAppointmentId! });

      if ("error" in result) {
        // Groomer not on Stripe yet — treat as pay-at-salon
        console.warn("[BookingFlow] PaymentIntent failed:", result.error);
        setSuccess(true);
        return;
      }

      if (!result.clientSecret || result.amountPence === 0) {
        setSuccess(true);
        return;
      }

      setPaymentClientSecret(result.clientSecret);
      setPaymentAmountPence(result.amountPence);
      setPaymentMethod("stripe");
    } catch (err) {
      console.error("[BookingFlow] handleStripeChosen:", err);
      setPaymentMethodError("Something went wrong setting up card payment. Please try again.");
    } finally {
      setLoadingPaymentMethod(false);
    }
  }

  // Step 5 → user chose Direct Debit
  async function handleGCChosen() {
    setLoadingPaymentMethod(true);
    setPaymentMethodError(null);

    try {
      const result = createdGroupId
        ? await createGCGroupBillingRequest(createdGroupId)
        : await createGCBillingRequest(createdAppointmentId!);

      if ("error" in result) {
        setPaymentMethodError(result.error);
        return;
      }

      setGcAuthorisationUrl(result.authorisationUrl);
      setPaymentMethod("gocardless");
    } catch (err) {
      console.error("[BookingFlow] handleGCChosen:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setPaymentMethodError(`Pay by Bank setup failed: ${msg}`);
    } finally {
      setLoadingPaymentMethod(false);
    }
  }

  // Number of visible progress steps (hide "Payment" dot if no payment needed)
  const visibleSteps = depositPolicy.type === "none" ? 4 : 5;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 py-6">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-deep-slate/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative bg-alabaster-cream w-full max-w-xl max-h-[92vh] rounded-[28px] shadow-modal border border-pebble-grey/20 z-10 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-pebble-grey/15 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-sage-leaf uppercase tracking-wider font-nunito mb-1">
                Book with {groomerName}
              </p>
              {!success && (
                <>
                  <h2 className="font-fredoka text-2xl text-deep-slate">
                    {STEP_LABELS[step - 1]}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-3">
                    {Array.from({ length: visibleSteps }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i + 1 === step
                            ? "bg-deep-slate w-7"
                            : i + 1 < step
                            ? "bg-groomr-gold w-4"
                            : "bg-pebble-grey/25 w-4"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close booking"
              className="shrink-0 text-deep-slate hover:text-muted-terracotta transition-colors focus-ring rounded-full p-2 bg-white/80 border border-pebble-grey/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-7 py-6" style={{ scrollbarWidth: "none" }}>
          {success ? (
            <SuccessState groomerName={groomerName} onClose={onClose} />

          ) : step === 1 ? (
            // ── STEP 1: SERVICE ─────────────────────────────────────────────────
            <div className="space-y-3">
              {services.length === 0 ? (
                <p className="text-pebble-grey text-sm font-nunito py-6 text-center">
                  No services available for booking yet.
                </p>
              ) : (
                services.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => { setSelectedService(svc); setStep(2); }}
                    className="w-full text-left bg-white rounded-xl border border-pebble-grey/15 p-5 hover:border-deep-slate hover:shadow-sm transition-all focus-ring group"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-fredoka text-lg text-deep-slate">{svc.name}</p>
                        {svc.description && (
                          <p className="text-xs text-pebble-grey mt-1 leading-relaxed">{svc.description}</p>
                        )}
                        {svc.duration_minutes && (
                          <p className="text-xs font-bold text-sage-leaf mt-2">{svc.duration_minutes} min</p>
                        )}
                      </div>
                      <span className="font-fredoka text-2xl text-deep-slate shrink-0">
                        £{(svc.price_pence / 100).toFixed(0)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

          ) : step === 2 ? (
            // ── STEP 2: DATE & TIME ─────────────────────────────────────────────
            <div className="space-y-6">
              {selectedService && (
                <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-pebble-grey/15">
                  <span className="font-bold text-sm text-deep-slate">{selectedService.name}</span>
                  <span className="font-fredoka text-deep-slate">
                    £{(selectedService.price_pence / 100).toFixed(0)}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCalendarMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}
                    disabled={!canPrevMonth}
                    aria-label="Previous month"
                    className="p-2 rounded-full hover:bg-pebble-grey/10 transition-colors disabled:opacity-25 focus-ring"
                  >
                    <svg className="w-4 h-4 text-deep-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="font-fredoka text-lg text-deep-slate">
                    {calendarMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                  </span>
                  <button
                    onClick={() => setCalendarMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}
                    aria-label="Next month"
                    className="p-2 rounded-full hover:bg-pebble-grey/10 transition-colors focus-ring"
                  >
                    <svg className="w-4 h-4 text-deep-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-7 mb-1">
                  {DAY_NAMES.map((d) => (
                    <p key={d} className="text-center text-xs font-bold text-pebble-grey py-1">{d}</p>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {calendarDays.map((day, i) => {
                    if (!day) return <div key={`pad-${i}`} />;
                    const ds = toDateStr(day);
                    const selectable = isDateSelectable(day);
                    const isSelected = selectedDate === ds;
                    return (
                      <button
                        key={ds}
                        onClick={() => selectable && handleDateSelect(ds)}
                        disabled={!selectable}
                        className={`mx-auto flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all focus-ring ${
                          isSelected
                            ? "bg-deep-slate text-alabaster-cream"
                            : selectable
                            ? "text-deep-slate hover:bg-groomr-gold/25"
                            : "text-pebble-grey/30 cursor-not-allowed"
                        }`}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
              {selectedDate && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
                    {formatDateLong(selectedDate)}
                  </p>
                  {loadingSlots ? (
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-10 bg-pebble-grey/15 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-pebble-grey text-sm font-nunito">
                      No slots available — try another date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => {
                            setSelectedTime(slot.time);
                            setSelectedTimeLabel(slot.label);
                            setStep(3);
                          }}
                          className="py-2.5 rounded-xl text-sm font-bold border transition-all focus-ring bg-white border-pebble-grey/20 text-deep-slate hover:border-deep-slate hover:shadow-sm"
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          ) : step === 3 ? (
            // ── STEP 3: DOG ─────────────────────────────────────────────────────
            <div className="space-y-4">
              {!isLoaded ? (
                <div className="py-8 text-center">
                  <p className="text-pebble-grey text-sm font-nunito">Loading…</p>
                </div>
              ) : !user ? (
                <div className="text-center py-10 space-y-4">
                  <div className="text-4xl">🐾</div>
                  <p className="font-fredoka text-xl text-deep-slate">Sign in to book</p>
                  <p className="text-pebble-grey text-sm font-nunito">
                    You need a Groomr account to request appointments.
                  </p>
                  <button
                    onClick={() => {
                      sessionStorage.setItem(
                        SESSION_KEY,
                        JSON.stringify({
                          serviceId: selectedService?.id ?? "",
                          date: selectedDate ?? "",
                          time: selectedTime ?? "",
                          timeLabel: selectedTimeLabel ?? "",
                        }),
                      );
                      openSignIn({ forceRedirectUrl: window.location.href });
                    }}
                    className="btn-primary font-nunito font-bold px-6 py-3 rounded-full focus-ring"
                  >
                    Sign In
                  </button>
                </div>
              ) : dogsLoading ? (
                <div className="space-y-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-20 bg-pebble-grey/15 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : dogs.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <div className="text-4xl">🐶</div>
                  <p className="font-fredoka text-xl text-deep-slate">Add a dog first</p>
                  <p className="text-pebble-grey text-sm font-nunito">
                    Add your dog&apos;s details to your owner dashboard before booking.
                  </p>
                  <Link href="/dashboard/owner" className="btn-primary font-nunito font-bold px-6 py-3 rounded-full focus-ring inline-block">
                    Go to Owner Dashboard
                  </Link>
                </div>
              ) : (
                <>
                  {!multiPetMode ? (
                    // ── Single-pet mode (default) ──────────────────────────────
                    <>
                      <p className="text-sm text-pebble-grey font-nunito">Which dog is this booking for?</p>
                      {dogs.map((dog) => (
                        <button
                          key={dog.id}
                          onClick={async () => {
                            setSelectedDog(dog);
                            setAdditionalPets([]);
                            setStep(4);
                            if (termsCheckedForGroomer.current !== groomerProfileId) {
                              const check = await checkTermsAcceptance(groomerProfileId);
                              termsCheckedForGroomer.current = groomerProfileId;
                              setTermsNeedAcceptance(check.needsAcceptance);
                              setTermsContent(check.content);
                              setTermsChecked(false);
                            }
                          }}
                          className="w-full text-left bg-white rounded-xl border border-pebble-grey/15 p-4 hover:border-deep-slate hover:shadow-sm transition-all focus-ring flex items-center gap-4"
                        >
                          {dog.profile_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={dog.profile_image_url} alt={dog.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-sage-leaf/15 flex items-center justify-center shrink-0 text-xl">🐾</div>
                          )}
                          <div className="min-w-0">
                            <p className="font-fredoka text-lg text-deep-slate leading-tight">{dog.name}</p>
                            <p className="text-xs text-pebble-grey mt-0.5">
                              {[dog.breed, dog.size].filter(Boolean).join(" · ") || "Dog"}
                            </p>
                          </div>
                        </button>
                      ))}
                      {dogs.length > 1 && (
                        <button
                          onClick={() => { setMultiPetMode(true); setSelectedDog(null); setAdditionalPets([]); }}
                          className="w-full text-center text-xs font-bold text-pebble-grey hover:text-deep-slate transition-colors py-2 focus-ring rounded"
                        >
                          Bringing more than one dog? →
                        </button>
                      )}
                    </>
                  ) : (
                    // ── Multi-pet mode ─────────────────────────────────────────
                    <>
                      <p className="text-sm text-pebble-grey font-nunito">Select the dogs for this appointment and pick a service for each.</p>

                      {/* Primary dog row */}
                      {dogs.map((dog) => {
                        const isSelected = selectedDog?.id === dog.id;
                        const additionalIdx = additionalPets.findIndex((p) => p.dog.id === dog.id);
                        const isPrimarySelected = isSelected;
                        const isAdditional = additionalIdx !== -1;
                        const isAnySelected = isPrimarySelected || isAdditional;

                        return (
                          <div key={dog.id} className={`bg-white rounded-xl border-2 transition-all ${isAnySelected ? "border-deep-slate" : "border-pebble-grey/15"}`}>
                            <button
                              onClick={() => {
                                if (isPrimarySelected) {
                                  setSelectedDog(null);
                                } else if (isAdditional) {
                                  setAdditionalPets((prev) => prev.filter((p) => p.dog.id !== dog.id));
                                } else if (!selectedDog) {
                                  setSelectedDog(dog);
                                } else {
                                  // Add as additional pet
                                  const firstServiceId = services[0]?.id ?? "";
                                  setAdditionalPets((prev) => [...prev, { dog, serviceId: firstServiceId }]);
                                }
                              }}
                              className="w-full text-left p-4 flex items-center gap-4 focus-ring rounded-xl"
                            >
                              <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${isAnySelected ? "bg-deep-slate border-deep-slate" : "border-pebble-grey/40"}`}>
                                {isAnySelected && <span className="text-alabaster-cream text-xs">✓</span>}
                              </div>
                              {dog.profile_image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={dog.profile_image_url} alt={dog.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-sage-leaf/15 flex items-center justify-center shrink-0">🐾</div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-fredoka text-base text-deep-slate">{dog.name}</p>
                                <p className="text-xs text-pebble-grey">{[dog.breed, dog.size].filter(Boolean).join(" · ") || "Dog"}</p>
                              </div>
                            </button>
                            {(isPrimarySelected || isAdditional) && (
                              <div className="px-4 pb-3 pt-0">
                                <select
                                  value={isPrimarySelected ? (selectedService?.id ?? "") : additionalPets[additionalIdx].serviceId}
                                  onChange={(e) => {
                                    if (isPrimarySelected) {
                                      const svc = services.find((s) => s.id === e.target.value);
                                      if (svc) setSelectedService(svc);
                                    } else {
                                      setAdditionalPets((prev) =>
                                        prev.map((p, i) => i === additionalIdx ? { ...p, serviceId: e.target.value } : p)
                                      );
                                    }
                                  }}
                                  className="field w-full text-sm"
                                >
                                  {services.filter(s => s.id).map((s) => (
                                    <option key={s.id} value={s.id!}>{s.name} — £{(s.price_pence / 100).toFixed(0)}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Total + Continue */}
                      {(selectedDog || additionalPets.length > 0) && (() => {
                        const totalSelected = (selectedDog ? 1 : 0) + additionalPets.length;
                        const primaryPrice = selectedDog ? (selectedService?.price_pence ?? 0) : 0;
                        const additionalPrice = additionalPets.reduce((sum, p) => {
                          const svc = services.find((s) => s.id === p.serviceId);
                          return sum + (svc?.price_pence ?? 0);
                        }, 0);
                        const totalPrice = primaryPrice + additionalPrice;

                        return (
                          <div className="space-y-3 pt-1">
                            <div className="flex items-center justify-between bg-white rounded-xl border border-pebble-grey/15 px-4 py-3">
                              <span className="text-sm font-bold text-pebble-grey">{totalSelected} dog{totalSelected !== 1 ? "s" : ""} selected</span>
                              <span className="font-fredoka text-lg text-deep-slate">£{(totalPrice / 100).toFixed(0)}</span>
                            </div>
                            {totalSelected >= 2 ? (
                              <button
                                onClick={async () => {
                                  setStep(4);
                                  if (termsCheckedForGroomer.current !== groomerProfileId) {
                                    const check = await checkTermsAcceptance(groomerProfileId);
                                    termsCheckedForGroomer.current = groomerProfileId;
                                    setTermsNeedAcceptance(check.needsAcceptance);
                                    setTermsContent(check.content);
                                    setTermsChecked(false);
                                  }
                                }}
                                className="w-full btn-primary font-nunito font-bold py-3 rounded-full text-sm focus-ring shadow-subtle"
                              >
                                Continue with {totalSelected} dogs →
                              </button>
                            ) : (
                              <p className="text-xs text-center text-pebble-grey font-nunito">Select at least 2 dogs to continue in multi-pet mode.</p>
                            )}
                          </div>
                        );
                      })()}

                      <button
                        onClick={() => { setMultiPetMode(false); setSelectedDog(null); setAdditionalPets([]); }}
                        className="w-full text-center text-xs font-bold text-pebble-grey hover:text-deep-slate transition-colors py-1 focus-ring rounded"
                      >
                        ← Back to single dog
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

          ) : step === 4 ? (
            // ── STEP 4: CONFIRM ─────────────────────────────────────────────────
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-pebble-grey/15 overflow-hidden divide-y divide-pebble-grey/10">
                <SummaryRow label="Date" value={selectedDate ? formatDateLong(selectedDate) : ""} />
                <SummaryRow label="Time" value={selectedTimeLabel ?? ""} />
                {additionalPets.length === 0 ? (
                  // Single-pet summary
                  <>
                    <SummaryRow label="Service" value={selectedService?.name ?? ""} />
                    <SummaryRow label="Dog" value={selectedDog?.name ?? ""} />
                    <SummaryRow label="Price" value={`£${((selectedService?.price_pence ?? 0) / 100).toFixed(0)}`} bold />
                  </>
                ) : (
                  // Multi-pet summary
                  <>
                    {selectedDog && selectedService && (
                      <SummaryRow label={selectedDog.name} value={`${selectedService.name} — £${(selectedService.price_pence / 100).toFixed(0)}`} />
                    )}
                    {additionalPets.map((p) => {
                      const svc = services.find((s) => s.id === p.serviceId);
                      return (
                        <SummaryRow
                          key={p.dog.id}
                          label={p.dog.name}
                          value={`${svc?.name ?? "Service"} — £${((svc?.price_pence ?? 0) / 100).toFixed(0)}`}
                        />
                      );
                    })}
                    <SummaryRow
                      label="Total"
                      value={`£${(((selectedService?.price_pence ?? 0) + additionalPets.reduce((s, p) => s + (services.find(sv => sv.id === p.serviceId)?.price_pence ?? 0), 0)) / 100).toFixed(0)}`}
                      bold
                    />
                  </>
                )}
                {additionalPets.length === 0 && selectedService && depositDisplay(selectedService) && (
                  <div className="px-5 py-3 bg-groomr-gold/10">
                    <p className="text-xs font-bold text-deep-slate">
                      💳 {depositDisplay(selectedService)}
                    </p>
                  </div>
                )}
              </div>

              {depositPolicy.type === "none" && (
                <div className="bg-sage-leaf/10 border border-sage-leaf/20 rounded-xl px-4 py-3">
                  <p className="text-sm font-nunito text-deep-slate">
                    <span className="font-bold">Instant booking</span> — confirmed straight away. Payment collected at the appointment.
                  </p>
                </div>
              )}

              {bookingError && (
                <div className="bg-muted-terracotta/10 border border-muted-terracotta/20 rounded-xl px-4 py-3">
                  <p className="text-sm font-bold text-muted-terracotta">{bookingError}</p>
                </div>
              )}

              {termsNeedAcceptance && termsContent && (
                <div className="bg-white border border-pebble-grey/20 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey">
                    {groomerName}&apos;s terms of service
                  </p>
                  <div className="max-h-40 overflow-y-auto text-xs text-deep-slate/80 font-nunito whitespace-pre-wrap border border-pebble-grey/10 rounded-lg p-3 bg-alabaster-cream">
                    {termsContent}
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsChecked}
                      onChange={(e) => setTermsChecked(e.target.checked)}
                      className="mt-0.5 rounded shrink-0"
                    />
                    <span className="text-sm font-bold text-deep-slate">
                      I agree to {groomerName}&apos;s terms of service
                    </span>
                  </label>
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={submitting || (termsNeedAcceptance && !termsChecked)}
                className="w-full btn-primary font-nunito font-bold py-4 rounded-full text-base shadow-subtle focus-ring disabled:opacity-60"
              >
                {submitting
                  ? "Reserving your slot…"
                  : depositPolicy.type === "none"
                  ? "Confirm Booking"
                  : "Continue to Payment →"}
              </button>
            </div>

          ) : step === 5 ? (
            // ── STEP 5: PAYMENT ─────────────────────────────────────────────────
            paymentMethod === "stripe" && paymentClientSecret ? (
              <PaymentStep
                clientSecret={paymentClientSecret}
                amountPence={paymentAmountPence}
                depositPolicy={depositPolicy}
                groomerName={groomerName}
                onSuccess={() => setSuccess(true)}
              />
            ) : paymentMethod === "gocardless" && gcAuthorisationUrl ? (
              <DirectDebitStep
                authorisationUrl={gcAuthorisationUrl}
                amountPence={paymentAmountPence || (() => {
                  // Derive amount from whichever service(s) are booked
                  const base = selectedService?.price_pence ?? 0;
                  const extra = additionalPets.reduce((s, p) => {
                    const svc = services.find((sv) => sv.id === p.serviceId);
                    return s + (svc?.price_pence ?? 0);
                  }, 0);
                  const full = base + extra;
                  if (depositPolicy.type === "percentage" && depositPolicy.percentage != null) {
                    return Math.round(full * (depositPolicy.percentage / 100));
                  }
                  return full;
                })()}
                depositPolicy={depositPolicy}
                groomerName={groomerName}
              />
            ) : (
              <PaymentMethodPicker
                loading={loadingPaymentMethod}
                error={paymentMethodError}
                onStripe={handleStripeChosen}
                onGC={handleGCChosen}
              />
            )

          ) : null}
        </div>

        {/* Back button — not shown on payment step (can't undo appointment creation) */}
        {!success && step > 1 && step < 5 && (
          <div className="px-7 py-4 border-t border-pebble-grey/10 shrink-0">
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="text-sm font-bold text-pebble-grey hover:text-deep-slate transition-colors font-nunito focus-ring rounded-full px-2 py-1"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center px-5 py-3">
      <span className="text-xs font-bold text-pebble-grey uppercase tracking-wider">{label}</span>
      <span className={`text-sm text-deep-slate ${bold ? "font-fredoka text-lg" : "font-bold"}`}>
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PaymentMethodPicker — shown at step 5 before a method is chosen
// ---------------------------------------------------------------------------

function PaymentMethodPicker({
  loading,
  error,
  onStripe,
  onGC,
}: {
  loading: boolean;
  error: string | null;
  onStripe: () => void;
  onGC: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-pebble-grey font-nunito">How would you like to pay?</p>

      {error && (
        <div className="bg-muted-terracotta/10 border border-muted-terracotta/20 rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-muted-terracotta">{error}</p>
        </div>
      )}

      <button
        onClick={onStripe}
        disabled={loading}
        className="w-full text-left bg-white rounded-xl border-2 border-pebble-grey/15 p-5 hover:border-deep-slate hover:shadow-sm transition-all focus-ring group disabled:opacity-60"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-deep-slate/5 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-deep-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-fredoka text-lg text-deep-slate leading-tight">Pay by card</p>
            <p className="text-xs text-pebble-grey mt-0.5 font-nunito">Credit or debit card — instant confirmation</p>
          </div>
          <svg className="w-4 h-4 text-pebble-grey/40 group-hover:text-deep-slate transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      <button
        onClick={onGC}
        disabled={loading}
        className="w-full text-left bg-white rounded-xl border-2 border-pebble-grey/15 p-5 hover:border-deep-slate hover:shadow-sm transition-all focus-ring group disabled:opacity-60"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sage-leaf/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-sage-leaf" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-fredoka text-lg text-deep-slate leading-tight">Pay by Bank</p>
            <p className="text-xs text-pebble-grey mt-0.5 font-nunito">Instant bank transfer via Open Banking — no card details needed</p>
          </div>
          <svg className="w-4 h-4 text-pebble-grey/40 group-hover:text-deep-slate transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {loading && (
        <p className="text-center text-xs text-pebble-grey font-nunito animate-pulse pt-1">Setting up payment…</p>
      )}

      <p className="text-xs text-pebble-grey font-nunito flex items-center gap-1.5 pt-1">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        All payments are processed securely. Groomr never stores your financial details.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DirectDebitStep — shown after a GC billing request is created (Open Banking)
// ---------------------------------------------------------------------------

function DirectDebitStep({
  authorisationUrl,
  amountPence,
  depositPolicy,
  groomerName,
}: {
  authorisationUrl: string;
  amountPence: number;
  depositPolicy: DepositPolicy;
  groomerName: string;
}) {
  const isDeposit = depositPolicy.type === "percentage";
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-pebble-grey/15">
        <span className="text-sm font-bold text-deep-slate font-nunito">
          {isDeposit
            ? `${depositPolicy.percentage}% deposit to confirm with ${groomerName}`
            : `Full payment to ${groomerName}`}
        </span>
        <span className="font-fredoka text-xl text-deep-slate">
          £{(amountPence / 100).toFixed(2)}
        </span>
      </div>

      <div className="bg-sage-leaf/8 border border-sage-leaf/20 rounded-xl p-4 space-y-2">
        <p className="text-sm font-bold text-deep-slate font-nunito">How Pay by Bank works</p>
        <ul className="text-xs text-deep-slate/70 font-nunito space-y-1.5">
          <li className="flex gap-2"><span className="text-sage-leaf shrink-0">✓</span>You&apos;ll be taken to GoCardless to select your bank and approve the payment — takes about a minute.</li>
          <li className="flex gap-2"><span className="text-sage-leaf shrink-0">✓</span>Payment is sent directly from your bank account — no card details needed.</li>
          <li className="flex gap-2"><span className="text-sage-leaf shrink-0">✓</span>Uses Open Banking — your credentials are never shared with Groomr or GoCardless.</li>
        </ul>
      </div>

      <a
        href={authorisationUrl}
        className="w-full btn-primary font-nunito font-bold py-4 rounded-full text-base shadow-subtle focus-ring flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
        Pay by Bank
      </a>

      <p className="text-xs text-center text-pebble-grey font-nunito">
        You&apos;ll be redirected to GoCardless to complete the payment, then returned here.
      </p>
    </div>
  );
}

function SuccessState({ groomerName, onClose }: { groomerName: string; onClose: () => void }) {
  return (
    <div className="text-center py-10 space-y-5">
      <div className="w-16 h-16 bg-groomr-gold rounded-full flex items-center justify-center mx-auto text-3xl shadow-subtle">
        🐾
      </div>
      <div className="space-y-2">
        <h3 className="font-fredoka text-3xl text-deep-slate">You&apos;re booked in!</h3>
        <p className="text-pebble-grey font-nunito text-sm max-w-xs mx-auto">
          Your appointment with {groomerName} is confirmed. See you there!
        </p>
      </div>
      <div className="flex flex-col gap-3 pt-2">
        <Link href="/dashboard/owner" className="btn-primary font-nunito font-bold px-8 py-3 rounded-full focus-ring inline-block">
          View My Bookings
        </Link>
        <button
          onClick={onClose}
          className="text-sm font-bold text-pebble-grey hover:text-deep-slate transition-colors font-nunito focus-ring rounded-full px-3 py-1"
        >
          Back to profile
        </button>
      </div>
    </div>
  );
}
