# GROOMR — Project Context

> Single source of truth for coding sessions. For business model, revenue projections, brand guidelines, and full file map — those live in the extended docs or are derivable from the codebase.

---

## 1. Project Overview

**Groomr** is a two-sided UK marketplace connecting dog owners with independent groomers. Owners get instant booking; groomers get a full operating system replacing Instagram DMs and phone tag.

- **Tagline:** *"Your dog deserves a regular."*
- **Target geography:** UK-first, Glasgow/Edinburgh launch
- **Stage:** Pre-revenue, in active development
- **Founder:** Andrew Hughes — 15 years hospitality management; inspired by Murphy, his long-haired Chihuahua
- **Business model:** 8% commission on bookings (0% for founding groomers for 6 months)

---

## 2. Tech Stack

| Tool | Version | Notes |
|---|---|---|
| **Next.js** | 16.2.4 | App Router, Server Components. Uses `proxy.ts` not `middleware.ts` |
| **TypeScript** | Latest | `npm run build` is the type check — no separate tsc step |
| **Tailwind CSS** | v4 | `@import "tailwindcss"` in `globals.css` — no `tailwind.config.ts` |
| **Supabase** | — | Postgres. Service role admin client for all server-side ops (`lib/supabase-admin.ts`) |
| **Clerk** | v7.2.7 | Auth only — not using Supabase Auth at all |
| **Cloudinary** | — | Dog/groomer photos. CDN: `res.cloudinary.com/dr8adq7nl` |
| **Google Maps** | — | `@vis.gl/react-google-maps` (client, `ssr:false`) + server-side geocoding |
| **Stripe Connect** | — | Planned — not yet implemented |

> ⚠️ **Next.js 16 has breaking API changes** from v13/14/15. Read `node_modules/next/dist/docs/` before writing Next.js-specific code.

### Clerk API Usage (Next.js 16)
- `currentUser()` — Server Components (network call to Clerk)
- `auth()` — Server Actions (reads JWT, no network call — prefer this in actions)
- `SignInButton` / `SignUpButton` — take exactly one child element

---

## 3. Auth & Role Architecture

1. Clerk handles all auth (email + Google OAuth)
2. On `user.created`: webhook (`/api/webhooks/clerk`) creates `profiles` row with `roles = {owner}`
3. `/dashboard` reads `profiles.roles` from Supabase and redirects:
   - `groomer` role → `/dashboard/groomer`
   - otherwise → `/dashboard/owner`
4. All server actions/components get Clerk user via `currentUser()` / `auth()`, then look up `profiles.id` by `clerk_id` to scope Supabase queries
5. Webhook race condition fallback: `getOrCreateProfile()` in `app/dashboard/owner/page.tsx`
6. Team member sign-up: webhook also checks `public_metadata.groomr_team_invite === true`, links `team_members` row and grants `groomer` role

### Admin
- `andrew@groomr.uk` has `is_admin = true` in `profiles` — set manually in Supabase

---

## 4. Database Schema

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
id         uuid        PRIMARY KEY DEFAULT gen_random_uuid()
clerk_id   text        UNIQUE NOT NULL
full_name  text
email      text
phone      text
avatar_url text
roles      user_role[] DEFAULT '{owner}'
is_admin   boolean     DEFAULT false
is_active  boolean     DEFAULT true
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```
> No FK to `auth.users` — intentional. Clerk is auth source of truth.

#### `groomer_profiles`
```sql
id                   uuid     PRIMARY KEY DEFAULT gen_random_uuid()
user_id              uuid     REFERENCES profiles(id) ON DELETE CASCADE
business_name        text
tagline              text
bio                  text
years_experience     smallint
qualifications       text
insurance_provider   text
insurance_policy_ref text
address_line_1       text
address_line_2       text
city                 text
postcode             text
location             geography   -- PostGIS point (lng/lat)
travel_radius_miles  smallint
is_mobile            boolean
is_verified          boolean     DEFAULT false
is_listed            boolean     DEFAULT true
stripe_account_id    text
average_rating       numeric
total_reviews        integer
created_at           timestamptz DEFAULT now()
updated_at           timestamptz DEFAULT now()
```
> `location` uses `ST_MakePoint(lng, lat)::geography` to insert.

#### `dogs`
```sql
id                  uuid  PRIMARY KEY DEFAULT gen_random_uuid()
owner_id            uuid  REFERENCES profiles(id) ON DELETE CASCADE
name                text  NOT NULL
breed               text
date_of_birth       date
size                dog_size
is_neutered         boolean
coat_type           coat_type
coat_notes          text
temperament_notes   text
health_notes        text
vaccination_doc_url text
profile_image_url   text
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

#### `services`
```sql
id                 uuid     PRIMARY KEY DEFAULT gen_random_uuid()
groomer_profile_id uuid     REFERENCES groomer_profiles(id) ON DELETE CASCADE
name               text     NOT NULL
description        text
duration_minutes   smallint
price_pence        integer  NOT NULL   -- always divide by 100 for display
deposit_pence      integer
applicable_sizes   dog_size[]
is_active          boolean  DEFAULT true
sort_order         smallint
created_at         timestamptz DEFAULT now()
updated_at         timestamptz DEFAULT now()
```

#### `availability`
```sql
id                 uuid     PRIMARY KEY DEFAULT gen_random_uuid()
groomer_profile_id uuid     REFERENCES groomer_profiles(id) ON DELETE CASCADE
day_of_week        smallint NOT NULL   -- 0=Sunday … 6=Saturday
start_time         time     NOT NULL
end_time           time     NOT NULL
is_active          boolean  DEFAULT true
```

#### `availability_overrides`
```sql
id                 uuid  PRIMARY KEY DEFAULT gen_random_uuid()
groomer_profile_id uuid  REFERENCES groomer_profiles(id) ON DELETE CASCADE
override_date      date  NOT NULL
is_available       boolean DEFAULT false
start_time         time
end_time           time
reason             text
```

#### `appointments`
```sql
id                          uuid               PRIMARY KEY DEFAULT gen_random_uuid()
owner_id                    uuid               REFERENCES profiles(id)
groomer_profile_id          uuid               REFERENCES groomer_profiles(id)
dog_id                      uuid               REFERENCES dogs(id)
service_id                  uuid               REFERENCES services(id)
service_snapshot_name       text
service_snapshot_duration   smallint
service_snapshot_price      integer
scheduled_at                timestamptz        NOT NULL
status                      appointment_status DEFAULT 'pending'
cancelled_by                uuid               REFERENCES profiles(id)
cancellation_reason         text
groomer_notes               text
owner_notes                 text
assigned_to_team_member_id  uuid               REFERENCES team_members(id) ON DELETE SET NULL
created_at                  timestamptz DEFAULT now()
updated_at                  timestamptz DEFAULT now()
```

#### `payments`
```sql
id                           uuid PRIMARY KEY DEFAULT gen_random_uuid()
appointment_id               uuid REFERENCES appointments(id)
stripe_payment_intent_id     text
deposit_amount_pence         integer
deposit_paid_at              timestamptz
deposit_status               text
full_payment_intent_id       text
full_amount_pence            integer
full_payment_paid_at         timestamptz
platform_fee_pence           integer
platform_fee_pct             numeric
groomer_payout_amount_pence  integer
stripe_transfer_id           text
payout_status                payout_status DEFAULT 'pending'
payout_initiated_at          timestamptz
refund_status                refund_status DEFAULT 'none'
refund_amount_pence          integer
stripe_refund_id             text
refunded_at                  timestamptz
currency                     char(3) DEFAULT 'gbp'
created_at                   timestamptz DEFAULT now()
```

#### `reviews`
```sql
id                 uuid     PRIMARY KEY DEFAULT gen_random_uuid()
appointment_id     uuid     UNIQUE REFERENCES appointments(id)
owner_id           uuid     REFERENCES profiles(id)
groomer_profile_id uuid     REFERENCES groomer_profiles(id)
rating             smallint NOT NULL CHECK (rating >= 1 AND rating <= 5)
body               text
is_visible         boolean  DEFAULT true
groomer_reply      text
groomer_replied_at timestamptz
created_at         timestamptz DEFAULT now()
updated_at         timestamptz DEFAULT now()
```

#### `messages`
```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
appointment_id uuid REFERENCES appointments(id)
sender_id      uuid REFERENCES profiles(id)
body           text NOT NULL
is_system      boolean DEFAULT false
read_at        timestamptz
created_at     timestamptz DEFAULT now()
updated_at     timestamptz DEFAULT now()
```

#### `team_members`
```sql
id                  uuid     PRIMARY KEY DEFAULT gen_random_uuid()
groomer_profile_id  uuid     REFERENCES groomer_profiles(id) ON DELETE CASCADE
name                text     NOT NULL
role                text     NOT NULL
since_year          smallint
public_slug         text     UNIQUE
average_rating      numeric  DEFAULT 0.0
total_reviews       integer  DEFAULT 0
email               text
user_id             uuid     REFERENCES profiles(id) ON DELETE SET NULL
invite_status       text     NOT NULL DEFAULT 'pending'   -- pending | accepted | revoked
clerk_invitation_id text
invited_at          timestamptz DEFAULT now()
accepted_at         timestamptz
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

---

## 5. Row Level Security (RLS)

RLS is enabled on all tables. All policies use a custom helper (not `auth.uid()`):

```sql
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')
$$;
```

The `sub` claim in a Clerk JWT is the Clerk user ID.

### Policy Summary
| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Own row + admin | — (webhook via supabaseAdmin) | Own row | — |
| `groomer_profiles` | Public | Own (via `user_id`) | Own | Own |
| `dogs` | Own + admin | Own | Own | Own |
| `services` | Public | Own groomer | Own groomer | Own groomer |
| `availability` | Public | Own groomer | Own groomer | Own groomer |
| `availability_overrides` | Public | Own groomer | Own groomer | Own groomer |
| `appointments` | Own as owner/groomer + team member (assigned) + admin | Owner only | Owner + groomer + team member | — |
| `payments` | Via appointment join + admin | — (supabaseAdmin only) | — (supabaseAdmin only) | — |
| `reviews` | Public (visible=true) + own + admin | Owner | Owner (body) + groomer (reply) | — |
| `messages` | Appointment participants | Participant + sender | Participants | — |
| `team_members` | Salon owner + self | Salon owner | Salon owner | Salon owner |

Every table has an `admin_all` policy (`FOR ALL`) for `is_admin = true`.

> **Admin UI must use the anon client** — `supabaseAdmin` bypasses RLS silently, so `admin_all` policies won't fire.

---

## 6. Environment Variables

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

# Future
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
```

---

## 7. Known Issues & Gotchas

| Issue | Detail | Resolution |
|---|---|---|
| `localhost` tunnel too slow for webhooks | VS Code port forwarding has too much latency | Always use **ngrok** (`ngrok http 3000`) |
| No FK to `auth.users` | Intentionally removed — Clerk is auth | `profiles.clerk_id` is the user identifier |
| `auth.uid()` doesn't work in RLS | References Supabase Auth | Use `get_clerk_user_id()` helper |
| Prices stored in pence | `price_pence`, `amount_pence` are integers | Divide by 100 for display; pass integer to Stripe |
| `supabaseAdmin` bypasses RLS | Service role skips all policies | Only use server-side; never in client components |
| CSS cascade layers | Unlayered CSS beats `@layer utilities` | Wrap ALL base/typography rules in `@layer base` in `globals.css` |
| Favicon priority | `favicon.ico` beats `icon.png` | Delete `favicon.ico`; add explicit `icons` metadata to `layout.tsx` |
| Clerk `SignInButton` / `SignUpButton` | Take exactly one child | Wrap label in a `<button>` as the single child |
| Cloudinary in Next.js | `next/image` requires allowed domains | `res.cloudinary.com` is in `remotePatterns` in `next.config.ts` |
| Next.js 16 middleware | Uses `proxy.ts` not `middleware.ts` | All route protection in `proxy.ts` |
| PostGIS queries via Supabase JS | `.select()` can't call `ST_X`/`ST_Y` | Use a Postgres RPC function called via `.rpc()` |
| `@vis.gl/react-google-maps` SSR | Accesses `window` on import | Import via `next/dynamic` with `{ ssr: false }` |
| Supabase join returns array | `.select('*, profiles(full_name)')` returns `profiles` as an array | Type as `profiles: { full_name: string \| null }[] \| null` |
| Two Google Maps env vars needed | Map display and geocoding use different vars | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (browser); `GOOGLE_MAPS_API_KEY` (server) |

---

## 8. Build Roadmap

### Done
- Full project setup (Next.js 16, Tailwind v4, Clerk, Supabase, Cloudinary)
- 10-table Supabase schema with RLS + Clerk-compatible policies
- Design system (fonts, tokens, utility classes, icon system, shared UI components)
- Global layout (header, footer, auth buttons)
- Public pages: `/`, `/founder`, `/become-a-groomer`
- Search page: text + PostGIS geo search, filters, Google Maps, groomer profile modal
- Groomer registration wizard (6 steps, writes to Supabase)
- Dashboard role router
- Owner dashboard: dog CRUD (Supabase + Cloudinary), appointments, favourites
- Groomer dashboard: profile editor, services, availability, team invite flow, scope selector, reviews tab

### Next Up (Phase 2)
1. **Public groomer profiles** (`/groomers/[slug]`) — SEO + deep linking, full page from modal
2. **Booking flow** — service → date/time → dog → checkout (Stripe deposit)
3. **Groomer dashboard** — wire Bookings/Clients/Earnings tabs to live data; schedule/calendar view; cover photos
4. **Stripe Connect** — groomer onboarding, commission split, payout tracking
5. **Owner dashboard** — review submission, in-app messaging, account settings
6. **Admin dashboard** — groomer verification queue, disputes, review moderation

### Planned (Phase 3+)
- Resend transactional emails
- PostHog analytics + feature flags
- `disputes` table (needs adding to schema)
- Google Calendar sync for groomers

---

*Last updated: May 2026*
