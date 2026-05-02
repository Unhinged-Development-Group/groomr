"use client";

import { useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Badge } from "@/components/ui/Badge";

type Period = "week" | "12w" | "3m" | "ytd";

const SERIES: Record<Period, {
  label: string; total: number; change: number; bookings: number; avg: number;
  data: number[]; xlabels: string[];
}> = {
  week: { label: "This week",     total: 742,   change: 12,  bookings: 14,  avg: 53, data: [60,80,140,90,210,162,0], xlabels: ["M","T","W","T","F","S","S"] },
  "12w":{ label: "Last 12 weeks", total: 8420,  change: 8,   bookings: 162, avg: 52, data: [610,580,640,720,690,710,790,810,760,830,870,742], xlabels: Array.from({length:12},(_,i)=>`${i+1}`) },
  "3m": { label: "Last 3 months", total: 11620, change: 15,  bookings: 224, avg: 52, data: [3120,3480,3960,4280,4520,4780,3650,3320,3900,4200,3800,3900], xlabels: ["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12"] },
  ytd:  { label: "Year to date",  total: 35610, change: 18,  bookings: 933, avg: 52, data: [3120,3480,3960,4280,4520,4780,3650,3320,3900,4200], xlabels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct"] },
};

interface StatCardProps { label: string; value: string | number; sub: string; tone?: "gold" | "sage" | "terra" | "slate" }

function StatCard({ label, value, sub, tone = "sage" }: StatCardProps) {
  const dot: Record<string, string> = { gold: "#eae45c", sage: "#88a096", terra: "#c87964", slate: "#2c3e50" };
  return (
    <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: dot[tone] }} />
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-pebble-grey">{label}</span>
      </div>
      <p className="font-fredoka text-3xl text-deep-slate mt-2 leading-none">{value}</p>
      <p className="text-xs text-pebble-grey font-bold mt-2">{sub}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function EarningsView({ scope: _scope }: { scope?: string } = {}) {
  const [period, setPeriod] = useState<Period>("week");
  const s = SERIES[period];
  const max = Math.max(...s.data);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <Eyebrow>Earnings</Eyebrow>
          <h2 className="font-fredoka text-2xl text-deep-slate mt-1">{s.label}</h2>
        </div>
        <div className="flex items-center gap-2 bg-white border border-pebble-grey/20 rounded-full p-1.5">
          {([["week","This week"],["12w","12W"],["3m","3M"],["ytd","YTD"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setPeriod(k as Period)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors focus-ring ${period === k ? "bg-deep-slate text-alabaster-cream" : "text-deep-slate hover:bg-pebble-grey/10"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Earned"       value={`£${s.total.toLocaleString()}`} sub={`+${s.change}% vs prior`}       tone="gold" />
        <StatCard label="Bookings"     value={s.bookings}                     sub={`Avg £${s.avg} / booking`}       tone="sage" />
        <StatCard label="Next payout"  value="£742"                           sub="Mon 27 Apr · auto-deposit"        tone="terra" />
        <StatCard label="Tips"         value="£68"                            sub="14 dogs tipped this period"       tone="slate" />
      </div>

      <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
        <div className="flex items-end gap-2 h-44">
          {s.data.map((v, i) => {
            const h = max ? (v / max) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end h-full">
                  <div className="w-full rounded-t-md bg-sage-leaf hover:bg-deep-slate transition-colors cursor-pointer" style={{ height: `${h}%`, minHeight: v ? 2 : 0 }} title={`£${v}`} />
                </div>
                <span className="text-[10px] font-bold text-pebble-grey">{s.xlabels[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
          <div className="px-5 py-4 border-b border-pebble-grey/15 flex items-center justify-between">
            <Eyebrow>Recent payouts</Eyebrow>
            <button className="text-xs font-bold text-deep-slate text-link">Download all</button>
          </div>
          {[
            { d:"20 Apr", amt: 712, n: 13, status:"Paid" },
            { d:"13 Apr", amt: 689, n: 12, status:"Paid" },
            { d:"06 Apr", amt: 745, n: 14, status:"Paid" },
            { d:"30 Mar", amt: 802, n: 15, status:"Paid" },
          ].map((p, i) => (
            <div key={i} className={`grid grid-cols-[100px_1fr_auto_auto] gap-3 px-5 py-3 items-center ${i ? "border-t border-pebble-grey/10" : ""}`}>
              <span className="font-bold text-sm text-deep-slate">{p.d}</span>
              <span className="text-sm text-pebble-grey font-bold">{p.n} bookings</span>
              <Badge tone="sage">{p.status}</Badge>
              <span className="font-fredoka text-deep-slate">£{p.amt}</span>
            </div>
          ))}
        </div>

        <aside className="bg-alabaster-cream border border-pebble-grey/15 rounded-[20px] p-5 space-y-3">
          <Eyebrow>Top services</Eyebrow>
          {([
            ["Full Groom", 62, "#eae45c"],
            ["Bath & Brush", 22, "#88a096"],
            ["Hand-Strip", 12, "#c87964"],
            ["Nail Clip", 4, "#95a5a6"],
          ] as [string, number, string][]).map(([name, pct, color]) => (
            <div key={name}>
              <div className="flex justify-between text-xs font-bold text-deep-slate mb-1">
                <span>{name}</span><span>{pct}%</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ background: color, width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}
