import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { GroomerDashboardClient } from "./_components/GroomerDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groomer Dashboard — Groomr",
};

export default async function GroomerDashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const ownerName = user.firstName ?? "Groomer";

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", user.id)
    .maybeSingle();

  let businessName = "Your Studio";

  if (profile) {
    const { data: groomerProfile } = await supabaseAdmin
      .from("groomer_profiles")
      .select("business_name")
      .eq("user_id", profile.id)
      .maybeSingle();

    if (groomerProfile?.business_name) {
      businessName = groomerProfile.business_name;
    }
  }

  return (
    <GroomerDashboardClient
      businessName={businessName}
      ownerName={ownerName}
      unrespondedReviews={3}
    />
  );
}
