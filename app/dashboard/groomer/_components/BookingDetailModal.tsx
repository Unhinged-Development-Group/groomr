"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Badge } from "@/components/ui/Badge";
import { CalendarIcon, MessageIcon, TrashIcon, PencilIcon, CheckIcon, CloseIcon } from "@/components/ui/GroomrIcons";
import {
  groomerCancelAppointment,
  groomerRescheduleAppointment,
  groomerUpdateNotes,
} from "@/app/actions/groomer";
import { GroomerRecurringModal } from "./GroomerRecurringModal";
import { cancelRecurringSeries } from "@/app/actions/recurring";

interface BookingDetailAppointment {
  id: string;
  owner_id: string;
  scheduled_at: string;
  status: string;
  service_snapshot_name: string | null;
  service_snapshot_duration: number | null;
  service_snapshot_price: number | null;
  groomer_notes: string | null;
  owner_notes: string | null;
  admin_note_groomer: string | null;
  admin_note_groomer_author: string | null;
  dog_id: string | null;
  recurring_series_id?: string | null;
  dogs?: { name: string; breed?: string; coat_type?: string; profile_image_url?: string } | null;
  profiles?: { full_name?: string; first_name?: string; last_name?: string; email?: string; phone?: string } | null;
}

interface Props {
  appointment: BookingDetailAppointment | null;
  onClose: () => void;
  onUpdated: (id: string, patch: Partial<BookingDetailAppointment>) => void;
  siblingAppointments?: BookingDetailAppointment[];
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const STATUS_TONE: Record<string, "sage" | "gold" | "terra" | "grey"> = {
  confirmed: "sage",
  pending: "gold",
  completed: "grey",
  cancelled: "terra",
  no_show: "grey",
};

type Panel = "detail" | "reschedule" | "cancel";

export function BookingDetailModal({ appointment, onClose, onUpdated, siblingAppointments }: Props) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>("detail");
  const [showRecurring, setShowRecurring] = useState(false);
  const [cancellingRecurring, setCancellingRecurring] = useState(false);
  const [recurringCancelled, setRecurringCancelled] = useState(false);

  // Notes
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(appointment?.groomer_notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);

  // Reschedule
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Cancel
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!appointment) return null;

  const appt = appointment;
  const d = new Date(appt.scheduled_at);
  const ownerName = appt.profiles?.full_name
    || [appt.profiles?.first_name, appt.profiles?.last_name].filter(Boolean).join(" ")
    || "Owner";
  const dogName = appt.dogs?.name ?? "Dog";
  const price = ((appt.service_snapshot_price ?? 0) / 100).toFixed(2);
  const isCancelled = appt.status === "cancelled";

  async function handleSaveNotes() {
    setSavingNotes(true);
    const result = await groomerUpdateNotes(appt.id, notes);
    setSavingNotes(false);
    if (!result.error) {
      onUpdated(appt.id, { groomer_notes: notes || null });
      setEditingNotes(false);
      router.refresh();
    }
  }

  async function handleReschedule() {
    if (!newDate || !newTime) { setRescheduleError("Pick a date and time."); return; }
    setRescheduling(true);
    setRescheduleError(null);
    const iso = new Date(`${newDate}T${newTime}:00`).toISOString();
    const result = await groomerRescheduleAppointment(appt.id, iso);
    setRescheduling(false);
    if (result.error) { setRescheduleError(result.error); return; }
    onUpdated(appt.id, { scheduled_at: iso, status: "confirmed" });
    router.refresh();
    onClose();
  }

  async function handleCancel() {
    setCancelling(true);
    setCancelError(null);
    const result = await groomerCancelAppointment(appt.id, cancelReason.trim() || "Cancelled by groomer");
    setCancelling(false);
    if (result.error) { setCancelError(result.error); return; }
    onUpdated(appt.id, { status: "cancelled" });
    router.refresh();
    onClose();
  }

  return (
    <>
    <Modal open={!!appointment} onClose={onClose} size="md">
      {panel === "detail" && (
        <div className="space-y-5">
          {/* Dog / owner header */}
          {siblingAppointments && siblingAppointments.length > 0 ? (
            // Multi-pet header — show all dogs
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone={STATUS_TONE[appt.status] ?? "slate"}>{STATUS_LABEL[appt.status] ?? appt.status}</Badge>
                <span className="text-[9px] font-bold bg-deep-slate/10 text-deep-slate px-2 py-0.5 rounded-full">Multi-pet</span>
              </div>
              <div className="flex gap-3 flex-wrap">
                {[appt, ...siblingAppointments].map((s) => {
                  const name = s.dogs?.name ?? "Dog";
                  return (
                    <div key={s.id} className="flex items-center gap-2.5 bg-alabaster-cream border border-pebble-grey/15 rounded-2xl px-3 py-2.5">
                      {s.dogs?.profile_image_url ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                          <Image src={s.dogs.profile_image_url} alt={name} width={40} height={40} className="object-cover w-full h-full" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-sage-leaf/20 flex items-center justify-center font-fredoka text-deep-slate shrink-0">
                          {name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-fredoka text-base text-deep-slate leading-tight">{name}</p>
                        {s.dogs?.breed && <p className="text-xs text-pebble-grey">{s.dogs.breed}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-deep-slate font-bold">Owner: {ownerName}</p>
            </div>
          ) : (
            // Single-pet header
            <div className="flex items-start gap-4">
              {appt.dogs?.profile_image_url ? (
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                  <Image src={appt.dogs.profile_image_url} alt={dogName} width={64} height={64} className="object-cover w-full h-full" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-sage-leaf/20 flex items-center justify-center font-fredoka text-2xl text-deep-slate shrink-0">
                  {dogName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-fredoka text-3xl text-deep-slate">{dogName}</h2>
                  <Badge tone={STATUS_TONE[appt.status] ?? "slate"}>{STATUS_LABEL[appt.status] ?? appt.status}</Badge>
                </div>
                {appt.dogs?.breed && <p className="text-sm text-pebble-grey font-bold mt-0.5">{appt.dogs.breed}{appt.dogs.coat_type ? ` · ${appt.dogs.coat_type}` : ""}</p>}
                <p className="text-sm text-deep-slate font-bold mt-0.5">Owner: {ownerName}</p>
              </div>
            </div>
          )}

          {/* Appointment details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Date & time</p>
              <p className="font-fredoka text-lg text-deep-slate mt-1 leading-tight">
                {d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
              </p>
              <p className="text-sm font-bold text-deep-slate">{d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <div className="bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Service</p>
              <p className="font-fredoka text-lg text-deep-slate mt-1 leading-tight truncate">{appt.service_snapshot_name ?? "—"}</p>
              <p className="text-sm font-bold text-deep-slate">{appt.service_snapshot_duration ?? "—"} min · £{price}</p>
            </div>
          </div>

          {/* Owner contact */}
          {(appt.profiles?.email || appt.profiles?.phone) && (
            <div className="grid grid-cols-2 gap-3">
              {appt.profiles.phone && (
                <div className="bg-white border border-pebble-grey/15 rounded-2xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Phone</p>
                  <p className="text-sm font-bold text-deep-slate mt-1">
                    {appt.profiles.phone?.replace(/^\+44/, "0")}
                  </p>
                </div>
              )}
              {appt.profiles.email && (
                <div className="bg-white border border-pebble-grey/15 rounded-2xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Email</p>
                  <p className="text-sm font-bold text-deep-slate mt-1 truncate">{appt.profiles.email}</p>
                </div>
              )}
            </div>
          )}

          {/* Owner notes */}
          {appt.owner_notes && (
            <div className="bg-sage-leaf/10 border border-sage-leaf/20 rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sage-leaf">Note from owner</p>
              <p className="text-sm text-deep-slate mt-1 italic">&quot;{appt.owner_notes}&quot;</p>
            </div>
          )}

          {/* Groomr Support note */}
          {appt.admin_note_groomer && (
            <div className="bg-groomr-gold/10 border border-groomr-gold/30 rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-deep-slate/60">
                {appt.admin_note_groomer_author ?? "Groomr Support"} · Groomr Support
              </p>
              <p className="text-sm text-deep-slate mt-1 italic">&quot;{appt.admin_note_groomer}&quot;</p>
            </div>
          )}

          {siblingAppointments && siblingAppointments.length > 0 && (
            <div className="bg-white border border-pebble-grey/15 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-pebble-grey/10 flex items-center gap-2">
                <Eyebrow>Group booking</Eyebrow>
                <span className="text-[9px] font-bold bg-deep-slate/10 text-deep-slate px-2 py-0.5 rounded-full">Multi-pet</span>
              </div>
              <div className="divide-y divide-pebble-grey/10">
                {[appt, ...siblingAppointments].map((s, i) => (
                  <div key={s.id} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 items-center">
                    <div>
                      <p className="text-sm font-bold text-deep-slate">{s.dogs?.name ?? `Pet ${i + 1}`}</p>
                      <p className="text-xs text-pebble-grey">{s.service_snapshot_name ?? "Service"} · {s.service_snapshot_duration ?? 0} min</p>
                    </div>
                    <span className="font-fredoka text-deep-slate">
                      £{((s.service_snapshot_price ?? 0) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 items-center bg-alabaster-cream">
                  <span className="text-xs font-bold text-pebble-grey uppercase tracking-wider">Total</span>
                  <span className="font-fredoka text-deep-slate">
                    £{(([appt, ...siblingAppointments].reduce((sum, s) => sum + (s.service_snapshot_price ?? 0), 0)) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Groomer notes */}
          <div className="bg-white border border-pebble-grey/15 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eyebrow>Groomer notes</Eyebrow>
                <span className="text-[9px] font-bold text-pebble-grey/60 uppercase tracking-wider">Not visible to owners</span>
              </div>
              {!editingNotes && (
                <button onClick={() => { setNotes(appt.groomer_notes ?? ""); setEditingNotes(true); }}
                  className="rounded-full p-1.5 hover:bg-alabaster-cream focus-ring" aria-label="Edit notes">
                  <PencilIcon size={13} />
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add notes about this appointment or dog…"
                  className="field w-full resize-none text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveNotes} disabled={savingNotes}
                    className="btn-primary font-nunito font-bold px-4 py-2 rounded-full text-xs focus-ring disabled:opacity-50 flex items-center gap-1.5">
                    <CheckIcon size={12} />{savingNotes ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditingNotes(false)}
                    className="btn-secondary font-nunito font-bold px-4 py-2 rounded-full text-xs focus-ring flex items-center gap-1.5">
                    <CloseIcon size={12} />Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-deep-slate italic">
                {appt.groomer_notes ? `"${appt.groomer_notes}"` : <span className="text-pebble-grey not-italic">No notes yet.</span>}
              </p>
            )}
          </div>

          {/* Actions */}
          {!isCancelled && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => router.push(`/dashboard/groomer/messages?owner=${appt.owner_id}`)}
                className="btn-secondary font-nunito font-bold py-2.5 rounded-full text-sm focus-ring flex items-center justify-center gap-2"
              >
                <MessageIcon size={15} /> Message
              </button>
              <button onClick={() => setPanel("reschedule")}
                className="btn-secondary font-nunito font-bold py-2.5 rounded-full text-sm focus-ring flex items-center justify-center gap-2">
                <CalendarIcon size={15} /> Reschedule
              </button>
              {!appt.recurring_series_id && (
                <button
                  onClick={() => setShowRecurring(true)}
                  className="btn-secondary font-nunito font-bold py-2.5 rounded-full text-sm focus-ring flex items-center justify-center gap-2"
                >
                  ↻ Make recurring
                </button>
              )}
              {appt.recurring_series_id && !recurringCancelled && (
                <button
                  disabled={cancellingRecurring}
                  onClick={async () => {
                    if (!confirm("Cancel the recurring series? All future appointments will be cancelled.")) return;
                    setCancellingRecurring(true);
                    const result = await cancelRecurringSeries(appt.recurring_series_id!);
                    setCancellingRecurring(false);
                    if ("cancelledAppointments" in result) {
                      setRecurringCancelled(true);
                      router.refresh();
                    }
                  }}
                  className="btn-secondary font-nunito font-bold py-2.5 rounded-full text-sm focus-ring flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {cancellingRecurring ? "Cancelling…" : "↻ Cancel recurring"}
                </button>
              )}
              {appt.recurring_series_id && recurringCancelled && (
                <span className="font-nunito text-sm text-pebble-grey py-2.5 flex items-center justify-center">↻ Series cancelled</span>
              )}
              <button onClick={() => setPanel("cancel")}
                className="font-nunito font-bold py-2.5 rounded-full text-sm focus-ring text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors flex items-center justify-center gap-2">
                <TrashIcon size={15} /> Cancel booking
              </button>
            </div>
          )}
        </div>
      )}

      {panel === "reschedule" && (
        <div className="space-y-5">
          <div>
            <Eyebrow>Reschedule</Eyebrow>
            <h2 className="font-fredoka text-2xl text-deep-slate mt-1">{dogName} · {appt.service_snapshot_name}</h2>
            <p className="text-sm text-pebble-grey font-bold mt-1">
              Currently: {d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} at {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="space-y-4 bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-pebble-grey block mb-1.5">New date</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="field w-full" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-pebble-grey block mb-1.5">New time</label>
              <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="field w-full" />
            </div>
            {rescheduleError && <p className="text-xs font-bold text-muted-terracotta">{rescheduleError}</p>}
            <div className="flex gap-2">
              <button onClick={handleReschedule} disabled={rescheduling || !newDate || !newTime}
                className="btn-primary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring disabled:opacity-50">
                {rescheduling ? "Saving…" : "Confirm reschedule"}
              </button>
              <button onClick={() => setPanel("detail")}
                className="btn-secondary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring">
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {panel === "cancel" && (
        <div className="space-y-5">
          <div>
            <Eyebrow>Cancel booking</Eyebrow>
            <h2 className="font-fredoka text-2xl text-deep-slate mt-1">{dogName} · {appt.service_snapshot_name}</h2>
            <p className="text-sm text-pebble-grey font-bold mt-1">
              {d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} at {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="bg-muted-terracotta/10 border border-muted-terracotta/20 rounded-2xl p-4">
            <p className="text-sm font-bold text-deep-slate">This will cancel the booking and notify the owner.</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-pebble-grey block mb-1.5">Reason (optional)</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Illness, equipment issue, emergency…"
                className="field w-full resize-none text-sm"
              />
            </div>
            {cancelError && <p className="text-xs font-bold text-muted-terracotta">{cancelError}</p>}
            <div className="flex gap-2">
              <button onClick={handleCancel} disabled={cancelling}
                className="bg-muted-terracotta text-white font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring hover:bg-muted-terracotta/90 transition-colors disabled:opacity-50">
                {cancelling ? "Cancelling…" : "Yes, cancel booking"}
              </button>
              <button onClick={() => setPanel("detail")}
                className="btn-secondary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring">
                Keep booking
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>

    {showRecurring && appt && (
      <GroomerRecurringModal
        appointmentId={appt.id}
        dogName={dogName}
        serviceName={appt.service_snapshot_name}
        scheduledAt={appt.scheduled_at}
        onClose={() => setShowRecurring(false)}
        onCreated={() => { setShowRecurring(false); router.refresh(); }}
      />
    )}
    </>
  );
}
