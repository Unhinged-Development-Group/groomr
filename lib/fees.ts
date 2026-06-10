import { supabaseAdmin } from "@/lib/supabase-admin";
import { PLATFORM_FEE_PCT } from "@/lib/stripe";

/**
 * Resolve the commission rate to charge for a given groomer, server-side only.
 *
 * Rates live in the `platform_settings` singleton (editable from the admin
 * Platform Settings tab). Founding groomers pay `founding_groomer_fee_pct`
 * while their `founding_until` date hasn't passed; the per-groomer date wins
 * over the global `founding_groomer_deadline` fallback. After expiry the
 * standard `platform_fee_pct` applies automatically — no cron or flag-flip.
 */
export async function resolvePlatformFeePct(groomerProfileId: string): Promise<number> {
  const [{ data: settings }, { data: groomer }] = await Promise.all([
    supabaseAdmin
      .from("platform_settings")
      .select("platform_fee_pct, founding_groomer_fee_pct, founding_groomer_deadline")
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("groomer_profiles")
      .select("is_founding_groomer, founding_until")
      .eq("id", groomerProfileId)
      .maybeSingle(),
  ]);

  const standardPct = clampPct(settings?.platform_fee_pct ?? PLATFORM_FEE_PCT);

  if (!groomer?.is_founding_groomer) return standardPct;

  // Per-groomer end date wins; global deadline is the fallback; null = no expiry
  const until: string | null = groomer.founding_until ?? settings?.founding_groomer_deadline ?? null;
  const today = new Date().toISOString().slice(0, 10);
  const foundingActive = !until || until >= today;

  return foundingActive ? clampPct(settings?.founding_groomer_fee_pct ?? 0) : standardPct;
}

function clampPct(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return PLATFORM_FEE_PCT;
  return Math.min(1, Math.max(0, n));
}
