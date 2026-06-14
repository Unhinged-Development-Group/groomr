import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { AdminDashboardClient } from "./_components/AdminDashboardClient";
import {
  getAdminOverviewStats,
  getAllGroomers,
  getAllUsers,
  getAllDisputes,
  getAllSupportRequests,
  adminGetAppointments,
  adminGetPreferences,
  adminGetFinancials,
  adminGetTeam,
  adminGetPlatformSettings,
  adminGetAuditLog,
} from "@/app/actions/admin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard — Groomr",
};

export default async function AdminDashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Auth gate — only admin users
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_admin, full_name")
    .eq("clerk_id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) redirect("/dashboard");

  const [
    stats,
    groomers,
    users,
    disputes,
    support,
    appointments,
    preferences,
    financials,
    team,
    platformSettings,
    auditLog,
  ] = await Promise.all([
    getAdminOverviewStats(),
    getAllGroomers(),
    getAllUsers(),
    getAllDisputes(),
    getAllSupportRequests(),
    adminGetAppointments(),
    adminGetPreferences(),
    adminGetFinancials(),
    adminGetTeam(),
    adminGetPlatformSettings(),
    adminGetAuditLog(),
  ]);

  return (
    <AdminDashboardClient
      adminName={profile.full_name ?? user.firstName ?? "Admin"}
      // User Management
      initialStats={"error" in stats ? null : stats}
      initialGroomers={"error" in groomers ? [] : groomers.data}
      initialUsers={"error" in users ? [] : users.data}
      initialDisputes={"error" in disputes ? [] : disputes.data}
      initialSupport={"error" in support ? [] : support.data}
      initialAppointments={"error" in appointments ? [] : appointments.data}
      initialPreferences={"error" in preferences ? { snapshots: [null, null, null, null] } : preferences.data}
      // Groomr Management
      initialFinancials={"error" in financials ? null : financials.data}
      initialTeam={"error" in team ? [] : team.data}
      initialPlatformSettings={"error" in platformSettings ? null : platformSettings.data}
      platformSettingsError={"error" in platformSettings ? platformSettings.error : null}
      initialAuditLog={"error" in auditLog ? [] : auditLog.data}
      auditLogError={"error" in auditLog ? auditLog.error : null}
    />
  );
}
