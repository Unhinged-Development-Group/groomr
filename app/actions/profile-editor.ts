"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
import type {
  ProfileEditorInitialData,
  ProfileFormData,
  ServiceRow,
  AvailabilityRow,
  TeamMemberRow,
} from "@/types/groomer-dashboard";

export async function loadProfileEditorData(): Promise<ProfileEditorInitialData> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/sign-in");

  const [{ data: myProfile }, clerkUser] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone, roles")
      .eq("clerk_id", clerkUserId)
      .single(),
    currentUser(),
  ]);

  if (!myProfile) redirect("/sign-in");

  const clerkName  = clerkUser ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") : "";
  const clerkEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";
  const clerkPhone = clerkUser?.phoneNumbers?.[0]?.phoneNumber ?? "";

  const roles: string[] = myProfile.roles ?? [];
  const isDirectGroomer = roles.includes("groomer");

  let groomerProfile: Record<string, unknown> | null = null;
  let viewerRole: "owner" | "team_member" = "owner";
  let teamMemberId: string | null = null;

  if (isDirectGroomer) {
    const { data } = await supabaseAdmin
      .from("groomer_profiles")
      .select("*")
      .eq("user_id", myProfile.id)
      .maybeSingle();
    groomerProfile = data;
  } else {
    const { data: membership } = await supabaseAdmin
      .from("team_members")
      .select("id, groomer_profile_id")
      .eq("user_id", myProfile.id)
      .eq("invite_status", "accepted")
      .maybeSingle();

    if (!membership) redirect("/dashboard");

    viewerRole = "team_member";
    teamMemberId = membership.id;

    const { data } = await supabaseAdmin
      .from("groomer_profiles")
      .select("*")
      .eq("id", membership.groomer_profile_id)
      .maybeSingle();
    groomerProfile = data;
  }

  if (!groomerProfile) {
    return {
      groomerProfileId: "",
      profile: emptyProfile(myProfile.full_name || clerkName, myProfile.email || clerkEmail, myProfile.phone || clerkPhone),
      coverPhotoUrl: null,
      services: [],
      availability: [],
      team: [],
      viewerRole,
      teamMemberId,
      averageRating: null,
      totalReviews: null,
    };
  }

  const groomerProfileId = groomerProfile.id as string;

  const [{ data: serviceRows }, { data: availabilityRows }, { data: teamRows }] = await Promise.all([
    supabaseAdmin
      .from("services")
      .select("id, name, duration_minutes, price_pence, sort_order")
      .eq("groomer_profile_id", groomerProfileId)
      .eq("is_active", true)
      .order("sort_order"),
    supabaseAdmin
      .from("availability")
      .select("day_of_week, start_time, end_time, is_active, break_start_time, break_end_time")
      .eq("groomer_profile_id", groomerProfileId)
      .order("day_of_week"),
    supabaseAdmin
      .from("team_members")
      .select("id, name, role, since_year, email, user_id, invite_status, average_rating, total_reviews, public_slug")
      .eq("groomer_profile_id", groomerProfileId)
      .order("created_at"),
  ]);

  const profile: ProfileFormData = {
    businessName: (groomerProfile.business_name as string) ?? "",
    ownerName: myProfile.full_name || clerkName,
    email: myProfile.email || clerkEmail,
    phone: myProfile.phone || clerkPhone,
    bio: (groomerProfile.bio as string) ?? "",
    businessMode: (groomerProfile.is_mobile as boolean) ? "mobile" : "studio",
    radius: (groomerProfile.travel_radius_miles as number) ?? 5,
    addressLine1: (groomerProfile.address_line_1 as string) ?? "",
    addressLine2: (groomerProfile.address_line_2 as string) ?? "",
    city: (groomerProfile.city as string) ?? "",
    postcode: (groomerProfile.postcode as string) ?? "",
    depositType: ((groomerProfile.deposit_type as string) ?? "none") as ProfileFormData["depositType"],
    depositPercentage: (groomerProfile.deposit_percentage as number) ?? 10,
    bufferMinutes: (groomerProfile.default_buffer_minutes as number) ?? 0,
    isAcceptingBookings: (groomerProfile.is_accepting_bookings as boolean) ?? false,
  };

  const services: ServiceRow[] = (serviceRows ?? []).map((s, i) => ({
    id: s.id,
    name: s.name,
    duration: s.duration_minutes ?? 60,
    price: s.price_pence ?? 0,
    sortOrder: s.sort_order ?? i,
  }));

  const availMap = new Map(
    (availabilityRows ?? []).map((a) => [
      a.day_of_week as number,
      {
        startTime:      a.start_time as string,
        endTime:        a.end_time as string,
        isActive:       a.is_active as boolean,
        breakStartTime: (a.break_start_time as string | null) ?? null,
        breakEndTime:   (a.break_end_time   as string | null) ?? null,
      },
    ])
  );
  const availability: AvailabilityRow[] = Array.from({ length: 7 }, (_, dow) => ({
    dayOfWeek:      dow,
    startTime:      availMap.get(dow)?.startTime      ?? "09:00",
    endTime:        availMap.get(dow)?.endTime        ?? "17:00",
    isActive:       availMap.get(dow)?.isActive       ?? false,
    breakStartTime: availMap.get(dow)?.breakStartTime ?? null,
    breakEndTime:   availMap.get(dow)?.breakEndTime   ?? null,
  }));

  const team: TeamMemberRow[] = (teamRows ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    sinceYear: String(m.since_year ?? new Date().getFullYear()),
    email: m.email ?? null,
    userId: m.user_id ?? null,
    inviteStatus: (m.invite_status ?? "pending") as TeamMemberRow["inviteStatus"],
    averageRating: m.average_rating ?? 0,
    totalReviews: m.total_reviews ?? 0,
    publicSlug: m.public_slug ?? null,
  }));

  const coverPhotoUrl   = (groomerProfile.cover_photo_url as string | null) ?? null;
  const averageRating   = (groomerProfile.average_rating  as number | null)  ?? null;
  const totalReviews    = (groomerProfile.total_reviews   as number | null)  ?? null;

  return { groomerProfileId, profile, coverPhotoUrl, services, availability, team, viewerRole, teamMemberId, averageRating, totalReviews };
}

function emptyProfile(ownerName: string, email: string, phone: string): ProfileFormData {
  return {
    businessName: "",
    ownerName,
    email,
    phone,
    bio: "",
    businessMode: "mobile",
    radius: 5,
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    depositType: "none",
    depositPercentage: 10,
    bufferMinutes: 0,
    isAcceptingBookings: false,
  };
}

export async function saveProfile(
  groomerProfileId: string,
  data: ProfileFormData
): Promise<{ error?: string }> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { error: "Not authenticated" };

  const { data: myProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, phone")
    .eq("clerk_id", clerkUserId)
    .single();

  if (!myProfile) return { error: "Profile not found" };

  // Verify ownership
  const { data: gp } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("id", groomerProfileId)
    .eq("user_id", myProfile.id)
    .maybeSingle();

  if (!gp) return { error: "Not authorised" };

  const [gpResult, profileResult] = await Promise.all([
    supabaseAdmin
      .from("groomer_profiles")
      .update({
        business_name: data.businessName,
        bio: data.bio,
        is_mobile: data.businessMode === "mobile",
        travel_radius_miles: data.businessMode === "mobile" ? data.radius : null,
        address_line_1: data.businessMode === "studio" ? data.addressLine1 : null,
        address_line_2: data.businessMode === "studio" ? (data.addressLine2 || null) : null,
        city: data.businessMode === "studio" ? data.city : null,
        postcode: data.businessMode === "studio" ? data.postcode : null,
        deposit_type: data.depositType,
        deposit_percentage: data.depositType === "percentage" ? data.depositPercentage : null,
        default_buffer_minutes: data.bufferMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", groomerProfileId),
    supabaseAdmin
      .from("profiles")
      .update({ phone: data.phone, updated_at: new Date().toISOString() })
      .eq("id", myProfile.id),
  ]);

  if (gpResult.error) return { error: gpResult.error.message };
  if (profileResult.error) return { error: profileResult.error.message };

  revalidatePath(`/groomers/${groomerProfileId}`);
  return {};
}

export async function toggleAcceptingBookings(
  groomerProfileId: string,
  isAcceptingBookings: boolean
): Promise<{ error?: string }> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { error: "Not authenticated" };

  const { data: myProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (!myProfile) return { error: "Profile not found" };

  // Only the salon owner may toggle bookings
  const { data: gp } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("id", groomerProfileId)
    .eq("user_id", myProfile.id)
    .maybeSingle();

  if (!gp) return { error: "Not authorised" };

  const { error } = await supabaseAdmin
    .from("groomer_profiles")
    .update({ is_accepting_bookings: isAcceptingBookings, updated_at: new Date().toISOString() })
    .eq("id", groomerProfileId);

  if (error) return { error: error.message };
  return {};
}

export async function saveServices(
  groomerProfileId: string,
  rows: ServiceRow[]
): Promise<{ error?: string; services?: ServiceRow[] }> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { error: "Not authenticated" };

  const { data: myProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (!myProfile) return { error: "Profile not found" };

  const { data: gp } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("id", groomerProfileId)
    .eq("user_id", myProfile.id)
    .maybeSingle();

  if (!gp) return { error: "Not authorised" };

  const { error: deleteError } = await supabaseAdmin.from("services").delete().eq("groomer_profile_id", groomerProfileId);

  if (deleteError) return { error: deleteError.message };

  if (rows.length === 0) {
    revalidatePath(`/groomers/${groomerProfileId}`);
    return { services: [] };
  }

  const { data: inserted, error } = await supabaseAdmin
    .from("services")
    .insert(
      rows.map((s, i) => ({
        groomer_profile_id: groomerProfileId,
        name: s.name,
        duration_minutes: s.duration,
        price_pence: s.price,
        is_active: true,
        sort_order: i,
      }))
    )
    .select("id, name, duration_minutes, price_pence, sort_order");

  if (error) return { error: error.message };

  const saved: ServiceRow[] = (inserted ?? []).map((s, i) => ({
    id: s.id,
    name: s.name,
    duration: s.duration_minutes ?? 60,
    price: s.price_pence ?? 0,
    sortOrder: s.sort_order ?? i,
  }));

  revalidatePath(`/groomers/${groomerProfileId}`);
  return { services: saved };
}

export async function saveAvailability(
  groomerProfileId: string,
  rows: AvailabilityRow[]
): Promise<{ error?: string }> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { error: "Not authenticated" };

  const { data: myProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (!myProfile) return { error: "Profile not found" };

  const { data: gp } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("id", groomerProfileId)
    .eq("user_id", myProfile.id)
    .maybeSingle();

  if (!gp) return { error: "Not authorised" };

  await supabaseAdmin.from("availability").delete().eq("groomer_profile_id", groomerProfileId);

  const active = rows.filter((r) => r.isActive);
  if (active.length > 0) {
    const { error } = await supabaseAdmin.from("availability").insert(
      active.map((r) => ({
        groomer_profile_id: groomerProfileId,
        day_of_week:        r.dayOfWeek,
        start_time:         r.startTime,
        end_time:           r.endTime,
        is_active:          true,
        break_start_time:   r.breakStartTime ?? null,
        break_end_time:     r.breakEndTime   ?? null,
      }))
    );
    if (error) return { error: error.message };
  }

  return {};
}

export async function getCoverPhotoSignature(groomerProfileId: string): Promise<{
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Not authenticated");

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `groomr/cover-photos/${groomerProfileId}`;
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

export async function saveCoverPhoto(
  groomerProfileId: string,
  url: string
): Promise<{ error?: string }> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { error: "Not authenticated" };

  const { data: myProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (!myProfile) return { error: "Profile not found" };

  const { error } = await supabaseAdmin
    .from("groomer_profiles")
    .update({ cover_photo_url: url, updated_at: new Date().toISOString() })
    .eq("id", groomerProfileId)
    .eq("user_id", myProfile.id);

  if (error) return { error: error.message };
  return {};
}
