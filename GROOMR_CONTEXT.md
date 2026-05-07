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
| **Next.js** | **16.2.4** | Full-stack React framework | App Router, Server Components, API routes, Turbopack dev speed |
| **TypeScript** | Latest | Type safety across the board | Catch errors before they become 2am incidents |
| **Tailwind CSS** | **v4** | Styling | Utility-first, consistent, fast. v4 uses `@import "tailwindcss"` — no tailwind.config.ts required |
| **Turbopack** | Built into Next 16 | Dev bundler | Significantly faster HMR than Webpack |

> ⚠️ **Next.js 16.2.4 has breaking changes** from v13/14/15 — APIs, conventions, and file structure may differ from common training data. Read `node_modules/next/dist/docs/` before writing Next.js code. Uses `proxy.ts` (not `middleware.ts`).

### Backend / Database
| Tool | Purpose | Notes |
|---|---|---|
| **Supabase** | Postgres database + realtime + storage | Project ID: `fvbxjwfxcbhjoidrmzgv`. Using service role key for all server-side ops. NOT using Supabase Auth — Clerk handles auth entirely |
| **Clerk** | Authentication & user management | `@clerk/nextjs` v7.2.7. Email + Google sign-in. Webhooks sync new users into Supabase `profiles` table |

### Clerk API Usage in Next.js 16
- **`currentUser()`** — use in Server Components (makes a network call to Clerk)
- **`auth()`** — use in Server Actions (reads from JWT, no network call — preferred for server actions)
- **`SignInButton` / `SignUpButton`** — take exactly one child element (wrap text in `<button>`)
- **`clerkClient()`** — for backend writes to Clerk user data

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
| **Cloudinary** | Image hosting (logos, groomer profile photos, dog photos) | CDN URL: `res.cloudinary.com/dr8adq7nl`. Configured in `next.config.ts` `remotePatterns` |
| **PostHog** | Product analytics + feature flags | Not yet implemented |
| **ngrok** | Local webhook tunnelling | **Important:** `localhost` tunnels are too slow for Clerk webhooks — always use ngrok |

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

### Full File Map (current state)

```
groomr/
├── proxy.ts                              # Clerk middleware — defines public vs protected routes
├── next.config.ts                        # remotePatterns: Unsplash + Cloudinary
├── .env.local                            # All secrets — never commit this
│
├── public/
│   ├── fonts/
│   │   ├── Fredoka-VariableFont_wdth_wght.ttf
│   │   ├── Nunito-VariableFont_wght.ttf
│   │   └── Nunito-Italic-VariableFont_wght.ttf
│   └── assets/
│       ├── horizontal-lockup-deep-slate.png   # Used in site header
│       └── horizontal-lockup-groomr-gold.png  # Used in site footer
│
├── app/
│   ├── icon.png                          # Favicon (Groomr mark, Deep Slate)
│   ├── globals.css                       # Full design system tokens + Tailwind v4
│   ├── layout.tsx                        # Root layout: SiteHeader, SiteFooter, ClerkProvider
│   ├── page.tsx                          # Landing page
│   │
│   ├── _components/
│   │   ├── HeaderAuthButtons.tsx         # "use client" — Clerk sign-in/sign-up buttons
│   │   ├── SiteFooter.tsx               # Global footer (Deep Slate bg, gold logo)
│   │   ├── FooterCTA.tsx                # "use client" — CTA in footer (modal sign-up or /search link)
│   │   ├── SearchPillWrapper.tsx        # "use client" — search pill on landing hero
│   │   └── BecomeGroomerCTA.tsx         # "use client" — CTA button for become-a-groomer page
│   │
│   ├── founder/
│   │   └── page.tsx                     # Founder profile page (Andrew Hughes + Murphy)
│   │
│   ├── become-a-groomer/
│   │   ├── page.tsx                     # ForGroomers marketing page
│   │   └── _components/
│   │       ├── CalculatorWidget.tsx     # "use client" — interactive earnings calculator
│   │       └── FaqAccordion.tsx         # "use client" — FAQ expand/collapse
│   │
│   ├── register/
│   │   └── groomer/
│   │       ├── page.tsx                 # Auth-gated wrapper for registration wizard
│   │       └── _components/
│   │           └── GroomerWizard.tsx    # "use client" — 5-step groomer registration wizard
│   │
│   ├── dashboard/
│   │   ├── page.tsx                     # Role router: checks Supabase roles → redirects
│   │   ├── owner/
│   │   │   ├── page.tsx                 # Server component — passes Clerk data to OwnerDashboard
│   │   │   └── _components/
│   │   │       └── OwnerDashboard.tsx   # "use client" — full owner dashboard with 5 modals
│   │   └── groomer/
│   │       ├── page.tsx                 # Server component — loads full profile data, passes to client
│   │       └── _components/
│   │           ├── GroomerDashboardClient.tsx  # "use client" — 5-tab dashboard, scope selector
│   │           ├── ProfileEditor.tsx           # "use client" — profile/services/team editor with save bar
│   │           ├── BookingsView.tsx            # "use client" — bookings (mock data, scope prop wired)
│   │           ├── ClientsView.tsx             # "use client" — clients (mock data, scope prop wired)
│   │           ├── EarningsView.tsx            # "use client" — earnings (mock data, scope prop wired)
│   │           └── ReviewsView.tsx             # "use client" — reviews (mock data, scope prop wired)
│   │
│   ├── actions/
│   │   ├── groomer-registration.ts      # Server action for groomer registration wizard
│   │   ├── profile-editor.ts            # loadProfileEditorData(), saveProfile(), saveServices()
│   │   └── team-members.ts             # inviteTeamMember(), removeTeamMember()
│   │
│   └── api/
│       └── webhooks/
│           └── clerk/
│               └── route.ts            # Clerk webhook: user.created → creates profiles row
│
├── app/
│   │
│   ├── search/
│   │   ├── page.tsx                     # Async server component — reads params, fetches groomers, geocodes query
│   │   ├── loading.tsx                  # Skeleton loading state (auto-used by Next.js)
│   │   └── _components/
│   │       ├── SearchPageClient.tsx     # "use client" — root wrapper, holds filter state + filteredCount
│   │       ├── SearchBar.tsx            # "use client" — search input + Near Me geolocation button + stat badges
│   │       ├── FilterBar.tsx            # "use client" — 4 filter dropdowns (service, price, payment, rating)
│   │       ├── ResultsSection.tsx       # "use client" — list/map toggle, client-side filter logic, GroomerCard grid
│   │       ├── MapView.tsx              # "use client" — Google Maps (@vis.gl/react-google-maps), dynamic import ssr:false
│   │       └── GroomerProfileModal.tsx  # "use client" — profile modal: services, hours, reviews, Book Now stub
│
├── components/
│   └── ui/
│       ├── Button.tsx                   # PrimaryButton, SecondaryButton, GhostButton
│       ├── Badge.tsx                    # Tone variants: sage, gold, terra, grey
│       ├── Chip.tsx                     # Toggle chip (active = Deep Slate fill)
│       ├── Eyebrow.tsx                  # Uppercase Sage Leaf label
│       ├── SearchPill.tsx               # Rounded search input with embedded CTA
│       ├── GroomerCard.tsx              # Card: photo, name, rating, distance, next slot, price
│       ├── Modal.tsx                    # Escape-to-close, scroll-lock modal shell
│       ├── Toast.tsx                    # Slim bottom-centre notification
│       └── StarRow.tsx                  # Star rating display
│
├── types/
│   ├── groomer-dashboard.ts         # ProfileFormData, ServiceRow, TeamMemberRow, ProfileEditorInitialData
│   └── search.ts                    # Search-related types
│
└── lib/
    ├── supabase.ts                      # Two clients: `supabase` (anon) + `supabaseAdmin` (service role)
    ├── search.ts                        # Supabase search queries (text + PostGIS geo), geocoding, normalisation
    └── utils.ts                         # Shared utility functions

types/
└── search.ts                            # Shared TypeScript types: GroomerResult, SearchParams, ActiveFilters, MapCentre
```

---

## 5. Pages & Routes

### Public Routes (no auth required)
| Route | File | Description |
|---|---|---|
| `/` | `app/page.tsx` | Landing page |
| `/founder` | `app/founder/page.tsx` | Founder profile (Andrew Hughes + Murphy) |
| `/become-a-groomer` | `app/become-a-groomer/page.tsx` | Groomer marketing page |
| `/search` | `app/search/page.tsx` | Groomer search results (text or geo) |
| `/sign-in` | Clerk-hosted | Sign in |
| `/sign-up` | Clerk-hosted | Sign up |
| `/api/webhooks/clerk` | `app/api/webhooks/clerk/route.ts` | Clerk webhook receiver |

### Protected Routes (auth required — enforced in `proxy.ts`)
| Route | File | Description |
|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | Role router → redirects to `/dashboard/owner` or `/dashboard/groomer` |
| `/dashboard/owner` | `app/dashboard/owner/page.tsx` | Dog owner dashboard |
| `/dashboard/groomer` | `app/dashboard/groomer/page.tsx` | Groomer dashboard |
| `/register/groomer` | `app/register/groomer/page.tsx` | 5-step groomer registration wizard |

### Post-Auth Redirects (set in `.env.local`)
```
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

---

## 6. Page Details

### Landing Page (`app/page.tsx`)
Full marketing page. Sections:
1. **Hero** (2-col desktop): Fredoka H1 with gold underline highlight, `SearchPillWrapper`, popular tag pills (E8, Hackney, Bethnal Green, Mobile only), trust badges. Right col: rotated photo collage (Unsplash) + floating "Marlow's next groom" confirmation card.
2. **How It Works** (3 cards): Search/Calendar/Heart icons with 01/02/03 Fredoka numbering.
3. **Groomer Strip** (alabaster bg, no border): Mock booking widget + stats (2,400+, 38hrs, £0) + "Become a Groomr" CTA.
4. **Testimonials** (3 cards): Gold Fredoka quote mark, flex-col layout, `flex-1` blockquote for aligned footer across cards.

### Founder Page (`app/founder/page.tsx`)
Personal letter-format page. Sections:
1. **Letterhead**: Groomr mark (Cloudinary) + italic tagline
2. **Hero**: Circular Andrew photo (Cloudinary), opening hospitality quote
3. **2-col split**: "The Journey" (Murphy story) + "Meet Murphy" white card (Cloudinary photo, sage-leaf eyebrow, large)
4. **From Hospitality to Hub**: Sage-leaf/20 rounded section
5. **My Lifetime Commitment**: Signature (Cloudinary), "free of charge for life" in `text-muted-terracotta font-extrabold` (no underline)

Cloudinary URLs used on this page:
- Groomr mark: `https://res.cloudinary.com/dr8adq7nl/image/upload/v1774753273/DEEP_SLATE_auun2o.png`
- Andrew photo: `https://res.cloudinary.com/dr8adq7nl/image/upload/v1774800795/Gemini_Generated_Image_ym8cypym8cypym8c_saonpr.png`
- Murphy photo: `https://res.cloudinary.com/dr8adq7nl/image/upload/v1774800794/Gemini_Generated_Image_riff5mriff5mriff_cwvncg.png`
- Signature: `https://res.cloudinary.com/dr8adq7nl/image/upload/v1775260142/SignatureGroomrGold_lxgo1l.png`

### Become a Groomer (`app/become-a-groomer/page.tsx`)
Full marketing page for groomer acquisition. Sections: Hero + mock widget, Benefits (4 cards), Steps (4 col, alabaster), interactive `CalculatorWidget` (bookings/week + avg price sliders → live take-home), Groomer testimonials, `FaqAccordion` (4 questions), Final CTA → `/register/groomer`.

### Groomer Registration Wizard (`app/register/groomer/`)
5-step wizard. Protected route. Left sidebar progress rail + right panel form.
| Step | Fields |
|---|---|
| 1 · About you | Full name, phone |
| 2 · Your business | Trading name, type (Mobile/Studio/Home), postcode, radius slider |
| 3 · Services & prices | Checkbox list (Bath & Brush, Full Groom, Hand-Strip, Puppy First, Nail Clip) + price per service |
| 4 · Availability | Day toggles (Mon–Sun), lead time |
| 5 · Verify & launch | Insurance/bank placeholders + "we'll email you next steps" message |

On submit: server action (`app/actions/groomer-registration.ts`) adds `groomer` role to `profiles.roles`, inserts `groomer_profiles` row (`is_listed: false`, `is_verified: false`), inserts `services` and `availability` rows, redirects to `/dashboard/groomer`.

### Owner Dashboard (`app/dashboard/owner/`)
Server component (`page.tsx`) fetches Clerk user data → passes `firstName`, `fullName`, `email` as props to `OwnerDashboard.tsx`.

`OwnerDashboard.tsx` is a full `"use client"` component. Layout: `grid grid-cols-1 lg:grid-cols-3 gap-10`.

**Left col (`lg:col-span-2`):**
- Welcome header + search bar
- Upcoming Appointments card (Oct 14, "The Standard Groom", Sarah's Grooming Room) with "View Details" + "Reschedule / Cancel"
- Previous Grooms (2 rows with Rebook buttons)
- Favourite Groomers (2 cards with Unsplash photos)

**Right col:**
- My Dogs (sage-leaf/10, paw SVG, dog list, dashed Add Dog button)
- My Details (name/email from Clerk props, Update Details button)

**Five modals:**
| Modal | Purpose |
|---|---|
| `AppointmentDetailsModal` | Groomer card, service summary with extras (Teeth Cleaning +£10, Blueberry Facial +£5), when/where, notes textarea |
| `ManageAppointmentModal` | Reschedule (date + time inputs), cancel section with muted-terracotta deposit forfeiture warning |
| `RebookModal` | Service recap, dog selector, date/time, payment summary (33% deposit) |
| `AddDogModal` | Name, breed select (40 breeds), age, sex, DOB, neutered checkbox, photo upload placeholder, medical notes → pushes to dogs state |
| `EditDogModal` | Same fields pre-filled; uses `useEffect` to sync state when `dog` prop changes |

---

## 7. Environment Variables (`.env.local`)

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

# App base URL (used in invite redirect links)
NEXT_PUBLIC_APP_URL=                # e.g. https://groomr.co or https://your-ngrok-url.ngrok.io

# Post-auth redirects
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# Google Maps (Maps JavaScript API + Geocoding API must be enabled in GCP)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=  # Client-side: used by @vis.gl/react-google-maps for map display
GOOGLE_MAPS_API_KEY=              # Server-side only: used for geocoding text queries to a map centre lat/lng

# (Future — not yet configured)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
```

---

## 8. Authentication Architecture

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
- Events subscribed to: `user.created`, `user.updated`, `user.deleted`
- `user.created` handler also links team member rows: if `public_metadata.groomr_team_invite === true`, finds the pending `team_members` row by email + `groomer_profile_id`, sets `user_id` + `invite_status = accepted`, grants `groomer` role

### Admin User
- `andrew@groomr.uk` has `is_admin = true` in the `profiles` table
- Admin status is set manually in Supabase for now

---

## 9. Database Schema

**Supabase Project ID:** `************`

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
email       text
phone       text
avatar_url  text
roles       user_role[] DEFAULT '{owner}'
is_admin    boolean     DEFAULT false
is_active   boolean     DEFAULT true
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```
> No FK to `auth.users` — intentionally removed. Clerk is the auth source of truth.
> `email` is synced from Clerk on `user.created` / `user.updated` webhooks and stored here for DB-side queries.

#### `groomer_profiles`
Extended profile for users with the `groomer` role.
```sql
id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid()
user_id               uuid        REFERENCES profiles(id) ON DELETE CASCADE
business_name         text
tagline               text        -- Short punchy descriptor shown beneath business name on cards
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
```sql
id                  uuid       PRIMARY KEY DEFAULT gen_random_uuid()
owner_id            uuid       REFERENCES profiles(id) ON DELETE CASCADE
name                text       NOT NULL
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
id                uuid       PRIMARY KEY DEFAULT gen_random_uuid()
groomer_profile_id uuid      REFERENCES groomer_profiles(id) ON DELETE CASCADE
name              text       NOT NULL
description       text
duration_minutes  smallint
price_pence       integer    NOT NULL   -- stored in pence to avoid float issues
deposit_pence     integer
applicable_sizes  dog_size[]
is_active         boolean    DEFAULT true
sort_order        smallint
created_at        timestamptz DEFAULT now()
updated_at        timestamptz DEFAULT now()
```
> Prices stored in **pence** — always divide by 100 for display. Pass as integer to Stripe.

#### `availability`
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

#### `appointments`
```sql
id                        uuid               PRIMARY KEY DEFAULT gen_random_uuid()
owner_id                  uuid               REFERENCES profiles(id)
groomer_profile_id        uuid               REFERENCES groomer_profiles(id)
dog_id                    uuid               REFERENCES dogs(id)
service_id                uuid               REFERENCES services(id)
service_snapshot_name     text
service_snapshot_duration smallint
service_snapshot_price    integer
scheduled_at              timestamptz        NOT NULL
status                    appointment_status DEFAULT 'pending'
cancelled_by              uuid               REFERENCES profiles(id)
cancellation_reason       text
groomer_notes             text
owner_notes               text
assigned_to_team_member_id uuid        REFERENCES team_members(id) ON DELETE SET NULL
created_at                timestamptz DEFAULT now()
updated_at                timestamptz DEFAULT now()
```

#### `payments`
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
platform_fee_pct            numeric
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

#### `reviews`
```sql
id                 uuid       PRIMARY KEY DEFAULT gen_random_uuid()
appointment_id     uuid       UNIQUE REFERENCES appointments(id)
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
```sql
id             uuid        PRIMARY KEY DEFAULT gen_random_uuid()
appointment_id uuid        REFERENCES appointments(id)
sender_id      uuid        REFERENCES profiles(id)
body           text        NOT NULL
is_system      boolean     DEFAULT false
read_at        timestamptz
created_at     timestamptz DEFAULT now()
updated_at     timestamptz DEFAULT now()
```

#### `team_members`
Staff groomers linked to a salon. Supports invite-based sign-up via Clerk.
```sql
id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid()
groomer_profile_id   uuid        REFERENCES groomer_profiles(id) ON DELETE CASCADE
name                 text        NOT NULL
role                 text        NOT NULL
since_year           smallint
public_slug          text        UNIQUE
average_rating       numeric     DEFAULT 0.0
total_reviews        integer     DEFAULT 0
email                text                    -- invite destination
user_id              uuid        REFERENCES profiles(id) ON DELETE SET NULL  -- set after invite accepted
invite_status        text        NOT NULL DEFAULT 'pending'  -- pending | accepted | revoked
clerk_invitation_id  text                    -- Clerk invitation ID for revocation
invited_at           timestamptz DEFAULT now()
accepted_at          timestamptz
created_at           timestamptz DEFAULT now()
updated_at           timestamptz DEFAULT now()
```
> `invite_status` constraint: `CHECK (invite_status IN ('pending','accepted','revoked'))`
> `user_id` is null until the invited team member completes sign-up via Clerk.

---

## 10. Row Level Security (RLS)

RLS is **enabled on all 11 tables** (`team_members` added with invite-scope policies).

### The Core Problem: Clerk + RLS
Supabase's `auth.uid()` references Supabase Auth users. Since we're using Clerk, we use a custom helper instead.

### Helper Function
```sql
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')
$$;
```
The `sub` claim in a Clerk JWT is the Clerk user ID. All RLS policies use this function.

### Policy Summary
| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Own row + admin | — (webhook via supabaseAdmin) | Own row | — |
| `groomer_profiles` | Public | Own (via `user_id`) | Own | Own |
| `dogs` | Own + admin | Own | Own | Own |
| `services` | Public | Own groomer | Own groomer | Own groomer |
| `availability` | Public | Own groomer | Own groomer | Own groomer |
| `availability_overrides` | Public | Own groomer | Own groomer | Own groomer |
| `appointments` | Own as owner/groomer + team member (assigned) + admin | Owner only | Owner + groomer + team member (assigned) | — |
| `payments` | Via appointment join + admin | — (supabaseAdmin only) | — (supabaseAdmin only) | — |
| `reviews` | Public (visible=true) + own + admin | Owner | Owner (body) + groomer (reply) | — |
| `messages` | Appointment participants | Participant + sender | Appointment participants | — |
| `team_members` | Salon owner (all) + self (own row) | Salon owner | Salon owner | Salon owner |

Every table also has an **`admin_all`** policy (`FOR ALL`) for any user where `is_admin = true`.

### Important: Use Anon Client for Admin UI
For the admin dashboard, use the **anon-key client** (not `supabaseAdmin`) — this ensures the `admin_all` policy fires. `supabaseAdmin` bypasses everything silently.

---

## 11. Brand Guidelines

### Colours
| Name | Hex | Tailwind class | Usage |
|---|---|---|---|
| **Groomr Gold** | `#eae45c` | `groomr-gold` | CTAs, buttons, accents, highlights. **Never for text.** |
| **Deep Slate** | `#2c3e50` | `deep-slate` | Headings, body text, footer background |
| **Sage Leaf** | `#88a096` | `sage-leaf` | Section accents, secondary text, eyebrows |
| **Pebble Grey** | `#95a5a6` | `pebble-grey` | Borders, subtle backgrounds, meta text |
| **Alabaster Cream** | `#f9f8f4` | `alabaster-cream` | Primary page background / canvas |
| **Muted Terracotta** | `#c87964` | `muted-terracotta` | Errors, warnings, destructive actions |

### Typography
| Font | Usage |
|---|---|
| **Fredoka** (variable, wdth+wght) | Hero headers, section headlines, big brand numbers. NOT for body text. |
| **Nunito** (variable, wght + italic) | Everything else — body, UI labels, nav, buttons |

Fonts are **local variable TTFs** in `public/fonts/`. Declared via `@font-face` in `globals.css`. Do NOT use Google Fonts.

### Logo & Brand Assets

**Local (in `public/assets/`):**
| File | Used in |
|---|---|
| `horizontal-lockup-deep-slate.png` | Site header |
| `horizontal-lockup-groomr-gold.png` | Site footer |

**Cloudinary (`res.cloudinary.com/dr8adq7nl`):**
| Asset | URL |
|---|---|
| Groomr mark (Deep Slate) | `.../v1774753273/DEEP_SLATE_auun2o.png` |
| Horizontal Lockup (Deep Slate) | `.../v1774753252/Horizontal_Lockup_-_DEEP_SLATE_lg5q91.png` |
| Horizontal Lockup (Gold) | `.../v1774753253/Horizontal_Lockup_-_GROOMR_GOLD_kfzzzr.png` |
| Andrew Hughes photo | `.../v1774800795/Gemini_Generated_Image_ym8cypym8cypym8c_saonpr.png` |
| Murphy photo | `.../v1774800794/Gemini_Generated_Image_riff5mriff5mriff_cwvncg.png` |
| Andrew's signature (Gold) | `.../v1775260142/SignatureGroomrGold_lxgo1l.png` |

**Favicon:** `app/icon.png` (Groomr mark, Deep Slate). The `favicon.ico` was deleted — if it exists it takes precedence over `icon.png`. Explicit `icons` metadata in `app/layout.tsx`.

### Voice & Tone
- Warm, direct, community-first
- Champion the independent groomer
- Never corporate or sterile
- Dogs are family members, not pets

### Button Behaviour
- Primary: Groomr Gold bg → fades to Muted Terracotta on hover (0.3s)
- Focus: 3px solid Groomr Gold outline ring
- Card hover: `translateY(-4px)` with soft shadow

---

## 12. Styling Architecture (Tailwind v4 + CSS Tokens)

### Setup
Tailwind v4 is imported with:
```css
@import "tailwindcss";
```
There is **no `tailwind.config.ts`**. Brand tokens and font families are registered via `@theme inline` in `app/globals.css`.

### `globals.css` Structure
```css
@import "tailwindcss";

@theme inline {
  --color-groomr-gold: #eae45c;
  --color-deep-slate: #2c3e50;
  --color-sage-leaf: #88a096;
  --color-pebble-grey: #95a5a6;
  --color-alabaster-cream: #f9f8f4;
  --color-muted-terracotta: #c87964;
  --font-fredoka: "Fredoka", sans-serif;
  --font-nunito: "Nunito", sans-serif;
}

@font-face { /* Fredoka variable */ }
@font-face { /* Nunito variable */ }
@font-face { /* Nunito Italic variable */ }

@layer base {
  html, body { background-color: ...; color: ...; font-family: Nunito; }
  h1, h2, h3 { font-family: Fredoka; color: var(--deep-slate); }
  /* All typography utilities: .eyebrow, .tagline, .lead, .meta, .display */
}

@layer utilities {
  /* btn-primary, btn-secondary, btn-gold-on-dark */
  /* card-lift, focus-ring, shadow-lift, shadow-modal, shadow-subtle */
  /* page-fade, field, modal-backdrop */
}
```

### ⚠️ Critical CSS Cascade Rule
**All base/typography styles must be in `@layer base`**, not unlayered. If `h1`/`h2`/`p`/`body` have `color:` set as unlayered CSS, it beats Tailwind's `@layer utilities` in the cascade — meaning `text-groomr-gold`, `text-sage-leaf`, etc. silently have no effect on those elements. This was a resolved bug; keep everything in `@layer base`.

---

## 13. Known Issues & Gotchas

| Issue | Detail | Resolution |
|---|---|---|
| `localhost` tunnel too slow for webhooks | VS Code port forwarding / localhost tunnels have too much latency for Clerk webhook delivery | Always use **ngrok** (`ngrok http 3000`) for local webhook testing |
| No FK to `auth.users` | Supabase expects FKs to `auth.users` by default. We removed this constraint. | Intentional — Clerk is auth. `profiles.clerk_id` is the user identifier. |
| `auth.uid()` doesn't work in RLS | References Supabase Auth, which we're not using | Use the `get_clerk_user_id()` helper function instead |
| Price as integer | `price_pence` and `amount_pence` stored as integers | Always divide by 100 for display. Pass as integer to Stripe. |
| `supabaseAdmin` bypasses RLS | The service role client skips all RLS policies | Only use in server-side code (`app/api/`, server components, route handlers). Never import in client components. |
| Admin dashboard must use anon client | `supabaseAdmin` bypasses RLS silently — admin policies won't fire | Use the anon-key `supabase` client for admin UI so `admin_all` policies are enforced |
| CSS cascade layers | Unlayered CSS always beats `@layer utilities` | Wrap ALL base/typography rules in `@layer base` in `globals.css` |
| Favicon priority | `app/favicon.ico` takes precedence over `app/icon.png` | Delete `favicon.ico`; add explicit `icons` metadata to `layout.tsx` |
| `EditDogModal` state sync | Calling `setState` during render is an anti-pattern | Use `useEffect` to sync state when the `dog` prop changes |
| Clerk `SignInButton` / `SignUpButton` | These take exactly one child | Wrap the label in a `<button>` element as the single child |
| Cloudinary images in Next.js | `next/image` requires allowed domains | `res.cloudinary.com` is in `remotePatterns` in `next.config.ts` |
| Next.js 16 middleware file | Uses `proxy.ts` not `middleware.ts` | All route protection logic lives in `proxy.ts` |
| PostGIS queries can't use `ST_X`/`ST_Y` via Supabase JS `.select()` | The Supabase JS client's column selector doesn't support function calls | Use a Postgres `LANGUAGE sql` RPC function (e.g. `search_groomers_near`) and call via `.rpc()` |
| `@vis.gl/react-google-maps` must be client-only | Google Maps accesses `window` during import — throws on SSR | Import via `next/dynamic` with `{ ssr: false }` in the parent component |
| Supabase join returns array, not object | `.select('*, profiles(full_name)')` returns `profiles` as `{ full_name }[]`, not `{ full_name }` | Type the joined field as an array (`profiles: { full_name: string \| null }[] \| null`) |
| Google Maps needs two separate env vars | Map display (client) and geocoding (server) use different env var prefixes | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for browser; `GOOGLE_MAPS_API_KEY` for server-side geocoding |

---

## 14. Build Roadmap

### ✅ Done

**Infrastructure & Foundation**
- WSL2 + Ubuntu + VS Code + Node.js setup
- Next.js 16.2.4 project (TypeScript, Tailwind v4, App Router, Turbopack)
- Dev server on `localhost:3000`
- GitHub repo: `github.com/andyyhughes/groomr`
- `.env.local` configured (Supabase, Clerk, service role)
- Supabase project created, full 10-table database schema
- RLS enabled on all tables with Clerk-compatible policies
- Clerk auth (email + Google OAuth)
- `proxy.ts` middleware with public/protected route config
- Clerk webhook → auto-creates `profiles` row on `user.created`
- `supabaseAdmin` client (service role, server-side only)
- Andrew set as admin in Supabase

**Design System**
- Local variable fonts in `public/fonts/` (Fredoka, Nunito, Nunito Italic)
- Full CSS token set in `globals.css` via `@theme inline`
- All base styles wrapped in `@layer base` (cascade fix)
- Utility classes: `btn-primary`, `btn-secondary`, `btn-gold-on-dark`, `card-lift`, `focus-ring`, `page-fade`, `field`, `modal-backdrop`, shadow utilities
- UI component library: `Button`, `Badge`, `Chip`, `Eyebrow`, `SearchPill`, `GroomerCard`, `Modal`, `Toast`, `StarRow`

**Global Layout**
- Sticky branded header with logo image (horizontal lockup, Deep Slate)
- `HeaderAuthButtons`: signed-out shows Sign In / Sign Up; signed-in shows avatar + My Dashboard + Log Out
- Global `SiteFooter`: Deep Slate bg, 8px Groomr Gold top border, gold logo, nav links (Our Founder, For Groomers, Privacy, Terms, Support), copyright
- `FooterCTA`: signed-out → Clerk modal sign-up; signed-in → /search link
- `app/icon.png` favicon (Groomr mark)

**Public Pages**
- Landing page (`/`) — hero, how it works, groomer strip, testimonials
- Founder page (`/founder`) — Andrew Hughes + Murphy, Cloudinary assets
- Become a Groomer (`/become-a-groomer`) — full marketing page with interactive calculator + FAQ accordion

**Authenticated Pages**
- Dashboard role router (`/dashboard`) — checks Supabase `roles` → redirects
- Owner dashboard (`/dashboard/owner`) — upcoming/past appointments, dog profiles (add/edit), favourite groomers, 5 modals
- Groomer dashboard (`/dashboard/groomer`) — full profile editor, team management, scope selector
- Groomer registration wizard (`/register/groomer`) — 5-step wizard + server action

**Search & Discovery**
- Search page (`/search`) — text search (ILIKE on business_name/city/postcode) + Near Me (PostGIS `ST_DWithin`)
- Filters: service type, price range, payment, rating — all client-side, no refetch
- Google Maps view (`@vis.gl/react-google-maps`) with gold pin markers, info window, "View Profile"
- Groomer profile modal — fetches services, availability, reviews from Supabase on open
- Geocoding: server-side call to Google Maps Geocoding API to centre the map on text queries
- `search_groomers_near` PostGIS RPC function applied to Supabase (`lib/search.ts`)

**Groomer Dashboard — Profile & Team (May 2026)**
- Profile editor wired to live DB (`groomer_profiles`, `services`, `profiles`)
- Owner/Lead field shows real `profiles.full_name` (read-only, managed via Clerk)
- Dirty-state tracking — sticky save bar only appears when there are unsaved changes
- Standard service quick-add chips (9 templates; already-added greyed out)
- Save profile + save services server actions (`profile-editor.ts`)
- Team member invite flow: name + role + email → Clerk invitation email → webhook links `user_id` on sign-up
- Team member dashboard scoping: all 5 tabs, data filtered by `assigned_to_team_member_id`
- Salon owner scope selector: Full salon / My data / any individual team member
- Team member delete (owner-only) with Clerk invitation revocation for pending invites

### 🔜 Next Up (Phase 2)

1. **Public groomer profiles** (`/groomers/[slug]`)
   - Dedicated page (profile modal exists on /search but full page needed for SEO + deep linking)
   - Business name, bio, photos, services + prices
   - Availability calendar
   - Reviews section
   - "Book Now" CTA → booking flow
   - Add `profile_image_url` and `banner_image_url` columns to `groomer_profiles` (currently placeholder Unsplash image)

2. **Booking flow**
   - Service selection → date/time picker → dog selection → checkout
   - 33% deposit via Stripe (Stripe Connect not yet set up — Phase 3)

3. **Groomer dashboard** (continued)
   - Wire Bookings/Clients/Earnings/Reviews tabs to live Supabase data
   - Assign bookings to specific team members (`assigned_to_team_member_id`)
   - Schedule / calendar view
   - Availability settings (weekly + overrides)
   - Cover photo + portfolio management (Cloudinary)
   - Account health section (insurance expiry, Stripe status)

4. **Stripe Connect**
   - Groomer onboarding as Connected Accounts
   - Commission split at checkout (`application_fee_amount`)
   - Payout tracking

### 👤 Owner Dashboard — Future Enhancements
- Connect to live Supabase data (currently static/mock)
- Real dog profile CRUD (save to `dogs` table)
- Real appointment data from `appointments` table
- Review submission after completed appointment
- In-app messaging
- Account settings (update name/phone via Clerk)

### ✂️ Groomer Dashboard (Remaining)
- Wire Bookings/Clients/Earnings/Reviews tabs to live data (currently mock)
- Booking management (confirm, cancel, mark complete)
- Assign bookings to team members at booking time
- Earnings overview + payout history (Stripe)
- Availability settings (weekly + overrides)
- Cover photo + portfolio upload (Cloudinary)
- Review management (read, reply)

### 🛠️ Admin Dashboard
- All users, appointments, payments
- Groomer verification queue
- Disputes queue
- Review moderation
- Platform analytics (PostHog)

### 📬 Supporting Features
- **Messaging** — in-app owner ↔ groomer chat (scoped to appointment thread)
- **Resend** — transactional emails (confirmations, reminders, cancellations)
- **PostHog** — analytics + feature flags
- **`disputes` table** — needs adding to schema: `id`, `owner_id`, `groomer_id`, `appointment_id`, `subject`, `description`, `status` (open/in_review/resolved), `admin_notes`, `created_at`, `updated_at`

---

## 15. Useful Commands

```bash
# Start dev server
cd ~/projects/groomr && npm run dev

# Start ngrok tunnel (new terminal — keep open while testing webhooks)
ngrok http 3000

# Push to GitHub
git add . && git commit -m "your message" && git push origin main
```

---

*Last updated: 02 May 2026 — update this doc as decisions are made.*
