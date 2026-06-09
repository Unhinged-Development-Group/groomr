import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Vercel Cron: daily GDPR cleanup of soft-deleted profiles (S7b).
// vercel.json: { "crons": [{ "path": "/api/cron/cleanup", "schedule": "30 3 * * *" }] }
//
// Profiles soft-deleted more than 30 days ago are either:
//  - hard-deleted, when they have no financial records or disputes (FK cascades
//    remove dogs, groomer_profiles, favourites, client settings, etc.), or
//  - anonymised, when appointments/payments must be retained for the UK 7-year
//    tax window: PII is scrubbed from the profile but the rows stay.
// Profiles with an unresolved dispute are skipped until the dispute closes,
// so admins can still see who the parties are while adjudicating.

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

  const { data: candidates, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("is_deleted", true)
    .is("anonymised_at", null)
    .lt("deleted_at", cutoff)
    .limit(200);

  if (error) {
    console.error("[cron/cleanup] Failed to fetch candidates:", error.message);
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }

  let deleted = 0;
  let anonymised = 0;
  let skipped = 0;
  let errors = 0;

  for (const profile of candidates ?? []) {
    try {
      const outcome = await processProfile(profile.id);
      if (outcome === "deleted") deleted++;
      else if (outcome === "anonymised") anonymised++;
      else skipped++;
    } catch (err) {
      errors++;
      console.error(`[cron/cleanup] Failed to process profile ${profile.id}:`, err);
    }
  }

  console.log(
    `[cron/cleanup] candidates=${candidates?.length ?? 0} deleted=${deleted} anonymised=${anonymised} skipped=${skipped} errors=${errors}`,
  );

  // Summary counts only — never echo DB rows back in the response body (S14)
  return NextResponse.json({ candidates: candidates?.length ?? 0, deleted, anonymised, skipped, errors });
}

async function processProfile(profileId: string): Promise<"deleted" | "anonymised" | "skipped"> {
  // Unresolved dispute → leave the profile intact until it closes
  const { count: openDisputes } = await supabaseAdmin
    .from("disputes")
    .select("id", { count: "exact", head: true })
    .or(`owner_id.eq.${profileId},groomer_id.eq.${profileId}`)
    .neq("status", "resolved");

  if ((openDisputes ?? 0) > 0) return "skipped";

  // Financial footprint: appointments as an owner, appointments via a groomer
  // profile, or tips. Payments hang off appointments, and appointments
  // themselves are retained records — any of these forces anonymisation
  // instead of deletion (and appointments.owner_id has no ON DELETE rule,
  // so a hard delete would be blocked by the FK anyway).
  const { data: groomerProfile } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("user_id", profileId)
    .maybeSingle();

  const [{ count: ownerAppts }, { count: groomerAppts }, { count: tipCount }] = await Promise.all([
    supabaseAdmin
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", profileId),
    groomerProfile
      ? supabaseAdmin
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("groomer_profile_id", groomerProfile.id)
      : Promise.resolve({ count: 0 }),
    supabaseAdmin.from("tips").select("id", { count: "exact", head: true }).eq("owner_id", profileId),
  ]);

  const hasFinancialRecords = (ownerAppts ?? 0) > 0 || (groomerAppts ?? 0) > 0 || (tipCount ?? 0) > 0;

  if (!hasFinancialRecords) {
    // No retention obligation — hard delete; FK cascades clean up the rest
    const { error } = await supabaseAdmin.from("profiles").delete().eq("id", profileId);
    if (error) throw new Error(`hard delete failed: ${error.message}`);
    await logCleanupAction("hard_delete_profile", profileId);
    return "deleted";
  }

  // Retention required — scrub PII, keep financial rows.
  // Dogs and favourites carry no retention obligation (closeOwnerAccount already
  // removes them, but Clerk-dashboard deletions arrive via webhook and don't).
  await supabaseAdmin.from("favourite_groomers").delete().eq("owner_id", profileId);
  await supabaseAdmin.from("dogs").delete().eq("owner_id", profileId);

  if (groomerProfile) {
    await supabaseAdmin
      .from("groomer_profiles")
      .update({
        bank_account_holder: null,
        bank_sort_code: null,
        bank_account_number: null,
        is_listed: false,
        is_accepting_bookings: false,
      })
      .eq("id", groomerProfile.id);
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      full_name: "Deleted user",
      email: null,
      phone: null,
      avatar_url: null,
      clerk_id: null,
      anonymised_at: new Date().toISOString(),
    })
    .eq("id", profileId);
  if (error) throw new Error(`anonymise failed: ${error.message}`);

  await logCleanupAction("anonymise_profile", profileId);
  return "anonymised";
}

async function logCleanupAction(action: string, profileId: string) {
  // Fire-and-forget — audit failure must not abort the cleanup
  try {
    await supabaseAdmin.from("admin_audit_log").insert({
      admin_profile_id: null,
      action,
      target_table: "profiles",
      target_id: profileId,
      metadata: { source: "cron/cleanup" },
    });
  } catch (err) {
    console.error("[cron/cleanup] Failed to write audit log entry:", err);
  }
}
