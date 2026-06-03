# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

**Groomr** is a two-sided UK marketplace connecting dog owners with independent groomers. UK-first, Glasgow/Edinburgh launch. Pre-revenue, in active development. Business model: 8% commission on bookings.

---

## Commands

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build + TypeScript check
npm run lint     # ESLint
```

No test suite. TypeScript errors surface via `npm run build` — always run it before committing.

---

## Stack

| Tool | Version | Notes |
|---|---|---|
| **Next.js** | 16.2.4 | App Router, React 19. Uses `proxy.ts` not `middleware.ts` |
| **TypeScript** | latest | `npm run build` is the type check |
| **Tailwind CSS** | v4 | `@import "tailwindcss"` in `globals.css` — no `tailwind.config.ts` |
| **Supabase** | — | Postgres. Admin client: `lib/supabase-admin.ts → supabaseAdmin`. Anon client exists for Realtime only |
| **Clerk** | v7.2.7 | Auth only — not using Supabase Auth |
| **Cloudinary** | — | Dog/groomer photos. CDN: `res.cloudinary.com/dr8adq7nl` |
| **Google Maps** | — | `@vis.gl/react-google-maps` (client, `ssr:false`) + server-side geocoding |
| **Stripe Connect** | — | Destination charges. `lib/stripe.ts`, `app/actions/stripe-connect.ts`, `app/actions/payments.ts`, webhook `/api/webhooks/stripe`. See `documents/stripe-setup.md` |
| **Resend** | — | Transactional emails from `notifications@groomr.uk`. Cron at `/api/cron/notifications` (hourly via `vercel.json`) |

### Clerk API Usage (Next.js 16)
- `currentUser()` — Server Components (network call to Clerk)
- `auth()` — Server Actions (reads JWT, no network call — **prefer this in actions**)
- `SignInButton` / `SignUpButton` — take **exactly one child element**

---

## Auth & Role Architecture

1. Clerk handles all auth (email + Google OAuth)
2. On `user.created`: webhook (`/api/webhooks/clerk`) creates `profiles` row with `roles = {owner}`
3. Team member sign-up: webhook checks `public_metadata.groomr_team_invite === true`, links `team_members` row and grants `groomer` role
4. `/dashboard` reads `profiles.roles` from Supabase and redirects:
   - `groomer` role → `/dashboard/groomer`
   - otherwise → `/dashboard/owner`
5. All server actions/components get Clerk user via `currentUser()` / `auth()`, then look up `profiles.id` by `clerk_id` to scope queries
6. Webhook race condition fallback: `getOrCreateProfile()` in `app/dashboard/owner/page.tsx`
7. Admin: `andrew@groomr.uk` has `is_admin = true` in `profiles` — set manually in Supabase

---

## Database

**Supabase Project ID:** `fvbxjwfxcbhjoidrmzgv`

### Custom Types
```sql
CREATE TYPE user_role          AS ENUM ('owner', 'groomer', 'admin');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE dog_size           AS ENUM ('small', 'medium', 'large', 'giant');
CREATE TYPE coat_type          AS ENUM ('short', 'medium', 'long', 'curly', 'double', 'wire');
CREATE TYPE payout_status      AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE refund_status      AS ENUM ('none', 'requested', 'approved', 'rejected', 'processed');
```

### Tables

#### `profiles`
```sql
id uuid PK | clerk_id text UNIQUE NOT NULL | full_name text | email text | phone text
avatar_url text | roles user_role[] DEFAULT '{owner}' | is_admin boolean DEFAULT false
is_active boolean DEFAULT true
```
> No FK to `auth.users` — intentional. Clerk is the auth source of truth.

#### `groomer_profiles`
```sql
id uuid PK | user_id uuid → profiles(id)
business_name text | tagline text | bio text | years_experience smallint
qualifications text | insurance_provider text | insurance_policy_ref text | insurance_doc_url text
address_line_1 text | address_line_2 text | city text | postcode text
location geography           -- PostGIS point (lng/lat). Insert: ST_MakePoint(lng, lat)::geography
travel_radius_miles smallint | is_mobile boolean
is_verified boolean DEFAULT false
is_listed boolean DEFAULT false         -- groomer must explicitly open
is_accepting_bookings boolean DEFAULT false  -- controls search visibility + bookability
stripe_account_id text
average_rating numeric | total_reviews integer
profile_image_url text | banner_image_url text | cover_photo_url text
deposit_type text DEFAULT 'none'        -- 'none' | 'percentage' | 'full'
deposit_percentage smallint | default_buffer_minutes smallint DEFAULT 0
bank_account_holder text | bank_sort_code text | bank_account_number text
```

#### `dogs`
```sql
id uuid PK | owner_id uuid → profiles(id)
name text NOT NULL | breed text | date_of_birth date | size dog_size | is_neutered boolean
coat_type coat_type | coat_notes text | temperament_notes text | health_notes text
vaccination_doc_url text | profile_image_url text
```

#### `services`
```sql
id uuid PK | groomer_profile_id uuid → groomer_profiles(id)
name text NOT NULL | description text | duration_minutes smallint
price_pence integer NOT NULL    -- always divide by 100 for display
deposit_pence integer | applicable_sizes dog_size[] | is_active boolean DEFAULT true | sort_order smallint
```

#### `availability`
```sql
id uuid PK | groomer_profile_id uuid → groomer_profiles(id)
day_of_week smallint NOT NULL   -- 0=Sunday … 6=Saturday
start_time time NOT NULL | end_time time NOT NULL
break_start_time time | break_end_time time   -- per-day break window
is_active boolean DEFAULT true
```

#### `availability_overrides`
```sql
id uuid PK | groomer_profile_id uuid → groomer_profiles(id)
override_date date NOT NULL | is_available boolean DEFAULT false
start_time time | end_time time | reason text
```

#### `appointments`
```sql
id uuid PK | owner_id uuid → profiles(id) | groomer_profile_id uuid → groomer_profiles(id)
dog_id uuid → dogs(id) | service_id uuid → services(id)
service_snapshot_name text | service_snapshot_duration smallint | service_snapshot_price integer
scheduled_at timestamptz NOT NULL | status appointment_status DEFAULT 'pending'
cancelled_by uuid → profiles(id) | cancellation_reason text
groomer_notes text | owner_notes text
assigned_to_team_member_id uuid → team_members(id) ON DELETE SET NULL
```

#### `payments`
```sql
id uuid PK | appointment_id uuid → appointments(id)
stripe_payment_intent_id text | deposit_amount_pence integer | deposit_paid_at timestamptz | deposit_status text
full_payment_intent_id text | full_amount_pence integer | full_payment_paid_at timestamptz
platform_fee_pence integer | platform_fee_pct numeric | groomer_payout_amount_pence integer
stripe_transfer_id text | payout_status payout_status DEFAULT 'pending' | payout_initiated_at timestamptz
refund_status refund_status DEFAULT 'none' | refund_amount_pence integer
stripe_refund_id text | refunded_at timestamptz | currency char(3) DEFAULT 'gbp'
```

#### `reviews`
```sql
id uuid PK | appointment_id uuid UNIQUE → appointments(id)
owner_id uuid → profiles(id) | groomer_profile_id uuid → groomer_profiles(id)
rating smallint NOT NULL CHECK (1–5) | body text | is_visible boolean DEFAULT true
groomer_reply text | groomer_replied_at timestamptz
```

#### `messages`
```sql
id uuid PK | appointment_id uuid → appointments(id)
sender_id uuid → profiles(id) | body text NOT NULL
is_system boolean DEFAULT false | read_at timestamptz
```

#### `team_members`
```sql
id uuid PK | groomer_profile_id uuid → groomer_profiles(id)
name text NOT NULL | role text NOT NULL | since_year smallint | public_slug text UNIQUE
average_rating numeric DEFAULT 0.0 | total_reviews integer DEFAULT 0
email text | user_id uuid → profiles(id) ON DELETE SET NULL
invite_status text DEFAULT 'pending'   -- pending | accepted | revoked
clerk_invitation_id text | invited_at timestamptz | accepted_at timestamptz
```

#### `portfolio_photos`
```sql
id uuid PK | groomer_profile_id uuid → groomer_profiles(id)
url text NOT NULL | caption text | sort_order smallint DEFAULT 0
```

#### `time_blocks`
```sql
id uuid PK | groomer_profile_id uuid → groomer_profiles(id)
start_date date NOT NULL | end_date date NOT NULL
start_time time | end_time time | all_day boolean DEFAULT true | reason text
```
> Time blocks are groomer-declared unavailability. Must be factored into `getAvailableSlots()` in `app/actions/booking.ts`.

---

## Row Level Security (RLS)

RLS is enabled on all tables. Policies use this helper (not `auth.uid()`):

```sql
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')
$$;
```

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Own row + admin | — (webhook via supabaseAdmin) | Own row | — |
| `groomer_profiles` | Public | Own (via `user_id`) | Own | Own |
| `dogs` | Own + admin | Own | Own | Own |
| `services` | Public | Own groomer | Own groomer | Own groomer |
| `availability` | Public | Own groomer | Own groomer | Own groomer |
| `availability_overrides` | Public | Own groomer | Own groomer | Own groomer |
| `appointments` | Own as owner/groomer + assigned team member + admin | Owner only | Owner + groomer + team member | — |
| `payments` | Via appointment join + admin | — (supabaseAdmin only) | — (supabaseAdmin only) | — |
| `reviews` | Public (visible=true) + own + admin | Owner | Owner (body) + groomer (reply) | — |
| `messages` | Appointment participants | Participant + sender | Participants | — |
| `team_members` | Salon owner + self | Salon owner | Salon owner | Salon owner |

Every table has an `admin_all` policy for `is_admin = true`.

> **Admin UI must use the anon client** — `supabaseAdmin` bypasses RLS silently, so `admin_all` policies won't fire.

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # NEVER client-side — bypasses all RLS

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# App
NEXT_PUBLIC_APP_URL=                # Used in invite redirect links

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=    # Client-side map display
GOOGLE_MAPS_API_KEY=                # Server-side geocoding only

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Resend
RESEND_API_KEY=
CRON_SECRET=                        # Random secret set in Vercel; authenticates /api/cron/notifications

# PostHog (future)
NEXT_PUBLIC_POSTHOG_KEY=
```

---

## Known Gotchas

| Issue | Detail |
|---|---|
| `localhost` tunnel latency | Always use **ngrok** (`ngrok http 3000`) for Clerk/Stripe webhooks |
| `auth.uid()` in RLS | References Supabase Auth — doesn't work. Use `get_clerk_user_id()` |
| Prices in pence | `price_pence` / `amount_pence` are integers — divide by 100 for display; pass integer to Stripe |
| `supabaseAdmin` bypasses RLS | Service role skips all policies — only use server-side, never in client components |
| Supabase MCP project mismatch | MCP resolves to `pbqgppbierllialjjhkm` ("Unhinged Development Group"), NOT app project `fvbxjwfxcbhjoidrmzgv` — never use MCP to apply migrations; use `supabase db push` or Supabase dashboard SQL editor |
| `searchParams` in Next.js 16 | Must be awaited: `const params = searchParams ? await searchParams : {}` |
| Supabase Realtime | `supabaseAdmin` does not support Realtime — use anon client in client components for `channel().on(...)` |
| PostGIS via Supabase JS | `.select()` can't call `ST_X`/`ST_Y` — use `.rpc()` with a Postgres function |
| `@vis.gl/react-google-maps` SSR | Import via `next/dynamic` with `{ ssr: false }` |
| Two Google Maps env vars | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (browser); `GOOGLE_MAPS_API_KEY` (server-side geocoding) |
| Supabase join returns array | `.select('*, profiles(full_name)')` — `profiles` resolves as array even on single-row joins |
| CSS cascade layers | Unlayered CSS beats `@layer utilities` — wrap base/typography rules in `@layer base` in `globals.css` |
| Next.js 16 middleware | Uses `proxy.ts` not `middleware.ts` |
| Clerk `SignInButton`/`SignUpButton` | Take exactly one child element |
| Cloudinary in Next.js | `res.cloudinary.com` is in `remotePatterns` in `next.config.ts` |

---

## Design System

The entire design system lives in `app/globals.css`:
- CSS custom properties define the brand palette and spacing scale
- `@theme inline` maps them to Tailwind utilities (`bg-groomr-gold`, `text-deep-slate`, `font-fredoka`, `font-nunito`, etc.)
- Global utility classes: `.btn-primary`, `.btn-secondary`, `.btn-gold-on-dark`, `.field`, `.focus-ring`, `.card-lift`, `.modal-backdrop`, `.shadow-modal`, `.text-link`, `.page-fade`, `.toast-in`

**Brand palette:** `groomr-gold` (#eae45c), `deep-slate` (#2c3e50), `sage-leaf` (#88a096), `pebble-grey` (#95a5a6), `alabaster-cream` (#f9f8f4), `muted-terracotta` (#c87964)

**Typography:** `font-fredoka` (display/headings), `font-nunito` (body) — loaded from `/public/fonts/` as variable fonts.

### Icon System

All icons are in `components/ui/GroomrIcons.tsx`. Do not import from `lucide-react` for anything with a Groomr equivalent.

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

---

## Server Actions

All mutations live in `app/actions/` as `"use server"` files. They take `FormData` (for file-upload compatibility) and return `{ data } | { error: string }` — never throw. Client components call them directly from event handlers or `useTransition`.

---

## App Routes & Page Docs

Each page has a dedicated reference doc in `documents/pages/`. Read the relevant doc before editing a page.

| Route | Doc | Notes |
|---|---|---|
| `/` | [`documents/pages/landing-page.md`](documents/pages/landing-page.md) | Static marketing, no auth |
| `/become-a-groomer` | [`documents/pages/become-a-groomer.md`](documents/pages/become-a-groomer.md) | Static groomer acquisition page |
| `/founder` | [`documents/pages/founder.md`](documents/pages/founder.md) | Static founder letter |
| `/search` | [`documents/pages/search.md`](documents/pages/search.md) | Async server component, PostGIS + Google Maps |
| `/register/groomer` | [`documents/pages/register-groomer.md`](documents/pages/register-groomer.md) | 6-step wizard, writes to Supabase |
| `/dashboard` | [`documents/pages/dashboard-redirect.md`](documents/pages/dashboard-redirect.md) | Role-based redirect only, no UI |
| `/dashboard/owner` | [`documents/pages/dashboard-owner.md`](documents/pages/dashboard-owner.md) | Dog CRUD, appointments, favourites |
| `/dashboard/groomer` | [`documents/pages/dashboard-groomer.md`](documents/pages/dashboard-groomer.md) | 5-tab groomer back-office |
| `/dashboard/groomer/messages` | [`documents/pages/dashboard-groomer-messages.md`](documents/pages/dashboard-groomer-messages.md) | Real-time messaging UI |
| `/api/webhooks/clerk` | — | Clerk → Supabase user sync |
| `/api/webhooks/stripe` | — | Stripe payment + account events |
| `/api/cron/notifications` | — | Hourly job: booking reminders + review requests |

---

## Feature Status

| Feature | Status |
|---|---|
| Dog CRUD (owner dashboard) | Real — Supabase + Cloudinary |
| Appointments + Favourites (owner) | Real — Supabase |
| Groomer registration wizard | Real — writes to `groomer_profiles` |
| Groomer profile editor + team | Real — live Supabase writes |
| Groomer reviews tab | Real — shows + reply wired |
| Messages (groomer) | Real — Supabase Realtime |
| Booking flow | Real — 5-step modal, Stripe PaymentElement |
| Stripe Connect | Real — Express onboarding, destination charges, 8% platform fee |
| Transactional emails | Real — Resend, cron notifications |
| Portfolio photos | Actions built (`app/actions/portfolio.ts`); **migrations pending** |
| Time blocks → booking conflicts | `time_blocks` table exists; not yet wired into `getAvailableSlots()` |
| Groomer bookings/clients/earnings tabs | Mock data only |
| Public groomer profiles (`/groomers/[slug]`) | Not built |
| Admin dashboard | Not built |

### Pending migrations
5 migration files exist in `supabase/migrations/` that must be applied (`supabase db push` or Supabase dashboard SQL editor) before testing: `portfolio_photos`, `time_blocks`, `is_accepting_bookings`, `messages_rls`, `availability_breaks`.

---

## Next Up

1. Apply pending migrations (see above)
2. Public groomer profiles (`/groomers/[slug]`) — SEO + deep linking
3. Wire `time_blocks` into `getAvailableSlots()` in `app/actions/booking.ts`
4. Wire Bookings/Clients/Earnings groomer tabs to live data; calendar view
5. Owner dashboard — review submission, in-app message thread list
6. Admin dashboard — groomer verification queue, disputes, review moderation
7. Register Stripe webhook in Stripe Dashboard; set `STRIPE_WEBHOOK_SECRET` in Vercel
