import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { GroomerDashboardClient } from "./_components/GroomerDashboardClient";
import {
  getGroomerProfile,
  getGroomerAppointments,
  getGroomerReviews,
  getGroomerPayments
} from "@/app/actions/groomer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groomer Dashboard — Groomr",
};

export default async function GroomerDashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const ownerName = user.firstName ?? "Groomer";

  // Fetch all dashboard data concurrently
  const [profileData, appointments, reviews, payments] = await Promise.all([
    getGroomerProfile(),
    getGroomerAppointments(),
    getGroomerReviews(),
    getGroomerPayments(),
  ]);

  // Handle case where profile isn't fully created
  if (!profileData || !profileData.profile) {
    // If not a groomer, you might redirect to setup, but for now we'll pass empty.
    return (
      <GroomerDashboardClient
        businessName="Your Studio"
        ownerName={ownerName}
        unrespondedReviews={0}
        initialAppointments={[]}
        initialReviews={[]}
        initialPayments={[]}
        profileData={{ profile: null, services: [], team: [] }}
      />
    );
  }

  const businessName = profileData.profile.business_name || "Your Studio";
  const unrespondedReviews = reviews.filter(r => !r.groomer_reply).length;

  return (
    <GroomerDashboardClient
      businessName={businessName}
      ownerName={ownerName}
      unrespondedReviews={unrespondedReviews}
      initialAppointments={appointments}
      initialReviews={reviews}
      initialPayments={payments}
      profileData={profileData}
    />
  );
}
