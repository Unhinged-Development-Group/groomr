-- =============================================================================
-- GROOMR DATABASE SETUP
-- Run this entire file in the Supabase SQL Editor for project fvbxjwfxcbhjoidrmzgv
-- Creates the full schema + 6 mock groomers for testing
-- =============================================================================

-- PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('owner', 'groomer', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE dog_size AS ENUM ('xs', 'small', 'medium', 'large', 'xl'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE coat_type AS ENUM ('smooth', 'double', 'long', 'wire', 'curly', 'hairless'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE dispute_status AS ENUM ('open', 'in_review', 'resolved'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payout_status AS ENUM ('pending', 'initiated', 'paid', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE refund_status AS ENUM ('none', 'partial', 'full', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- HELPER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '');
$$;

-- =============================================================================
-- PROFILES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id    text        UNIQUE,
  email       text,
  full_name   text,
  phone       text,
  avatar_url  text,
  roles       user_role[] DEFAULT ARRAY['owner']::user_role[],
  is_admin    boolean     DEFAULT false,
  is_active   boolean     DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "admin_all_profiles" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (clerk_id = get_clerk_user_id());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (clerk_id = get_clerk_user_id());
CREATE POLICY "admin_all_profiles" ON public.profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.clerk_id = get_clerk_user_id() AND p.is_admin = true));

GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated;

-- =============================================================================
-- GROOMER PROFILES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.groomer_profiles (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name           text,
  tagline                 text,
  bio                     text,
  years_experience        smallint,
  qualifications          text,
  insurance_provider      text,
  insurance_policy_ref    text,
  insurance_doc_url       text,
  address_line_1          text,
  address_line_2          text,
  city                    text,
  postcode                text,
  location                geography(Point, 4326),
  travel_radius_miles     smallint,
  is_mobile               boolean     DEFAULT false,
  is_verified             boolean     DEFAULT false,
  is_listed               boolean     DEFAULT false,
  is_accepting_bookings   boolean     NOT NULL DEFAULT false,
  stripe_account_id       text,
  average_rating          numeric,
  total_reviews           integer     DEFAULT 0,
  profile_image_url       text,
  banner_image_url        text,
  cover_photo_url         text,
  gallery_images          text[],
  deposit_type            text        NOT NULL DEFAULT 'none',
  deposit_percentage      smallint,
  default_buffer_minutes  smallint    NOT NULL DEFAULT 0,
  bank_account_holder     text,
  bank_sort_code          text,
  bank_account_number     text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS groomer_profiles_location_idx ON public.groomer_profiles USING GIST (location);
CREATE INDEX IF NOT EXISTS groomer_profiles_user_id_idx  ON public.groomer_profiles (user_id);

ALTER TABLE public.groomer_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "groomer_select_own_profile" ON public.groomer_profiles;
DROP POLICY IF EXISTS "groomer_update_own_profile" ON public.groomer_profiles;
DROP POLICY IF EXISTS "groomer_insert_own_profile" ON public.groomer_profiles;
DROP POLICY IF EXISTS "public_read_listed_groomers" ON public.groomer_profiles;
DROP POLICY IF EXISTS "admin_all_groomer_profiles" ON public.groomer_profiles;

CREATE POLICY "groomer_select_own_profile" ON public.groomer_profiles FOR SELECT USING (user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));
CREATE POLICY "groomer_update_own_profile" ON public.groomer_profiles FOR UPDATE USING (user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));
CREATE POLICY "groomer_insert_own_profile" ON public.groomer_profiles FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));
CREATE POLICY "public_read_listed_groomers" ON public.groomer_profiles FOR SELECT TO anon, authenticated USING (is_listed = true);
CREATE POLICY "admin_all_groomer_profiles" ON public.groomer_profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true));

GRANT SELECT ON public.groomer_profiles TO anon, authenticated;

-- =============================================================================
-- DOGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.dogs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id              uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name                  text        NOT NULL,
  breed                 text,
  date_of_birth         date,
  size                  dog_size,
  is_neutered           boolean,
  coat_type             coat_type,
  coat_notes            text,
  temperament_notes     text,
  health_notes          text,
  vaccination_doc_url   text,
  profile_image_url     text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dogs_owner_id_idx ON public.dogs (owner_id);
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_crud_own_dogs" ON public.dogs;
DROP POLICY IF EXISTS "admin_all_dogs" ON public.dogs;
CREATE POLICY "owner_crud_own_dogs" ON public.dogs FOR ALL USING (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));
CREATE POLICY "admin_all_dogs" ON public.dogs FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true));

-- =============================================================================
-- SERVICES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.services (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  groomer_profile_id    uuid        NOT NULL REFERENCES public.groomer_profiles(id) ON DELETE CASCADE,
  name                  text        NOT NULL,
  description           text,
  duration_minutes      smallint    NOT NULL,
  price_pence           integer     NOT NULL,
  deposit_pence         integer,
  applicable_sizes      dog_size[],
  is_active             boolean     DEFAULT true,
  sort_order            smallint    DEFAULT 0,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS services_groomer_idx ON public.services (groomer_profile_id);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_services" ON public.services;
DROP POLICY IF EXISTS "groomer_crud_own_services" ON public.services;
DROP POLICY IF EXISTS "admin_all_services" ON public.services;
CREATE POLICY "public_read_services" ON public.services FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "groomer_crud_own_services" ON public.services FOR ALL USING (groomer_profile_id IN (SELECT id FROM public.groomer_profiles WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())));
CREATE POLICY "admin_all_services" ON public.services FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true));
GRANT SELECT ON public.services TO anon, authenticated;

-- =============================================================================
-- TEAM MEMBERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.team_members (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  groomer_profile_id    uuid        REFERENCES public.groomer_profiles(id) ON DELETE CASCADE,
  user_id               uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  name                  text        NOT NULL,
  role                  text        NOT NULL,
  email                 text,
  since_year            smallint,
  public_slug           text        UNIQUE,
  average_rating        numeric,
  total_reviews         integer     DEFAULT 0,
  invite_status         text        NOT NULL DEFAULT 'pending',
  clerk_invitation_id   text,
  invited_at            timestamptz,
  accepted_at           timestamptz,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_members_groomer_idx ON public.team_members (groomer_profile_id);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "groomer_crud_own_team" ON public.team_members;
DROP POLICY IF EXISTS "admin_all_team_members" ON public.team_members;
CREATE POLICY "groomer_crud_own_team" ON public.team_members FOR ALL USING (groomer_profile_id IN (SELECT id FROM public.groomer_profiles WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())));
CREATE POLICY "admin_all_team_members" ON public.team_members FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true));

-- =============================================================================
-- APPOINTMENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id                          uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                    uuid                NOT NULL REFERENCES public.profiles(id),
  groomer_profile_id          uuid                NOT NULL REFERENCES public.groomer_profiles(id),
  dog_id                      uuid                REFERENCES public.dogs(id) ON DELETE SET NULL,
  service_id                  uuid                REFERENCES public.services(id) ON DELETE SET NULL,
  service_snapshot_name       text,
  service_snapshot_duration   smallint,
  service_snapshot_price      integer,
  scheduled_at                timestamptz         NOT NULL,
  status                      appointment_status  DEFAULT 'pending',
  cancelled_by                uuid,
  cancellation_reason         text,
  groomer_notes               text,
  owner_notes                 text,
  assigned_to_team_member_id  uuid                REFERENCES public.team_members(id) ON DELETE SET NULL,
  created_at                  timestamptz         DEFAULT now(),
  updated_at                  timestamptz         DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointments_owner_idx     ON public.appointments (owner_id);
CREATE INDEX IF NOT EXISTS appointments_groomer_idx   ON public.appointments (groomer_profile_id);
CREATE INDEX IF NOT EXISTS appointments_scheduled_idx ON public.appointments (scheduled_at);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_select_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "groomer_select_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "owner_insert_appointment" ON public.appointments;
DROP POLICY IF EXISTS "participants_update_appointment" ON public.appointments;
DROP POLICY IF EXISTS "admin_all_appointments" ON public.appointments;
CREATE POLICY "owner_select_own_appointments" ON public.appointments FOR SELECT USING (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));
CREATE POLICY "groomer_select_own_appointments" ON public.appointments FOR SELECT USING (groomer_profile_id IN (SELECT id FROM public.groomer_profiles WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())));
CREATE POLICY "owner_insert_appointment" ON public.appointments FOR INSERT WITH CHECK (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));
CREATE POLICY "participants_update_appointment" ON public.appointments FOR UPDATE USING (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()) OR groomer_profile_id IN (SELECT id FROM public.groomer_profiles WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())));
CREATE POLICY "admin_all_appointments" ON public.appointments FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true));

-- =============================================================================
-- AVAILABILITY
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.availability (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  groomer_profile_id  uuid        NOT NULL REFERENCES public.groomer_profiles(id) ON DELETE CASCADE,
  day_of_week         smallint    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time          time        NOT NULL,
  end_time            time        NOT NULL,
  is_active           boolean     DEFAULT true,
  break_start_time    time,
  break_end_time      time,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (groomer_profile_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS availability_groomer_idx ON public.availability (groomer_profile_id);
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_availability" ON public.availability;
DROP POLICY IF EXISTS "groomer_crud_own_availability" ON public.availability;
DROP POLICY IF EXISTS "admin_all_availability" ON public.availability;
CREATE POLICY "public_read_availability" ON public.availability FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "groomer_crud_own_availability" ON public.availability FOR ALL USING (groomer_profile_id IN (SELECT id FROM public.groomer_profiles WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())));
CREATE POLICY "admin_all_availability" ON public.availability FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true));
GRANT SELECT ON public.availability TO anon, authenticated;

-- =============================================================================
-- AVAILABILITY OVERRIDES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.availability_overrides (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  groomer_profile_id  uuid        NOT NULL REFERENCES public.groomer_profiles(id) ON DELETE CASCADE,
  override_date       date        NOT NULL,
  is_available        boolean     DEFAULT false,
  start_time          time,
  end_time            time,
  reason              text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (groomer_profile_id, override_date)
);

ALTER TABLE public.availability_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_availability_overrides" ON public.availability_overrides;
DROP POLICY IF EXISTS "groomer_crud_own_overrides" ON public.availability_overrides;
CREATE POLICY "public_read_availability_overrides" ON public.availability_overrides FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "groomer_crud_own_overrides" ON public.availability_overrides FOR ALL USING (groomer_profile_id IN (SELECT id FROM public.groomer_profiles WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())));
GRANT SELECT ON public.availability_overrides TO anon, authenticated;

-- =============================================================================
-- TIME BLOCKS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.time_blocks (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  groomer_profile_id  uuid        NOT NULL REFERENCES public.groomer_profiles(id) ON DELETE CASCADE,
  start_date          date        NOT NULL,
  end_date            date        NOT NULL,
  start_time          time,
  end_time            time,
  all_day             boolean     DEFAULT true,
  reason              text,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS time_blocks_groomer_idx ON public.time_blocks (groomer_profile_id);
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "groomer_crud_own_time_blocks" ON public.time_blocks;
DROP POLICY IF EXISTS "admin_all_time_blocks" ON public.time_blocks;
CREATE POLICY "groomer_crud_own_time_blocks" ON public.time_blocks FOR ALL USING (groomer_profile_id IN (SELECT id FROM public.groomer_profiles WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())));
CREATE POLICY "admin_all_time_blocks" ON public.time_blocks FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true));

-- =============================================================================
-- REVIEWS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id      uuid        NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  owner_id            uuid        NOT NULL REFERENCES public.profiles(id),
  groomer_profile_id  uuid        NOT NULL REFERENCES public.groomer_profiles(id),
  rating              smallint    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body                text,
  is_visible          boolean     DEFAULT true,
  groomer_reply       text,
  groomer_replied_at  timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_groomer_idx ON public.reviews (groomer_profile_id);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_reviews" ON public.reviews;
DROP POLICY IF EXISTS "owner_insert_review" ON public.reviews;
DROP POLICY IF EXISTS "groomer_reply_review" ON public.reviews;
DROP POLICY IF EXISTS "admin_all_reviews" ON public.reviews;
CREATE POLICY "public_read_reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (is_visible = true);
CREATE POLICY "owner_insert_review" ON public.reviews FOR INSERT WITH CHECK (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));
CREATE POLICY "groomer_reply_review" ON public.reviews FOR UPDATE USING (groomer_profile_id IN (SELECT id FROM public.groomer_profiles WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())));
CREATE POLICY "admin_all_reviews" ON public.reviews FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true));
GRANT SELECT ON public.reviews TO anon, authenticated;

-- =============================================================================
-- PAYMENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id                            uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id                uuid            NOT NULL REFERENCES public.appointments(id),
  stripe_payment_intent_id      text,
  deposit_amount_pence          integer,
  deposit_paid_at               timestamptz,
  deposit_status                text,
  full_payment_intent_id        text,
  full_amount_pence             integer,
  full_payment_paid_at          timestamptz,
  platform_fee_pence            integer,
  platform_fee_pct              numeric,
  groomer_payout_amount_pence   integer,
  stripe_transfer_id            text,
  payout_status                 payout_status,
  payout_initiated_at           timestamptz,
  refund_status                 refund_status,
  refund_amount_pence           integer,
  stripe_refund_id              text,
  refunded_at                   timestamptz,
  currency                      char(3)         DEFAULT 'gbp',
  created_at                    timestamptz     DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_payments" ON public.payments;
CREATE POLICY "admin_all_payments" ON public.payments FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true));

-- =============================================================================
-- MESSAGES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  uuid        NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  sender_id       uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  body            text        NOT NULL,
  is_system       boolean     DEFAULT false,
  read_at         timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_appointment_idx ON public.messages (appointment_id);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (sender_id = auth.uid() OR appointment_id IN (SELECT id FROM public.appointments WHERE owner_id = auth.uid() OR groomer_profile_id IN (SELECT id FROM public.groomer_profiles WHERE user_id = auth.uid())));
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- =============================================================================
-- FAVOURITE GROOMERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.favourite_groomers (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  groomer_profile_id  uuid        NOT NULL REFERENCES public.groomer_profiles(id) ON DELETE CASCADE,
  created_at          timestamptz DEFAULT now(),
  UNIQUE (owner_id, groomer_profile_id)
);

ALTER TABLE public.favourite_groomers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_select_own_favourites" ON public.favourite_groomers;
DROP POLICY IF EXISTS "owner_insert_own_favourites" ON public.favourite_groomers;
DROP POLICY IF EXISTS "owner_delete_own_favourites" ON public.favourite_groomers;
DROP POLICY IF EXISTS "admin_all_favourite_groomers" ON public.favourite_groomers;
CREATE POLICY "owner_select_own_favourites" ON public.favourite_groomers FOR SELECT USING (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));
CREATE POLICY "owner_insert_own_favourites" ON public.favourite_groomers FOR INSERT WITH CHECK (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));
CREATE POLICY "owner_delete_own_favourites" ON public.favourite_groomers FOR DELETE USING (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));
CREATE POLICY "admin_all_favourite_groomers" ON public.favourite_groomers FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true));

-- =============================================================================
-- DISPUTES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.disputes (
  id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid            REFERENCES public.profiles(id) ON DELETE SET NULL,
  groomer_id      uuid            REFERENCES public.profiles(id) ON DELETE SET NULL,
  appointment_id  uuid            REFERENCES public.appointments(id) ON DELETE SET NULL,
  subject         text            NOT NULL,
  description     text,
  status          dispute_status  NOT NULL DEFAULT 'open',
  admin_notes     text,
  created_at      timestamptz     DEFAULT now(),
  updated_at      timestamptz     DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_select_own_disputes" ON public.disputes;
DROP POLICY IF EXISTS "groomer_select_own_disputes" ON public.disputes;
DROP POLICY IF EXISTS "owner_insert_dispute" ON public.disputes;
DROP POLICY IF EXISTS "admin_all_disputes" ON public.disputes;
CREATE POLICY "owner_select_own_disputes" ON public.disputes FOR SELECT USING (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));
CREATE POLICY "groomer_select_own_disputes" ON public.disputes FOR SELECT USING (groomer_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));
CREATE POLICY "owner_insert_dispute" ON public.disputes FOR INSERT WITH CHECK (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));
CREATE POLICY "admin_all_disputes" ON public.disputes FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true));

-- =============================================================================
-- PORTFOLIO PHOTOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.portfolio_photos (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  groomer_profile_id  uuid        NOT NULL REFERENCES public.groomer_profiles(id) ON DELETE CASCADE,
  url                 text        NOT NULL,
  caption             text,
  sort_order          smallint    DEFAULT 0,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_photos_groomer_idx ON public.portfolio_photos (groomer_profile_id);

-- =============================================================================
-- SEARCH RPC FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION search_groomers_by_text(query text)
RETURNS TABLE (
  id uuid, business_name text, tagline text, bio text, city text, postcode text,
  is_mobile boolean, average_rating numeric, total_reviews integer,
  is_listed boolean, is_verified boolean, deposit_type text, deposit_percentage smallint
)
LANGUAGE sql STABLE AS $$
  SELECT id, business_name, tagline, bio, city, postcode,
         is_mobile, average_rating, total_reviews, is_listed, is_verified,
         deposit_type, deposit_percentage
  FROM groomer_profiles
  WHERE is_listed = true
    AND (business_name ILIKE '%' || query || '%'
         OR city     ILIKE '%' || query || '%'
         OR postcode ILIKE '%' || query || '%'
         OR bio      ILIKE '%' || query || '%'
         OR tagline  ILIKE '%' || query || '%')
  ORDER BY average_rating DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION search_groomers_near(user_lat float, user_lng float, radius_metres float)
RETURNS TABLE (
  id uuid, business_name text, tagline text, bio text, city text, postcode text,
  is_mobile boolean, average_rating numeric, total_reviews integer,
  is_listed boolean, is_verified boolean,
  distance_metres float, lat float, lng float,
  deposit_type text, deposit_percentage smallint
)
LANGUAGE sql STABLE AS $$
  SELECT id, business_name, tagline, bio, city, postcode,
         is_mobile, average_rating, total_reviews, is_listed, is_verified,
         ST_Distance(location, ST_MakePoint(user_lng, user_lat)::geography) AS distance_metres,
         ST_Y(location::geometry) AS lat,
         ST_X(location::geometry) AS lng,
         deposit_type, deposit_percentage
  FROM groomer_profiles
  WHERE is_listed = true
    AND location IS NOT NULL
    AND ST_DWithin(location, ST_MakePoint(user_lng, user_lat)::geography, radius_metres)
  ORDER BY distance_metres ASC;
$$;

-- =============================================================================
-- MOCK DATA — 6 groomers, Glasgow to Dumbarton
-- =============================================================================

INSERT INTO profiles (id, clerk_id, email, full_name, phone, roles, is_admin, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'mock_groomer_001', 'sarah@pawsomecutsglasgow.co.uk', 'Sarah McAllister', '07700900001', ARRAY['groomer']::user_role[], false, true),
  ('a1000000-0000-0000-0000-000000000002', 'mock_groomer_002', 'callum@thegroomingden.co.uk',    'Callum Fraser',    '07700900002', ARRAY['groomer']::user_role[], false, true),
  ('a1000000-0000-0000-0000-000000000003', 'mock_groomer_003', 'jen@fuzzyfriends.co.uk',         'Jennifer Reid',    '07700900003', ARRAY['groomer']::user_role[], false, true),
  ('a1000000-0000-0000-0000-000000000004', 'mock_groomer_004', 'derek@snipandsuds.co.uk',        'Derek MacLeod',    '07700900004', ARRAY['groomer']::user_role[], false, true),
  ('a1000000-0000-0000-0000-000000000005', 'mock_groomer_005', 'amy@pawsandpamper.co.uk',        'Amy Henderson',    '07700900005', ARRAY['groomer']::user_role[], false, true),
  ('a1000000-0000-0000-0000-000000000006', 'mock_groomer_006', 'ross@dumbartonpetspa.co.uk',     'Ross Campbell',    '07700900006', ARRAY['groomer']::user_role[], false, true);

INSERT INTO groomer_profiles (
  id, user_id, business_name, tagline, bio,
  years_experience, qualifications, insurance_provider, insurance_policy_ref,
  address_line_1, city, postcode, location,
  is_mobile, travel_radius_miles, is_verified, is_listed, is_accepting_bookings,
  average_rating, total_reviews, deposit_type, deposit_percentage, default_buffer_minutes
) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'Pawsome Cuts Glasgow', 'Award-winning grooming in the heart of the city',
   'I have been grooming dogs professionally for over 10 years, specialising in all breed scissor cuts and hand-stripping. My studio is a calm, one-dog-at-a-time environment so your dog gets my full attention from start to finish. I am City & Guilds Level 3 qualified and a member of the British Dog Groomers'' Association.',
   10, 'City & Guilds Level 3, BDGA Member', 'Petplan Sanctuary', 'PSA-2024-0041',
   '14 Buchanan Street', 'Glasgow', 'G1 3HL', ST_MakePoint(-4.2518, 55.8642)::geography,
   false, 5, true, true, true, 4.9, 184, 'percentage', 25, 15),

  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002',
   'The Grooming Den', 'Relaxed, fuss-free grooming for city dogs',
   'Based in Glasgow''s West End, The Grooming Den is a boutique studio run by me, Callum, and my Border Collie Biscuit. I focus on breed-correct styling and keep appointment slots small so no dog ever has to wait in a crate. I am fully insured and City & Guilds qualified.',
   7, 'City & Guilds Level 3', 'Petplan Sanctuary', 'PSA-2024-0187',
   '62 Dumbarton Road', 'Glasgow', 'G11 6RA', ST_MakePoint(-4.3098, 55.8712)::geography,
   false, 4, true, true, true, 4.7, 97, 'percentage', 20, 15),

  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003',
   'Fuzzy Friends Grooming', 'Doodles, spaniels & everything in between',
   'Fuzzy Friends is a family-run grooming studio in Clydebank. I specialise in doodles, spaniels, and curly-coated breeds — the tricky ones that need a patient hand and the right tools. Anxiety-free handling techniques used throughout. Fully insured, 7 years experience.',
   7, 'iPET Network Level 3, Fear Free Certified', 'Cliverton', 'CLV-55821-G',
   '3 Kilbowie Road', 'Clydebank', 'G81 2AQ', ST_MakePoint(-4.4047, 55.8984)::geography,
   true, 8, true, true, true, 4.8, 142, 'fixed', null, 0),

  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004',
   'Snip & Suds', 'Mobile grooming that comes to you',
   'I bring the full salon experience to your door in a custom-fitted grooming van. Serving Old Kilpatrick, Bowling, Duntocher, and surrounding villages. No kennels, no other dogs — just a relaxed one-to-one groom in the comfort of your own driveway. Ideal for nervous or elderly dogs.',
   5, 'iPET Network Level 2', 'Cliverton', 'CLV-60114-M',
   'Old Kilpatrick', 'Old Kilpatrick', 'G60 5AQ', ST_MakePoint(-4.4604, 55.9126)::geography,
   true, 10, false, true, true, 4.6, 58, 'none', null, 0),

  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005',
   'Paws & Pamper', 'Countryside calm, professional results',
   'Set in a converted stable just off the canal in Bowling, Paws & Pamper offers a truly stress-free grooming experience. Dogs love the rural setting and I love what I do — 9 years in and every groom still makes me smile. Specialities include hand-stripping terriers and groom-to-breed styling.',
   9, 'City & Guilds Level 3, BDGA Senior Member', 'Petplan Sanctuary', 'PSA-2023-9902',
   '1 Station Road', 'Bowling', 'G60 5AG', ST_MakePoint(-4.4897, 55.9197)::geography,
   false, 6, true, true, true, 5.0, 76, 'percentage', 30, 15),

  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006',
   'Dumbarton Pet Spa', 'Your dog''s favourite day out',
   'Dumbarton Pet Spa is a purpose-built grooming studio with a warm, welcoming atmosphere. I offer full grooms, bath & blowdrys, puppy introductions, and nail trims. Every dog is treated like my own. Based near Dumbarton town centre with free parking directly outside.',
   6, 'City & Guilds Level 3', 'Petplan Sanctuary', 'PSA-2024-1156',
   '24 High Street', 'Dumbarton', 'G82 1LH', ST_MakePoint(-4.5713, 55.9426)::geography,
   false, 5, true, true, true, 4.5, 43, 'percentage', 20, 15);

INSERT INTO services (groomer_profile_id, name, description, duration_minutes, price_pence, applicable_sizes, is_active, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Full Groom',         'Bath, blow-dry, scissor cut, ear clean, nail trim',        90,  6500, ARRAY['small','medium']::dog_size[],      true, 1),
  ('b1000000-0000-0000-0000-000000000001', 'Full Groom (Large)', 'Bath, blow-dry, scissor cut, ear clean, nail trim',       120,  8500, ARRAY['large','xl']::dog_size[],          true, 2),
  ('b1000000-0000-0000-0000-000000000001', 'Bath & Blowdry',     'Shampoo, condition, blow-dry and brush out',               60,  4000, ARRAY['xs','small','medium']::dog_size[], true, 3),
  ('b1000000-0000-0000-0000-000000000001', 'Puppy Introduction', 'Gentle first groom experience for puppies under 6 months', 45,  3500, null,                                     true, 4),
  ('b1000000-0000-0000-0000-000000000001', 'Nail Trim',          'Clip and file all four paws',                              15,  1200, null,                                     true, 5),
  ('b1000000-0000-0000-0000-000000000002', 'Full Groom',         'Bath, blow-dry, breed-correct cut, ear clean, nails',      90,  5500, ARRAY['small','medium']::dog_size[],      true, 1),
  ('b1000000-0000-0000-0000-000000000002', 'Full Groom (Large)', 'Bath, blow-dry, breed-correct cut, ear clean, nails',     120,  7500, ARRAY['large','xl']::dog_size[],          true, 2),
  ('b1000000-0000-0000-0000-000000000002', 'Bath & Tidy',        'Shampoo, blow-dry and scissor tidy',                       60,  3800, ARRAY['xs','small','medium']::dog_size[], true, 3),
  ('b1000000-0000-0000-0000-000000000002', 'Hand Strip',         'Traditional hand-stripping for wire-coated breeds',       120,  9000, ARRAY['small','medium']::dog_size[],      true, 4),
  ('b1000000-0000-0000-0000-000000000003', 'Doodle Groom',       'Specialist doodle cut — teddy bear, kennel or lamb',      120,  7000, ARRAY['medium','large']::dog_size[],      true, 1),
  ('b1000000-0000-0000-0000-000000000003', 'Spaniel Groom',      'Breed-correct spaniel styling with hand-scissored feathering', 90, 6000, ARRAY['medium']::dog_size[],         true, 2),
  ('b1000000-0000-0000-0000-000000000003', 'Full Groom',         'Bath, blow-dry, cut, ear clean, nail trim',                90,  5800, ARRAY['small','medium']::dog_size[],      true, 3),
  ('b1000000-0000-0000-0000-000000000003', 'Bath & Blowdry',     'Shampoo, condition and blow-dry',                          60,  3500, null,                                     true, 4),
  ('b1000000-0000-0000-0000-000000000003', 'De-shedding Treatment', 'Double coat blow-out and de-shed treatment',            90,  5500, ARRAY['medium','large','xl']::dog_size[], true, 5),
  ('b1000000-0000-0000-0000-000000000004', 'Mobile Full Groom',  'Full groom in our van on your driveway',                   90,  7000, ARRAY['small','medium']::dog_size[],      true, 1),
  ('b1000000-0000-0000-0000-000000000004', 'Mobile Full Groom (Large)', 'Full groom for larger breeds',                     120,  9000, ARRAY['large','xl']::dog_size[],          true, 2),
  ('b1000000-0000-0000-0000-000000000004', 'Mobile Bath & Dry',  'Shampoo, condition, blow-dry at your door',                60,  4500, null,                                     true, 3),
  ('b1000000-0000-0000-0000-000000000005', 'Full Groom',         'Bath, blow-dry, scissor cut to breed standard',            90,  6000, ARRAY['small','medium']::dog_size[],      true, 1),
  ('b1000000-0000-0000-0000-000000000005', 'Full Groom (Large)', 'Bath, blow-dry, scissor cut for large breeds',            120,  8000, ARRAY['large','xl']::dog_size[],          true, 2),
  ('b1000000-0000-0000-0000-000000000005', 'Hand Strip',         'Traditional hand-stripping for terriers and gundogs',     150, 10000, ARRAY['small','medium']::dog_size[],      true, 3),
  ('b1000000-0000-0000-0000-000000000005', 'Bath & Blowdry',     'Shampoo, blow-dry and brush out',                          60,  3800, null,                                     true, 4),
  ('b1000000-0000-0000-0000-000000000005', 'Puppy Introduction', 'Relaxed first groom — build positive associations early',  45,  3000, null,                                     true, 5),
  ('b1000000-0000-0000-0000-000000000006', 'Full Groom',         'Bath, blowdry, cut, ear clean, nail trim and spritz',      90,  5500, ARRAY['small','medium']::dog_size[],      true, 1),
  ('b1000000-0000-0000-0000-000000000006', 'Full Groom (Large)', 'Full groom for large and XL breeds',                     120,  7500, ARRAY['large','xl']::dog_size[],          true, 2),
  ('b1000000-0000-0000-0000-000000000006', 'Bath & Blowdry',     'Shampoo, condition, blow-dry and brush out',               60,  3500, null,                                     true, 3),
  ('b1000000-0000-0000-0000-000000000006', 'Nail Trim',          'Clip and file, includes paw pad tidy',                    15,  1000, null,                                     true, 4),
  ('b1000000-0000-0000-0000-000000000006', 'Puppy Introduction', 'Gentle first groom for puppies',                          45,  2800, null,                                     true, 5);

INSERT INTO availability (groomer_profile_id, day_of_week, start_time, end_time, is_active) VALUES
  ('b1000000-0000-0000-0000-000000000001', 1, '09:00', '17:00', true),
  ('b1000000-0000-0000-0000-000000000001', 2, '09:00', '17:00', true),
  ('b1000000-0000-0000-0000-000000000001', 3, '09:00', '17:00', true),
  ('b1000000-0000-0000-0000-000000000001', 4, '09:00', '17:00', true),
  ('b1000000-0000-0000-0000-000000000001', 5, '09:00', '17:00', true),
  ('b1000000-0000-0000-0000-000000000001', 6, '09:00', '15:00', true),
  ('b1000000-0000-0000-0000-000000000002', 2, '09:00', '17:00', true),
  ('b1000000-0000-0000-0000-000000000002', 3, '09:00', '17:00', true),
  ('b1000000-0000-0000-0000-000000000002', 4, '09:00', '17:00', true),
  ('b1000000-0000-0000-0000-000000000002', 5, '09:00', '17:00', true),
  ('b1000000-0000-0000-0000-000000000002', 6, '09:00', '17:00', true),
  ('b1000000-0000-0000-0000-000000000003', 1, '08:30', '17:30', true),
  ('b1000000-0000-0000-0000-000000000003', 2, '08:30', '17:30', true),
  ('b1000000-0000-0000-0000-000000000003', 3, '08:30', '17:30', true),
  ('b1000000-0000-0000-0000-000000000003', 4, '08:30', '17:30', true),
  ('b1000000-0000-0000-0000-000000000003', 5, '08:30', '17:30', true),
  ('b1000000-0000-0000-0000-000000000003', 6, '08:30', '14:00', true),
  ('b1000000-0000-0000-0000-000000000004', 1, '09:00', '17:00', true),
  ('b1000000-0000-0000-0000-000000000004', 2, '09:00', '17:00', true),
  ('b1000000-0000-0000-0000-000000000004', 3, '09:00', '17:00', true),
  ('b1000000-0000-0000-0000-000000000004', 4, '09:00', '17:00', true),
  ('b1000000-0000-0000-0000-000000000004', 5, '09:00', '17:00', true),
  ('b1000000-0000-0000-0000-000000000005', 1, '09:00', '16:00', true),
  ('b1000000-0000-0000-0000-000000000005', 2, '09:00', '16:00', true),
  ('b1000000-0000-0000-0000-000000000005', 4, '09:00', '16:00', true),
  ('b1000000-0000-0000-0000-000000000005', 5, '09:00', '16:00', true),
  ('b1000000-0000-0000-0000-000000000005', 6, '09:00', '14:00', true),
  ('b1000000-0000-0000-0000-000000000006', 1, '09:00', '17:30', true),
  ('b1000000-0000-0000-0000-000000000006', 2, '09:00', '17:30', true),
  ('b1000000-0000-0000-0000-000000000006', 3, '09:00', '17:30', true),
  ('b1000000-0000-0000-0000-000000000006', 4, '09:00', '17:30', true),
  ('b1000000-0000-0000-0000-000000000006', 5, '09:00', '17:30', true),
  ('b1000000-0000-0000-0000-000000000006', 6, '09:00', '14:00', true);
