import { fetchGroomers, extractFilters, geocodeQuery, UK_CENTRE } from "@/lib/search";
import type { SearchParams, MapCentre } from "@/types/search";
import { SearchPageClient } from "./_components/SearchPageClient";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const groomers = await fetchGroomers(params);

  const isGeoSearch = Boolean(params.lat && params.lng);

  let mapCentre: MapCentre = UK_CENTRE;
  if (isGeoSearch && params.lat && params.lng) {
    mapCentre = { lat: parseFloat(params.lat), lng: parseFloat(params.lng) };
  } else if (params.q?.trim()) {
    const geocoded = await geocodeQuery(params.q.trim());
    if (geocoded) mapCentre = geocoded;
  }

  return (
    <div className="min-h-screen bg-alabaster-cream">
      <SearchPageClient
        initialGroomers={groomers}
        initialQuery={params.q ?? ""}
        isGeoSearch={isGeoSearch}
        initialFilters={extractFilters(params)}
        mapCentre={mapCentre}
      />
    </div>
  );
}
