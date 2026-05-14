# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build + TypeScript check
npm run lint     # ESLint
```

No test suite exists yet. TypeScript errors surface via `npm run build` — always run it before committing.

## Architecture

### Stack

- **Next.js 16** (App Router, React 19) — see AGENTS.md warning about breaking API changes
- **Clerk** — authentication, sign-in/sign-up UI, user sessions
- **Supabase** (postgres) — all persistent data; accessed exclusively with the **service-role admin client** (`lib/supabase.ts → supabaseAdmin`). The anon client exists but is unused in current flows.
- **Cloudinary** — dog profile photo uploads; upload is client-side (signed by a server action) and stored as a URL in Supabase
- **Tailwind v4** — config is in `app/globals.css` via `@theme inline`, not `tailwind.config.js`

### Auth & Role Routing

1. User signs up via Clerk → Clerk fires a webhook (`/api/webhooks/clerk`) → creates a row in `profiles` with `roles = {owner}` by default
2. `/dashboard` (server component) reads `profiles.roles` from Supabase and redirects:
   - `groomer` role → `/dashboard/groomer`
   - otherwise → `/dashboard/owner`
3. Server actions and server components use `currentUser()` / `auth()` from `@clerk/nextjs/server` to get the Clerk user, then look up the corresponding Supabase `profiles.id` to scope all queries
4. If the webhook missed (race condition), `app/actions/dogs.ts → getOrCreateProfileId()` creates the profile row as a fallback

### Data Model (Supabase)

- **profiles** — one row per user; `clerk_id` links to Clerk, `roles` is a postgres array (`{owner}`, `{groomer}`, or both)
- **groomer_profiles** — extended groomer data (`business_name`, `is_listed`, `is_verified`, etc.); joined to `profiles` via `user_id`
- **dogs** — owned by a profile via `owner_id`

### Server Actions

All mutations live in `app/actions/` as `"use server"` files. They take `FormData` (for file-upload compatibility) and return `{ data } | { error: string }` — never throw. Client components call them directly from event handlers or `useTransition`.

### Design System

The entire design system lives in `app/globals.css`:
- CSS custom properties define the brand palette and spacing scale
- `@theme inline` maps them to Tailwind colour/font utilities (`bg-groomr-gold`, `text-deep-slate`, `font-fredoka`, `font-nunito`, etc.)
- Global utility classes: `.btn-primary`, `.btn-secondary`, `.btn-gold-on-dark`, `.field`, `.focus-ring`, `.card-lift`, `.modal-backdrop`, `.shadow-modal`, `.text-link`, `.page-fade`, `.toast-in`

**Brand palette:** `groomr-gold` (#eae45c), `deep-slate` (#2c3e50), `sage-leaf` (#88a096), `pebble-grey` (#95a5a6), `alabaster-cream` (#f9f8f4), `muted-terracotta` (#c87964)

**Typography:** `font-fredoka` for display/headings, `font-nunito` for body copy — both loaded from `/public/fonts/` as variable fonts.

### Icon System

All icons are in `components/ui/GroomrIcons.tsx`. Do not import from `lucide-react` for anything that has a Groomr equivalent.

- **Brand icons** (15): splash circle + stroke glyph. Gold splash = `CalendarIcon`, `PetsIcon`, `DashboardIcon`, `GalleryIcon`, `NotificationsIcon`, `AnalyticsIcon`, `FinancialsIcon`, `SettingsIcon`, `AccountIcon`, `ShieldIcon`. Terracotta splash = `ScissorsIcon`, `PinIcon`, `MessagesIcon`, `FavoritesIcon`, `ReviewsIcon`.
- **Utility icons** (15): plain stroke, `currentColor` — `SearchIcon`, `CloseIcon`, `ChevronDownIcon`, `ChevronRightIcon`, `ChevronLeftIcon`, `ClockIcon`, `PlusIcon`, `MenuIcon`, `CheckIcon`, `HeartIcon` (accepts `filled?: boolean`), `MessageIcon`, `UploadIcon`, `PencilIcon`, `TrashIcon`, `StarIcon`
- All accept `size?: number` (default 24) and `className?: string`

### Shared UI Components

Located in `components/ui/`:
- `Modal` — Escape to close, body scroll lock, backdrop click to dismiss
- `Toast` — auto-dismisses after 3.5 s
- `SearchPill` — controlled or uncontrolled; `size="sm"|"lg"`
- `StarRow` — renders 5 stars with fractional opacity for unlit stars
- `GroomerCard` — card with save/favourite toggle
- `Eyebrow`, `Badge`, `Button`, `Chip`

### App Routes

| Route | Type | Purpose |
|---|---|---|
| `/` | static | Landing page |
| `/become-a-groomer` | static | Groomer marketing page |
| `/register/groomer` | dynamic | Multi-step groomer registration wizard |
| `/dashboard` | dynamic | Role-based redirect hub |
| `/dashboard/owner` | dynamic | Dog owner dashboard (dogs CRUD, coming-soon tiles) |
| `/dashboard/groomer` | dynamic | Full groomer back-office (5-tab system) |
| `/dashboard/groomer/messages` | static* | Split-pane messages UI (mock data) |
| `/api/webhooks/clerk` | API route | Clerk → Supabase user sync |

*Currently rendered client-side with mock data; no real DB backing yet.

### Groomer Dashboard Architecture

`/dashboard/groomer/page.tsx` is a server component that fetches `business_name` from Supabase and passes it as props to `GroomerDashboardClient` (client component). All five tab components (`BookingsView`, `ClientsView`, `EarningsView`, `ReviewsView`, `ProfileEditor`) are client components with **mock data only** — the booking/transaction tables don't exist in Supabase yet.

### What's Real vs Mock

| Feature | Status |
|---|---|
| Dog CRUD (owner dashboard) | Real — Supabase + Cloudinary |
| Groomer registration wizard | Real — writes to `groomer_profiles` |
| Groomer dashboard tabs | Mock data only |
| Messages page | Mock data only |
| Bookings / payments | Not yet built |
