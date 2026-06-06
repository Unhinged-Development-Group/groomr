/**
 * NEW TAB TEMPLATE — copy this file and follow each step.
 *
 * CHECKLIST FOR ADDING A NEW ADMIN TAB
 * ─────────────────────────────────────
 * 1. server action  → app/actions/admin.ts
 *    - export interface MyTabData { ... }
 *    - export async function adminGetMyTab(): Promise<{ data: MyTabData } | { error: string }>
 *    - add requireAdmin() guard, return { error } on fail
 *    - fire logAdminAction(guard.profileId, "my_action", "my_table", targetId) for any mutating ops
 *
 * 2. page.tsx       → app/dashboard/admin/page.tsx
 *    - import adminGetMyTab from actions
 *    - add to Promise.all:  adminGetMyTab()
 *    - pass to AdminDashboardClient:  initialMyTab={"error" in myTab ? fallback : myTab.data}
 *
 * 3. AdminDashboardClient.tsx
 *    - add tab id to the correct type union:
 *        type UserTab  = "overview" | ... | "my_tab"   ← User Management tabs
 *        type GroomrTab = "financials" | ... | "my_tab" ← Groomr Management tabs
 *    - add entry to USER_TABS or GROOMR_TABS array:
 *        { id: "my_tab", label: "My Tab", Icon: SomeIcon }
 *      Available icons (GroomrIcons.tsx):
 *        AnalyticsIcon  ScissorsIcon  PetsIcon  CalendarIcon  ShieldIcon  MessagesIcon
 *        FinancialsIcon AccountIcon   SettingsIcon  ReviewsIcon  GalleryIcon  PinIcon
 *    - add badge count to getBadge() if the tab needs a live counter:
 *        if (tabId === "my_tab") return someOpenCount;
 *    - add to Props:  initialMyTab: MyTabData | null
 *    - add render block in the tab content area:
 *        {mode === "groomr_management" && activeGroomrTab === "my_tab" && (
 *          <MyTab initialData={initialMyTab} />
 *        )}
 *
 * 4. SnapshotBar.tsx — optionally expose new metrics
 *    - Add entries to SNAPSHOT_METRICS if your tab surfaces data worth pinning:
 *        { key: "my_metric", label: "My metric", category: "Revenue",
 *          getValue: (s, f) => f ? gbp(f.myFieldPence) : "—" }
 *    - AdminOverviewStats feeds "Users" and "Bookings" category metrics
 *    - AdminFinancials feeds "Revenue" category metrics
 *    - If your data lives in neither, add a third prop to SnapshotBar and thread it through
 *      AdminDashboardClient (see how initialFinancials is passed today)
 *
 * 5. This file → copy, rename to MyTab.tsx, implement below.
 */

"use client";

import { useState, useTransition } from "react";
import { Toast } from "@/components/ui/Toast";
// import { someAdminAction } from "@/app/actions/admin";
// import type { MyTabData } from "@/app/actions/admin";

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  // initialData: MyTabData | null;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function NewTab({}: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Example server action call pattern:
  // function handleAction() {
  //   startTransition(async () => {
  //     const result = await someAdminAction(id);
  //     if ("error" in result) {
  //       setToast(result.error);
  //     } else {
  //       setToast("Done.");
  //       // update local state
  //     }
  //   });
  // }

  return (
    <>
      <div className="space-y-4">
        {/* Tab content goes here */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-8 text-center">
          <p className="text-pebble-grey font-bold">Tab content</p>
        </div>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

/**
 * STANDARD PATTERNS (quick reference)
 * ─────────────────────────────────────
 *
 * Stat card:
 *   <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 space-y-1">
 *     <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">{label}</p>
 *     <p className="font-fredoka text-3xl text-deep-slate">{value}</p>
 *   </div>
 *
 * Section heading:
 *   <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">{title}</p>
 *
 * Table:
 *   <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
 *     <div className="overflow-x-auto">
 *       <table className="w-full text-sm">
 *         <thead><tr className="border-b border-pebble-grey/10">...</tr></thead>
 *         <tbody className="divide-y divide-pebble-grey/10">...</tbody>
 *       </table>
 *     </div>
 *   </div>
 *
 * Action button (sage / positive):
 *   className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold
 *     bg-sage-leaf/10 text-sage-leaf hover:bg-sage-leaf/20 border border-sage-leaf/30
 *     transition-colors focus-ring disabled:opacity-50"
 *
 * Action button (terracotta / destructive):
 *   className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold
 *     bg-muted-terracotta/10 text-muted-terracotta hover:bg-muted-terracotta/20
 *     border border-muted-terracotta/30 transition-colors focus-ring disabled:opacity-50"
 *
 * Currency formatting:
 *   (pence / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })
 *
 * Date formatting:
 *   new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
 *
 * Empty state:
 *   <div className="py-12 text-center text-pebble-grey font-bold">No items found.</div>
 *
 * ─── SNAPSHOT QUICK REFERENCE ─────────────────────────────────────────────────
 *
 * The snapshot bar shows up to 4 circular metric tiles inline with the
 * "Platform Control" heading. One empty slot is visible at a time — after the
 * user pins a metric the next slot appears (progressive reveal, up to 4 total).
 *
 * Slot states:
 *   Empty  — dashed-border circle, PlusIcon, onClick → MetricPicker modal
 *   Filled — white circle with label + value; hover overlay shows Change / Remove
 *
 * Metric definition shape (in SnapshotBar.tsx → SNAPSHOT_METRICS):
 *   {
 *     key:      string,                       // unique, e.g. "my_metric"
 *     label:    string,                       // short display name (fits ~2 lines in circle)
 *     category: "Users" | "Bookings" | "Revenue",
 *     getValue: (stats: AdminOverviewStats | null,
 *                financials: AdminFinancials | null) => string,
 *   }
 *
 * Persistence:
 *   Slot choices are stored in profiles.admin_preferences jsonb
 *   as { snapshots: (string | null)[] } (4 entries, nulls for empty slots).
 *   Saved via adminSavePreferences({ snapshots: next }) — already wired.
 *
 * To add a metric surfaced by a NEW third data source:
 *   1. Add a prop to SnapshotBar:  myData: MyTabData | null
 *   2. Add a prop to AdminDashboardClient and pass it through
 *   3. Update getValue signature to accept (stats, financials, myData)
 *      and update all existing getValue calls to pass undefined for the new arg
 */
