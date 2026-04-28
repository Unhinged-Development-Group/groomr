import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Role-based redirect hub.
 * Reads profiles.roles from Supabase and sends the user to the right dashboard.
 */
export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("roles")
    .eq("clerk_id", user.id)
    .maybeSingle();

  const roles: string[] = profile?.roles ?? ["owner"];

  if (roles.includes("groomer")) {
    redirect("/dashboard/groomer");
  }

  redirect("/dashboard/owner");
}
