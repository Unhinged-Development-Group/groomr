import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getOwnerMessageThreads } from "@/app/actions/messages";
import { OwnerMessagesClient } from "./_components/OwnerMessagesClient";

export default async function OwnerMessagesPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { threads, profileId } = await getOwnerMessageThreads();

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-8">
      <header className="mb-5">
        <h1 className="font-fredoka text-3xl md:text-4xl text-deep-slate">
          Messages
        </h1>
      </header>

      <OwnerMessagesClient
        initialThreads={threads}
        profileId={profileId}
      />
    </div>
  );
}
