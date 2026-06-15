# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

**Groomr** is a two-sided UK marketplace connecting dog owners with independent groomers. UK-first, Glasgow/Edinburgh launch. Pre-revenue, in active development. Business model: 8% commission on bookings. **Sign-up incentive:** every groomer's first 150 completed bookings are commission-free (see `public/policies/groomer-sign-up-incentive.html`). **Founding groomer** (registered within 3 months of launch) is a permanent status badge + £49 onboarding package — no special commission rate.

---

## Commands

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build + TypeScript check
npm run lint     # ESLint
npx react-email dev --dir lib/emails    # preview email templates in browser
ngrok http 3000                          # expose localhost for Clerk/Stripe webhooks
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
| **Cloudinary** | ^2.10.0 | Dog/groomer photos and portfolio. CDN: `res.cloudinary.com/dr8adq7nl`. **Not used for verification docs** — those go to Supabase Storage. |
| **Supabase Storage** | (via supabase-js) | Private bucket `verification-docs` for groomer verification documents (insurance, photo ID, etc.). Signed upload URLs (PUT) from server; signed download URLs (1h TTL) generated at load time in `loadProfileEditorData` and `adminGetGroomerFull`. Paths stored in DB, not full URLs. |
| **Google Maps** | ^1.8.3 | `@vis.gl/react-google-maps` (client, `ssr:false`) + server-side geocoding |
| **Stripe Connect** | ^22.1.1 | Destination charges, 8% platform fee. `lib/stripe.ts` (server), `lib/stripe-client.ts` (browser). See `documents/stripe-setup.md` |
| **Resend** | ^6.12.3 | Transactional email. `lib/resend.ts`, templates in `lib/emails/`. FROM: `notifications@groomr.uk` |
| **React Email** | @react-email/components + @react-email/render | Email templates as React components. Preview: `npx react-email dev --dir lib/emails`. Each template: named component + `render*()` async fn + default export preview wrapper with hardcoded data |
| **Twilio** | ^6.0.2 | SMS notifications. `lib/sms/client.ts` + `lib/sms/send.ts` |
| **GoCardless** | REST API (no SDK) | Direct Debit payments. `lib/gocardless.ts` = thin fetch client. Server actions: `app/actions/payments-gocardless.ts`. Webhook: `/api/webhooks/gocardless`. Payments land in Groomr's bank account; groomer payouts tracked in `payments.groomer_payout_amount_pence` and must be initiated out-of-band (Stripe Connect transfer without a charge, or manual bank transfer). |

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
| `lib/stripe.ts` | Server Stripe client + `calcPlatformFee(pence, pct)` / `calcGroomerPayout(pence, pct)`. `PLATFORM_FEE_PCT = 0.08` is the **fallback only** |
| `lib/fees.ts` | `resolvePlatformFeePct(groomerProfileId)` — 0% while the sign-up incentive lasts (first `signup_incentive_bookings` completed, not-fully-refunded bookings), then live `platform_settings.platform_fee_pct`. Also `getIncentiveUsage()` for UI |
| `lib/stripe-client.ts` | Browser Stripe client (`getStripeClient()`) |
| `lib/resend.ts` | Resend email client |
| `lib/utils.ts` | `cn()` — classname merger (clsx + tailwind-merge) |
| `lib/slug.ts` | `toSlug()`, `generateUniqueGroomerSlug()` |
| `lib/dog-breeds.ts` | `DOG_BREEDS: string[]` — comprehensive breed list |
| `lib/search.ts` | Groomer search (PostGIS + Google Maps geocoding) |
| `lib/emails/send.ts` | Email dispatch functions |
| `lib/emails/components/Layout.tsx` | Shared React Email wrapper — slate header band with gold Cloudinary logo, card, footer. Brand `colors` exported from here |
| `lib/emails/components/DetailRow.tsx` | Label/value row component used in appointment detail blocks |
| `lib/emails/booking-confirmation-owner.tsx` | Owner booking confirmation template |
| `lib/emails/appointment-cancelled.tsx` | Cancellation template (sent to both owner and groomer) |
| `lib/emails/appointment-reminder.tsx` | 24h reminder template |
| `lib/emails/groom-complete.tsx` | Pickup-ready + tip CTA template |
| `lib/emails/review-reminder.tsx` | Post-groom review request template |
| `lib/sms/client.ts` | Twilio client wrapper |
| `lib/sms/send.ts` | SMS dispatch: `sendBookingConfirmationSMS()` etc. |

---

## Auth & Role Architecture

1. Clerk handles all auth (email + Google OAuth)
2. On `user.created`: webhook (`/api/webhooks/clerk`) creates `profiles` row with `roles = {owner}`
3. Team member sign-up: webhook checks `public_metadata.groomr_team_invite === true` **and** `invite_token` (UUID stored on `team_members`, passed through Clerk `publicMetadata`). Webhook does a single atomic `UPDATE … WHERE invite_token = ? AND invite_status = 'pending'` — eliminates the email-spoof and concurrent-webhook race (S15)
4. `/dashboard` reads `profiles.roles` and redirects: `groomer` → `/dashboard/groomer`, otherwise → `/dashboard/owner`
5. Server actions/components get Clerk user via `auth()` / `currentUser()`, then look up `profiles.id` by `clerk_id`
6. Race condition fallback: `getOrCreateProfile()` in `app/dashboard/owner/page.tsx`
7. Admin: `andrew@groomr.uk` has `is_admin = true` in `profiles` — set manually in Supabase

---

## Database

**Supabase Project ID:** `fvbxjwfxcbhjoidrmzgv`

### Custom Types
```sql
CREATE TYPE user_role              AS ENUM ('owner', 'groomer', 'admin');
CREATE TYPE appointment_status     AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE dog_size               AS ENUM ('xs', 'small', 'medium', 'large', 'xl');
CREATE TYPE coat_type              AS ENUM ('smooth', 'double', 'long', 'wire', 'curly', 'hairless');
CREATE TYPE payout_status          AS ENUM ('pending', 'initiated', 'paid', 'failed');
CREATE TYPE refund_status          AS ENUM ('none', 'partial', 'full', 'failed');
CREATE TYPE support_request_status AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE verification_status    AS ENUM ('not_submitted', 'awaiting', 'verified', 'revoked_temp', 'revoked_perm');
-- dispute_status base: 'open', 'in_review', 'resolved' — extended by migration 20260607000003 with:
-- 'pending', 'awaiting_agreement', 'awaiting_final_agreement', 'final_review'
```

### Core Tables

Full column listings: [`documents/database-schema.md`](documents/database-schema.md)

| Table | Key notes |
|---|---|
| `profiles` | `clerk_id` is auth link. No FK to `auth.users`. Soft-delete: `is_deleted`/`deleted_at`. PII scrub: `anonymised_at`. |
| `groomer_profiles` | `location geography` (PostGIS). `verification_status` enum replaces legacy `is_verified` bool. `is_accepting_bookings` controls search visibility. `public_slug` for URLs. Stripe synced via `account.updated` webhook. |
| `dogs` | `owner_id → profiles`. Coat/health metadata, vaccination doc URL. |
| `services` | `size_prices`/`size_durations` jsonb for per-size config. `price_pence` = MIN(size_prices) when sizes set. Duration badge shows `up to {max} min` when `size_durations` has entries. |
| `availability` | `break_start_time` is `text` (JSON array or legacy `"HH:MM"`), not `time` — migration 20260614000005. |
| `availability_overrides` | Date-specific overrides; supersede weekly schedule. |
| `appointments` | `booking_group_id` shared across group bookings. `service_snapshot_*` frozen at booking time. `admin_note_groomer/owner` + author cols (migration 20260614000007). |
| `payments` | All amounts in pence. `payment_method`: `'stripe'`\|`'gocardless'`. Records `platform_fee_pct` actually charged. GoCardless fields: `gc_billing_request_id`, `gc_mandate_id`, `gc_payment_id`. |
| `reviews` | `is_visible` for moderation. Groomer can add `groomer_reply`. |
| `messages` | Real-time via Supabase Realtime. `is_system` for automated messages. |
| `team_members` | `invite_token uuid UNIQUE` matched atomically in `user.created` webhook. `invite_status`: pending\|accepted\|revoked. |
| `portfolio_photos` | Cloudinary URLs. `sort_order` for display. |
| `time_blocks` | Groomer-declared unavailability. All-day → no slots. Partial-day → treated as booked interval. |
| `favourite_groomers` | UNIQUE (owner_id, groomer_profile_id). |
| `notifications` | Groomer-only. Types: `new_appointment`, `cancelled_appointment`, `rescheduled_appointment`, `new_review`, `payout_processed`, `new_client`. |
| `client_settings` | Per-owner deposit override (`inherit`\|`none`) + discount %. |
| `client_service_prices` | Per-service fixed price per owner. Pricing priority: this → `client_settings.discount_percentage` → `services.price_pence`. |
| `recurring_series` | frequency: `weekly`\|`bi-weekly`\|`4-weekly`\|`monthly`. Rolling 6-month window when `end_date` is NULL. |
| `contract_terms` | Versioned; `is_current` = one active version per groomer. |
| `contract_acceptances` | Owner acceptance per groomer contract version. |
| `tips` | status: `pending`\|`succeeded`\|`failed`. |
| `disputes` | Two-round resolution. Extended statuses (migration 20260607000003): `pending`, `awaiting_agreement`, `awaiting_final_agreement`, `final_review`. Party-scoped view via `getDisputeForParty()`. |
| `support_requests` | `profile_id` nullable (anonymous submissions). |
| `admin_audit_log` | Append-only. Written by `logAdminAction()` in `app/actions/admin.ts`. Indexed `created_at DESC`. |
| `platform_settings` | Singleton. `signup_incentive_bookings = 150`. `platform_fee_pct = 0.08`. LEGACY cols: `founding_groomer_fee_pct`, `founding_groomer_deadline`. Rate changes apply immediately — no redeploy needed. |
| `account_export_tokens` | Short-lived export tokens. Service role only — no user RLS. |

### Migrations

44 files in `supabase/migrations/`. Apply via the Supabase MCP `apply_migration` tool (always pass `project_id: 'fvbxjwfxcbhjoidrmzgv'` explicitly) or the Supabase Dashboard SQL editor.

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
| `admin_audit_log` | Admin only | supabaseAdmin (via `logAdminAction`) | — | — |
| `platform_settings` | Admin only | — | Admin only | — |
| `account_export_tokens` | supabaseAdmin only | supabaseAdmin only | — | — |

Every table has an `admin_all` policy for `is_admin = true`.

> **Admin UI must use the anon client** — `supabaseAdmin` bypasses RLS, so `admin_all` policies never fire when using it.

---

## Server Actions

All in `app/actions/`. Pattern: `"use server"`, return `{ data } | { error: string }`, never throw.

| File | Key exports |
|---|---|
| `admin.ts` | `getAdminOverviewStats`, `getAllGroomers`, `getAllUsers`, `getAllDisputes`, `getAllSupportRequests`, `verifyGroomer`, `updateGroomerProfile`, `updateUserProfile`, `updateDisputeStatus`, `replyToSupportRequest`, `contactUser`, `adminGetGroomerFull`, `adminGetDogsFull`, `adminAddDog`, `adminUpdateDog`, `adminDeleteDog`, `adminGetServices`, `adminSaveService`, `adminDeleteService`, `adminGetAppointments`, `adminCancelAppointment`, `adminGetPreferences`, `adminSavePreferences`, `adminGetFinancials`, `adminGetTeam`, `adminRevokeAdmin`, `adminGrantAdmin`, `adminFindProfileByEmail`, `adminGetPlatformSettings`, `adminSavePlatformSettings`, `adminGetAuditLog`, `adminGetAnalytics` |
| `appointments.ts` | `getOwnerAppointments`, `getGroomerAppointments`, `createAppointment` |
| `booking.ts` | `getAvailableSlots(groomerProfileId, serviceId, dateStr)`, `createAppointment`, `createGroupAppointment` |
| `client-settings.ts` | `getClientSettings`, `getClientTermsStatus`, `saveClientPricing` |
| `close-account.ts` | `closeOwnerAccount`, `closeGroomerAccount`, `exportAccountData` |
| `contact.ts` | `sendContactInquiry`, `contactUser` |
| `contract-terms.ts` | `getContractTerms`, `checkTermsAcceptance`, `acceptContractTerms`, `saveContractTerms` |
| `disputes.ts` | `getDisputeForParty`, `submitDisputeComment`, `respondToDisputeResolution` |
| `dogs.ts` | `getDogs`, `addDog`, `updateDog`, `deleteDog` |
| `favourites.ts` | `getFavouriteGroomers`, `addFavourite`, `removeFavourite` |
| `groomer-registration.ts` | `registerGroomer`, `getInsuranceUploadSignature`, `getVerificationDocSignature` |
| `groomer.ts` | `getGroomerProfile`, `saveGroomerProfile`, `updateGroomerProfile`, `toggleAcceptingBookings` |
| `messages.ts` | `getGroomerMessageThreads`, `getOwnerMessageThreads`, `getMessagesForAppointment`, `sendMessage`, `getOrCreateConversationWithGroomer`, `deleteThread`, `markThreadRead` |
| `notifications.ts` | `getNotificationsNavContext`, `getGroomerNotifications`, `markNotificationRead`, `markAllNotificationsRead` |
| `payments.ts` | `createBookingPaymentIntent`, `getConnectAccountStatus`, `initiateRefund` |
| `portfolio.ts` | `getPortfolioPhotos`, `getPortfolioUploadSignature`, `addPortfolioPhoto`, `deletePortfolioPhoto`, `updatePortfolioCaption` |
| `profile-editor.ts` | `loadProfileEditorData`, `saveProfile`, `saveAvailability`, `saveServices`, `saveProfileImage`, `saveCoverPhoto`, etc. `ServiceRow` (from `types/groomer-dashboard.ts`) carries `{ id, name, description, duration, price, sizePrices, sizeDurations, sortOrder }` |
| `recurring.ts` | `requestRecurringSeries`, `createGroomerRecurringSeries`, `approveRecurringSeries`, `declineRecurringSeries`, `generateRecurringAppointments`, `rollActiveRecurringSeries`, `getSeriesStatus`, `ownerCancelRecurringSeries` |
| `sms-preferences.ts` | `getSMSPreference`, `updateSMSPreference` |
| `stripe-connect.ts` | `createConnectOnboardingLink`, `createConnectDashboardLink` |
| `support.ts` | `sendSupportRequest`, `replyToSupportRequest`, `updateSupportRequest` |
| `team-members.ts` | `inviteTeamMember`, `removeTeamMember`, `saveTeamMembers` |
| `time-blocks.ts` | `createTimeBlock`, `getTimeBlocks`, `deleteTimeBlock` |
| `tips.ts` | `createTipPaymentIntent`, `getOwnerTips` |

### Booking logic notes
- `getAvailableSlots` uses: weekly schedule + date overrides + confirmed appointments + `time_blocks` + break windows (JSON array in `break_start_time`, legacy plain-string also parsed).
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
CRON_SECRET=                        # Random secret; set in Vercel; authenticates /api/cron/notifications + /api/cron/cleanup

# PostHog (future)
NEXT_PUBLIC_POSTHOG_KEY=

# GoCardless
GOCARDLESS_ACCESS_TOKEN=             # live_* or sandbox_* access token
GOCARDLESS_WEBHOOK_SECRET=           # Set in GoCardless dashboard → Developers → Webhooks
```

---

## Known Gotchas

| Issue | Detail |
|---|---|
| `localhost` tunnel latency | Use **ngrok** (`ngrok http 3000`) for Clerk/Stripe webhooks — VS Code port forwarding too slow |
| `auth.uid()` in RLS | References Supabase Auth — doesn't work. Use `get_clerk_user_id()` |
| Prices in pence | All `*_pence` / `*_amount_pence` are integers — divide by 100 for display; pass integer to Stripe |
| `supabaseAdmin` bypasses RLS | Service role skips all policies — only use server-side, never in client components |
| Supabase MCP project mismatch | MCP defaults to project `pbqgppbierllialjjhkm` ("Unhinged Development Group"), NOT `fvbxjwfxcbhjoidrmzgv` (the app). Always pass `project_id: 'fvbxjwfxcbhjoidrmzgv'` explicitly to every MCP tool call (`apply_migration`, `execute_sql`, etc.) |
| `searchParams` in Next.js 16 | Must be awaited: `const params = searchParams ? await searchParams : {}` |
| Supabase Realtime | `supabaseAdmin` doesn't support Realtime — use anon client (`lib/supabase.ts`) in client components for `channel().on(...)` |
| PostGIS via Supabase JS | `.select()` can't call `ST_X`/`ST_Y` — use `.rpc()` with a Postgres function |
| `@vis.gl/react-google-maps` SSR | Import via `next/dynamic` with `{ ssr: false }` |
| Two Google Maps env vars | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (browser); `GOOGLE_MAPS_API_KEY` (server geocoding) |
| Supabase join returns array | `.select('*, profiles(full_name)')` — `profiles` is an array even on FK-to-single-row joins |
| CSS cascade layers | Unlayered CSS beats `@layer utilities` — wrap base/typography rules in `@layer base` in `globals.css` |
| Next.js 16 proxy | `proxy.ts` not `middleware.ts` — all route protection goes in `proxy.ts`. In Next.js 16, `middleware.ts` is the deprecated name; `proxy.ts` is the correct convention. |
| Clerk `SignInButton`/`SignUpButton` | Take exactly one child element |
| Cloudinary in Next.js | `res.cloudinary.com` must be in `remotePatterns` in `next.config.ts` (already configured). `api.cloudinary.com` must be in CSP `connect-src` for client-side uploads (dog photos, profile image, portfolio, groomer registration). |
| Verification doc storage | Verification docs (insurance, photo ID, etc.) use **Supabase Storage** (`verification-docs` bucket, private), not Cloudinary. `getVerificationDocUploadUrl` returns a signed PUT URL; client uploads directly via XHR. `saveVerificationDoc` stores the storage path in DB and returns a 1h signed download URL. `resolveVerificationDocUrl` in both `profile-editor.ts` and `admin.ts` converts stored paths → signed URLs at load time. Legacy Cloudinary URLs (starting `https://`) pass through unchanged for backward compat. |
| `time_blocks` now in booking | `getAvailableSlots` checks `time_blocks` — all-day blocks return `[]`; partial-day blocks are booked intervals |
| `break_start/end_time` now `text`, not `time` | Migration `20260614000005` changed both columns from `time` to `text` to support JSON array format alongside legacy plain `"HH:MM"` strings. `getAvailableSlots` subtracts break windows; both JSON and legacy plain-string formats are parsed. |
| Admin UI uses anon client | `supabaseAdmin` bypasses `admin_all` RLS policies — admin pages must use the anon client to trigger those policies correctly |
| Clerk CSP domain | Clerk's FAPI is at `*.accounts.dev` (not `*.clerk.dev`) — both `script-src` and `connect-src` must include `https://*.accounts.dev` or `useUser()` never resolves and auth buttons vanish |
| `dangerouslyAllowSVG` removed | `next.config.ts` no longer allows SVG via Next.js Image — do not re-add for user-uploaded content |
| `NEXT_PUBLIC_*` env vars baked at build | Changing them in Vercel does nothing until a redeploy — they're compiled into the JS bundle. Same applies to CSP/headers in `next.config.ts` (written into the build's routes manifest) |
| `is_admin` protected by trigger | `protect_is_admin` BEFORE UPDATE trigger on `profiles` (migration `20260610000001`) blocks `is_admin` changes from anon/authenticated connections unless the actor is already an admin. Service role and dashboard are unaffected |
| Supabase select query narrows TS type | Supabase JS infers the return type from the column list in `.select("col1, col2, ...")`. If you add a field to the mapped object but forget to add it to the select string, TypeScript compiles locally but **fails the Vercel build** with "Property X does not exist". Always keep select strings in sync with what you map. |

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
| `/dashboard/admin` | — | Platform Control — User Management (Overview, Groomers, Users, Appointments, Disputes, Support) + Groomr Management (Financials, Team, Settings, Audit Log, Analytics, Support). Template for new tabs at `_templates/NewTab.tsx` |
| `/terms`, `/privacy-policy`, `/cookie-policy`, `/verification-policy`, `/acceptable-use` | — | Legal pages |
| `/support` | — | Public support page — FAQ accordion + contact form (routes to `support_requests` table) |
| `/dashboard/messages` | — | Role-based redirect: `groomer` → `/dashboard/groomer/messages`, else → `/dashboard/owner/messages` |

**API Routes:**

| Route | Purpose |
|---|---|
| `/api/webhooks/clerk` | Clerk → Supabase user sync |
| `/api/webhooks/stripe` | Stripe payment + account events |
| `/api/webhooks/gocardless` | GoCardless Direct Debit payment events |
| `/api/calendar/[groomerProfileId]` | Calendar availability endpoint |
| `/api/cron/notifications` | Daily cron (`vercel.json`: `"0 8 * * *"`): booking reminders + review requests + SMS reminders |
| `/api/cron/cleanup` | Daily cron (`vercel.json`: `"30 3 * * *"`): GDPR sweep of profiles soft-deleted >30 days — hard-delete (no financial records), anonymise (PII scrub, retention applies), or skip (open dispute). Logs to `admin_audit_log` |

---

## Feature Status

All features are live unless listed below.

### Not built

| Feature | Notes |
|---|---|
| PostHog analytics | Env vars set but no code integrated |
| Google Calendar sync (two-way inbound) | Blocking time in an external calendar does **not** block Groomr slots. Requires Google Calendar API OAuth 2.0 (`googleapis`), store `google_refresh_token` on `groomer_profiles`, poll/webhook the groomer's calendar, create `time_blocks` rows. Apple CalDAV (`tsdav`) is significantly more complex. Groomers can use manual time blocks in the meantime. |

### Planned

| Feature | Notes |
|---|---|
| **Incentive threshold notification** (groomer) | Policy §2 promises notification approaching 150-booking threshold; wire into booking-completion flow or daily cron (e.g. at 140 and 150) |
| **Vaccination & health reminders** (owner) | Store vaccine due-dates on `dogs`, email/SMS N days before expiry via Resend + Twilio; needs `dog_health_reminders` table or date fields on `dogs`, plus a cron job |
| **Booking receipt download** (owner) | PDF/HTML receipt per appointment via Resend on demand or post-completion |
| **Groomer comparison tool** (owner) | Pin 2–3 groomers from search, view side-by-side; pure UI on existing search + groomer data |
| **Waitlist management** (groomer) | `waitlist_entries` table; cancellation hook notifies groomer in slot order |
| **Weekly business summary email** (groomer) | Monday digest: revenue, bookings, new vs. repeat clients; one Resend template + cron extension, no new DB tables |
| **Per-client groom notes** (groomer) | Structured per-session notes linked to `appointments`; needs `groom_notes` table + bookings tab UI |
| **Revenue forecasting** (admin) | Project GMV 30/60/90 days from confirmed appointments + `service_snapshot_price`; card in Analytics or Financials tab |
| **Groomer onboarding funnel analytics** (admin) | `registration_events` table (or PostHog when integrated); funnel display in admin Analytics tab |
| **Fraud / anomaly alerts** (admin) | Flag: >3 owner cancellations/30 days, >20% dispute rate, unconfirmed payment intents; daily cron → `notifications@groomr.uk` |

---

## Security Backlog

> **Launch blocker — S16:** Production currently runs the Clerk **dev** instance (`full-jaguar-15.clerk.accounts.dev`) — strict usage caps + console warning banner. Fix: create a Clerk production instance (needs real domain + DNS), swap `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` / `CLERK_WEBHOOK_SECRET` in Vercel, update CSP hosts in `next.config.ts` to the new production FAPI domain.

All 15 other findings from the June 2026 security audit are resolved. ✅ See git history for details.
