import { fetchGroomers, extractFilters, geocodeQuery, UK_CENTRE } from "@/lib/search";
import { getFavouriteGroomers } from "@/app/actions/favourites";
import type { SearchParams, MapCentre } from "@/types/search";
import { SearchPageClient } from "./_components/SearchPageClient";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [groomers, favourites] = await Promise.all([
    fetchGroomers(params),
    getFavouriteGroomers(),
  ]);
  const initialFavouriteIds = favourites.map((f) => f.groomer_profile_id);

  const isGeoSearch = Boolean(params.lat && params.lng);

  let mapCentre: MapCentre = UK_CENTRE;
  if (isGeoSearch && params.lat && params.lng) {
    mapCentre = { lat: parseFloat(params.lat), lng: parseFloat(params.lng) };
  } else if (params.q?.trim()) {
    const geocoded = await geocodeQuery(params.q.trim());
    if (geocoded) {
      mapCentre = geocoded;
    } else {
      // Fallback: derive centre from the groomer coordinates themselves
      const withCoords = groomers.filter((g) => g.lat !== undefined && g.lng !== undefined);
      if (withCoords.length > 0) {
        const avgLat = withCoords.reduce((s, g) => s + g.lat!, 0) / withCoords.length;
        const avgLng = withCoords.reduce((s, g) => s + g.lng!, 0) / withCoords.length;
        mapCentre = { lat: avgLat, lng: avgLng };
      }
    }
  }

  return (
    <div className="min-h-screen bg-alabaster-cream">
      <SearchPageClient
        initialGroomers={groomers}
        initialQuery={params.q ?? ""}
        isGeoSearch={isGeoSearch}
        initialFilters={extractFilters(params)}
        mapCentre={mapCentre}
        initialFavouriteIds={initialFavouriteIds}
      />
    </div>
  );
}
