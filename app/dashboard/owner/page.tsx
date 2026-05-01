import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SearchIcon, CalendarIcon } from "@/components/ui/GroomrIcons";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Badge } from "@/components/ui/Badge";
import { DogsSection } from "./_components/DogsSection";
import { AppointmentsSection } from "./_components/AppointmentsSection";
import { FavouriteGroomersSection } from "./_components/FavouriteGroomersSection";
import { supabaseAdmin } from "@/lib/supabase";
import { getOwnerAppointments } from "@/app/actions/appointments";
import { getFavouriteGroomers } from "@/app/actions/favourites";
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
  const dogs = await fetchDogs(user.id, user.firstName ?? null, email);
  const appointments = await getOwnerAppointments();
  const favourites = await getFavouriteGroomers();

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10 space-y-2">
        <Eyebrow>Dog owner</Eyebrow>
        <h1 className="font-fredoka text-4xl md:text-5xl text-deep-slate">
          Hey, {firstName} 👋
        </h1>
        <p className="text-pebble-grey font-nunito">
          Your Groomr dashboard is on its way. Here&apos;s a sneak peek of what&apos;s coming.
        </p>
      </div>

      {/* Dogs */}
      <DogsSection initialDogs={dogs} />

      <AppointmentsSection initialAppointments={appointments} />

      <FavouriteGroomersSection initialFavourites={favourites} />

      {/* Coming-soon cards */}
      <div className="grid md:grid-cols-2 gap-5 mb-10">
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-7 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-alabaster-cream border border-pebble-grey/15 flex items-center justify-center">
            <SearchIcon size={24} className="text-deep-slate" />
          </div>
          <h3 className="font-fredoka text-xl text-deep-slate">Find a groomer</h3>
          <p className="text-pebble-grey text-sm font-nunito">
            Browse verified groomers near you, check availability, and book instantly.
          </p>
          <Badge tone="grey">Coming soon</Badge>
        </div>
      </div>

      {/* CTA for groomers */}
      <div className="bg-deep-slate text-alabaster-cream rounded-[24px] p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex-1">
          <p className="font-fredoka text-2xl mb-1">Are you also a groomer?</p>
          <p className="text-sage-leaf text-sm font-nunito">
            List your services and start taking bookings — it&apos;s free.
          </p>
        </div>
        <Link
          href="/register/groomer"
          className="btn-primary font-nunito font-bold px-6 py-3 rounded-full focus-ring whitespace-nowrap shrink-0 inline-flex items-center"
        >
          Become a Groomr
        </Link>
      </div>
    </div>
  );
}
