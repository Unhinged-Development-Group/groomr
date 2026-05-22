import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { GroomerDashboardClient } from "./_components/GroomerDashboardClient";
import { getGroomerAppointments, getGroomerReviews, getGroomerPayments } from "@/app/actions/groomer";
import { loadProfileEditorData } from "@/app/actions/profile-editor";
import { getTimeBlocks } from "@/app/actions/time-blocks";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groomer Dashboard — Groomr",
};

export default async function GroomerDashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const ownerName = user.firstName ?? "Groomer";

  const [appointments, reviews, payments, editorData, timeBlocks] = await Promise.all([
    getGroomerAppointments(),
    getGroomerReviews(),
    getGroomerPayments(),
    loadProfileEditorData(),
    getTimeBlocks(),
  ]);

  const businessName = editorData.profile.businessName || "Your Studio";
  const unrespondedReviews = reviews.filter((r) => !r.groomer_reply).length;

  return (
    <GroomerDashboardClient
      businessName={businessName}
      ownerName={ownerName}
      unrespondedReviews={unrespondedReviews}
      initialAppointments={appointments}
      initialReviews={reviews}
      initialPayments={payments}
      initialTimeBlocks={timeBlocks}
      editorData={editorData}
    />
  );
}
