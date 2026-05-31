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

interface BookingDetailAppointment {
  id: string;
  scheduled_at: string;
  status: string;
  service_snapshot_name: string | null;
  service_snapshot_duration: number | null;
  service_snapshot_price: number | null;
  groomer_notes: string | null;
  owner_notes: string | null;
  dog_id: string | null;
  recurring_series_id?: string | null;
  dogs?: { name: string; breed?: string; coat_type?: string; profile_image_url?: string } | null;
  profiles?: { full_name?: string; first_name?: string; last_name?: string; email?: string; phone?: string } | null;
}

interface Props {
  appointment: BookingDetailAppointment | null;
  onClose: () => void;
  onUpdated: (id: string, patch: Partial<BookingDetailAppointment>) => void;
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

export function BookingDetailModal({ appointment, onClose, onUpdated }: Props) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>("detail");
  const [showRecurring, setShowRecurring] = useState(false);

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
                  <p className="text-sm font-bold text-deep-slate mt-1">{appt.profiles.phone}</p>
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-sage-leaf">Owner note</p>
              <p className="text-sm text-deep-slate mt-1 italic">&quot;{appt.owner_notes}&quot;</p>
            </div>
          )}

          {/* Groomer notes */}
          <div className="bg-white border border-pebble-grey/15 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Eyebrow>Groomer notes</Eyebrow>
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
            <div className="flex flex-wrap gap-2 pt-1">
              <button className="btn-secondary font-nunito font-bold px-4 py-2.5 rounded-full text-sm focus-ring flex items-center gap-2 opacity-50 cursor-not-allowed" disabled>
                <MessageIcon size={15} /> Message
              </button>
              <button onClick={() => setPanel("reschedule")}
                className="btn-secondary font-nunito font-bold px-4 py-2.5 rounded-full text-sm focus-ring flex items-center gap-2">
                <CalendarIcon size={15} /> Reschedule
              </button>
              {!appt.recurring_series_id && (
                <button
                  onClick={() => setShowRecurring(true)}
                  className="btn-secondary font-nunito font-bold px-4 py-2.5 rounded-full text-sm focus-ring flex items-center gap-2"
                >
                  ↻ Make recurring
                </button>
              )}
              {appt.recurring_series_id && (
                <span className="font-nunito font-bold px-4 py-2.5 rounded-full text-sm text-sage-leaf bg-sage-leaf/10 flex items-center gap-1.5">
                  ↻ Recurring
                </span>
              )}
              <button onClick={() => setPanel("cancel")}
                className="font-nunito font-bold px-4 py-2.5 rounded-full text-sm focus-ring text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors flex items-center gap-2 ml-auto">
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
