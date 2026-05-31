"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOwnerContext(): Promise<{ profileId: string } | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", userId)
    .maybeSingle();
  return data ? { profileId: data.id } : null;
}

async function getGroomerContext(): Promise<{
  profileId: string;
  groomerProfileId: string;
} | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", userId)
    .maybeSingle();
  if (!profile) return null;
  const { data: gp } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!gp) return null;
  return { profileId: profile.id, groomerProfileId: gp.id };
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function frequencyInterval(frequency: string): { type: "days" | "months"; amount: number } {
  if (frequency === "weekly")    return { type: "days",   amount: 7  };
  if (frequency === "bi-weekly") return { type: "days",   amount: 14 };
  if (frequency === "4-weekly")  return { type: "days",   amount: 28 };
  return                                { type: "months", amount: 1  }; // monthly
}

// Advance a date string by one frequency interval
function nextOccurrence(dateStr: string, frequency: string): string {
  const { type, amount } = frequencyInterval(frequency);
  return type === "days" ? addDays(dateStr, amount) : addMonths(dateStr, amount);
}

// Find the first occurrence of a given dayOfWeek on or after startDate
function firstOccurrenceOnOrAfter(startDate: string, targetDow: number): string {
  const d = new Date(startDate + "T00:00:00Z");
  const dow = d.getUTCDay();
  const diff = (targetDow - dow + 7) % 7;
  if (diff > 0) d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// generateRecurringAppointments
//
// Creates confirmed appointment rows for an active series from its cursor to
// 6 months out (or end_date if set). Called after approval and rolled forward
// when the groomer's dashboard loads and the window is expiring.
// ---------------------------------------------------------------------------

export async function generateRecurringAppointments(
  seriesId: string,
): Promise<{ count: number } | { error: string }> {
  const { data: series, error: seriesErr } = await supabaseAdmin
    .from("recurring_series")
    .select("*")
    .eq("id", seriesId)
    .single();

  if (seriesErr || !series) return { error: "Series not found." };

  const today = new Date().toISOString().slice(0, 10);
  const horizonDate = addMonths(today, 6);
  const endDate = series.end_date
    ? series.end_date < horizonDate
      ? series.end_date
      : horizonDate
    : horizonDate;

  // Start generating from the day after last_generated_at (or today if first run)
  const cursor = series.last_generated_at ? addDays(series.last_generated_at, 1) : today;

  // Find the first occurrence of the target day-of-week on or after cursor
  let current = firstOccurrenceOnOrAfter(cursor, series.preferred_day_of_week);

  // Collect all occurrence dates within the window
  const occurrences: string[] = [];
  while (current <= endDate) {
    occurrences.push(current);
    current = nextOccurrence(current, series.frequency);
  }

  if (occurrences.length === 0) {
    await supabaseAdmin
      .from("recurring_series")
      .update({ last_generated_at: endDate })
      .eq("id", seriesId);
    return { count: 0 };
  }

  // Fetch existing appointments for this series to avoid duplicates
  const { data: existing } = await supabaseAdmin
    .from("appointments")
    .select("scheduled_at")
    .eq("recurring_series_id", seriesId);

  const existingDates = new Set(
    (existing ?? []).map((a) => a.scheduled_at.slice(0, 10)),
  );

  const toInsert = occurrences
    .filter((d) => !existingDates.has(d))
    .map((d) => ({
      owner_id:                  series.owner_id,
      groomer_profile_id:        series.groomer_profile_id,
      dog_id:                    series.dog_id ?? null,
      service_id:                series.service_id ?? null,
      service_snapshot_name:     series.service_snapshot_name ?? null,
      service_snapshot_duration: series.service_snapshot_duration ?? null,
      service_snapshot_price:    series.service_snapshot_price ?? null,
      scheduled_at:              `${d}T${String(series.preferred_time).slice(0, 5)}:00Z`,
      status:                    "confirmed",
      recurring_series_id:       seriesId,
    }));

  if (toInsert.length > 0) {
    const { error: insertErr } = await supabaseAdmin
      .from("appointments")
      .insert(toInsert);
    if (insertErr) {
      console.error("[generateRecurringAppointments] insert error:", insertErr);
      return { error: "Failed to generate appointments." };
    }
  }

  await supabaseAdmin
    .from("recurring_series")
    .update({ last_generated_at: endDate })
    .eq("id", seriesId);

  return { count: toInsert.length };
}

// ---------------------------------------------------------------------------
// requestRecurringSeries
//
// Called by an owner from their Previous Grooms tab. Creates a pending series
// and fires a notification to the groomer.
// ---------------------------------------------------------------------------

export async function requestRecurringSeries(input: {
  appointmentId: string;
  frequency: "weekly" | "bi-weekly" | "4-weekly" | "monthly";
  preferredDayOfWeek: number;
  preferredTime: string; // "HH:MM"
  endDate?: string | null; // "YYYY-MM-DD" or null for ongoing
}): Promise<{ seriesId: string } | { error: string }> {
  const ctx = await getOwnerContext();
  if (!ctx) return { error: "Not authenticated." };

  // Load the source appointment
  const { data: appt } = await supabaseAdmin
    .from("appointments")
    .select("owner_id, groomer_profile_id, dog_id, service_id, service_snapshot_name, service_snapshot_duration, service_snapshot_price")
    .eq("id", input.appointmentId)
    .eq("owner_id", ctx.profileId)
    .maybeSingle();

  if (!appt) return { error: "Appointment not found." };

  // Check no active series already exists for this groomer+owner+dog combo
  const { data: existingSeries } = await supabaseAdmin
    .from("recurring_series")
    .select("id")
    .eq("groomer_profile_id", appt.groomer_profile_id)
    .eq("owner_id", ctx.profileId)
    .eq("dog_id", appt.dog_id ?? "")
    .in("status", ["pending_approval", "active"])
    .maybeSingle();

  if (existingSeries) {
    return { error: "A recurring series is already active or pending for this dog." };
  }

  const { data: series, error: insertErr } = await supabaseAdmin
    .from("recurring_series")
    .insert({
      groomer_profile_id:        appt.groomer_profile_id,
      owner_id:                  ctx.profileId,
      dog_id:                    appt.dog_id,
      service_id:                appt.service_id,
      frequency:                 input.frequency,
      preferred_day_of_week:     input.preferredDayOfWeek,
      preferred_time:            input.preferredTime + ":00",
      end_date:                  input.endDate ?? null,
      status:                    "pending_approval",
      requested_by:              "owner",
      service_snapshot_name:     appt.service_snapshot_name,
      service_snapshot_duration: appt.service_snapshot_duration,
      service_snapshot_price:    appt.service_snapshot_price,
    })
    .select("id")
    .single();

  if (insertErr || !series) {
    console.error("[requestRecurringSeries]", insertErr);
    return { error: "Failed to create recurring series." };
  }

  // Load owner profile + dog name for notification
  const [{ data: ownerProfile }, { data: dog }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", ctx.profileId)
      .maybeSingle(),
    appt.dog_id
      ? supabaseAdmin.from("dogs").select("name, breed, profile_image_url").eq("id", appt.dog_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const ownerName = ownerProfile?.full_name ?? "A client";
  const dogName = dog?.name ?? null;
  const dogBreed = dog?.breed ?? null;
  const dogPhotoUrl = dog?.profile_image_url ?? null;
  const serviceName = appt.service_snapshot_name ?? null;

  const DAY_NAMES = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
  const freqLabel: Record<string, string> = {
    "weekly": "every week", "bi-weekly": "every 2 weeks",
    "4-weekly": "every 4 weeks", "monthly": "every month",
  };

  const dayLabel = DAY_NAMES[input.preferredDayOfWeek] ?? `day ${input.preferredDayOfWeek}`;
  const parts = [
    dogName ? `for ${dogName}` : null,
    serviceName ? `(${serviceName})` : null,
  ].filter(Boolean).join(" ");

  const body = `${ownerName} has requested ${freqLabel[input.frequency] ?? input.frequency} on ${dayLabel} at ${input.preferredTime}${parts ? ` — ${parts}` : ""}.`;

  await supabaseAdmin.from("notifications").insert({
    groomer_profile_id: appt.groomer_profile_id,
    type:     "recurring_request",
    title:    "Recurring booking request",
    body,
    metadata: {
      series_id:    series.id,
      owner_id:     ctx.profileId,
      owner_name:   ownerName,
      owner_email:  ownerProfile?.email ?? null,
      owner_phone:  ownerProfile?.phone ?? null,
      dog_name:      dogName,
      dog_breed:     dogBreed,
      dog_photo_url: dogPhotoUrl,
      service_name: serviceName,
      frequency:    input.frequency,
      day_of_week:  input.preferredDayOfWeek,
      time:         input.preferredTime,
      end_date:     input.endDate ?? null,
    },
  });

  return { seriesId: series.id };
}

// ---------------------------------------------------------------------------
// createGroomerRecurringSeries
//
// Called by the groomer directly from their calendar — auto-approved.
// ---------------------------------------------------------------------------

export async function createGroomerRecurringSeries(input: {
  appointmentId: string;
  frequency: "weekly" | "bi-weekly" | "4-weekly" | "monthly";
  preferredDayOfWeek: number;
  preferredTime: string; // "HH:MM"
  endDate?: string | null;
}): Promise<{ seriesId: string; appointmentsCreated: number } | { error: string }> {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authenticated as a groomer." };

  const { data: appt } = await supabaseAdmin
    .from("appointments")
    .select("owner_id, groomer_profile_id, dog_id, service_id, service_snapshot_name, service_snapshot_duration, service_snapshot_price")
    .eq("id", input.appointmentId)
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .maybeSingle();

  if (!appt) return { error: "Appointment not found." };

  const { data: series, error: insertErr } = await supabaseAdmin
    .from("recurring_series")
    .insert({
      groomer_profile_id:        ctx.groomerProfileId,
      owner_id:                  appt.owner_id,
      dog_id:                    appt.dog_id,
      service_id:                appt.service_id,
      frequency:                 input.frequency,
      preferred_day_of_week:     input.preferredDayOfWeek,
      preferred_time:            input.preferredTime + ":00",
      end_date:                  input.endDate ?? null,
      status:                    "active",
      requested_by:              "groomer",
      service_snapshot_name:     appt.service_snapshot_name,
      service_snapshot_duration: appt.service_snapshot_duration,
      service_snapshot_price:    appt.service_snapshot_price,
    })
    .select("id")
    .single();

  if (insertErr || !series) {
    console.error("[createGroomerRecurringSeries]", insertErr);
    return { error: "Failed to create recurring series." };
  }

  const genResult = await generateRecurringAppointments(series.id);
  if ("error" in genResult) {
    console.error("[createGroomerRecurringSeries] generate error:", genResult.error);
  }
  const count = "count" in genResult ? genResult.count : 0;

  return { seriesId: series.id, appointmentsCreated: count };
}

// ---------------------------------------------------------------------------
// approveRecurringSeries — groomer approves an owner request
// ---------------------------------------------------------------------------

export async function approveRecurringSeries(
  seriesId: string,
): Promise<{ appointmentsCreated: number } | { error: string }> {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authenticated as a groomer." };

  const { error: updateErr } = await supabaseAdmin
    .from("recurring_series")
    .update({ status: "active" })
    .eq("id", seriesId)
    .eq("groomer_profile_id", ctx.groomerProfileId);

  if (updateErr) return { error: "Failed to approve series." };

  const genResult = await generateRecurringAppointments(seriesId);
  return "count" in genResult
    ? { appointmentsCreated: genResult.count }
    : genResult;
}

// ---------------------------------------------------------------------------
// declineRecurringSeries — groomer declines an owner request
// ---------------------------------------------------------------------------

export async function declineRecurringSeries(
  seriesId: string,
): Promise<{ ok: true } | { error: string }> {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authenticated as a groomer." };

  const { error } = await supabaseAdmin
    .from("recurring_series")
    .update({ status: "cancelled" })
    .eq("id", seriesId)
    .eq("groomer_profile_id", ctx.groomerProfileId);

  if (error) return { error: "Failed to decline series." };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// ownerCancelRecurringSeries
//
// Owner cancels a series they belong to. Cancels the series and all their
// own future confirmed appointments in it.
// ---------------------------------------------------------------------------

export async function ownerCancelRecurringSeries(
  seriesId: string,
): Promise<{ cancelledAppointments: number } | { error: string }> {
  const ctx = await getOwnerContext();
  if (!ctx) return { error: "Not authenticated." };

  const { error: seriesErr } = await supabaseAdmin
    .from("recurring_series")
    .update({ status: "cancelled" })
    .eq("id", seriesId)
    .eq("owner_id", ctx.profileId);

  if (seriesErr) return { error: "Failed to cancel recurring series." };

  const now = new Date().toISOString();

  const { data: cancelled, error: apptErr } = await supabaseAdmin
    .from("appointments")
    .update({ status: "cancelled", cancelled_by: "owner", cancellation_reason: "Recurring series cancelled by owner" })
    .eq("recurring_series_id", seriesId)
    .eq("owner_id", ctx.profileId)
    .eq("status", "confirmed")
    .gt("scheduled_at", now)
    .select("id");

  if (apptErr) {
    console.error("[ownerCancelRecurringSeries] appointment cancel error:", apptErr);
  }

  return { cancelledAppointments: (cancelled ?? []).length };
}

// ---------------------------------------------------------------------------
// rollActiveRecurringSeries
//
// Called when the groomer loads their dashboard. Extends any ongoing active
// series whose last_generated_at is within 1 month of today — keeps the
// calendar populated without a separate cron job.
// ---------------------------------------------------------------------------

export async function rollActiveRecurringSeries(
  groomerProfileId: string,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const rollThreshold = addMonths(today, 1);

  const { data: expiringSeries } = await supabaseAdmin
    .from("recurring_series")
    .select("id")
    .eq("groomer_profile_id", groomerProfileId)
    .eq("status", "active")
    .is("end_date", null)
    .or(`last_generated_at.is.null,last_generated_at.lte.${rollThreshold}`);

  if (!expiringSeries || expiringSeries.length === 0) return;

  await Promise.all(
    expiringSeries.map((s) => generateRecurringAppointments(s.id)),
  );
}

// ---------------------------------------------------------------------------
// cancelRecurringSeries
//
// Groomer cancels an active series. Sets status = 'cancelled' and cancels all
// future confirmed appointments that were generated from the series.
// ---------------------------------------------------------------------------

export async function cancelRecurringSeries(
  seriesId: string,
): Promise<{ cancelledAppointments: number } | { error: string }> {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authenticated as a groomer." };

  const { error: seriesErr } = await supabaseAdmin
    .from("recurring_series")
    .update({ status: "cancelled" })
    .eq("id", seriesId)
    .eq("groomer_profile_id", ctx.groomerProfileId);

  if (seriesErr) return { error: "Failed to cancel recurring series." };

  const now = new Date().toISOString();

  // Cancel all future confirmed appointments in this series
  const { data: cancelled, error: apptErr } = await supabaseAdmin
    .from("appointments")
    .update({ status: "cancelled", cancelled_by: "groomer", cancellation_reason: "Recurring series cancelled" })
    .eq("recurring_series_id", seriesId)
    .eq("status", "confirmed")
    .gt("scheduled_at", now)
    .select("id");

  if (apptErr) {
    console.error("[cancelRecurringSeries] appointment cancel error:", apptErr);
  }

  return { cancelledAppointments: (cancelled ?? []).length };
}
