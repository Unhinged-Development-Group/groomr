"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getProfileId(clerkId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  return data?.id ?? null;
}

export interface AvailableSlot {
  time: string;   // "HH:MM" — used as the scheduled_at time component
  label: string;  // "9:00am" — display label
}

/**
 * Returns available time slots for a groomer on a given date,
 * respecting their weekly availability, overrides, and existing appointments.
 */
export async function getAvailableSlots(
  groomerProfileId: string,
  serviceId: string,
  dateStr: string, // "YYYY-MM-DD"
): Promise<AvailableSlot[]> {
  // 1. Resolve day_of_week — parse without timezone drift
  const [y, m, d] = dateStr.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun

  // 2. Groomer's weekly availability for this day
  const { data: avail } = await supabaseAdmin
    .from("availability")
    .select("start_time, end_time")
    .eq("groomer_profile_id", groomerProfileId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .maybeSingle();

  if (!avail) return [];

  // 3. Date-specific override (can block the day or set custom hours)
  const { data: override } = await supabaseAdmin
    .from("availability_overrides")
    .select("is_available, start_time, end_time")
    .eq("groomer_profile_id", groomerProfileId)
    .eq("override_date", dateStr)
    .maybeSingle();

  if (override && !override.is_available) return [];

  const startTime = (override?.start_time ?? avail.start_time) as string;
  const endTime   = (override?.end_time   ?? avail.end_time)   as string;

  // 4. Service duration
  const { data: service } = await supabaseAdmin
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .eq("is_active", true)
    .maybeSingle();

  const durationMins = service?.duration_minutes ?? 60;

  // 5. Existing non-cancelled appointments on this day
  const { data: existing } = await supabaseAdmin
    .from("appointments")
    .select("scheduled_at, service_snapshot_duration")
    .eq("groomer_profile_id", groomerProfileId)
    .neq("status", "cancelled")
    .neq("status", "no_show")
    .gte("scheduled_at", `${dateStr}T00:00:00Z`)
    .lte("scheduled_at", `${dateStr}T23:59:59Z`);

  // Convert to minute-of-day intervals for overlap checks
  const bookedIntervals = (existing ?? []).map((a) => {
    const dt = new Date(a.scheduled_at);
    const apptMins = dt.getUTCHours() * 60 + dt.getUTCMinutes();
    const dur = a.service_snapshot_duration ?? 60;
    return { start: apptMins, end: apptMins + dur };
  });

  // 6. Generate 30-min-spaced slots within working hours
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const endMins   = eh * 60 + em;

  const slots: AvailableSlot[] = [];
  for (let cur = startMins; cur + durationMins <= endMins; cur += 30) {
    const slotEnd = cur + durationMins;
    const overlaps = bookedIntervals.some((b) => cur < b.end && slotEnd > b.start);
    if (!overlaps) {
      const h   = Math.floor(cur / 60);
      const min = cur % 60;
      const time  = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      const ampm  = h >= 12 ? "pm" : "am";
      const hour  = h % 12 || 12;
      const label = min === 0
        ? `${hour}${ampm}`
        : `${hour}:${String(min).padStart(2, "0")}${ampm}`;
      slots.push({ time, label });
    }
  }

  return slots;
}

export interface CreateAppointmentInput {
  groomerProfileId: string;
  serviceId: string;
  dogId: string;
  scheduledAt: string; // ISO 8601, e.g. "2026-05-20T10:00:00.000Z"
}

/**
 * Creates a pending appointment after validating ownership and availability.
 * Snapshots service name/price/duration at booking time.
 */
export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<{ appointmentId: string } | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Please sign in to book." };

  const profileId = await getProfileId(userId);
  if (!profileId) return { error: "Profile not found." };

  // Verify the dog belongs to this owner
  const { data: dog } = await supabaseAdmin
    .from("dogs")
    .select("id")
    .eq("id", input.dogId)
    .eq("owner_id", profileId)
    .maybeSingle();
  if (!dog) return { error: "Dog not found or doesn't belong to you." };

  // Fetch and validate service
  const { data: service } = await supabaseAdmin
    .from("services")
    .select("name, duration_minutes, price_pence, groomer_profile_id, is_active")
    .eq("id", input.serviceId)
    .maybeSingle();

  if (
    !service ||
    service.groomer_profile_id !== input.groomerProfileId ||
    !service.is_active
  ) {
    return { error: "Service not found." };
  }

  // Conflict check: reject if a non-cancelled appointment already starts at this exact time
  const { count } = await supabaseAdmin
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("groomer_profile_id", input.groomerProfileId)
    .eq("scheduled_at", input.scheduledAt)
    .neq("status", "cancelled")
    .neq("status", "no_show");

  if ((count ?? 0) > 0) {
    return { error: "That slot was just taken — please pick another time." };
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
      service_snapshot_price:    service.price_pence,
      scheduled_at:              input.scheduledAt,
      status:                    "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createAppointment error:", error);
    return { error: "Failed to create appointment. Please try again." };
  }

  return { appointmentId: data.id };
}
