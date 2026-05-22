"use client";

import { useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MessageIcon, ChevronRightIcon, ChevronLeftIcon } from "@/components/ui/GroomrIcons";
import type { ActiveGroom } from "./LiveGroomTracker";
import type { Appointment } from "@/app/actions/appointments";

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

function TodayView({ appointments, refDate, onBeginGroom, activeGroomId }: {
  appointments: any[];
  refDate: Date;
  onBeginGroom?: (g: ActiveGroom) => void;
  activeGroomId?: string | null;
}) {
  const now = new Date();

  const todayBookings = appointments
    .filter(a => {
      const d = new Date(a.scheduled_at);
      return d.getDate() === refDate.getDate() && d.getMonth() === refDate.getMonth() && d.getFullYear() === refDate.getFullYear();
    })
    .map(a => {
      const d = new Date(a.scheduled_at);
      const isManual = !a.dog_id;
      const manual   = isManual ? parseManualNotes(a.groomer_notes) : null;
      return {
        id: a.id,
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6">
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <Eyebrow>{dateStr}</Eyebrow>
            <h2 className="font-fredoka text-2xl text-deep-slate mt-1">{todayBookings.length} dogs on the books</h2>
          </div>
          <span className="text-xs text-pebble-grey font-bold">{totalHours.toFixed(1)} hrs</span>
        </div>
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
          {todayBookings.length === 0 ? (
            <div className="p-8 text-center text-pebble-grey text-sm font-bold">No bookings today.</div>
          ) : todayBookings.map((b, i) => (
            <div key={b.id} className={`flex flex-col sm:grid sm:grid-cols-[88px_1fr_auto] gap-3 sm:gap-4 p-4 sm:p-5 ${i ? "border-t border-pebble-grey/10" : ""} ${b.status === "in-progress" ? "bg-groomr-gold/10" : ""}`}>
              <div>
                <p className="font-fredoka text-2xl text-deep-slate leading-none">{b.time}</p>
                <p className="text-xs text-pebble-grey font-bold mt-1">{b.duration} min</p>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-fredoka text-lg text-deep-slate">{b.dog}</h3>
                  <span className="text-xs text-pebble-grey font-bold">· {b.breed}</span>
                  <StatusDot status={b.status} />
                </div>
                <p className="text-sm text-deep-slate mt-1">
                  {b.svc} · <span className="text-pebble-grey">{b.owner}</span>
                </p>
                {b.note && <p className="text-xs text-sage-leaf font-bold italic mt-1">&quot;{b.note}&quot;</p>}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <p className="font-fredoka text-lg text-deep-slate">£{b.price}</p>
                {b.status === "confirmed" && activeGroomId !== b.id && onBeginGroom && (
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
                    className="text-xs font-bold bg-groomr-gold text-deep-slate px-3 py-1.5 rounded-full hover:bg-groomr-gold/80 transition-colors focus-ring whitespace-nowrap"
                  >
                    Begin Groom
                  </button>
                )}
                {activeGroomId === b.id && (
                  <span className="text-xs font-bold text-groomr-gold bg-deep-slate px-3 py-1.5 rounded-full animate-pulse whitespace-nowrap">
                    In progress
                  </span>
                )}
                <button className="rounded-full p-2 bg-alabaster-cream hover:bg-deep-slate hover:text-alabaster-cream transition-colors focus-ring border border-pebble-grey/20" aria-label="Message">
                  <MessageIcon size={16} />
                </button>
                <button className="rounded-full p-2 bg-alabaster-cream hover:bg-deep-slate hover:text-alabaster-cream transition-colors focus-ring border border-pebble-grey/20" aria-label="Open">
                  <ChevronRightIcon size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="space-y-6">
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
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
          <Eyebrow>Today&apos;s notes</Eyebrow>
          <ul className="space-y-2.5 text-sm text-deep-slate mt-3">
            {todayBookings.filter(b => b.note).length === 0 && <li className="text-pebble-grey">No notes for today.</li>}
            {todayBookings.filter(b => b.note).map(b => (
              <li key={b.id} className="flex gap-2"><span className="text-sage-leaf font-bold">•</span> {b.dog}: {b.note}</li>
            ))}
          </ul>
        </div>
      </aside>
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
                  <button key={i} className="absolute left-1 right-1 rounded-lg p-2 text-left focus-ring hover:-translate-y-px transition-transform"
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
    </section>
  );
}

function MonthView({ appointments, refDate }: { appointments: any[]; refDate: Date }) {
  const now = new Date();
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = lastDay.getDate();
  const offset = (firstDay.getDay() + 6) % 7; // Monday = 0
  
  const cells: { blank?: boolean; d?: number; count?: number; today?: boolean; hours?: number }[] = [];
  for (let i = 0; i < offset; i++) cells.push({ blank: true });
  
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
            <div key={i} className={`min-h-[100px] border-l border-t border-pebble-grey/10 first:border-l-0 p-2 ${c.blank ? "bg-pebble-grey/5" : ""} ${c.today ? "bg-groomr-gold/15" : ""}`}>
              {!c.blank && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-fredoka text-lg text-deep-slate">{c.d}</span>
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

function YearView({ appointments, refDate }: { appointments: any[]; refDate: Date }) {
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
            <div key={m} className={`bg-white border rounded-[16px] p-5 transition-colors ${current ? "border-groomr-gold border-2" : "border-pebble-grey/20"}`}>
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

export function BookingsView({ appointments, onBeginGroom, activeGroomId }: {
  appointments: any[];
  onBeginGroom?: (g: ActiveGroom) => void;
  activeGroomId?: string | null;
}) {
  const [view, setView] = useState<BookingSubView>("today");
  const [offset, setOffset] = useState(0);

  function handleViewChange(v: BookingSubView) { setView(v); setOffset(0); }

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
      {view === "today" && <TodayView appointments={appointments} refDate={refDate} onBeginGroom={onBeginGroom} activeGroomId={activeGroomId} />}
      {view === "week"  && <WeekView  appointments={appointments} refDate={refDate} />}
      {view === "month" && <MonthView appointments={appointments} refDate={refDate} />}
      {view === "year"  && <YearView  appointments={appointments} refDate={refDate} />}
    </section>
  );
}
