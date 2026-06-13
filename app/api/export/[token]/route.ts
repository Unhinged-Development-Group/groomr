import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const { data: tokenRow } = await supabaseAdmin
    .from("account_export_tokens")
    .select("profile_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!tokenRow) {
    return new NextResponse("This download link is invalid or has already expired.", { status: 404 });
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return new NextResponse(
      "This download link has expired. Your data has been deleted in accordance with our privacy policy.",
      { status: 410 }
    );
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, phone, created_at, roles, anonymised_at")
    .eq("id", tokenRow.profile_id)
    .maybeSingle();

  if (!profile) {
    return new NextResponse("Your account data has been deleted.", { status: 410 });
  }

  if (profile.anonymised_at) {
    return new NextResponse(
      "Your personal data has been anonymised and is no longer available for download.",
      { status: 410 }
    );
  }

  const isGroomer = (profile.roles as string[] ?? []).includes("groomer");

  const [
    { data: dogs },
    { data: appointments },
    { data: reviews },
    { data: favourites },
  ] = await Promise.all([
    supabaseAdmin
      .from("dogs")
      .select("name, breed, date_of_birth, size, is_neutered, coat_type, coat_notes, temperament_notes, health_notes")
      .eq("owner_id", tokenRow.profile_id),
    supabaseAdmin
      .from("appointments")
      .select(`
        scheduled_at, status, service_snapshot_name, service_snapshot_price,
        groomer_profiles!appointments_groomer_profile_id_fkey ( business_name ),
        dogs!appointments_dog_id_fkey ( name, breed ),
        payments ( full_amount_pence, platform_fee_pence, refund_status, refund_amount_pence )
      `)
      .eq("owner_id", tokenRow.profile_id)
      .order("scheduled_at", { ascending: false }),
    supabaseAdmin
      .from("reviews")
      .select("rating, body, created_at, groomer_profiles!reviews_groomer_profile_id_fkey ( business_name )")
      .eq("owner_id", tokenRow.profile_id),
    supabaseAdmin
      .from("favourite_groomers")
      .select("groomer_profiles!favourite_groomers_groomer_profile_id_fkey ( business_name, city )")
      .eq("owner_id", tokenRow.profile_id),
  ]);

  let groomerSection = null;
  if (isGroomer) {
    const { data: gp } = await supabaseAdmin
      .from("groomer_profiles")
      .select("business_name, tagline, bio, city, postcode, years_experience, is_listed, average_rating, total_reviews, created_at")
      .eq("user_id", tokenRow.profile_id)
      .maybeSingle();

    if (gp) {
      const [{ data: services }, { data: gpReviews }] = await Promise.all([
        supabaseAdmin
          .from("services")
          .select("name, description, duration_minutes, price_pence, is_active")
          .eq("groomer_profile_id", (gp as any).id ?? ""),
        supabaseAdmin
          .from("reviews")
          .select("rating, body, created_at")
          .eq("groomer_profile_id", (gp as any).id ?? ""),
      ]);

      groomerSection = {
        business: gp,
        services: services ?? [],
        reviews_received: gpReviews ?? [],
      };
    }
  }

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: {
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      created_at: profile.created_at,
      roles: profile.roles,
    },
    dogs: dogs ?? [],
    appointments: (appointments ?? []).map((a: any) => ({
      date: a.scheduled_at,
      status: a.status,
      service: a.service_snapshot_name,
      amount_pence: a.service_snapshot_price,
      paid_pence: a.payments?.[0]?.full_amount_pence ?? null,
      refund_status: a.payments?.[0]?.refund_status ?? null,
      refund_amount_pence: a.payments?.[0]?.refund_amount_pence ?? null,
      groomer: a.groomer_profiles?.business_name ?? null,
      dog: a.dogs?.name ?? null,
    })),
    reviews_written: (reviews ?? []).map((r: any) => ({
      groomer: r.groomer_profiles?.business_name ?? null,
      rating: r.rating,
      body: r.body,
      date: r.created_at,
    })),
    saved_groomers: (favourites ?? []).map((f: any) => ({
      business_name: f.groomer_profiles?.business_name ?? null,
      city: f.groomer_profiles?.city ?? null,
    })),
    ...(groomerSection ? { groomer_business: groomerSection } : {}),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="groomr-data-export.json"`,
    },
  });
}
