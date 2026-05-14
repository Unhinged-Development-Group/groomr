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
import { NewBookingModal } from "./NewBookingModal";
import { cn } from "@/lib/utils";
import type { ProfileEditorInitialData, TeamMemberRow } from "@/types/groomer-dashboard";

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

function ScopeSelector({
  team,
  scope,
  onScopeChange,
}: {
  team: TeamMemberRow[];
  scope: string;
  onScopeChange: (s: string) => void;
}) {
  const accepted = team.filter((m) => m.inviteStatus === "accepted");
  if (accepted.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-pebble-grey uppercase tracking-wider whitespace-nowrap">Viewing:</span>
      <select
        value={scope}
        onChange={(e) => onScopeChange(e.target.value)}
        className="bg-white border border-pebble-grey/20 text-deep-slate text-sm rounded-full px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-groomr-gold focus:border-groomr-gold cursor-pointer"
      >
        <option value="all">Full salon</option>
        <option value="own">My data</option>
        {accepted.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
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
  editorData: ProfileEditorInitialData;
}

export function GroomerDashboardClient({
  businessName,
  ownerName,
  unrespondedReviews = 0,
  initialAppointments,
  initialReviews,
  initialPayments,
  editorData,
}: Props) {
  const [tab, setTab] = useState<Tab>("bookings");
  const [scope, setScope] = useState<string>("all");
  const [newBookingOpen, setNewBookingOpen] = useState(false);

  const { viewerRole, teamMemberId, team } = editorData;
  const effectiveScope = viewerRole === "team_member" ? (teamMemberId ?? "own") : scope;

  // Filter appointments by scope
  const scopedAppointments = effectiveScope === "all"
    ? initialAppointments
    : effectiveScope === "own"
    ? initialAppointments.filter((a) => !a.assigned_to_team_member_id)
    : initialAppointments.filter((a) => a.assigned_to_team_member_id === effectiveScope);

  // Real stat calculations
  const now = new Date();
  const todayAppointments = scopedAppointments.filter((a) => {
    const d = new Date(a.scheduled_at);
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && a.status !== "cancelled";
  });
  const todayHours = todayAppointments.reduce((sum, a) => sum + (a.service_snapshot_duration || 0), 0) / 60;

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  weekStart.setHours(0, 0, 0, 0);
  const weekPayments = initialPayments.filter((p) => new Date(p.date) >= weekStart);
  const weekRevenue = weekPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

  const uniqueClients = new Set(scopedAppointments.map((a) => a.owner_id));
  const repeatClients = Array.from(uniqueClients).filter(
    (ownerId) => scopedAppointments.filter((a) => a.owner_id === ownerId && a.status === "completed").length > 1
  );
  const repeatRate = uniqueClients.size > 0 ? Math.round((repeatClients.length / uniqueClients.size) * 100) : 0;

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-8 space-y-7">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <Eyebrow>Studio dashboard</Eyebrow>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <h1 className="font-fredoka text-3xl md:text-4xl text-deep-slate leading-tight">{businessName}</h1>
            {(() => {
              const isOpen = editorData.availability.some((r) => r.isActive);
              return (
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 border ${isOpen ? "bg-sage-leaf/10 border-sage-leaf/30" : "bg-muted-terracotta/10 border-muted-terracotta/30"}`}>
                  <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-sage-leaf animate-pulse" : "bg-muted-terracotta"}`} />
                  <span className="text-xs font-bold text-deep-slate">{isOpen ? "Open · Accepting bookings" : "Closed · Not accepting bookings"}</span>
                </span>
              );
            })()}
          </div>
          <p className="text-sm text-pebble-grey font-bold mt-3">
            {ownerName} · <StarIcon size={12} className="inline-block align-middle" /> <span className="inline-block align-middle">4.9 (184 reviews)</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {viewerRole === "owner" && (
            <ScopeSelector team={team} scope={scope} onScopeChange={setScope} />
          )}
          <button className="btn-secondary font-nunito font-bold px-4 py-2 rounded-full text-sm focus-ring flex items-center gap-2">
            <CalendarIcon size={16} />
            <span className="hidden sm:inline">Block time</span>
            <span className="sm:hidden">Block</span>
          </button>
          <Link href="/dashboard/groomer/messages" className="btn-secondary font-nunito font-bold px-4 py-2 rounded-full text-sm focus-ring flex items-center gap-2">
            <MessagesIcon size={16} />
            <span className="hidden sm:inline">Messages</span>
          </Link>
          <button onClick={() => setNewBookingOpen(true)} className="btn-primary font-nunito font-bold px-4 py-2 rounded-full text-sm focus-ring shadow-subtle flex items-center gap-2">
            <PlusIcon size={16} />
            <span className="hidden sm:inline">New booking</span>
            <span className="sm:hidden">Book</span>
          </button>
        </div>
      </header>

      {/* Stat strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today"       value={todayAppointments.length.toString()} sub={`bookings · ${todayHours.toFixed(1)} hrs`} tone="gold" />
        <StatCard label="This week"   value={`£${weekRevenue.toFixed(0)}`}        sub={`${weekPayments.length} payments this week`} tone="sage" />
        <StatCard label="Next payout" value={`£${weekRevenue.toFixed(0)}`}        sub="Estimated" tone="terra" />
        <StatCard label="Repeat rate" value={`${repeatRate}%`}                    sub="of clients booked again" tone="slate" />
      </section>

      {/* Tab nav */}
      <nav className="bg-white border border-pebble-grey/20 rounded-[20px] p-2 shadow-subtle">
        <div className="flex sm:grid sm:grid-cols-5 gap-1 overflow-x-auto pb-0.5 sm:overflow-visible scrollbar-none">
          {TABS.map((t) => {
            const active = tab === t.id;
            const showDot = t.id === "reviews" && unrespondedReviews > 0;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("relative flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-nunito font-bold text-sm transition-colors focus-ring shrink-0 sm:shrink whitespace-nowrap",
                  active ? "bg-deep-slate text-alabaster-cream" : "text-deep-slate hover:bg-alabaster-cream")}>
                <t.Icon size={18} />
                {t.label}
                {showDot && (
                  <span className={cn("absolute top-2 right-2 min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center",
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
      {tab === "bookings" && <BookingsView appointments={scopedAppointments} />}
      {tab === "clients"  && <ClientsView appointments={scopedAppointments} />}
      {tab === "earnings" && <EarningsView payments={initialPayments} appointments={scopedAppointments} />}
      {tab === "reviews"  && <ReviewsView reviews={initialReviews} />}
      {tab === "profile"  && (
        <ProfileEditor
          groomerProfileId={editorData.groomerProfileId}
          initialProfile={editorData.profile}
          initialServices={editorData.services}
          initialAvailability={editorData.availability}
          initialTeam={editorData.team}
          viewerRole={editorData.viewerRole}
        />
      )}

      {newBookingOpen && (
        <NewBookingModal
          services={editorData.services}
          onClose={() => setNewBookingOpen(false)}
        />
      )}
    </div>
  );
}
