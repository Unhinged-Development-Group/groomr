import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DogsSection } from "./_components/DogsSection";
import { AppointmentsSection } from "./_components/AppointmentsSection";
import { FavouriteGroomersSection } from "./_components/FavouriteGroomersSection";
import { AccountSection } from "./_components/AccountSection";
import { NotificationsSection } from "./_components/NotificationsSection";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOwnerAppointments } from "@/app/actions/appointments";
import { getFavouriteGroomers } from "@/app/actions/favourites";
import { getOwnerTips } from "@/app/actions/tips";
import { getSMSPreference } from "@/app/actions/sms-preferences";
import type { Dog } from "@/app/actions/dogs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Dashboard — Groomr",
};

async function getOrCreateProfile(clerkId: string, firstName: string | null, email: string | null) {
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (existing) return existing;

  const { data: created } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: crypto.randomUUID(),
      clerk_id: clerkId,
      full_name: firstName ?? "",
      email,
      roles: "{owner}",
      is_admin: false,
    })
    .select("id")
    .single();

  return created;
}

async function fetchDogs(clerkId: string, firstName: string | null, email: string | null): Promise<Dog[]> {
  const profile = await getOrCreateProfile(clerkId, firstName, email);

  if (!profile) return [];

  const { data } = await supabaseAdmin
    .from("dogs")
    .select("*")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: true });

  return (data ?? []) as Dog[];
}

export default async function OwnerDashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const firstName = user.firstName ?? "there";
  const email = user.emailAddresses?.[0]?.emailAddress ?? null;
  const [dogs, appointments, favourites, tips, smsEnabled] = await Promise.all([
    fetchDogs(user.id, user.firstName ?? null, email),
    getOwnerAppointments(),
    getFavouriteGroomers(),
    getOwnerTips(),
    getSMSPreference(),
  ]);

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10 space-y-2">
        <h1 className="font-fredoka text-4xl md:text-5xl text-deep-slate">
          Hey, {firstName}
        </h1>
      </div>

      {/* Dogs */}
      <DogsSection initialDogs={dogs} />

      <AppointmentsSection initialAppointments={appointments} tippedAppointmentIds={new Set(tips.map((t) => t.appointment_id))} />

      <FavouriteGroomersSection initialFavourites={favourites} />
      <NotificationsSection initialSMSEnabled={smsEnabled} />
      <AccountSection />
    </div>
  );
}
