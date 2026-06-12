"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getProfileId } from "@/lib/auth-helpers";
import { sendBookingConfirmationEmails } from "@/lib/emails/send";
import { sendBookingConfirmationSMS } from "@/lib/sms/send";

async function fetchSameDayAppointments(groomerProfileId: string, dateStr: string) {
  const { data } = await supabaseAdmin
    .from("appointments")
    .select("scheduled_at, service_snapshot_duration")
    .eq("groomer_profile_id", groomerProfileId)
    .neq("status", "cancelled")
    .neq("status", "no_show")
    .gte("scheduled_at", `${dateStr}T00:00:00Z`)
    .lte("scheduled_at", `${dateStr}T23:59:59Z`);
  return data ?? [];
}

async function resolveEffectivePrice(
  groomerProfileId: string,
  ownerId: string,
  serviceId: string,
  basePricePence: number,
): Promise<number> {
  const { data: fixedOverride } = await supabaseAdmin
    .from("client_service_prices")
    .select("override_price_pence")
    .eq("groomer_profile_id", groomerProfileId)
    .eq("owner_id", ownerId)
    .eq("service_id", serviceId)
    .maybeSingle();

  if (fixedOverride) return fixedOverride.override_price_pence;

  const { data: clientSettings } = await supabaseAdmin
    .from("client_settings")
    .select("discount_percentage")
    .eq("groomer_profile_id", groomerProfileId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (clientSettings?.discount_percentage != null) {
    const pct = Math.max(0, Math.min(100, clientSettings.discount_percentage));
    return Math.round(basePricePence * (1 - pct / 100));
  }

  return basePricePence;
}

function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatSlot(totalMins: number): { time: string; label: string } {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  const label = m === 0
    ? `${hour}${ampm}`
    : `${hour}:${String(m).padStart(2, "0")}${ampm}`;
  return { time, label };
}

export interface AvailableSlot {
  time: string;   // "HH:MM" — used as the scheduled_at time component
  label: string;  // "9:00am" — display label
}

/**
 * Returns available time slots for a groomer on a given date.
 *
 * Algorithm:
 * 1. Get working hours for the day (weekly schedule + any override)
 * 2. Get all confirmed appointments, build sorted booked intervals
 * 3. Derive free windows — gaps between bookings and the day boundaries
 * 4. Within each window, generate slots stepping by (duration + buffer).
 *    A slot is only offered if the full service fits inside the window,
 *    so a 45-min gap never shows a 60-min service and can't be fragmented.
 */
export async function getAvailableSlots(
  groomerProfileId: string,
  serviceId: string,
  dateStr: string, // "YYYY-MM-DD"
): Promise<AvailableSlot[]> {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();

  const [availRes, overrideRes, serviceRes, gpRes, timeBlockRes] = await Promise.all([
    supabaseAdmin
      .from("availability")
      .select("start_time, end_time, break_start_time, break_end_time")
      .eq("groomer_profile_id", groomerProfileId)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .maybeSingle(),
    supabaseAdmin
      .from("availability_overrides")
      .select("is_available, start_time, end_time")
      .eq("groomer_profile_id", groomerProfileId)
      .eq("override_date", dateStr)
      .maybeSingle(),
    supabaseAdmin
      .from("services")
      .select("duration_minutes")
      .eq("id", serviceId)
      .eq("is_active", true)
      .maybeSingle(),
    supabaseAdmin
      .from("groomer_profiles")
      .select("default_buffer_minutes")
      .eq("id", groomerProfileId)
      .maybeSingle(),
    // time_blocks: groomer-declared unavailability periods overlapping this date
    supabaseAdmin
      .from("time_blocks")
      .select("start_time, end_time, all_day")
      .eq("groomer_profile_id", groomerProfileId)
      .lte("start_date", dateStr)
      .gte("end_date", dateStr),
  ]);

  if (!availRes.data) return [];
  if (overrideRes.data && !overrideRes.data.is_available) return [];

  // Any all-day time block → groomer entirely unavailable
  const timeBlocks = timeBlockRes.data ?? [];
  if (timeBlocks.some((b) => b.all_day)) return [];

  const startTime  = (overrideRes.data?.start_time ?? availRes.data.start_time) as string;
  const endTime    = (overrideRes.data?.end_time   ?? availRes.data.end_time)   as string;
  const durationMins = serviceRes.data?.duration_minutes ?? 60;
  const bufferMins   = gpRes.data?.default_buffer_minutes ?? 0;
  const stepMins     = durationMins + bufferMins;

  const dayStart = toMinutes(startTime);
  const dayEnd   = toMinutes(endTime);

  const { data: existing } = await supabaseAdmin
    .from("appointments")
    .select("scheduled_at, service_snapshot_duration")
    .eq("groomer_profile_id", groomerProfileId)
    .neq("status", "cancelled")
    .neq("status", "no_show")
    .gte("scheduled_at", `${dateStr}T00:00:00Z`)
    .lte("scheduled_at", `${dateStr}T23:59:59Z`);

  // Merge all blocked intervals: appointments + partial-day time_blocks + break window
  const bookedIntervals: Array<{ start: number; end: number }> = [];

  for (const a of existing ?? []) {
    const dt    = new Date(a.scheduled_at);
    const start = dt.getUTCHours() * 60 + dt.getUTCMinutes();
    bookedIntervals.push({ start, end: start + (a.service_snapshot_duration ?? 60) });
  }

  for (const block of timeBlocks.filter((b) => !b.all_day)) {
    if (block.start_time && block.end_time) {
      bookedIntervals.push({
        start: toMinutes(block.start_time as string),
        end:   toMinutes(block.end_time   as string),
      });
    }
  }

  const rawBreakStart = availRes.data.break_start_time as string | null;
  const rawBreakEnd   = availRes.data.break_end_time   as string | null;
  if (rawBreakStart?.startsWith("[")) {
    try {
      const breaks = JSON.parse(rawBreakStart) as { s: string; e: string }[];
      for (const b of breaks) {
        if (b.s && b.e) bookedIntervals.push({ start: toMinutes(b.s), end: toMinutes(b.e) });
      }
    } catch { /* ignore bad JSON */ }
  } else if (rawBreakStart && rawBreakEnd) {
    bookedIntervals.push({ start: toMinutes(rawBreakStart), end: toMinutes(rawBreakEnd) });
  }

  bookedIntervals.sort((a, b) => a.start - b.start);

  // Build free windows between booked intervals within the working day
  const windows: { start: number; end: number }[] = [];
  let cursor = dayStart;
  for (const booked of bookedIntervals) {
    if (cursor < booked.start) windows.push({ start: cursor, end: booked.start });
    cursor = Math.max(cursor, booked.end);
  }
  if (cursor < dayEnd) windows.push({ start: cursor, end: dayEnd });

  // Generate slots — only where the full service fits
  const slots: AvailableSlot[] = [];
  for (const window of windows) {
    for (let cur = window.start; cur + durationMins <= window.end; cur += stepMins) {
      slots.push(formatSlot(cur));
    }
  }

  return slots;
}

export interface CreateAppointmentInput {
  groomerProfileId: string;
  serviceId: string;
  dogId: string;
  scheduledAt: string; // ISO 8601 e.g. "2026-05-20T10:00:00.000Z"
}

/**
 * Creates a pending appointment after validating ownership and availability.
 * Snapshots service name/price/duration at booking time.
 * Uses overlap detection (not just exact-time match) to prevent double-booking.
 */
export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<{ appointmentId: string } | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Please sign in to book." };

  const profileId = await getProfileId(userId);
  if (!profileId) return { error: "Profile not found." };

  const { data: dog } = await supabaseAdmin
    .from("dogs")
    .select("id")
    .eq("id", input.dogId)
    .eq("owner_id", profileId)
    .maybeSingle();
  if (!dog) return { error: "Dog not found or doesn't belong to you." };

  const { data: service } = await supabaseAdmin
    .from("services")
    .select("name, duration_minutes, price_pence, groomer_profile_id, is_active")
    .eq("id", input.serviceId)
    .maybeSingle();

  if (!service || service.groomer_profile_id !== input.groomerProfileId || !service.is_active) {
    return { error: "Service not found." };
  }

  // Overlap check: reject if new appointment overlaps any existing one
  const dateStr  = input.scheduledAt.slice(0, 10);
  const newDt    = new Date(input.scheduledAt);
  const newStart = newDt.getUTCHours() * 60 + newDt.getUTCMinutes();
  const newEnd   = newStart + (service.duration_minutes ?? 60);

  const sameDay = await fetchSameDayAppointments(input.groomerProfileId, dateStr);

  const hasConflict = sameDay.some((a) => {
    const dt     = new Date(a.scheduled_at);
    const aStart = dt.getUTCHours() * 60 + dt.getUTCMinutes();
    const aEnd   = aStart + (a.service_snapshot_duration ?? 60);
    return newStart < aEnd && newEnd > aStart;
  });

  if (hasConflict) return { error: "That slot was just taken — please pick another time." };

  // Resolve effective price — per-service fixed override takes priority over discount %
  const effectivePricePence = await resolveEffectivePrice(
    input.groomerProfileId,
    profileId,
    input.serviceId,
    service.price_pence,
  );

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .insert({
      owner_id:                  profileId,
      groomer_profile_id:        input.groomerProfileId,
      dog_id:                    input.dogId,
      service_id:                input.serviceId,
      service_snapshot_name:     service.name,
      service_snapshot_duration: service.duration_minutes,
      service_snapshot_price:    effectivePricePence,
      scheduled_at:              input.scheduledAt,
      status:                    "confirmed",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createAppointment error:", error);
    return { error: "Failed to create appointment. Please try again." };
  }

  console.log("[createAppointment] created id:", data.id, "groomer:", input.groomerProfileId);

  await sendBookingConfirmationEmails(data.id).catch((e) =>
    console.error("[createAppointment] email error:", e),
  );
  sendBookingConfirmationSMS(data.id).catch((e) =>
    console.error("[createAppointment] sms error:", e),
  );

  return { appointmentId: data.id };
}

// ---------------------------------------------------------------------------
// createGroupAppointment
//
// Books multiple dogs in one session. Each dog gets its own appointments row;
// all rows share a booking_group_id. Appointments are scheduled back-to-back
// starting from scheduledAt. Per-client pricing is applied to each pet.
// ---------------------------------------------------------------------------

export interface GroupPet {
  dogId: string;
  serviceId: string;
}

export async function createGroupAppointment(input: {
  groomerProfileId: string;
  scheduledAt: string; // ISO 8601 — start time for the first pet
  pets: GroupPet[];    // ordered list; first pet starts at scheduledAt
}): Promise<{ appointmentIds: string[]; bookingGroupId: string } | { error: string }> {
  if (input.pets.length < 2) return { error: "Use createAppointment for single-pet bookings." };

  const { userId } = await auth();
  if (!userId) return { error: "Please sign in to book." };

  const profileId = await getProfileId(userId);
  if (!profileId) return { error: "Profile not found." };

  // Validate all dogs belong to this owner
  const dogIds = input.pets.map((p) => p.dogId);
  const { data: ownedDogs } = await supabaseAdmin
    .from("dogs")
    .select("id")
    .eq("owner_id", profileId)
    .in("id", dogIds);

  const ownedIds = new Set((ownedDogs ?? []).map((d) => d.id));
  if (dogIds.some((id) => !ownedIds.has(id))) {
    return { error: "One or more dogs don't belong to your account." };
  }

  // Fetch all services and apply per-client pricing
  type ResolvedPet = {
    dogId: string;
    serviceId: string;
    name: string;
    durationMinutes: number;
    effectivePricePence: number;
  };

  const resolved: ResolvedPet[] = [];
  for (const pet of input.pets) {
    const { data: service } = await supabaseAdmin
      .from("services")
      .select("name, duration_minutes, price_pence, groomer_profile_id, is_active")
      .eq("id", pet.serviceId)
      .maybeSingle();

    if (!service || service.groomer_profile_id !== input.groomerProfileId || !service.is_active) {
      return { error: `Service not found for one of the pets.` };
    }

    const effectivePricePence = await resolveEffectivePrice(
      input.groomerProfileId,
      profileId,
      pet.serviceId,
      service.price_pence,
    );

    resolved.push({
      dogId: pet.dogId,
      serviceId: pet.serviceId,
      name: service.name,
      durationMinutes: service.duration_minutes,
      effectivePricePence,
    });
  }

  // Compute back-to-back start times and check for a single overlap window
  const startDt = new Date(input.scheduledAt);
  const dateStr = input.scheduledAt.slice(0, 10);
  const groupStart = startDt.getUTCHours() * 60 + startDt.getUTCMinutes();
  const groupEnd = groupStart + resolved.reduce((sum, p) => sum + p.durationMinutes, 0);

  const sameDay = await fetchSameDayAppointments(input.groomerProfileId, dateStr);

  const hasConflict = sameDay.some((a) => {
    const dt = new Date(a.scheduled_at);
    const aStart = dt.getUTCHours() * 60 + dt.getUTCMinutes();
    const aEnd = aStart + (a.service_snapshot_duration ?? 60);
    return groupStart < aEnd && groupEnd > aStart;
  });

  if (hasConflict) return { error: "That slot conflicts with an existing booking — please pick another time." };

  // Check time_blocks
  const { data: groupTimeBlocks } = await supabaseAdmin
    .from("time_blocks")
    .select("start_time, end_time, all_day")
    .eq("groomer_profile_id", input.groomerProfileId)
    .lte("start_date", dateStr)
    .gte("end_date", dateStr);

  const hasTimeBlockConflict = (groupTimeBlocks ?? []).some((b) => {
    if (b.all_day) return true;
    if (!b.start_time || !b.end_time) return false;
    const bStart = toMinutes(b.start_time as string);
    const bEnd   = toMinutes(b.end_time   as string);
    return groupStart < bEnd && groupEnd > bStart;
  });

  if (hasTimeBlockConflict) return { error: "That time is blocked — please choose a different time." };

  // Build appointment rows with sequential start times
  const bookingGroupId = crypto.randomUUID();
  let cursor = startDt;

  const rows = resolved.map((pet) => {
    const scheduledAt = cursor.toISOString();
    cursor = new Date(cursor.getTime() + pet.durationMinutes * 60 * 1000);
    return {
      owner_id:                  profileId,
      groomer_profile_id:        input.groomerProfileId,
      dog_id:                    pet.dogId,
      service_id:                pet.serviceId,
      service_snapshot_name:     pet.name,
      service_snapshot_duration: pet.durationMinutes,
      service_snapshot_price:    pet.effectivePricePence,
      scheduled_at:              scheduledAt,
      status:                    "confirmed",
      booking_group_id:          bookingGroupId,
    };
  });

  const { data: inserted, error } = await supabaseAdmin
    .from("appointments")
    .insert(rows)
    .select("id");

  if (error || !inserted) {
    console.error("[createGroupAppointment]", error);
    return { error: "Failed to create appointments. Please try again." };
  }

  const appointmentIds = inserted.map((r) => r.id);
  return { appointmentIds, bookingGroupId };
}
