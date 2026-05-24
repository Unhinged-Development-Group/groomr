"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getInsuranceUploadSignature(): Promise<{
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "groomr/insurance";
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
  };
}

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
  insuranceDocUrl?: string | null;
  bankAccountHolder?: string | null;
  bankSortCode?: string | null;
  bankAccountNumber?: string | null;
}

const DAY_OF_WEEK: Record<string, number> = {
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0,
};

export async function registerGroomer(input: RegisterGroomerInput) {
  // auth() reads the JWT locally — no Clerk API network call, no ClerkAPIResponseError
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkId = userId;

  /* ── 1. Resolve profile UUID (create if webhook missed) ───────────── */
  let profileId: string;
  let currentRolesInit: string[];

  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, roles")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (existingProfile) {
    profileId = existingProfile.id;
    currentRolesInit = existingProfile.roles ?? [];
  } else {
    const user = await currentUser();
    const fullName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";
    const email = user?.emailAddresses?.[0]?.emailAddress ?? null;

    const { data: created, error: createErr } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: crypto.randomUUID(),
        clerk_id: clerkId,
        full_name: fullName,
        email,
        roles: "{owner}",
        is_admin: false,
      })
      .select("id")
      .single();

    if (createErr || !created) throw new Error("Failed to create profile.");
    profileId = created.id;
    currentRolesInit = ["owner"];
  }

  /* ── 2. Add groomer role ───────────────────────────────────────────── */
  const currentRoles: string[] = currentRolesInit;
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
    is_accepting_bookings: false,   // groomers start closed; they open once set up
    deposit_type: input.depositType,
    deposit_percentage: input.depositPercentage,
    insurance_doc_url: input.insuranceDocUrl ?? null,
    bank_account_holder: input.bankAccountHolder ?? null,
    bank_sort_code: input.bankSortCode ?? null,
    bank_account_number: input.bankAccountNumber ?? null,
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
