"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TrashIcon } from "@/components/ui/GroomrIcons";
import { createTimeBlock, deleteTimeBlock } from "@/app/actions/time-blocks";
import type { TimeBlock } from "@/app/actions/time-blocks";

const REASON_PRESETS = ["Holiday", "Training", "Sick day", "Personal", "Maintenance"];

const TODAY = new Date().toISOString().slice(0, 10);

interface Props {
  open: boolean;
  onClose: () => void;
  existingBlocks: TimeBlock[];
  onBlockAdded: (block: TimeBlock) => void;
  onBlockDeleted: (blockId: string) => void;
}

export function BlockTimeModal({ open, onClose, existingBlocks, onBlockAdded, onBlockDeleted }: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleStartDateChange(val: string) {
    setStartDate(val);
    // Keep end date in sync if it's before the new start date
    if (endDate && endDate < val) setEndDate(val);
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    const result = await createTimeBlock({
      startDate,
      endDate: endDate || startDate,
      allDay,
      startTime,
      endTime,
      reason,
    });
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    if (result.block) {
      onBlockAdded(result.block);
      setStartDate("");
      setEndDate("");
      setAllDay(true);
      setStartTime("09:00");
      setEndTime("17:00");
      setReason("");
    }
  }

  async function handleDelete(blockId: string) {
    setDeletingId(blockId);
    const result = await deleteTimeBlock(blockId);
    setDeletingId(null);
    if (!result.error) onBlockDeleted(blockId);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  }

  function formatDateShort(dateStr: string) {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB", {
      day: "numeric", month: "short",
    });
  }

  function formatTime(t: string) {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const suffix = h >= 12 ? "pm" : "am";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")}${suffix}`;
  }

  function formatBlockRange(b: TimeBlock) {
    if (b.startDate === b.endDate) return formatDate(b.startDate);
    return `${formatDateShort(b.startDate)} – ${formatDate(b.endDate)}`;
  }

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="space-y-6">
        <div>
          <Eyebrow>Diary management</Eyebrow>
          <h2 className="font-fredoka text-2xl text-deep-slate mt-1">Block time</h2>
          <p className="text-sm text-pebble-grey font-bold mt-1">
            Blocked periods won't accept new bookings.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4 bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-pebble-grey block mb-1.5">From</label>
              <input
                type="date"
                min={TODAY}
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="field w-full"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-pebble-grey block mb-1.5">To</label>
              <input
                type="date"
                min={startDate || TODAY}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="field w-full"
              />
            </div>
          </div>

          {/* All day toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-deep-slate">All day</span>
            <button
              type="button"
              onClick={() => setAllDay((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors focus-ring ${allDay ? "bg-deep-slate" : "bg-pebble-grey/30"}`}
              aria-checked={allDay}
              role="switch"
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${allDay ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Time pickers — hidden when all-day */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-pebble-grey block mb-1.5">Start time</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="field w-full" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-pebble-grey block mb-1.5">End time</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="field w-full" />
              </div>
            </div>
          )}

          {/* Reason presets */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-pebble-grey block mb-1.5">Reason (optional)</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {REASON_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setReason(reason === p ? "" : p)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors focus-ring ${reason === p ? "bg-deep-slate text-alabaster-cream border-deep-slate" : "bg-white text-deep-slate border-pebble-grey/20 hover:border-deep-slate/40"}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or type your own…"
              value={REASON_PRESETS.includes(reason) ? "" : reason}
              onChange={(e) => setReason(e.target.value)}
              className="field w-full"
            />
          </div>

          {error && <p className="text-xs font-bold text-muted-terracotta">{error}</p>}

          <button
            onClick={handleSave}
            disabled={!startDate || saving}
            className="btn-primary w-full font-nunito font-bold py-2.5 rounded-full text-sm focus-ring disabled:opacity-50"
          >
            {saving ? "Saving…" : "Block this time"}
          </button>
        </div>

        {/* Upcoming blocks */}
        {existingBlocks.length > 0 && (
          <div>
            <Eyebrow className="mb-3">Upcoming blocks</Eyebrow>
            <div className="space-y-2">
              {existingBlocks.map((b) => (
                <div key={b.id} className="flex items-center justify-between bg-white border border-pebble-grey/20 rounded-2xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-deep-slate">{formatBlockRange(b)}</p>
                    <p className="text-xs text-pebble-grey font-bold mt-0.5">
                      {b.allDay ? "All day" : `${formatTime(b.startTime)} – ${formatTime(b.endTime)}`}
                      {b.reason && ` · ${b.reason}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    disabled={deletingId === b.id}
                    className="rounded-full p-2 text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors focus-ring disabled:opacity-40"
                    aria-label="Remove block"
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
