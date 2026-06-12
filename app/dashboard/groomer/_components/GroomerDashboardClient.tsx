"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CalendarIcon, PetsIcon, FinancialsIcon, ReviewsIcon, StarIcon, ShieldIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon, UploadIcon, ClockIcon } from "@/components/ui/GroomrIcons";
import { toggleAcceptingBookings } from "@/app/actions/profile-editor";
import { BookingsView } from "./BookingsView";
import { ClientsView } from "./ClientsView";
import { EarningsView } from "./EarningsView";
import { ReviewsView } from "./ReviewsView";
import { ProfileEditor } from "./ProfileEditor";
import { StripeConnectBanner } from "./StripeConnectBanner";
import { NewBookingModal, type ExistingClient } from "./NewBookingModal";
import { BlockTimeModal } from "./BlockTimeModal";
import { LiveGroomTracker } from "./LiveGroomTracker";
import type { ActiveGroom } from "./LiveGroomTracker";
import { cn } from "@/lib/utils";
import type { ProfileEditorInitialData, TeamMemberRow } from "@/types/groomer-dashboard";
import type { TimeBlock } from "@/app/actions/time-blocks";

type Tab = "bookings" | "clients" | "earnings" | "reviews" | "profile";

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "bookings", label: "Bookings", Icon: CalendarIcon },
  { id: "clients",  label: "Clients",  Icon: PetsIcon },
  { id: "earnings", label: "Earnings", Icon: FinancialsIcon },
  { id: "reviews",  label: "Reviews",  Icon: ReviewsIcon },
  { id: "profile",  label: "Profile",  Icon: ShieldIcon },
];

interface StatCardProps { label: string; value: string; sub: string; tone?: "gold" | "sage" | "terra" | "slate" }

function StatCard({ label, value, sub, tone = "sage" }: StatCardProps) {
  const dot: Record<string, string> = { gold: "#eae45c", sage: "#88a096", terra: "#c87964", slate: "#2c3e50" };
  return (
    <div className="bg-white border border-pebble-grey/20 rounded-[14px] sm:rounded-[20px] p-3 sm:p-5">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0" style={{ background: dot[tone] }} />
        <span className="text-[9px] sm:text-xs font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] text-pebble-grey leading-tight">{label}</span>
      </div>
      <p className="font-fredoka text-xl sm:text-3xl text-deep-slate mt-1.5 leading-none">{value}</p>
      <p className="text-[9px] sm:text-xs text-pebble-grey font-bold mt-1.5 leading-tight">{sub}</p>
    </div>
  );
}

function BookingStatusChip({
  isAcceptingBookings,
  groomerProfileId,
}: {
  isAcceptingBookings: boolean;
  groomerProfileId: string;
}) {
  const [open, setOpen] = useState(isAcceptingBookings);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    const next = !open;
    const confirmed = window.confirm(
      next
        ? "Open your bookings? Clients will be able to find and book you."
        : "Close your bookings? You will no longer appear in search results."
    );
    if (!confirmed) return;
    setOpen(next);
    startTransition(async () => {
      const result = await toggleAcceptingBookings(groomerProfileId, next);
      if (result?.error) {
        setOpen(!next); // revert on failure
        alert(result.error);
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      title={open ? "Click to close bookings" : "Click to open bookings"}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 border transition-colors cursor-pointer ${open ? "bg-sage-leaf/10 border-sage-leaf/30 hover:bg-sage-leaf/20" : "bg-muted-terracotta/10 border-muted-terracotta/30 hover:bg-muted-terracotta/20"} ${pending ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <span className={`w-2 h-2 rounded-full ${open ? "bg-sage-leaf animate-pulse" : "bg-muted-terracotta"}`} />
      <span className="text-xs font-bold text-deep-slate">
        {pending ? "Saving…" : open ? "Open · Accepting bookings" : "Closed · Not accepting bookings"}
      </span>
    </button>
  );
}

function ShareBar({ groomerProfileId, publicSlug }: { groomerProfileId: string; publicSlug: string | null }) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [calCopied, setCalCopied] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const profilePath = publicSlug ? `/groomers/${publicSlug}` : `/groomers/${groomerProfileId}`;
  const bookingUrl = `${appUrl}${profilePath}`;
  const calendarHttpUrl = `${appUrl}/api/calendar/${groomerProfileId}`;
  const calendarWebcalUrl = calendarHttpUrl.replace(/^https?:\/\//, "webcal://");

  // Close popover on outside click
  useEffect(() => {
    if (!calOpen) return;
    function handleClick(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setCalOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [calOpen]);

  function copyBookingLink() {
    navigator.clipboard.writeText(bookingUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  }

  function copyCalLink() {
    navigator.clipboard.writeText(calendarHttpUrl);
    setCalCopied(true);
    setTimeout(() => setCalCopied(false), 2500);
  }

  // Google Calendar expects an https:// URL in the cid parameter
  const googleCalUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(calendarHttpUrl)}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Booking link */}
      <div className="flex items-center gap-1.5 bg-white border border-pebble-grey/20 rounded-full px-3 py-1.5 max-w-xs">
        <span className="text-xs text-pebble-grey font-bold truncate min-w-0">
          groomr.com{profilePath}
        </span>
        <button
          onClick={copyBookingLink}
          title="Copy booking link"
          className="shrink-0 flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full transition-colors hover:bg-pebble-grey/10 focus-ring"
        >
          {linkCopied ? (
            <><CheckIcon size={13} className="text-sage-leaf" /><span className="text-sage-leaf">Copied</span></>
          ) : (
            <><UploadIcon size={13} className="text-pebble-grey" /><span className="text-pebble-grey">Share</span></>
          )}
        </button>
      </div>

      {/* Calendar sync */}
      <div className="relative" ref={calRef}>
        <button
          onClick={() => setCalOpen((o) => !o)}
          className="flex items-center gap-1.5 text-xs font-bold text-pebble-grey hover:text-deep-slate transition-colors px-3 py-1.5 rounded-full border border-pebble-grey/20 bg-white hover:bg-alabaster-cream focus-ring"
        >
          <CalendarIcon size={13} />
          Sync calendar
        </button>
        {calOpen && (
          <div className="absolute top-full mt-2 left-0 z-30 bg-white border border-pebble-grey/20 rounded-2xl shadow-modal p-4 w-72 space-y-3">
            <div className="pb-2 border-b border-pebble-grey/10">
              <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-[0.12em]">
                Sync your booking calendar
              </p>
              <p className="text-xs text-pebble-grey/80 mt-1 leading-relaxed">
                Your bookings and any blocked time will appear in your calendar and stay up to date automatically.
              </p>
            </div>

            {/* Apple Calendar */}
            <a
              href={calendarWebcalUrl}
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm font-bold text-deep-slate hover:text-sage-leaf transition-colors py-0.5 group"
            >
              <span className="w-7 h-7 rounded-lg bg-alabaster-cream group-hover:bg-sage-leaf/10 flex items-center justify-center transition-colors shrink-0">
                <CalendarIcon size={14} />
              </span>
              Add to Apple Calendar
            </a>

            {/* Google Calendar */}
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm font-bold text-deep-slate hover:text-sage-leaf transition-colors py-0.5 group"
            >
              <span className="w-7 h-7 rounded-lg bg-alabaster-cream group-hover:bg-sage-leaf/10 flex items-center justify-center transition-colors shrink-0">
                <CalendarIcon size={14} />
              </span>
              Add to Google Calendar
            </a>

            {/* Manual URL copy */}
            <div className="flex items-center gap-2 border-t border-pebble-grey/10 pt-2">
              <span className="text-[11px] text-pebble-grey font-medium truncate flex-1">
                {calendarHttpUrl.replace(/^https?:\/\//, "")}
              </span>
              <button
                onClick={copyCalLink}
                className="shrink-0 text-xs font-bold text-pebble-grey hover:text-deep-slate transition-colors flex items-center gap-1"
              >
                {calCopied ? <CheckIcon size={12} className="text-sage-leaf" /> : <UploadIcon size={12} />}
                {calCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>
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

interface StripeConnectStatus {
  connected: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  stripeAccountId: string | null;
}

interface Props {
  businessName: string;
  ownerName: string;
  unrespondedReviews?: number;
  showWelcome?: boolean;
  stripeStatus?: StripeConnectStatus;
  initialAppointments: any[];
  initialReviews: any[];
  initialPayments: any[];
  initialTimeBlocks: TimeBlock[];
  editorData: ProfileEditorInitialData;
  isFoundingGroomer?: boolean;
  incentiveBookingsUsed?: number;
  incentiveBookingsLimit?: number;
}

export function GroomerDashboardClient({
  businessName,
  ownerName,
  unrespondedReviews = 0,
  showWelcome = false,
  stripeStatus,
  initialAppointments,
  initialReviews,
  initialPayments,
  initialTimeBlocks,
  editorData,
  isFoundingGroomer = false,
  incentiveBookingsUsed = 0,
  incentiveBookingsLimit = 150,
}: Props) {
  const [tab, setTab] = useState<Tab>("bookings");
  const [scope, setScope] = useState<string>("all");
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [blockTimeOpen, setBlockTimeOpen] = useState(false);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(initialTimeBlocks);
  const [activeGroom, setActiveGroom] = useState<ActiveGroom | null>(null);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(showWelcome);

  // Tab bar horizontal scroll state (mobile only)
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [tabScroll, setTabScroll] = useState({ left: false, right: true });

  function updateTabScroll() {
    const el = tabScrollRef.current;
    if (!el) return;
    setTabScroll({
      left: el.scrollLeft > 4,
      right: el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
    });
  }

  useEffect(() => {
    // Initialise after mount so we know the real scrollWidth
    updateTabScroll();
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("groomr_active_groom");
      if (stored) setActiveGroom(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  function handleBeginGroom(groom: ActiveGroom) {
    localStorage.setItem("groomr_active_groom", JSON.stringify(groom));
    setActiveGroom(groom);
  }

  function handleGroomComplete() {
    localStorage.removeItem("groomr_active_groom");
    setActiveGroom(null);
  }

  function handleGroomExtend(minutes: number) {
    if (!activeGroom) return;
    const updated = { ...activeGroom, extensionMinutes: activeGroom.extensionMinutes + minutes };
    localStorage.setItem("groomr_active_groom", JSON.stringify(updated));
    setActiveGroom(updated);
  }

  const incentiveRemaining = Math.max(0, incentiveBookingsLimit - incentiveBookingsUsed);
  const incentiveActive = incentiveRemaining > 0;
  const commissionRate = incentiveActive ? 0 : 0.08;

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
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const weekAppointments = scopedAppointments.filter((a) => {
    const d = new Date(a.scheduled_at);
    return d >= weekStart && d <= weekEnd && a.status !== "cancelled" && a.status !== "no_show";
  });
  const weekRevenue = weekAppointments.reduce((sum, a) => sum + (a.service_snapshot_price || 0), 0) / 100;

  // Payout cycle: Mon–Sun, paid on Monday
  const dayOfWeek = now.getDay();
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  lastMonday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(lastMonday);
  nextMonday.setDate(lastMonday.getDate() + 7);

  const payoutCycleAppts = scopedAppointments.filter((a) => {
    if (a.status === "cancelled" || a.status === "no_show") return false;
    const d = new Date(a.scheduled_at);
    return d >= lastMonday && d < nextMonday && d <= now;
  });
  const nextPayoutAmount = payoutCycleAppts.reduce((sum, a) => sum + (a.service_snapshot_price || 0), 0) / 100 * (1 - commissionRate);
  const nextPayoutDate = nextMonday.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const uniqueClients = new Set(scopedAppointments.map((a) => a.owner_id));
  const repeatClients = Array.from(uniqueClients).filter(
    (ownerId) => scopedAppointments.filter((a) => a.owner_id === ownerId && a.status === "completed").length > 1
  );
  const repeatRate = uniqueClients.size > 0 ? Math.round((repeatClients.length / uniqueClients.size) * 100) : 0;

  // Derive existing clients for the new booking modal
  const existingClients: ExistingClient[] = (() => {
    const clientMap = new Map<string, ExistingClient>();
    // Use all appointments (not scoped) so the groomer sees all their clients
    initialAppointments.forEach((a) => {
      const ownerId = a.owner_id as string | null;
      const profile = a.profiles as { full_name?: string } | null;
      const dog = a.dogs as { name?: string; breed?: string } | null;
      if (!ownerId || !profile?.full_name) return;
      if (!clientMap.has(ownerId)) {
        clientMap.set(ownerId, { ownerId, name: profile.full_name, dogs: [] });
      }
      const client = clientMap.get(ownerId)!;
      if (dog?.name && !client.dogs.find((d) => d.name === dog.name)) {
        client.dogs.push({ dogId: (a.dog_id as string | null) ?? null, name: dog.name, breed: dog.breed ?? null, photoUrl: (dog as any).profile_image_url ?? null });
      }
    });
    return Array.from(clientMap.values());
  })();

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-8 space-y-7">
      {/* Welcome banner for new team members */}
      {showWelcomeBanner && (
        <div className="bg-groomr-gold/20 border border-groomr-gold/50 rounded-[16px] px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-fredoka text-lg text-deep-slate">Welcome to {businessName}! 🐾</p>
            <p className="text-sm text-deep-slate/80 mt-0.5">
              You&rsquo;ve been added to the team. Your appointments will appear here once bookings are assigned.
            </p>
          </div>
          <button
            onClick={() => setShowWelcomeBanner(false)}
            className="text-deep-slate/50 hover:text-deep-slate transition-colors shrink-0 font-bold text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Stripe Connect banner — shown to salon owner only */}
      {stripeStatus && editorData.viewerRole === "owner" && (
        <StripeConnectBanner
          chargesEnabled={stripeStatus.chargesEnabled}
          detailsSubmitted={stripeStatus.detailsSubmitted}
          stripeAccountId={stripeStatus.stripeAccountId}
        />
      )}

      {/* Sign-up incentive banner — first N completed bookings commission-free */}
      {incentiveActive && (
        <div className="bg-groomr-gold border border-groomr-gold rounded-[16px] px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none mt-0.5">🏅</span>
            <div>
              <p className="font-fredoka text-lg text-deep-slate leading-tight">
                {isFoundingGroomer ? "Founding Groomer — " : ""}0% Commission
              </p>
              <p className="text-sm text-deep-slate/80 mt-0.5">
                You keep 100% of your earnings on your first{" "}
                <span className="font-bold">{incentiveBookingsLimit}</span> completed bookings —{" "}
                <span className="font-bold">{incentiveRemaining} remaining</span>
                {" "}({incentiveBookingsUsed} used). The standard commission applies afterwards.
              </p>
            </div>
          </div>
          <div className="hidden sm:block w-32 shrink-0">
            <div className="h-2 rounded-full bg-deep-slate/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-deep-slate"
                style={{ width: `${Math.min(100, (incentiveBookingsUsed / incentiveBookingsLimit) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-deep-slate/70 text-right mt-1 font-bold">
              {incentiveBookingsUsed}/{incentiveBookingsLimit}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="space-y-2">
        <Eyebrow>Studio dashboard</Eyebrow>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <h1 className="font-fredoka text-3xl md:text-4xl text-deep-slate leading-tight">{businessName}</h1>
            <BookingStatusChip isAcceptingBookings={editorData.profile.isAcceptingBookings} groomerProfileId={editorData.groomerProfileId} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {viewerRole === "owner" && (
              <ScopeSelector team={team} scope={scope} onScopeChange={setScope} />
            )}
            <button
              onClick={() => setBlockTimeOpen(true)}
              className="btn-secondary font-nunito font-bold px-4 py-2 rounded-full text-sm focus-ring flex items-center gap-2"
            >
              <ClockIcon size={16} />
              <span className="hidden sm:inline">Block time</span>
              <span className="sm:hidden">Block</span>
            </button>
            <button onClick={() => setNewBookingOpen(true)} className="btn-primary font-nunito font-bold px-4 py-2 rounded-full text-sm focus-ring shadow-subtle flex items-center gap-2">
              <PlusIcon size={16} />
              <span className="hidden sm:inline">New booking</span>
              <span className="sm:hidden">Book</span>
            </button>
          </div>
        </div>
        <p className="text-sm text-pebble-grey font-bold">
          {ownerName}
          {editorData.totalReviews && editorData.totalReviews > 0 ? (
            <> · <StarIcon size={12} className="inline-block align-middle" /> <span className="inline-block align-middle">{editorData.averageRating?.toFixed(1)} ({editorData.totalReviews} reviews)</span></>
          ) : (
            <> · <span className="text-pebble-grey/60">No reviews yet</span></>
          )}
        </p>
      </header>

      {/* Share & sync bar — owner only */}
      {viewerRole === "owner" && (
        <ShareBar groomerProfileId={editorData.groomerProfileId} publicSlug={editorData.publicSlug} />
      )}

      {/* Stat strip */}
      <section className="grid grid-cols-4 gap-2 sm:gap-4">
        <StatCard label="Today"       value={todayAppointments.length.toString()}    sub={`bookings · ${todayHours.toFixed(1)} hrs`} tone="gold" />
        <StatCard label="This week"   value={`£${weekRevenue.toFixed(0)}`}          sub={`${weekAppointments.length} bookings this week`} tone="sage" />
        <StatCard label="Next payout" value={`£${nextPayoutAmount.toFixed(2)}`}     sub={`Est. ${nextPayoutDate}`} tone="terra" />
        <StatCard label="Repeat rate" value={`${repeatRate}%`}                      sub="of clients booked again" tone="slate" />
      </section>

      {/* Tab nav */}
      <nav className="bg-white border border-pebble-grey/20 rounded-[20px] p-2 shadow-subtle relative">
        {/* Left scroll chevron — mobile only */}
        {tabScroll.left && (
          <button
            aria-hidden
            onClick={() => { tabScrollRef.current?.scrollBy({ left: -160, behavior: "smooth" }); }}
            className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/95 shadow-subtle border border-pebble-grey/20 flex items-center justify-center"
          >
            <ChevronLeftIcon size={14} />
          </button>
        )}

        <div
          ref={tabScrollRef}
          onScroll={updateTabScroll}
          className="flex sm:grid sm:grid-cols-5 gap-1 overflow-x-auto pb-0.5 sm:overflow-visible scrollbar-none"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            const showDot = t.id === "reviews" && unrespondedReviews > 0;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("relative flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-nunito font-bold text-sm transition-colors focus-ring shrink-0 sm:shrink whitespace-nowrap",
                  active ? "bg-groomr-gold text-deep-slate" : "text-deep-slate hover:bg-alabaster-cream")}>
                <t.Icon size={18} />
                {t.label}
                {showDot && (
                  <span className={cn("min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center",
                    active ? "bg-deep-slate text-alabaster-cream" : "bg-muted-terracotta text-alabaster-cream")}>
                    {unrespondedReviews}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right scroll chevron — mobile only */}
        {tabScroll.right && (
          <button
            aria-hidden
            onClick={() => { tabScrollRef.current?.scrollBy({ left: 160, behavior: "smooth" }); }}
            className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/95 shadow-subtle border border-pebble-grey/20 flex items-center justify-center"
          >
            <ChevronRightIcon size={14} />
          </button>
        )}
      </nav>

      {/* Tab content */}
      {tab === "bookings" && <BookingsView appointments={scopedAppointments} availability={editorData.availability} timeBlocks={timeBlocks} onBeginGroom={handleBeginGroom} activeGroomId={activeGroom?.appointmentId ?? null} />}
      {tab === "clients"  && <ClientsView appointments={scopedAppointments} services={editorData.services} />}
      {tab === "earnings" && <EarningsView payments={initialPayments} appointments={scopedAppointments} />}
      {tab === "reviews"  && (
        <ReviewsView
          reviews={initialReviews}
          groomerProfileImageUrl={editorData.profileImageUrl}
          groomerName={businessName}
          groomerProfileId={editorData.groomerProfileId}
        />
      )}
      {tab === "profile"  && (
        <ProfileEditor
          groomerProfileId={editorData.groomerProfileId}
          initialProfile={editorData.profile}
          initialCoverPhotoUrl={editorData.coverPhotoUrl}
          initialProfileImageUrl={editorData.profileImageUrl}
          initialServices={editorData.services}
          initialAvailability={editorData.availability}
          initialTeam={editorData.team}
          viewerRole={editorData.viewerRole}
          initialVerificationDocs={editorData.verificationDocs}
          portfolioCount={editorData.portfolioCount}
          initialContractTerms={editorData.contractTerms ?? null}
        />
      )}

      {newBookingOpen && (
        <NewBookingModal
          services={editorData.services}
          existingClients={existingClients}
          groomerProfileId={editorData.groomerProfileId}
          onClose={() => setNewBookingOpen(false)}
        />
      )}

      <BlockTimeModal
        open={blockTimeOpen}
        onClose={() => setBlockTimeOpen(false)}
        existingBlocks={timeBlocks}
        onBlockAdded={(block) => setTimeBlocks((prev) => [...prev, block].sort((a, b) => a.startDate.localeCompare(b.startDate)))}
        onBlockDeleted={(id) => setTimeBlocks((prev) => prev.filter((b) => b.id !== id))}
      />

      {activeGroom && (
        <LiveGroomTracker
          activeGroom={activeGroom}
          onExtend={handleGroomExtend}
          onComplete={handleGroomComplete}
        />
      )}
    </div>
  );
}
