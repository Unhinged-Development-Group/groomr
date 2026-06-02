"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { resend, FROM_EMAIL } from "@/lib/resend";

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
  grossRevenuePence: number;
  platformFeePence: number;
  groomerPayoutPence: number;
  openDisputes: number;
  openSupportRequests: number;
}

export interface AdminGroomerRow {
  groomer_profile_id: string;
  profile_id: string;
  business_name: string;
  owner_name: string | null;
  email: string | null;
  is_listed: boolean;
  is_verified: boolean;
  average_rating: number;
  total_reviews: number;
  created_at: string;
}

export interface AdminUserRow {
  profile_id: string;
  full_name: string | null;
  email: string | null;
  roles: string[];
  is_admin: boolean;
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
  status: "open" | "in_review" | "resolved";
  admin_notes: string | null;
  appointment_id: string | null;
  owner_name: string | null;
  owner_email: string | null;
  groomer_name: string | null;
  groomer_email: string | null;
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

// ---------------------------------------------------------------------------
// Overview stats
// ---------------------------------------------------------------------------

export async function getAdminOverviewStats(): Promise<AdminOverviewStats | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    ownersResult,
    groomersResult,
    listedResult,
    unverifiedResult,
    dogsResult,
    apptAllResult,
    appt30Result,
    revenueResult,
    disputesResult,
    supportResult,
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).contains("roles", ["owner"]),
    supabaseAdmin.from("groomer_profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("groomer_profiles").select("id", { count: "exact", head: true }).eq("is_listed", true),
    supabaseAdmin.from("groomer_profiles").select("id", { count: "exact", head: true }).eq("is_verified", false),
    supabaseAdmin.from("dogs").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("appointments").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("appointments").select("id", { count: "exact", head: true }).gte("scheduled_at", thirtyDaysAgo.toISOString()),
    supabaseAdmin.from("payments").select("full_amount_pence, platform_fee_pence, groomer_payout_amount_pence"),
    supabaseAdmin.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabaseAdmin.from("support_requests").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);

  type PaymentRow = { full_amount_pence: number | null; platform_fee_pence: number | null; groomer_payout_amount_pence: number | null };
  const payments: PaymentRow[] = revenueResult.data ?? [];
  const grossRevenuePence = payments.reduce((sum, p) => sum + (p.full_amount_pence ?? 0), 0);
  const platformFeePence = payments.reduce((sum, p) => sum + (p.platform_fee_pence ?? 0), 0);
  const groomerPayoutPence = payments.reduce((sum, p) => sum + (p.groomer_payout_amount_pence ?? 0), 0);

  return {
    totalOwners: ownersResult.count ?? 0,
    totalGroomers: groomersResult.count ?? 0,
    listedGroomers: listedResult.count ?? 0,
    unverifiedGroomers: unverifiedResult.count ?? 0,
    totalDogs: dogsResult.count ?? 0,
    totalAppointments: apptAllResult.count ?? 0,
    appointmentsLast30Days: appt30Result.count ?? 0,
    grossRevenuePence,
    platformFeePence,
    groomerPayoutPence,
    openDisputes: disputesResult.count ?? 0,
    openSupportRequests: supportResult.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Groomers
// ---------------------------------------------------------------------------

export async function getAllGroomers(search?: string, page = 0): Promise<{ data: AdminGroomerRow[] } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const PAGE_SIZE = 50;
  let query = supabaseAdmin
    .from("groomer_profiles")
    .select(`
      id,
      business_name,
      is_listed,
      is_verified,
      average_rating,
      total_reviews,
      created_at,
      profiles!groomer_profiles_user_id_fkey ( id, full_name, email )
    `)
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  const { data, error } = await query;
  if (error) return { error: error.message };

  const rows: AdminGroomerRow[] = (data ?? []).map((g: any) => ({
    groomer_profile_id: g.id,
    profile_id: g.profiles?.id ?? "",
    business_name: g.business_name,
    owner_name: g.profiles?.full_name ?? null,
    email: g.profiles?.email ?? null,
    is_listed: g.is_listed,
    is_verified: g.is_verified,
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

export async function verifyGroomer(
  groomerProfileId: string,
  verified: boolean
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { error } = await supabaseAdmin
    .from("groomer_profiles")
    .update({ is_verified: verified, updated_at: new Date().toISOString() })
    .eq("id", groomerProfileId);

  if (error) return { error: error.message };

  // Send email notification when verifying
  if (verified) {
    const { data: gp } = await supabaseAdmin
      .from("groomer_profiles")
      .select("business_name, profiles!groomer_profiles_user_id_fkey ( email, full_name )")
      .eq("id", groomerProfileId)
      .maybeSingle();

    const email = (gp as any)?.profiles?.email;
    const name = (gp as any)?.profiles?.full_name ?? "there";
    const business = (gp as any)?.business_name ?? "your business";

    if (email) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Your Groomr profile has been verified ✓",
        text: `Hi ${name},\n\nGreat news — ${business} has been verified on Groomr. Your profile will now appear in search results and you can start accepting bookings.\n\nThe Groomr team`,
      }).catch(() => {/* non-fatal */});
    }
  }

  return { ok: true };
}

export async function updateGroomerProfile(
  groomerProfileId: string,
  fields: {
    business_name?: string;
    is_listed?: boolean;
    is_verified?: boolean;
    bio?: string;
    city?: string;
    postcode?: string;
  }
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { error } = await supabaseAdmin
    .from("groomer_profiles")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", groomerProfileId);

  if (error) return { error: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function getAllUsers(search?: string, page = 0): Promise<{ data: AdminUserRow[] } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const PAGE_SIZE = 50;
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, roles, is_admin, created_at")
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
    roles: p.roles ?? [],
    is_admin: p.is_admin ?? false,
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
    roles?: string[];
    is_admin?: boolean;
  }
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  // Prevent self-demotion
  if (fields.is_admin === false && profileId === guard.profileId) {
    return { error: "You cannot remove your own admin privileges." };
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", profileId);

  if (error) return { error: error.message };
  return { ok: true };
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
    owner_name: d.owner?.full_name ?? null,
    owner_email: d.owner?.email ?? null,
    groomer_name: d.groomer?.full_name ?? null,
    groomer_email: d.groomer?.email ?? null,
    created_at: d.created_at,
  }));

  return { data: rows };
}

export async function updateDisputeStatus(
  id: string,
  status: "open" | "in_review" | "resolved",
  adminNotes: string
): Promise<{ ok: boolean } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const { error } = await supabaseAdmin
    .from("disputes")
    .update({ status, admin_notes: adminNotes, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
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
    return { ok: true };
  } catch {
    return { error: "Failed to send email." };
  }
}
