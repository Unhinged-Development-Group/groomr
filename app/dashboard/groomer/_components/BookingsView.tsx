"use client";

import { useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MessageIcon, ChevronRightIcon, ChevronLeftIcon } from "@/components/ui/GroomrIcons";

const TODAY_BOOKINGS = [
  { id: 1, time: "08:30", duration: 45,  dog: "Murphy", breed: "Chihuahua",      owner: "Sarah K.",  svc: "Bath & Brush", price: 38, status: "confirmed",    note: "Anxious — slow intro.", groomer: "Lola" },
  { id: 2, time: "09:30", duration: 90,  dog: "Pippa",  breed: "Cockapoo",       owner: "Daniel R.", svc: "Full Groom",   price: 58, status: "in-progress",  note: "Regular — usual cut.",  groomer: "Lola" },
  { id: 3, time: "11:30", duration: 120, dog: "Otis",   breed: "Border Terrier", owner: "Imogen T.", svc: "Hand-Strip",   price: 80, status: "confirmed",    note: "Hand-strip, leave beard.", groomer: "Marcus" },
  { id: 4, time: "14:00", duration: 90,  dog: "Roxy",   breed: "Staffy",         owner: "Ben H.",    svc: "Full Groom",   price: 58, status: "confirmed",    note: "Sensitive paws.",       groomer: "Lola" },
  { id: 5, time: "16:00", duration: 15,  dog: "Bean",   breed: "Labrador",       owner: "Priya N.",  svc: "Nail Clip",    price: 15, status: "pending",      note: "First visit.",          groomer: "Marcus" },
];

const WEEK_DAYS = [
  { dow: "Mon", date: "21", count: 4, hours: 5.5 },
  { dow: "Tue", date: "22", count: 5, hours: 7 },
  { dow: "Wed", date: "23", count: 3, hours: 4.5 },
  { dow: "Thu", date: "24", count: 5, hours: 6.5, today: true },
  { dow: "Fri", date: "25", count: 6, hours: 8 },
  { dow: "Sat", date: "26", count: 7, hours: 9 },
  { dow: "Sun", date: "27", count: 0, hours: 0,  off: true },
];

const CAL_HOURS = ["08","09","10","11","12","13","14","15","16","17","18"];
const CAL_ITEMS = [
  { day:0, start:9,  span:1,   label:"Murphy", svc:"Bath",       tone:"sage" },
  { day:0, start:11, span:1.5, label:"Pippa",  svc:"Full",       tone:"gold" },
  { day:0, start:14, span:2,   label:"Otis",   svc:"Hand-Strip", tone:"terra" },
  { day:1, start:9,  span:1.5, label:"Bean",   svc:"Full",       tone:"gold" },
  { day:1, start:13, span:1,   label:"Coco",   svc:"Bath",       tone:"sage" },
  { day:1, start:15, span:2,   label:"Bramble",svc:"Hand-Strip", tone:"terra" },
  { day:2, start:10, span:1.5, label:"Pippa",  svc:"Full",       tone:"gold" },
  { day:2, start:14, span:1,   label:"Roxy",   svc:"Bath",       tone:"sage" },
  { day:3, start:9,  span:1,   label:"Murphy", svc:"Bath",       tone:"sage", live:true },
  { day:3, start:10, span:1.5, label:"Pippa",  svc:"Full",       tone:"gold", live:true },
  { day:3, start:12, span:2,   label:"Otis",   svc:"Hand-Strip", tone:"terra" },
  { day:3, start:15, span:1.5, label:"Roxy",   svc:"Full",       tone:"gold" },
  { day:4, start:9,  span:1.5, label:"Hugo",   svc:"Full",       tone:"gold" },
  { day:4, start:11, span:1,   label:"Daisy",  svc:"Bath",       tone:"sage" },
  { day:4, start:13, span:2,   label:"Bramble",svc:"Hand-Strip", tone:"terra" },
  { day:4, start:16, span:1.5, label:"Coco",   svc:"Full",       tone:"gold" },
  { day:5, start:8,  span:1,   label:"Murphy", svc:"Bath",       tone:"sage" },
  { day:5, start:9,  span:1.5, label:"Pippa",  svc:"Full",       tone:"gold" },
  { day:5, start:11, span:2,   label:"Otis",   svc:"Hand-Strip", tone:"terra" },
  { day:5, start:14, span:1.5, label:"Roxy",   svc:"Full",       tone:"gold" },
  { day:5, start:16, span:1,   label:"Bean",   svc:"Nail",       tone:"sage" },
];

function StatusDot({ status }: { status: string }) {
  const tone: Record<string, [string, string]> = {
    confirmed:    ["#88a096","Confirmed"],
    "in-progress":["#eae45c","In progress"],
    pending:      ["#c87964","Pending"],
  };
  const [color, label] = tone[status] ?? ["#95a5a6", status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-deep-slate">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function SubPill({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors focus-ring ${active ? "bg-deep-slate text-alabaster-cream" : "text-deep-slate hover:bg-pebble-grey/10"}`}>
      {children}
    </button>
  );
}

function TodayView() {
  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8">
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <Eyebrow>Thursday 1 May</Eyebrow>
            <h2 className="font-fredoka text-2xl text-deep-slate mt-1">5 dogs on the books</h2>
          </div>
          <span className="text-xs text-pebble-grey font-bold">6.5 hrs</span>
        </div>
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
          {TODAY_BOOKINGS.map((b, i) => (
            <div key={b.id} className={`grid grid-cols-[88px_1fr_auto] gap-4 p-5 items-center ${i ? "border-t border-pebble-grey/10" : ""} ${b.status === "in-progress" ? "bg-groomr-gold/10" : ""}`}>
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
                  {b.svc} · <span className="text-pebble-grey">{b.owner}</span> · <span className="text-sage-leaf font-bold">w/ {b.groomer}</span>
                </p>
                {b.note && <p className="text-xs text-sage-leaf font-bold italic mt-1">&quot;{b.note}&quot;</p>}
              </div>
              <div className="flex items-center gap-2">
                <p className="font-fredoka text-lg text-deep-slate">£{b.price}</p>
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
          <p className="font-fredoka text-2xl mt-1 text-alabaster-cream">Pippa · Full Groom</p>
          <p className="text-sm text-alabaster-cream/85 mt-1 font-bold">Started 09:34 · 38 min in</p>
          <div className="mt-4 h-1.5 bg-alabaster-cream/20 rounded-full overflow-hidden">
            <div className="h-full bg-groomr-gold" style={{ width: "42%" }} />
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn-gold-on-dark text-xs font-bold px-4 py-2 rounded-full focus-ring">Mark complete</button>
            <button className="text-xs font-bold text-alabaster-cream border-2 border-alabaster-cream/40 hover:bg-alabaster-cream hover:text-deep-slate transition-colors px-4 py-2 rounded-full focus-ring">Notify owner</button>
          </div>
        </div>
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
          <Eyebrow>Today&apos;s notes</Eyebrow>
          <ul className="space-y-2.5 text-sm text-deep-slate mt-3">
            <li className="flex gap-2"><span className="text-sage-leaf font-bold">•</span> Murphy&apos;s anxious — slow approach, treat-first.</li>
            <li className="flex gap-2"><span className="text-sage-leaf font-bold">•</span> Otis: hand-strip only, leave the beard.</li>
            <li className="flex gap-2"><span className="text-sage-leaf font-bold">•</span> Bean is a first-timer, allow extra time.</li>
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

function WeekView() {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <Eyebrow>Week of 28 April</Eyebrow>
          <h2 className="font-fredoka text-2xl text-deep-slate mt-1">30 dogs booked · 40.5 hrs</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring"><ChevronLeftIcon size={16} /></button>
          <button className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring"><ChevronRightIcon size={16} /></button>
        </div>
      </div>
      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-pebble-grey/15">
          <div className="p-3" />
          {WEEK_DAYS.map((d, i) => (
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
          {WEEK_DAYS.map((d, dayIdx) => (
            <div key={dayIdx} className={`relative border-l border-pebble-grey/10 ${d.today ? "bg-groomr-gold/[0.04]" : ""} ${d.off ? "bg-pebble-grey/5" : ""}`}>
              {CAL_HOURS.map(h => <div key={h} className="border-t border-pebble-grey/10" style={{ height: ROW_H }} />)}
              {CAL_ITEMS.filter(it => it.day === dayIdx).map((it, i) => {
                const top = (it.start - 8) * ROW_H + 2;
                const height = it.span * ROW_H - 4;
                const c = COLOR_MAP[it.tone];
                return (
                  <button key={i} className="absolute left-1 right-1 rounded-lg p-2 text-left focus-ring hover:-translate-y-px transition-transform"
                    style={{ top, height, background: c.bg, borderLeft: `3px solid ${c.bd}` }}>
                    <p className="font-bold text-xs text-deep-slate leading-tight truncate">{it.label}</p>
                    <p className="text-[10px] text-deep-slate/70 font-bold truncate">{it.svc}</p>
                    {it.live && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-muted-terracotta rounded-full animate-pulse" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MonthView() {
  const offset = 2; // May 2026 starts Friday → offset 4, use April for prototype fidelity
  const days = 31;
  const cells: { blank?: boolean; d?: number; count?: number; today?: boolean; hours?: number }[] = [];
  for (let i = 0; i < offset; i++) cells.push({ blank: true });
  for (let d = 1; d <= days; d++) {
    const c = (d * 7) % 11;
    cells.push({ d, count: c, today: d === 1, hours: c * 1.2 });
  }
  while (cells.length % 7) cells.push({ blank: true });

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <Eyebrow>May 2026</Eyebrow>
          <h2 className="font-fredoka text-2xl text-deep-slate mt-1">112 bookings · 168 hrs</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring"><ChevronLeftIcon size={16} /></button>
          <button className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring"><ChevronRightIcon size={16} /></button>
        </div>
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

function YearView() {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const counts =   [86, 92, 105, 112, 118, 124, 96, 88, 102, 110, 0, 0];
  const earnings = [3120, 3480, 3960, 4280, 4520, 4780, 3650, 3320, 3900, 4200, 0, 0];
  const max = Math.max(...counts);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <Eyebrow>2026 · Year to date</Eyebrow>
          <h2 className="font-fredoka text-2xl text-deep-slate mt-1">933 bookings · £35,610 earned</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring"><ChevronLeftIcon size={16} /></button>
          <button className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring"><ChevronRightIcon size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {months.map((m, i) => {
          const pct = max ? counts[i] / max : 0;
          const empty = counts[i] === 0;
          const current = i === 4; // May
          return (
            <div key={m} className={`bg-white border rounded-[16px] p-5 transition-colors ${current ? "border-groomr-gold border-2" : "border-pebble-grey/20"}`}>
              <div className="flex items-baseline justify-between">
                <p className="font-fredoka text-xl text-deep-slate">{m}</p>
                {current && <span className="text-[10px] font-bold uppercase tracking-wider text-deep-slate bg-groomr-gold rounded-full px-2 py-0.5">Current</span>}
              </div>
              {empty ? (
                <p className="text-xs text-pebble-grey font-bold mt-3">Upcoming</p>
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BookingsView({ scope: _scope }: { scope?: string } = {}) {
  const [view, setView] = useState<BookingSubView>("today");
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-2 bg-white border border-pebble-grey/20 rounded-full p-1.5 w-fit">
        {(["today","week","month","year"] as BookingSubView[]).map(v => (
          <SubPill key={v} active={view === v} onClick={() => setView(v)}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </SubPill>
        ))}
      </div>
      {view === "today" && <TodayView />}
      {view === "week"  && <WeekView />}
      {view === "month" && <MonthView />}
      {view === "year"  && <YearView />}
    </section>
  );
}
