import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { GroomerWizard } from "./_components/GroomerWizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register as a Groomr",
  description: "Set up your grooming business profile. Takes 5 minutes.",
};

export default async function RegisterGroomerPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in?redirect_url=/register/groomer");
  }

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ?? "";
  const email =
    user.emailAddresses?.[0]?.emailAddress ?? "";

  return (
    <GroomerWizard
      initialName={fullName}
      initialEmail={email}
    />
  );
}
