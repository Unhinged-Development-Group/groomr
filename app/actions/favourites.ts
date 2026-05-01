"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export interface FavouriteGroomer {
  id: string;
  owner_id: string;
  groomer_profile_id: string;
  created_at: string;
  
  groomer_profiles?: {
    business_name: string;
    average_rating: number | null;
    total_reviews: number | null;
    // Potentially images if there is a cover image logic
  } | null;
}

async function getProfileId(clerkId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  
  return data?.id || null;
}

export async function getFavouriteGroomers(): Promise<FavouriteGroomer[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const profileId = await getProfileId(userId);
  if (!profileId) return [];

  const { data, error } = await supabaseAdmin
    .from("favourite_groomers")
    .select(`
      *,
      groomer_profiles (
        business_name,
        average_rating,
        total_reviews
      )
    `)
    .eq("owner_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching favourite groomers:", error.message, error.details, error.hint, error.code);
    return [];
  }

  return (data ?? []) as FavouriteGroomer[];
}

export async function addFavourite(groomerProfileId: string): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not authenticated" };

  const profileId = await getProfileId(userId);
  if (!profileId) return { ok: false, error: "Profile not found" };

  const { error } = await supabaseAdmin
    .from("favourite_groomers")
    .insert({
      owner_id: profileId,
      groomer_profile_id: groomerProfileId
    });

  if (error) {
    console.error("Error adding favourite:", error);
    return { ok: false, error: "Failed to add favourite" };
  }

  return { ok: true };
}

export async function removeFavourite(groomerProfileId: string): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not authenticated" };

  const profileId = await getProfileId(userId);
  if (!profileId) return { ok: false, error: "Profile not found" };

  const { error } = await supabaseAdmin
    .from("favourite_groomers")
    .delete()
    .eq("owner_id", profileId)
    .eq("groomer_profile_id", groomerProfileId);

  if (error) {
    console.error("Error removing favourite:", error);
    return { ok: false, error: "Failed to remove favourite" };
  }

  return { ok: true };
}
