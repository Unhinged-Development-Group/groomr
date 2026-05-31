import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GroomerTermsPage({ params }: Props) {
  const { id } = await params;

  // Resolve slug or UUID to groomer_profile_id
  const { data: gp } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id, business_name")
    .or(`id.eq.${id},public_slug.eq.${id}`)
    .maybeSingle();

  if (!gp) notFound();

  const { data: terms } = await supabaseAdmin
    .from("contract_terms")
    .select("content, version, published_at")
    .eq("groomer_profile_id", gp.id)
    .eq("is_current", true)
    .maybeSingle();

  if (!terms) {
    return (
      <main className="min-h-screen bg-alabaster-cream px-5 sm:px-6 lg:px-12 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-fredoka text-3xl text-deep-slate">{gp.business_name} — Terms</h1>
          <p className="mt-4 text-pebble-grey font-nunito">This groomer has not published custom terms of service.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-alabaster-cream px-5 sm:px-6 lg:px-12 py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-fredoka text-3xl text-deep-slate">{gp.business_name} — Terms of Service</h1>
          <p className="text-xs text-pebble-grey font-nunito mt-1">
            Version {terms.version} · Published {new Date(terms.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
          <p className="text-sm text-deep-slate font-nunito whitespace-pre-wrap leading-relaxed">{terms.content}</p>
        </div>
      </div>
    </main>
  );
}
