import { supabaseAdmin } from "@/lib/supabase-admin";
import { PLATFORM_FEE_PCT } from "@/lib/stripe";

/**
 * Sign-up incentive (public/policies/groomer-sign-up-incentive.html):
 * every groomer's first N completed bookings are commission-free — N comes
 * from `platform_settings.signup_incentive_bookings` (150). A completed
 * booking is one marked completed on the platform and not fully refunded;
 * cancellations and no-shows never reach 'completed' status so are excluded
 * automatically. Partial refunds still count toward the total.
 *
 * Founding groomer is a status badge only — it carries no fee implications.
 */

export interface IncentiveUsage {
  used: number;      // completed, not-fully-refunded bookings to date
  limit: number;     // signup_incentive_bookings from platform_settings
  remaining: number;
  active: boolean;   // true while the groomer is still inside the free allowance
}

export async function getIncentiveUsage(groomerProfileId: string): Promise<IncentiveUsage> {
  const [{ data: settings }, completedRes, refundedRes] = await Promise.all([
    supabaseAdmin
      .from("platform_settings")
      .select("signup_incentive_bookings")
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("groomer_profile_id", groomerProfileId)
      .eq("status", "completed"),
    supabaseAdmin
      .from("payments")
      .select("id, appointments!inner(groomer_profile_id)", { count: "exact", head: true })
      .eq("appointments.groomer_profile_id", groomerProfileId)
      .eq("refund_status", "full"),
  ]);

  const limit = settings?.signup_incentive_bookings ?? 150;
  const used = Math.max(0, (completedRes.count ?? 0) - (refundedRes.count ?? 0));
  const remaining = Math.max(0, limit - used);
  return { used, limit, remaining, active: used < limit };
}

/**
 * Resolve the commission rate to charge for a given groomer, server-side only.
 * 0% while the sign-up incentive allowance lasts; afterwards the live
 * `platform_settings.platform_fee_pct` (PLATFORM_FEE_PCT is the fallback if
 * the settings row is unreadable).
 */
export async function resolvePlatformFeePct(groomerProfileId: string): Promise<number> {
  const [{ data: settings }, usage] = await Promise.all([
    supabaseAdmin
      .from("platform_settings")
      .select("platform_fee_pct")
      .limit(1)
      .maybeSingle(),
    getIncentiveUsage(groomerProfileId),
  ]);

  if (usage.active) return 0;
  return clampPct(settings?.platform_fee_pct ?? PLATFORM_FEE_PCT);
}

function clampPct(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return PLATFORM_FEE_PCT;
  return Math.min(1, Math.max(0, n));
}
