"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export interface GroomerNotification {
  id: string;
  type:
    | "new_appointment"
    | "cancelled_appointment"
    | "rescheduled_appointment"
    | "new_review"
    | "payout_processed"
    | "new_client"
    | "recurring_request"
    | "recurring_approved"
    | "recurring_declined";
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

// ─── Internal helper ─────────────────────────────────────────────────────────

async function getGroomerContext(): Promise<{
  profileId: string;
  groomerProfileId: string;
} | null> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, roles")
    .eq("clerk_id", clerkUserId)
    .maybeSingle();

  if (!profile) return null;

  const roles: string[] = profile.roles ?? [];
  if (!roles.includes("groomer")) return null;

  const { data: gp } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!gp) return null;

  return { profileId: profile.id as string, groomerProfileId: gp.id as string };
}

// ─── Nav context ─────────────────────────────────────────────────────────────

export async function getNotificationsNavContext(): Promise<{
  groomerProfileId: string;
  unreadCount: number;
} | null> {
  const ctx = await getGroomerContext();
  if (!ctx) return null;

  const { count } = await supabaseAdmin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .is("read_at", null);

  return { groomerProfileId: ctx.groomerProfileId, unreadCount: count ?? 0 };
}

// ─── Fetch all notifications ──────────────────────────────────────────────────

export async function getGroomerNotifications(): Promise<
  GroomerNotification[] | null
> {
  const ctx = await getGroomerContext();
  if (!ctx) return null;

  const { data } = await supabaseAdmin
    .from("notifications")
    .select("id, type, title, body, metadata, read_at, created_at")
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    type: row.type as GroomerNotification["type"],
    title: row.title as string,
    body: row.body as string,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    readAt: (row.read_at as string) ?? null,
    createdAt: row.created_at as string,
  }));
}

// ─── Mark all as read ─────────────────────────────────────────────────────────

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Unauthorized" };

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .is("read_at", null);

  if (error) return { error: error.message };
  return {};
}

// ─── Mark single notification as read ────────────────────────────────────────

export async function markNotificationRead(
  notificationId: string
): Promise<{ error?: string }> {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Unauthorized" };

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .is("read_at", null);

  if (error) return { error: error.message };
  return {};
}
