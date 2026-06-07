"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface Dog {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  date_of_birth: string | null;
  size: "small" | "medium" | "large" | "giant" | null;
  is_neutered: boolean | null;
  coat_type: "short" | "medium" | "long" | "curly" | "double" | "wire" | null;
  coat_notes: string | null;
  temperament_notes: string | null;
  health_notes: string | null;
  vaccination_doc_url: string | null;
  profile_image_url: string | null;
  created_at: string;
}

async function getOrCreateProfileId(clerkId: string): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (existing) return existing.id;

  // Profile missing (webhook didn't fire) — create it now as a safety net
  const user = await currentUser();
  const fullName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ")
    : "";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;

  const { data: created, error } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: crypto.randomUUID(),
      clerk_id: clerkId,
      full_name: fullName,
      email,
      roles: "{owner}",
      is_admin: false,
    })
    .select("id")
    .single();

  if (error || !created) throw new Error("Failed to create profile.");
  return created.id;
}

export async function getCloudinarySignature(): Promise<{
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
} | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "dogs";
  const allowed_formats = "jpg,jpeg,png,webp";
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp, allowed_formats },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
    allowedFormats: allowed_formats,
  };
}

export async function getDogs(): Promise<Dog[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const profileId = await getOrCreateProfileId(userId);

  const { data, error } = await supabaseAdmin
    .from("dogs")
    .select("*")
    .eq("owner_id", profileId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []) as Dog[];
}

export async function addDog(formData: FormData): Promise<{ dog: Dog } | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const profileId = await getOrCreateProfileId(userId);

  const name = formData.get("name") as string;
  if (!name?.trim()) return { error: "Dog name is required." };

  const row = {
    owner_id: profileId,
    name: name.trim(),
    breed: (formData.get("breed") as string) || null,
    date_of_birth: (formData.get("date_of_birth") as string) || null,
    size: (formData.get("size") as Dog["size"]) || null,
    is_neutered: formData.get("is_neutered") === "true" ? true : formData.get("is_neutered") === "false" ? false : null,
    coat_type: (formData.get("coat_type") as Dog["coat_type"]) || null,
    coat_notes: (formData.get("coat_notes") as string) || null,
    temperament_notes: (formData.get("temperament_notes") as string) || null,
    health_notes: (formData.get("health_notes") as string) || null,
    profile_image_url: (formData.get("profile_image_url") as string) || null,
  };

  const { data, error } = await supabaseAdmin
    .from("dogs")
    .insert(row)
    .select("*")
    .single();

  if (error || !data) return { error: "Failed to add dog." };
  return { dog: data as Dog };
}

export async function updateDog(id: string, formData: FormData): Promise<{ dog: Dog } | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const profileId = await getOrCreateProfileId(userId);

  const name = formData.get("name") as string;
  if (!name?.trim()) return { error: "Dog name is required." };

  const updates = {
    name: name.trim(),
    breed: (formData.get("breed") as string) || null,
    date_of_birth: (formData.get("date_of_birth") as string) || null,
    size: (formData.get("size") as Dog["size"]) || null,
    is_neutered: formData.get("is_neutered") === "true" ? true : formData.get("is_neutered") === "false" ? false : null,
    coat_type: (formData.get("coat_type") as Dog["coat_type"]) || null,
    coat_notes: (formData.get("coat_notes") as string) || null,
    temperament_notes: (formData.get("temperament_notes") as string) || null,
    health_notes: (formData.get("health_notes") as string) || null,
    profile_image_url: (formData.get("profile_image_url") as string) || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("dogs")
    .update(updates)
    .eq("id", id)
    .eq("owner_id", profileId)
    .select("*")
    .single();

  if (error || !data) return { error: "Failed to update dog." };
  return { dog: data as Dog };
}

export async function deleteDog(id: string): Promise<{ ok: true } | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const profileId = await getOrCreateProfileId(userId);

  const { error } = await supabaseAdmin
    .from("dogs")
    .delete()
    .eq("id", id)
    .eq("owner_id", profileId);

  if (error) return { error: "Failed to delete dog." };
  return { ok: true };
}
