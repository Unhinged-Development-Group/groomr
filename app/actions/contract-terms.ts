"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getGroomerContext(): Promise<{
  profileId: string;
  groomerProfileId: string;
} | null> {
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

async function getOwnerProfileId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

// ---------------------------------------------------------------------------
// saveContractTerms
//
// Publishes a new version of the groomer's terms. Increments version number,
// sets is_current=true on the new row, flips previous rows to is_current=false.
// ---------------------------------------------------------------------------

export async function saveContractTerms(
  content: string,
): Promise<{ termsId: string; version: number } | { error: string }> {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authenticated as a groomer." };

  if (!content.trim()) return { error: "Terms content cannot be empty." };

  // Find current max version
  const { data: existing } = await supabaseAdmin
    .from("contract_terms")
    .select("version")
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const newVersion = (existing?.version ?? 0) + 1;

  // Flip all previous is_current to false
  await supabaseAdmin
    .from("contract_terms")
    .update({ is_current: false })
    .eq("groomer_profile_id", ctx.groomerProfileId);

  // Insert new version
  const { data: inserted, error } = await supabaseAdmin
    .from("contract_terms")
    .insert({
      groomer_profile_id: ctx.groomerProfileId,
      version: newVersion,
      content: content.trim(),
      is_current: true,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("[saveContractTerms]", error);
    return { error: "Failed to publish terms." };
  }

  return { termsId: inserted.id, version: newVersion };
}

// ---------------------------------------------------------------------------
// getContractTerms — groomer reads their current terms
// ---------------------------------------------------------------------------

export async function getContractTerms(): Promise<{
  id: string;
  version: number;
  content: string;
  publishedAt: string;
} | null> {
  const ctx = await getGroomerContext();
  if (!ctx) return null;

  const { data } = await supabaseAdmin
    .from("contract_terms")
    .select("id, version, content, published_at")
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .eq("is_current", true)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    version: data.version,
    content: data.content,
    publishedAt: data.published_at,
  };
}

// ---------------------------------------------------------------------------
// checkTermsAcceptance
//
// Called by the owner's booking flow before payment. Returns whether the
// owner needs to accept the groomer's current terms.
// ---------------------------------------------------------------------------

export async function checkTermsAcceptance(groomerProfileId: string): Promise<{
  needsAcceptance: boolean;
  termsId: string | null;
  content: string | null;
  groomerName: string | null;
}> {
  const ownerId = await getOwnerProfileId();
  if (!ownerId) return { needsAcceptance: false, termsId: null, content: null, groomerName: null };

  // Fetch current terms for this groomer
  const { data: terms } = await supabaseAdmin
    .from("contract_terms")
    .select("id, content")
    .eq("groomer_profile_id", groomerProfileId)
    .eq("is_current", true)
    .maybeSingle();

  if (!terms) {
    // No custom terms set — no acceptance needed
    return { needsAcceptance: false, termsId: null, content: null, groomerName: null };
  }

  // Check if owner has already accepted this version
  const { data: acceptance } = await supabaseAdmin
    .from("contract_acceptances")
    .select("id")
    .eq("groomer_profile_id", groomerProfileId)
    .eq("owner_id", ownerId)
    .eq("contract_terms_id", terms.id)
    .maybeSingle();

  if (acceptance) {
    return { needsAcceptance: false, termsId: terms.id, content: null, groomerName: null };
  }

  // Owner hasn't accepted — fetch groomer name for display
  const { data: gp } = await supabaseAdmin
    .from("groomer_profiles")
    .select("business_name")
    .eq("id", groomerProfileId)
    .maybeSingle();

  return {
    needsAcceptance: true,
    termsId: terms.id,
    content: terms.content,
    groomerName: gp?.business_name ?? null,
  };
}

// ---------------------------------------------------------------------------
// acceptContractTerms — owner agrees to the current terms
// ---------------------------------------------------------------------------

export async function acceptContractTerms(
  groomerProfileId: string,
): Promise<{ ok: true } | { error: string }> {
  const ownerId = await getOwnerProfileId();
  if (!ownerId) return { error: "Not authenticated." };

  const { data: terms } = await supabaseAdmin
    .from("contract_terms")
    .select("id")
    .eq("groomer_profile_id", groomerProfileId)
    .eq("is_current", true)
    .maybeSingle();

  if (!terms) return { ok: true }; // No terms to accept

  const { error } = await supabaseAdmin
    .from("contract_acceptances")
    .upsert(
      {
        groomer_profile_id: groomerProfileId,
        owner_id: ownerId,
        contract_terms_id: terms.id,
        accepted_at: new Date().toISOString(),
      },
      { onConflict: "groomer_profile_id,owner_id,contract_terms_id" },
    );

  if (error) {
    console.error("[acceptContractTerms]", error);
    return { error: "Failed to record acceptance." };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// getClientTermsStatus — groomer sees which clients have/haven't accepted
// ---------------------------------------------------------------------------

export async function getClientTermsStatus(): Promise<
  Array<{
    ownerId: string;
    ownerName: string;
    acceptedVersion: number | null;
    currentVersion: number;
    needsReAcceptance: boolean;
  }>
> {
  const ctx = await getGroomerContext();
  if (!ctx) return [];

  // Get current terms
  const { data: currentTerms } = await supabaseAdmin
    .from("contract_terms")
    .select("id, version")
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .eq("is_current", true)
    .maybeSingle();

  if (!currentTerms) return [];

  // Get all clients (owners who have had appointments with this groomer)
  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("owner_id, profiles!appointments_owner_id_fkey (full_name)")
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .neq("status", "cancelled");

  if (!appointments || appointments.length === 0) return [];

  // Unique owners
  const ownerMap = new Map<string, string>();
  for (const a of appointments) {
    if (a.owner_id && !ownerMap.has(a.owner_id)) {
      const profiles = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
      ownerMap.set(a.owner_id, profiles?.full_name ?? "Unknown");
    }
  }

  // Get acceptances for this groomer's terms
  const { data: acceptances } = await supabaseAdmin
    .from("contract_acceptances")
    .select("owner_id, contract_terms_id, contract_terms!inner(version)")
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .in("owner_id", Array.from(ownerMap.keys()));

  // Map owner_id → highest accepted version
  const ownerAccepted = new Map<string, { termsId: string; version: number }>();
  for (const acc of acceptances ?? []) {
    const terms = Array.isArray(acc.contract_terms) ? acc.contract_terms[0] : acc.contract_terms;
    const version = terms?.version ?? 0;
    const existing = ownerAccepted.get(acc.owner_id);
    if (!existing || version > existing.version) {
      ownerAccepted.set(acc.owner_id, { termsId: acc.contract_terms_id, version });
    }
  }

  return Array.from(ownerMap.entries()).map(([ownerId, ownerName]) => {
    const accepted = ownerAccepted.get(ownerId);
    return {
      ownerId,
      ownerName,
      acceptedVersion: accepted?.version ?? null,
      currentVersion: currentTerms.version,
      needsReAcceptance: !accepted || accepted.termsId !== currentTerms.id,
    };
  });
}
