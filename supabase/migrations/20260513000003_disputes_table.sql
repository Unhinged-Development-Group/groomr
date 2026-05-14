-- Create disputes table
-- Used by admin dashboard to manage owner/groomer disputes

CREATE TYPE dispute_status AS ENUM ('open', 'in_review', 'resolved');

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

-- RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Owners can view their own disputes
CREATE POLICY "owner_select_own_disputes"
  ON public.disputes
  FOR SELECT
  USING (
    owner_id = (
      SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()
    )
  );

-- Groomers can view disputes involving them
CREATE POLICY "groomer_select_own_disputes"
  ON public.disputes
  FOR SELECT
  USING (
    groomer_id = (
      SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()
    )
  );

-- Owners can open a dispute
CREATE POLICY "owner_insert_dispute"
  ON public.disputes
  FOR INSERT
  WITH CHECK (
    owner_id = (
      SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()
    )
  );

-- Admins can do everything
CREATE POLICY "admin_all_disputes"
  ON public.disputes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE clerk_id = get_clerk_user_id() AND is_admin = true
    )
  );
