"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendAccountDeletionEmail } from "@/lib/account-export";
import { redirect } from "next/navigation";

export async function exportAccountData(): Promise<{ data: Record<string, unknown> } | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("clerk_id", userId)
    .maybeSingle();

  if (!profile) return { error: "Profile not found" };

  const profileId = profile.id;

  const [
    { data: dogs },
    { data: appointments },
    { data: favourites },
  ] = await Promise.all([
    supabaseAdmin.from("dogs").select("*").eq("owner_id", profileId),
    supabaseAdmin
      .from("appointments")
      .select(`
        *,
        dogs (name, breed),
        groomer_profiles (business_name)
      `)
      .eq("owner_id", profileId)
      .order("scheduled_at", { ascending: false }),
    supabaseAdmin.from("favourite_groomers").select("*, groomer_profiles (business_name)").eq("owner_id", profileId),
  ]);

  return {
    data: {
      exported_at: new Date().toISOString(),
      profile: {
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        created_at: profile.created_at,
      },
      dogs: dogs ?? [],
      appointments: appointments ?? [],
      favourites: favourites ?? [],
    },
  };
}

export async function closeOwnerAccount(): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name")
    .eq("clerk_id", userId)
    .maybeSingle();

  if (!profile) return { error: "Profile not found" };

  const profileId = (profile as any).id as string;

  // Soft-delete profile — retained 30 days for dispute/financial lookups (UK GDPR).
  // Operational data (dogs, favourites, etc.) is cleaned up by the 30-day cron so it
  // remains available to the export link during the window.
  await supabaseAdmin
    .from("profiles")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", profileId);

  // Send deletion confirmation + data export link (valid 30 days)
  if ((profile as any).email) {
    await sendAccountDeletionEmail(profileId, (profile as any).email, (profile as any).full_name ?? "there");
  }

  // Delete Clerk user (also fires user.deleted webhook → idempotent soft-delete)
  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch (e) {
    console.error("[closeOwnerAccount] Clerk delete failed:", e);
  }

  redirect("/");
}

export async function closeGroomerAccount(): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name")
    .eq("clerk_id", userId)
    .maybeSingle();

  if (!profile) return { error: "Profile not found" };

  const profileId = (profile as any).id as string;

  // Unlist the groomer immediately so they no longer appear in search.
  // Operational data (services, availability, etc.) is cleaned up by the 30-day cron
  // so it remains available to the export link during the window.
  const { data: groomerProfile } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("user_id", profileId)
    .maybeSingle();

  if (groomerProfile) {
    await supabaseAdmin
      .from("groomer_profiles")
      .update({ is_listed: false, is_accepting_bookings: false })
      .eq("id", (groomerProfile as any).id);
  }

  // Soft-delete profile — retained 30 days for dispute/financial lookups (UK GDPR)
  await supabaseAdmin
    .from("profiles")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", profileId);

  // Send deletion confirmation + data export link (valid 30 days)
  if ((profile as any).email) {
    await sendAccountDeletionEmail(profileId, (profile as any).email, (profile as any).full_name ?? "there");
  }

  // Delete Clerk user (also fires user.deleted webhook → idempotent soft-delete)
  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch (e) {
    console.error("[closeGroomerAccount] Clerk delete failed:", e);
  }

  redirect("/");
}
