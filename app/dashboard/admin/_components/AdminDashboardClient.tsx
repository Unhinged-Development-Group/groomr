"use client";

import { useState, useRef, useEffect } from "react";
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

type Mode = "overview" | "user_management" | "groomr_management";
type UserTab = "groomers" | "users" | "appointments" | "disputes" | "support";
type GroomrTab = "financials" | "team" | "platform_settings" | "audit_log" | "groomr_support";

interface TabDef {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

const MODES: { id: Mode; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "overview",          label: "Overview",          Icon: AnalyticsIcon },
  { id: "user_management",   label: "User Management",   Icon: PetsIcon },
  { id: "groomr_management", label: "Groomr Management", Icon: ScissorsIcon },
];

const USER_TABS: TabDef[] = [
  { id: "groomers",     label: "Groomers",     Icon: ScissorsIcon },
  { id: "users",        label: "Owners",       Icon: PetsIcon },
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
  platformSettingsError: string | null;
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
  platformSettingsError,
  initialAuditLog,
}: Props) {
  const [mode, setMode] = useState<Mode>("overview");
  const [activeUserTab, setActiveUserTab] = useState<UserTab>("groomers");
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

  function handleOverviewNavigate(newMode: Mode, tab?: string) {
    setMode(newMode);
    if (tab && newMode === "user_management") setActiveUserTab(tab as UserTab);
    if (tab && newMode === "groomr_management") setActiveGroomrTab(tab as GroomrTab);
    if (tabScrollRef.current) tabScrollRef.current.scrollLeft = 0;
  }

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-8 space-y-7">
      {/* Header — title + snapshots inline, left-aligned */}
      <header className="flex items-center gap-6 flex-wrap">
        <div className="space-y-1 shrink-0">
          <h1 className="font-fredoka text-3xl md:text-4xl text-deep-slate leading-tight">
            Platform Control
          </h1>
          <p className="text-sm text-pebble-grey font-bold">Signed in as {adminName}</p>
        </div>

        {/* flex-1 so the bar stretches to match the tab bar's full width */}
        <div className="flex-1 min-w-0">
          <SnapshotBar
            initialSnapshots={initialPreferences.snapshots}
            stats={initialStats}
            financials={initialFinancials}
          />
        </div>
      </header>

      {/* Nav — primary mode pill bar always visible; sub-tabs slide in below */}
      <div className="space-y-2">
        {/* Primary pill bar — all 3 modes always present */}
        <nav className="bg-white border border-pebble-grey/20 rounded-[20px] p-2 shadow-subtle">
          <div className="flex gap-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => handleModeSwitch(m.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-nunito font-bold text-sm transition-colors focus-ring whitespace-nowrap",
                  mode === m.id ? "bg-groomr-gold text-deep-slate" : "text-deep-slate hover:bg-alabaster-cream"
                )}
              >
                <m.Icon size={18} className="shrink-0" />
                <span className="hidden sm:inline">{m.label}</span>
                <span className="sm:hidden">{m.id === "groomr_management" ? "Groomr" : m.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Secondary sub-tab row — animates in/out below the primary bar */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            mode === "overview" ? "max-h-0 opacity-0" : "max-h-20 opacity-100"
          )}
        >
          <nav className="bg-white border border-pebble-grey/20 rounded-[20px] p-1.5 shadow-subtle relative">
            {tabScroll.left && (
              <button
                aria-hidden
                onClick={() => { tabScrollRef.current?.scrollBy({ left: -160, behavior: "smooth" }); }}
                className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/95 shadow-subtle border border-pebble-grey/20 flex items-center justify-center"
              >
                <ChevronLeftIcon size={12} />
              </button>
            )}

            <div
              ref={tabScrollRef}
              onScroll={updateTabScroll}
              className="flex gap-1 overflow-x-auto sm:overflow-visible scrollbar-none"
            >
              {currentTabs.map((t) => {
                const active = currentActiveTab === t.id;
                const badge = getBadge(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl font-nunito font-bold text-xs transition-colors focus-ring shrink-0 sm:shrink whitespace-nowrap min-w-[72px]",
                      active
                        ? "bg-groomr-gold/40 text-deep-slate"
                        : "text-pebble-grey hover:text-deep-slate hover:bg-alabaster-cream"
                    )}
                  >
                    <t.Icon size={14} className="shrink-0" />
                    {t.label}
                    {badge > 0 && (
                      <span
                        className={cn(
                          "min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center",
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
                className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/95 shadow-subtle border border-pebble-grey/20 flex items-center justify-center"
              >
                <ChevronRightIcon size={12} />
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* ── Overview (top-level mode) ───────────────────────────────────── */}
      {mode === "overview" && (
        <OverviewTab
          stats={initialStats}
          platformSettings={initialPlatformSettings}
          onNavigate={handleOverviewNavigate}
        />
      )}

      {/* ── User Management tab content ─────────────────────────────────── */}
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
        <PlatformSettingsTab settings={initialPlatformSettings} loadError={platformSettingsError} />
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
