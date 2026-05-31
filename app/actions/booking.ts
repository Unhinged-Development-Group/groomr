"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendBookingConfirmationEmails } from "@/lib/emails/send";

async function getProfileId(clerkId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  return data?.id ?? null;
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

  const [availRes, overrideRes, serviceRes, gpRes] = await Promise.all([
    supabaseAdmin
      .from("availability")
      .select("start_time, end_time")
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
  ]);

  if (!availRes.data) return [];
  if (overrideRes.data && !overrideRes.data.is_available) return [];

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

  const bookedIntervals = (existing ?? [])
    .map((a) => {
      const dt    = new Date(a.scheduled_at);
      const start = dt.getUTCHours() * 60 + dt.getUTCMinutes();
      const dur   = a.service_snapshot_duration ?? 60;
      return { start, end: start + dur };
    })
    .sort((a, b) => a.start - b.start);

  // Build free windows between bookings within the working day
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

  const { data: sameDay } = await supabaseAdmin
    .from("appointments")
    .select("scheduled_at, service_snapshot_duration")
    .eq("groomer_profile_id", input.groomerProfileId)
    .neq("status", "cancelled")
    .neq("status", "no_show")
    .gte("scheduled_at", `${dateStr}T00:00:00Z`)
    .lte("scheduled_at", `${dateStr}T23:59:59Z`);

  const hasConflict = (sameDay ?? []).some((a) => {
    const dt     = new Date(a.scheduled_at);
    const aStart = dt.getUTCHours() * 60 + dt.getUTCMinutes();
    const aEnd   = aStart + (a.service_snapshot_duration ?? 60);
    return newStart < aEnd && newEnd > aStart;
  });

  if (hasConflict) return { error: "That slot was just taken — please pick another time." };

  // Resolve effective price — per-service fixed override takes priority over discount %
  let effectivePricePence = service.price_pence;

  const { data: fixedOverride } = await supabaseAdmin
    .from("client_service_prices")
    .select("override_price_pence")
    .eq("groomer_profile_id", input.groomerProfileId)
    .eq("owner_id", profileId)
    .eq("service_id", input.serviceId)
    .maybeSingle();

  if (fixedOverride) {
    effectivePricePence = fixedOverride.override_price_pence;
  } else {
    const { data: clientSettings } = await supabaseAdmin
      .from("client_settings")
      .select("discount_percentage")
      .eq("groomer_profile_id", input.groomerProfileId)
      .eq("owner_id", profileId)
      .maybeSingle();

    if (clientSettings?.discount_percentage != null) {
      effectivePricePence = Math.round(
        service.price_pence * (1 - clientSettings.discount_percentage / 100),
      );
    }
  }

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

  return { appointmentId: data.id };
}
