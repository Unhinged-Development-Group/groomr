# Search Page — `/search`

**File:** `app/search/page.tsx`
**Type:** Async Server Component
**Auth required:** No (favourites require auth; falls back gracefully)

## Purpose

Groomer search results. Supports text search (postcode, town, name) and geolocation ("Near Me"). Displays results as card grid or Google Maps view.

## How It Works

The server component (`page.tsx`) handles all async data fetching, then passes results to the client shell.

### Server Component Flow

1. Reads `searchParams` (`q`, `lat`, `lng`, filter params) from URL
2. Runs two parallel fetches:
   - `fetchGroomers(params)` — Supabase text or PostGIS geo search (`lib/search.ts`)
   - `getFavouriteGroomers()` — returns `groomer_profile_id[]` for the logged-in user (empty if unauthenticated)
3. Determines `mapCentre`:
   - If `lat`+`lng` in params → use those directly (geo search)
   - If `q` text → call `geocodeQuery(q)` (server-side Google Maps Geocoding API)
   - If geocode fails → average the coordinates of returned groomers
   - Fallback → `UK_CENTRE` (centre of UK)
4. Renders `<SearchPageClient>` with all data as props (no client-side fetching on mount)

### Client Component Tree

```
SearchPageClient (holds filter state, selectedGroomer state)
├── SearchBar        — text input + "Near Me" geolocation button + result count badge
├── FilterBar        — 4 filter dropdowns (service type, price range, payment method, min rating)
├── ResultsSection   — list/map toggle, applies client-side filter logic, renders GroomerCard grid or MapView
│   ├── GroomerCard  — per-result card with save/favourite toggle
│   └── MapView      — @vis.gl/react-google-maps, dynamically imported (ssr:false)
└── GroomerProfileModal — modal opened when user clicks "View Profile" on a card
```

## URL Parameters

| Param | Type | Description |
|---|---|---|
| `q` | string | Text search query |
| `lat` | string (float) | Latitude for geo search |
| `lng` | string (float) | Longitude for geo search |
| `service` | string | Filter: service type |
| `maxPrice` | string (number) | Filter: max price in £ |
| `payment` | string | Filter: payment method |
| `minRating` | string (number) | Filter: minimum star rating |

Types defined in `types/search.ts` → `SearchParams`, `ActiveFilters`, `MapCentre`, `GroomerResult`.

## Search Logic (`lib/search.ts`)

- **Text search:** ILIKE on `business_name`, `city`, `postcode` in `groomer_profiles`
- **Geo search:** `search_groomers_near` — a Supabase Postgres RPC function using PostGIS `ST_DWithin`. Called via `.rpc()` because the JS client can't call `ST_X`/`ST_Y` via `.select()`.
- `extractFilters(params)` — extracts filter params into `ActiveFilters` shape
- `geocodeQuery(q)` — server-side call to Google Maps Geocoding API using `GOOGLE_MAPS_API_KEY` (not the public key)
- `UK_CENTRE` — exported constant `{ lat: 54.5, lng: -3.5 }`

## Filtering

All filtering is **client-side** — no re-fetch when filters change. `ResultsSection` receives the full groomer list and `activeFilters`, applies them locally, and reports `filteredCount` back up to `SearchPageClient` via `onFilteredCountChange`.

## Map

- `MapView` uses `@vis.gl/react-google-maps`
- Dynamically imported with `{ ssr: false }` in `ResultsSection` (Google Maps needs `window`)
- Gold pin markers, info window on click, "View Profile" opens the modal
- Uses `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client-side env var)

## Favourites

- `getFavouriteGroomers()` is in `app/actions/favourites.ts`
- Returns array of `{ groomer_profile_id }` for the current user
- IDs extracted to `initialFavouriteIds` (string array) → passed to `SearchPageClient`
- `GroomerCard` uses this to show the filled heart icon
- Toggle is handled inside `GroomerCard` via a server action call

## Groomer Profile Modal

- Opens when user clicks "View Profile" on a card or map marker
- `GroomerProfileModal` fetches services, availability, and reviews from Supabase on open
- "Book Now" button is currently a stub (booking flow not yet built)

## Editing Notes

- To add a filter: add to `SearchParams` type, `extractFilters()`, `FilterBar` UI, and `ResultsSection` filter logic
- To change search behaviour: edit `fetchGroomers()` and `search_groomers_near` RPC in Supabase
- Loading state: `app/search/loading.tsx` auto-rendered by Next.js during server fetch
- The geo search ("Near Me") is triggered from `SearchBar` — it calls `navigator.geolocation`, then pushes `/search?lat=...&lng=...` to the router
