"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MessageThread {
  appointmentId: string;
  scheduledAt: string;
  ownerName: string;
  ownerProfileId: string;
  groomerName?: string;
  groomerProfileId?: string;
  dogName: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface MessageRow {
  id: string;
  appointmentId: string;
  senderId: string;
  body: string;
  isSystem: boolean;
  readAt: string | null;
  createdAt: string;
}

// ─── Internal helper ────────────────────────────────────────────────────────

async function getMessagingContext(): Promise<{
  profileId: string;
  groomerProfileId: string | null;
  ownerRole: boolean;
} | null> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, roles")
    .eq("clerk_id", clerkUserId)
    .single();

  if (!profile) return null;

  const roles: string[] = profile.roles ?? [];
  const isGroomer = roles.includes("groomer");

  let groomerProfileId: string | null = null;

  if (isGroomer) {
    // Direct salon owner
    const { data: gp } = await supabaseAdmin
      .from("groomer_profiles")
      .select("id")
      .eq("user_id", profile.id)
      .maybeSingle();
    groomerProfileId = gp?.id ?? null;
  }

  if (!groomerProfileId) {
    // Team member
    const { data: tm } = await supabaseAdmin
      .from("team_members")
      .select("groomer_profile_id")
      .eq("user_id", profile.id)
      .eq("invite_status", "accepted")
      .maybeSingle();
    groomerProfileId = (tm?.groomer_profile_id as string) ?? null;
  }

  return { profileId: profile.id as string, groomerProfileId, ownerRole: isGroomer };
}

// ─── Groomer: list all conversation threads ──────────────────────────────────

export async function getGroomerMessageThreads(): Promise<MessageThread[]> {
  const ctx = await getMessagingContext();
  if (!ctx?.groomerProfileId) return [];

  // Get all appointments for this groomer
  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("id, scheduled_at, dog_id, owner_id")
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .order("scheduled_at", { ascending: false });

  if (!appointments?.length) return [];

  const appointmentIds = appointments.map((a) => a.id);

  // Fetch all messages for these appointments in one query
  const { data: allMessages } = await supabaseAdmin
    .from("messages")
    .select("id, appointment_id, sender_id, body, read_at, created_at")
    .in("appointment_id", appointmentIds)
    .order("created_at", { ascending: false });

  // Fetch owner profiles in one query
  const ownerIds = [...new Set(appointments.map((a) => a.owner_id as string))];
  const { data: ownerProfiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name")
    .in("id", ownerIds);

  // Fetch dog names in one query
  const dogIds = [...new Set(appointments.map((a) => a.dog_id as string).filter(Boolean))];
  const { data: dogs } = dogIds.length
    ? await supabaseAdmin.from("dogs").select("id, name").in("id", dogIds)
    : { data: [] };

  const ownerMap = new Map((ownerProfiles ?? []).map((p) => [p.id, p.full_name as string]));
  const dogMap   = new Map((dogs ?? []).map((d) => [d.id, d.name as string]));

  // Group messages by appointment_id
  const messagesByAppt = new Map<string, typeof allMessages>([]);
  for (const m of allMessages ?? []) {
    const apptId = m.appointment_id as string;
    if (!messagesByAppt.has(apptId)) messagesByAppt.set(apptId, []);
    messagesByAppt.get(apptId)!.push(m);
  }

  // Build threads — only include appointments that have messages
  const threads: MessageThread[] = [];
  for (const appt of appointments) {
    const msgs = messagesByAppt.get(appt.id) ?? [];
    if (!msgs.length) continue; // skip appointments with no messages

    const lastMsg = msgs[0]; // already sorted desc
    const unreadCount = msgs.filter(
      (m) => m.sender_id !== ctx.profileId && m.read_at === null
    ).length;

    threads.push({
      appointmentId: appt.id,
      scheduledAt: appt.scheduled_at as string,
      ownerName: ownerMap.get(appt.owner_id as string) ?? "Client",
      ownerProfileId: appt.owner_id as string,
      dogName: appt.dog_id ? (dogMap.get(appt.dog_id as string) ?? null) : null,
      lastMessage: lastMsg.body as string,
      lastMessageAt: lastMsg.created_at as string,
      unreadCount,
    });
  }

  // Sort by most recent message
  threads.sort((a, b) =>
    new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()
  );

  return threads;
}

// ─── Get all messages for a single appointment thread ───────────────────────

export async function getMessagesForAppointment(
  appointmentId: string
): Promise<MessageRow[]> {
  const ctx = await getMessagingContext();
  if (!ctx) return [];

  // Verify caller is a participant in this appointment
  const { data: appt } = await supabaseAdmin
    .from("appointments")
    .select("owner_id, groomer_profile_id")
    .eq("id", appointmentId)
    .single();

  if (!appt) return [];

  const { data: gpOwner } = ctx.groomerProfileId
    ? await supabaseAdmin
        .from("groomer_profiles")
        .select("id")
        .eq("id", appt.groomer_profile_id)
        .eq("id", ctx.groomerProfileId)
        .maybeSingle()
    : { data: null };

  const isParticipant =
    appt.owner_id === ctx.profileId || gpOwner !== null;

  if (!isParticipant) return [];

  const { data } = await supabaseAdmin
    .from("messages")
    .select("id, appointment_id, sender_id, body, is_system, read_at, created_at")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((m) => ({
    id: m.id as string,
    appointmentId: m.appointment_id as string,
    senderId: m.sender_id as string,
    body: m.body as string,
    isSystem: m.is_system as boolean,
    readAt: m.read_at as string | null,
    createdAt: m.created_at as string,
  }));
}

// ─── Send a message ──────────────────────────────────────────────────────────

export async function sendMessage(
  appointmentId: string,
  body: string
): Promise<{ message?: MessageRow; error?: string }> {
  const ctx = await getMessagingContext();
  if (!ctx) return { error: "Not authenticated" };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Message cannot be empty" };

  // Verify appointment participant
  const { data: appt } = await supabaseAdmin
    .from("appointments")
    .select("owner_id, groomer_profile_id")
    .eq("id", appointmentId)
    .single();

  if (!appt) return { error: "Appointment not found" };

  const { data: gpOwner } = ctx.groomerProfileId
    ? await supabaseAdmin
        .from("groomer_profiles")
        .select("id")
        .eq("id", appt.groomer_profile_id)
        .eq("id", ctx.groomerProfileId)
        .maybeSingle()
    : { data: null };

  const isParticipant =
    appt.owner_id === ctx.profileId || gpOwner !== null;

  if (!isParticipant) return { error: "Not authorised" };

  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({
      appointment_id: appointmentId,
      sender_id: ctx.profileId,
      body: trimmed,
      is_system: false,
    })
    .select("id, appointment_id, sender_id, body, is_system, read_at, created_at")
    .single();

  if (error) return { error: error.message };

  return {
    message: {
      id: data.id as string,
      appointmentId: data.appointment_id as string,
      senderId: data.sender_id as string,
      body: data.body as string,
      isSystem: data.is_system as boolean,
      readAt: data.read_at as string | null,
      createdAt: data.created_at as string,
    },
  };
}

// ─── Mark a thread as read ───────────────────────────────────────────────────

export async function markThreadRead(
  appointmentId: string
): Promise<{ error?: string }> {
  const ctx = await getMessagingContext();
  if (!ctx) return { error: "Not authenticated" };

  // Mark all messages in thread NOT sent by current user as read
  const { error } = await supabaseAdmin
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("appointment_id", appointmentId)
    .neq("sender_id", ctx.profileId)
    .is("read_at", null);

  if (error) return { error: error.message };
  return {};
}

// ─── Groomer: all bookings eligible to start a message thread ────────────────

export interface BookingForMessaging {
  appointmentId: string;
  scheduledAt: string;
  ownerName: string;
  ownerProfileId: string;
  dogName: string | null;
}

export async function getGroomerBookingsForMessaging(): Promise<BookingForMessaging[]> {
  const ctx = await getMessagingContext();
  if (!ctx?.groomerProfileId) return [];

  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("id, scheduled_at, dog_id, owner_id")
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .not("status", "eq", "cancelled")
    .order("scheduled_at", { ascending: false });

  if (!appointments?.length) return [];

  const ownerIds = [...new Set(appointments.map((a) => a.owner_id as string))];
  const dogIds   = [...new Set(appointments.map((a) => a.dog_id as string).filter(Boolean))];

  const [{ data: owners }, { data: dogs }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, full_name").in("id", ownerIds),
    dogIds.length
      ? supabaseAdmin.from("dogs").select("id, name").in("id", dogIds)
      : Promise.resolve({ data: [] }),
  ]);

  const ownerMap = new Map((owners ?? []).map((p) => [p.id, p.full_name as string]));
  const dogMap   = new Map(((dogs as { id: string; name: string }[]) ?? []).map((d) => [d.id, d.name]));

  return appointments.map((a) => ({
    appointmentId:  a.id as string,
    scheduledAt:    a.scheduled_at as string,
    ownerName:      ownerMap.get(a.owner_id as string) ?? "Client",
    ownerProfileId: a.owner_id as string,
    dogName:        a.dog_id ? (dogMap.get(a.dog_id as string) ?? null) : null,
  }));
}

// ─── Owner: list all conversation threads ────────────────────────────────────

export async function getOwnerMessageThreads(): Promise<{
  threads: MessageThread[];
  profileId: string;
}> {
  const ctx = await getMessagingContext();
  if (!ctx) return { threads: [], profileId: "" };

  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("id, scheduled_at, dog_id, groomer_profile_id")
    .eq("owner_id", ctx.profileId)
    .order("scheduled_at", { ascending: false });

  if (!appointments?.length) return { threads: [], profileId: ctx.profileId };

  const appointmentIds = appointments.map((a) => a.id);

  const { data: allMessages } = await supabaseAdmin
    .from("messages")
    .select("id, appointment_id, sender_id, body, read_at, created_at")
    .in("appointment_id", appointmentIds)
    .order("created_at", { ascending: false });

  const groomerProfileIds = [
    ...new Set(appointments.map((a) => a.groomer_profile_id as string).filter(Boolean)),
  ];
  const { data: groomerProfiles } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id, business_name")
    .in("id", groomerProfileIds);

  const dogIds = [
    ...new Set(appointments.map((a) => a.dog_id as string).filter(Boolean)),
  ];
  const { data: dogs } = dogIds.length
    ? await supabaseAdmin.from("dogs").select("id, name").in("id", dogIds)
    : { data: [] };

  const groomerMap = new Map(
    (groomerProfiles ?? []).map((g) => [g.id, g.business_name as string]),
  );
  const dogMap = new Map((dogs ?? []).map((d) => [d.id, d.name as string]));

  const messagesByAppt = new Map<string, typeof allMessages>();
  for (const m of allMessages ?? []) {
    const apptId = m.appointment_id as string;
    if (!messagesByAppt.has(apptId)) messagesByAppt.set(apptId, []);
    messagesByAppt.get(apptId)!.push(m);
  }

  const threads: MessageThread[] = [];
  for (const appt of appointments) {
    const msgs = messagesByAppt.get(appt.id) ?? [];
    if (!msgs.length) continue;

    const lastMsg = msgs[0];
    const unreadCount = msgs.filter(
      (m) => m.sender_id !== ctx.profileId && m.read_at === null,
    ).length;

    threads.push({
      appointmentId:    appt.id,
      scheduledAt:      appt.scheduled_at as string,
      ownerName:        "",
      ownerProfileId:   ctx.profileId,
      groomerName:      groomerMap.get(appt.groomer_profile_id as string) ?? "Groomer",
      groomerProfileId: appt.groomer_profile_id as string,
      dogName:          appt.dog_id ? (dogMap.get(appt.dog_id as string) ?? null) : null,
      lastMessage:      lastMsg.body as string,
      lastMessageAt:    lastMsg.created_at as string,
      unreadCount,
    });
  }

  threads.sort(
    (a, b) =>
      new Date(b.lastMessageAt ?? 0).getTime() -
      new Date(a.lastMessageAt ?? 0).getTime(),
  );

  return { threads, profileId: ctx.profileId };
}

// ─── Nav context: URL + unread count + appointment IDs for Realtime ──────────

export async function getMessagesNavContext(): Promise<{
  url: string;
  unreadCount: number;
  profileId: string;
  appointmentIds: string[];
}> {
  const ctx = await getMessagingContext();
  if (!ctx) return { url: "/dashboard", unreadCount: 0, profileId: "", appointmentIds: [] };

  const isGroomer = !!ctx.groomerProfileId;
  const url = isGroomer ? "/dashboard/groomer/messages" : "/dashboard/owner/messages";

  // Fetch relevant appointments (upcoming + recent)
  const since = new Date();
  since.setDate(since.getDate() - 30);

  let appointmentIds: string[] = [];

  if (isGroomer) {
    const { data } = await supabaseAdmin
      .from("appointments")
      .select("id")
      .eq("groomer_profile_id", ctx.groomerProfileId!)
      .gte("scheduled_at", since.toISOString());
    appointmentIds = (data ?? []).map((a) => a.id as string);
  } else {
    const { data } = await supabaseAdmin
      .from("appointments")
      .select("id")
      .eq("owner_id", ctx.profileId)
      .gte("scheduled_at", since.toISOString());
    appointmentIds = (data ?? []).map((a) => a.id as string);
  }

  // Count unread in those appointments
  let unreadCount = 0;
  if (appointmentIds.length) {
    const { count } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("appointment_id", appointmentIds)
      .neq("sender_id", ctx.profileId)
      .is("read_at", null);
    unreadCount = count ?? 0;
  }

  return { url, unreadCount, profileId: ctx.profileId, appointmentIds };
}

// ─── Unread count for header badge ───────────────────────────────────────────

export async function getGroomerUnreadMessageCount(): Promise<number> {
  const ctx = await getMessagingContext();
  if (!ctx?.groomerProfileId) return 0;

  // Get appointments for this groomer
  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("id")
    .eq("groomer_profile_id", ctx.groomerProfileId);

  if (!appointments?.length) return 0;

  const apptIds = appointments.map((a) => a.id);

  const { count } = await supabaseAdmin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("appointment_id", apptIds)
    .neq("sender_id", ctx.profileId)
    .is("read_at", null);

  return count ?? 0;
}
