-- =============================================================================
-- Groomr base schema
-- Builds the complete schema from scratch, including all tables, types,
-- helper functions, RLS policies, and grants.
-- All incremental migration patches (20260513–20260524) are already folded in,
-- so this file alone produces the final desired state.
-- =============================================================================

-- PostGIS for geo search
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'groomer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE dog_size AS ENUM ('xs', 'small', 'medium', 'large', 'xl');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE coat_type AS ENUM ('smooth', 'double', 'long', 'wire', 'curly', 'hairless');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE dispute_status AS ENUM ('open', 'in_review', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM ('pending', 'initiated', 'paid', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE refund_status AS ENUM ('none', 'partial', 'full', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- HELPER FUNCTION — extracts the Clerk user ID from the JWT sub claim
-- Used by RLS policies to scope rows to the current user.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
    ''
  );
$$;

-- =============================================================================
-- PROFILES
-- One row per user; clerk_id links to Clerk.
-- The existing wrong profiles table is replaced here.
-- =============================================================================

DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
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

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (clerk_id = get_clerk_user_id());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (clerk_id = get_clerk_user_id());

CREATE POLICY "admin_all_profiles"
  ON public.profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.clerk_id = get_clerk_user_id() AND p.is_admin = true
  ));

GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated;

-- =============================================================================
-- GROOMER PROFILES
-- Extended groomer data linked to profiles.
-- =============================================================================

CREATE TABLE public.groomer_profiles (
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

CREATE INDEX groomer_profiles_location_idx ON public.groomer_profiles USING GIST (location);
CREATE INDEX groomer_profiles_user_id_idx  ON public.groomer_profiles (user_id);

ALTER TABLE public.groomer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groomer_select_own_profile"
  ON public.groomer_profiles FOR SELECT
  USING (user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "groomer_update_own_profile"
  ON public.groomer_profiles FOR UPDATE
  USING (user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "groomer_insert_own_profile"
  ON public.groomer_profiles FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "public_read_listed_groomers"
  ON public.groomer_profiles FOR SELECT
  TO anon, authenticated
  USING (is_listed = true);

CREATE POLICY "admin_all_groomer_profiles"
  ON public.groomer_profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

GRANT SELECT ON public.groomer_profiles TO anon, authenticated;

-- =============================================================================
-- DOGS
-- =============================================================================

CREATE TABLE public.dogs (
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

CREATE INDEX dogs_owner_id_idx ON public.dogs (owner_id);

ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_crud_own_dogs"
  ON public.dogs FOR ALL
  USING (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "admin_all_dogs"
  ON public.dogs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

-- =============================================================================
-- SERVICES
-- =============================================================================

CREATE TABLE public.services (
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

CREATE INDEX services_groomer_idx ON public.services (groomer_profile_id);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_services"
  ON public.services FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "groomer_crud_own_services"
  ON public.services FOR ALL
  USING (groomer_profile_id IN (
    SELECT id FROM public.groomer_profiles
    WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
  ));

CREATE POLICY "admin_all_services"
  ON public.services FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

GRANT SELECT ON public.services TO anon, authenticated;

-- =============================================================================
-- TEAM MEMBERS
-- =============================================================================

CREATE TABLE public.team_members (
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

CREATE INDEX team_members_groomer_idx ON public.team_members (groomer_profile_id);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groomer_crud_own_team"
  ON public.team_members FOR ALL
  USING (groomer_profile_id IN (
    SELECT id FROM public.groomer_profiles
    WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
  ));

CREATE POLICY "admin_all_team_members"
  ON public.team_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

-- =============================================================================
-- APPOINTMENTS
-- =============================================================================

CREATE TABLE public.appointments (
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

CREATE INDEX appointments_owner_idx   ON public.appointments (owner_id);
CREATE INDEX appointments_groomer_idx ON public.appointments (groomer_profile_id);
CREATE INDEX appointments_scheduled_idx ON public.appointments (scheduled_at);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_own_appointments"
  ON public.appointments FOR SELECT
  USING (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "groomer_select_own_appointments"
  ON public.appointments FOR SELECT
  USING (groomer_profile_id IN (
    SELECT id FROM public.groomer_profiles
    WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
  ));

CREATE POLICY "owner_insert_appointment"
  ON public.appointments FOR INSERT
  WITH CHECK (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "participants_update_appointment"
  ON public.appointments FOR UPDATE
  USING (
    owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
    OR groomer_profile_id IN (
      SELECT id FROM public.groomer_profiles
      WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
    )
  );

CREATE POLICY "admin_all_appointments"
  ON public.appointments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

-- =============================================================================
-- AVAILABILITY
-- =============================================================================

CREATE TABLE public.availability (
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

CREATE INDEX availability_groomer_idx ON public.availability (groomer_profile_id);

ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_availability"
  ON public.availability FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "groomer_crud_own_availability"
  ON public.availability FOR ALL
  USING (groomer_profile_id IN (
    SELECT id FROM public.groomer_profiles
    WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
  ));

CREATE POLICY "admin_all_availability"
  ON public.availability FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

GRANT SELECT ON public.availability TO anon, authenticated;

-- =============================================================================
-- AVAILABILITY OVERRIDES
-- =============================================================================

CREATE TABLE public.availability_overrides (
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

CREATE POLICY "public_read_availability_overrides"
  ON public.availability_overrides FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "groomer_crud_own_overrides"
  ON public.availability_overrides FOR ALL
  USING (groomer_profile_id IN (
    SELECT id FROM public.groomer_profiles
    WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
  ));

GRANT SELECT ON public.availability_overrides TO anon, authenticated;

-- =============================================================================
-- TIME BLOCKS
-- =============================================================================

CREATE TABLE public.time_blocks (
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

CREATE INDEX time_blocks_groomer_idx ON public.time_blocks (groomer_profile_id);

ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groomer_crud_own_time_blocks"
  ON public.time_blocks FOR ALL
  USING (groomer_profile_id IN (
    SELECT id FROM public.groomer_profiles
    WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
  ));

CREATE POLICY "admin_all_time_blocks"
  ON public.time_blocks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

-- =============================================================================
-- REVIEWS
-- =============================================================================

CREATE TABLE public.reviews (
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

CREATE INDEX reviews_groomer_idx ON public.reviews (groomer_profile_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_reviews"
  ON public.reviews FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

CREATE POLICY "owner_insert_review"
  ON public.reviews FOR INSERT
  WITH CHECK (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "groomer_reply_review"
  ON public.reviews FOR UPDATE
  USING (groomer_profile_id IN (
    SELECT id FROM public.groomer_profiles
    WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
  ));

CREATE POLICY "admin_all_reviews"
  ON public.reviews FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

GRANT SELECT ON public.reviews TO anon, authenticated;

-- =============================================================================
-- PAYMENTS
-- =============================================================================

CREATE TABLE public.payments (
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

CREATE POLICY "admin_all_payments"
  ON public.payments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

-- =============================================================================
-- MESSAGES
-- =============================================================================

CREATE TABLE public.messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  uuid        NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  sender_id       uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  body            text        NOT NULL,
  is_system       boolean     DEFAULT false,
  read_at         timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX messages_appointment_idx ON public.messages (appointment_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select"
  ON public.messages FOR SELECT
  USING (
    sender_id = auth.uid()
    OR appointment_id IN (
      SELECT id FROM public.appointments
      WHERE owner_id = auth.uid()
         OR groomer_profile_id IN (
              SELECT id FROM public.groomer_profiles WHERE user_id = auth.uid()
         )
    )
  );

CREATE POLICY "messages_insert"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- =============================================================================
-- FAVOURITE GROOMERS
-- =============================================================================

CREATE TABLE public.favourite_groomers (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  groomer_profile_id  uuid        NOT NULL REFERENCES public.groomer_profiles(id) ON DELETE CASCADE,
  created_at          timestamptz DEFAULT now(),
  UNIQUE (owner_id, groomer_profile_id)
);

ALTER TABLE public.favourite_groomers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_own_favourites"
  ON public.favourite_groomers FOR SELECT
  USING (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "owner_insert_own_favourites"
  ON public.favourite_groomers FOR INSERT
  WITH CHECK (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "owner_delete_own_favourites"
  ON public.favourite_groomers FOR DELETE
  USING (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "admin_all_favourite_groomers"
  ON public.favourite_groomers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

-- =============================================================================
-- DISPUTES
-- =============================================================================

CREATE TABLE public.disputes (
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

CREATE POLICY "owner_select_own_disputes"
  ON public.disputes FOR SELECT
  USING (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "groomer_select_own_disputes"
  ON public.disputes FOR SELECT
  USING (groomer_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "owner_insert_dispute"
  ON public.disputes FOR INSERT
  WITH CHECK (owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "admin_all_disputes"
  ON public.disputes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

-- =============================================================================
-- PORTFOLIO PHOTOS
-- =============================================================================

CREATE TABLE public.portfolio_photos (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  groomer_profile_id  uuid        NOT NULL REFERENCES public.groomer_profiles(id) ON DELETE CASCADE,
  url                 text        NOT NULL,
  caption             text,
  sort_order          smallint    DEFAULT 0,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX portfolio_photos_groomer_idx ON public.portfolio_photos (groomer_profile_id);

-- =============================================================================
-- SEARCH RPC FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION search_groomers_by_text(query text)
RETURNS TABLE (
  id                  uuid,
  business_name       text,
  tagline             text,
  bio                 text,
  city                text,
  postcode            text,
  is_mobile           boolean,
  average_rating      numeric,
  total_reviews       integer,
  is_listed           boolean,
  is_verified         boolean,
  deposit_type        text,
  deposit_percentage  smallint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id, business_name, tagline, bio, city, postcode,
    is_mobile, average_rating, total_reviews, is_listed, is_verified,
    deposit_type, deposit_percentage
  FROM groomer_profiles
  WHERE
    is_listed = true
    AND (
      business_name ILIKE '%' || query || '%'
      OR city        ILIKE '%' || query || '%'
      OR postcode    ILIKE '%' || query || '%'
      OR bio         ILIKE '%' || query || '%'
      OR tagline     ILIKE '%' || query || '%'
    )
  ORDER BY average_rating DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION search_groomers_near(
  user_lat       float,
  user_lng       float,
  radius_metres  float
)
RETURNS TABLE (
  id                  uuid,
  business_name       text,
  tagline             text,
  bio                 text,
  city                text,
  postcode            text,
  is_mobile           boolean,
  average_rating      numeric,
  total_reviews       integer,
  is_listed           boolean,
  is_verified         boolean,
  distance_metres     float,
  lat                 float,
  lng                 float,
  deposit_type        text,
  deposit_percentage  smallint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id, business_name, tagline, bio, city, postcode,
    is_mobile, average_rating, total_reviews, is_listed, is_verified,
    ST_Distance(location, ST_MakePoint(user_lng, user_lat)::geography) AS distance_metres,
    ST_Y(location::geometry)                                            AS lat,
    ST_X(location::geometry)                                            AS lng,
    deposit_type, deposit_percentage
  FROM groomer_profiles
  WHERE
    is_listed = true
    AND location IS NOT NULL
    AND ST_DWithin(location, ST_MakePoint(user_lng, user_lat)::geography, radius_metres)
  ORDER BY distance_metres ASC;
$$;
