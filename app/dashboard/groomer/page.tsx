import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Settings } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Badge } from "@/components/ui/Badge";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groomer Dashboard — Groomr",
};

export default async function GroomerDashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const firstName = user.firstName ?? "there";

  // Fetch groomer profile for business name
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", user.id)
    .maybeSingle();

  let businessName: string | null = null;

  if (profile) {
    const { data: groomerProfile } = await supabaseAdmin
      .from("groomer_profiles")
      .select("business_name, is_listed, is_verified")
      .eq("user_id", profile.id)
      .maybeSingle();

    businessName = groomerProfile?.business_name ?? null;
  }

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10 space-y-2">
        <Eyebrow>Groomer dashboard</Eyebrow>
        <h1 className="font-fredoka text-4xl md:text-5xl text-deep-slate">
          {businessName ? `Welcome, ${businessName}` : `Hey, ${firstName} 👋`}
        </h1>
        <p className="text-pebble-grey font-nunito">
          Your dashboard is being built. You&apos;re registered — we&apos;ll notify you when your
          profile goes live.
        </p>
      </div>

      {/* Status card */}
      <div className="bg-white border border-pebble-grey/20 rounded-[24px] p-7 mb-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-fredoka text-xl text-deep-slate">Profile status</p>
            <p className="text-sm text-pebble-grey font-nunito mt-1">
              We&apos;re reviewing your details. This usually takes under an hour.
            </p>
          </div>
          <Badge tone="terra">Pending review</Badge>
        </div>
        <div className="flex gap-3 pt-2">
          <Link
            href="/register/groomer"
            className="btn-secondary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring inline-flex items-center gap-2"
          >
            <Settings size={14} />
            Edit profile
          </Link>
        </div>
      </div>

      {/* Coming soon grid */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-7 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-alabaster-cream border border-pebble-grey/15 flex items-center justify-center">
            <Calendar size={24} className="text-deep-slate" />
          </div>
          <h3 className="font-fredoka text-xl text-deep-slate">Booking calendar</h3>
          <p className="text-pebble-grey text-sm font-nunito">
            Manage appointments, block time off, and sync with Google Calendar.
          </p>
          <Badge tone="grey">Coming soon</Badge>
        </div>

        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-7 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-alabaster-cream border border-pebble-grey/15 flex items-center justify-center">
            <span className="font-fredoka text-deep-slate text-xl">£</span>
          </div>
          <h3 className="font-fredoka text-xl text-deep-slate">Earnings &amp; payouts</h3>
          <p className="text-pebble-grey text-sm font-nunito">
            Track weekly earnings, see upcoming payouts, and download statements.
          </p>
          <Badge tone="grey">Coming soon</Badge>
        </div>
      </div>
    </div>
  );
}
