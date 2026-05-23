"use client";

import { useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MessageIcon, ChevronRightIcon, ChevronLeftIcon } from "@/components/ui/GroomrIcons";
import type { ActiveGroom } from "./LiveGroomTracker";
import type { Appointment } from "@/app/actions/appointments";
import { BookingDetailModal } from "./BookingDetailModal";

function StatusDot({ status }: { status: string }) {
  const tone: Record<string, [string, string]> = {
    confirmed:    ["#88a096","Confirmed"],
    "in-progress":["#eae45c","In progress"],
    pending:      ["#c87964","Pending"],
    completed:    ["#2c3e50","Completed"],
    cancelled:    ["#e74c3c","Cancelled"],
    no_show:      ["#95a5a6","No Show"],
  };
  const [color, label] = tone[status] ?? ["#95a5a6", status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-deep-slate">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

// Manual bookings store names in groomer_notes as "Client: X — Dog: Y[— extra]"
function parseManualNotes(groomerNotes: string | null) {
  if (!groomerNotes) return { dogName: null, clientName: null, extraNote: null };
  const clientMatch = groomerNotes.match(/Client:\s*([^—]+)/);
  const dogMatch    = groomerNotes.match(/Dog:\s*([^—]+)/);
  const extraMatch  = groomerNotes.match(/Dog:[^—]+—\s*(.+)/);
  return {
    clientName: clientMatch?.[1]?.trim() ?? null,
    dogName:    dogMatch?.[1]?.trim()    ?? null,
    extraNote:  extraMatch?.[1]?.trim()  ?? null,
  };
}

function SubPill({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors focus-ring ${active ? "bg-deep-slate text-alabaster-cream" : "text-deep-slate hover:bg-pebble-grey/10"}`}>
      {children}
    </button>
  );
}

const DAY_ROW_H = 80; // px per hour in the day timeline

function fmtHour(h: number) {
  if (h === 0 || h === 24) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function TodayView({ appointments, refDate, availability, onBeginGroom, activeGroomId }: {
  appointments: any[];
  refDate: Date;
  availability: import("@/types/groomer-dashboard").AvailabilityRow[];
  onBeginGroom?: (g: ActiveGroom) => void;
  activeGroomId?: string | null;
}) {
  const now = new Date();
  const isToday = refDate.toDateString() === now.toDateString();
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);

  // Determine open/close from availability, fallback to 8–18
  const dayAvail = availability.find(a => a.isActive && a.dayOfWeek === refDate.getDay());
  const openHour  = dayAvail ? parseInt(dayAvail.startTime.split(":")[0]) : 8;
  const closeHour = dayAvail ? parseInt(dayAvail.endTime.split(":")[0])   : 18;
  const hours = Array.from({ length: closeHour - openHour + 1 }, (_, i) => openHour + i);

  const todayAppts = appointments.filter(a => {
    const d = new Date(a.scheduled_at);
    return d.getDate() === refDate.getDate() && d.getMonth() === refDate.getMonth() && d.getFullYear() === refDate.getFullYear();
  });

  const todayBookings = todayAppts.map(a => {
    const d = new Date(a.scheduled_at);
    const isManual = !a.dog_id;
    const manual   = isManual ? parseManualNotes(a.groomer_notes) : null;
    return {
      id: a.id,
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      startMinutes: d.getHours() * 60 + d.getMinutes(),
      duration: a.service_snapshot_duration || 60,
      dog:   a.dogs?.name   ?? manual?.dogName    ?? "Dog",
      breed: a.dogs?.breed  ?? "Mixed",
      owner: isManual ? (manual?.clientName ?? "Client") : (a.profiles?.full_name ?? "Owner"),
      svc: a.service_snapshot_name || "Service",
      price: a.service_snapshot_price ? (a.service_snapshot_price / 100).toFixed(0) : "0",
      status: a.status,
      note: a.owner_notes || (isManual ? manual?.extraNote : a.groomer_notes) || null,
    };
  });

  const totalHours = todayBookings.reduce((sum, b) => sum + b.duration, 0) / 60;
  const dateStr = refDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  // Current time position
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openHour * 60;
  const closeMinutes = closeHour * 60;
  const nowTop = ((nowMinutes - openMinutes) / 60) * DAY_ROW_H;
  const showNow = isToday && nowMinutes >= openMinutes && nowMinutes <= closeMinutes;

  const tones = ["sage", "gold", "terra"] as const;

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6">
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <Eyebrow>{dateStr}</Eyebrow>
            <h2 className="font-fredoka text-2xl text-deep-slate mt-1">
              {todayBookings.length === 0 ? "No bookings" : `${todayBookings.length} dog${todayBookings.length === 1 ? "" : "s"} on the books`}
            </h2>
          </div>
          {totalHours > 0 && <span className="text-xs text-pebble-grey font-bold">{totalHours.toFixed(1)} hrs</span>}
        </div>

        {/* Timeline */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
          <div className="overflow-y-auto" style={{ maxHeight: "70vh" }}>
            <div className="relative" style={{ height: (closeHour - openHour) * DAY_ROW_H }}>

              {/* Hour rows */}
              {hours.map((h, i) => (
                <div key={h} className="absolute left-0 right-0 flex" style={{ top: i * DAY_ROW_H, height: DAY_ROW_H }}>
                  <div className="w-16 shrink-0 flex items-start justify-end pr-3 pt-1">
                    <span className="text-xs font-bold text-pebble-grey/70">{fmtHour(h)}</span>
                  </div>
                  <div className="flex-1 border-t border-pebble-grey/12">
                    {/* 30-min dashed line */}
                    <div className="border-t border-dashed border-pebble-grey/[0.07] mt-[50%]" style={{ marginTop: DAY_ROW_H / 2 - 1 }} />
                  </div>
                </div>
              ))}

              {/* Closed / out-of-hours shading — none needed, timeline IS the hours */}

              {/* Current time indicator */}
              {showNow && (
                <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none" style={{ top: nowTop }}>
                  <div className="w-16 shrink-0 flex justify-end pr-2">
                    <span className="text-[9px] font-bold text-muted-terracotta">
                      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-muted-terracotta shrink-0 -ml-1" />
                  <div className="flex-1 border-t-2 border-muted-terracotta" />
                </div>
              )}

              {/* Appointment blocks */}
              <div className="absolute" style={{ left: 64, right: 8, top: 0, bottom: 0 }}>
                {todayBookings.map((b, i) => {
                  const top = ((b.startMinutes - openMinutes) / 60) * DAY_ROW_H + 2;
                  const height = Math.max(36, (b.duration / 60) * DAY_ROW_H - 4);
                  const tone = tones[i % 3];
                  const c = COLOR_MAP[tone];
                  const tall = height >= 60;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedAppt(todayAppts.find(a => a.id === b.id) ?? null)}
                      className="absolute left-0 right-0 rounded-xl px-3 py-2 overflow-hidden cursor-pointer hover:-translate-y-px transition-transform"
                      style={{ top, height, background: c.bg, borderLeft: `3px solid ${c.bd}` }}
                    >
                      <div className="flex items-start justify-between gap-2 h-full">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-deep-slate/50">{b.time}</span>
                            <span className="font-fredoka text-base text-deep-slate leading-tight truncate">{b.dog}</span>
                            <StatusDot status={b.status} />
                          </div>
                          {tall && (
                            <>
                              <p className="text-xs text-deep-slate/70 font-bold truncate">{b.svc}</p>
                              <p className="text-xs text-pebble-grey font-bold truncate">{b.owner} · {b.duration} min</p>
                            </>
                          )}
                          {b.note && tall && <p className="text-[10px] text-sage-leaf font-bold italic truncate mt-0.5">&quot;{b.note}&quot;</p>}
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <span className="font-fredoka text-sm text-deep-slate">£{b.price}</span>
                          {b.status === "confirmed" && activeGroomId !== b.id && onBeginGroom && tall && (
                            <button
                              onClick={() => onBeginGroom({
                                appointmentId: b.id,
                                dogName: b.dog,
                                serviceName: b.svc,
                                ownerName: b.owner,
                                startedAt: Date.now(),
                                durationMinutes: b.duration,
                                extensionMinutes: 0,
                              })}
                              className="text-[10px] font-bold bg-groomr-gold text-deep-slate px-2.5 py-1 rounded-full hover:bg-groomr-gold/80 transition-colors focus-ring whitespace-nowrap"
                            >
                              Begin
                            </button>
                          )}
                          {activeGroomId === b.id && (
                            <span className="text-[10px] font-bold text-groomr-gold bg-deep-slate px-2.5 py-1 rounded-full animate-pulse whitespace-nowrap">
                              Live
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="bg-deep-slate text-alabaster-cream rounded-[20px] p-6">
          <Eyebrow className="text-groomr-gold">Live status</Eyebrow>
          {(() => {
            const active = activeGroomId ? todayBookings.find(b => b.id === activeGroomId) : null;
            const next = !active ? todayBookings.find(b => b.status === "confirmed") : null;

            if (active) return (
              <>
                <p className="font-fredoka text-2xl mt-1 text-alabaster-cream">{active.dog} · {active.svc}</p>
                <p className="text-xs text-groomr-gold font-bold uppercase tracking-wider mt-2 animate-pulse">In progress — see tracker ↘</p>
              </>
            );
            if (next) return (
              <>
                <p className="font-fredoka text-2xl mt-1 text-alabaster-cream">{next.dog} · {next.svc}</p>
                <p className="text-sm text-alabaster-cream/70 font-bold mt-1">Scheduled {next.time}</p>
                <button
                  onClick={() => onBeginGroom?.({
                    appointmentId: next.id,
                    dogName: next.dog,
                    serviceName: next.svc,
                    ownerName: next.owner,
                    startedAt: Date.now(),
                    durationMinutes: next.duration,
                    extensionMinutes: 0,
                  })}
                  className="mt-4 bg-groomr-gold text-deep-slate font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring hover:bg-groomr-gold/90 transition-colors"
                >
                  Begin Groom
                </button>
              </>
            );
            return <p className="text-sm mt-3 text-alabaster-cream/60">No bookings today.</p>;
          })()}
        </div>

        {dayAvail ? (
          <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
            <Eyebrow>Hours today</Eyebrow>
            <p className="font-fredoka text-2xl text-deep-slate mt-2">{fmtHour(openHour)} – {fmtHour(closeHour)}</p>
            <p className="text-xs text-pebble-grey font-bold mt-1">{closeHour - openHour} hrs open</p>
          </div>
        ) : (
          <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
            <Eyebrow>Hours today</Eyebrow>
            <p className="text-sm text-pebble-grey font-bold mt-2">Closed — no availability set for this day.</p>
          </div>
        )}

        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
          <Eyebrow>Notes</Eyebrow>
          <ul className="space-y-2.5 text-sm text-deep-slate mt-3">
            {todayBookings.filter(b => b.note).length === 0
              ? <li className="text-pebble-grey font-bold">No notes for today.</li>
              : todayBookings.filter(b => b.note).map(b => (
                  <li key={b.id} className="flex gap-2"><span className="text-sage-leaf font-bold">•</span>{b.dog}: {b.note}</li>
                ))}
          </ul>
        </div>
      </aside>

      <BookingDetailModal
        appointment={selectedAppt}
        onClose={() => setSelectedAppt(null)}
        onUpdated={(id, patch) => setSelectedAppt((prev: any) => prev?.id === id ? { ...prev, ...patch } : prev)}
      />
    </div>
  );
}

const COLOR_MAP: Record<string, { bg: string; bd: string }> = {
  sage:  { bg: "rgba(136,160,150,0.18)", bd: "#88a096" },
  gold:  { bg: "rgba(234,228,92,0.30)",  bd: "#c8c14b" },
  terra: { bg: "rgba(200,121,100,0.18)", bd: "#c87964" },
};
const ROW_H = 60;

const CAL_HOURS = ["08","09","10","11","12","13","14","15","16","17","18"];

function WeekView({ appointments, refDate }: { appointments: any[]; refDate: Date }) {
  const now = new Date();
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);

  // Calculate start of week (Monday) from refDate
  const weekStart = new Date(refDate);
  weekStart.setDate(refDate.getDate() - (refDate.getDay() === 0 ? 6 : refDate.getDay() - 1));
  weekStart.setHours(0,0,0,0);

  const weekDays = Array.from({length: 7}).map((_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dayAppointments = appointments.filter(a => {
      const d = new Date(a.scheduled_at);
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear() && a.status !== 'cancelled';
    });
    
    return {
      dow: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      date: date.getDate().toString(),
      count: dayAppointments.length,
      hours: dayAppointments.reduce((sum, a) => sum + (a.service_snapshot_duration || 0), 0) / 60,
      today: date.getDate() === now.getDate() && date.getMonth() === now.getMonth(),
      off: dayAppointments.length === 0,
      appointments: dayAppointments
    };
  });

  const totalDogs = weekDays.reduce((sum, d) => sum + d.count, 0);
  const totalHours = weekDays.reduce((sum, d) => sum + d.hours, 0);

  return (
    <section>
      <div className="mb-4">
        <Eyebrow>Week of {weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Eyebrow>
        <h2 className="font-fredoka text-2xl text-deep-slate mt-1">{totalDogs} dogs booked · {totalHours.toFixed(1)} hrs</h2>
      </div>
      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
        <div className="overflow-x-auto">
        <div className="min-w-[600px]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-pebble-grey/15">
          <div className="p-3" />
          {weekDays.map((d, i) => (
            <div key={i} className={`p-3 text-center border-l border-pebble-grey/10 ${d.today ? "bg-groomr-gold/15" : ""}`}>
              <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey">{d.dow}</p>
              <p className="font-fredoka text-2xl text-deep-slate leading-none mt-1">{d.date}</p>
              <p className="text-xs text-pebble-grey font-bold mt-1">{d.off ? "Off" : `${d.count} dogs`}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
          <div>
            {CAL_HOURS.map(h => (
              <div key={h} className="text-xs text-pebble-grey font-bold text-right pr-3 border-t border-pebble-grey/10" style={{ height: ROW_H, paddingTop: 4 }}>
                {h}:00
              </div>
            ))}
          </div>
          {weekDays.map((d, dayIdx) => (
            <div key={dayIdx} className={`relative border-l border-pebble-grey/10 ${d.today ? "bg-groomr-gold/[0.04]" : ""} ${d.off ? "bg-pebble-grey/5" : ""}`}>
              {CAL_HOURS.map(h => <div key={h} className="border-t border-pebble-grey/10" style={{ height: ROW_H }} />)}
              {d.appointments.map((a, i) => {
                const date = new Date(a.scheduled_at);
                const startHour = date.getHours() + (date.getMinutes() / 60);
                if (startHour < 8 || startHour > 18) return null; // out of bounds
                const span = (a.service_snapshot_duration || 60) / 60;
                
                const top = (startHour - 8) * ROW_H + 2;
                const height = span * ROW_H - 4;
                const tones = ["sage", "gold", "terra"] as const;
                const tone = tones[i % 3];
                const c = COLOR_MAP[tone];
                return (
                  <button key={i}
                    onClick={() => setSelectedAppt(a)}
                    className="absolute left-1 right-1 rounded-lg p-2 text-left focus-ring hover:-translate-y-px transition-transform"
                    style={{ top, height, background: c.bg, borderLeft: `3px solid ${c.bd}` }}>
                    <p className="font-bold text-xs text-deep-slate leading-tight truncate">{a.dogs?.name ?? parseManualNotes(a.groomer_notes).dogName ?? "Dog"}</p>
                    <p className="text-[10px] text-deep-slate/70 font-bold truncate">{a.service_snapshot_name}</p>
                    {a.status === 'in-progress' && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-muted-terracotta rounded-full animate-pulse" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        </div>
        </div>
      </div>

      <BookingDetailModal
        appointment={selectedAppt}
        onClose={() => setSelectedAppt(null)}
        onUpdated={(id, patch) => setSelectedAppt((prev: any) => prev?.id === id ? { ...prev, ...patch } : prev)}
      />
    </section>
  );
}

function MonthView({ appointments, refDate, onDayClick }: { appointments: any[]; refDate: Date; onDayClick: (date: Date) => void }) {
  const now = new Date();
  const year = refDate.getFullYear();
  const month = refDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = lastDay.getDate();
  const calOffset = (firstDay.getDay() + 6) % 7; // Monday = 0

  const cells: { blank?: boolean; d?: number; count?: number; today?: boolean; hours?: number }[] = [];
  for (let i = 0; i < calOffset; i++) cells.push({ blank: true });

  let totalBookings = 0;
  let totalHours = 0;

  for (let d = 1; d <= days; d++) {
    const dayAppointments = appointments.filter(a => {
      const ad = new Date(a.scheduled_at);
      return ad.getDate() === d && ad.getMonth() === month && ad.getFullYear() === year && a.status !== 'cancelled';
    });
    const c = dayAppointments.length;
    const h = dayAppointments.reduce((sum, a) => sum + (a.service_snapshot_duration || 0), 0) / 60;

    totalBookings += c;
    totalHours += h;

    const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    cells.push({ d, count: c, today: isToday, hours: h });
  }
  while (cells.length % 7) cells.push({ blank: true });

  const monthName = refDate.toLocaleString('default', { month: 'long' });

  return (
    <section>
      <div className="mb-4">
        <Eyebrow>{monthName} {year}</Eyebrow>
        <h2 className="font-fredoka text-2xl text-deep-slate mt-1">{totalBookings} bookings · {totalHours.toFixed(1)} hrs</h2>
      </div>
      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
        <div className="grid grid-cols-7 border-b border-pebble-grey/15">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
            <div key={d} className="p-3 text-xs font-bold uppercase tracking-wider text-pebble-grey text-center border-l first:border-l-0 border-pebble-grey/10">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c, i) => (
            <div
              key={i}
              onClick={() => !c.blank && onDayClick(new Date(year, month, c.d!))}
              className={`min-h-[100px] border-l border-t border-pebble-grey/10 first:border-l-0 p-2 ${c.blank ? "bg-pebble-grey/5" : "cursor-pointer hover:bg-alabaster-cream transition-colors"} ${c.today ? "bg-groomr-gold/15 hover:bg-groomr-gold/25" : ""}`}
            >
              {!c.blank && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className={`font-fredoka text-lg ${c.today ? "text-deep-slate" : "text-deep-slate"}`}>{c.d}</span>
                    {(c.count ?? 0) > 0 && <span className="text-[10px] font-bold text-pebble-grey">{c.count}</span>}
                  </div>
                  {(c.count ?? 0) > 0 ? (
                    <div className="mt-auto">
                      <div className="flex flex-wrap gap-0.5 mb-1">
                        {Array.from({ length: Math.min(c.count!, 6) }).map((_, k) => {
                          const tone = ["#88a096","#eae45c","#c87964"][k % 3];
                          return <span key={k} className="w-2 h-2 rounded-full" style={{ background: tone }} />;
                        })}
                      </div>
                      <p className="text-[10px] font-bold text-pebble-grey">{c.hours!.toFixed(1)}h</p>
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-pebble-grey/60 mt-auto">No bookings</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function YearView({ appointments, refDate, onMonthClick }: { appointments: any[]; refDate: Date; onMonthClick: (date: Date) => void }) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();
  const year = refDate.getFullYear();
  
  const counts = Array(12).fill(0);
  const earnings = Array(12).fill(0);
  
  appointments.forEach(a => {
    if (a.status === 'cancelled') return;
    const d = new Date(a.scheduled_at);
    if (d.getFullYear() === year) {
      counts[d.getMonth()] += 1;
      earnings[d.getMonth()] += (a.service_snapshot_price || 0) / 100;
    }
  });

  const max = Math.max(...counts);
  const totalBookings = counts.reduce((a, b) => a + b, 0);
  const totalEarnings = earnings.reduce((a, b) => a + b, 0);

  return (
    <section>
      <div className="mb-4">
        <Eyebrow>{year}</Eyebrow>
        <h2 className="font-fredoka text-2xl text-deep-slate mt-1">{totalBookings} bookings · £{totalEarnings.toLocaleString()} earned</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {months.map((m, i) => {
          const pct = max ? counts[i] / max : 0;
          const empty = counts[i] === 0;
          const current = i === now.getMonth() && year === now.getFullYear();
          return (
            <div key={m} onClick={() => onMonthClick(new Date(year, i, 1))} className={`bg-white border rounded-[16px] p-5 transition-colors cursor-pointer hover:border-deep-slate ${current ? "border-groomr-gold border-2" : "border-pebble-grey/20"}`}>
              <div className="flex items-baseline justify-between">
                <p className="font-fredoka text-xl text-deep-slate">{m}</p>
                {current && <span className="text-[10px] font-bold uppercase tracking-wider text-deep-slate bg-groomr-gold rounded-full px-2 py-0.5">Current</span>}
              </div>
              {empty ? (
                <p className="text-xs text-pebble-grey font-bold mt-3">No data</p>
              ) : (
                <>
                  <p className="font-fredoka text-2xl text-deep-slate mt-2 leading-none">£{earnings[i].toLocaleString()}</p>
                  <p className="text-xs text-pebble-grey font-bold mt-1">{counts[i]} bookings</p>
                  <div className="h-1.5 bg-pebble-grey/15 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-sage-leaf rounded-full" style={{ width: `${pct * 100}%` }} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

type BookingSubView = "today" | "week" | "month" | "year";

function computeRefDate(view: BookingSubView, offset: number): Date {
  const now = new Date();
  if (view === "today") {
    const d = new Date(now); d.setDate(now.getDate() + offset); return d;
  }
  if (view === "week") {
    // anchor on this week's Monday, then shift by offset weeks
    const dow = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const d = new Date(now); d.setDate(now.getDate() - dow + offset * 7); return d;
  }
  if (view === "month") {
    return new Date(now.getFullYear(), now.getMonth() + offset, 1);
  }
  // year
  return new Date(now.getFullYear() + offset, 0, 1);
}

function navLabel(view: BookingSubView, refDate: Date): string {
  if (view === "today") return refDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
  if (view === "week") {
    const weekStart = new Date(refDate);
    weekStart.setDate(refDate.getDate() - (refDate.getDay() === 0 ? 6 : refDate.getDay() - 1));
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    return `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  if (view === "month") return refDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  return refDate.getFullYear().toString();
}

export function BookingsView({ appointments, availability = [], onBeginGroom, activeGroomId }: {
  appointments: any[];
  availability?: import("@/types/groomer-dashboard").AvailabilityRow[];
  onBeginGroom?: (g: ActiveGroom) => void;
  activeGroomId?: string | null;
}) {
  const [view, setView] = useState<BookingSubView>("today");
  const [offset, setOffset] = useState(0);

  function handleViewChange(v: BookingSubView) { setView(v); setOffset(0); }

  function handleMonthClick(date: Date) {
    const now = new Date();
    const monthDiff = (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth());
    setView("month");
    setOffset(monthDiff);
  }

  function handleDayClick(date: Date) {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const clickedMidnight = new Date(date);
    clickedMidnight.setHours(0, 0, 0, 0);
    const dayDiff = Math.round((clickedMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
    setView("today");
    setOffset(dayDiff);
  }

  const refDate = computeRefDate(view, offset);
  const label = navLabel(view, refDate);
  const isPresent = offset === 0;

  return (
    <section className="space-y-5">
      {/* View switcher + navigation */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-white border border-pebble-grey/20 rounded-full p-1.5">
          {(["today","week","month","year"] as BookingSubView[]).map(v => (
            <SubPill key={v} active={view === v} onClick={() => handleViewChange(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </SubPill>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {!isPresent && (
            <button
              onClick={() => setOffset(0)}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-groomr-gold text-deep-slate hover:bg-groomr-gold/80 transition-colors focus-ring"
            >
              Today
            </button>
          )}
          <span className="text-sm font-bold text-deep-slate hidden sm:block">{label}</span>
          <button onClick={() => setOffset(o => o - 1)} className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring" aria-label="Previous">
            <ChevronLeftIcon size={16} />
          </button>
          <button onClick={() => setOffset(o => o + 1)} className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring" aria-label="Next">
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>
      {view === "today" && <TodayView appointments={appointments} refDate={refDate} availability={availability} onBeginGroom={onBeginGroom} activeGroomId={activeGroomId} />}
      {view === "week"  && <WeekView  appointments={appointments} refDate={refDate} />}
      {view === "month" && <MonthView appointments={appointments} refDate={refDate} onDayClick={handleDayClick} />}
      {view === "year"  && <YearView  appointments={appointments} refDate={refDate} onMonthClick={handleMonthClick} />}
    </section>
  );
}
