"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

export interface TimeBlock {
  id: string;
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:MM" or null for all-day
  endTime: string;    // "HH:MM" or null for all-day
  allDay: boolean;
  reason: string | null;
  createdAt: string;
}

export async function getTimeBlocks(): Promise<TimeBlock[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const groomerProfileId = await getGroomerProfileId(userId);
  if (!groomerProfileId) return [];

  const { data } = await supabaseAdmin
    .from("time_blocks")
    .select("id, date, start_time, end_time, all_day, reason, created_at")
    .eq("groomer_profile_id", groomerProfileId)
    .gte("date", new Date().toISOString().slice(0, 10))
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  return (data ?? []).map((b) => ({
    id: b.id,
    date: b.date,
    startTime: b.start_time ?? "",
    endTime: b.end_time ?? "",
    allDay: b.all_day ?? false,
    reason: b.reason ?? null,
    createdAt: b.created_at,
  }));
}

export async function createTimeBlock(input: {
  date: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  reason: string;
}): Promise<{ error?: string; block?: TimeBlock }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const groomerProfileId = await getGroomerProfileId(userId);
  if (!groomerProfileId) return { error: "Groomer profile not found" };

  if (!input.date) return { error: "Date is required" };
  if (!input.allDay && (!input.startTime || !input.endTime))
    return { error: "Start and end time are required" };
  if (!input.allDay && input.startTime >= input.endTime)
    return { error: "End time must be after start time" };

  const { data, error } = await supabaseAdmin
    .from("time_blocks")
    .insert({
      groomer_profile_id: groomerProfileId,
      date: input.date,
      all_day: input.allDay,
      start_time: input.allDay ? null : input.startTime,
      end_time: input.allDay ? null : input.endTime,
      reason: input.reason.trim() || null,
    })
    .select("id, date, start_time, end_time, all_day, reason, created_at")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to save block" };

  return {
    block: {
      id: data.id,
      date: data.date,
      startTime: data.start_time ?? "",
      endTime: data.end_time ?? "",
      allDay: data.all_day ?? false,
      reason: data.reason ?? null,
      createdAt: data.created_at,
    },
  };
}

export async function deleteTimeBlock(blockId: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const groomerProfileId = await getGroomerProfileId(userId);
  if (!groomerProfileId) return { error: "Not authorised" };

  const { error } = await supabaseAdmin
    .from("time_blocks")
    .delete()
    .eq("id", blockId)
    .eq("groomer_profile_id", groomerProfileId);

  if (error) return { error: error.message };
  return {};
}
