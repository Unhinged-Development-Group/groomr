"use client";

import { useState, useRef, useEffect } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  AnalyticsIcon,
  ScissorsIcon,
  PetsIcon,
  ShieldIcon,
  MessagesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/ui/GroomrIcons";
import { cn } from "@/lib/utils";
import { OverviewTab } from "./OverviewTab";
import { GroomersTab } from "./GroomersTab";
import { UsersTab } from "./UsersTab";
import { DisputesTab } from "./DisputesTab";
import { SupportTab } from "./SupportTab";
import type {
  AdminOverviewStats,
  AdminGroomerRow,
  AdminUserRow,
  AdminDisputeRow,
  AdminSupportRow,
} from "@/app/actions/admin";

type Tab = "overview" | "groomers" | "users" | "disputes" | "support";

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "overview",  label: "Overview",  Icon: AnalyticsIcon },
  { id: "groomers",  label: "Groomers",  Icon: ScissorsIcon },
  { id: "users",     label: "Users",     Icon: PetsIcon },
  { id: "disputes",  label: "Disputes",  Icon: ShieldIcon },
  { id: "support",   label: "Support",   Icon: MessagesIcon },
];

interface Props {
  adminName: string;
  initialStats: AdminOverviewStats | null;
  initialGroomers: AdminGroomerRow[];
  initialUsers: AdminUserRow[];
  initialDisputes: AdminDisputeRow[];
  initialSupport: AdminSupportRow[];
}

export function AdminDashboardClient({
  adminName,
  initialStats,
  initialGroomers,
  initialUsers,
  initialDisputes,
  initialSupport,
}: Props) {
  const [tab, setTab] = useState<Tab>("overview");

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

  useEffect(() => { updateTabScroll(); }, []);

  // Badge counts for tab indicators
  const openDisputes = initialDisputes.filter((d) => d.status === "open").length;
  const openSupport = initialSupport.filter((s) => s.status === "open").length;

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-8 space-y-7">
      {/* Header */}
      <header className="space-y-1">
        <Eyebrow>Admin dashboard</Eyebrow>
        <h1 className="font-fredoka text-3xl md:text-4xl text-deep-slate leading-tight">
          Platform Control
        </h1>
        <p className="text-sm text-pebble-grey font-bold">Signed in as {adminName}</p>
      </header>

      {/* Tab nav */}
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
          className="flex sm:grid sm:grid-cols-5 gap-1 overflow-x-auto pb-0.5 sm:overflow-visible scrollbar-none"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            const badge = t.id === "disputes" ? openDisputes : t.id === "support" ? openSupport : 0;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-nunito font-bold text-sm transition-colors focus-ring shrink-0 sm:shrink whitespace-nowrap",
                  active ? "bg-groomr-gold text-deep-slate" : "text-deep-slate hover:bg-alabaster-cream"
                )}
              >
                <t.Icon size={18} />
                {t.label}
                {badge > 0 && (
                  <span className={cn(
                    "min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center",
                    active ? "bg-deep-slate text-alabaster-cream" : "bg-muted-terracotta text-alabaster-cream"
                  )}>
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

      {/* Tab content */}
      {tab === "overview"  && <OverviewTab stats={initialStats} />}
      {tab === "groomers"  && <GroomersTab initialGroomers={initialGroomers} />}
      {tab === "users"     && <UsersTab initialUsers={initialUsers} />}
      {tab === "disputes"  && <DisputesTab initialDisputes={initialDisputes} />}
      {tab === "support"   && <SupportTab initialSupport={initialSupport} />}
    </div>
  );
}
