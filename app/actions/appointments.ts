"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendCancellationEmails } from "@/lib/emails/send";
import { sendCancellationSMS } from "@/lib/sms/send";

export interface Appointment {
  id: string;
  owner_id: string;
  groomer_profile_id: string;
  dog_id: string;
  service_id: string;
  service_snapshot_name: string | null;
  service_snapshot_duration: number | null;
  service_snapshot_price: number | null;
  scheduled_at: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  cancelled_by: string | null;
  cancellation_reason: string | null;
  groomer_notes: string | null;
  owner_notes: string | null;
  created_at: string;
  updated_at: string;

  groomer_profiles?: {
    business_name: string;
    profile_image_url: string | null;
    address_line_1: string | null;
    city: string | null;
    postcode: string | null;
    average_rating: number | null;
    total_reviews: number | null;
    stripe_charges_enabled: boolean | null;
  } | null;

  dogs?: {
    name: string;
  } | null;

  reviews?: { id: string }[] | null;
  recurring_series_id?: string | null;
}

async function getProfileId(clerkId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  
  return data?.id || null;
}

export async function getOwnerAppointments(): Promise<Appointment[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const profileId = await getProfileId(userId);
  if (!profileId) return [];

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(`
      *,
      groomer_profiles (
        business_name,
        profile_image_url,
        address_line_1,
        city,
        postcode,
        average_rating,
        total_reviews,
        stripe_charges_enabled
      ),
      dogs (name),
      reviews (id)
    `)
    .eq("owner_id", profileId)
    .order("scheduled_at", { ascending: false });

  if (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }

  return (data ?? []) as Appointment[];
}

export async function getGroomerAvailabilityDays(groomerProfileId: string): Promise<number[]> {
  const { data } = await supabaseAdmin
    .from("availability")
    .select("day_of_week")
    .eq("groomer_profile_id", groomerProfileId)
    .eq("is_active", true);
  return (data ?? []).map((r) => r.day_of_week as number);
}

export async function rescheduleAppointment(
  appointmentId: string,
  newScheduledAt: string,
): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not authenticated" };

  const profileId = await getProfileId(userId);
  if (!profileId) return { ok: false, error: "Profile not found" };

  const { error } = await supabaseAdmin
    .from("appointments")
    .update({
      scheduled_at: newScheduledAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)
    .eq("owner_id", profileId);

  if (error) return { ok: false, error: "Failed to reschedule appointment" };
  return { ok: true };
}

export async function cancelAppointment(appointmentId: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not authenticated" };

  const profileId = await getProfileId(userId);
  if (!profileId) return { ok: false, error: "Profile not found" };

  const { error } = await supabaseAdmin
    .from("appointments")
    .update({ 
      status: 'cancelled',
      cancelled_by: profileId,
      cancellation_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq("id", appointmentId)
    .eq("owner_id", profileId);

  if (error) {
    console.error("Error cancelling appointment:", error);
    return { ok: false, error: "Failed to cancel appointment" };
  }

  await sendCancellationEmails(appointmentId).catch((e) =>
    console.error("[cancelAppointment] email error:", e),
  );
  sendCancellationSMS(appointmentId).catch((e) =>
    console.error("[cancelAppointment] sms error:", e),
  );

  return { ok: true };
}

export async function submitOwnerReview(
  appointmentId: string,
  rating: number,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not authenticated" };

  const profileId = await getProfileId(userId);
  if (!profileId) return { ok: false, error: "Profile not found" };

  // Verify ownership and get groomer_profile_id in one query
  const { data: apt } = await supabaseAdmin
    .from("appointments")
    .select("groomer_profile_id")
    .eq("id", appointmentId)
    .eq("owner_id", profileId)
    .maybeSingle();

  if (!apt) return { ok: false, error: "Appointment not found" };

  const { error } = await supabaseAdmin
    .from("reviews")
    .insert({
      appointment_id: appointmentId,
      owner_id: profileId,
      groomer_profile_id: apt.groomer_profile_id,
      rating,
      body: body.trim() || null,
    });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
