/**
 * NEW TAB TEMPLATE — copy this file and follow each step.
 *
 * CHECKLIST FOR ADDING A NEW ADMIN TAB
 * ─────────────────────────────────────
 * 1. server action  → app/actions/admin.ts
 *    - export interface MyTabData { ... }
 *    - export async function adminGetMyTab(): Promise<{ data: MyTabData } | { error: string }>
 *    - add requireAdmin() guard, return { error } on fail
 *
 * 2. page.tsx       → app/dashboard/admin/page.tsx
 *    - import adminGetMyTab from actions
 *    - add to Promise.all:  adminGetMyTab()
 *    - pass to AdminDashboardClient:  initialMyTab={"error" in myTab ? fallback : myTab.data}
 *
 * 3. AdminDashboardClient.tsx
 *    - add tab id to the correct type union:
 *        type UserTab = "overview" | ... | "my_tab"
 *        type GroomrTab = "financials" | ... | "my_tab"
 *    - add entry to USER_TABS or GROOMR_TABS:
 *        { id: "my_tab", label: "My Tab", Icon: SomeIcon }
 *    - add to Props:  initialMyTab: MyTabData | null
 *    - add render line in the tab content block:
 *        {activeGroomrTab === "my_tab" && <MyTab initialData={initialMyTab} />}
 *
 * 4. This file → copy, rename to MyTab.tsx, implement below.
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
 * Action button (sage):
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
 */
