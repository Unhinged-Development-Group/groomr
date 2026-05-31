"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getGroomerContext(): Promise<{ profileId: string; groomerProfileId: string } | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", userId)
    .maybeSingle();
  if (!profile) return null;

  const { data: gp } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!gp) return null;

  return { profileId: profile.id, groomerProfileId: gp.id };
}

// ---------------------------------------------------------------------------
// Deposit override
// ---------------------------------------------------------------------------

export async function upsertDepositOverride(input: {
  ownerProfileId: string;
  depositOverride: "inherit" | "none";
}): Promise<{ ok: true } | { error: string }> {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authenticated as a groomer." };

  const { error } = await supabaseAdmin
    .from("client_settings")
    .upsert(
      {
        groomer_profile_id: ctx.groomerProfileId,
        owner_id: input.ownerProfileId,
        deposit_override: input.depositOverride,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "groomer_profile_id,owner_id" },
    );

  if (error) {
    console.error("[upsertDepositOverride]", error);
    return { error: "Failed to save deposit override." };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Read client settings (called from ClientModal on open)
// ---------------------------------------------------------------------------

export async function getClientSettings(ownerProfileId: string): Promise<{
  depositOverride: "inherit" | "none";
  discountPercentage: number | null;
} | null> {
  const ctx = await getGroomerContext();
  if (!ctx) return null;

  const { data } = await supabaseAdmin
    .from("client_settings")
    .select("deposit_override, discount_percentage")
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .eq("owner_id", ownerProfileId)
    .maybeSingle();

  if (!data) return null;

  return {
    depositOverride: (data.deposit_override as "inherit" | "none") ?? "inherit",
    discountPercentage: data.discount_percentage ?? null,
  };
}

// ---------------------------------------------------------------------------
// Pricing override (discount % + per-service fixed prices)
// ---------------------------------------------------------------------------

export async function saveClientPricing(input: {
  ownerProfileId: string;
  discountPercentage: number | null;
  serviceOverrides: Array<{ serviceId: string; overridePricePence: number }>;
}): Promise<{ ok: true } | { error: string }> {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authenticated as a groomer." };

  // Upsert discount on client_settings row
  const { error: settingsErr } = await supabaseAdmin
    .from("client_settings")
    .upsert(
      {
        groomer_profile_id: ctx.groomerProfileId,
        owner_id: input.ownerProfileId,
        discount_percentage: input.discountPercentage,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "groomer_profile_id,owner_id" },
    );

  if (settingsErr) {
    console.error("[saveClientPricing] settings:", settingsErr);
    return { error: "Failed to save pricing settings." };
  }

  // Replace service overrides: delete then insert
  await supabaseAdmin
    .from("client_service_prices")
    .delete()
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .eq("owner_id", input.ownerProfileId);

  if (input.serviceOverrides.length > 0) {
    const { error: pricesErr } = await supabaseAdmin
      .from("client_service_prices")
      .insert(
        input.serviceOverrides.map(({ serviceId, overridePricePence }) => ({
          groomer_profile_id: ctx.groomerProfileId,
          owner_id: input.ownerProfileId,
          service_id: serviceId,
          override_price_pence: overridePricePence,
        })),
      );

    if (pricesErr) {
      console.error("[saveClientPricing] prices:", pricesErr);
      return { error: "Failed to save service price overrides." };
    }
  }

  return { ok: true };
}

export async function getClientPricing(ownerProfileId: string): Promise<{
  discountPercentage: number | null;
  serviceOverrides: Array<{ serviceId: string; overridePricePence: number }>;
}> {
  const ctx = await getGroomerContext();
  if (!ctx) return { discountPercentage: null, serviceOverrides: [] };

  const [settingsRes, pricesRes] = await Promise.all([
    supabaseAdmin
      .from("client_settings")
      .select("discount_percentage")
      .eq("groomer_profile_id", ctx.groomerProfileId)
      .eq("owner_id", ownerProfileId)
      .maybeSingle(),
    supabaseAdmin
      .from("client_service_prices")
      .select("service_id, override_price_pence")
      .eq("groomer_profile_id", ctx.groomerProfileId)
      .eq("owner_id", ownerProfileId),
  ]);

  return {
    discountPercentage: settingsRes.data?.discount_percentage ?? null,
    serviceOverrides: (pricesRes.data ?? []).map((p) => ({
      serviceId: p.service_id,
      overridePricePence: p.override_price_pence,
    })),
  };
}
