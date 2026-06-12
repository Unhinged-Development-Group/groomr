import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function getProfileId(clerkId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  return data?.id ?? null;
}

// Resolves the current Clerk session to a groomer context.
// Handles both direct groomer owners and accepted team members.
export async function getGroomerContext(): Promise<{
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

  // Direct groomer owner
  const { data: groomer } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (groomer) return { profileId: profile.id, groomerProfileId: groomer.id };

  // Team member — use their employer's groomer profile
  const { data: membership } = await supabaseAdmin
    .from("team_members")
    .select("groomer_profile_id")
    .eq("user_id", profile.id)
    .eq("invite_status", "accepted")
    .maybeSingle();

  if (!membership) return null;

  return { profileId: profile.id, groomerProfileId: membership.groomer_profile_id as string };
}
