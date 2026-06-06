"use client";

import { useState, useRef, useEffect } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  AnalyticsIcon,
  ScissorsIcon,
  PetsIcon,
  ShieldIcon,
  MessagesIcon,
  CalendarIcon,
  FinancialsIcon,
  AccountIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/ui/GroomrIcons";
import { cn } from "@/lib/utils";
import { SnapshotBar } from "./SnapshotBar";
import { OverviewTab } from "./OverviewTab";
import { GroomersTab } from "./GroomersTab";
import { UsersTab } from "./UsersTab";
import { DisputesTab } from "./DisputesTab";
import { SupportTab } from "./SupportTab";
import { AppointmentsTab } from "./AppointmentsTab";
import { FinancialsTab } from "./FinancialsTab";
import { TeamTab } from "./TeamTab";
import { PlatformSettingsTab } from "./PlatformSettingsTab";
import { AuditLogTab } from "./AuditLogTab";
import { GroomrSupportTab } from "./GroomrSupportTab";
import type {
  AdminOverviewStats,
  AdminGroomerRow,
  AdminUserRow,
  AdminDisputeRow,
  AdminSupportRow,
  AdminAppointmentRow,
  AdminPreferences,
  AdminFinancials,
  AdminTeamMember,
  PlatformSettings,
  AdminAuditEntry,
} from "@/app/actions/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "user_management" | "groomr_management";
type UserTab = "overview" | "groomers" | "users" | "appointments" | "disputes" | "support";
type GroomrTab = "financials" | "team" | "platform_settings" | "audit_log" | "groomr_support";

interface TabDef {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

const MODES: { id: Mode; label: string }[] = [
  { id: "user_management",  label: "User Management" },
  { id: "groomr_management", label: "Groomr Management" },
];

const USER_TABS: TabDef[] = [
  { id: "overview",     label: "Overview",     Icon: AnalyticsIcon },
  { id: "groomers",     label: "Groomers",     Icon: ScissorsIcon },
  { id: "users",        label: "Users",        Icon: PetsIcon },
  { id: "appointments", label: "Appointments", Icon: CalendarIcon },
  { id: "disputes",     label: "Disputes",     Icon: ShieldIcon },
  { id: "support",      label: "Support",      Icon: MessagesIcon },
];

const GROOMR_TABS: TabDef[] = [
  { id: "financials",        label: "Financials",  Icon: FinancialsIcon },
  { id: "team",              label: "Team",         Icon: AccountIcon },
  { id: "platform_settings", label: "Settings",     Icon: SettingsIcon },
  { id: "audit_log",         label: "Audit Log",    Icon: ShieldIcon },
  { id: "groomr_support",    label: "Support",      Icon: MessagesIcon },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  adminName: string;
  // User Management
  initialStats: AdminOverviewStats | null;
  initialGroomers: AdminGroomerRow[];
  initialUsers: AdminUserRow[];
  initialDisputes: AdminDisputeRow[];
  initialSupport: AdminSupportRow[];
  initialAppointments: AdminAppointmentRow[];
  initialPreferences: AdminPreferences;
  // Groomr Management
  initialFinancials: AdminFinancials | null;
  initialTeam: AdminTeamMember[];
  initialPlatformSettings: PlatformSettings | null;
  initialAuditLog: AdminAuditEntry[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminDashboardClient({
  adminName,
  initialStats,
  initialGroomers,
  initialUsers,
  initialDisputes,
  initialSupport,
  initialAppointments,
  initialPreferences,
  initialFinancials,
  initialTeam,
  initialPlatformSettings,
  initialAuditLog,
}: Props) {
  const [mode, setMode] = useState<Mode>("user_management");
  const [activeUserTab, setActiveUserTab] = useState<UserTab>("overview");
  const [activeGroomrTab, setActiveGroomrTab] = useState<GroomrTab>("financials");

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

  useEffect(() => { updateTabScroll(); }, [mode]);

  // ── Badge counts ──
  const openDisputes = initialDisputes.filter((d) => d.status === "open").length;
  const openSupport = initialSupport.filter((s) => s.status === "open").length;
  const pendingPayoutsCount = initialFinancials?.pendingPayoutsCount ?? 0;

  function getBadge(tabId: string): number {
    if (mode === "user_management") {
      if (tabId === "disputes") return openDisputes;
      if (tabId === "support") return openSupport;
    } else {
      if (tabId === "financials") return pendingPayoutsCount;
      if (tabId === "groomr_support") return openSupport;
    }
    return 0;
  }

  const currentTabs = mode === "user_management" ? USER_TABS : GROOMR_TABS;
  const currentActiveTab = mode === "user_management" ? activeUserTab : activeGroomrTab;

  function setActiveTab(id: string) {
    if (mode === "user_management") setActiveUserTab(id as UserTab);
    else setActiveGroomrTab(id as GroomrTab);
  }

  function handleModeSwitch(newMode: Mode) {
    setMode(newMode);
    if (tabScrollRef.current) tabScrollRef.current.scrollLeft = 0;
  }

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-8 space-y-7">
      {/* Header */}
      <header className="space-y-3">
        <div className="space-y-1">
          <Eyebrow>Admin dashboard</Eyebrow>
          <h1 className="font-fredoka text-3xl md:text-4xl text-deep-slate leading-tight">
            Platform Control
          </h1>
          <p className="text-sm text-pebble-grey font-bold">Signed in as {adminName}</p>
        </div>

        {/* Pinned snapshots */}
        <SnapshotBar
          initialSnapshots={initialPreferences.snapshots}
          stats={initialStats}
          financials={initialFinancials}
        />
      </header>

      {/* Mode switcher + tab nav — grouped so they read as one nav unit */}
      <div className="space-y-2">
        {/* Mode switcher */}
        <div className="flex gap-1 bg-white border border-pebble-grey/20 rounded-[20px] p-1.5 w-fit shadow-subtle">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => handleModeSwitch(m.id)}
              className={cn(
                "px-5 py-2 rounded-[14px] font-nunito font-bold text-sm transition-all focus-ring whitespace-nowrap",
                mode === m.id
                  ? "bg-deep-slate text-alabaster-cream shadow-sm"
                  : "text-pebble-grey hover:text-deep-slate"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Tab bar */}
        <nav className="bg-white border border-pebble-grey/20 rounded-[20px] p-2 shadow-subtle relative">
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
            className="flex gap-1 overflow-x-auto pb-0.5 sm:overflow-visible scrollbar-none"
          >
            {currentTabs.map((t) => {
              const active = currentActiveTab === t.id;
              const badge = getBadge(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-nunito font-bold text-sm transition-colors focus-ring shrink-0 sm:shrink whitespace-nowrap min-w-[90px]",
                    active ? "bg-groomr-gold text-deep-slate" : "text-deep-slate hover:bg-alabaster-cream"
                  )}
                >
                  <t.Icon size={18} />
                  {t.label}
                  {badge > 0 && (
                    <span
                      className={cn(
                        "min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center",
                        active
                          ? "bg-deep-slate text-alabaster-cream"
                          : "bg-muted-terracotta text-alabaster-cream"
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

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
      </div>

      {/* ── User Management tab content ─────────────────────────────────── */}
      {mode === "user_management" && activeUserTab === "overview" && (
        <OverviewTab stats={initialStats} />
      )}
      {mode === "user_management" && activeUserTab === "groomers" && (
        <GroomersTab initialGroomers={initialGroomers} />
      )}
      {mode === "user_management" && activeUserTab === "users" && (
        <UsersTab initialUsers={initialUsers} />
      )}
      {mode === "user_management" && activeUserTab === "appointments" && (
        <AppointmentsTab initialAppointments={initialAppointments} />
      )}
      {mode === "user_management" && activeUserTab === "disputes" && (
        <DisputesTab initialDisputes={initialDisputes} />
      )}
      {mode === "user_management" && activeUserTab === "support" && (
        <SupportTab initialSupport={initialSupport} />
      )}

      {/* ── Groomr Management tab content ──────────────────────────────── */}
      {mode === "groomr_management" && activeGroomrTab === "financials" && (
        <FinancialsTab financials={initialFinancials} />
      )}
      {mode === "groomr_management" && activeGroomrTab === "team" && (
        <TeamTab initialTeam={initialTeam} />
      )}
      {mode === "groomr_management" && activeGroomrTab === "platform_settings" && (
        <PlatformSettingsTab settings={initialPlatformSettings} />
      )}
      {mode === "groomr_management" && activeGroomrTab === "audit_log" && (
        <AuditLogTab initialEntries={initialAuditLog} />
      )}
      {mode === "groomr_management" && activeGroomrTab === "groomr_support" && (
        <GroomrSupportTab initialSupport={initialSupport} />
      )}
    </div>
  );
}
