# 🐾 GROOMR — Master Project Context

> **Purpose:** Single source of truth for the entire Groomr codebase. Paste this into any AI session, reference it when debugging, and update it as decisions are made. If something isn't in here and it matters, add it.

---

## 1. Project Overview

**Groomr** is a two-sided UK marketplace connecting dog owners with trusted independent groomers. Think: the Airbnb of dog grooming. Owners get frictionless discovery and instant booking; groomers get a professional operating system that replaces the chaos of Instagram DMs and phone tag.

- **Tagline:** *"Your dog deserves a regular."*
- **Target geography:** UK-first, Glasgow/Edinburgh and central Scotland launch
- **Stage:** Pre-revenue, in active development
- **Founder:** Andrew Hughes (`andrew@groomr.uk`) — 15 years in hospitality management
- **Inspiration:** Murphy, a 5-year-old long-haired Chihuahua and professional chaos agent

### What makes Groomr different from the main competitor (Tuft)
- Web-first (not app-only) — eliminates top-of-funnel drop-off
- No consumer-facing platform fee (Tuft charges £1.25/booking)
- Commission-only Year 1 — no upfront subscription for groomers
- Warm, community-centric brand vs. corporate SaaS feel
- Genuine instant booking (not hidden "request" flows)

---

## 2. Business Model

### Year 1 — Commission Only
- **8% flat commission** on every booking processed through the platform
- **Founding Groomer Incentive:** Any groomer who signs up within the first 3 months pays **zero commission for 6 months** from their sign-up date
- Break-even requires ~41 fully active groomers (assuming 60% of their bookings go through the platform)

### Year 2+ — Diversified Revenue
| Stream | Detail |
|---|---|
| Standard commission | 8% per booking |
| Premium subscription | £14.99/month drops commission to 5% (saves groomers ~£82/month at average volume — mathematically a no-brainer) |
| Ancillary / affiliates | B2B: professional grooming equipment affiliate links. B2C: pet insurance referral bounties (~£50/lead) |

### Revenue Projections
| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| GBV | £1,584,000 | £9,256,500 | £26,169,000 |
| Total Revenue | £126,720 | £717,052 | £1,932,854 |
| Net Profit | ~£39,720 | ~£406,052 | ~£1,152,854 |
| Margin | ~31% | ~56% | ~59% |

---

## 3. Tech Stack

### Core Framework
| Tool | Version | Purpose | Why |
|---|---|---|---|
| **Next.js** | 15 | Full-stack React framework | App Router, Server Components, API routes, Turbopack dev speed |
| **TypeScript** | Latest | Type safety across the board | Catch errors before they become 2am incidents |
| **Tailwind CSS** | v4 | Styling | Utility-first, consistent, fast |
| **Turbopack** | Built into Next 15 | Dev bundler | Significantly faster HMR than Webpack |

### Backend / Database
| Tool | Purpose | Notes |
|---|---|---|
| **Supabase** | Postgres database + realtime + storage | Project ID: `fvbxjwfxcbhjoidrmzgv`. Using service role key for all server-side ops. NOT using Supabase Auth — Clerk handles auth entirely |
| **Clerk** | Authentication & user management | Email + Google sign-in. Webhooks sync new users into Supabase `profiles` table |

### Payments
| Tool | Purpose | Notes |
|---|---|---|
| **Stripe Connect** | Marketplace payments | Groomers onboard as Connected Accounts. Platform takes commission at checkout via `application_fee_amount`. Not yet implemented |

### Infrastructure & Services
| Tool | Purpose | Notes |
|---|---|---|
| **Vercel** | Hosting + deployments | Auto-deploys from `main` branch on GitHub |
| **Resend** | Transactional email | Booking confirmations, reminders, etc. Not yet implemented |
| **Google Maps API** | Location search + groomer map display | Not yet implemented |
| **Cloudinary** | Image hosting (logos, groomer profile photos, dog photos) | Already used in brand assets. CDN URL: `res.cloudinary.com/dr8adq7nl` |
| **PostHog** | Product analytics + feature flags | Not yet implemented |
| **ngrok** | Local webhook tunnelling | **Important:** `localhost` tunnels (e.g. via VS Code port forwarding) are too slow for Clerk webhooks — always use ngrok instead |

### Dev Environment
- **OS:** WSL2 + Ubuntu on Windows
- **Editor:** VS Code
- **Node.js:** Installed via WSL2
- **Package manager:** npm
- **Local dev server:** `localhost:3000`
- **Local tunnel for webhooks:** ngrok (run `ngrok http 3000`, grab the HTTPS URL, paste into Clerk webhook dashboard)

---

## 4. Repository & Project Structure

- **GitHub:** `github.com/andyyhughes/groomr`
- **Local path:** `~/projects/groomr`

### Key Files & What They Do

```
groomr/
├── proxy.ts                          # Clerk middleware — defines public vs protected routes
├── .env.local                        # All secrets — never commit this
├── lib/
│   └── supabase.ts                   # Exports two clients:
│                                     #   `supabase` — anon key (client-side / public reads)
│                                     #   `supabaseAdmin` — service role key (server-side, bypasses RLS)
└── app/
    └── api/
        └── webhooks/
            └── clerk/
                └── route.ts          # Clerk webhook handler
                                      # Listens for `user.created` event
                                      # Auto-creates a row in `profiles` table using supabaseAdmin
```

---

## 5. Environment Variables (`.env.local`)

> ⚠️ Never commit this file. Never paste actual values here. This is a reference for what keys are needed and what they're for.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=           # Supabase project URL (safe to expose)
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Anon/public key (safe to expose — RLS protects data)
SUPABASE_SERVICE_ROLE_KEY=          # Service role key — NEVER expose client-side, bypasses ALL RLS

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=  # Safe to expose client-side
CLERK_SECRET_KEY=                   # Server-side only
CLERK_WEBHOOK_SECRET=               # Used to verify webhook signatures in route.ts

# (Future — not yet configured)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
```

---

## 6. Authentication Architecture

### How it works
1. **Clerk** handles ALL authentication (email + Google OAuth)
2. On `user.created` webhook event, `app/api/webhooks/clerk/route.ts` fires
3. The webhook uses `supabaseAdmin` (service role) to insert a new row into `profiles`
4. The Clerk `userId` (e.g. `user_2abc123`) is stored as `profiles.clerk_id`
5. **There is no foreign key to `auth.users`** — that constraint was removed because we're not using Supabase Auth

### Webhook Setup
- Webhook endpoint: `/api/webhooks/clerk`
- Must be exposed via **ngrok** during local dev (localhost is too slow — confirmed issue)
- ngrok command: `ngrok http 3000`
- The HTTPS forwarding URL goes in Clerk Dashboard → Webhooks
- Events subscribed to: `user.created` (add more as needed: `user.updated`, `user.deleted`)

### Admin User
- `andrew@groomr.uk` has `is_admin = true` in the `profiles` table
- Admin status is set manually in Supabase for now

---

## 7. Database Schema

**Supabase Project ID:** `fvbxjwfxcbhjoidrmzgv`

### Custom Types (public schema)
```sql
CREATE TYPE user_role         AS ENUM ('owner', 'groomer', 'admin');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE dog_size          AS ENUM ('small', 'medium', 'large', 'giant');
CREATE TYPE coat_type         AS ENUM ('short', 'medium', 'long', 'curly', 'double', 'wire');
CREATE TYPE payout_status     AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE refund_status     AS ENUM ('none', 'requested', 'approved', 'rejected', 'processed');
```

### Tables

#### `profiles`
The central user table. Every Clerk user gets a row here on sign-up.
```sql
id          uuid        PRIMARY KEY DEFAULT gen_random_uuid()
clerk_id    text        UNIQUE NOT NULL   -- Clerk's userId (e.g. user_2abc123)
full_name   text
phone       text
avatar_url  text
roles       user_role[] DEFAULT '{owner}'
is_admin    boolean     DEFAULT false
is_active   boolean     DEFAULT true
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```
> No FK to `auth.users` — intentionally removed. Clerk is the auth source of truth.
> No `email` column — email is held in Clerk and fetched via the Clerk SDK when needed.

#### `groomer_profiles`
Extended profile for users with the `groomer` role.
```sql
id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid()
user_id               uuid        REFERENCES profiles(id) ON DELETE CASCADE
business_name         text
bio                   text
years_experience      smallint
qualifications        text
insurance_provider    text
insurance_policy_ref  text
address_line_1        text
address_line_2        text
city                  text
postcode              text
location              geography   -- PostGIS point (lng/lat) for proximity queries
travel_radius_miles   smallint
is_mobile             boolean
is_verified           boolean     DEFAULT false
is_listed             boolean     DEFAULT true
stripe_account_id     text
average_rating        numeric
total_reviews         integer
created_at            timestamptz DEFAULT now()
updated_at            timestamptz DEFAULT now()
```
> `location` is a PostGIS `geography` column. Use `ST_MakePoint(lng, lat)::geography` to insert.
> `average_rating` and `total_reviews` are denormalised — update via trigger or server function when a review is added/edited.

#### `dogs`
Owned by dog owners.
```sql
id                  uuid       PRIMARY KEY DEFAULT gen_random_uuid()
owner_id            uuid       REFERENCES profiles(id) ON DELETE CASCADE
name                text       NOT NULL
breed               text
date_of_birth       date
size                dog_size   -- small | medium | large | giant
is_neutered         boolean    -- nullable: true=yes, false=no, null=unknown
coat_type           coat_type  -- short | medium | long | curly | double | wire
coat_notes          text
temperament_notes   text
health_notes        text
vaccination_doc_url text
profile_image_url   text
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

#### `services`
Services offered by a groomer (e.g. "Full Groom", "Bath & Dry").
```sql
id                uuid       PRIMARY KEY DEFAULT gen_random_uuid()
groomer_profile_id uuid      REFERENCES groomer_profiles(id) ON DELETE CASCADE
name              text       NOT NULL
description       text
duration_minutes  smallint
price_pence       integer    NOT NULL   -- stored in pence to avoid float issues
deposit_pence     integer
applicable_sizes  dog_size[]            -- which dog sizes this service applies to
is_active         boolean    DEFAULT true
sort_order        smallint
created_at        timestamptz DEFAULT now()
updated_at        timestamptz DEFAULT now()
```
> Prices stored in **pence** — always divide by 100 for display. Pass as integer to Stripe.

#### `availability`
Recurring weekly availability windows for a groomer.
```sql
id                 uuid       PRIMARY KEY DEFAULT gen_random_uuid()
groomer_profile_id uuid       REFERENCES groomer_profiles(id) ON DELETE CASCADE
day_of_week        smallint   NOT NULL   -- 0=Sunday … 6=Saturday
start_time         time       NOT NULL
end_time           time       NOT NULL
is_active          boolean    DEFAULT true
created_at         timestamptz DEFAULT now()
updated_at         timestamptz DEFAULT now()
```

#### `availability_overrides`
One-off exceptions to regular availability (e.g. holidays, sick days, special hours).
```sql
id                 uuid       PRIMARY KEY DEFAULT gen_random_uuid()
groomer_profile_id uuid       REFERENCES groomer_profiles(id) ON DELETE CASCADE
override_date      date       NOT NULL
is_available       boolean    DEFAULT false   -- false = blocked out entirely
start_time         time                       -- null if is_available = false
end_time           time
reason             text
created_at         timestamptz DEFAULT now()
updated_at         timestamptz DEFAULT now()
```
> Note: column is `is_available` (not `is_unavailable`) — `false` means the groomer is blocked that day.

#### `appointments`
The core transactional table.
```sql
id                        uuid               PRIMARY KEY DEFAULT gen_random_uuid()
owner_id                  uuid               REFERENCES profiles(id)
groomer_profile_id        uuid               REFERENCES groomer_profiles(id)
dog_id                    uuid               REFERENCES dogs(id)
service_id                uuid               REFERENCES services(id)
service_snapshot_name     text               -- copied at booking time in case service changes
service_snapshot_duration smallint
service_snapshot_price    integer
scheduled_at              timestamptz        NOT NULL
status                    appointment_status DEFAULT 'pending'
cancelled_by              uuid               REFERENCES profiles(id)
cancellation_reason       text
groomer_notes             text
owner_notes               text
created_at                timestamptz DEFAULT now()
updated_at                timestamptz DEFAULT now()
```
> Service snapshot columns freeze the service details at booking time — groomers can later edit their services without changing historical appointment records.

#### `payments`
Payment records, linked to Stripe. No direct `owner_id`/`groomer_id` — resolved via `appointment_id`.
```sql
id                          uuid          PRIMARY KEY DEFAULT gen_random_uuid()
appointment_id              uuid          REFERENCES appointments(id)
stripe_payment_intent_id    text
deposit_amount_pence        integer
deposit_paid_at             timestamptz
deposit_status              text
full_payment_intent_id      text
full_amount_pence           integer
full_payment_paid_at        timestamptz
platform_fee_pence          integer
platform_fee_pct            numeric       -- e.g. 0.08 for 8%
groomer_payout_amount_pence integer
stripe_transfer_id          text
payout_status               payout_status DEFAULT 'pending'
payout_initiated_at         timestamptz
refund_status               refund_status DEFAULT 'none'
refund_amount_pence         integer
stripe_refund_id            text
refunded_at                 timestamptz
currency                    char(3)       DEFAULT 'gbp'
created_at                  timestamptz   DEFAULT now()
```
> INSERT/UPDATE handled exclusively by `supabaseAdmin` via Stripe webhook server logic — no client-side writes.

#### `reviews`
Left by dog owners after a completed appointment.
```sql
id                 uuid       PRIMARY KEY DEFAULT gen_random_uuid()
appointment_id     uuid       UNIQUE REFERENCES appointments(id)   -- one review per appointment
owner_id           uuid       REFERENCES profiles(id)
groomer_profile_id uuid       REFERENCES groomer_profiles(id)
rating             smallint   NOT NULL CHECK (rating >= 1 AND rating <= 5)
body               text
is_visible         boolean    DEFAULT true
groomer_reply      text
groomer_replied_at timestamptz
created_at         timestamptz DEFAULT now()
updated_at         timestamptz DEFAULT now()
```

#### `messages`
In-app messaging scoped to an appointment thread. No separate `recipient_id` — both participants are derived from the appointment.
```sql
id             uuid        PRIMARY KEY DEFAULT gen_random_uuid()
appointment_id uuid        REFERENCES appointments(id)
sender_id      uuid        REFERENCES profiles(id)
body           text        NOT NULL
is_system      boolean     DEFAULT false   -- true for automated status messages
read_at        timestamptz                 -- null = unread
created_at     timestamptz DEFAULT now()
updated_at     timestamptz DEFAULT now()
```
> Message visibility is determined by appointment participation (owner or groomer), not a recipient column.

---

## 8. Row Level Security (RLS)

RLS is **enabled on all 10 tables**. Policies are live.

### The Core Problem: Clerk + RLS
Supabase's built-in RLS functions (like `auth.uid()`) reference Supabase Auth users. Since we're using Clerk, we use a custom helper instead.

### Helper Function
```sql
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')
$$;
```
The `sub` claim in a Clerk JWT is the Clerk user ID (e.g. `user_2abc123`). All RLS policies use this function to identify the current user.

### Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Own row + admin | — (webhook via supabaseAdmin) | Own row | — |
| `groomer_profiles` | Public | Own (via `user_id`) | Own | Own |
| `dogs` | Own + admin | Own | Own | Own |
| `services` | Public | Own groomer | Own groomer | Own groomer |
| `availability` | Public | Own groomer | Own groomer | Own groomer |
| `availability_overrides` | Public | Own groomer | Own groomer | Own groomer |
| `appointments` | Own as owner or groomer + admin | Owner only | Owner + groomer (separate policies) | — |
| `payments` | Via appointment join + admin | — (supabaseAdmin only) | — (supabaseAdmin only) | — |
| `reviews` | Public (visible=true) + own + admin | Owner | Owner (body) + groomer (reply) | — |
| `messages` | Appointment participants | Participant + sender | Appointment participants | — |

Every table also has an **`admin_all`** policy granting full access (`FOR ALL`) to any user where `is_admin = true`.

### Important: Use Anon Client for Admin UI
For the admin dashboard, use the **anon-key client** (not `supabaseAdmin`) — this ensures the `admin_all` policy fires and admin actions are attributable. `supabaseAdmin` bypasses everything silently.

### GRANT Permissions
`GRANT` permissions have been added for `service_role` on the public schema. This allows `supabaseAdmin` to bypass RLS and operate on any table — required for the webhook handler and Stripe webhook server logic.

---

## 9. Brand Guidelines

### Colours
| Name | Hex | Usage |
|---|---|---|
| **Groomr Gold** | `#eae45c` | CTAs, buttons, accents, highlights. **Never for text.** |
| **Deep Slate** | `#2c3e50` | Headings (H1–H3), body text, footer background |
| **Sage Leaf** | `#88a096` | Alternating section backgrounds, secondary text, structure |
| **Pebble Grey** | `#95a5a6` | Borders, outlines, subtle alternating backgrounds |
| **Alabaster Cream** | `#f9f8f4` | Primary page background / canvas |
| **Muted Terracotta** | `#c87964` | Error states, warnings, destructive actions. Don't layer on Sage Leaf. |

### Typography
| Font | Usage |
|---|---|
| **Fredoka Bold** | Hero headers, campaign headlines, big brand moments. Not for body or UI copy. |
| **Nunito** | Everything else — body text, UI labels, nav, buttons. The workhorse. |

### Button Behaviour
- Primary button: Groomr Gold background → fades to Muted Terracotta on hover over 0.3s
- Focus state: crisp 3px solid Groomr Gold outline ring
- Card hover: `translateY(-4px)` with soft Pebble Grey shadow

### Logo Assets (Cloudinary CDN)
| Asset | URL |
|---|---|
| Standalone Mark (Deep Slate) | `https://res.cloudinary.com/dr8adq7nl/image/upload/v1774753273/DEEP_SLATE_auun2o.png` |
| Horizontal Lockup (Deep Slate) | `https://res.cloudinary.com/dr8adq7nl/image/upload/v1774753252/Horizontal_Lockup_-_DEEP_SLATE_lg5q91.png` |
| Wordmark only (Deep Slate) | `https://res.cloudinary.com/dr8adq7nl/image/upload/v1774753299/groomr_-_DEEP_SLATE_zzlqvi.png` |
| Horizontal Lockup (Gold) | `https://res.cloudinary.com/dr8adq7nl/image/upload/v1774753253/Horizontal_Lockup_-_GROOMR_GOLD_kfzzzr.png` |

### Voice & Tone
- Warm, direct, community-first
- Champion the independent groomer
- Never corporate or sterile
- Dogs are family members, not pets

---

## 10. Tailwind Config (Reference)

The brand colours are registered as Tailwind custom colours in `tailwind.config.ts`:

```js
colors: {
  'groomr-gold':      '#eae45c',
  'deep-slate':       '#2c3e50',
  'sage-leaf':        '#88a096',
  'pebble-grey':      '#95a5a6',
  'alabaster-cream':  '#f9f8f4',
  'muted-terracotta': '#c87964',
},
fontFamily: {
  'fredoka': ['Fredoka', 'sans-serif'],
  'nunito':  ['Nunito', 'sans-serif'],
}
```

---

## 11. Known Issues & Gotchas

| Issue | Detail | Resolution |
|---|---|---|
| `localhost` tunnel too slow for webhooks | VS Code port forwarding / localhost tunnels have too much latency for Clerk webhook delivery | Always use **ngrok** (`ngrok http 3000`) for local webhook testing |
| No FK to `auth.users` | Supabase expects FKs to `auth.users` by default. We removed this constraint. | Intentional — Clerk is auth. `profiles.clerk_id` is the user identifier. |
| `auth.uid()` doesn't work in RLS | `auth.uid()` references Supabase Auth, which we're not using | Use the `get_clerk_user_id()` helper function instead |
| Price as integer | `price_pence` and `amount_pence` stored as integers | Always divide by 100 for display. Pass as integer to Stripe. |
| `supabaseAdmin` bypasses RLS | The service role client skips all RLS policies | Only use in server-side code (`app/api/`, server components, route handlers). Never import in client components. |
| Admin dashboard must use anon client | `supabaseAdmin` bypasses RLS silently — admin policies won't fire | Use the anon-key `supabase` client for admin UI so `admin_all` policies are enforced |

---

## 12. Build Roadmap

### ✅ Done
- WSL2 + Ubuntu + VS Code + Node.js setup
- Next.js 15 project (TypeScript, Tailwind, App Router, Turbopack)
- Dev server on `localhost:3000`
- GitHub repo: `github.com/andyyhughes/groomr`
- `.env.local` configured (Supabase, Clerk, service role)
- Supabase project created
- Full 10-table database schema built
- `user_role` enum (`owner`, `groomer`, `admin`)
- `profiles` table with `clerk_id`, `roles`, `is_admin`
- FK to `auth.users` removed (Clerk is auth)
- `GRANT` permissions for `service_role` on public schema
- RLS enabled on all tables
- Clerk auth (email + Google)
- `proxy.ts` middleware with public routes
- Clerk webhook → auto-creates `profiles` row on `user.created`
- `supabaseAdmin` client (service role, server-side only)
- Andrew (`andrew@groomr.uk`) set as admin
- RLS policies written for all 10 tables (role-based + `admin_all` on every table)

### 🔜 Next Up
1. **User onboarding flow** — role selection after sign-up (owner vs groomer)
3. **Groomer profile creation** — `groomer_profiles` form, Cloudinary upload
4. **Search page** — location-based groomer discovery (Google Maps)
5. **Booking flow** — service selection → availability calendar → checkout
6. **Stripe Connect** — groomer onboarding, payment processing, commission split

### 👤 Owner Dashboard
- Upcoming & past appointments
- Dog profiles (add/edit/delete dogs)
- Favourite groomers
- Review history
- **Raise a dispute / issue** — owners can flag problems with appointments or groomers to the Groomr team (stored in `disputes` table, visible to admins)
- Account settings

### ✂️ Groomer Dashboard
- Schedule / calendar view
- Booking management (confirm, cancel, mark complete)
- Earnings overview + payout history (Stripe Connect)
- Service management (add/edit/delete services)
- Availability settings (weekly schedule + overrides)
- Profile editing
- Review management (read-only)
- Account settings

### 🛠️ Admin / Groomr Dashboard
- Full overview of all users (owners + groomers)
- All appointments across the platform
- All payments + commission tracking
- Groomer verification management (approve/reject/flag groomers)
- **Disputes queue** — view and manage all issues raised by owners (status: open / in review / resolved)
- Review moderation (hide/show reviews)
- Platform analytics (PostHog integration)
- Manual admin actions (refunds, account suspension, etc.)

### 📬 Supporting Features
- **Messaging** — in-app owner ↔ groomer chat
- **Resend** — transactional emails (booking confirmations, reminders, cancellations, dispute updates)
- **PostHog** — analytics + feature flags

---

> **Note on `disputes` table:** Needs to be added to the schema. Suggested columns:
> `id`, `owner_id`, `groomer_id`, `appointment_id`, `subject`, `description`, `status` (open/in_review/resolved), `admin_notes`, `created_at`, `updated_at`

---

## 13. Useful Commands

```bash
# Start dev server
cd ~/projects/groomr && npm run dev

# Start ngrok tunnel (new terminal — keep open while testing webhooks)
ngrok http 3000

# Push to GitHub
git add . && git commit -m "your message" && git push origin main
```

---

*Last updated: 27 April 2026 — update this doc as decisions are made.*