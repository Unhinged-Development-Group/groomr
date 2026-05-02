"use client";

import { useState } from "react";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CalendarIcon, PetsIcon, ScissorsIcon, StarIcon, ShieldIcon, PlusIcon, MessagesIcon } from "@/components/ui/GroomrIcons";
import { BookingsView } from "./BookingsView";
import { ClientsView } from "./ClientsView";
import { EarningsView } from "./EarningsView";
import { ReviewsView } from "./ReviewsView";
import { ProfileEditor } from "./ProfileEditor";
import { cn } from "@/lib/utils";

type Tab = "bookings" | "clients" | "earnings" | "reviews" | "profile";

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "bookings", label: "Bookings", Icon: CalendarIcon },
  { id: "clients",  label: "Clients",  Icon: PetsIcon },
  { id: "earnings", label: "Earnings", Icon: ScissorsIcon },
  { id: "reviews",  label: "Reviews",  Icon: StarIcon },
  { id: "profile",  label: "Profile",  Icon: ShieldIcon },
];

interface StatCardProps { label: string; value: string; sub: string; tone?: "gold" | "sage" | "terra" | "slate" }

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

interface Props {
  businessName: string;
  ownerName: string;
  unrespondedReviews?: number;
  initialAppointments: any[];
  initialReviews: any[];
  initialPayments: any[];
  profileData: {
    profile: any;
    services: any[];
    team: any[];
  };
}

export function GroomerDashboardClient({
  businessName,
  ownerName,
  unrespondedReviews = 0,
  initialAppointments,
  initialReviews,
  initialPayments,
  profileData
}: Props) {
  const [tab, setTab] = useState<Tab>("bookings");

  // Calculate real stats for the strip
  const now = new Date();
  
  // 1. Today's Bookings
  const todayAppointments = initialAppointments.filter(a => {
    const d = new Date(a.scheduled_at);
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && a.status !== "cancelled";
  });
  const todayHours = todayAppointments.reduce((sum, a) => sum + (a.service_snapshot_duration || 0), 0) / 60;
  
  // 2. This Week's Revenue
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Monday
  weekStart.setHours(0,0,0,0);
  const weekPayments = initialPayments.filter(p => new Date(p.date) >= weekStart);
  const weekRevenue = weekPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
  
  // 3. Next Payout (dummy calculation based on upcoming appointments value, or just raw total)
  const nextPayout = weekRevenue; // Simulating next payout as this week's revenue
  
  // 4. Repeat Rate
  const uniqueClients = new Set(initialAppointments.map(a => a.owner_id));
  const repeatClients = Array.from(uniqueClients).filter(ownerId => {
    return initialAppointments.filter(a => a.owner_id === ownerId && a.status === 'completed').length > 1;
  });
  const repeatRate = uniqueClients.size > 0 ? Math.round((repeatClients.length / uniqueClients.size) * 100) : 0;

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-8 space-y-7">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <Eyebrow>Studio dashboard</Eyebrow>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <h1 className="font-fredoka text-4xl md:text-5xl text-deep-slate">{businessName}</h1>
            <span className="inline-flex items-center gap-2 bg-sage-leaf/10 border border-sage-leaf/30 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 bg-sage-leaf rounded-full animate-pulse" />
              <span className="text-xs font-bold text-deep-slate">Open · Accepting bookings</span>
            </span>
          </div>
          <p className="text-sm text-pebble-grey font-bold mt-1">
            {ownerName} · <StarIcon size={12} className="inline-block align-middle" /> <span className="inline-block align-middle">4.9 (184 reviews)</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring flex items-center gap-2">
            <CalendarIcon size={16} /> Block time
          </button>
          <Link href="/dashboard/groomer/messages" className="btn-secondary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring flex items-center gap-2">
            <MessagesIcon size={16} /> Messages
          </Link>
          <button className="btn-primary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring shadow-subtle flex items-center gap-2">
            <PlusIcon size={16} /> New booking
          </button>
        </div>
      </header>

      {/* Stat strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today"       value={todayAppointments.length.toString()} sub={`bookings · ${todayHours.toFixed(1)} hrs`} tone="gold" />
        <StatCard label="This week"   value={`£${weekRevenue.toFixed(0)}`} sub={`${weekPayments.length} payments this week`} tone="sage" />
        <StatCard label="Next payout" value={`£${nextPayout.toFixed(0)}`} sub="Estimated" tone="terra" />
        <StatCard label="Repeat rate" value={`${repeatRate}%`} sub="of clients booked again" tone="slate" />
      </section>

      {/* Tab nav */}
      <nav className="bg-white border border-pebble-grey/20 rounded-[20px] p-2 shadow-subtle">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1">
          {TABS.map(t => {
            const active = tab === t.id;
            const showDot = t.id === "reviews" && unrespondedReviews > 0;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("relative flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl font-nunito font-bold text-base transition-colors focus-ring",
                  active ? "bg-deep-slate text-alabaster-cream" : "text-deep-slate hover:bg-alabaster-cream")}>
                <t.Icon size={20} />
                {t.label}
                {showDot && (
                  <span className={cn("absolute top-2.5 right-3 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
                    active ? "bg-groomr-gold text-deep-slate" : "bg-muted-terracotta text-alabaster-cream")}>
                    {unrespondedReviews}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Tab content */}
      {tab === "bookings" && <BookingsView appointments={initialAppointments} />}
      {tab === "clients"  && <ClientsView appointments={initialAppointments} />}
      {tab === "earnings" && <EarningsView payments={initialPayments} />}
      {tab === "reviews"  && <ReviewsView reviews={initialReviews} />}
      {tab === "profile"  && <ProfileEditor profileData={profileData} />}
    </div>
  );
}
