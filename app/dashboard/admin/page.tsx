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

  const [stats, groomers, users, disputes, support, appointments] = await Promise.all([
    getAdminOverviewStats(),
    getAllGroomers(),
    getAllUsers(),
    getAllDisputes(),
    getAllSupportRequests(),
    adminGetAppointments(),
  ]);

  return (
    <AdminDashboardClient
      adminName={profile.full_name ?? user.firstName ?? "Admin"}
      initialStats={"error" in stats ? null : stats}
      initialGroomers={"error" in groomers ? [] : groomers.data}
      initialUsers={"error" in users ? [] : users.data}
      initialDisputes={"error" in disputes ? [] : disputes.data}
      initialSupport={"error" in support ? [] : support.data}
      initialAppointments={"error" in appointments ? [] : appointments.data}
    />
  );
}
