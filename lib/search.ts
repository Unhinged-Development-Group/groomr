import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import type { GroomerResult, SearchParams, ActiveFilters, MapCentre } from "@/types/search";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=400";

interface RawProfile {
  id: string;
  business_name: string;
  tagline: string | null;
  bio: string | null;
  city: string | null;
  postcode: string | null;
  is_mobile: boolean;
  average_rating: number | null;
  total_reviews: number | null;
  is_listed: boolean;
  is_verified: boolean;
  distance_metres?: number | null;
  lat?: number | null;
  lng?: number | null;
  deposit_type?: string | null;
  deposit_percentage?: number | null;
}

interface RawService {
  groomer_profile_id: string;
  name: string;
  price_pence: number;
  deposit_pence: number | null;
}

function buildGroomerMap(
  profiles: RawProfile[],
  services: RawService[]
): GroomerResult[] {
  const servicesByGroomer = new Map<
    string,
    { names: string[]; minPricePence: number | null; requiresDeposit: boolean }
  >();

  for (const s of services) {
    const existing = servicesByGroomer.get(s.groomer_profile_id);
    if (existing) {
      existing.names.push(s.name);
      if (
        existing.minPricePence === null ||
        s.price_pence < existing.minPricePence
      ) {
        existing.minPricePence = s.price_pence;
      }
      if (s.deposit_pence && s.deposit_pence > 0) {
        existing.requiresDeposit = true;
      }
    } else {
      servicesByGroomer.set(s.groomer_profile_id, {
        names: [s.name],
        minPricePence: s.price_pence,
        requiresDeposit: !!(s.deposit_pence && s.deposit_pence > 0),
      });
    }
  }

  return profiles.map((p) => {
    const svc = servicesByGroomer.get(p.id);
    const distMiles =
      p.distance_metres != null
        ? Math.round((p.distance_metres / 1609.34) * 10) / 10
        : undefined;

    return {
      id: p.id,
      name: p.business_name,
      tagline: p.tagline ?? undefined,
      bio: p.bio ?? undefined,
      image: PLACEHOLDER_IMAGE,
      rating: p.average_rating ?? 0,
      reviewCount: p.total_reviews ?? 0,
      distance: distMiles,
      location: p.city ?? p.postcode ?? "UK",
      priceFrom: svc?.minPricePence != null ? svc.minPricePence / 100 : undefined,
      requiresDeposit: p.deposit_type ? p.deposit_type !== 'none' : (svc?.requiresDeposit ?? false),
      depositType: (p.deposit_type as 'none' | 'percentage' | 'full') ?? 'none',
      depositPercentage: p.deposit_percentage ?? null,
      serviceNames: svc?.names ?? [],
      isVerified: p.is_verified ?? false,
      lat: p.lat ?? undefined,
      lng: p.lng ?? undefined,
    };
  });
}

async function fetchServicesForIds(ids: string[]): Promise<RawService[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("services")
    .select("groomer_profile_id, name, price_pence, deposit_pence")
    .in("groomer_profile_id", ids)
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching services:", error.message);
    return [];
  }
  return (data ?? []) as RawService[];
}

/** Returns the subset of profile IDs that have is_accepting_bookings = true */
async function filterAcceptingBookings(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const { data, error } = await supabase
    .from("groomer_profiles")
    .select("id")
    .in("id", ids)
    .eq("is_accepting_bookings", true);
  if (error) {
    console.error("Error filtering bookings:", error.message);
    // On error, return all IDs so we don't accidentally hide groomers
    return new Set(ids);
  }
  return new Set((data ?? []).map((r) => r.id as string));
}

async function fetchTextSearch(q: string): Promise<GroomerResult[]> {
  const { data, error } = await supabase.rpc("search_groomers_by_text", {
    query: q,
  });

  if (error) {
    console.error("Text search error:", error.message);
    return [];
  }

  const profiles = (data ?? []) as RawProfile[];
  const ids = profiles.map((p) => p.id);
  const [services, acceptingIds] = await Promise.all([
    fetchServicesForIds(ids),
    filterAcceptingBookings(ids),
  ]);
  const acceptingProfiles = profiles.filter((p) => acceptingIds.has(p.id));
  return buildGroomerMap(acceptingProfiles, services);
}

async function fetchGeoSearch(
  lat: number,
  lng: number
): Promise<GroomerResult[]> {
  const { data, error } = await supabase.rpc("search_groomers_near", {
    user_lat: lat,
    user_lng: lng,
    radius_metres: 80000,
  });

  if (error) {
    console.error("Geo search error:", error.message);
    return [];
  }

  const profiles = (data ?? []) as RawProfile[];
  const ids = profiles.map((p) => p.id);
  const [services, acceptingIds] = await Promise.all([
    fetchServicesForIds(ids),
    filterAcceptingBookings(ids),
  ]);
  const acceptingProfiles = profiles.filter((p) => acceptingIds.has(p.id));
  return buildGroomerMap(acceptingProfiles, services);
}

export async function fetchGroomers(
  params: SearchParams
): Promise<GroomerResult[]> {
  if (params.lat && params.lng) {
    return fetchGeoSearch(parseFloat(params.lat), parseFloat(params.lng));
  }
  if (params.q?.trim()) {
    return fetchTextSearch(params.q.trim());
  }
  return [];
}

export async function geocodeQuery(
  q: string
): Promise<MapCentre | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q + ", UK")}&key=${apiKey}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.status === "OK" && json.results?.[0]) {
      const loc = json.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch (e) {
    console.error("Geocoding error:", e);
  }
  return null;
}

export function extractFilters(params: SearchParams): ActiveFilters {
  return {
    service: params.service ?? "all",
    price: params.price ?? "all",
    payment: params.payment ?? "all",
    rating: params.rating ?? "all",
    verified: params.verified ?? "all",
  };
}

export const UK_CENTRE: MapCentre = { lat: 54.5, lng: -2.5 };
