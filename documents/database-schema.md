# Database Schema Reference

Full column listings for all Supabase tables. See `CLAUDE.md` for custom types, RLS policies, and behavioural notes.

**Supabase Project ID:** `fvbxjwfxcbhjoidrmzgv`

---

## Core Tables

### `profiles`
```
id uuid PK | clerk_id text UNIQUE | full_name text | email text | phone text
avatar_url text | roles user_role[] DEFAULT '{owner}' | is_admin boolean | is_active boolean
is_deleted boolean DEFAULT false | deleted_at timestamptz    -- soft-delete (migration 20260607000004)
anonymised_at timestamptz    -- set by /api/cron/cleanup when PII is scrubbed (migration 20260610000001)
admin_preferences jsonb                                       -- pinned snapshot config (migration 20260606000001)
```
> No FK to `auth.users` — intentional. Clerk is auth source of truth.

### `groomer_profiles`
```
id uuid PK | user_id uuid → profiles
business_name text | tagline text | bio text | years_experience smallint
qualifications text | insurance_provider/policy_ref/doc_url text
address_line_1/2 text | city text | postcode text
location geography          -- PostGIS; insert: ST_MakePoint(lng, lat)::geography
travel_radius_miles smallint | is_mobile boolean
is_verified boolean DEFAULT false             -- legacy; superseded by verification_status
is_listed boolean DEFAULT false
is_accepting_bookings boolean DEFAULT false   -- controls search visibility
is_founding_groomer boolean DEFAULT false     -- status badge only (no fee implications since v2 incentive)
founding_until date                           -- LEGACY (migration 20260610000002) — no longer drives fees
verification_status verification_status DEFAULT 'not_submitted'   -- migration 20260607000001; replaces boolean is_verified
stripe_account_id text | stripe_charges_enabled boolean | stripe_details_submitted boolean   -- synced by account.updated webhook
average_rating numeric | total_reviews integer
profile_image_url text | banner_image_url text | cover_photo_url text
deposit_type text DEFAULT 'none'              -- 'none' | 'percentage' | 'full'
deposit_percentage smallint | default_buffer_minutes smallint DEFAULT 0
bank_account_holder/sort_code/account_number text
public_slug text UNIQUE                       -- for /groomers/[slug] URLs
```

### `dogs`
```
id uuid PK | owner_id uuid → profiles
name text NOT NULL | breed text | date_of_birth date | size dog_size | is_neutered boolean
coat_type coat_type | coat_notes text | temperament_notes text | health_notes text
vaccination_doc_url text | profile_image_url text
```

### `services`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
name text NOT NULL | description text               -- optional short description shown on public profile
duration_minutes smallint NOT NULL
price_pence integer NOT NULL     -- always ÷ 100 for display; pass integer to Stripe; auto-derived as MIN(size_prices) when sizes configured
deposit_pence integer | applicable_sizes dog_size[] | is_active boolean DEFAULT true | sort_order smallint DEFAULT 0
size_prices jsonb NOT NULL DEFAULT '{}'      -- migration 20260614000003: {xs,small,medium,large,xl} → pence; key presence = size enabled
size_durations jsonb NOT NULL DEFAULT '{}'   -- migration 20260614000004: {xs,small,medium,large,xl} → minutes; overrides duration_minutes per size
created_at timestamptz DEFAULT now() | updated_at timestamptz DEFAULT now()
```
> Duration display on public profile: if `size_durations` has entries, show `up to {MAX(size_durations)} min`; otherwise show `duration_minutes` as flat badge. Logic in `app/groomers/[id]/page.tsx` `ServiceCard` and `app/search/_components/GroomerProfileModal.tsx`.

### `availability`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
day_of_week smallint NOT NULL    -- 0=Sunday … 6=Saturday
start_time time | end_time time
break_start_time text | break_end_time text    -- changed time → text (migration 20260614000005); stores JSON array of breaks or legacy plain "HH:MM" string
is_active boolean DEFAULT true
```

### `availability_overrides`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
override_date date NOT NULL | is_available boolean DEFAULT false
start_time time | end_time time | reason text
```

### `appointments`
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
admin_note_groomer text | admin_note_groomer_author text    -- admin-only notes visible to groomer (migration 20260614000007)
admin_note_owner text | admin_note_owner_author text        -- admin-only notes visible to owner (migration 20260614000007)
```

### `payments`
```
id uuid PK | appointment_id uuid → appointments
stripe_payment_intent_id text | deposit_amount_pence integer | deposit_paid_at timestamptz | deposit_status text
full_payment_intent_id text | full_amount_pence integer | full_payment_paid_at timestamptz
platform_fee_pence integer | platform_fee_pct numeric | groomer_payout_amount_pence integer
stripe_transfer_id text | payout_status payout_status | payout_initiated_at timestamptz
refund_status refund_status | refund_amount_pence integer | stripe_refund_id text | refunded_at timestamptz
stripe_fee_pence integer DEFAULT 0    -- Stripe's own processing fee (migration 20260607000002)
currency char(3) DEFAULT 'gbp'
payment_method text DEFAULT 'stripe'  -- 'stripe' | 'gocardless' (migration 20260614000002)
gc_billing_request_id text            -- GoCardless billing request ID (migration 20260614000002)
gc_mandate_id text                    -- GoCardless mandate ID (migration 20260614000002)
gc_payment_id text                    -- GoCardless payment ID (migration 20260614000002)
```

### `reviews`
```
id uuid PK | appointment_id uuid UNIQUE → appointments
owner_id uuid → profiles | groomer_profile_id uuid → groomer_profiles
rating smallint NOT NULL CHECK (1–5) | body text | is_visible boolean DEFAULT true
groomer_reply text | groomer_replied_at timestamptz
```

### `messages`
```
id uuid PK | appointment_id uuid → appointments
sender_id uuid → profiles | body text NOT NULL
is_system boolean DEFAULT false | read_at timestamptz
```

### `team_members`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
name text NOT NULL | role text NOT NULL | since_year smallint | public_slug text UNIQUE
average_rating numeric | total_reviews integer | email text
user_id uuid → profiles ON DELETE SET NULL
invite_status text DEFAULT 'pending'    -- pending | accepted | revoked
invite_token uuid UNIQUE               -- generated server-side, passed in Clerk publicMetadata; matched atomically in user.created webhook
clerk_invitation_id text | invited_at timestamptz | accepted_at timestamptz
```

### `portfolio_photos`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
url text NOT NULL | caption text | sort_order smallint DEFAULT 0
```

### `time_blocks`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
start_date date NOT NULL | end_date date NOT NULL
start_time time | end_time time | all_day boolean DEFAULT true | reason text
```
> Groomer-declared unavailability. Wired into `getAvailableSlots()` and `createGroupAppointment()`: all-day blocks return no slots; partial-day blocks are treated as booked intervals.

### `favourite_groomers`
```
id uuid PK | owner_id uuid → profiles | groomer_profile_id uuid → groomer_profiles
UNIQUE (owner_id, groomer_profile_id)
```

### `notifications`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
type text    -- 'new_appointment' | 'cancelled_appointment' | 'rescheduled_appointment'
             --  | 'new_review' | 'payout_processed' | 'new_client'
title text NOT NULL | body text NOT NULL | metadata jsonb DEFAULT '{}'
read_at timestamptz
```

### `client_settings`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles | owner_id uuid → profiles
deposit_override text DEFAULT 'inherit'    -- 'inherit' | 'none'
discount_percentage smallint (0–100, nullable)
UNIQUE (groomer_profile_id, owner_id)
```

### `client_service_prices`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
owner_id uuid → profiles | service_id uuid → services
override_price_pence integer NOT NULL
UNIQUE (groomer_profile_id, owner_id, service_id)
```
> Pricing resolution order in `createAppointment`: `client_service_prices` fixed override → `client_settings.discount_percentage` → standard `services.price_pence`.

### `recurring_series`
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

### `contract_terms`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
version integer NOT NULL | content text NOT NULL | is_current boolean DEFAULT false
published_at timestamptz
UNIQUE (groomer_profile_id, version)
```

### `contract_acceptances`
```
id uuid PK | groomer_profile_id uuid → groomer_profiles
owner_id uuid → profiles | contract_terms_id uuid → contract_terms
accepted_at timestamptz
UNIQUE (groomer_profile_id, owner_id, contract_terms_id)
```

### `tips`
```
id uuid PK | appointment_id uuid → appointments
owner_id uuid → profiles | groomer_profile_id uuid → groomer_profiles
amount_pence integer NOT NULL | stripe_payment_intent_id text UNIQUE
status text DEFAULT 'pending'    -- 'pending' | 'succeeded' | 'failed'
```

### `disputes`
```
id uuid PK | owner_id uuid → profiles | groomer_id uuid → profiles
appointment_id uuid → appointments (nullable)
subject text | description text
status dispute_status
  -- base (migration 20260524): 'open' | 'in_review' | 'resolved'
  -- extended (migration 20260607000003): + 'pending' | 'awaiting_agreement' | 'awaiting_final_agreement' | 'final_review'
raised_by text    -- 'owner' | 'groomer'
owner_comment text | groomer_comment text
proposed_resolution text | resolution_proposed_at timestamptz
owner_agreed boolean | groomer_agreed boolean
final_resolution text | final_resolution_proposed_at timestamptz
owner_agreed_final boolean | groomer_agreed_final boolean
```
> Two-round resolution: admin proposes → parties agree/reject → if rejected, admin sends final resolution.
> `/disputes/[id]` renders party-scoped view via `getDisputeForParty()` in `app/actions/disputes.ts`.

### `support_requests`
```
id uuid PK | profile_id uuid → profiles (nullable)
name text | email text | subject text | message text
status support_request_status DEFAULT 'open' | admin_reply text
```

### `admin_audit_log`
```
id uuid PK | admin_profile_id uuid → profiles (ON DELETE SET NULL)
action text NOT NULL    -- e.g. 'verify_groomer' | 'cancel_appointment' | 'grant_admin' | etc.
target_table text | target_id text
metadata jsonb DEFAULT '{}'
created_at timestamptz (indexed DESC)
```
> Written by `logAdminAction()` in `app/actions/admin.ts` — fire-and-forget, non-fatal. Read by `adminGetAuditLog()`.

### `platform_settings`
```
id uuid PK
platform_fee_pct numeric DEFAULT 0.08        -- standard commission rate
signup_incentive_bookings integer DEFAULT 150 -- commission-free bookings per groomer (migration 20260612000001)
founding_groomer_fee_pct numeric DEFAULT 0.00 -- LEGACY — no longer drives fees
founding_groomer_deadline date               -- LEGACY — no longer drives fees
updated_at timestamptz | updated_by uuid → profiles
```
> Singleton table (one row). Seeded by migration. Read/written via `adminGetPlatformSettings` / `adminSavePlatformSettings`. The Stripe payment flow reads rates from this table at charge time via `resolvePlatformFeePct()` in `lib/fees.ts`: 0% while the groomer's completed-booking count (minus full refunds) is below `signup_incentive_bookings`, then `platform_fee_pct` — admin changes apply to new payments immediately, no redeploy. `PLATFORM_FEE_PCT` in `lib/stripe.ts` is only the fallback if the row is unreadable. Each `payments` row records the pct actually charged.

### `account_export_tokens`
```
id uuid PK | profile_id uuid → profiles ON DELETE CASCADE
token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid()
expires_at timestamptz NOT NULL | created_at timestamptz DEFAULT now()
```
> Short-lived tokens for the account data export flow (migration `20260614000001`). Only accessed via `supabaseAdmin` (service role) — no user-facing RLS policies.
