"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
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

  const { data: myProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, phone, roles")
    .eq("clerk_id", clerkUserId)
    .single();

  if (!myProfile) redirect("/sign-in");

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
      profile: emptyProfile(myProfile.full_name ?? "", myProfile.email ?? "", myProfile.phone ?? ""),
      services: [],
      availability: [],
      team: [],
      viewerRole,
      teamMemberId,
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
      .select("day_of_week, start_time, end_time, is_active")
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
    ownerName: myProfile.full_name ?? "",
    email: myProfile.email ?? "",
    phone: myProfile.phone ?? "",
    bio: (groomerProfile.bio as string) ?? "",
    businessMode: (groomerProfile.is_mobile as boolean) ? "mobile" : "studio",
    radius: (groomerProfile.travel_radius_miles as number) ?? 5,
    addressLine1: (groomerProfile.address_line_1 as string) ?? "",
    addressLine2: (groomerProfile.address_line_2 as string) ?? "",
    city: (groomerProfile.city as string) ?? "",
    postcode: (groomerProfile.postcode as string) ?? "",
    depositType: ((groomerProfile.deposit_type as string) ?? "none") as ProfileFormData["depositType"],
    depositPercentage: (groomerProfile.deposit_percentage as number) ?? 10,
  };

  const services: ServiceRow[] = (serviceRows ?? []).map((s, i) => ({
    id: s.id,
    name: s.name,
    duration: s.duration_minutes ?? 60,
    price: s.price_pence ?? 0,
    sortOrder: s.sort_order ?? i,
  }));

  // Build a full 7-day map keyed by day_of_week; fill gaps with inactive defaults
  const availMap = new Map(
    (availabilityRows ?? []).map((a) => [
      a.day_of_week as number,
      { startTime: a.start_time as string, endTime: a.end_time as string, isActive: a.is_active as boolean },
    ])
  );
  const availability: AvailabilityRow[] = Array.from({ length: 7 }, (_, dow) => ({
    dayOfWeek: dow,
    startTime: availMap.get(dow)?.startTime ?? "09:00",
    endTime:   availMap.get(dow)?.endTime   ?? "17:00",
    isActive:  availMap.get(dow)?.isActive  ?? false,
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

  return { groomerProfileId, profile, services, availability, team, viewerRole, teamMemberId };
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

  return {};
}

export async function saveServices(
  groomerProfileId: string,
  rows: ServiceRow[]
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

  await supabaseAdmin.from("services").delete().eq("groomer_profile_id", groomerProfileId);

  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from("services").insert(
      rows.map((s, i) => ({
        groomer_profile_id: groomerProfileId,
        name: s.name,
        duration_minutes: s.duration,
        price_pence: s.price,
        is_active: true,
        sort_order: i,
      }))
    );
    if (error) return { error: error.message };
  }

  return {};
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
        day_of_week: r.dayOfWeek,
        start_time: r.startTime,
        end_time: r.endTime,
        is_active: true,
      }))
    );
    if (error) return { error: error.message };
  }

  return {};
}
