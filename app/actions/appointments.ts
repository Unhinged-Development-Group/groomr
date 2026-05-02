"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
    address_line_1: string | null;
    city: string | null;
    postcode: string | null;
    average_rating: number | null;
    total_reviews: number | null;
  } | null;

  dogs?: {
    name: string;
  } | null;
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
        address_line_1,
        city,
        postcode,
        average_rating,
        total_reviews
      ),
      dogs (
        name
      )
    `)
    .eq("owner_id", profileId)
    .order("scheduled_at", { ascending: false });

  if (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }

  return (data ?? []) as Appointment[];
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

  return { ok: true };
}
