import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getGroomerMessageThreads, getGroomerBookingsForMessaging } from "@/app/actions/messages";
import { MessagesClient } from "./_components/MessagesClient";
import { DashboardIcon } from "@/components/ui/GroomrIcons";

export default async function MessagesPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const [threads, bookings] = await Promise.all([
    getGroomerMessageThreads(),
    getGroomerBookingsForMessaging(),
  ]);

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-8">
      <header className="mb-5">
        <Link
          href="/dashboard/groomer"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-pebble-grey hover:text-deep-slate hover:bg-alabaster-cream transition-colors focus-ring mb-2"
          aria-label="Back to dashboard"
        >
          <DashboardIcon size={18} />
        </Link>
        <h1 className="font-fredoka text-3xl md:text-4xl text-deep-slate">
          Talk to your clients
        </h1>
      </header>

      <MessagesClient initialThreads={threads} initialBookings={bookings} currentUserId={user.id} />
    </div>
  );
}
