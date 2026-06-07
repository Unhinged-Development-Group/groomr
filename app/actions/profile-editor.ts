"use server";

import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateUniqueGroomerSlug } from "@/lib/slug";
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
  VerificationDocs,
  VerificationDocType,
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
  }

  // Team members are granted the 'groomer' role by the invite webhook, so isDirectGroomer
  // can be true even though they have no groomer_profiles row of their own.
  // Always fall through to team_members check if no direct profile was found.
  if (!groomerProfile) {
    const { data: membership } = await supabaseAdmin
      .from("team_members")
      .select("id, groomer_profile_id")
      .eq("user_id", myProfile.id)
      .eq("invite_status", "accepted")
      .maybeSingle();

    if (membership) {
      viewerRole = "team_member";
      teamMemberId = membership.id;

      const { data } = await supabaseAdmin
        .from("groomer_profiles")
        .select("*")
        .eq("id", membership.groomer_profile_id)
        .maybeSingle();
      groomerProfile = data;
    } else {
      // Existing Clerk users accept invites by signing in — user.created never fires,
      // so team_members.user_id is still null. Match by email and self-accept here.
      const userEmail = myProfile.email || clerkEmail;
      if (userEmail) {
        const { data: pendingInvite } = await supabaseAdmin
          .from("team_members")
          .select("id, groomer_profile_id")
          .eq("email", userEmail)
          .eq("invite_status", "pending")
          .maybeSingle();

        if (pendingInvite) {
          await Promise.all([
            supabaseAdmin
              .from("team_members")
              .update({ user_id: myProfile.id, invite_status: "accepted", accepted_at: new Date().toISOString() })
              .eq("id", pendingInvite.id),
            supabaseAdmin
              .from("profiles")
              .update({ roles: "{owner,groomer}" })
              .eq("id", myProfile.id),
          ]);
          viewerRole = "team_member";
          teamMemberId = pendingInvite.id;

          const { data } = await supabaseAdmin
            .from("groomer_profiles")
            .select("*")
            .eq("id", pendingInvite.groomer_profile_id)
            .maybeSingle();
          groomerProfile = data;
        }
      }

      if (!groomerProfile && !isDirectGroomer) {
        // Non-groomer user with no team membership shouldn't reach this page
        redirect("/dashboard");
      }
    }
  }

  if (!groomerProfile) {
    return {
      groomerProfileId: "",
      publicSlug: null,
      profile: emptyProfile(myProfile.full_name || clerkName, myProfile.email || clerkEmail, myProfile.phone || clerkPhone),
      coverPhotoUrl: null,
      profileImageUrl: null,
      services: [],
      availability: [],
      team: [],
      viewerRole,
      teamMemberId,
      averageRating: null,
      totalReviews: null,
      verificationDocs: {
        insuranceDocUrl: null,
        qualificationDocUrl: null,
        firstAidDocUrl: null,
        photoIdDocUrl: null,
        employersLiabilityDocUrl: null,
        hasEmployees: null,
        insuranceVerified: false,
        qualificationVerified: false,
        firstAidVerified: false,
        photoIdVerified: false,
        employersLiabilityVerified: false,
      },
      portfolioCount: 0,
      contractTerms: null,
      isFoundingGroomer: false,
      foundingCommissionExpiresAt: null,
    };
  }

  const groomerProfileId = groomerProfile.id as string;

  const [{ data: serviceRows }, { data: availabilityRows }, { data: teamRows }, { count: portfolioCount }, { data: contractTermsRow }] = await Promise.all([
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
    supabaseAdmin
      .from("portfolio_photos")
      .select("id", { count: "exact", head: true })
      .eq("groomer_profile_id", groomerProfileId),
    supabaseAdmin
      .from("contract_terms")
      .select("id, version, content")
      .eq("groomer_profile_id", groomerProfileId)
      .eq("is_current", true)
      .maybeSingle(),
  ]);

  const profile: ProfileFormData = {
    businessName: (groomerProfile.business_name as string) ?? "",
    tagline: (groomerProfile.tagline as string) ?? "",
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
    (availabilityRows ?? []).map((a) => {
      const rawStart = (a.break_start_time as string | null) ?? null;
      const rawEnd   = (a.break_end_time   as string | null) ?? null;
      // New format: break_start_time is a JSON array e.g. '[{"s":"12:00","e":"13:00"}]'
      // Legacy format: plain "HH:MM" strings in both columns
      let breaks: import("@/types/groomer-dashboard").BreakSlot[] = [];
      if (rawStart?.startsWith("[")) {
        try {
          breaks = (JSON.parse(rawStart) as { s: string; e: string }[]).map((b) => ({
            startTime: b.s,
            endTime: b.e,
          }));
        } catch { /* ignore bad JSON */ }
      } else if (rawStart && rawEnd) {
        breaks = [{ startTime: rawStart, endTime: rawEnd }];
      }
      return [
        a.day_of_week as number,
        {
          startTime: a.start_time as string,
          endTime:   a.end_time   as string,
          isActive:  a.is_active  as boolean,
          breaks,
        },
      ] as const;
    })
  );
  const availability: AvailabilityRow[] = Array.from({ length: 7 }, (_, dow) => ({
    dayOfWeek: dow,
    startTime: availMap.get(dow)?.startTime ?? "09:00",
    endTime:   availMap.get(dow)?.endTime   ?? "17:00",
    isActive:  availMap.get(dow)?.isActive  ?? false,
    breaks:    availMap.get(dow)?.breaks    ?? [],
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

  const coverPhotoUrl   = (groomerProfile.cover_photo_url   as string | null) ?? null;
  const profileImageUrl = (groomerProfile.profile_image_url as string | null) ?? null;
  const averageRating   = (groomerProfile.average_rating    as number | null) ?? null;
  const totalReviews    = (groomerProfile.total_reviews     as number | null) ?? null;

  const docUrl = (v: unknown) => {
    const s = v as string | null;
    return s && s !== "skipped" ? s : null;
  };

  const verificationDocs: VerificationDocs = {
    insuranceDocUrl:               docUrl(groomerProfile.insurance_doc_url),
    qualificationDocUrl:           docUrl(groomerProfile.qualification_doc_url),
    firstAidDocUrl:                docUrl(groomerProfile.first_aid_doc_url),
    photoIdDocUrl:                 docUrl(groomerProfile.photo_id_doc_url),
    employersLiabilityDocUrl:      docUrl(groomerProfile.employers_liability_doc_url),
    hasEmployees:                  (groomerProfile.has_employees                        as boolean | null) ?? null,
    insuranceVerified:             (groomerProfile.insurance_doc_verified               as boolean) ?? false,
    qualificationVerified:         (groomerProfile.qualification_doc_verified           as boolean) ?? false,
    firstAidVerified:              (groomerProfile.first_aid_doc_verified               as boolean) ?? false,
    photoIdVerified:               (groomerProfile.photo_id_doc_verified                as boolean) ?? false,
    employersLiabilityVerified:    (groomerProfile.employers_liability_doc_verified     as boolean) ?? false,
  };

  const publicSlug = (groomerProfile.public_slug as string | null) ?? null;

  const contractTerms = contractTermsRow
    ? { id: contractTermsRow.id as string, version: contractTermsRow.version as number, content: contractTermsRow.content as string }
    : null;

  const isFoundingGroomer = (groomerProfile.is_founding_groomer as boolean) ?? false;
  const createdAt = groomerProfile.created_at as string | null;
  let foundingCommissionExpiresAt: string | null = null;
  if (isFoundingGroomer && createdAt) {
    const expires = new Date(createdAt);
    expires.setMonth(expires.getMonth() + 6);
    foundingCommissionExpiresAt = expires.toISOString();
  }

  return { groomerProfileId, publicSlug, profile, coverPhotoUrl, profileImageUrl, services, availability, team, viewerRole, teamMemberId, averageRating, totalReviews, verificationDocs, portfolioCount: portfolioCount ?? 0, contractTerms, isFoundingGroomer, foundingCommissionExpiresAt };
}

function emptyProfile(ownerName: string, email: string, phone: string): ProfileFormData {
  return {
    businessName: "",
    tagline: "",
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
    .select("id, public_slug")
    .eq("id", groomerProfileId)
    .eq("user_id", myProfile.id)
    .maybeSingle();

  if (!gp) return { error: "Not authorised" };

  const slugUpdate = gp.public_slug
    ? {}
    : { public_slug: await generateUniqueGroomerSlug(data.businessName, groomerProfileId) };

  const [gpResult, profileResult] = await Promise.all([
    supabaseAdmin
      .from("groomer_profiles")
      .update({
        business_name: data.businessName,
        ...slugUpdate,
        tagline: data.tagline || null,
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

  const payload = rows.map((s, i) => ({
    name: s.name,
    duration_minutes: s.duration,
    price_pence: s.price,
    sort_order: i,
  }));

  const { data: result, error } = await supabaseAdmin.rpc("replace_services", {
    p_groomer_profile_id: groomerProfileId,
    p_services: payload,
  });

  if (error) return { error: error.message };

  const inserted = (result ?? []) as Array<{
    id: string;
    name: string;
    duration_minutes: number;
    price_pence: number;
    sort_order: number;
  }>;

  const saved: ServiceRow[] = inserted.map((s, i) => ({
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
        break_start_time:   r.breaks.length > 0
          ? JSON.stringify(r.breaks.map((b) => ({ s: b.startTime, e: b.endTime })))
          : null,
        break_end_time:     null,
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
  const allowed_formats = "jpg,jpeg,png,webp";
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp, allowed_formats },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
    allowedFormats: allowed_formats,
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

export async function deleteCoverPhoto(
  groomerProfileId: string
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
    .update({ cover_photo_url: null, updated_at: new Date().toISOString() })
    .eq("id", groomerProfileId)
    .eq("user_id", myProfile.id);

  if (error) return { error: error.message };
  return {};
}

export async function getProfileImageSignature(groomerProfileId: string): Promise<{
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Not authenticated");

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `groomr/profile-images/${groomerProfileId}`;
  const allowed_formats = "jpg,jpeg,png,webp";
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp, allowed_formats },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
    allowedFormats: allowed_formats,
  };
}

export async function getVerificationDocSignature(groomerProfileId: string): Promise<{
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Not authenticated");

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `groomr/verification/${groomerProfileId}`;
  const allowed_formats = "jpg,jpeg,png,webp,pdf";
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp, allowed_formats },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
    allowedFormats: allowed_formats,
  };
}

const DOC_COLUMN: Record<VerificationDocType, string> = {
  insurance:          "insurance_doc_url",
  qualification:      "qualification_doc_url",
  firstAid:           "first_aid_doc_url",
  photoId:            "photo_id_doc_url",
  employersLiability: "employers_liability_doc_url",
};

export async function saveVerificationDoc(
  groomerProfileId: string,
  docType: VerificationDocType,
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

  const column = DOC_COLUMN[docType];
  const { error } = await supabaseAdmin
    .from("groomer_profiles")
    .update({ [column]: url, updated_at: new Date().toISOString() })
    .eq("id", groomerProfileId)
    .eq("user_id", myProfile.id);

  if (error) return { error: error.message };
  return {};
}

export async function saveHasEmployees(
  groomerProfileId: string,
  hasEmployees: boolean
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
    .update({ has_employees: hasEmployees, updated_at: new Date().toISOString() })
    .eq("id", groomerProfileId)
    .eq("user_id", myProfile.id);

  if (error) return { error: error.message };
  return {};
}

export async function saveProfileImage(
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
    .update({ profile_image_url: url, updated_at: new Date().toISOString() })
    .eq("id", groomerProfileId)
    .eq("user_id", myProfile.id);

  if (error) return { error: error.message };

  // Sync to Clerk profile picture (upload)
  try {
    const imgRes = await fetch(url);
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const arrayBuffer = await imgRes.arrayBuffer();
    const file = new File([arrayBuffer], `profile.${ext}`, { type: contentType });
    const clerk = await clerkClient();
    await clerk.users.updateUserProfileImage(clerkUserId, { file });
  } catch {
    // non-fatal — Supabase already saved, Clerk sync can be retried on next upload
  }

  return {};
}

export async function deleteProfileImage(
  groomerProfileId: string
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
    .update({ profile_image_url: null, updated_at: new Date().toISOString() })
    .eq("id", groomerProfileId)
    .eq("user_id", myProfile.id);

  if (error) return { error: error.message };

  // Remove from Clerk too so the default avatar shows there as well
  try {
    const clerk = await clerkClient();
    await clerk.users.deleteUserProfileImage(clerkUserId);
  } catch {
    // non-fatal
  }

  return {};
}
