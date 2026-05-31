import { notFound } from "next/navigation";
import Image from "next/image";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getFavouriteGroomers } from "@/app/actions/favourites";
import { StarRow } from "@/components/ui/StarRow";
import { LocationPinIcon } from "@/components/ui/GroomrIcons";
import { ActionBar } from "./_components/ActionBar";
import { GalleryGrid } from "./_components/GalleryGrid";
import { ReviewsSection } from "./_components/ReviewsSection";
import { ReportButton } from "./_components/ReportButton";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const UK_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const SIZE_LABELS: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  giant: "Giant",
};

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, "0")}${ampm}`;
}

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(0)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price_pence: number;
  deposit_pence: number | null;
  applicable_sizes: string[] | null;
  sort_order: number | null;
}

interface AvailabilityRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Review {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  groomer_reply: string | null;
  profiles: { full_name: string | null; avatar_url: string | null; clerk_id?: string | null } | null;
}

interface TeamMember {
  id: string;
  name: string;
  role: string | null;
  since_year: number | null;
  average_rating: number | null;
  total_reviews: number | null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GroomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [groomerRes, servicesRes, availabilityRes, reviewsRes, teamRes, favourites, portfolioRes] =
    await Promise.all([
      supabaseAdmin
        .from("groomer_profiles")
        .select(
          `id, business_name, tagline, bio, years_experience, qualifications,
           insurance_provider, city, postcode, is_mobile, travel_radius_miles,
           is_verified, profile_image_url, banner_image_url, cover_photo_url,
           average_rating, total_reviews, deposit_type, deposit_percentage`
        )
        .eq("id", id)
        .eq("is_listed", true)
        .single(),

      supabaseAdmin
        .from("services")
        .select(
          "id, name, description, duration_minutes, price_pence, deposit_pence, applicable_sizes, sort_order"
        )
        .eq("groomer_profile_id", id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true, nullsFirst: false }),

      supabaseAdmin
        .from("availability")
        .select("day_of_week, start_time, end_time")
        .eq("groomer_profile_id", id)
        .eq("is_active", true)
        .order("day_of_week", { ascending: true }),

      supabaseAdmin
        .from("reviews")
        .select("id, rating, body, created_at, groomer_reply, profiles!reviews_owner_id_fkey(full_name, avatar_url, clerk_id)")
        .eq("groomer_profile_id", id)
        .eq("is_visible", true)
        .order("created_at", { ascending: false }),

      supabaseAdmin
        .from("team_members")
        .select("id, name, role, since_year, average_rating, total_reviews")
        .eq("groomer_profile_id", id)
        .eq("invite_status", "accepted"),

      getFavouriteGroomers(),

      supabaseAdmin
        .from("portfolio_photos")
        .select("url")
        .eq("groomer_profile_id", id)
        .order("sort_order", { ascending: true }),
    ]);

  if (groomerRes.error || !groomerRes.data) notFound();

  const groomer = groomerRes.data;
  const portfolioUrls = (portfolioRes.data ?? []).map((p) => p.url as string);
  const services = (servicesRes.data ?? []) as Service[];
  const availability = (availabilityRes.data ?? []) as AvailabilityRow[];
  const rawReviews = (reviewsRes.data ?? []) as any[];

  // avatar_url in DB may be null — fetch live from Clerk
  const reviewClerkIds = rawReviews.map((r) => r.profiles?.clerk_id).filter(Boolean) as string[];
  const reviewImageMap = new Map<string, string>();
  if (reviewClerkIds.length) {
    try {
      const clerk = await clerkClient();
      const { data: clerkUsers } = await clerk.users.getUserList({ userId: reviewClerkIds, limit: 100 });
      for (const u of clerkUsers) reviewImageMap.set(u.id, u.imageUrl);
    } catch { /* non-fatal */ }
  }

  const reviews: Review[] = rawReviews.map((r) => ({
    ...r,
    profiles: r.profiles
      ? { ...r.profiles, avatar_url: reviewImageMap.get(r.profiles.clerk_id) ?? r.profiles.avatar_url ?? null }
      : null,
  }));

  const team = (teamRes.data ?? []) as TeamMember[];
  const initialSaved = favourites.some((f) => f.groomer_profile_id === id);

  const depositPolicy = {
    type: (groomer.deposit_type ?? "none") as "none" | "percentage" | "full",
    percentage: groomer.deposit_percentage ?? null,
  };

  const bannerUrl = groomer.cover_photo_url || groomer.banner_image_url || null;
  const avatarUrl = groomer.profile_image_url || null;

  const hoursByDay = UK_DAY_ORDER.reduce<Record<number, AvailabilityRow>>(
    (acc, day) => {
      const row = availability.find((a) => a.day_of_week === day);
      if (row) acc[day] = row;
      return acc;
    },
    {}
  );

  function depositLabel(): string | null {
    if (depositPolicy.type === "full") return "Full pre-payment required";
    if (depositPolicy.type === "percentage" && depositPolicy.percentage != null)
      return `${depositPolicy.percentage}% deposit required to confirm your booking`;
    return null;
  }

  return (
    <div className="min-h-screen bg-alabaster-cream">

      {/* ── Hero banner — heart overlaid top-right ──────────────────────────── */}
      <div className="h-52 sm:h-64 md:h-80 bg-alabaster-cream relative">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt={`${groomer.business_name} banner`}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <Image
            src="/assets/default-cover-photo.svg"
            alt=""
            fill
            className="object-contain p-10 sm:p-16"
            sizes="100vw"
            priority
          />
        )}
        {/* Heart favourite — overlaid on banner */}
        <div className="absolute top-4 right-4">
          <ActionBar
            groomerId={groomer.id}
            groomerName={groomer.business_name}
            initialSaved={initialSaved}
            services={services}
            availability={availability}
            depositPolicy={depositPolicy}
            variant="heart"
          />
        </div>
      </div>

      {/* ── Avatar + Name + CTAs ─────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6">
        <div className="relative pt-2">

          {/* Avatar — straddles banner */}
          <div className="absolute -top-14 md:-top-16 left-0 shrink-0">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-[20px] border-4 border-alabaster-cream overflow-hidden shadow-subtle bg-alabaster-cream flex items-center justify-center">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={groomer.business_name}
                  width={144}
                  height={144}
                  className="object-cover w-full h-full"
                />
              ) : (
                <Image
                  src="/assets/default-profile-photo.svg"
                  alt=""
                  width={144}
                  height={144}
                  className="object-contain p-3 w-full h-full"
                />
              )}
            </div>
          </div>

          {/* Name / tagline / meta — offset past avatar */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-28 md:w-36 shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <h1 className="font-fredoka text-2xl sm:text-3xl md:text-4xl text-deep-slate leading-tight">
                {groomer.business_name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {groomer.is_verified && (
                  <span className="bg-groomr-gold text-deep-slate text-xs font-bold px-3 py-1 rounded-full shrink-0">
                    Verified
                  </span>
                )}
                <span className="text-xs font-bold text-pebble-grey bg-pebble-grey/10 px-3 py-1 rounded-full shrink-0">
                  {groomer.is_mobile ? "Mobile" : "Salon"}
                </span>
              </div>
              {groomer.tagline && (
                <p className="text-sm sm:text-base text-sage-leaf font-bold">{groomer.tagline}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-pebble-grey">
                {(groomer.average_rating ?? 0) > 0 && (
                  <StarRow
                    rating={groomer.average_rating!}
                    count={groomer.total_reviews ?? undefined}
                  />
                )}
                <span className="flex items-center gap-1 font-bold">
                  <LocationPinIcon size={14} />
                  {groomer.city ?? groomer.postcode ?? "Location not set"}
                </span>
                {groomer.is_mobile && groomer.travel_radius_miles && (
                  <span className="font-bold">
                    Travels up to {groomer.travel_radius_miles} miles
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact + Book Now — below name, aligned with avatar left edge */}
          <div className="flex items-start gap-4 sm:gap-5 mt-4">
            <div className="w-28 md:w-36 shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <ActionBar
                groomerId={groomer.id}
                groomerName={groomer.business_name}
                initialSaved={initialSaved}
                services={services}
                availability={availability}
                depositPolicy={depositPolicy}
                variant="buttons"
              />
            </div>
          </div>

        </div>
      </div>

      <div className="border-t border-pebble-grey/20" />

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-12">

            {/* Gallery */}
            {portfolioUrls.length > 0 && (
              <section>
                <h2 className="font-fredoka text-2xl text-deep-slate border-b border-pebble-grey/20 pb-4 mb-6">
                  Gallery
                </h2>
                <GalleryGrid
                  images={portfolioUrls}
                  groomerName={groomer.business_name}
                />
              </section>
            )}

            {/* About */}
            {(groomer.bio || groomer.years_experience || groomer.qualifications || groomer.insurance_provider) && (
              <section className="space-y-4">
                <h2 className="font-fredoka text-2xl text-deep-slate border-b border-pebble-grey/20 pb-4">
                  About
                </h2>
                {groomer.bio && (
                  <p className="text-deep-slate/80 font-nunito leading-relaxed">
                    {groomer.bio}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {groomer.years_experience && (
                    <span className="text-sm font-bold bg-sage-leaf/10 text-sage-leaf px-3 py-1.5 rounded-full border border-sage-leaf/20">
                      {groomer.years_experience}+ years experience
                    </span>
                  )}
                  {groomer.qualifications && (
                    <span className="text-sm font-bold bg-sage-leaf/10 text-sage-leaf px-3 py-1.5 rounded-full border border-sage-leaf/20">
                      {groomer.qualifications}
                    </span>
                  )}
                  {groomer.insurance_provider && (
                    <span className="text-sm font-bold bg-pebble-grey/10 text-pebble-grey px-3 py-1.5 rounded-full border border-pebble-grey/20">
                      Insured · {groomer.insurance_provider}
                    </span>
                  )}
                </div>
              </section>
            )}

            {/* Services */}
            <section>
              <h2 className="font-fredoka text-2xl text-deep-slate border-b border-pebble-grey/20 pb-4 mb-6">
                Services
              </h2>
              {services.length === 0 ? (
                <p className="text-pebble-grey text-sm font-nunito">No services listed yet.</p>
              ) : (
                <div className="space-y-4">
                  {services.map((svc) => (
                    <ServiceCard key={svc.id} service={svc} depositPolicy={depositPolicy} />
                  ))}
                </div>
              )}
            </section>

            {/* Team */}
            {team.length > 0 && (
              <section>
                <h2 className="font-fredoka text-2xl text-deep-slate border-b border-pebble-grey/20 pb-4 mb-6">
                  Our Team
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {team.map((member) => (
                    <TeamMemberCard key={member.id} member={member} />
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section>
              <h2 className="font-fredoka text-2xl text-deep-slate border-b border-pebble-grey/20 pb-4 mb-6">
                Reviews
                {reviews.length > 0 && (
                  <span className="ml-2 font-nunito text-base font-bold text-pebble-grey">
                    ({reviews.length})
                  </span>
                )}
              </h2>
              <ReviewsSection reviews={reviews} />
            </section>
          </div>

          {/* Sidebar */}
          <div className="mt-12 lg:mt-0 space-y-6 lg:sticky lg:top-8 lg:self-start">

            {/* Opening Hours */}
            <div className="bg-white rounded-[20px] border border-pebble-grey/10 shadow-subtle p-6 space-y-4">
              <h3 className="font-fredoka text-xl text-deep-slate">Opening Hours</h3>
              {availability.length === 0 ? (
                <p className="text-pebble-grey text-sm font-nunito">Hours not listed yet.</p>
              ) : (
                <ul className="space-y-2">
                  {UK_DAY_ORDER.map((day) => {
                    const hours = hoursByDay[day];
                    return (
                      <li key={day} className="flex justify-between text-sm">
                        <span className="font-bold text-deep-slate">{DAY_NAMES[day]}</span>
                        {hours ? (
                          <span className="text-pebble-grey">
                            {formatTime(hours.start_time)} – {formatTime(hours.end_time)}
                          </span>
                        ) : (
                          <span className="text-pebble-grey/40">Closed</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Location */}
            <div className="bg-white rounded-[20px] border border-pebble-grey/10 shadow-subtle p-6 space-y-3">
              <h3 className="font-fredoka text-xl text-deep-slate">Location</h3>
              <div className="space-y-1 text-sm font-nunito">
                {groomer.is_mobile ? (
                  <>
                    <p className="font-bold text-deep-slate">Mobile Groomer</p>
                    <p className="text-pebble-grey">
                      Based in {groomer.city ?? groomer.postcode}
                      {groomer.travel_radius_miles
                        ? ` · travels up to ${groomer.travel_radius_miles} miles`
                        : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-deep-slate">Salon</p>
                    <p className="text-pebble-grey">
                      {[groomer.city, groomer.postcode].filter(Boolean).join(", ")}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Deposit Policy */}
            {depositPolicy.type !== "none" && depositLabel() && (
              <div className="bg-white rounded-[20px] border border-pebble-grey/10 shadow-subtle p-6 space-y-2">
                <h3 className="font-fredoka text-xl text-deep-slate">Deposit Policy</h3>
                <p className="text-sm text-deep-slate/80 font-nunito">{depositLabel()}</p>
              </div>
            )}

            {/* Report */}
            <div className="text-center pt-2 pb-4">
              <ReportButton groomerName={groomer.business_name} groomerId={groomer.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ServiceCard ──────────────────────────────────────────────────────────────

function ServiceCard({
  service,
  depositPolicy,
}: {
  service: Service;
  depositPolicy: { type: "none" | "percentage" | "full"; percentage: number | null };
}) {
  let depositDisplay: string | null = null;
  if (depositPolicy.type === "percentage" && depositPolicy.percentage != null) {
    const depositPence = Math.round((service.price_pence * depositPolicy.percentage) / 100);
    const depositDisplay2 = Number.isInteger(depositPence / 100) ? `£${depositPence / 100}` : `£${(depositPence / 100).toFixed(2)}`;
    depositDisplay = `${depositPolicy.percentage}% deposit (${depositDisplay2})`;
  } else if (depositPolicy.type === "full") {
    depositDisplay = "Full pre-payment required";
  }

  return (
    <div className="bg-white rounded-xl border border-pebble-grey/10 p-5 flex justify-between items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-fredoka text-lg text-deep-slate">{service.name}</p>
          {service.duration_minutes && (
            <span className="text-xs font-bold text-pebble-grey bg-pebble-grey/10 px-2 py-0.5 rounded-full shrink-0">
              {service.duration_minutes} min
            </span>
          )}
        </div>
        {service.description && (
          <p className="text-xs text-pebble-grey mt-1 leading-relaxed font-nunito">
            {service.description}
          </p>
        )}
        {service.applicable_sizes && service.applicable_sizes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {service.applicable_sizes.map((size) => (
              <span
                key={size}
                className="text-xs font-bold bg-sage-leaf/10 text-sage-leaf px-2.5 py-0.5 rounded-full border border-sage-leaf/20"
              >
                {SIZE_LABELS[size] ?? size}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <span className="font-fredoka text-2xl text-deep-slate">
          {formatPrice(service.price_pence)}
        </span>
        {depositDisplay && (
          <p className="text-xs text-pebble-grey mt-0.5">{depositDisplay}</p>
        )}
      </div>
    </div>
  );
}

// ─── TeamMemberCard ───────────────────────────────────────────────────────────

function TeamMemberCard({ member }: { member: TeamMember }) {
  const initials = member.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-pebble-grey/10 p-5 flex items-start gap-4">
      <div className="w-12 h-12 rounded-full bg-sage-leaf/20 flex items-center justify-center shrink-0">
        <span className="font-fredoka text-lg text-sage-leaf select-none">{initials}</span>
      </div>
      <div className="min-w-0">
        <p className="font-fredoka text-lg text-deep-slate leading-tight">{member.name}</p>
        {member.role && (
          <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mt-0.5">
            {member.role}
          </p>
        )}
        {member.since_year && (
          <p className="text-xs text-pebble-grey mt-0.5 font-nunito">Since {member.since_year}</p>
        )}
        {(member.average_rating ?? 0) > 0 && (
          <div className="mt-1.5">
            <StarRow
              rating={member.average_rating!}
              count={member.total_reviews ?? undefined}
              size={12}
            />
          </div>
        )}
      </div>
    </div>
  );
}
