"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchClerkAvatarMap } from "@/lib/clerk-helpers";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MessageThread {
  /** For appointment threads: the appointment UUID.
   *  For direct conversations: the direct_conversations UUID.
   *  Used as the thread key throughout the UI. */
  appointmentId: string;
  /** Whether this is a direct (non-appointment) conversation */
  isDirect: boolean;
  scheduledAt: string;
  ownerName: string;
  ownerProfileId: string;
  ownerAvatarUrl?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  groomerName?: string;
  groomerProfileId?: string;
  groomerAvatarUrl?: string | null;
  dogName: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface MessageRow {
  id: string;
  /** Appointment ID for appointment threads; conversation ID for direct threads */
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
    const { data: gp } = await supabaseAdmin
      .from("groomer_profiles")
      .select("id")
      .eq("user_id", profile.id)
      .maybeSingle();
    groomerProfileId = gp?.id ?? null;
  }

  if (!groomerProfileId) {
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

// ─── Internal: load direct conversation threads for any profile ──────────────

async function getDirectConversationThreads(
  profileId: string,
): Promise<MessageThread[]> {
  const { data: conversations } = await supabaseAdmin
    .from("direct_conversations")
    .select("id, participant_a, participant_b, created_at")
    .or(`participant_a.eq.${profileId},participant_b.eq.${profileId}`);

  if (!conversations?.length) return [];

  const convIds = conversations.map((c) => c.id as string);

  const { data: allMessages } = await supabaseAdmin
    .from("messages")
    .select("id, direct_conversation_id, sender_id, body, read_at, created_at")
    .in("direct_conversation_id", convIds)
    .order("created_at", { ascending: false });

  // Collect other-party profile IDs
  const otherProfileIds = [
    ...new Set(
      conversations.map((c) =>
        (c.participant_a as string) === profileId
          ? (c.participant_b as string)
          : (c.participant_a as string),
      ),
    ),
  ];

  const { data: otherProfiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, clerk_id, phone, email")
    .in("id", otherProfileIds);

  // Fetch avatars from Clerk
  const clerkIds = (otherProfiles ?? [])
    .map((p) => p.clerk_id as string)
    .filter(Boolean);
  const clerkImageMap = await fetchClerkAvatarMap(clerkIds);

  // Also look up groomer_profiles for other parties (so we can set groomerProfileId)
  const { data: groomerProfiles } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id, user_id, business_name, profile_image_url")
    .in("user_id", otherProfileIds);
  const groomerByUserId = new Map(
    (groomerProfiles ?? []).map((g) => [g.user_id as string, g]),
  );

  const profileMap = new Map(
    (otherProfiles ?? []).map((p) => [
      p.id as string,
      {
        name: (p.full_name as string) ?? "User",
        avatarUrl: clerkImageMap.get(p.clerk_id as string) ?? null,
        phone: (p.phone as string | null) ?? null,
        email: (p.email as string | null) ?? null,
      },
    ]),
  );

  const messagesByConv = new Map<string, typeof allMessages>([]);
  for (const m of allMessages ?? []) {
    const cid = m.direct_conversation_id as string;
    if (!messagesByConv.has(cid)) messagesByConv.set(cid, []);
    messagesByConv.get(cid)!.push(m);
  }

  const threads: MessageThread[] = [];
  for (const conv of conversations) {
    const msgs = messagesByConv.get(conv.id as string) ?? [];
    // Include conversations even without messages so stub threads appear
    const lastMsg = msgs[0] ?? null;
    const unread = msgs.filter(
      (m) => m.sender_id !== profileId && m.read_at === null,
    ).length;

    const otherProfileId =
      (conv.participant_a as string) === profileId
        ? (conv.participant_b as string)
        : (conv.participant_a as string);
    const other = profileMap.get(otherProfileId);
    const otherGroomer = groomerByUserId.get(otherProfileId);

    threads.push({
      appointmentId:    conv.id as string,
      isDirect:         true,
      scheduledAt:      conv.created_at as string,
      ownerName:        otherGroomer
        ? (otherGroomer.business_name as string)
        : (other?.name ?? "User"),
      ownerProfileId:   otherProfileId,
      ownerAvatarUrl:   otherGroomer
        ? (otherGroomer.profile_image_url as string | null)
        : (other?.avatarUrl ?? null),
      ownerPhone:       other?.phone ?? null,
      ownerEmail:       other?.email ?? null,
      groomerProfileId: otherGroomer ? (otherGroomer.id as string) : undefined,
      groomerName:      otherGroomer ? (otherGroomer.business_name as string) : undefined,
      groomerAvatarUrl: otherGroomer
        ? (otherGroomer.profile_image_url as string | null)
        : null,
      dogName:          null,
      lastMessage:      lastMsg ? (lastMsg.body as string) : null,
      lastMessageAt:    lastMsg ? (lastMsg.created_at as string) : null,
      unreadCount:      unread,
    });
  }

  return threads.sort(
    (a, b) =>
      new Date(b.lastMessageAt ?? b.scheduledAt ?? 0).getTime() -
      new Date(a.lastMessageAt ?? a.scheduledAt ?? 0).getTime(),
  );
}

// ─── Find or create a direct conversation ────────────────────────────────────

/**
 * Creates (or finds) a direct conversation between the current user and
 * another user identified by their groomer_profiles.id.
 */
export async function getOrCreateConversationWithGroomer(
  groomerProfileId: string,
): Promise<{
  conversationId?: string;
  otherProfileId?: string;
  otherName?: string;
  otherAvatarUrl?: string | null;
  error?: string;
}> {
  const ctx = await getMessagingContext();
  if (!ctx) return { error: "Not authenticated" };

  // Resolve groomer_profile → profiles.id
  const { data: gp } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id, user_id, business_name, profile_image_url")
    .eq("id", groomerProfileId)
    .maybeSingle();

  if (!gp) return { error: "Groomer not found" };

  const otherProfileId = gp.user_id as string;
  if (otherProfileId === ctx.profileId) return { error: "Cannot message yourself" };

  // Find existing conversation (order-independent)
  const { data: existing } = await supabaseAdmin
    .from("direct_conversations")
    .select("id")
    .or(
      `and(participant_a.eq.${ctx.profileId},participant_b.eq.${otherProfileId}),` +
      `and(participant_a.eq.${otherProfileId},participant_b.eq.${ctx.profileId})`,
    )
    .maybeSingle();

  if (existing) {
    return {
      conversationId:  existing.id as string,
      otherProfileId,
      otherName:       gp.business_name as string,
      otherAvatarUrl:  gp.profile_image_url as string | null,
    };
  }

  // Create new
  const { data: created, error } = await supabaseAdmin
    .from("direct_conversations")
    .insert({ participant_a: ctx.profileId, participant_b: otherProfileId })
    .select("id")
    .single();

  if (error || !created) return { error: error?.message ?? "Failed to create conversation" };

  return {
    conversationId:  created.id as string,
    otherProfileId,
    otherName:       gp.business_name as string,
    otherAvatarUrl:  gp.profile_image_url as string | null,
  };
}

// ─── Groomer: list all conversation threads ──────────────────────────────────

export async function getGroomerMessageThreads(): Promise<{
  threads: MessageThread[];
  profileId: string;
}> {
  const ctx = await getMessagingContext();
  if (!ctx?.groomerProfileId) return { threads: [], profileId: "" };

  // Get appointment-based threads (legacy / existing messages)
  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("id, scheduled_at, dog_id, owner_id")
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .order("scheduled_at", { ascending: false });

  const appointmentThreads: MessageThread[] = [];

  if (appointments?.length) {
    const appointmentIds = appointments.map((a) => a.id);
    const { data: allMessages } = await supabaseAdmin
      .from("messages")
      .select("id, appointment_id, sender_id, body, read_at, created_at")
      .in("appointment_id", appointmentIds)
      .order("created_at", { ascending: false });

    const ownerIds = [...new Set(appointments.map((a) => a.owner_id as string))];
    const { data: ownerProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, clerk_id, phone, email")
      .in("id", ownerIds);

    const clerkIds = (ownerProfiles ?? [])
      .map((p) => p.clerk_id as string)
      .filter(Boolean);
    const clerkImageMap = await fetchClerkAvatarMap(clerkIds);

    const dogIds = [
      ...new Set(appointments.map((a) => a.dog_id as string).filter(Boolean)),
    ];
    const { data: dogs } = dogIds.length
      ? await supabaseAdmin.from("dogs").select("id, name").in("id", dogIds)
      : { data: [] };

    const ownerMap = new Map(
      (ownerProfiles ?? []).map((p) => [
        p.id,
        {
          ...p,
          avatar_url: clerkImageMap.get(p.clerk_id as string) ?? null,
        },
      ]),
    );
    const dogMap = new Map((dogs ?? []).map((d) => [d.id, d.name as string]));

    const messagesByAppt = new Map<string, typeof allMessages>([]);
    for (const m of allMessages ?? []) {
      const apptId = m.appointment_id as string;
      if (!messagesByAppt.has(apptId)) messagesByAppt.set(apptId, []);
      messagesByAppt.get(apptId)!.push(m);
    }

    for (const appt of appointments) {
      const msgs = messagesByAppt.get(appt.id) ?? [];
      if (!msgs.length) continue;

      const lastMsg = msgs[0];
      const unreadCount = msgs.filter(
        (m) => m.sender_id !== ctx.profileId && m.read_at === null,
      ).length;
      const owner = ownerMap.get(appt.owner_id as string);

      appointmentThreads.push({
        appointmentId: appt.id,
        isDirect:      false,
        scheduledAt:   appt.scheduled_at as string,
        ownerName:     (owner?.full_name as string) ?? "Client",
        ownerProfileId: appt.owner_id as string,
        ownerAvatarUrl: (owner?.avatar_url as string | null) ?? null,
        ownerPhone:    (owner?.phone as string | null) ?? null,
        ownerEmail:    (owner?.email as string | null) ?? null,
        dogName:       appt.dog_id ? (dogMap.get(appt.dog_id as string) ?? null) : null,
        lastMessage:   lastMsg.body as string,
        lastMessageAt: lastMsg.created_at as string,
        unreadCount,
      });
    }
  }

  // Deduplicate appointment threads by (owner, dog)
  const dedupMap = new Map<string, MessageThread>();
  for (const t of appointmentThreads) {
    const key = `${t.ownerProfileId}||${t.dogName ?? ""}`;
    const ex = dedupMap.get(key);
    if (
      !ex ||
      new Date(t.lastMessageAt ?? 0).getTime() >
        new Date(ex.lastMessageAt ?? 0).getTime()
    ) {
      dedupMap.set(key, t);
    }
  }
  const deduped = Array.from(dedupMap.values());

  // Get direct conversation threads
  const directThreads = await getDirectConversationThreads(ctx.profileId);

  const allThreads = [...deduped, ...directThreads].sort(
    (a, b) =>
      new Date(b.lastMessageAt ?? 0).getTime() -
      new Date(a.lastMessageAt ?? 0).getTime(),
  );

  return { threads: allThreads, profileId: ctx.profileId };
}

// ─── Get all messages for a thread (appointment or direct) ──────────────────

export async function getMessagesForAppointment(
  threadId: string,
  isDirect = false,
): Promise<MessageRow[]> {
  const ctx = await getMessagingContext();
  if (!ctx) return [];

  if (isDirect) {
    // Verify the caller is a participant
    const { data: conv } = await supabaseAdmin
      .from("direct_conversations")
      .select("participant_a, participant_b")
      .eq("id", threadId)
      .single();

    if (!conv) return [];
    if (
      (conv.participant_a as string) !== ctx.profileId &&
      (conv.participant_b as string) !== ctx.profileId
    )
      return [];

    const { data } = await supabaseAdmin
      .from("messages")
      .select(
        "id, direct_conversation_id, sender_id, body, is_system, read_at, created_at",
      )
      .eq("direct_conversation_id", threadId)
      .order("created_at", { ascending: true });

    return (data ?? []).map((m) => ({
      id:            m.id as string,
      appointmentId: m.direct_conversation_id as string,
      senderId:      m.sender_id as string,
      body:          m.body as string,
      isSystem:      m.is_system as boolean,
      readAt:        m.read_at as string | null,
      createdAt:     m.created_at as string,
    }));
  }

  // Appointment-based (legacy)
  const { data: appt } = await supabaseAdmin
    .from("appointments")
    .select("owner_id, groomer_profile_id")
    .eq("id", threadId)
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
    .select(
      "id, appointment_id, sender_id, body, is_system, read_at, created_at",
    )
    .eq("appointment_id", threadId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((m) => ({
    id:            m.id as string,
    appointmentId: m.appointment_id as string,
    senderId:      m.sender_id as string,
    body:          m.body as string,
    isSystem:      m.is_system as boolean,
    readAt:        m.read_at as string | null,
    createdAt:     m.created_at as string,
  }));
}

// ─── Send a message ──────────────────────────────────────────────────────────

export async function sendMessage(
  threadId: string,
  body: string,
  isDirect = false,
): Promise<{ message?: MessageRow; error?: string }> {
  const ctx = await getMessagingContext();
  if (!ctx) return { error: "Not authenticated" };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Message cannot be empty" };

  if (isDirect) {
    const { data: conv } = await supabaseAdmin
      .from("direct_conversations")
      .select("participant_a, participant_b")
      .eq("id", threadId)
      .single();

    if (!conv) return { error: "Conversation not found" };
    if (
      (conv.participant_a as string) !== ctx.profileId &&
      (conv.participant_b as string) !== ctx.profileId
    )
      return { error: "Not authorised" };

    const { data, error } = await supabaseAdmin
      .from("messages")
      .insert({
        direct_conversation_id: threadId,
        sender_id: ctx.profileId,
        body: trimmed,
        is_system: false,
      })
      .select(
        "id, direct_conversation_id, sender_id, body, is_system, read_at, created_at",
      )
      .single();

    if (error) return { error: error.message };
    return {
      message: {
        id:            data.id as string,
        appointmentId: data.direct_conversation_id as string,
        senderId:      data.sender_id as string,
        body:          data.body as string,
        isSystem:      data.is_system as boolean,
        readAt:        data.read_at as string | null,
        createdAt:     data.created_at as string,
      },
    };
  }

  // Appointment-based (legacy)
  const { data: appt } = await supabaseAdmin
    .from("appointments")
    .select("owner_id, groomer_profile_id")
    .eq("id", threadId)
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
      appointment_id: threadId,
      sender_id:      ctx.profileId,
      body:           trimmed,
      is_system:      false,
    })
    .select(
      "id, appointment_id, sender_id, body, is_system, read_at, created_at",
    )
    .single();

  if (error) return { error: error.message };
  return {
    message: {
      id:            data.id as string,
      appointmentId: data.appointment_id as string,
      senderId:      data.sender_id as string,
      body:          data.body as string,
      isSystem:      data.is_system as boolean,
      readAt:        data.read_at as string | null,
      createdAt:     data.created_at as string,
    },
  };
}

// ─── Mark a thread as read ───────────────────────────────────────────────────

export async function markThreadRead(
  threadId: string,
  isDirect = false,
): Promise<{ error?: string }> {
  const ctx = await getMessagingContext();
  if (!ctx) return { error: "Not authenticated" };

  const column = isDirect ? "direct_conversation_id" : "appointment_id";
  const { error } = await supabaseAdmin
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq(column, threadId)
    .neq("sender_id", ctx.profileId)
    .is("read_at", null);

  if (error) return { error: error.message };
  return {};
}

// ─── Groomer: contacts eligible to start a message thread ────────────────────

export interface BookingForMessaging {
  appointmentId: string;
  scheduledAt: string;
  ownerName: string;
  ownerProfileId: string;
  dogName: string | null;
}

export async function getGroomerBookingsForMessaging(): Promise<
  BookingForMessaging[]
> {
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
  const dogIds = [
    ...new Set(appointments.map((a) => a.dog_id as string).filter(Boolean)),
  ];

  const [{ data: owners }, { data: dogs }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, full_name").in("id", ownerIds),
    dogIds.length
      ? supabaseAdmin.from("dogs").select("id, name").in("id", dogIds)
      : Promise.resolve({ data: [] }),
  ]);

  const ownerMap = new Map(
    (owners ?? []).map((p) => [p.id, p.full_name as string]),
  );
  const dogMap = new Map(
    ((dogs as { id: string; name: string }[]) ?? []).map((d) => [d.id, d.name]),
  );

  const all = appointments.map((a) => ({
    appointmentId:  a.id as string,
    scheduledAt:    a.scheduled_at as string,
    ownerName:      ownerMap.get(a.owner_id as string) ?? "Client",
    ownerProfileId: a.owner_id as string,
    dogName:        a.dog_id ? (dogMap.get(a.dog_id as string) ?? null) : null,
  }));

  const seen = new Set<string>();
  return all.filter((b) => {
    const key = `${b.ownerProfileId}||${b.dogName ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Owner: groomers eligible to start / continue a message thread ────────────

export interface GroomerForMessaging {
  appointmentId: string;
  scheduledAt: string;
  groomerProfileId: string;
  groomerName: string;
  groomerAvatarUrl: string | null;
  dogName: string | null;
}

export async function getOwnerBookingsForMessaging(): Promise<
  GroomerForMessaging[]
> {
  const ctx = await getMessagingContext();
  if (!ctx) return [];

  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("id, scheduled_at, dog_id, groomer_profile_id")
    .eq("owner_id", ctx.profileId)
    .not("status", "eq", "cancelled")
    .order("scheduled_at", { ascending: false });

  if (!appointments?.length) return [];

  const groomerProfileIds = [
    ...new Set(
      appointments.map((a) => a.groomer_profile_id as string).filter(Boolean),
    ),
  ];
  const dogIds = [
    ...new Set(appointments.map((a) => a.dog_id as string).filter(Boolean)),
  ];

  const [{ data: groomers }, { data: dogs }] = await Promise.all([
    supabaseAdmin
      .from("groomer_profiles")
      .select("id, business_name, profile_image_url")
      .in("id", groomerProfileIds),
    dogIds.length
      ? supabaseAdmin.from("dogs").select("id, name").in("id", dogIds)
      : Promise.resolve({ data: [] }),
  ]);

  const groomerMap = new Map((groomers ?? []).map((g) => [g.id, g]));
  const dogMap = new Map(
    ((dogs as { id: string; name: string }[]) ?? []).map((d) => [d.id, d.name]),
  );

  const seen = new Set<string>();
  const result: GroomerForMessaging[] = [];
  for (const a of appointments) {
    const gid = a.groomer_profile_id as string;
    if (!gid || seen.has(gid)) continue;
    seen.add(gid);
    const g = groomerMap.get(gid);
    result.push({
      appointmentId:    a.id as string,
      scheduledAt:      a.scheduled_at as string,
      groomerProfileId: gid,
      groomerName:      (g?.business_name as string) ?? "Groomer",
      groomerAvatarUrl: (g?.profile_image_url as string | null) ?? null,
      dogName:          a.dog_id ? (dogMap.get(a.dog_id as string) ?? null) : null,
    });
  }
  return result;
}

// ─── Owner: list all conversation threads ────────────────────────────────────

export async function getOwnerMessageThreads(): Promise<{
  threads: MessageThread[];
  profileId: string;
}> {
  const ctx = await getMessagingContext();
  if (!ctx) return { threads: [], profileId: "" };

  // Appointment-based threads (legacy)
  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("id, scheduled_at, dog_id, groomer_profile_id")
    .eq("owner_id", ctx.profileId)
    .order("scheduled_at", { ascending: false });

  const appointmentThreads: MessageThread[] = [];

  if (appointments?.length) {
    const appointmentIds = appointments.map((a) => a.id);
    const { data: allMessages } = await supabaseAdmin
      .from("messages")
      .select("id, appointment_id, sender_id, body, read_at, created_at")
      .in("appointment_id", appointmentIds)
      .order("created_at", { ascending: false });

    const groomerProfileIds = [
      ...new Set(
        appointments
          .map((a) => a.groomer_profile_id as string)
          .filter(Boolean),
      ),
    ];
    const { data: groomerProfiles } = await supabaseAdmin
      .from("groomer_profiles")
      .select("id, business_name, profile_image_url")
      .in("id", groomerProfileIds);

    const dogIds = [
      ...new Set(appointments.map((a) => a.dog_id as string).filter(Boolean)),
    ];
    const { data: dogs } = dogIds.length
      ? await supabaseAdmin.from("dogs").select("id, name").in("id", dogIds)
      : { data: [] };

    const groomerMap = new Map((groomerProfiles ?? []).map((g) => [g.id, g]));
    const dogMap = new Map(
      (dogs ?? []).map((d) => [d.id, d.name as string]),
    );

    const messagesByAppt = new Map<string, typeof allMessages>();
    for (const m of allMessages ?? []) {
      const apptId = m.appointment_id as string;
      if (!messagesByAppt.has(apptId)) messagesByAppt.set(apptId, []);
      messagesByAppt.get(apptId)!.push(m);
    }

    for (const appt of appointments) {
      const msgs = messagesByAppt.get(appt.id) ?? [];
      if (!msgs.length) continue;
      const lastMsg = msgs[0];
      const unreadCount = msgs.filter(
        (m) => m.sender_id !== ctx.profileId && m.read_at === null,
      ).length;
      const groomer = groomerMap.get(appt.groomer_profile_id as string);
      appointmentThreads.push({
        appointmentId:    appt.id,
        isDirect:         false,
        scheduledAt:      appt.scheduled_at as string,
        ownerName:        "",
        ownerProfileId:   ctx.profileId,
        groomerName:      (groomer?.business_name as string) ?? "Groomer",
        groomerProfileId: appt.groomer_profile_id as string,
        groomerAvatarUrl: (groomer?.profile_image_url as string | null) ?? null,
        dogName:          appt.dog_id ? (dogMap.get(appt.dog_id as string) ?? null) : null,
        lastMessage:      lastMsg.body as string,
        lastMessageAt:    lastMsg.created_at as string,
        unreadCount,
      });
    }
  }

  // Direct conversation threads
  const directThreads = await getDirectConversationThreads(ctx.profileId);

  const allThreads = [...appointmentThreads, ...directThreads].sort(
    (a, b) =>
      new Date(b.lastMessageAt ?? 0).getTime() -
      new Date(a.lastMessageAt ?? 0).getTime(),
  );

  return { threads: allThreads, profileId: ctx.profileId };
}

// ─── Nav context ─────────────────────────────────────────────────────────────

export async function getMessagesNavContext(): Promise<{
  url: string;
  unreadCount: number;
  profileId: string;
  appointmentIds: string[];
}> {
  const ctx = await getMessagingContext();
  if (!ctx)
    return { url: "/dashboard", unreadCount: 0, profileId: "", appointmentIds: [] };

  const isGroomer = !!ctx.groomerProfileId;
  const url = isGroomer
    ? "/dashboard/groomer/messages"
    : "/dashboard/owner/messages";

  let appointmentIds: string[] = [];
  if (isGroomer) {
    const { data } = await supabaseAdmin
      .from("appointments")
      .select("id")
      .eq("groomer_profile_id", ctx.groomerProfileId!);
    appointmentIds = (data ?? []).map((a) => a.id as string);
  } else {
    const { data } = await supabaseAdmin
      .from("appointments")
      .select("id")
      .eq("owner_id", ctx.profileId);
    appointmentIds = (data ?? []).map((a) => a.id as string);
  }

  // Count unread: appointment-based + direct
  let unreadCount = 0;
  if (appointmentIds.length) {
    const { count } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("appointment_id", appointmentIds)
      .neq("sender_id", ctx.profileId)
      .is("read_at", null);
    unreadCount += count ?? 0;
  }

  // Direct conversation unread
  const { data: convs } = await supabaseAdmin
    .from("direct_conversations")
    .select("id")
    .or(
      `participant_a.eq.${ctx.profileId},participant_b.eq.${ctx.profileId}`,
    );
  if (convs?.length) {
    const convIds = convs.map((c) => c.id as string);
    const { count } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("direct_conversation_id", convIds)
      .neq("sender_id", ctx.profileId)
      .is("read_at", null);
    unreadCount += count ?? 0;
  }

  return { url, unreadCount, profileId: ctx.profileId, appointmentIds };
}

// ─── Delete all messages in a thread ────────────────────────────────────────

export async function deleteThread(
  threadId: string,
  isDirect = false,
): Promise<{ error?: string }> {
  const ctx = await getMessagingContext();
  if (!ctx) return { error: "Not authenticated" };

  if (isDirect) {
    const { data: conv } = await supabaseAdmin
      .from("direct_conversations")
      .select("participant_a, participant_b")
      .eq("id", threadId)
      .single();

    if (!conv) return { error: "Conversation not found" };
    if (
      (conv.participant_a as string) !== ctx.profileId &&
      (conv.participant_b as string) !== ctx.profileId
    )
      return { error: "Not authorised" };

    // Delete messages then the conversation row itself
    await supabaseAdmin
      .from("messages")
      .delete()
      .eq("direct_conversation_id", threadId);
    await supabaseAdmin
      .from("direct_conversations")
      .delete()
      .eq("id", threadId);
    return {};
  }

  // Appointment-based (legacy)
  const { data: appt } = await supabaseAdmin
    .from("appointments")
    .select("owner_id, groomer_profile_id")
    .eq("id", threadId)
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

  const { error } = await supabaseAdmin
    .from("messages")
    .delete()
    .eq("appointment_id", threadId);

  if (error) return { error: error.message };
  return {};
}

// ─── Unread count for groomer header badge ────────────────────────────────────

export async function getGroomerUnreadMessageCount(): Promise<number> {
  const ctx = await getMessagingContext();
  if (!ctx?.groomerProfileId) return 0;

  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("id")
    .eq("groomer_profile_id", ctx.groomerProfileId);

  let unread = 0;
  if (appointments?.length) {
    const apptIds = appointments.map((a) => a.id);
    const { count } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("appointment_id", apptIds)
      .neq("sender_id", ctx.profileId)
      .is("read_at", null);
    unread += count ?? 0;
  }

  // Direct conversation unread
  const { data: convs } = await supabaseAdmin
    .from("direct_conversations")
    .select("id")
    .or(
      `participant_a.eq.${ctx.profileId},participant_b.eq.${ctx.profileId}`,
    );
  if (convs?.length) {
    const convIds = convs.map((c) => c.id as string);
    const { count } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("direct_conversation_id", convIds)
      .neq("sender_id", ctx.profileId)
      .is("read_at", null);
    unread += count ?? 0;
  }

  return unread;
}
