# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

**Groomr** is a two-sided UK marketplace connecting dog owners with independent groomers. UK-first, Glasgow/Edinburgh launch. Pre-revenue, in active development. Business model: 8% commission on bookings (0% for founding groomers for 6 months).

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
| **TypeScript** | ^5 | `npm run build` is the type check |
| **Tailwind CSS** | v4 | `@import "tailwindcss"` in `globals.css` — no `tailwind.config.ts` |
| **Supabase** | ^2.104.1 | Postgres. `lib/supabase-admin.ts` = service-role client (server only). `lib/supabase.ts` = anon client (Realtime only) |
| **Clerk** | ^7.2.7 | Auth only (email + Google OAuth) — not using Supabase Auth |
| **Cloudinary** | ^2.10.0 | Dog/groomer photos. CDN: `res.cloudinary.com/dr8adq7nl` |
| **Google Maps** | ^1.8.3 | `@vis.gl/react-google-maps` (client, `ssr:false`) + server-side geocoding |
| **Stripe Connect** | ^22.1.1 | Destination charges, 8% platform fee. `lib/stripe.ts` (server), `lib/stripe-client.ts` (browser). See `documents/stripe-setup.md` |
| **Resend** | ^6.12.3 | Transactional email. `lib/resend.ts`, templates in `lib/emails/`. FROM: `notifications@groomr.uk` |
| **Twilio** | ^6.0.2 | SMS notifications. `lib/sms/client.ts` + `lib/sms/send.ts` |

### Clerk API (Next.js 16)
- `currentUser()` — Server Components (network call)
- `auth()` — Server Actions (reads JWT, no network call — **prefer in actions**)
- `SignInButton` / `SignUpButton` — take **exactly one child element**

---

## lib/ Reference

| File | Purpose |
|---|---|
| `lib/supabase-admin.ts` | Service-role client (`supabaseAdmin`) — server-side only, bypasses RLS |
| `lib/supabase.ts` | Anon client — use only for Realtime subscriptions in client components |
| `lib/stripe.ts` | Server Stripe client + `PLATFORM_FEE_PCT = 0.08` |
| `lib/stripe-client.ts` | Browser Stripe client (`getStripeClient()`) |
| `lib/resend.ts` | Resend email client |
| `lib/utils.ts` | `cn()` — classname merger (clsx + tailwind-merge) |
| `lib/slug.ts` | `toSlug()`, `generateUniqueGroomerSlug()` |
| `lib/dog-breeds.ts` | `DOG_BREEDS: string[]` — comprehensive breed list |
| `lib/search.ts` | Groomer search (PostGIS + Google Maps geocoding) |
| `lib/emails/send.ts` | Email dispatch functions |
| `lib/emails/*.ts` | Templates: booking-confirmation-owner/groomer, appointment-cancelled, appointment-reminder, groom-complete, review-reminder |
| `lib/sms/client.ts` | Twilio client wrapper |
| `lib/sms/send.ts` | SMS dispatch: `sendBookingConfirmationSMS()` etc. |

---

## Auth & Role Architecture

1. Clerk handles all auth (email + Google OAuth)
2. On `user.created`: webhook (`/api/webhooks/clerk`) creates `profiles` row with `roles = {owner}`
3. Team member sign-up: webhook checks `public_metadata.groomr_team_invite === true`, links `team_members` row and grants `groomer` role
4. `/dashboard` reads `profiles.roles` and redirects: `groomer` → `/dashboard/groomer`, otherwise → `/dashboard/owner`
5. Server actions/components get Clerk user via `auth()` / `currentUser()`, then look up `profiles.id` by `clerk_id`
6. Race condition fallback: `getOrCreateProfile()` in `app/dashboard/owner/page.tsx`
7. Admin: `andrew@groomr.uk` has `is_admin = true` in `profiles` — set manually in Supabase

---

## Database

**Supabase Project ID:** `fvbxjwfxcbhjoidrmzgv`

### Custom Types
```sql
CREATE TYPE user_role            AS ENUM ('owner', 'groomer', 'admin');
CREATE TYPE appointment_status   AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE dog_size             AS ENUM ('small', 'medium', 'large', 'giant');
CREATE TYPE coat_type            AS ENUM ('short', 'medium', 'long', 'curly', 'double', 'wire');
CREATE TYPE payout_status        AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE refund_status        AS ENUM ('none', 'requested', 'approved', 'rejected', 'processed');
CREATE TYPE support_request_status AS ENUM ('open', 'in_progress', 'closed');
```

### Core Tables

#### `profiles`
```
id uuid PK | clerk_id text UNIQUE | full_name text | email text | phone text
avatar_url text | roles user_role[] DEFAULT '{owner}' | is_admin boolean | is_active boolean
```
> No FK to `auth.users` — intentional. Clerk is auth source of truth.

#### `groomer_profiles`
```
id uuid PK | user_id uuid → profiles
business_name text | tagline text | bio text | years_experience smallint
qualifications text | insurance_provider/policy_ref/doc_url text
address_line_1/2 text | city text | postcode text
location geography          -- PostGIS; insert: ST_MakePoint(lng, lat)::geography
travel_radius_miles smallint | is_mobile boolean
is_verified boolean DEFAULT false
is_listed boolean DEFAULT false
is_accepting_bookings boolean DEFAULT false   -- controls search visibility
is_founding_groomer boolean DEFAULT false     -- 0% commission for 6 months
stripe_account_id text
average_rating numeric | total_reviews integer
profile_image_url text | banner_image_url text | cover_photo_url text
deposit_type text DEFAULT 'none'              -- 'none' | 'percentage' | 'full'
deposit_percentage smallint | default_buffer_minutes smallint DEFAULT 0
bank_account_holder/sort_code/account_number text
public_slug text UNIQUE                       -- for /groomers/[slug] URLs
```

#### `dogs`
```
id uuid PK | owner_id uuid → profiles
name text NOT NULL | breed text | date_of_birth date | size dog_size | is_neutered boolean
coat_type coat_type | coat_notes text | temperament_notes text | health_notes text
vaccination_doc_url text | profile_image_url text
```

#### `services`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
name text NOT NULL | description text | duration_minutes smallint
price_pence integer NOT NULL     -- always ÷ 100 for display; pass integer to Stripe
deposit_pence integer | applicable_sizes dog_size[] | is_active boolean | sort_order smallint
```

#### `availability`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
day_of_week smallint NOT NULL    -- 0=Sunday … 6=Saturday
start_time time | end_time time
break_start_time time | break_end_time time    -- lunch/break window (NOT yet used in getAvailableSlots)
is_active boolean DEFAULT true
```

#### `availability_overrides`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
override_date date NOT NULL | is_available boolean DEFAULT false
start_time time | end_time time | reason text
```

#### `appointments`
```
id uuid PK | owner_id uuid → profiles | groomer_profile_id uuid → groomer_profiles
dog_id uuid → dogs (nullable — NULL for multi-pet group header)
service_id uuid → services
service_snapshot_name text | service_snapshot_duration smallint | service_snapshot_price integer
scheduled_at timestamptz NOT NULL | status appointment_status DEFAULT 'pending'
cancelled_by uuid → profiles | cancellation_reason text
groomer_notes text | owner_notes text
assigned_to_team_member_id uuid → team_members ON DELETE SET NULL
recurring_series_id uuid → recurring_series ON DELETE SET NULL
booking_group_id uuid    -- shared by all appointments in a group booking
```

#### `payments`
```
id uuid PK | appointment_id uuid → appointments
stripe_payment_intent_id text | deposit_amount_pence integer | deposit_paid_at timestamptz | deposit_status text
full_payment_intent_id text | full_amount_pence integer | full_payment_paid_at timestamptz
platform_fee_pence integer | platform_fee_pct numeric | groomer_payout_amount_pence integer
stripe_transfer_id text | payout_status payout_status | payout_initiated_at timestamptz
refund_status refund_status | refund_amount_pence integer | stripe_refund_id text | refunded_at timestamptz
currency char(3) DEFAULT 'gbp'
```

#### `reviews`
```
id uuid PK | appointment_id uuid UNIQUE → appointments
owner_id uuid → profiles | groomer_profile_id uuid → groomer_profiles
rating smallint NOT NULL CHECK (1–5) | body text | is_visible boolean DEFAULT true
groomer_reply text | groomer_replied_at timestamptz
```

#### `messages`
```
id uuid PK | appointment_id uuid → appointments
sender_id uuid → profiles | body text NOT NULL
is_system boolean DEFAULT false | read_at timestamptz
```

#### `team_members`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
name text NOT NULL | role text NOT NULL | since_year smallint | public_slug text UNIQUE
average_rating numeric | total_reviews integer | email text
user_id uuid → profiles ON DELETE SET NULL
invite_status text DEFAULT 'pending'    -- pending | accepted | revoked
clerk_invitation_id text | invited_at timestamptz | accepted_at timestamptz
```

#### `portfolio_photos`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
url text NOT NULL | caption text | sort_order smallint DEFAULT 0
```

#### `time_blocks`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
start_date date NOT NULL | end_date date NOT NULL
start_time time | end_time time | all_day boolean DEFAULT true | reason text
```
> Groomer-declared unavailability. **NOT yet wired into `getAvailableSlots()`** — currently ignored during booking.

#### `favourite_groomers`
```
id uuid PK | owner_id uuid → profiles | groomer_profile_id uuid → groomer_profiles
UNIQUE (owner_id, groomer_profile_id)
```

#### `notifications`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
type text    -- 'new_appointment' | 'cancelled_appointment' | 'rescheduled_appointment'
             --  | 'new_review' | 'payout_processed' | 'new_client'
title text NOT NULL | body text NOT NULL | metadata jsonb DEFAULT '{}'
read_at timestamptz
```

#### `client_settings`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles | owner_id uuid → profiles
deposit_override text DEFAULT 'inherit'    -- 'inherit' | 'none'
discount_percentage smallint (0–100, nullable)
UNIQUE (groomer_profile_id, owner_id)
```

#### `client_service_prices`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
owner_id uuid → profiles | service_id uuid → services
override_price_pence integer NOT NULL
UNIQUE (groomer_profile_id, owner_id, service_id)
```
> Pricing resolution order in `createAppointment`: `client_service_prices` fixed override → `client_settings.discount_percentage` → standard `services.price_pence`.

#### `recurring_series`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles | owner_id uuid → profiles
dog_id uuid → dogs (nullable) | service_id uuid → services (nullable)
frequency text    -- 'weekly' | 'bi-weekly' | '4-weekly' | 'monthly'
preferred_day_of_week smallint (0–6) | preferred_time time
end_date date (NULL = ongoing rolling 6-month window)
status text DEFAULT 'pending_approval'    -- 'pending_approval' | 'active' | 'cancelled'
requested_by text    -- 'owner' | 'groomer'
service_snapshot_name/duration/price | last_generated_at date
```

#### `contract_terms`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
version integer NOT NULL | content text NOT NULL | is_current boolean DEFAULT false
published_at timestamptz
UNIQUE (groomer_profile_id, version)
```

#### `contract_acceptances`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
owner_id uuid → profiles | contract_terms_id uuid → contract_terms
accepted_at timestamptz
UNIQUE (groomer_profile_id, owner_id, contract_terms_id)
```

#### `tips`
```
id uuid PK | appointment_id uuid → appointments
owner_id uuid → profiles | groomer_profile_id uuid → groomer_profiles
amount_pence integer NOT NULL | stripe_payment_intent_id text UNIQUE
status text DEFAULT 'pending'    -- 'pending' | 'succeeded' | 'failed'
```

#### `support_requests`
```
id uuid PK | profile_id uuid → profiles (nullable)
name text | email text | subject text | message text
status support_request_status DEFAULT 'open' | admin_reply text
```

### Migrations

26 files in `supabase/migrations/`. All must be applied to the remote DB via `supabase db push` or Supabase Dashboard SQL editor (see gotcha below about MCP).

---

## Row Level Security (RLS)

RLS is enabled on all tables. Policies use this helper — **not** `auth.uid()`:

```sql
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')
$$;
```

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Own + admin | — (webhook via supabaseAdmin) | Own | — |
| `groomer_profiles` | Public | Own (via `user_id`) | Own | Own |
| `dogs` | Own + admin | Own | Own | Own |
| `services` | Public | Own groomer | Own groomer | Own groomer |
| `availability` / `overrides` | Public | Own groomer | Own groomer | Own groomer |
| `appointments` | Own (owner/groomer/assigned team) + admin | Owner only | Owner + groomer + team | — |
| `payments` | Via appointment + admin | supabaseAdmin only | supabaseAdmin only | — |
| `reviews` | Public (visible) + own + admin | Owner | Owner (body) + groomer (reply) | — |
| `messages` | Appointment participants | Participant | Participants | — |
| `team_members` | Salon owner + self | Salon owner | Salon owner | Salon owner |
| `favourite_groomers` | Own | Own | — | Own |
| `notifications` | Own groomer | supabaseAdmin | — | — |
| `client_settings` | Own groomer + own owner | Own groomer | Own groomer | Own groomer |
| `client_service_prices` | Own groomer + own owner | Own groomer | Own groomer | Own groomer |
| `recurring_series` | Own owner + own groomer | Own owner | Own groomer | — |
| `contract_terms` | Public (is_current) + own groomer | Own groomer | Own groomer | Own groomer |
| `contract_acceptances` | Own owner + own groomer | Own owner | — | — |
| `tips` | Own owner + own groomer | Own owner | — | — |
| `support_requests` | Own + admin | Own | — | — (admin only) |
| `portfolio_photos` | Public | Own groomer | Own groomer | Own groomer |
| `time_blocks` | Own groomer | Own groomer | Own groomer | Own groomer |

Every table has an `admin_all` policy for `is_admin = true`.

> **Admin UI must use the anon client** — `supabaseAdmin` bypasses RLS, so `admin_all` policies never fire when using it.

---

## Server Actions

All in `app/actions/`. Pattern: `"use server"`, return `{ data } | { error: string }`, never throw.

| File | Key exports |
|---|---|
| `admin.ts` | `getAdminOverviewStats`, `getAllUsers`, `getAllGroomers`, `getAllSupportRequests`, `getAllDisputes`, `verifyGroomer`, `updateDisputeStatus` |
| `appointments.ts` | `getOwnerAppointments`, `getGroomerAppointments`, `createAppointment` |
| `booking.ts` | `getAvailableSlots(groomerProfileId, serviceId, dateStr)`, `createAppointment`, `createGroupAppointment` |
| `client-settings.ts` | `getClientSettings`, `getClientTermsStatus`, `saveClientPricing` |
| `close-account.ts` | `closeOwnerAccount`, `closeGroomerAccount`, `exportAccountData` |
| `contact.ts` | `sendContactInquiry`, `contactUser` |
| `contract-terms.ts` | `getContractTerms`, `checkTermsAcceptance`, `acceptContractTerms`, `saveContractTerms` |
| `dogs.ts` | `getDogs`, `addDog`, `updateDog`, `deleteDog` |
| `favourites.ts` | `getFavouriteGroomers`, `addFavourite`, `removeFavourite` |
| `groomer-registration.ts` | `registerGroomer`, `getInsuranceUploadSignature`, `getVerificationDocSignature` |
| `groomer.ts` | `getGroomerProfile`, `saveGroomerProfile`, `updateGroomerProfile`, `toggleAcceptingBookings` |
| `messages.ts` | `getGroomerMessageThreads`, `getOwnerMessageThreads`, `getMessagesForAppointment`, `sendMessage`, `getOrCreateConversationWithGroomer`, `deleteThread`, `markThreadRead` |
| `notifications.ts` | `getNotificationsNavContext`, `getGroomerNotifications`, `markNotificationRead`, `markAllNotificationsRead` |
| `payments.ts` | `createBookingPaymentIntent`, `getConnectAccountStatus`, `initiateRefund` |
| `portfolio.ts` | `getPortfolioPhotos`, `getPortfolioUploadSignature`, `addPortfolioPhoto`, `deletePortfolioPhoto`, `updatePortfolioCaption` |
| `profile-editor.ts` | `loadProfileEditorData`, `saveProfile`, `saveAvailability`, `saveServices`, `saveProfileImage`, `saveCoverPhoto`, etc. |
| `recurring.ts` | `requestRecurringSeries`, `createGroomerRecurringSeries`, `approveRecurringSeries`, `declineRecurringSeries`, `generateRecurringAppointments`, `rollActiveRecurringSeries`, `getSeriesStatus`, `ownerCancelRecurringSeries` |
| `sms-preferences.ts` | `getSMSPreference`, `updateSMSPreference` |
| `stripe-connect.ts` | `createConnectOnboardingLink`, `createConnectDashboardLink` |
| `support.ts` | `sendSupportRequest`, `replyToSupportRequest`, `updateSupportRequest` |
| `team-members.ts` | `inviteTeamMember`, `removeTeamMember`, `saveTeamMembers` |
| `time-blocks.ts` | `createTimeBlock`, `getTimeBlocks`, `deleteTimeBlock` |
| `tips.ts` | `createTipPaymentIntent`, `getOwnerTips` |

### Booking logic notes
- `getAvailableSlots` uses: weekly schedule + date overrides + confirmed appointments. It does **not** yet factor in `time_blocks` or `break_start_time`/`break_end_time`.
- `createAppointment` resolves pricing: `client_service_prices` fixed override → `client_settings.discount_percentage` → standard price.
- `createAppointment` fires both email (Resend) and SMS (Twilio) confirmations after insert.
- `createGroupAppointment` books multiple dogs back-to-back; all rows share a `booking_group_id`.

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

# Twilio (SMS)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# Cron
CRON_SECRET=                        # Random secret; set in Vercel; authenticates /api/cron/notifications

# PostHog (future)
NEXT_PUBLIC_POSTHOG_KEY=
```

---

## Known Gotchas

| Issue | Detail |
|---|---|
| `localhost` tunnel latency | Use **ngrok** (`ngrok http 3000`) for Clerk/Stripe webhooks — VS Code port forwarding too slow |
| `auth.uid()` in RLS | References Supabase Auth — doesn't work. Use `get_clerk_user_id()` |
| Prices in pence | All `*_pence` / `*_amount_pence` are integers — divide by 100 for display; pass integer to Stripe |
| `supabaseAdmin` bypasses RLS | Service role skips all policies — only use server-side, never in client components |
| Supabase MCP project mismatch | MCP resolves to project `pbqgppbierllialjjhkm` ("Unhinged Development Group"), NOT `fvbxjwfxcbhjoidrmzgv` (the app). Never apply migrations via MCP — use `supabase db push` or Supabase dashboard SQL editor |
| `searchParams` in Next.js 16 | Must be awaited: `const params = searchParams ? await searchParams : {}` |
| Supabase Realtime | `supabaseAdmin` doesn't support Realtime — use anon client (`lib/supabase.ts`) in client components for `channel().on(...)` |
| PostGIS via Supabase JS | `.select()` can't call `ST_X`/`ST_Y` — use `.rpc()` with a Postgres function |
| `@vis.gl/react-google-maps` SSR | Import via `next/dynamic` with `{ ssr: false }` |
| Two Google Maps env vars | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (browser); `GOOGLE_MAPS_API_KEY` (server geocoding) |
| Supabase join returns array | `.select('*, profiles(full_name)')` — `profiles` is an array even on FK-to-single-row joins |
| CSS cascade layers | Unlayered CSS beats `@layer utilities` — wrap base/typography rules in `@layer base` in `globals.css` |
| Next.js 16 middleware | `proxy.ts` not `middleware.ts` — all route protection goes in `proxy.ts` |
| Clerk `SignInButton`/`SignUpButton` | Take exactly one child element |
| Cloudinary in Next.js | `res.cloudinary.com` must be in `remotePatterns` in `next.config.ts` (already configured) |
| `time_blocks` not in booking | `getAvailableSlots` doesn't check `time_blocks` table — blocked dates are NOT enforced in booking flow yet |
| `break_start/end_time` not in booking | `availability` break columns exist but `getAvailableSlots` doesn't subtract them — breaks don't block slots |
| Admin UI uses anon client | `supabaseAdmin` bypasses `admin_all` RLS policies — admin pages must use the anon client to trigger those policies correctly |

---

## Design System

Lives entirely in `app/globals.css`:
- `@theme inline` maps CSS custom properties to Tailwind utilities
- Global utility classes: `.btn-primary`, `.btn-secondary`, `.btn-gold-on-dark`, `.field`, `.focus-ring`, `.card-lift`, `.modal-backdrop`, `.shadow-modal`, `.text-link`, `.page-fade`, `.toast-in`

**Brand palette:** `groomr-gold` (#eae45c), `deep-slate` (#2c3e50), `sage-leaf` (#88a096), `pebble-grey` (#95a5a6), `alabaster-cream` (#f9f8f4), `muted-terracotta` (#c87964)

**Typography:** `font-fredoka` (display/headings), `font-nunito` (body) — loaded from `/public/fonts/` as variable fonts.

### Icon System

All icons in `components/ui/GroomrIcons.tsx`. Do not import from `lucide-react` for anything with a Groomr equivalent.

- **Brand icons** (15): splash circle + stroke glyph. Gold splash = `CalendarIcon`, `PetsIcon`, `DashboardIcon`, `GalleryIcon`, `NotificationsIcon`, `AnalyticsIcon`, `FinancialsIcon`, `SettingsIcon`, `AccountIcon`, `ShieldIcon`. Terracotta splash = `ScissorsIcon`, `PinIcon`, `MessagesIcon`, `FavoritesIcon`, `ReviewsIcon`.
- **Utility icons** (15): plain stroke, `currentColor` — `SearchIcon`, `CloseIcon`, `ChevronDownIcon`, `ChevronRightIcon`, `ChevronLeftIcon`, `ClockIcon`, `PlusIcon`, `MenuIcon`, `CheckIcon`, `HeartIcon` (accepts `filled?: boolean`), `MessageIcon`, `UploadIcon`, `PencilIcon`, `TrashIcon`, `StarIcon`
- All accept `size?: number` (default 24) and `className?: string`

### Shared UI Components (`components/ui/`)

- `Modal` — Escape to close, body scroll lock, backdrop click to dismiss
- `Toast` — auto-dismisses after 3.5 s
- `SearchPill` — controlled or uncontrolled; `size="sm"|"lg"`
- `StarRow` — 5 stars with fractional opacity for unlit stars
- `GroomerCard` — card with save/favourite toggle
- `BreedSelect` — dog breed dropdown (uses `lib/dog-breeds.ts`)
- `Eyebrow`, `Badge`, `Button`, `Chip`

---

## App Routes & Page Docs

Each page has a dedicated reference doc in `documents/pages/`. Read the relevant doc before editing a page.

| Route | Doc | Notes |
|---|---|---|
| `/` | [`documents/pages/landing-page.md`](documents/pages/landing-page.md) | Static marketing |
| `/become-a-groomer` | [`documents/pages/become-a-groomer.md`](documents/pages/become-a-groomer.md) | Static groomer acquisition |
| `/founder` | [`documents/pages/founder.md`](documents/pages/founder.md) | Founder letter |
| `/search` | [`documents/pages/search.md`](documents/pages/search.md) | PostGIS + Google Maps |
| `/groomers/[id]` | — | Public groomer profile (slug-based) |
| `/groomers/[id]/terms` | — | Groomer's custom contract terms |
| `/register/groomer` | [`documents/pages/register-groomer.md`](documents/pages/register-groomer.md) | 6-step registration wizard |
| `/dashboard` | [`documents/pages/dashboard-redirect.md`](documents/pages/dashboard-redirect.md) | Role-based redirect only |
| `/dashboard/owner` | [`documents/pages/dashboard-owner.md`](documents/pages/dashboard-owner.md) | Dog CRUD, appointments, favourites |
| `/dashboard/owner/messages` | — | Owner messaging UI |
| `/dashboard/groomer` | [`documents/pages/dashboard-groomer.md`](documents/pages/dashboard-groomer.md) | 5-tab groomer back-office |
| `/dashboard/groomer/messages` | [`documents/pages/dashboard-groomer-messages.md`](documents/pages/dashboard-groomer-messages.md) | Real-time messaging |
| `/dashboard/groomer/notifications` | — | Notification preferences |
| `/dashboard/groomer/portfolio` | — | Photo gallery management |
| `/dashboard/admin` | — | Admin: verification queue, disputes, moderation |
| `/terms`, `/privacy-policy`, `/cookie-policy`, `/verification-policy`, `/acceptable-use` | — | Legal pages |

**API Routes:**

| Route | Purpose |
|---|---|
| `/api/webhooks/clerk` | Clerk → Supabase user sync |
| `/api/webhooks/stripe` | Stripe payment + account events |
| `/api/calendar/[groomerProfileId]` | Calendar availability endpoint |
| `/api/cron/notifications` | Daily cron at 08:00 UTC (`vercel.json`): booking reminders + review requests |

---

## Feature Status

| Feature | Status |
|---|---|
| Dog CRUD (owner dashboard) | Real — Supabase + Cloudinary |
| Appointments + Favourites (owner) | Real — Supabase |
| Groomer registration wizard | Real — writes to `groomer_profiles` |
| Groomer profile editor + team | Real — live Supabase writes |
| Groomer reviews tab | Real — display + reply wired |
| Messages (groomer + owner) | Real — Supabase Realtime, direct + appointment threads |
| Notifications (groomer) | Real — `notifications` table + Realtime badge |
| Booking flow | Real — 5-step modal, Stripe PaymentElement, group bookings |
| Stripe Connect | Real — Express onboarding, destination charges, 8% fee |
| Transactional emails | Real — Resend (6 templates, daily cron) |
| SMS notifications | Real — Twilio (booking confirmation, reminders) |
| Recurring bookings | Real — `recurring_series` table, approval workflow |
| Contract terms | Real — versioned groomer terms + owner acceptance |
| Client pricing overrides | Real — per-client discount % + per-service fixed price |
| Tips | Real — `tips` table + Stripe PaymentIntent |
| Portfolio photos | Real — `app/dashboard/groomer/portfolio/`, Cloudinary |
| Public groomer profiles | Real — `/groomers/[id]` (slug-based) |
| Admin dashboard | Real (partial) — `/dashboard/admin`, verification + support |
| Support requests | Real — `support_requests` table, admin replies |
| `time_blocks` → booking conflicts | Table + UI built; **not yet wired into `getAvailableSlots()`** |
| Break windows in booking | `break_start/end_time` on `availability`; **not yet used in slot generation** |
| Groomer bookings/clients/earnings tabs | Mock data only |
| Team member appointment assignment UI | `assigned_to_team_member_id` column exists; no UI yet |
| PostHog analytics | Not built |
| Google Calendar sync | Not built |
