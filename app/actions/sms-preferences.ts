"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function updateSMSPreference(
  enabled: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not authenticated" };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", userId)
    .maybeSingle();

  if (!profile) return { ok: false, error: "Profile not found" };

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ sms_notifications_enabled: enabled })
    .eq("id", profile.id);

  if (error) {
    console.error("[updateSMSPreference]", error);
    return { ok: false, error: "Failed to update SMS preference" };
  }

  revalidatePath("/dashboard/owner");
  return { ok: true };
}

export async function getSMSPreference(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("sms_notifications_enabled")
    .eq("clerk_id", userId)
    .maybeSingle();

  return data?.sms_notifications_enabled ?? true;
}

export async function getOwnerContactPrefs(): Promise<{ smsEnabled: boolean; phone: string | null }> {
  const { userId } = await auth();
  if (!userId) return { smsEnabled: false, phone: null };

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("sms_notifications_enabled, phone")
    .eq("clerk_id", userId)
    .maybeSingle();

  return {
    smsEnabled: data?.sms_notifications_enabled ?? true,
    phone: data?.phone ?? null,
  };
}

export async function updateOwnerPhone(
  phone: string,
): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not authenticated" };

  const normalized = phone.trim().replace(/\s+/g, "");

  if (normalized && !/^\+44\d{9,10}$/.test(normalized)) {
    return { ok: false, error: "Enter a valid UK mobile number (e.g. +44 7700 900000)" };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", userId)
    .maybeSingle();

  if (!profile) return { ok: false, error: "Profile not found" };

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ phone: normalized || null })
    .eq("id", profile.id);

  if (error) {
    console.error("[updateOwnerPhone]", error);
    return { ok: false, error: "Failed to save phone number" };
  }

  revalidatePath("/dashboard/owner");
  return { ok: true };
}
