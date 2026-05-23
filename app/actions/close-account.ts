"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
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
    supabaseAdmin.from("favourites").select("*, groomer_profiles (business_name)").eq("owner_id", profileId),
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
    .select("id")
    .eq("clerk_id", userId)
    .maybeSingle();

  if (!profile) return { error: "Profile not found" };

  const profileId = profile.id;

  // Delete in dependency order
  await supabaseAdmin.from("favourites").delete().eq("owner_id", profileId);
  await supabaseAdmin.from("appointments").delete().eq("owner_id", profileId);
  await supabaseAdmin.from("dogs").delete().eq("owner_id", profileId);
  await supabaseAdmin.from("profiles").delete().eq("id", profileId);

  // Delete Clerk user
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
    .select("id")
    .eq("clerk_id", userId)
    .maybeSingle();

  if (!profile) return { error: "Profile not found" };

  const profileId = profile.id;

  // Get groomer profile
  const { data: groomerProfile } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("user_id", profileId)
    .maybeSingle();

  if (groomerProfile) {
    const gpId = groomerProfile.id;

    // Delete groomer data in dependency order
    await supabaseAdmin.from("reviews").delete().in(
      "appointment_id",
      (await supabaseAdmin.from("appointments").select("id").eq("groomer_profile_id", gpId)).data?.map(a => a.id) ?? []
    );
    await supabaseAdmin.from("appointments").delete().eq("groomer_profile_id", gpId);
    await supabaseAdmin.from("services").delete().eq("groomer_profile_id", gpId);
    await supabaseAdmin.from("availability").delete().eq("groomer_profile_id", gpId);
    await supabaseAdmin.from("team_members").delete().eq("groomer_profile_id", gpId);
    await supabaseAdmin.from("time_blocks").delete().eq("groomer_profile_id", gpId);
    await supabaseAdmin.from("favourites").delete().eq("groomer_profile_id", gpId);
    await supabaseAdmin.from("groomer_profiles").delete().eq("id", gpId);
  }

  await supabaseAdmin.from("profiles").delete().eq("id", profileId);

  // Delete Clerk user
  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch (e) {
    console.error("[closeGroomerAccount] Clerk delete failed:", e);
  }

  redirect("/");
}
