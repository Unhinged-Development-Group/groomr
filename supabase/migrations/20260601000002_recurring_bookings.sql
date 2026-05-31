-- recurring_series: defines a recurring appointment pattern
CREATE TABLE public.recurring_series (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  groomer_profile_id    uuid        NOT NULL REFERENCES public.groomer_profiles(id) ON DELETE CASCADE,
  owner_id              uuid        NOT NULL REFERENCES public.profiles(id)         ON DELETE CASCADE,
  dog_id                uuid                 REFERENCES public.dogs(id)             ON DELETE SET NULL,
  service_id            uuid                 REFERENCES public.services(id)         ON DELETE SET NULL,
  frequency             text        NOT NULL
                                    CHECK (frequency IN ('weekly', 'bi-weekly', '4-weekly', 'monthly')),
  preferred_day_of_week smallint    NOT NULL CHECK (preferred_day_of_week BETWEEN 0 AND 6),
  preferred_time        time        NOT NULL,
  end_date              date        DEFAULT NULL, -- NULL = ongoing (rolling 6-month window)
  status                text        NOT NULL DEFAULT 'pending_approval'
                                    CHECK (status IN ('pending_approval', 'active', 'cancelled')),
  requested_by          text        NOT NULL DEFAULT 'owner'
                                    CHECK (requested_by IN ('owner', 'groomer')),
  service_snapshot_name     text,
  service_snapshot_duration integer,
  service_snapshot_price    integer,
  last_generated_at     date        DEFAULT NULL,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX recurring_series_groomer_idx ON public.recurring_series (groomer_profile_id);
CREATE INDEX recurring_series_owner_idx   ON public.recurring_series (owner_id);
CREATE INDEX recurring_series_status_idx  ON public.recurring_series (status);

ALTER TABLE public.recurring_series ENABLE ROW LEVEL SECURITY;

-- Owner can see their own series
CREATE POLICY "owner_select_own_series" ON public.recurring_series
  FOR SELECT USING (
    owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
  );

-- Groomer manages all series for their profile
CREATE POLICY "groomer_all_series" ON public.recurring_series
  FOR ALL USING (
    groomer_profile_id IN (
      SELECT id FROM public.groomer_profiles
      WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
    )
  );

-- Owners can insert series (for requests)
CREATE POLICY "owner_insert_series" ON public.recurring_series
  FOR INSERT WITH CHECK (
    owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
  );

-- Add recurring_series_id and booking_group_id to appointments
ALTER TABLE public.appointments
  ADD COLUMN recurring_series_id uuid REFERENCES public.recurring_series(id) ON DELETE SET NULL,
  ADD COLUMN booking_group_id    uuid;

CREATE INDEX appointments_recurring_series_idx ON public.appointments (recurring_series_id);
CREATE INDEX appointments_booking_group_idx    ON public.appointments (booking_group_id);
