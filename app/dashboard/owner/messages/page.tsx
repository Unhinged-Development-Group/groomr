import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import {
  getOwnerMessageThreads,
  getOwnerBookingsForMessaging,
} from "@/app/actions/messages";
import { OwnerMessagesClient } from "./_components/OwnerMessagesClient";

interface Props {
  searchParams: Promise<{ groomer?: string }>;
}

export default async function OwnerMessagesPage({ searchParams }: Props) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { groomer: initialGroomerId } = await searchParams;

  const [{ threads, profileId }, bookings] = await Promise.all([
    getOwnerMessageThreads(),
    getOwnerBookingsForMessaging(),
  ]);

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-8">
      <header className="mb-5">
        <h1 className="font-fredoka text-3xl md:text-4xl text-deep-slate">
          Messages
        </h1>
      </header>

      <OwnerMessagesClient
        initialThreads={threads}
        initialBookings={bookings}
        profileId={profileId}
        initialGroomerId={initialGroomerId ?? null}
      />
    </div>
  );
}
