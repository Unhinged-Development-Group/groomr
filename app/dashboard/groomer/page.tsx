import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { GroomerDashboardClient } from "./_components/GroomerDashboardClient";
import { getGroomerAppointments, getGroomerReviews, getGroomerPayments } from "@/app/actions/groomer";
import { loadProfileEditorData } from "@/app/actions/profile-editor";
import { getTimeBlocks } from "@/app/actions/time-blocks";
import { getConnectAccountStatus } from "@/app/actions/stripe-connect";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groomer Dashboard — Groomr",
};

export default async function GroomerDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ welcome?: string; stripe?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const params = searchParams ? await searchParams : {};
  const showWelcome = params.welcome === "1";

  const ownerName = user.firstName ?? "Groomer";

  const [appointments, reviews, payments, editorData, timeBlocks, stripeStatus] = await Promise.all([
    getGroomerAppointments(),
    getGroomerReviews(),
    getGroomerPayments(),
    loadProfileEditorData(),
    getTimeBlocks(),
    getConnectAccountStatus(),
  ]);

  const businessName = editorData.profile.businessName || "Your Studio";
  const unrespondedReviews = reviews.filter((r) => !r.groomer_reply).length;

  const connectStatus = "error" in stripeStatus
    ? { connected: false, chargesEnabled: false, detailsSubmitted: false, stripeAccountId: null }
    : stripeStatus;

  return (
    <GroomerDashboardClient
      businessName={businessName}
      ownerName={ownerName}
      unrespondedReviews={unrespondedReviews}
      showWelcome={showWelcome}
      stripeStatus={connectStatus}
      initialAppointments={appointments}
      initialReviews={reviews}
      initialPayments={payments}
      initialTimeBlocks={timeBlocks}
      editorData={editorData}
      isFoundingGroomer={editorData.isFoundingGroomer}
      foundingCommissionExpiresAt={editorData.foundingCommissionExpiresAt}
    />
  );
}
