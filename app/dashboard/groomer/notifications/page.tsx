import { redirect } from "next/navigation";
import { getGroomerNotifications } from "@/app/actions/notifications";
import { NotificationsClient } from "./_components/NotificationsClient";

export const metadata = { title: "Notifications — Groomr" };

export default async function GroomerNotificationsPage() {
  const notifications = await getGroomerNotifications();

  if (notifications === null) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-alabaster-cream px-5 sm:px-6 lg:px-12 xl:px-20 py-10">
      <div className="max-w-2xl mx-auto">
        <NotificationsClient initialNotifications={notifications} />
      </div>
    </main>
  );
}
