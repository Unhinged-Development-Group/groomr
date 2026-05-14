"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { getDogs } from "@/app/actions/dogs";
import { getAvailableSlots, createAppointment } from "@/app/actions/booking";
import type { Dog } from "@/app/actions/dogs";
import type { AvailableSlot } from "@/app/actions/booking";

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

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ["Service", "Date & Time", "Your Dog", "Confirm"];
// Mon-first week header (UK standard)
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function BookingFlow({
  groomerProfileId,
  groomerName,
  services,
  availability,
  depositPolicy,
  onClose,
}: BookingFlowProps) {
  const { user, isLoaded } = useUser();

  const [step, setStep] = useState<Step>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTimeLabel, setSelectedTimeLabel] = useState<string | null>(null);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);

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

  // Fetch dogs once when step 3 is reached and user is signed in
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

  // Set of day_of_week values the groomer works
  const availableDaySet = new Set(availability.map((a) => a.day_of_week));

  // Calendar helpers
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 1); // earliest selectable = tomorrow

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

  // Build Mon-first calendar grid (nulls = padding cells before the 1st)
  function buildCalendarDays(monthStart: Date): (Date | null)[] {
    const y = monthStart.getFullYear();
    const mo = monthStart.getMonth();
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const rawDow = new Date(y, mo, 1).getDay(); // 0=Sun
    const offset = (rawDow + 6) % 7; // Mon=0

    const cells: (Date | null)[] = Array(offset).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(y, mo, day));
    }
    return cells;
  }

  const calendarDays = buildCalendarDays(calendarMonth);

  const canPrevMonth =
    calendarMonth > new Date(today.getFullYear(), today.getMonth(), 1);

  async function handleDateSelect(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setSelectedTimeLabel(null);
    setSlots([]);
    if (!selectedService) return;
    setLoadingSlots(true);
    const result = await getAvailableSlots(
      groomerProfileId,
      selectedService.id,
      dateStr,
    );
    setSlots(result);
    setLoadingSlots(false);
  }

  function depositDisplay(svc: Service): string | null {
    if (depositPolicy.type === "percentage" && depositPolicy.percentage != null) {
      const amt = Math.round((svc.price_pence * depositPolicy.percentage) / 100);
      return `${depositPolicy.percentage}% deposit (£${(amt / 100).toFixed(0)}) due today`;
    }
    if (depositPolicy.type === "full") return "Full payment due today";
    return null;
  }

  async function handleConfirm() {
    if (!selectedService || !selectedDate || !selectedTime || !selectedDog) return;
    setSubmitting(true);
    setBookingError(null);

    const result = await createAppointment({
      groomerProfileId,
      serviceId: selectedService.id,
      dogId: selectedDog.id,
      scheduledAt: `${selectedDate}T${selectedTime}:00.000Z`,
    });

    setSubmitting(false);
    if ("error" in result) {
      setBookingError(result.error);
    } else {
      setSuccess(true);
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 py-6">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-deep-slate/60 backdrop-blur-sm"
      />

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
                    {STEP_LABELS.map((_, i) => (
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto px-7 py-6"
          style={{ scrollbarWidth: "none" }}
        >
          {success ? (
            <SuccessState groomerName={groomerName} onClose={onClose} />
          ) : step === 1 ? (
            // ── STEP 1: SERVICE ───────────────────────────────────────
            <div className="space-y-3">
              {services.length === 0 ? (
                <p className="text-pebble-grey text-sm font-nunito py-6 text-center">
                  No services available for booking yet.
                </p>
              ) : (
                services.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => {
                      setSelectedService(svc);
                      setStep(2);
                    }}
                    className="w-full text-left bg-white rounded-xl border border-pebble-grey/15 p-5 hover:border-deep-slate hover:shadow-sm transition-all focus-ring group"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-fredoka text-lg text-deep-slate">
                          {svc.name}
                        </p>
                        {svc.description && (
                          <p className="text-xs text-pebble-grey mt-1 leading-relaxed">
                            {svc.description}
                          </p>
                        )}
                        {svc.duration_minutes && (
                          <p className="text-xs font-bold text-sage-leaf mt-2">
                            {svc.duration_minutes} min
                          </p>
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
            // ── STEP 2: DATE & TIME ───────────────────────────────────
            <div className="space-y-6">
              {/* Service recap chip */}
              {selectedService && (
                <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-pebble-grey/15">
                  <span className="font-bold text-sm text-deep-slate">
                    {selectedService.name}
                  </span>
                  <span className="font-fredoka text-deep-slate">
                    £{(selectedService.price_pence / 100).toFixed(0)}
                  </span>
                </div>
              )}

              {/* Calendar */}
              <div>
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() =>
                      setCalendarMonth(
                        (p) => new Date(p.getFullYear(), p.getMonth() - 1, 1),
                      )
                    }
                    disabled={!canPrevMonth}
                    aria-label="Previous month"
                    className="p-2 rounded-full hover:bg-pebble-grey/10 transition-colors disabled:opacity-25 focus-ring"
                  >
                    <svg className="w-4 h-4 text-deep-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="font-fredoka text-lg text-deep-slate">
                    {calendarMonth.toLocaleDateString("en-GB", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={() =>
                      setCalendarMonth(
                        (p) => new Date(p.getFullYear(), p.getMonth() + 1, 1),
                      )
                    }
                    aria-label="Next month"
                    className="p-2 rounded-full hover:bg-pebble-grey/10 transition-colors focus-ring"
                  >
                    <svg className="w-4 h-4 text-deep-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Day-of-week headers */}
                <div className="grid grid-cols-7 mb-1">
                  {DAY_NAMES.map((d) => (
                    <p
                      key={d}
                      className="text-center text-xs font-bold text-pebble-grey py-1"
                    >
                      {d}
                    </p>
                  ))}
                </div>

                {/* Day cells */}
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

              {/* Time slots */}
              {selectedDate && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
                    {formatDateLong(selectedDate)}
                  </p>
                  {loadingSlots ? (
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-10 bg-pebble-grey/15 rounded-lg animate-pulse"
                        />
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
            // ── STEP 3: DOG ───────────────────────────────────────────
            <div className="space-y-4">
              {!isLoaded ? (
                <div className="py-8 text-center">
                  <p className="text-pebble-grey text-sm font-nunito">Loading…</p>
                </div>
              ) : !user ? (
                <div className="text-center py-10 space-y-4">
                  <div className="text-4xl">🐾</div>
                  <p className="font-fredoka text-xl text-deep-slate">
                    Sign in to book
                  </p>
                  <p className="text-pebble-grey text-sm font-nunito">
                    You need a Groomr account to request appointments.
                  </p>
                  <Link
                    href="/sign-in"
                    className="btn-primary font-nunito font-bold px-6 py-3 rounded-full focus-ring inline-block"
                  >
                    Sign In
                  </Link>
                </div>
              ) : dogsLoading ? (
                <div className="space-y-3">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="h-20 bg-pebble-grey/15 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : dogs.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <div className="text-4xl">🐶</div>
                  <p className="font-fredoka text-xl text-deep-slate">
                    Add a dog first
                  </p>
                  <p className="text-pebble-grey text-sm font-nunito">
                    Add your dog&apos;s details to your owner dashboard before booking.
                  </p>
                  <Link
                    href="/dashboard/owner"
                    className="btn-primary font-nunito font-bold px-6 py-3 rounded-full focus-ring inline-block"
                  >
                    Go to Owner Dashboard
                  </Link>
                </div>
              ) : (
                <>
                  <p className="text-sm text-pebble-grey font-nunito">
                    Which dog is this booking for?
                  </p>
                  {dogs.map((dog) => (
                    <button
                      key={dog.id}
                      onClick={() => {
                        setSelectedDog(dog);
                        setStep(4);
                      }}
                      className="w-full text-left bg-white rounded-xl border border-pebble-grey/15 p-4 hover:border-deep-slate hover:shadow-sm transition-all focus-ring flex items-center gap-4"
                    >
                      {dog.profile_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={dog.profile_image_url}
                          alt={dog.name}
                          className="w-12 h-12 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-sage-leaf/15 flex items-center justify-center shrink-0 text-xl">
                          🐾
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-fredoka text-lg text-deep-slate leading-tight">
                          {dog.name}
                        </p>
                        <p className="text-xs text-pebble-grey mt-0.5">
                          {[dog.breed, dog.size]
                            .filter(Boolean)
                            .join(" · ") || "Dog"}
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          ) : (
            // ── STEP 4: CONFIRM ───────────────────────────────────────
            <div className="space-y-5">
              {/* Summary */}
              <div className="bg-white rounded-xl border border-pebble-grey/15 overflow-hidden divide-y divide-pebble-grey/10">
                <SummaryRow label="Service" value={selectedService?.name ?? ""} />
                <SummaryRow
                  label="Date"
                  value={selectedDate ? formatDateLong(selectedDate) : ""}
                />
                <SummaryRow label="Time" value={selectedTimeLabel ?? ""} />
                <SummaryRow label="Dog" value={selectedDog?.name ?? ""} />
                <SummaryRow
                  label="Price"
                  value={`£${((selectedService?.price_pence ?? 0) / 100).toFixed(0)}`}
                  bold
                />
                {selectedService && depositDisplay(selectedService) && (
                  <div className="px-5 py-3 bg-groomr-gold/10">
                    <p className="text-xs font-bold text-deep-slate">
                      💳 {depositDisplay(selectedService)}
                    </p>
                    <p className="text-xs text-pebble-grey mt-0.5 font-nunito">
                      Payment will be collected when booking is confirmed (Phase 3).
                    </p>
                  </div>
                )}
              </div>

              {/* Pending note */}
              <div className="bg-sage-leaf/10 border border-sage-leaf/20 rounded-xl px-4 py-3">
                <p className="text-sm font-nunito text-deep-slate">
                  Your request will show as{" "}
                  <span className="font-bold">pending</span> in your dashboard
                  while {groomerName} confirms it.
                </p>
              </div>

              {bookingError && (
                <div className="bg-muted-terracotta/10 border border-muted-terracotta/20 rounded-xl px-4 py-3">
                  <p className="text-sm font-bold text-muted-terracotta">
                    {bookingError}
                  </p>
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full btn-primary font-nunito font-bold py-4 rounded-full text-base shadow-subtle focus-ring disabled:opacity-60"
              >
                {submitting ? "Requesting…" : "Request Booking"}
              </button>
            </div>
          )}
        </div>

        {/* Back button */}
        {!success && step > 1 && (
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

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center px-5 py-3">
      <span className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`text-sm text-deep-slate ${bold ? "font-fredoka text-lg" : "font-bold"}`}
      >
        {value}
      </span>
    </div>
  );
}

function SuccessState({
  groomerName,
  onClose,
}: {
  groomerName: string;
  onClose: () => void;
}) {
  return (
    <div className="text-center py-10 space-y-5">
      <div className="w-16 h-16 bg-groomr-gold rounded-full flex items-center justify-center mx-auto text-3xl shadow-subtle">
        🐾
      </div>
      <div className="space-y-2">
        <h3 className="font-fredoka text-3xl text-deep-slate">
          Booking requested!
        </h3>
        <p className="text-pebble-grey font-nunito text-sm max-w-xs mx-auto">
          {groomerName} will confirm shortly. You can track it in your
          dashboard.
        </p>
      </div>
      <div className="flex flex-col gap-3 pt-2">
        <Link
          href="/dashboard/owner"
          className="btn-primary font-nunito font-bold px-8 py-3 rounded-full focus-ring inline-block"
        >
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
