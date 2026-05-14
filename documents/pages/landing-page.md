# Landing Page — `/`

**File:** `app/page.tsx`
**Type:** Server Component (static)
**Auth required:** No

## Purpose

Public-facing marketing page. Entry point for dog owners. Converts visitors to searchers or sign-ups.

## Sections

### 1. Hero
- 2-column layout (desktop): copy left, image collage right
- Fredoka H1 with groomr-gold underline highlight on "minutes."
- `SearchPillWrapper` (client component from `app/_components/SearchPillWrapper.tsx`) — search input that navigates to `/search?q=...`
- Popular tag pills: Glasgow, Edinburgh, Southside, Mobile only — each links to `/search?q={tag}`
- Trust badges: `ShieldIcon` (Verified groomers) + `CalendarIcon` (Real-time booking)
- Desktop right col: two rotated `next/image` photos (Unsplash URLs) + floating "Marlow's next groom" confirmation card (static JSX, no data)

### 2. How It Works
- 3 cards: Search → Book → Rebook
- Icons: `SearchIcon`, `CalendarIcon`, `FavoritesIcon` from `GroomrIcons`
- Data lives in `HOW_IT_WORKS` const array at the top of the file

### 3. Groomer Strip
- `bg-alabaster-cream` background
- Left: copy + stats (2,400+, 38hrs, £0) + "Become a Groomr" `<Link>` to `/become-a-groomer`
- Right: static mock booking widget (hardcoded JSX, 3 booking rows, uses `Badge` component)

### 4. Testimonials
- 3 cards with gold Fredoka quote marks
- Data in `TESTIMONIALS` const array
- Gold `"` character is absolutely positioned `-top-4 left-7`

## Key Components Used

| Component | Import | Notes |
|---|---|---|
| `SearchPillWrapper` | `app/_components/SearchPillWrapper.tsx` | Client wrapper around `SearchPill` — handles navigation |
| `Eyebrow` | `components/ui/Eyebrow.tsx` | Sage leaf uppercase label |
| `Badge` | `components/ui/Badge.tsx` | Used on mock widget: `tone="gold"` and `tone="terra"` |
| `SearchIcon`, `CalendarIcon`, `FavoritesIcon`, `ShieldIcon` | `components/ui/GroomrIcons.tsx` | — |

## Data

All content is hardcoded in two const arrays at the top of `page.tsx`:
- `HOW_IT_WORKS` — 3 items with `{ Icon, title, body, tagline? }`
- `TESTIMONIALS` — 3 items with `{ name, dog, text }`

No Supabase queries. No Clerk auth. Fully static.

## Images

Two Unsplash photos (remote URLs allowed via `next.config.ts` `remotePatterns`):
- `photo-1583512603805-3cc6b41f3edb` — dog being groomed
- `photo-1611173622933-91942d394b04` — happy groomed dog

Both use `next/image` with `fill` layout inside fixed-height containers.

## Editing Notes

- To add a section: follow the existing pattern — `<section>` with `page-fade` on the outer wrapper
- Popular search tags (Glasgow, Edinburgh etc.) are mapped inline — add/remove from the array literal on line 71
- The floating booking card is static JSX — update names/times directly in the JSX
- The mock booking widget in the Groomer Strip is identical to the one on `/become-a-groomer` — both are static
