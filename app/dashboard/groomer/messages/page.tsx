import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getGroomerMessageThreads, getGroomerBookingsForMessaging } from "@/app/actions/messages";
import { MessagesClient } from "./_components/MessagesClient";

export default async function MessagesPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const [{ threads, profileId }, bookings] = await Promise.all([
    getGroomerMessageThreads(),
    getGroomerBookingsForMessaging(),
  ]);

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-8">
      <header className="mb-5">
        <h1 className="font-fredoka text-3xl md:text-4xl text-deep-slate">
          Talk to your clients
        </h1>
      </header>

      <MessagesClient initialThreads={threads} initialBookings={bookings} profileId={profileId} />
    </div>
  );
}
