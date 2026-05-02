import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { loadProfileEditorData } from "@/app/actions/profile-editor";
import { GroomerDashboardClient } from "./_components/GroomerDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groomer Dashboard — Groomr",
};

export default async function GroomerDashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const editorData = await loadProfileEditorData();

  return (
    <GroomerDashboardClient
      businessName={editorData.profile.businessName || "Your Studio"}
      ownerName={editorData.profile.ownerName || user.firstName || "Groomer"}
      unrespondedReviews={3}
      editorData={editorData}
    />
  );
}
