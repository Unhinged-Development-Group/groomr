"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { Appointment } from "@/app/actions/appointments";

export interface GroomerProfileDetails {
  id: string;
  business_name: string;
  bio: string | null;
  is_mobile: boolean;
  is_studio: boolean;
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
  comment: string | null;
  groomer_reply: string | null;
  created_at: string;
  appointment_id: string;
  appointments?: {
    service_snapshot_name: string;
    dogs?: { name: string };
    profiles?: { first_name: string; last_name: string };
  };
}

// Internal Helper
async function getGroomerContext() {
  const { userId } = await auth();
  if (!userId) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", userId)
    .maybeSingle();

  if (!profile) return null;

  const { data: groomer } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!groomer) return null;

  return { profileId: profile.id, groomerProfileId: groomer.id };
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
  if (!ctx) return [];

  const { data } = await supabaseAdmin
    .from("appointments")
    .select(`
      *,
      dogs (name, breed),
      profiles (first_name, last_name, phone_number, clerk_id)
    `)
    .eq("groomer_profile_id", ctx.groomerProfileId)
    .order("scheduled_at", { ascending: true });

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
        dogs (name),
        profiles (first_name, last_name)
      )
    `)
    .in("appointment_id", appointmentIds)
    .order("created_at", { ascending: false });

  return (data || []) as Review[];
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

export async function replyToReview(reviewId: string, text: string) {
  const ctx = await getGroomerContext();
  if (!ctx) return { error: "Not authorized" };

  const { error } = await supabaseAdmin
    .from("reviews")
    .update({ groomer_reply: text })
    .eq("id", reviewId);

  if (error) return { error: error.message };
  return { success: true };
}
