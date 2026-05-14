"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface ServiceInput {
  name: string;
  price: number; // in £ — converted to pence before insert
}

interface DaySlotInput {
  on: boolean;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

interface RegisterGroomerInput {
  fullName: string;
  phone: string;
  businessName: string;
  bizType: "studio" | "home" | "mobile";
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  radiusMiles: number;
  services: ServiceInput[];
  depositType: 'none' | 'percentage' | 'full';
  depositPercentage: number | null;
  days: Record<string, DaySlotInput>;
  leadHours: number;
}

const DAY_OF_WEEK: Record<string, number> = {
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0,
};

export async function registerGroomer(input: RegisterGroomerInput) {
  // auth() reads the JWT locally — no Clerk API network call, no ClerkAPIResponseError
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkId = userId;

  /* ── 1. Resolve profile UUID ───────────────────────────────────────── */
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, roles")
    .eq("clerk_id", clerkId)
    .single();

  if (profileErr || !profile) {
    throw new Error("Profile not found. Make sure the sign-up webhook has run.");
  }

  const profileId: string = profile.id;

  /* ── 2. Add groomer role ───────────────────────────────────────────── */
  const currentRoles: string[] = profile.roles ?? [];
  if (!currentRoles.includes("groomer")) {
    await supabaseAdmin
      .from("profiles")
      .update({ roles: [...currentRoles, "groomer"] })
      .eq("id", profileId);
  }

  /* ── 3. Upsert groomer profile ─────────────────────────────────────── */
  const profilePayload = {
    user_id: profileId,
    business_name: input.businessName,
    address_line_1: input.addressLine1,
    address_line_2: input.addressLine2 || null,
    city: input.city,
    postcode: input.postcode,
    is_mobile: input.bizType === "mobile",
    travel_radius_miles: input.bizType === "mobile" ? input.radiusMiles : null,
    is_listed: false,
    is_verified: false,
    deposit_type: input.depositType,
    deposit_percentage: input.depositPercentage,
  };

  const { data: existing } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("user_id", profileId)
    .maybeSingle();

  let groomerProfileId: string;

  if (existing) {
    const { data: updated, error } = await supabaseAdmin
      .from("groomer_profiles")
      .update(profilePayload)
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error || !updated) throw new Error("Failed to update groomer profile.");
    groomerProfileId = updated.id;
  } else {
    const { data: inserted, error } = await supabaseAdmin
      .from("groomer_profiles")
      .insert(profilePayload)
      .select("id")
      .single();
    if (error || !inserted) throw new Error("Failed to create groomer profile.");
    groomerProfileId = inserted.id;
  }

  /* ── 4. Services ───────────────────────────────────────────────────── */
  // Always wipe and re-insert so re-registrations are clean
  await supabaseAdmin.from("services").delete().eq("groomer_profile_id", groomerProfileId);

  if (input.services.length > 0) {
    const serviceRows = input.services.map((svc, i) => ({
      groomer_profile_id: groomerProfileId,
      name: svc.name,
      price_pence: Math.round((svc.price ?? 0) * 100),
      duration_minutes: 60, // default — groomer edits from dashboard
      is_active: true,
      sort_order: i,
    }));

    const { error } = await supabaseAdmin.from("services").insert(serviceRows);
    if (error) throw new Error("Failed to save services.");
  }

  /* ── 5. Availability ───────────────────────────────────────────────── */
  await supabaseAdmin.from("availability").delete().eq("groomer_profile_id", groomerProfileId);

  const availRows = Object.entries(input.days)
    .filter(([, slot]) => slot.on)
    .map(([day, slot]) => ({
      groomer_profile_id: groomerProfileId,
      day_of_week: DAY_OF_WEEK[day],
      start_time: slot.start,
      end_time: slot.end,
      is_active: true,
    }));

  if (availRows.length > 0) {
    const { error } = await supabaseAdmin.from("availability").insert(availRows);
    if (error) throw new Error("Failed to save availability.");
  }

  redirect("/dashboard/groomer");
}
