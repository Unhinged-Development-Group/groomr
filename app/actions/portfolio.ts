"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface PortfolioPhoto {
  id: string;
  url: string;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
}

async function getGroomerProfileId(clerkUserId: string): Promise<string | null> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .maybeSingle();
  if (!profile) return null;

  const { data: gp } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();

  return gp?.id ?? null;
}

export async function getPortfolioPhotos(): Promise<PortfolioPhoto[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const groomerProfileId = await getGroomerProfileId(userId);
  if (!groomerProfileId) return [];

  const { data } = await supabaseAdmin
    .from("portfolio_photos")
    .select("id, url, caption, sort_order, created_at")
    .eq("groomer_profile_id", groomerProfileId)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((p) => ({
    id: p.id,
    url: p.url,
    caption: p.caption ?? null,
    sortOrder: p.sort_order ?? 0,
    createdAt: p.created_at,
  }));
}

export async function getPortfolioUploadSignature(groomerProfileId: string): Promise<{
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `groomr/portfolio/${groomerProfileId}`;
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
  };
}

export async function addPortfolioPhoto(
  url: string,
  caption: string | null
): Promise<{ error?: string; photo?: PortfolioPhoto }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const groomerProfileId = await getGroomerProfileId(userId);
  if (!groomerProfileId) return { error: "Groomer profile not found" };

  const { data: existing } = await supabaseAdmin
    .from("portfolio_photos")
    .select("sort_order")
    .eq("groomer_profile_id", groomerProfileId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabaseAdmin
    .from("portfolio_photos")
    .insert({
      groomer_profile_id: groomerProfileId,
      url,
      caption: caption || null,
      sort_order: nextOrder,
    })
    .select("id, url, caption, sort_order, created_at")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to save photo" };

  return {
    photo: {
      id: data.id,
      url: data.url,
      caption: data.caption ?? null,
      sortOrder: data.sort_order,
      createdAt: data.created_at,
    },
  };
}

export async function deletePortfolioPhoto(photoId: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const groomerProfileId = await getGroomerProfileId(userId);
  if (!groomerProfileId) return { error: "Not authorised" };

  const { error } = await supabaseAdmin
    .from("portfolio_photos")
    .delete()
    .eq("id", photoId)
    .eq("groomer_profile_id", groomerProfileId);

  if (error) return { error: error.message };
  return {};
}

export async function updatePortfolioCaption(
  photoId: string,
  caption: string
): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const groomerProfileId = await getGroomerProfileId(userId);
  if (!groomerProfileId) return { error: "Not authorised" };

  const { error } = await supabaseAdmin
    .from("portfolio_photos")
    .update({ caption: caption || null })
    .eq("id", photoId)
    .eq("groomer_profile_id", groomerProfileId);

  if (error) return { error: error.message };
  return {};
}
