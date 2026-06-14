"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { sendAccountDeletionEmail } from "@/lib/account-export";

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

async function requireAdmin(): Promise<{ profileId: string } | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, is_admin")
    .eq("clerk_id", userId)
    .maybeSingle();
  if (!data?.is_admin) return { error: "Forbidden" };
  return { profileId: data.id };
}

async function logAdminAction(
  adminProfileId: string,
  action: string,
  targetTable?: string,
  targetId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("admin_audit_log")
    .insert({
      admin_profile_id: adminProfileId,
      action,
      target_table: targetTable ?? null,
      target_id: targetId ?? null,
      metadata: metadata ?? {},
    });
  if (error) console.error("[audit_log] insert failed:", error.message, { adminProfileId, action });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminOverviewStats {
  totalOwners: number;
  totalGroomers: number;
  listedGroomers: number;
  unverifiedGroomers: number;
  totalDogs: number;
  totalAppointments: number;
  appointmentsLast30Days: number;
  appointmentsNext30Days: number;
  confirmedAppointments: number;
  completedAppointments: number;
  noShowCount: number;
  grossRevenuePence: number;
  platformFeePence: number;
  groomerPayoutPence: number;
  pendingPayoutsAmountPence: number;
  stripeFeePence: number;
  netRevenuePence: number;
  openDisputes: number;
  openSupportRequests: number;
  totalReviews: number;
  averageRating: number;
  reviewsLast30Days: number;
  reviewsWithReply: number;
  groomersBelow3Star: number;
  integrations: {
    stripe: boolean;
    resend: boolean;
    twilio: boolean;
    googleMaps: boolean;
    clerk: boolean;
    supabase: boolean;
  };
}

export interface AdminGroomerRow {
  groomer_profile_id: string;
  profile_id: string;
  business_name: string;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  is_listed: boolean;
  is_verified: boolean;
  verification_status: string;
  public_slug: string | null;
  average_rating: number;
  total_reviews: number;
  created_at: string;
}

export interface AdminUserRow {
  profile_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  roles: string[];
  is_admin: boolean;
  is_active: boolean;
  dog_count: number;
  created_at: string;
}

export interface AdminUserDog {
  id: string;
  name: string;
  breed: string | null;
  size: string | null;
}

export interface AdminDisputeRow {
  id: string;
  subject: string;
  description: string | null;
  status: "pending" | "open" | "in_review" | "awaiting_agreement" | "final_review" | "awaiting_final_agreement" | "resolved";
  admin_notes: string | null;
  appointment_id: string | null;
  raised_by: string | null;
  owner_id: string | null;
  groomer_id: string | null;
  owner_name: string | null;
  owner_email: string | null;
  groomer_name: string | null;
  groomer_email: string | null;
  owner_comment: string | null;
  groomer_comment: string | null;
  proposed_resolution: string | null;
  resolution_proposed_at: string | null;
  owner_agreed: boolean | null;
  groomer_agreed: boolean | null;
  final_resolution: string | null;
  final_resolution_proposed_at: string | null;
  owner_agreed_final: boolean | null;
  groomer_agreed_final: boolean | null;
  created_at: string;
}

export interface AdminSupportRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "closed";
  admin_reply: string | null;
  created_at: string;
}

export interface AdminAppointmentRow {
  id: string;
  owner_id: string | null;
  owner_name: string | null;
  owner_email: string | null;
  groomer_profile_id: string | null;
  groomer_business_name: string | null;
  groomer_city: string | null;
  dog_name: string | null;
  service_name: string;
  service_price_pence: number;
  scheduled_at: string;
  status: string;
  cancellation_reason: string | null;
  groomer_notes: string | null;
  owner_notes: string | null;
  admin_note_groomer: string | null;
  admin_note_groomer_author: string | null;
  admin_note_owner: string | null;
  admin_note_owner_author: string | null;
  booking_group_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Overview stats
// ---------------------------------------------------------------------------

export async function getAdminOverviewStats(): Promise<AdminOverviewStats | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const nowIso = now.toISOString();
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();
  const thirtyDaysFromNowIso = thirtyDaysFromNow.toISOString();

  const [
    ownersResult,
    groomersResult,
    listedResult,
    unverifiedResult,
    dogsResult,
    apptAllResult,
    appt30Result,
    apptNext30Result,
    apptConfirmedResult,
    apptCompletedResult,
    apptNoShowResult,
    revenueResult,
    pendingPayoutsResult,
    disputesResult,
    supportResult,
    reviewsAllResult,
    reviews30Result,
    reviewsRatingResult,
    reviewsWithReplyResult,
    groomersBelow3StarResult,
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).contains("roles", ["owner"]),
    supabaseAdmin.from("groomer_profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("groomer_profiles").select("id", { count: "exact", head: true }).eq("is_listed", true),
    supabaseAdmin.from("groomer_profiles").select("id", { count: "exact", head: true }).eq("is_verified", false),
    supabaseAdmin.from("dogs").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("appointments").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("appointments").select("id", { count: "exact", head: true }).gte("scheduled_at", thirtyDaysAgoIso).lte("scheduled_at", nowIso),
    supabaseAdmin.from("appointments").select("id", { count: "exact", head: true }).gt("scheduled_at", nowIso).lte("scheduled_at", thirtyDaysFromNowIso),
    supabaseAdmin.from("appointments").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    supabaseAdmin.from("appointments").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabaseAdmin.from("appointments").select("id", { count: "exact", head: true }).eq("status", "no_show"),
    supabaseAdmin.from("payments").select("full_amount_pence, platform_fee_pence, groomer_payout_amount_pence, stripe_fee_pence"),
    supabaseAdmin.from("payments").select("groomer_payout_amount_pence").eq("payout_status", "pending"),
    supabaseAdmin.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabaseAdmin.from("support_requests").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabaseAdmin.from("reviews").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("reviews").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgoIso),
    supabaseAdmin.from("reviews").select("rating"),
    supabaseAdmin.from("reviews").select("id", { count: "exact", head: true }).not("groomer_reply", "is", null),
    supabaseAdmin.from("groomer_profiles").select("id", { count: "exact", head: true }).gt("total_reviews", 0).lt("average_rating", 3),
  ]);

  type PaymentRow = { full_amount_pence: number | null; platform_fee_pence: number | null; groomer_payout_amount_pence: number | null; stripe_fee_pence: number | null };
  const payments: PaymentRow[] = revenueResult.data ?? [];
  const grossRevenuePence = payments.reduce((sum, p) => sum + (p.full_amount_pence ?? 0), 0);
  const platformFeePence = payments.reduce((sum, p) => sum + (p.platform_fee_pence ?? 0), 0);
  const groomerPayoutPence = payments.reduce((sum, p) => sum + (p.groomer_payout_amount_pence ?? 0), 0);
  const stripeFeePence = payments.reduce((sum, p) => sum + (p.stripe_fee_pence ?? 0), 0);
  const netRevenuePence = platformFeePence - stripeFeePence;
  const pendingPayoutsAmountPence = (pendingPayoutsResult.data ?? []).reduce(
    (sum: number, p: any) => sum + (p.groomer_payout_amount_pence ?? 0), 0
  );

  const ratingRows: { rating: number }[] = reviewsRatingResult.data ?? [];
  const averageRating = ratingRows.length > 0
    ? ratingRows.reduce((sum, r) => sum + r.rating, 0) / ratingRows.length
    : 0;

  return {
    totalOwners: ownersResult.count ?? 0,
    totalGroomers: groomersResult.count ?? 0,
    listedGroomers: listedResult.count ?? 0,
    unverifiedGroomers: unverifiedResult.count ?? 0,
    totalDogs: dogsResult.count ?? 0,
    totalAppointments: apptAllResult.count ?? 0,
    appointmentsLast30Days: appt30Result.count ?? 0,
    appointmentsNext30Days: apptNext30Result.count ?? 0,
    confirmedAppointments: apptConfirmedResult.count ?? 0,
    completedAppointments: apptCompletedResult.count ?? 0,
    noShowCount: apptNoShowResult.count ?? 0,
    grossRevenuePence,
    platformFeePence,
    groomerPayoutPence,
    pendingPayoutsAmountPence,
    stripeFeePence,
    netRevenuePence,
    openDisputes: disputesResult.count ?? 0,
    openSupportRequests: supportResult.count ?? 0,
    totalReviews: reviewsAllResult.count ?? 0,
    averageRating: Math.round(averageRating * 10) / 10,
    reviewsLast30Days: reviews30Result.count ?? 0,
    reviewsWithReply: reviewsWithReplyResult.count ?? 0,
    groomersBelow3Star: groomersBelow3StarResult.count ?? 0,
    integrations: {
      stripe: !!process.env.STRIPE_SECRET_KEY,
      resend: !!process.env.RESEND_API_KEY,
      twilio: !!process.env.TWILIO_ACCOUNT_SID,
      googleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
      clerk: !!process.env.CLERK_SECRET_KEY,
      supabase: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  };
}

// ---------------------------------------------------------------------------
// Groomers
// ---------------------------------------------------------------------------

export async function getAllGroomers(search?: string, page = 0): Promise<{ data: AdminGroomerRow[] } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const PAGE_SIZE = 50;
  const { data, error } = await supabaseAdmin
    .from("groomer_profiles")
    .select(`
      id,
      business_name,
      is_listed,
      is_verified,
      verification_status,
      public_slug,
      city,
      average_rating,
      total_reviews,
      created_at,
      profiles!groomer_profiles_user_id_fkey ( id, full_name, email, phone )
    `)
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (error) return { error: error.message };

  const rows: AdminGroomerRow[] = (data ?? []).map((g: any) => ({
    groomer_profile_id: g.id,
    profile_id: g.profiles?.id ?? "",
    business_name: g.business_name,
    owner_name: g.profiles?.full_name ?? null,
    email: g.profiles?.email ?? null,
    phone: g.profiles?.phone ?? null,
    city: g.city ?? null,
    is_listed: g.is_listed,
    is_verified: g.is_verified,
    verification_status: g.verification_status ?? "not_submitted",
    public_slug: g.public_slug ?? null,
    average_rating: g.average_rating ?? 0,
    total_reviews: g.total_reviews ?? 0,
    created_at: g.created_at,
  }));

  if (search) {
    const q = search.toLowerCase();
    return { data: rows.filter((r) => r.business_name?.toLowerCase().includes(q) || r.owner_name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q)) };
  }

  return { data: rows };
}

export async function adminDeleteGroomer(
  groomerProfileId: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  // Block deletion if there are upcoming confirmed/pending appointments
  const { data: activeAppts, error: apptErr } = await supabaseAdmin
    .from("appointments")
    .select("id")
    .eq("groomer_profile_id", groomerProfileId)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", new Date().toISOString())
    .limit(1);

  if (apptErr) return { error: apptErr.message };
  if (activeAppts && activeAppts.length > 0) {
    return { error: "Cannot delete: this groomer has upcoming appointments. Cancel them first." };
  }

  // Fetch profile id, clerk_id, and contact details before soft-deleting
  const { data: gp } = await supabaseAdmin
    .from("groomer_profiles")
    .select("user_id, business_name, profiles!groomer_profiles_user_id_fkey ( clerk_id, email, full_name )")
    .eq("id", groomerProfileId)
    .maybeSingle();

  const profileId: string | undefined = (gp as any)?.user_id;
  const clerkId: string | undefined = (gp as any)?.profiles?.clerk_id;
  const email: string | undefined = (gp as any)?.profiles?.email;
  const fullName: string | undefined = (gp as any)?.profiles?.full_name;
  const businessName: string | undefined = (gp as any)?.business_name;

  // Unlist immediately so the groomer no longer appears in search
  const { error: gpErr } = await supabaseAdmin
    .from("groomer_profiles")
    .update({ is_listed: false, is_accepting_bookings: false, updated_at: new Date().toISOString() })
    .eq("id", groomerProfileId);

  if (gpErr) return { error: gpErr.message };

  // Soft-delete profile — 30-day cron handles hard-delete/anonymisation (UK GDPR)
  if (profileId) {
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", profileId);

    if (profileErr) return { error: profileErr.message };

    // Send deletion email with 30-day data export link
    if (email) {
      await sendAccountDeletionEmail(profileId, email, fullName ?? "there");
    }
  }

  // Delete Clerk user so they cannot log in
  if (clerkId) {
    try {
      const client = await clerkClient();
      await client.users.deleteUser(clerkId);
    } catch {
      // Non-fatal — Supabase soft-delete is the source of truth
    }
  }

  await logAdminAction(guard.profileId, "delete_groomer", "groomer_profiles", groomerProfileId, { groomer: businessName ?? null, name: fullName ?? null, email: email ?? null });
  return { ok: true };
}

export async function verifyGroomer(
  groomerProfileId: string,
  verified: boolean
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { data: gp } = await supabaseAdmin
    .from("groomer_profiles")
    .select("business_name, profiles!groomer_profiles_user_id_fkey ( email, full_name )")
    .eq("id", groomerProfileId)
    .maybeSingle();

  const gpEmail = (gp as any)?.profiles?.email;
  const gpName = (gp as any)?.profiles?.full_name ?? "there";
  const gpBusiness = (gp as any)?.business_name ?? "your business";

  const { error } = await supabaseAdmin
    .from("groomer_profiles")
    .update({
      is_verified: verified,
      verification_status: verified ? "verified" : "revoked_temp",
      updated_at: new Date().toISOString(),
    })
    .eq("id", groomerProfileId);

  if (error) return { error: error.message };

  if (verified && gpEmail) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: gpEmail,
      subject: "Your Groomr profile has been verified ✓",
      text: `Hi ${gpName},\n\nGreat news — ${gpBusiness} has been verified on Groomr. Your profile will now appear in search results and you can start accepting bookings.\n\nThe Groomr team`,
    }).catch(() => {/* non-fatal */});
  }

  await logAdminAction(guard.profileId, verified ? "verify_groomer" : "revoke_groomer_verification", "groomer_profiles", groomerProfileId, { groomer: gpBusiness, owner: gpName });
  return { ok: true };
}

export async function adminUpdateVerificationStatus(
  groomerProfileId: string,
  status: "not_submitted" | "awaiting" | "verified" | "revoked_temp" | "revoked_perm"
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { data: current } = await supabaseAdmin
    .from("groomer_profiles")
    .select("verification_status, business_name, profiles!groomer_profiles_user_id_fkey ( email, full_name )")
    .eq("id", groomerProfileId)
    .maybeSingle();

  const oldStatus = (current as any)?.verification_status ?? "not_submitted";

  const isVerified = status === "verified";
  const { error } = await supabaseAdmin
    .from("groomer_profiles")
    .update({
      verification_status: status,
      is_verified: isVerified,
      updated_at: new Date().toISOString(),
    })
    .eq("id", groomerProfileId);

  if (error) return { error: error.message };

  // Send email on verification
  if (status === "verified") {
    const email = (current as any)?.profiles?.email;
    const name = (current as any)?.profiles?.full_name ?? "there";
    const business = (current as any)?.business_name ?? "your business";
    if (email) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Your Groomr profile has been verified ✓",
        text: `Hi ${name},\n\nGreat news — ${business} has been verified on Groomr. Your profile will now appear in search results and you can start accepting bookings.\n\nThe Groomr team`,
      }).catch(() => {});
    }
  }

  await logAdminAction(guard.profileId, "update_verification_status", "groomer_profiles", groomerProfileId, { from: oldStatus, to: status, groomer: (current as any)?.business_name ?? null });
  return { ok: true };
}

export async function adminSendVerificationReminder(
  groomerProfileId: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { data } = await supabaseAdmin
    .from("groomer_profiles")
    .select("business_name, profiles!groomer_profiles_user_id_fkey ( email, full_name )")
    .eq("id", groomerProfileId)
    .maybeSingle();

  const email = (data as any)?.profiles?.email;
  const name = (data as any)?.profiles?.full_name ?? "there";
  const business = (data as any)?.business_name ?? "your business";

  if (!email) return { error: "No email address found for this groomer" };

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Action required: Complete your Groomr verification",
    text: `Hi ${name},\n\nWe noticed that ${business} hasn't yet submitted verification documents on Groomr.\n\nTo appear in search results and start accepting bookings, please upload your documents in your groomer dashboard under Settings > Verification.\n\nIf you have any questions, feel free to reply to this email.\n\nThe Groomr team`,
  }).catch(() => {});

  await logAdminAction(guard.profileId, "send_verification_reminder", "groomer_profiles", groomerProfileId, { groomer: business, email });
  return { ok: true };
}

export async function updateGroomerProfile(
  groomerProfileId: string,
  fields: {
    business_name?: string;
    tagline?: string | null;
    bio?: string | null;
    city?: string | null;
    postcode?: string | null;
    address_line_1?: string | null;
    address_line_2?: string | null;
    is_listed?: boolean;
    is_verified?: boolean;
    is_mobile?: boolean;
    is_accepting_bookings?: boolean;
    is_founding_groomer?: boolean;
    founding_until?: string | null;
    travel_radius_miles?: number | null;
    years_experience?: number | null;
    qualifications?: string | null;
    deposit_type?: string;
    deposit_percentage?: number | null;
    default_buffer_minutes?: number | null;
    has_employees?: boolean;
  }
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { error } = await supabaseAdmin
    .from("groomer_profiles")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", groomerProfileId);

  if (error) return { error: error.message };
  const { data: gpInfo } = await supabaseAdmin.from("groomer_profiles").select("business_name").eq("id", groomerProfileId).maybeSingle();
  await logAdminAction(guard.profileId, "update_groomer_profile", "groomer_profiles", groomerProfileId, { groomer: (gpInfo as any)?.business_name ?? null });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Groomer full profile (expanded edit modal)
// ---------------------------------------------------------------------------

export interface GroomerFullProfile {
  id: string;
  business_name: string;
  tagline: string | null;
  bio: string | null;
  city: string | null;
  postcode: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  is_listed: boolean;
  is_verified: boolean;
  is_mobile: boolean;
  is_accepting_bookings: boolean;
  is_founding_groomer: boolean;
  founding_until: string | null;
  travel_radius_miles: number | null;
  years_experience: number | null;
  qualifications: string | null;
  deposit_type: string;
  deposit_percentage: number | null;
  default_buffer_minutes: number | null;
  has_employees: boolean;
  verification_status: string;
  public_slug: string | null;
  profile_image_url: string | null;
  cover_photo_url: string | null;
  insurance_doc_url: string | null;
  qualification_doc_url: string | null;
  first_aid_doc_url: string | null;
  photo_id_doc_url: string | null;
  employers_liability_doc_url: string | null;
  insurance_doc_verified: boolean;
  qualification_doc_verified: boolean;
  first_aid_doc_verified: boolean;
  photo_id_doc_verified: boolean;
  employers_liability_doc_verified: boolean;
  // From profiles join
  phone: string | null;
  email: string | null;
  owner_name: string | null;
}

export interface AdminAvailabilityRow {
  id: string;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  is_active: boolean;
}

export interface AdminGroomerTeamMember {
  id: string;
  name: string;
  role: string;
  email: string | null;
  invite_status: string;
}

export interface GroomerFullData {
  profile: GroomerFullProfile;
  availability: AdminAvailabilityRow[];
  services: AdminServiceRow[];
  teamMembers: AdminGroomerTeamMember[];
}

export async function adminGetGroomerFull(
  groomerProfileId: string
): Promise<{ data: GroomerFullData } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const [profileResult, availResult, servicesResult, teamResult] = await Promise.all([
    supabaseAdmin
      .from("groomer_profiles")
      .select(`
        id, business_name, tagline, bio, city, postcode, address_line_1, address_line_2,
        is_listed, is_verified, is_mobile, is_accepting_bookings, is_founding_groomer, founding_until,
        travel_radius_miles, years_experience, qualifications,
        deposit_type, deposit_percentage, default_buffer_minutes, has_employees,
        verification_status, public_slug, profile_image_url, cover_photo_url,
        insurance_doc_url, qualification_doc_url, first_aid_doc_url,
        photo_id_doc_url, employers_liability_doc_url,
        insurance_doc_verified, qualification_doc_verified, first_aid_doc_verified,
        photo_id_doc_verified, employers_liability_doc_verified,
        profiles!groomer_profiles_user_id_fkey ( full_name, email, phone )
      `)
      .eq("id", groomerProfileId)
      .maybeSingle(),
    supabaseAdmin
      .from("availability")
      .select("id, day_of_week, start_time, end_time, is_active")
      .eq("groomer_profile_id", groomerProfileId)
      .order("day_of_week"),
    supabaseAdmin
      .from("services")
      .select("id, groomer_profile_id, name, description, duration_minutes, price_pence, is_active, sort_order, applicable_sizes")
      .eq("groomer_profile_id", groomerProfileId)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("team_members")
      .select("id, name, role, email, invite_status")
      .eq("groomer_profile_id", groomerProfileId)
      .order("name"),
  ]);

  if (profileResult.error || !profileResult.data) {
    return { error: profileResult.error?.message ?? "Groomer not found" };
  }

  const raw = profileResult.data as any;
  const profile: GroomerFullProfile = {
    id: raw.id,
    business_name: raw.business_name,
    tagline: raw.tagline,
    bio: raw.bio,
    city: raw.city,
    postcode: raw.postcode,
    address_line_1: raw.address_line_1,
    address_line_2: raw.address_line_2,
    is_listed: raw.is_listed,
    is_verified: raw.is_verified,
    is_mobile: raw.is_mobile,
    is_accepting_bookings: raw.is_accepting_bookings,
    is_founding_groomer: raw.is_founding_groomer ?? false,
    founding_until: raw.founding_until ?? null,
    travel_radius_miles: raw.travel_radius_miles,
    years_experience: raw.years_experience,
    qualifications: raw.qualifications,
    deposit_type: raw.deposit_type ?? "none",
    deposit_percentage: raw.deposit_percentage,
    default_buffer_minutes: raw.default_buffer_minutes,
    has_employees: raw.has_employees ?? false,
    verification_status: raw.verification_status ?? "not_submitted",
    public_slug: raw.public_slug,
    profile_image_url: raw.profile_image_url,
    cover_photo_url: raw.cover_photo_url,
    insurance_doc_url: raw.insurance_doc_url,
    qualification_doc_url: raw.qualification_doc_url,
    first_aid_doc_url: raw.first_aid_doc_url,
    photo_id_doc_url: raw.photo_id_doc_url,
    employers_liability_doc_url: raw.employers_liability_doc_url,
    insurance_doc_verified: raw.insurance_doc_verified ?? false,
    qualification_doc_verified: raw.qualification_doc_verified ?? false,
    first_aid_doc_verified: raw.first_aid_doc_verified ?? false,
    photo_id_doc_verified: raw.photo_id_doc_verified ?? false,
    employers_liability_doc_verified: raw.employers_liability_doc_verified ?? false,
    phone: raw.profiles?.phone ?? null,
    email: raw.profiles?.email ?? null,
    owner_name: raw.profiles?.full_name ?? null,
  };

  return {
    data: {
      profile,
      availability: (availResult.data ?? []) as AdminAvailabilityRow[],
      services: (servicesResult.data ?? []) as AdminServiceRow[],
      teamMembers: (teamResult.data ?? []) as AdminGroomerTeamMember[],
    },
  };
}

export async function adminSaveAvailability(
  groomerProfileId: string,
  rows: { day_of_week: number; start_time: string | null; end_time: string | null; is_active: boolean }[]
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  // Delete all existing availability rows for this groomer, then reinsert
  const { error: delErr } = await supabaseAdmin
    .from("availability")
    .delete()
    .eq("groomer_profile_id", groomerProfileId);

  if (delErr) return { error: delErr.message };

  if (rows.length > 0) {
    const { error: insErr } = await supabaseAdmin
      .from("availability")
      .insert(rows.map((r) => ({ ...r, groomer_profile_id: groomerProfileId })));
    if (insErr) return { error: insErr.message };
  }

  await logAdminAction(guard.profileId, "update_availability", "availability", groomerProfileId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Groomer stats (lazy-loaded on tab mount)
// ---------------------------------------------------------------------------

export interface AdminGroomerStats {
  totalGroomers: number;
  listedGroomers: number;
  verifiedGroomers: number;
  awaitingVerification: number;
  notSubmitted: number;
  avgAppointmentsPerGroomerPerWeek: number;
  groomersByCity: { city: string; count: number }[];
}

export async function adminGetGroomerStats(): Promise<{ data: AdminGroomerStats } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const [totalRes, listedRes, verifiedRes, awaitingRes, notSubmittedRes, cityRes, apptRes] = await Promise.all([
    supabaseAdmin.from("groomer_profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("groomer_profiles").select("id", { count: "exact", head: true }).eq("is_listed", true),
    supabaseAdmin.from("groomer_profiles").select("id", { count: "exact", head: true }).eq("verification_status", "verified"),
    supabaseAdmin.from("groomer_profiles").select("id", { count: "exact", head: true }).eq("verification_status", "awaiting"),
    supabaseAdmin.from("groomer_profiles").select("id", { count: "exact", head: true }).eq("verification_status", "not_submitted"),
    supabaseAdmin.from("groomer_profiles").select("city").not("city", "is", null),
    supabaseAdmin.from("appointments").select("groomer_profile_id").gte("scheduled_at", fourWeeksAgo.toISOString()),
  ]);

  // Group by city in JS
  const cityCount: Record<string, number> = {};
  for (const row of (cityRes.data ?? []) as { city: string | null }[]) {
    if (row.city) cityCount[row.city] = (cityCount[row.city] ?? 0) + 1;
  }
  const groomersByCity = Object.entries(cityCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([city, count]) => ({ city, count }));

  // Avg appointments per groomer per week over last 4 weeks
  const apptRows = (apptRes.data ?? []) as { groomer_profile_id: string }[];
  const total = totalRes.count ?? 1;
  const avgAppointmentsPerGroomerPerWeek = total > 0
    ? Math.round((apptRows.length / total / 4) * 10) / 10
    : 0;

  return {
    data: {
      totalGroomers: totalRes.count ?? 0,
      listedGroomers: listedRes.count ?? 0,
      verifiedGroomers: verifiedRes.count ?? 0,
      awaitingVerification: awaitingRes.count ?? 0,
      notSubmitted: notSubmittedRes.count ?? 0,
      avgAppointmentsPerGroomerPerWeek,
      groomersByCity,
    },
  };
}

// ---------------------------------------------------------------------------
// Groomer export
// ---------------------------------------------------------------------------

export async function adminExportGroomers(): Promise<{ data: Record<string, unknown>[] } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { data, error } = await supabaseAdmin
    .from("groomer_profiles")
    .select(`
      id, business_name, tagline, bio, city, postcode, is_listed, is_verified,
      verification_status, is_mobile, travel_radius_miles, years_experience,
      qualifications, average_rating, total_reviews, is_founding_groomer,
      is_accepting_bookings, created_at, public_slug,
      profiles!groomer_profiles_user_id_fkey ( full_name, email, phone )
    `)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };

  return {
    data: (data ?? []).map((g: any) => ({
      groomer_profile_id: g.id,
      business_name: g.business_name,
      owner_name: g.profiles?.full_name,
      email: g.profiles?.email,
      phone: g.profiles?.phone,
      city: g.city,
      postcode: g.postcode,
      is_listed: g.is_listed,
      is_verified: g.is_verified,
      verification_status: g.verification_status,
      is_mobile: g.is_mobile,
      travel_radius_miles: g.travel_radius_miles,
      years_experience: g.years_experience,
      qualifications: g.qualifications,
      is_founding_groomer: g.is_founding_groomer,
      is_accepting_bookings: g.is_accepting_bookings,
      average_rating: g.average_rating,
      total_reviews: g.total_reviews,
      public_slug: g.public_slug,
      created_at: g.created_at,
    })),
  };
}

export async function adminExportIndividualGroomer(
  groomerProfileId: string
): Promise<{ data: Record<string, unknown> } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const [fullResult, reviewsResult, apptsResult] = await Promise.all([
    adminGetGroomerFull(groomerProfileId),
    supabaseAdmin
      .from("reviews")
      .select("id, rating, body, is_visible, groomer_reply, created_at, profiles!owner_id ( full_name )")
      .eq("groomer_profile_id", groomerProfileId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("appointments")
      .select("id, scheduled_at, status, service_snapshot_name, service_snapshot_price, created_at")
      .eq("groomer_profile_id", groomerProfileId)
      .order("scheduled_at", { ascending: false }),
  ]);

  if ("error" in fullResult) return fullResult;

  return {
    data: {
      exported_at: new Date().toISOString(),
      ...fullResult.data,
      reviews: reviewsResult.data ?? [],
      appointments: apptsResult.data ?? [],
    },
  };
}

// ---------------------------------------------------------------------------
// Users / Owners
// ---------------------------------------------------------------------------

export async function getAllUsers(search?: string, page = 0): Promise<{ data: AdminUserRow[] } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const PAGE_SIZE = 50;
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, phone, roles, is_admin, is_active, created_at")
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (error) return { error: error.message };

  const profileIds = (data ?? []).map((p: any) => p.id);
  const { data: dogs } = await supabaseAdmin
    .from("dogs")
    .select("id, owner_id")
    .in("owner_id", profileIds);

  const dogCountMap: Record<string, number> = {};
  (dogs ?? []).forEach((d: any) => {
    dogCountMap[d.owner_id] = (dogCountMap[d.owner_id] ?? 0) + 1;
  });

  const rows: AdminUserRow[] = (data ?? []).map((p: any) => ({
    profile_id: p.id,
    full_name: p.full_name,
    email: p.email,
    phone: p.phone ?? null,
    roles: p.roles ?? [],
    is_admin: p.is_admin ?? false,
    is_active: p.is_active ?? true,
    dog_count: dogCountMap[p.id] ?? 0,
    created_at: p.created_at,
  }));

  if (search) {
    const q = search.toLowerCase();
    return { data: rows.filter((r) => r.full_name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q)) };
  }

  return { data: rows };
}

export async function getUserDogs(profileId: string): Promise<{ data: AdminUserDog[] } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { data, error } = await supabaseAdmin
    .from("dogs")
    .select("id, name, breed, size")
    .eq("owner_id", profileId)
    .order("name");

  if (error) return { error: error.message };
  return { data: data ?? [] };
}

export async function updateUserProfile(
  profileId: string,
  fields: {
    full_name?: string;
    email?: string;
    phone?: string | null;
    is_active?: boolean;
  }
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", profileId);

  if (error) return { error: error.message };
  const { data: pfInfo } = await supabaseAdmin.from("profiles").select("full_name, email").eq("id", profileId).maybeSingle();
  await logAdminAction(guard.profileId, "update_user_profile", "profiles", profileId, { name: (pfInfo as any)?.full_name ?? null, email: (pfInfo as any)?.email ?? null });
  return { ok: true };
}

export async function adminDeleteOwner(
  profileId: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  // Check for upcoming confirmed/pending appointments
  const { data: activeAppts, error: apptErr } = await supabaseAdmin
    .from("appointments")
    .select("id")
    .eq("owner_id", profileId)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", new Date().toISOString())
    .limit(1);

  if (apptErr) return { error: apptErr.message };
  if (activeAppts && activeAppts.length > 0) {
    return { error: "Cannot delete: this owner has upcoming appointments. Cancel them first." };
  }

  // Fetch profile fields before soft-deleting
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("clerk_id, email, full_name")
    .eq("id", profileId)
    .maybeSingle();

  // Soft-delete — 30-day cron handles hard-delete/anonymisation (UK GDPR)
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ is_deleted: true, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", profileId);

  if (error) return { error: error.message };

  // Send deletion email with 30-day data export link
  if ((profile as any)?.email) {
    await sendAccountDeletionEmail(profileId, (profile as any).email, (profile as any).full_name ?? "there");
  }

  // Delete Clerk user so they cannot log in
  if ((profile as any)?.clerk_id) {
    try {
      const client = await clerkClient();
      await client.users.deleteUser((profile as any).clerk_id);
    } catch {
      // Non-fatal — Supabase soft-delete is the source of truth
    }
  }

  await logAdminAction(guard.profileId, "delete_owner", "profiles", profileId, { name: (profile as any)?.full_name ?? null, email: (profile as any)?.email ?? null });
  return { ok: true };
}

export async function adminSendPasswordReset(
  email: string,
  name: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  if (!email) return { error: "Email is required." };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://groomr.uk";

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: "support@groomr.uk",
      to: email,
      subject: "Reset your Groomr password",
      text: `Hi ${name || "there"},\n\nA member of the Groomr team has requested a password reset for your account.\n\nTo reset your password, visit the link below and click "Forgot password":\n${appUrl}/sign-in\n\nIf you didn't expect this, please ignore this email or contact us at support@groomr.uk.\n\nThe Groomr team`,
    });
  } catch {
    return { error: "Failed to send reset email." };
  }

  await logAdminAction(guard.profileId, "send_password_reset", "profiles", undefined, { email });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Owner stats (lazy-loaded on tab mount)
// ---------------------------------------------------------------------------

export interface AdminOwnerStats {
  totalOwners: number;
  totalDogs: number;
  avgDogsPerOwner: number;
}

export async function adminGetOwnerStats(): Promise<{ data: AdminOwnerStats } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const [ownersRes, dogsRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).contains("roles", ["owner"]),
    supabaseAdmin.from("dogs").select("id", { count: "exact", head: true }),
  ]);

  const totalOwners = ownersRes.count ?? 0;
  const totalDogs = dogsRes.count ?? 0;
  const avgDogsPerOwner = totalOwners > 0 ? Math.round((totalDogs / totalOwners) * 10) / 10 : 0;

  return { data: { totalOwners, totalDogs, avgDogsPerOwner } };
}

// ---------------------------------------------------------------------------
// Owner export
// ---------------------------------------------------------------------------

export async function adminExportOwners(): Promise<{ data: Record<string, unknown>[] } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { data: profiles, error: pErr } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, phone, roles, is_active, created_at")
    .contains("roles", ["owner"])
    .order("created_at", { ascending: false });

  if (pErr) return { error: pErr.message };

  const profileIds = (profiles ?? []).map((p: any) => p.id);
  const { data: dogs } = await supabaseAdmin
    .from("dogs")
    .select("id, owner_id, name, breed, size, date_of_birth")
    .in("owner_id", profileIds);

  const dogsByOwner: Record<string, any[]> = {};
  (dogs ?? []).forEach((d: any) => {
    if (!dogsByOwner[d.owner_id]) dogsByOwner[d.owner_id] = [];
    dogsByOwner[d.owner_id].push(d);
  });

  return {
    data: (profiles ?? []).map((p: any) => ({
      profile_id: p.id,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone,
      is_active: p.is_active,
      created_at: p.created_at,
      dog_count: (dogsByOwner[p.id] ?? []).length,
      dogs: (dogsByOwner[p.id] ?? []).map((d) => ({ name: d.name, breed: d.breed, size: d.size, date_of_birth: d.date_of_birth })),
    })),
  };
}

export async function adminExportIndividualOwner(
  profileId: string
): Promise<{ data: Record<string, unknown> } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const [profileRes, dogsRes, apptsRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, full_name, email, phone, roles, is_active, created_at").eq("id", profileId).maybeSingle(),
    supabaseAdmin.from("dogs").select("*").eq("owner_id", profileId).order("name"),
    supabaseAdmin
      .from("appointments")
      .select("id, scheduled_at, status, service_snapshot_name, service_snapshot_price, cancellation_reason, created_at, groomer:groomer_profiles!groomer_profile_id ( business_name )")
      .eq("owner_id", profileId)
      .order("scheduled_at", { ascending: false }),
  ]);

  if (!profileRes.data) return { error: "Profile not found" };

  return {
    data: {
      exported_at: new Date().toISOString(),
      profile: profileRes.data,
      dogs: dogsRes.data ?? [],
      appointments: (apptsRes.data ?? []).map((a: any) => ({
        ...a,
        groomer_name: a.groomer?.business_name,
        groomer: undefined,
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------------------

export async function getAllDisputes(status?: string): Promise<{ data: AdminDisputeRow[] } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  let query = supabaseAdmin
    .from("disputes")
    .select(`
      id, subject, description, status, admin_notes, appointment_id, created_at,
      raised_by, owner_id, groomer_id,
      owner_comment, groomer_comment,
      proposed_resolution, resolution_proposed_at, owner_agreed, groomer_agreed,
      final_resolution, final_resolution_proposed_at, owner_agreed_final, groomer_agreed_final,
      owner:profiles!disputes_owner_id_fkey ( full_name, email ),
      groomer:profiles!disputes_groomer_id_fkey ( full_name, email )
    `)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };

  const rows: AdminDisputeRow[] = (data ?? []).map((d: any) => ({
    id: d.id,
    subject: d.subject,
    description: d.description,
    status: d.status,
    admin_notes: d.admin_notes,
    appointment_id: d.appointment_id,
    raised_by: d.raised_by,
    owner_id: d.owner_id,
    groomer_id: d.groomer_id,
    owner_name: d.owner?.full_name ?? null,
    owner_email: d.owner?.email ?? null,
    groomer_name: d.groomer?.full_name ?? null,
    groomer_email: d.groomer?.email ?? null,
    owner_comment: d.owner_comment,
    groomer_comment: d.groomer_comment,
    proposed_resolution: d.proposed_resolution,
    resolution_proposed_at: d.resolution_proposed_at,
    owner_agreed: d.owner_agreed,
    groomer_agreed: d.groomer_agreed,
    final_resolution: d.final_resolution,
    final_resolution_proposed_at: d.final_resolution_proposed_at,
    owner_agreed_final: d.owner_agreed_final,
    groomer_agreed_final: d.groomer_agreed_final,
    created_at: d.created_at,
  }));

  return { data: rows };
}

export async function updateDisputeStatus(
  id: string,
  status: AdminDisputeRow["status"],
  adminNotes: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { error } = await supabaseAdmin
    .from("disputes")
    .update({ status, admin_notes: adminNotes, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  await logAdminAction(guard.profileId, "update_dispute_status", "disputes", id, { status });
  return { ok: true };
}

export async function adminProposeResolution(
  id: string,
  resolutionText: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { data: d } = await supabaseAdmin
    .from("disputes")
    .select(`
      subject,
      owner:profiles!disputes_owner_id_fkey ( email, full_name ),
      groomer:profiles!disputes_groomer_id_fkey ( email, full_name )
    `)
    .eq("id", id)
    .maybeSingle();

  const dAny = d as any;
  const ownerEmail = dAny?.owner?.email ?? null;
  const ownerName = dAny?.owner?.full_name ?? "Owner";
  const groomerEmail = dAny?.groomer?.email ?? null;
  const groomerName = dAny?.groomer?.full_name ?? "Groomer";
  const subject = dAny?.subject ?? "your dispute";
  const link = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://groomr.uk"}/disputes/${id}`;

  const emailText = (name: string) =>
    `Hi ${name},\n\nGroomr has reviewed your dispute regarding "${subject}" and proposed the following resolution:\n\n${resolutionText}\n\nPlease log in to review and accept or decline this proposal:\n${link}\n\nThe Groomr team`;

  const { error } = await supabaseAdmin
    .from("disputes")
    .update({
      proposed_resolution: resolutionText,
      resolution_proposed_at: new Date().toISOString(),
      status: "awaiting_agreement",
      owner_agreed: null,
      groomer_agreed: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  if (ownerEmail) resend.emails.send({ from: FROM_EMAIL, to: ownerEmail, subject: `Groomr has proposed a resolution for your dispute`, text: emailText(ownerName) }).catch(() => {});
  if (groomerEmail) resend.emails.send({ from: FROM_EMAIL, to: groomerEmail, subject: `Groomr has proposed a resolution for your dispute`, text: emailText(groomerName) }).catch(() => {});

  await logAdminAction(guard.profileId, "propose_resolution", "disputes", id);
  return { ok: true };
}

export async function adminSendFinalResolution(
  id: string,
  finalResolutionText: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { data: d } = await supabaseAdmin
    .from("disputes")
    .select(`
      subject,
      owner:profiles!disputes_owner_id_fkey ( email, full_name ),
      groomer:profiles!disputes_groomer_id_fkey ( email, full_name )
    `)
    .eq("id", id)
    .maybeSingle();

  const dAny = d as any;
  const ownerEmail = dAny?.owner?.email ?? null;
  const ownerName = dAny?.owner?.full_name ?? "Owner";
  const groomerEmail = dAny?.groomer?.email ?? null;
  const groomerName = dAny?.groomer?.full_name ?? "Groomer";
  const subject = dAny?.subject ?? "your dispute";
  const link = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://groomr.uk"}/disputes/${id}`;

  const emailText = (name: string) =>
    `Hi ${name},\n\nThis is Groomr's final decision regarding your dispute "${subject}":\n\n${finalResolutionText}\n\nThis decision is final. Please log in to acknowledge this resolution:\n${link}\n\nNote: Continued non-compliance with this decision may result in removal from the Groomr platform.\n\nThe Groomr team`;

  const { error } = await supabaseAdmin
    .from("disputes")
    .update({
      final_resolution: finalResolutionText,
      final_resolution_proposed_at: new Date().toISOString(),
      status: "awaiting_final_agreement",
      owner_agreed_final: null,
      groomer_agreed_final: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  if (ownerEmail) resend.emails.send({ from: FROM_EMAIL, to: ownerEmail, subject: `Final resolution: Groomr's decision on your dispute`, text: emailText(ownerName) }).catch(() => {});
  if (groomerEmail) resend.emails.send({ from: FROM_EMAIL, to: groomerEmail, subject: `Final resolution: Groomr's decision on your dispute`, text: emailText(groomerName) }).catch(() => {});

  await logAdminAction(guard.profileId, "send_final_resolution", "disputes", id);
  return { ok: true };
}

export async function adminCloseDispute(
  id: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { error } = await supabaseAdmin
    .from("disputes")
    .update({ status: "resolved", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  await logAdminAction(guard.profileId, "close_dispute", "disputes", id);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Support requests
// ---------------------------------------------------------------------------

export async function getAllSupportRequests(status?: string): Promise<{ data: AdminSupportRow[] } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  let query = supabaseAdmin
    .from("support_requests")
    .select("id, name, email, subject, message, status, admin_reply, created_at")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { data: data ?? [] };
}

export async function updateSupportRequest(
  id: string,
  status: "open" | "in_progress" | "closed",
  adminReply: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { error } = await supabaseAdmin
    .from("support_requests")
    .update({ status, admin_reply: adminReply, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  await logAdminAction(guard.profileId, "update_support_request", "support_requests", id, { status });
  return { ok: true };
}

export async function replyToSupportRequest(
  id: string,
  replyBody: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { data: req, error: fetchErr } = await supabaseAdmin
    .from("support_requests")
    .select("name, email, subject")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !req) return { error: fetchErr?.message ?? "Request not found" };

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: "support@groomr.uk",
      to: req.email,
      subject: `Re: ${req.subject}`,
      text: `Hi ${req.name},\n\n${replyBody}\n\n— The Groomr Support Team`,
    });
  } catch {
    return { error: "Failed to send reply email." };
  }

  const { error } = await supabaseAdmin
    .from("support_requests")
    .update({ admin_reply: replyBody, status: "closed", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  await logAdminAction(guard.profileId, "reply_support_request", "support_requests", id);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Contact user (generic)
// ---------------------------------------------------------------------------

export async function contactUser(
  toEmail: string,
  toName: string,
  subject: string,
  body: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  if (!toEmail || !subject || !body) return { error: "Missing required fields." };

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: "support@groomr.uk",
      to: toEmail,
      subject,
      text: `Hi ${toName || "there"},\n\n${body}\n\n— The Groomr Team`,
    });
  } catch {
    return { error: "Failed to send email." };
  }

  await logAdminAction(guard.profileId, "contact_user", "profiles", undefined, { to: toEmail, subject });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Dogs (admin CRUD on behalf of owners)
// ---------------------------------------------------------------------------

export interface AdminDogFull {
  id: string;
  name: string;
  breed: string | null;
  date_of_birth: string | null;
  size: string | null;
  is_neutered: boolean | null;
  coat_type: string | null;
  coat_notes: string | null;
  temperament_notes: string | null;
  health_notes: string | null;
}

export async function adminGetDogsFull(
  ownerProfileId: string
): Promise<{ data: AdminDogFull[] } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;
  const { data, error } = await supabaseAdmin
    .from("dogs")
    .select(
      "id, name, breed, date_of_birth, size, is_neutered, coat_type, coat_notes, temperament_notes, health_notes"
    )
    .eq("owner_id", ownerProfileId)
    .order("name");
  if (error) return { error: error.message };
  return { data: (data ?? []) as AdminDogFull[] };
}

type DogFields = {
  name: string;
  breed?: string | null;
  date_of_birth?: string | null;
  size?: string | null;
  is_neutered?: boolean | null;
  coat_type?: string | null;
  coat_notes?: string | null;
  temperament_notes?: string | null;
  health_notes?: string | null;
};

export async function adminAddDog(
  ownerProfileId: string,
  fields: DogFields
): Promise<{ data: AdminDogFull } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;
  const { data, error } = await supabaseAdmin
    .from("dogs")
    .insert({ owner_id: ownerProfileId, ...fields })
    .select(
      "id, name, breed, date_of_birth, size, is_neutered, coat_type, coat_notes, temperament_notes, health_notes"
    )
    .single();
  if (error || !data) return { error: error?.message ?? "Failed to add dog" };
  await logAdminAction(guard.profileId, "add_dog", "dogs", (data as AdminDogFull).id, { name: fields.name, owner_id: ownerProfileId });
  return { data: data as AdminDogFull };
}

export async function adminUpdateDog(
  dogId: string,
  fields: Partial<DogFields>
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;
  const { error } = await supabaseAdmin
    .from("dogs")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", dogId);
  if (error) return { error: error.message };
  const { data: dogInfo } = await supabaseAdmin.from("dogs").select("name").eq("id", dogId).maybeSingle();
  await logAdminAction(guard.profileId, "update_dog", "dogs", dogId, { dog: (dogInfo as any)?.name ?? null });
  return { ok: true };
}

export async function adminDeleteDog(
  dogId: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;
  const { data: delDog } = await supabaseAdmin.from("dogs").select("name").eq("id", dogId).maybeSingle();
  const { error } = await supabaseAdmin.from("dogs").delete().eq("id", dogId);
  if (error) return { error: error.message };
  await logAdminAction(guard.profileId, "delete_dog", "dogs", dogId, { dog: (delDog as any)?.name ?? null });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Services (admin CRUD on behalf of groomers)
// ---------------------------------------------------------------------------

export interface AdminServiceRow {
  id: string;
  groomer_profile_id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price_pence: number;
  is_active: boolean;
  sort_order: number | null;
  applicable_sizes: string[] | null;
}

export async function adminGetServices(
  groomerProfileId: string
): Promise<{ data: AdminServiceRow[] } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;
  const { data, error } = await supabaseAdmin
    .from("services")
    .select(
      "id, groomer_profile_id, name, description, duration_minutes, price_pence, is_active, sort_order, applicable_sizes"
    )
    .eq("groomer_profile_id", groomerProfileId)
    .order("sort_order", { ascending: true });
  if (error) return { error: error.message };
  return { data: (data ?? []) as AdminServiceRow[] };
}

type ServiceFields = {
  name: string;
  description?: string | null;
  duration_minutes?: number | null;
  price_pence: number;
  is_active?: boolean;
  sort_order?: number | null;
  applicable_sizes?: string[] | null;
};

export async function adminSaveService(
  groomerProfileId: string,
  serviceId: string | null,
  fields: ServiceFields
): Promise<{ data: AdminServiceRow } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;
  const selectCols =
    "id, groomer_profile_id, name, description, duration_minutes, price_pence, is_active, sort_order, applicable_sizes";
  if (serviceId) {
    const { data, error } = await supabaseAdmin
      .from("services")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", serviceId)
      .eq("groomer_profile_id", groomerProfileId)
      .select(selectCols)
      .single();
    if (error || !data) return { error: error?.message ?? "Failed to update service" };
    await logAdminAction(guard.profileId, "update_service", "services", serviceId, { name: fields.name });
    return { data: data as AdminServiceRow };
  } else {
    const { data, error } = await supabaseAdmin
      .from("services")
      .insert({ groomer_profile_id: groomerProfileId, ...fields })
      .select(selectCols)
      .single();
    if (error || !data) return { error: error?.message ?? "Failed to add service" };
    await logAdminAction(guard.profileId, "add_service", "services", (data as any).id, { name: fields.name, groomer_profile_id: groomerProfileId });
    return { data: data as AdminServiceRow };
  }
}

export async function adminDeleteService(
  serviceId: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;
  const { data: delSvc } = await supabaseAdmin.from("services").select("name, groomer_profile_id").eq("id", serviceId).maybeSingle();
  const { error } = await supabaseAdmin.from("services").delete().eq("id", serviceId);
  if (error) return { error: error.message };
  await logAdminAction(guard.profileId, "delete_service", "services", serviceId, { name: (delSvc as any)?.name ?? null });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Appointments (admin view + cancel + edit)
// ---------------------------------------------------------------------------

const APPT_PAGE_SIZE = 50;

export async function adminGetAppointments(
  search?: string,
  status?: string,
  page = 0
): Promise<{ data: AdminAppointmentRow[] } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  let query = supabaseAdmin
    .from("appointments")
    .select(
      `id, scheduled_at, status, cancellation_reason, groomer_notes, owner_notes,
       admin_note_groomer, admin_note_groomer_author, admin_note_owner, admin_note_owner_author,
       booking_group_id, created_at,
       service_snapshot_name, service_snapshot_price,
       owner:profiles!owner_id ( id, full_name, email ),
       groomer:groomer_profiles!groomer_profile_id ( id, business_name, city ),
       dog:dogs!dog_id ( name )`
    )
    .order("scheduled_at", { ascending: false })
    .range(page * APPT_PAGE_SIZE, (page + 1) * APPT_PAGE_SIZE - 1);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };

  const rows: AdminAppointmentRow[] = (data ?? []).map((a: any) => ({
    id: a.id,
    owner_id: a.owner?.id ?? null,
    owner_name: a.owner?.full_name ?? null,
    owner_email: a.owner?.email ?? null,
    groomer_profile_id: a.groomer?.id ?? null,
    groomer_business_name: a.groomer?.business_name ?? null,
    groomer_city: a.groomer?.city ?? null,
    dog_name: a.dog?.name ?? null,
    service_name: a.service_snapshot_name ?? "—",
    service_price_pence: a.service_snapshot_price ?? 0,
    scheduled_at: a.scheduled_at,
    status: a.status,
    cancellation_reason: a.cancellation_reason,
    groomer_notes: a.groomer_notes,
    owner_notes: a.owner_notes,
    admin_note_groomer: a.admin_note_groomer,
    admin_note_groomer_author: a.admin_note_groomer_author,
    admin_note_owner: a.admin_note_owner,
    admin_note_owner_author: a.admin_note_owner_author,
    booking_group_id: a.booking_group_id,
    created_at: a.created_at,
  }));

  if (search) {
    const q = search.toLowerCase();
    return {
      data: rows.filter(
        (r) =>
          r.owner_name?.toLowerCase().includes(q) ||
          r.owner_email?.toLowerCase().includes(q) ||
          r.groomer_business_name?.toLowerCase().includes(q) ||
          r.dog_name?.toLowerCase().includes(q)
      ),
    };
  }

  return { data: rows };
}

export async function adminCancelAppointment(
  appointmentId: string,
  reason: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { error } = await supabaseAdmin
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_by: guard.profileId,
      cancellation_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId);

  if (error) return { error: error.message };
  const { data: apptCtx } = await supabaseAdmin
    .from("appointments")
    .select("scheduled_at, service_snapshot_name, owner_id, groomer_profile_id")
    .eq("id", appointmentId)
    .maybeSingle();
  const [{ data: apptOwner }, { data: apptGroomer }] = await Promise.all([
    (apptCtx as any)?.owner_id ? supabaseAdmin.from("profiles").select("full_name").eq("id", (apptCtx as any).owner_id).maybeSingle() : Promise.resolve({ data: null }),
    (apptCtx as any)?.groomer_profile_id ? supabaseAdmin.from("groomer_profiles").select("business_name").eq("id", (apptCtx as any).groomer_profile_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  await logAdminAction(guard.profileId, "cancel_appointment", "appointments", appointmentId, {
    reason,
    owner: (apptOwner as any)?.full_name ?? null,
    groomer: (apptGroomer as any)?.business_name ?? null,
    service: (apptCtx as any)?.service_snapshot_name ?? null,
    scheduled_at: (apptCtx as any)?.scheduled_at ?? null,
  });
  return { ok: true };
}

export async function adminUpdateAppointmentNotes(
  appointmentId: string,
  notes: { groomerNote?: string | null; ownerNote?: string | null }
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { data: adminProfile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", guard.profileId)
    .maybeSingle();
  const authorName = adminProfile?.full_name ?? "Groomr Support";

  const { error } = await supabaseAdmin
    .from("appointments")
    .update({
      admin_note_groomer: notes.groomerNote ?? null,
      admin_note_groomer_author: notes.groomerNote ? authorName : null,
      admin_note_owner: notes.ownerNote ?? null,
      admin_note_owner_author: notes.ownerNote ? authorName : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId);

  if (error) return { error: error.message };
  await logAdminAction(guard.profileId, "edit_appointment_notes", "appointments", appointmentId);
  return { ok: true };
}

export async function adminMarkNoShow(
  appointmentId: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { error } = await supabaseAdmin
    .from("appointments")
    .update({ status: "no_show", updated_at: new Date().toISOString() })
    .eq("id", appointmentId);

  if (error) return { error: error.message };
  const { data: nsCtx } = await supabaseAdmin
    .from("appointments")
    .select("scheduled_at, service_snapshot_name, owner_id, groomer_profile_id")
    .eq("id", appointmentId)
    .maybeSingle();
  const [{ data: nsOwner }, { data: nsGroomer }] = await Promise.all([
    (nsCtx as any)?.owner_id ? supabaseAdmin.from("profiles").select("full_name").eq("id", (nsCtx as any).owner_id).maybeSingle() : Promise.resolve({ data: null }),
    (nsCtx as any)?.groomer_profile_id ? supabaseAdmin.from("groomer_profiles").select("business_name").eq("id", (nsCtx as any).groomer_profile_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  await logAdminAction(guard.profileId, "mark_no_show", "appointments", appointmentId, {
    owner: (nsOwner as any)?.full_name ?? null,
    groomer: (nsGroomer as any)?.business_name ?? null,
    service: (nsCtx as any)?.service_snapshot_name ?? null,
    scheduled_at: (nsCtx as any)?.scheduled_at ?? null,
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Appointment stats (lazy-loaded on tab mount)
// ---------------------------------------------------------------------------

export interface AdminAppointmentStats {
  totalAppointments: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  pendingCount: number;
  confirmedCount: number;
  appointmentsLast30Days: number;
  avgPerGroomer: number;
  avgPerOwner: number;
  mostPopularServices: { name: string; count: number }[];
  highestCancellationGroomers: { name: string; count: number }[];
  highestCancellationOwners: { name: string; count: number }[];
}

export async function adminGetAppointmentStats(): Promise<{ data: AdminAppointmentStats } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalRes, completedRes, cancelledRes, noShowRes, pendingRes, confirmedRes, last30Res, serviceRes, cancelledFullRes] = await Promise.all([
    supabaseAdmin.from("appointments").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("appointments").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabaseAdmin.from("appointments").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
    supabaseAdmin.from("appointments").select("id", { count: "exact", head: true }).eq("status", "no_show"),
    supabaseAdmin.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabaseAdmin.from("appointments").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    supabaseAdmin.from("appointments").select("id", { count: "exact", head: true }).gte("scheduled_at", thirtyDaysAgo.toISOString()),
    supabaseAdmin.from("appointments").select("service_snapshot_name, groomer_profile_id, owner_id"),
    supabaseAdmin.from("appointments").select(`
      groomer:groomer_profiles!groomer_profile_id ( business_name ),
      owner:profiles!owner_id ( full_name )
    `).eq("status", "cancelled"),
  ]);

  // Popular services aggregation
  const serviceNames: Record<string, number> = {};
  const groomerIds: string[] = [];
  const ownerIds: string[] = [];
  for (const row of (serviceRes.data ?? []) as { service_snapshot_name: string | null; groomer_profile_id: string | null; owner_id: string | null }[]) {
    if (row.service_snapshot_name) {
      serviceNames[row.service_snapshot_name] = (serviceNames[row.service_snapshot_name] ?? 0) + 1;
    }
    if (row.groomer_profile_id) groomerIds.push(row.groomer_profile_id);
    if (row.owner_id) ownerIds.push(row.owner_id);
  }
  const mostPopularServices = Object.entries(serviceNames)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Avg per groomer / per owner
  const uniqueGroomers = new Set(groomerIds).size;
  const uniqueOwners = new Set(ownerIds).size;
  const total = totalRes.count ?? 0;
  const avgPerGroomer = uniqueGroomers > 0 ? Math.round((total / uniqueGroomers) * 10) / 10 : 0;
  const avgPerOwner = uniqueOwners > 0 ? Math.round((total / uniqueOwners) * 10) / 10 : 0;

  // Cancellation leaders
  const cancelledGroomers: Record<string, number> = {};
  const cancelledOwners: Record<string, number> = {};
  for (const row of (cancelledFullRes.data ?? []) as unknown as { groomer: { business_name: string } | null; owner: { full_name: string } | null }[]) {
    const gName = row.groomer?.business_name;
    const oName = row.owner?.full_name;
    if (gName) cancelledGroomers[gName] = (cancelledGroomers[gName] ?? 0) + 1;
    if (oName) cancelledOwners[oName] = (cancelledOwners[oName] ?? 0) + 1;
  }
  const highestCancellationGroomers = Object.entries(cancelledGroomers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
  const highestCancellationOwners = Object.entries(cancelledOwners)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    data: {
      totalAppointments: total,
      completedCount: completedRes.count ?? 0,
      cancelledCount: cancelledRes.count ?? 0,
      noShowCount: noShowRes.count ?? 0,
      pendingCount: pendingRes.count ?? 0,
      confirmedCount: confirmedRes.count ?? 0,
      appointmentsLast30Days: last30Res.count ?? 0,
      avgPerGroomer,
      avgPerOwner,
      mostPopularServices,
      highestCancellationGroomers,
      highestCancellationOwners,
    },
  };
}

// ---------------------------------------------------------------------------
// Admin preferences (per-admin, persisted to profiles.admin_preferences)
// ---------------------------------------------------------------------------

export interface AdminPreferences {
  /** Up to 4 pinned snapshot metric keys — null means an empty slot */
  snapshots: (string | null)[];
}

export async function adminGetPreferences(): Promise<{ data: AdminPreferences } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("admin_preferences")
    .eq("id", guard.profileId)
    .maybeSingle();

  if (error) return { error: error.message };

  const stored = data?.admin_preferences as AdminPreferences | null;
  return {
    data: {
      snapshots: stored?.snapshots ?? [null, null, null, null],
    },
  };
}

export async function adminSavePreferences(
  preferences: AdminPreferences
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ admin_preferences: preferences })
    .eq("id", guard.profileId);

  if (error) return { error: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Financials (Groomr Management)
// ---------------------------------------------------------------------------

export interface AdminMonthlyStats {
  month: string; // 'YYYY-MM'
  revenuePence: number;
  feePence: number;
  payoutPence: number;
  refundPence: number;
  appointmentCount: number;
}

export interface AdminFinancials {
  totalRevenuePence: number;
  totalFeePence: number;
  totalPayoutPence: number;
  totalRefundedPence: number;
  totalTipsPence: number;
  pendingPayoutsPence: number;
  pendingPayoutsCount: number;
  monthlyBreakdown: AdminMonthlyStats[];
}

export async function adminGetFinancials(): Promise<{ data: AdminFinancials } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const [paymentsResult, tipsResult] = await Promise.all([
    supabaseAdmin
      .from("payments")
      .select(
        "full_amount_pence, platform_fee_pence, groomer_payout_amount_pence, refund_amount_pence, refund_status, payout_status, created_at"
      ),
    supabaseAdmin.from("tips").select("amount_pence, status, created_at").eq("status", "succeeded"),
  ]);

  if (paymentsResult.error) return { error: paymentsResult.error.message };

  type PaymentFull = {
    full_amount_pence: number | null;
    platform_fee_pence: number | null;
    groomer_payout_amount_pence: number | null;
    refund_amount_pence: number | null;
    refund_status: string | null;
    payout_status: string | null;
    created_at: string;
  };

  const payments = (paymentsResult.data ?? []) as PaymentFull[];
  const tips = (tipsResult.data ?? []) as { amount_pence: number | null; created_at: string }[];

  let totalRevenuePence = 0;
  let totalFeePence = 0;
  let totalPayoutPence = 0;
  let totalRefundedPence = 0;
  let pendingPayoutsPence = 0;
  let pendingPayoutsCount = 0;

  const monthly: Record<string, AdminMonthlyStats> = {};

  for (const p of payments) {
    const rev = p.full_amount_pence ?? 0;
    const fee = p.platform_fee_pence ?? 0;
    const payout = p.groomer_payout_amount_pence ?? 0;
    const refund = p.refund_status === "processed" ? (p.refund_amount_pence ?? 0) : 0;

    totalRevenuePence += rev;
    totalFeePence += fee;
    totalPayoutPence += payout;
    totalRefundedPence += refund;

    if (p.payout_status === "pending") {
      pendingPayoutsPence += payout;
      pendingPayoutsCount += 1;
    }

    const month = p.created_at.slice(0, 7);
    if (!monthly[month]) {
      monthly[month] = { month, revenuePence: 0, feePence: 0, payoutPence: 0, refundPence: 0, appointmentCount: 0 };
    }
    monthly[month].revenuePence += rev;
    monthly[month].feePence += fee;
    monthly[month].payoutPence += payout;
    monthly[month].refundPence += refund;
    monthly[month].appointmentCount += 1;
  }

  const totalTipsPence = tips.reduce((sum, t) => sum + (t.amount_pence ?? 0), 0);
  const monthlyBreakdown = Object.values(monthly)
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 6);

  return {
    data: {
      totalRevenuePence,
      totalFeePence,
      totalPayoutPence,
      totalRefundedPence,
      totalTipsPence,
      pendingPayoutsPence,
      pendingPayoutsCount,
      monthlyBreakdown,
    },
  };
}

// ---------------------------------------------------------------------------
// Team / admin users (Groomr Management)
// ---------------------------------------------------------------------------

export interface AdminTeamMember {
  profile_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  is_you: boolean;
}

export async function adminGetTeam(): Promise<{ data: AdminTeamMember[] } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, created_at")
    .eq("is_admin", true)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return {
    data: (data ?? []).map((p: any) => ({
      profile_id: p.id,
      full_name: p.full_name,
      email: p.email,
      created_at: p.created_at,
      is_you: p.id === guard.profileId,
    })),
  };
}

export async function adminRevokeAdmin(
  profileId: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  if (profileId === guard.profileId) {
    return { error: "You cannot remove your own admin access." };
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ is_admin: false })
    .eq("id", profileId);

  if (error) return { error: error.message };
  const { data: raPf } = await supabaseAdmin.from("profiles").select("full_name, email").eq("id", profileId).maybeSingle();
  await logAdminAction(guard.profileId, "revoke_admin", "profiles", profileId, { name: (raPf as any)?.full_name ?? null, email: (raPf as any)?.email ?? null });
  return { ok: true };
}

export async function adminGrantAdmin(
  profileId: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ is_admin: true })
    .eq("id", profileId);

  if (error) return { error: error.message };
  const { data: gaPf } = await supabaseAdmin.from("profiles").select("full_name, email").eq("id", profileId).maybeSingle();
  await logAdminAction(guard.profileId, "grant_admin", "profiles", profileId, { name: (gaPf as any)?.full_name ?? null, email: (gaPf as any)?.email ?? null });
  return { ok: true };
}

export async function adminFindProfileByEmail(
  email: string
): Promise<{ data: AdminTeamMember | null } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, created_at")
    .ilike("email", email.trim())
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { data: null };
  return {
    data: {
      profile_id: (data as any).id,
      full_name: (data as any).full_name,
      email: (data as any).email,
      created_at: (data as any).created_at,
      is_you: (data as any).id === guard.profileId,
    },
  };
}

// ---------------------------------------------------------------------------
// Platform settings (Groomr Management)
// ---------------------------------------------------------------------------

export interface IncentiveUsageRow {
  id: string;
  business_name: string | null;
  is_founding_groomer: boolean;
  bookings_used: number; // completed, not-fully-refunded bookings
}

export interface PlatformSettings {
  id: string;
  platform_fee_pct: number;
  signup_incentive_bookings: number;
  incentive_usage: IncentiveUsageRow[];
  updated_at: string;
  updated_by_name: string | null;
  integrations: {
    stripe: boolean;
    resend: boolean;
    twilio: boolean;
    gocardless: boolean;
    googleMaps: boolean;
    cloudinary: boolean;
    clerk: boolean;
    supabase: boolean;
  };
}

export async function adminGetPlatformSettings(): Promise<{ data: PlatformSettings } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const [{ data, error }, { data: groomers }, { data: completedAppts }, { data: fullRefunds }] = await Promise.all([
    supabaseAdmin
      .from("platform_settings")
      .select("id, platform_fee_pct, signup_incentive_bookings, updated_at, updated_by")
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("groomer_profiles")
      .select("id, business_name, is_founding_groomer")
      .order("business_name"),
    supabaseAdmin
      .from("appointments")
      .select("groomer_profile_id")
      .eq("status", "completed"),
    supabaseAdmin
      .from("payments")
      .select("appointments!inner(groomer_profile_id)")
      .eq("refund_status", "full"),
  ]);

  if (error) return { error: error.message };

  // Per-groomer incentive usage: completed bookings minus full refunds
  const usedByGroomer = new Map<string, number>();
  for (const a of completedAppts ?? []) {
    usedByGroomer.set(a.groomer_profile_id, (usedByGroomer.get(a.groomer_profile_id) ?? 0) + 1);
  }
  for (const r of fullRefunds ?? []) {
    const gid = (r as any).appointments?.groomer_profile_id;
    if (gid && usedByGroomer.has(gid)) usedByGroomer.set(gid, Math.max(0, usedByGroomer.get(gid)! - 1));
  }
  const incentiveUsage: IncentiveUsageRow[] = (groomers ?? []).map((g) => ({
    id: g.id,
    business_name: g.business_name,
    is_founding_groomer: g.is_founding_groomer ?? false,
    bookings_used: usedByGroomer.get(g.id) ?? 0,
  }));

  let updatedByName: string | null = null;
  if ((data as any)?.updated_by) {
    const { data: p } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", (data as any).updated_by)
      .maybeSingle();
    updatedByName = (p as any)?.full_name ?? null;
  }

  return {
    data: {
      id: (data as any)?.id ?? "",
      platform_fee_pct: (data as any)?.platform_fee_pct ?? 0.08,
      signup_incentive_bookings: (data as any)?.signup_incentive_bookings ?? 150,
      incentive_usage: incentiveUsage,
      updated_at: (data as any)?.updated_at ?? new Date().toISOString(),
      updated_by_name: updatedByName,
      integrations: {
        stripe: !!process.env.STRIPE_SECRET_KEY,
        resend: !!process.env.RESEND_API_KEY,
        twilio: !!process.env.TWILIO_ACCOUNT_SID,
        gocardless: !!process.env.GOCARDLESS_ACCESS_TOKEN,
        googleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
        cloudinary: !!process.env.CLOUDINARY_API_SECRET || !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        clerk: !!process.env.CLERK_SECRET_KEY,
        supabase: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
  };
}

export async function adminSavePlatformSettings(
  settingsId: string,
  fields: {
    platform_fee_pct?: number;
    signup_incentive_bookings?: number;
  }
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { error } = await supabaseAdmin
    .from("platform_settings")
    .update({ ...fields, updated_at: new Date().toISOString(), updated_by: guard.profileId })
    .eq("id", settingsId);

  if (error) return { error: error.message };
  await logAdminAction(guard.profileId, "update_platform_settings", "platform_settings", settingsId, fields as Record<string, unknown>);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Audit log (Groomr Management)
// ---------------------------------------------------------------------------

export interface AdminAuditEntry {
  id: string;
  admin_name: string | null;
  admin_email: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Analytics (Groomr Management)
// ---------------------------------------------------------------------------

export interface AnalyticsMonthPoint {
  month: string; // 'YYYY-MM'
  value: number;
}

export interface AnalyticsSignupPoint {
  month: string;
  owners: number;
  groomers: number;
}

export interface AnalyticsData {
  signups: AnalyticsSignupPoint[];
  bookings: AnalyticsMonthPoint[];
  revenue: AnalyticsMonthPoint[];
}

export async function adminGetAnalytics(
  months: number
): Promise<{ data: AnalyticsData } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const sinceIso = since.toISOString();

  const [profilesResult, appointmentsResult, paymentsResult] = await Promise.all([
    supabaseAdmin.from("profiles").select("created_at, roles").gte("created_at", sinceIso),
    supabaseAdmin.from("appointments").select("scheduled_at").gte("scheduled_at", sinceIso),
    supabaseAdmin.from("payments").select("created_at, full_amount_pence").gte("created_at", sinceIso),
  ]);

  // Build the ordered list of YYYY-MM labels from `since` up to now
  const labels: string[] = [];
  const cursor = new Date(since);
  cursor.setDate(1);
  const now = new Date();
  const endYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  while (true) {
    const ym = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    labels.push(ym);
    if (ym === endYM) break;
    cursor.setMonth(cursor.getMonth() + 1);
    if (labels.length > 60) break; // safety cap
  }

  const toYM = (iso: string) => iso.slice(0, 7);

  const signupsByMonth: Record<string, { owners: number; groomers: number }> = Object.fromEntries(
    labels.map((l) => [l, { owners: 0, groomers: 0 }])
  );
  for (const p of (profilesResult.data ?? []) as { created_at: string; roles: string[] }[]) {
    const ym = toYM(p.created_at);
    if (signupsByMonth[ym]) {
      if (p.roles?.includes("groomer")) signupsByMonth[ym].groomers++;
      else signupsByMonth[ym].owners++;
    }
  }

  const bookingsByMonth: Record<string, number> = Object.fromEntries(labels.map((l) => [l, 0]));
  for (const a of (appointmentsResult.data ?? []) as { scheduled_at: string }[]) {
    const ym = toYM(a.scheduled_at);
    if (bookingsByMonth[ym] !== undefined) bookingsByMonth[ym]++;
  }

  const revenueByMonth: Record<string, number> = Object.fromEntries(labels.map((l) => [l, 0]));
  for (const p of (paymentsResult.data ?? []) as { created_at: string; full_amount_pence: number | null }[]) {
    const ym = toYM(p.created_at);
    if (revenueByMonth[ym] !== undefined) revenueByMonth[ym] += p.full_amount_pence ?? 0;
  }

  return {
    data: {
      signups: labels.map((m) => ({ month: m, owners: signupsByMonth[m].owners, groomers: signupsByMonth[m].groomers })),
      bookings: labels.map((m) => ({ month: m, value: bookingsByMonth[m] })),
      revenue: labels.map((m) => ({ month: m, value: revenueByMonth[m] })),
    },
  };
}

// ---------------------------------------------------------------------------
// Audit log (Groomr Management)
// ---------------------------------------------------------------------------

const AUDIT_PAGE_SIZE = 50;

export async function adminGetAuditLog(
  page = 0
): Promise<{ data: AdminAuditEntry[] } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { data, error } = await supabaseAdmin
    .from("admin_audit_log")
    .select("id, action, target_table, target_id, metadata, created_at, admin_profile_id")
    .order("created_at", { ascending: false })
    .range(page * AUDIT_PAGE_SIZE, (page + 1) * AUDIT_PAGE_SIZE - 1);

  if (error) {
    console.error("[adminGetAuditLog] query failed:", error.message);
    return { error: error.message };
  }

  const rows = (data ?? []) as any[];

  // Resolve admin names in a separate query to avoid PostgREST join ambiguity
  const profileIds = [...new Set(rows.map((r) => r.admin_profile_id).filter(Boolean))];
  const profileMap = new Map<string, { full_name: string | null; email: string | null }>();
  if (profileIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", profileIds);
    for (const p of profiles ?? []) {
      profileMap.set((p as any).id, { full_name: (p as any).full_name, email: (p as any).email });
    }
  }

  return {
    data: rows.map((e) => ({
      id: e.id,
      admin_name: profileMap.get(e.admin_profile_id)?.full_name ?? null,
      admin_email: profileMap.get(e.admin_profile_id)?.email ?? null,
      action: e.action,
      target_table: e.target_table,
      target_id: e.target_id,
      metadata: e.metadata ?? {},
      created_at: e.created_at,
    })),
  };
}
