"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Appointment } from "@/app/actions/appointments";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { groomCompleteEmail } from "@/lib/emails/groom-complete";

export interface GroomerProfileDetails {
  id: string;
  business_name: string;
  bio: string | null;
  is_mobile: boolean;
  service_radius: number | null;
  address_line_1: string | null;
  postcode: string | null;
  average_rating: number;
  total_reviews: number;
  is_verified: boolean;
}

export interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price_pence: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  since_year: number | null;
  public_slug: string | null;
  average_rating: number;
  total_reviews: number;
}

export interface Payment {
  id: string;
  amount: number; // For simplicity, we'll return full_amount_pence or deposit
  date: string;
  status: string;
  appointment_id: string;
}

export interface Review {
  id: string;
  rating: number;
  body: string | null;
  groomer_reply: string | null;
  groomer_replied_at: string | null;
  created_at: string;
  appointment_id: string;
  appointments?: {
    service_snapshot_name: string;
    dogs?: { name: string };
  };
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Internal Helper — works for both direct groomers and accepted team members
async function getGroomerContext() {
  const { userId } = await auth();
  if (!userId) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", userId)
    .maybeSingle();

  if (!profile) return null;

  // Direct groomer owner
  const { data: groomer } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (groomer) return { profileId: profile.id, groomerProfileId: groomer.id };

  // Team member — use their employer's groomer profile
  const { data: membership } = await supabaseAdmin
    .from("team_members")
    .select("groomer_profile_id")
    .eq("user_id", profile.id)
    .eq("invite_status", "accepted")
    .maybeSingle();

  if (!membership) return null;

  return { profileId: profile.id, groomerProfileId: membership.groomer_profile_id as string };
}

export async function getGroomerProfile() {
  const ctx = await getGroomerContext();
  if (!ctx) return null;

  const { data: profileData } = await supabaseAdmin
    .from("groomer_profiles")
    .select("*")
    .eq("id", ctx.groomerProfileId)
    .single();

  const { data: servicesData } = await supabaseAdmin
    .from("services")
    .select("*")
    .eq("groomer_profile_id", ctx.groomerProfileId);

  const { data: teamData } = await supabaseAdmin
    .from("team_members")
    .select("*")
    .eq("groomer_profile_id", ctx.groomerProfileId);

  return {
    profile: profileData as GroomerProfileDetails,
    services: (servicesData || []) as Service[],
    team: (teamData || []) as TeamMember[],
  };
}

export async function getGroomerAppointments() {
  const ctx = await getGroomerContext();
  console.log("[getGroomerAppointments] ctx:", ctx);
  if (!ctx) return [];

  // Roll any ongoing recurring series whose window is expiring
  const { rollActiveRecurringSeries } = await import("./recurring");
  rollActiveRecurringSeries(ctx.groomerProfileId).catch((e) =>
    console.error("[getGroomerAppointments] roll error:", e),
  );

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(`
      *,
      dogs (name, breed, coat_type, profile_image_url),
      profiles!appointments_owner_id_fkey (full_name, email, phone, clerk_id)
    `)
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .order("scheduled_at", { ascending: true });

  console.log("[getGroomerAppointments] count:", data?.length, "error:", error);
  return (data || []) as any[];
}

export async function getGroomerReviews() {
  const ctx = await getGroomerContext();
  if (!ctx) return [];

  // Wait, the reviews table has appointment_id but not groomer_profile_id.
  // We need to fetch reviews for this groomer's appointments.
  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("id")
    .eq("groomer_profile_id", ctx.groomerProfileId);

  if (!appointments || appointments.length === 0) return [];
  const appointmentIds = appointments.map(a => a.id);

  const { data } = await supabaseAdmin
    .from("reviews")
    .select(`
      *,
      appointments (
        service_snapshot_name,
        dogs (name)
      ),
      profiles!reviews_owner_id_fkey (full_name, avatar_url, clerk_id)
    `)
    .in("appointment_id", appointmentIds)
    .order("created_at", { ascending: false });

  const reviews = (data || []) as any[];

  // avatar_url in DB may be stale/null — fetch live from Clerk
  const clerkIds = reviews
    .map((r) => r.profiles?.clerk_id)
    .filter(Boolean) as string[];

  const clerkImageMap = new Map<string, string>();
  if (clerkIds.length) {
    try {
      const clerk = await clerkClient();
      const { data: clerkUsers } = await clerk.users.getUserList({ userId: clerkIds, limit: 100 });
      for (const u of clerkUsers) clerkImageMap.set(u.id, u.imageUrl);
    } catch {
      // non-fatal — fall back to DB value
    }
  }

  return reviews.map((r) => ({
    ...r,
    profiles: r.profiles
      ? { ...r.profiles, avatar_url: clerkImageMap.get(r.profiles.clerk_id) ?? r.profiles.avatar_url ?? null }
      : r.profiles,
  })) as Review[];
}

export async function getGroomerPayments() {
  const ctx = await getGroomerContext();
  if (!ctx) return [];

  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("id")
    .eq("groomer_profile_id", ctx.groomerProfileId);

  if (!appointments || appointments.length === 0) return [];
  const appointmentIds = appointments.map(a => a.id);

  const { data } = await supabaseAdmin
    .from("payments")
    .select("*")
    .in("appointment_id", appointmentIds);

  // Return mapped payments for Earnings chart
  return (data || []).map(p => ({
    id: p.id,
    amount: p.full_amount_pence || p.deposit_amount_pence || 0,
    date: p.full_payment_paid_at || p.deposit_paid_at || p.created_at,
    status: p.full_payment_intent_id ? "Paid" : "Deposit",
    appointment_id: p.appointment_id
  })) as Payment[];
}

export async function saveGroomerProfile(data: Partial<GroomerProfileDetails>) {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authorized" };

  const { error } = await supabaseAdmin
    .from("groomer_profiles")
    .update(data)
    .eq("id", ctx.groomerProfileId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function saveServices(services: Partial<Service>[]) {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authorized" };

  // For simplicity, we can delete all existing and insert new ones
  // because we are managing the whole list in the ProfileEditor.
  await supabaseAdmin
    .from("services")
    .delete()
    .eq("groomer_profile_id", ctx.groomerProfileId);

  if (services.length > 0) {
    const insertData = services.map(s => ({
      groomer_profile_id: ctx.groomerProfileId,
      name: s.name,
      duration_minutes: s.duration_minutes,
      price_pence: s.price_pence,
    }));
    const { error } = await supabaseAdmin.from("services").insert(insertData);
    if (error) return { error: error.message };
  }

  return { success: true };
}

export async function saveTeamMembers(team: Partial<TeamMember>[]) {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authorized" };

  // For simplicity, we can delete all existing and insert new ones
  // because we are managing the whole list in the ProfileEditor.
  await supabaseAdmin
    .from("team_members")
    .delete()
    .eq("groomer_profile_id", ctx.groomerProfileId);

  if (team.length > 0) {
    const insertData = team.map(t => ({
      groomer_profile_id: ctx.groomerProfileId,
      name: t.name,
      role: t.role,
      since_year: t.since_year,
      public_slug: t.public_slug,
    }));
    const { error } = await supabaseAdmin.from("team_members").insert(insertData);
    if (error) return { error: error.message };
  }

  return { success: true };
}

export interface ManualAppointmentInput {
  serviceId: string;
  clientName: string;
  dogName: string;
  dogBreed?: string;
  scheduledDate: string; // "YYYY-MM-DD"
  scheduledTime: string; // "HH:MM"
  notes?: string;
  // When linking to an existing owner/dog profile
  existingOwnerId?: string;
  existingDogId?: string;
}

export async function createManualAppointment(
  input: ManualAppointmentInput
): Promise<{ appointmentId: string } | { error: string }> {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authenticated or not a groomer." };

  const { data: service } = await supabaseAdmin
    .from("services")
    .select("name, duration_minutes, price_pence, groomer_profile_id, is_active")
    .eq("id", input.serviceId)
    .maybeSingle();

  if (!service || service.groomer_profile_id !== ctx.groomerProfileId || !service.is_active) {
    return { error: "Service not found." };
  }

  const scheduledAt = `${input.scheduledDate}T${input.scheduledTime}:00.000Z`;

  const noteParts = [
    !input.existingOwnerId ? `Client: ${input.clientName}` : null,
    !input.existingDogId ? `Dog: ${input.dogName}` : null,
    input.dogBreed ? `Breed: ${input.dogBreed}` : null,
    input.notes?.trim() ? input.notes.trim() : null,
  ];
  const groomerNote = noteParts.filter(Boolean).join(" — ") || null;

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .insert({
      owner_id: input.existingOwnerId ?? ctx.profileId,
      groomer_profile_id: ctx.groomerProfileId,
      dog_id: input.existingDogId ?? null,
      service_id: input.serviceId,
      service_snapshot_name: service.name,
      service_snapshot_duration: service.duration_minutes,
      service_snapshot_price: service.price_pence,
      scheduled_at: scheduledAt,
      status: "confirmed",
      groomer_notes: groomerNote,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createManualAppointment error:", error);
    return { error: "Failed to create appointment. Please try again." };
  }

  return { appointmentId: data.id };
}

export async function markAppointmentComplete(appointmentId: string): Promise<{ error?: string }> {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authorised" };

  const { error } = await supabaseAdmin
    .from("appointments")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", appointmentId)
    .eq("groomer_profile_id", ctx.groomerProfileId);

  if (error) return { error: error.message };

  // Fire pickup notification — best effort, don't block on failure
  try {
    const { data: appt } = await supabaseAdmin
      .from("appointments")
      .select(`
        service_snapshot_name,
        dogs (name),
        profiles!appointments_owner_id_fkey (first_name, email),
        groomer_profiles (
          business_name,
          phone,
          address_line_1,
          city,
          postcode
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (appt) {
      const ownerEmail = (appt.profiles as any)?.email;
      const ownerName = (appt.profiles as any)?.first_name || "there";
      const dogName = (appt.dogs as any)?.name || "your dog";
      const gp = appt.groomer_profiles as any;
      const salonName = gp?.business_name || "the salon";
      const salonPhone = gp?.phone || null;
      const salonAddress = [gp?.address_line_1, gp?.city, gp?.postcode]
        .filter(Boolean)
        .join(", ") || null;

      if (ownerEmail) {
        const { subject, html, text } = groomCompleteEmail({
          ownerName,
          dogName,
          salonName,
          salonPhone,
          salonAddress,
        });

        await resend.emails.send({
          from: FROM_EMAIL,
          to: ownerEmail,
          subject,
          html,
          text,
        });
      }
    }
  } catch (emailErr) {
    console.error("[markAppointmentComplete] email failed:", emailErr);
  }

  return {};
}

export async function groomerCancelAppointment(
  appointmentId: string,
  reason: string
): Promise<{ error?: string }> {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authorised" };

  const { error } = await supabaseAdmin
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_by: ctx.profileId,
      cancellation_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)
    .eq("groomer_profile_id", ctx.groomerProfileId);

  return error ? { error: error.message } : {};
}

export async function groomerRescheduleAppointment(
  appointmentId: string,
  newScheduledAt: string // ISO string
): Promise<{ error?: string }> {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authorised" };

  const { error } = await supabaseAdmin
    .from("appointments")
    .update({
      scheduled_at: newScheduledAt,
      status: "confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)
    .eq("groomer_profile_id", ctx.groomerProfileId);

  return error ? { error: error.message } : {};
}

export async function groomerUpdateNotes(
  appointmentId: string,
  notes: string
): Promise<{ error?: string }> {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authorised" };

  const { error } = await supabaseAdmin
    .from("appointments")
    .update({
      groomer_notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)
    .eq("groomer_profile_id", ctx.groomerProfileId);

  return error ? { error: error.message } : {};
}

export async function replyToReview(reviewId: string, text: string) {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authorized" };

  const { error } = await supabaseAdmin
    .from("reviews")
    .update({ groomer_reply: text, groomer_replied_at: new Date().toISOString() })
    .eq("id", reviewId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteGroomerReply(reviewId: string) {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authorized" };

  const { error } = await supabaseAdmin
    .from("reviews")
    .update({ groomer_reply: null, groomer_replied_at: null })
    .eq("id", reviewId);

  if (error) return { error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------------
// checkIsOutsideHours
//
// Returns whether a proposed start time + duration falls outside the groomer's
// configured availability for that day. Used for the out-of-hours indicator in
// NewBookingModal — does NOT block the booking, just informs the UI.
// ---------------------------------------------------------------------------

export async function checkIsOutsideHours(
  groomerProfileId: string,
  date: string,         // "YYYY-MM-DD"
  time: string,         // "HH:MM"
  durationMinutes: number,
): Promise<{ outside: boolean }> {
  const [y, mo, d] = date.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();

  const { data: avail } = await supabaseAdmin
    .from("availability")
    .select("start_time, end_time")
    .eq("groomer_profile_id", groomerProfileId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .maybeSingle();

  if (!avail) return { outside: true }; // day not configured = outside hours

  const [sh, sm] = avail.start_time.split(":").map(Number);
  const [eh, em] = avail.end_time.split(":").map(Number);
  const [th, tm] = time.split(":").map(Number);

  const availStart = sh * 60 + sm;
  const availEnd   = eh * 60 + em;
  const slotStart  = th * 60 + tm;
  const slotEnd    = slotStart + durationMinutes;

  const outside = slotStart < availStart || slotEnd > availEnd;
  return { outside };
}
