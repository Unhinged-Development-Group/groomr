"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ClockIcon, PinIcon, StarIcon } from "@/components/ui/GroomrIcons";
import type { Appointment } from "@/app/actions/appointments";
import { RecurringRequestModal } from "./RecurringRequestModal";
import { ownerCancelRecurringSeries } from "@/app/actions/recurring";
import {
  cancelAppointment,
  rescheduleAppointment,
  getGroomerAvailabilityDays,
  submitOwnerReview,
} from "@/app/actions/appointments";
import { getAvailableSlots } from "@/app/actions/booking";
import type { AvailableSlot } from "@/app/actions/booking";
import { Modal } from "@/components/ui/Modal";
import { TipModal } from "./TipModal";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type ManageView = "choice" | "reschedule" | "cancel" | "done";

export function AppointmentsSection({
  initialAppointments,
  tippedAppointmentIds,
}: {
  initialAppointments: Appointment[];
  tippedAppointmentIds: Set<string>;
}) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [tipped, setTipped] = useState<Set<string>>(tippedAppointmentIds);
  const [tipTarget, setTipTarget] = useState<Appointment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [manageView, setManageView] = useState<ManageView>("choice");
  const [showReview, setShowReview] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<Appointment | null>(null);
  const [recurringTarget, setRecurringTarget] = useState<Appointment | null>(null);
  const [showAllPast, setShowAllPast] = useState(false);
  const [cancellingSeriesId, setCancellingSeriesId] = useState<string | null>(null);

  function openReview(apt: Appointment) {
    setReviewTarget(apt);
    setShowReview(true);
  }

  function handleReviewSubmitted(appointmentId: string) {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId ? { ...a, reviews: [{ id: "submitted" }] } : a
      )
    );
    setShowReview(false);
  }

  const now = new Date();
  const upcoming = appointments
    .filter((a) => new Date(a.scheduled_at) > now && a.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const past = appointments.filter(
    (a) => new Date(a.scheduled_at) <= now || a.status === "cancelled",
  );

  function openManage(apt: Appointment) {
    setActiveAppointment(apt);
    setManageView("choice");
    setShowManage(true);
  }

  function closeManage() {
    setShowManage(false);
  }

  async function handleCancel() {
    if (!activeAppointment) return;
    const result = await cancelAppointment(activeAppointment.id, "User requested cancellation");
    if (result.ok) {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === activeAppointment.id ? { ...a, status: "cancelled" } : a,
        ),
      );
      setManageView("done");
    }
  }

  function handleRescheduled(newAt: string) {
    if (!activeAppointment) return;
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === activeAppointment.id ? { ...a, scheduled_at: newAt } : a,
      ),
    );
    setManageView("done");
  }

  return (
    <>
      <section className="mb-10">
        <h2 className="font-fredoka text-2xl md:text-3xl text-deep-slate border-b-2 border-pebble-grey/20 pb-3 mb-6">
          Upcoming Appointments
        </h2>

        {upcoming.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-pebble-grey/20 text-center">
            <p className="font-nunito text-pebble-grey">No upcoming appointments found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((apt) => {
              const date = new Date(apt.scheduled_at);
              const month = date.toLocaleString("default", { month: "short" });
              const day = date.getDate();
              const weekday = date.toLocaleString("default", { weekday: "short" });
              const timeString = date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              const groomerName = apt.groomer_profiles?.business_name || "Groomer";
              const groomerImg = apt.groomer_profiles?.profile_image_url ?? null;
              const location = apt.groomer_profiles?.city || apt.groomer_profiles?.address_line_1 || null;

              return (
                <div
                  key={apt.id}
                  className="bg-white rounded-[12px] p-4 flex gap-3 items-start border border-pebble-grey/20"
                >
                  {/* Date block */}
                  <div className="bg-sage-leaf/10 border border-sage-leaf/20 rounded-xl p-2.5 flex flex-col items-center w-14 shrink-0 text-center">
                    <span className="font-nunito font-bold text-sage-leaf uppercase tracking-widest text-[10px]">
                      {month}
                    </span>
                    <span className="font-fredoka text-2xl text-deep-slate leading-none mt-0.5">
                      {day}
                    </span>
                    <span className="font-nunito text-[10px] text-pebble-grey mt-0.5">
                      {weekday}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Groomer + status row */}
                    <div className="flex items-center gap-2">
                      <Link href={`/groomers/${apt.groomer_profile_id}`} className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-alabaster-cream focus-ring">
                        <Image
                          src={groomerImg || "/assets/default-profile-photo.svg"}
                          alt={groomerName}
                          width={24}
                          height={24}
                          className={groomerImg ? "object-cover w-full h-full" : "object-contain w-full h-full p-0.5"}
                        />
                      </Link>
                      <Link href={`/groomers/${apt.groomer_profile_id}`} className="text-xs font-nunito font-bold text-pebble-grey hover:text-sage-leaf transition-colors truncate flex-1 focus-ring rounded">
                        {groomerName}
                      </Link>
                      <span className="shrink-0 bg-groomr-gold/20 text-deep-slate text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {apt.status}
                      </span>
                    </div>

                    {/* Service name */}
                    <p className="font-fredoka text-base text-deep-slate leading-tight mt-1.5">
                      {apt.service_snapshot_name || "Grooming"} for {apt.dogs?.name}
                    </p>

                    {/* Time + location */}
                    <div className="flex items-center gap-3 mt-1 font-nunito text-xs text-pebble-grey flex-wrap">
                      <span className="flex items-center gap-1">
                        <ClockIcon size={11} />
                        {timeString}
                      </span>
                      {location && (
                        <span className="flex items-center gap-1">
                          <PinIcon size={11} />
                          {location}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                      <button
                        onClick={() => {
                          setActiveAppointment(apt);
                          setShowDetails(true);
                        }}
                        className="btn-primary font-nunito font-bold px-4 py-1.5 text-xs focus-ring"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => openManage(apt)}
                        className="text-xs font-bold text-pebble-grey hover:text-muted-terracotta transition-colors font-nunito focus-ring rounded-full py-1"
                      >
                        Reschedule / Cancel
                      </button>
                      {!apt.recurring_series_id && (
                        <button
                          onClick={() => setRecurringTarget(apt)}
                          className="text-xs font-bold text-pebble-grey hover:text-deep-slate transition-colors font-nunito focus-ring rounded"
                        >
                          ↻ Make recurring
                        </button>
                      )}
                      {apt.recurring_series_id && (
                        <button
                          disabled={cancellingSeriesId === apt.recurring_series_id}
                          onClick={async () => {
                            if (!confirm("Cancel the recurring series? All future appointments will be cancelled.")) return;
                            setCancellingSeriesId(apt.recurring_series_id!);
                            const result = await ownerCancelRecurringSeries(apt.recurring_series_id!);
                            setCancellingSeriesId(null);
                            if ("cancelledAppointments" in result) {
                              setAppointments((prev) =>
                                prev.map((a) =>
                                  a.recurring_series_id === apt.recurring_series_id && new Date(a.scheduled_at) > new Date()
                                    ? { ...a, status: "cancelled" }
                                    : a
                                )
                              );
                            }
                          }}
                          className="text-xs font-bold text-pebble-grey hover:text-muted-terracotta transition-colors font-nunito focus-ring rounded disabled:opacity-50"
                        >
                          {cancellingSeriesId === apt.recurring_series_id ? "Cancelling…" : "↻ Cancel recurring"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between border-b-2 border-pebble-grey/20 pb-3 mb-6">
          <h2 className="font-fredoka text-2xl md:text-3xl text-deep-slate">
            Previous Grooms
          </h2>
          {past.length > 5 && (
            <button
              onClick={() => setShowAllPast((s) => !s)}
              className="text-sm font-bold text-pebble-grey hover:text-deep-slate transition-colors font-nunito focus-ring rounded"
            >
              {showAllPast ? "Show less" : `View all ${past.length}`}
            </button>
          )}
        </div>

        {past.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-pebble-grey/20 text-center">
            <p className="font-nunito text-pebble-grey">No past appointments found.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {(showAllPast ? past : past.slice(0, 5)).map((apt) => {
              const date = new Date(apt.scheduled_at);
              const dateString = date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const priceDisplay = apt.service_snapshot_price
                ? `£${(apt.service_snapshot_price / 100).toFixed(2)}`
                : null;
              const groomerName = apt.groomer_profiles?.business_name || "Groomer";
              const groomerImg = apt.groomer_profiles?.profile_image_url ?? null;

              // A past "confirmed" appointment should show as completed
              const pastStatus =
                apt.status === "cancelled" ? "Cancelled" :
                apt.status === "no_show" ? "No-show" :
                "Completed";
              const statusColour =
                pastStatus === "Cancelled" ? "bg-muted-terracotta/15 text-muted-terracotta" :
                pastStatus === "No-show" ? "bg-pebble-grey/15 text-pebble-grey" :
                "bg-sage-leaf/15 text-sage-leaf";

              return (
                <div
                  key={apt.id}
                  className="bg-white rounded-xl p-3.5 flex items-center gap-3 border border-pebble-grey/20"
                >
                  {/* Groomer avatar */}
                  <Link href={`/groomers/${apt.groomer_profile_id}`} className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-alabaster-cream focus-ring">
                    <Image
                      src={groomerImg || "/assets/default-profile-photo.svg"}
                      alt={groomerName}
                      width={40}
                      height={40}
                      className={groomerImg ? "object-cover w-full h-full" : "object-contain w-full h-full p-1.5"}
                    />
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-nunito font-bold text-sm text-deep-slate truncate flex-1">
                        {apt.service_snapshot_name || "Service"}
                        <span className="font-normal text-pebble-grey"> for {apt.dogs?.name}</span>
                      </p>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${statusColour}`}>
                        {pastStatus}
                      </span>
                    </div>
                    <p className="text-xs text-pebble-grey font-nunito mt-0.5">
                      {dateString}
                      {groomerName && <span> · <Link href={`/groomers/${apt.groomer_profile_id}`} className="hover:text-sage-leaf transition-colors">{groomerName}</Link></span>}
                      {priceDisplay && <span> · {priceDisplay}</span>}
                    </p>
                    {pastStatus === "Completed" && !apt.reviews?.length && (
                      <button
                        onClick={() => openReview(apt)}
                        className="mt-1.5 flex items-center gap-1 text-xs font-bold text-pebble-grey hover:text-deep-slate transition-colors font-nunito focus-ring rounded"
                      >
                        <StarIcon size={11} className="text-groomr-gold" />
                        Leave a review
                      </button>
                    )}
                    {pastStatus === "Completed" && !!apt.reviews?.length && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-sage-leaf font-nunito">
                        <StarIcon size={11} className="text-groomr-gold" />
                        Reviewed
                      </p>
                    )}
                    {pastStatus === "Completed" && apt.groomer_profiles?.stripe_charges_enabled && (
                      tipped.has(apt.id) ? (
                        <p className="mt-1.5 text-xs font-bold text-sage-leaf font-nunito">
                          Tip sent ✓
                        </p>
                      ) : (
                        <button
                          onClick={() => setTipTarget(apt)}
                          className="mt-1.5 text-xs font-bold text-pebble-grey hover:text-groomr-gold transition-colors font-nunito focus-ring rounded"
                        >
                          Leave a tip
                        </button>
                      )
                    )}
                    {pastStatus === "Completed" && !apt.recurring_series_id && (
                      <button
                        onClick={() => setRecurringTarget(apt)}
                        className="mt-1.5 flex items-center gap-1 text-xs font-bold text-pebble-grey hover:text-deep-slate transition-colors font-nunito focus-ring rounded"
                      >
                        ↻ Make recurring
                      </button>
                    )}
                    {pastStatus === "Completed" && !!apt.recurring_series_id && (
                      <button
                        disabled={cancellingSeriesId === apt.recurring_series_id}
                        onClick={async () => {
                          if (!confirm("Cancel the recurring series? All future appointments will be cancelled.")) return;
                          setCancellingSeriesId(apt.recurring_series_id!);
                          const result = await ownerCancelRecurringSeries(apt.recurring_series_id!);
                          setCancellingSeriesId(null);
                          if ("cancelledAppointments" in result) {
                            setAppointments((prev) =>
                              prev.map((a) =>
                                a.recurring_series_id === apt.recurring_series_id && new Date(a.scheduled_at) > new Date()
                                  ? { ...a, status: "cancelled" }
                                  : a
                              )
                            );
                          }
                        }}
                        className="mt-1.5 flex items-center gap-1 text-xs font-bold text-pebble-grey hover:text-muted-terracotta transition-colors font-nunito focus-ring rounded disabled:opacity-50"
                      >
                        {cancellingSeriesId === apt.recurring_series_id ? "Cancelling…" : "↻ Cancel recurring"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Appointment Details Modal */}
      <Modal open={showDetails} onClose={() => setShowDetails(false)}>
        {activeAppointment && (
          <>
            <h2 className="font-fredoka text-3xl text-deep-slate mb-6">
              Appointment Details
            </h2>
            <div className="bg-white rounded-xl p-5 border border-pebble-grey/20 mb-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
                    Base Service
                  </p>
                  <p className="font-bold text-deep-slate mt-1">
                    {activeAppointment.service_snapshot_name}
                  </p>
                  <p className="text-sm text-pebble-grey font-nunito">
                    For {activeAppointment.dogs?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
                    Base Price
                  </p>
                  <p className="font-fredoka text-xl text-deep-slate mt-1">
                    {activeAppointment.service_snapshot_price
                      ? `£${(activeAppointment.service_snapshot_price / 100).toFixed(2)}`
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="border-t border-pebble-grey/20 pt-3 grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
                    When
                  </p>
                  <p className="text-sm font-nunito text-deep-slate mt-1">
                    {new Date(activeAppointment.scheduled_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
                    Where
                  </p>
                  <Link
                    href={`/groomers/${activeAppointment.groomer_profile_id}`}
                    className="text-sm font-nunito text-deep-slate hover:text-sage-leaf transition-colors focus-ring rounded mt-1 block"
                  >
                    {activeAppointment.groomer_profiles?.business_name}
                  </Link>
                </div>
              </div>
              {(activeAppointment.owner_notes || activeAppointment.groomer_notes) && (
                <div className="border-t border-pebble-grey/20 pt-3 space-y-2">
                  {activeAppointment.owner_notes && (
                    <div>
                      <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">Your note <span className="normal-case font-normal text-pebble-grey/60">via Groomr</span></p>
                      <p className="text-sm font-nunito text-deep-slate mt-1 italic">&quot;{activeAppointment.owner_notes}&quot;</p>
                    </div>
                  )}
                  {activeAppointment.groomer_notes && (
                    <div>
                      <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">Note from groomer</p>
                      <p className="text-sm font-nunito text-deep-slate mt-1 italic">&quot;{activeAppointment.groomer_notes}&quot;</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="btn-primary font-nunito font-bold px-8 py-3 w-full focus-ring"
            >
              Close
            </button>
          </>
        )}
      </Modal>

      {/* Manage Appointment Modal */}
      <Modal open={showManage} onClose={closeManage} size="md">
        {activeAppointment && (
          <ManageModal
            appointment={activeAppointment}
            view={manageView}
            onViewChange={setManageView}
            onCancel={handleCancel}
            onRescheduled={handleRescheduled}
            onClose={closeManage}
          />
        )}
      </Modal>

      {/* Leave Review Modal */}
      <Modal open={showReview} onClose={() => setShowReview(false)} size="md">
        {reviewTarget && (
          <LeaveReviewModal
            appointment={reviewTarget}
            onSubmitted={handleReviewSubmitted}
            onClose={() => setShowReview(false)}
          />
        )}
      </Modal>

      {/* Recurring request modal */}
      {recurringTarget && (
        <RecurringRequestModal
          appointment={recurringTarget}
          onClose={() => setRecurringTarget(null)}
          onSubmitted={() => setRecurringTarget(null)}
        />
      )}

      {/* Tip modal */}
      {tipTarget && (
        <TipModal
          appointment={tipTarget}
          onClose={() => setTipTarget(null)}
          onTipSent={(appointmentId) => {
            setTipped((prev) => new Set([...prev, appointmentId]));
            setTipTarget(null);
          }}
        />
      )}
    </>
  );
}

// ─── ManageModal ──────────────────────────────────────────────────────────────

interface ManageModalProps {
  appointment: Appointment;
  view: ManageView;
  onViewChange: (v: ManageView) => void;
  onCancel: () => Promise<void>;
  onRescheduled: (newAt: string) => void;
  onClose: () => void;
}

function ManageModal({
  appointment,
  view,
  onViewChange,
  onCancel,
  onRescheduled,
  onClose,
}: ManageModalProps) {
  const currentDate = new Date(appointment.scheduled_at);
  const formattedCurrent = currentDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }) + " at " + currentDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (view === "done") {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-14 h-14 bg-groomr-gold rounded-full flex items-center justify-center mx-auto text-2xl">
          ✓
        </div>
        <p className="font-fredoka text-2xl text-deep-slate">Done!</p>
        <button onClick={onClose} className="btn-primary font-nunito font-bold px-8 py-3 rounded-full focus-ring">
          Close
        </button>
      </div>
    );
  }

  if (view === "reschedule") {
    return (
      <ReschedulePanel
        appointment={appointment}
        onRescheduled={onRescheduled}
        onBack={() => onViewChange("choice")}
      />
    );
  }

  if (view === "cancel") {
    return (
      <CancelPanel
        appointment={appointment}
        formattedCurrent={formattedCurrent}
        onConfirm={onCancel}
        onBack={() => onViewChange("choice")}
      />
    );
  }

  // choice view
  return (
    <>
      <h2 className="font-fredoka text-2xl text-deep-slate mb-1">Manage Appointment</h2>
      <p className="font-bold text-deep-slate font-nunito">
        {appointment.service_snapshot_name} for {appointment.dogs?.name}
      </p>
      <p className="text-sm text-pebble-grey font-nunito mb-8">{formattedCurrent}</p>

      <div className="space-y-3">
        <button
          onClick={() => onViewChange("reschedule")}
          className="w-full bg-white border-2 border-deep-slate text-deep-slate hover:bg-deep-slate hover:text-white transition-colors font-nunito font-bold px-8 py-3.5 rounded-full focus-ring text-sm"
        >
          Pick a new date &amp; time
        </button>
        <button
          onClick={() => onViewChange("cancel")}
          className="w-full bg-white border-2 border-muted-terracotta text-muted-terracotta hover:bg-muted-terracotta hover:text-white transition-colors font-nunito font-bold px-8 py-3.5 rounded-full focus-ring text-sm"
        >
          Cancel appointment
        </button>
      </div>
    </>
  );
}

// ─── ReschedulePanel ──────────────────────────────────────────────────────────

function ReschedulePanel({
  appointment,
  onRescheduled,
  onBack,
}: {
  appointment: Appointment;
  onRescheduled: (newAt: string) => void;
  onBack: () => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 1);

  const [availDays, setAvailDays] = useState<Set<number>>(new Set());
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTimeLabel, setSelectedTimeLabel] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGroomerAvailabilityDays(appointment.groomer_profile_id).then((days) =>
      setAvailDays(new Set(days)),
    );
  }, [appointment.groomer_profile_id]);

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

  function isDateSelectable(date: Date): boolean {
    if (date < minDate) return false;
    // JS getDay(): 0=Sun,1=Mon...6=Sat → convert to Supabase day_of_week (0=Sun)
    return availDays.has(date.getDay());
  }

  function buildCalendarDays(monthStart: Date): (Date | null)[] {
    const y = monthStart.getFullYear();
    const mo = monthStart.getMonth();
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const rawDow = new Date(y, mo, 1).getDay();
    const offset = (rawDow + 6) % 7; // Mon-first
    const cells: (Date | null)[] = Array(offset).fill(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(y, mo, day));
    return cells;
  }

  const calendarDays = buildCalendarDays(calendarMonth);
  const canPrevMonth = calendarMonth > new Date(today.getFullYear(), today.getMonth(), 1);

  const handleDateSelect = useCallback(
    async (dateStr: string) => {
      setSelectedDate(dateStr);
      setSelectedTime(null);
      setSelectedTimeLabel(null);
      setSlots([]);
      setLoadingSlots(true);
      const result = await getAvailableSlots(
        appointment.groomer_profile_id,
        appointment.service_id,
        dateStr,
      );
      setSlots(result);
      setLoadingSlots(false);
    },
    [appointment.groomer_profile_id, appointment.service_id],
  );

  async function handleConfirm() {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    setError(null);
    const newAt = `${selectedDate}T${selectedTime}:00.000Z`;
    const result = await rescheduleAppointment(appointment.id, newAt);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong");
    } else {
      onRescheduled(newAt);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <button
          onClick={onBack}
          className="text-sm font-bold text-pebble-grey hover:text-deep-slate transition-colors font-nunito focus-ring rounded-full px-2 py-1 mb-3"
        >
          ← Back
        </button>
        <h2 className="font-fredoka text-2xl text-deep-slate">Pick a new time</h2>
        <p className="text-sm text-pebble-grey font-nunito mt-0.5">
          {appointment.service_snapshot_name} · {appointment.dogs?.name}
        </p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() =>
            setCalendarMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))
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
          {calendarMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() =>
            setCalendarMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))
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
      <div>
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map((d) => (
            <p key={d} className="text-center text-xs font-bold text-pebble-grey py-1">
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
                <div key={i} className="h-10 bg-pebble-grey/15 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-pebble-grey text-sm font-nunito">
              No available slots — try another date.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => {
                    setSelectedTime(slot.time);
                    setSelectedTimeLabel(slot.label);
                  }}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition-all focus-ring ${
                    selectedTime === slot.time
                      ? "bg-deep-slate text-white border-deep-slate"
                      : "bg-white border-pebble-grey/20 text-deep-slate hover:border-deep-slate hover:shadow-sm"
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm font-bold text-muted-terracotta">{error}</p>
      )}

      {selectedDate && selectedTime && (
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full btn-primary font-nunito font-bold py-3 rounded-full focus-ring disabled:opacity-60"
        >
          {submitting
            ? "Saving…"
            : `Confirm — ${formatDateLong(selectedDate)} at ${selectedTimeLabel}`}
        </button>
      )}
    </div>
  );
}

// ─── LeaveReviewModal ─────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const labels = ["Terrible", "Poor", "OK", "Good", "Excellent"];
  const active = hovered || value;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${n} star${n !== 1 ? "s" : ""}`}
            className="focus-ring rounded transition-transform hover:scale-110 active:scale-95"
          >
            <StarIcon
              size={36}
              className={n <= active ? "text-groomr-gold" : "text-pebble-grey/20"}
            />
          </button>
        ))}
      </div>
      {active > 0 && (
        <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
          {labels[active - 1]}
        </p>
      )}
    </div>
  );
}

function LeaveReviewModal({
  appointment,
  onSubmitted,
  onClose,
}: {
  appointment: Appointment;
  onSubmitted: (appointmentId: string) => void;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const groomerName = appointment.groomer_profiles?.business_name || "your groomer";
  const dateString = new Date(appointment.scheduled_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleSubmit() {
    if (rating === 0) return;
    setSubmitting(true);
    setError(null);
    const result = await submitOwnerReview(appointment.id, rating, body);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong");
      return;
    }
    setDone(true);
    setTimeout(() => onSubmitted(appointment.id), 1200);
  }

  if (done) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-14 h-14 bg-groomr-gold rounded-full flex items-center justify-center mx-auto">
          <StarIcon size={28} className="text-deep-slate" />
        </div>
        <p className="font-fredoka text-2xl text-deep-slate">Thanks for your review!</p>
        <p className="text-sm text-pebble-grey font-nunito">
          Your feedback helps other owners find great groomers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-fredoka text-2xl text-deep-slate">Leave a review</h2>
        <p className="text-sm text-pebble-grey font-nunito mt-0.5">
          {appointment.service_snapshot_name || "Grooming"} with {groomerName} · {dateString}
        </p>
      </div>

      <StarPicker value={rating} onChange={setRating} />

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
          Comments <span className="normal-case font-normal">(optional)</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="field w-full resize-none text-sm"
          placeholder="What did you love? Any feedback for the groomer?"
        />
      </div>

      {error && (
        <p className="text-sm font-bold text-muted-terracotta">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 btn-secondary font-nunito font-bold py-3 rounded-full focus-ring"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="flex-1 btn-primary font-nunito font-bold py-3 rounded-full focus-ring disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </div>
    </div>
  );
}

// ─── CancelPanel ──────────────────────────────────────────────────────────────

function CancelPanel({
  appointment,
  formattedCurrent,
  onConfirm,
  onBack,
}: {
  appointment: Appointment;
  formattedCurrent: string;
  onConfirm: () => Promise<void>;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    await onConfirm();
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <button
          onClick={onBack}
          className="text-sm font-bold text-pebble-grey hover:text-deep-slate transition-colors font-nunito focus-ring rounded-full px-2 py-1 mb-3"
        >
          ← Back
        </button>
        <h2 className="font-fredoka text-2xl text-muted-terracotta">Cancel appointment</h2>
        <p className="font-bold text-deep-slate font-nunito mt-1">
          {appointment.service_snapshot_name} for {appointment.dogs?.name}
        </p>
        <p className="text-sm text-pebble-grey font-nunito">{formattedCurrent}</p>
      </div>

      <div className="bg-muted-terracotta/10 border border-muted-terracotta/20 rounded-xl p-4">
        <p className="text-sm font-nunito text-deep-slate">
          This will cancel your appointment. The groomer will be notified. Late cancellations may incur a fee depending on their policy.
        </p>
      </div>

      <button
        onClick={handleClick}
        disabled={busy}
        className="w-full bg-white border-2 border-muted-terracotta text-muted-terracotta hover:bg-muted-terracotta hover:text-white transition-colors font-nunito font-bold px-8 py-3.5 rounded-full focus-ring disabled:opacity-60"
      >
        {busy ? "Cancelling…" : "Yes, cancel this appointment"}
      </button>
    </div>
  );
}
