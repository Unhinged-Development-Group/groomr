-- Support requests table
-- Persists submissions from the support form so the admin dashboard can view and reply

CREATE TYPE support_request_status AS ENUM ('open', 'in_progress', 'closed');

CREATE TABLE IF NOT EXISTS public.support_requests (
  id           uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid                    REFERENCES public.profiles(id) ON DELETE SET NULL,
  name         text                    NOT NULL,
  email        text                    NOT NULL,
  subject      text                    NOT NULL,
  message      text                    NOT NULL,
  status       support_request_status  NOT NULL DEFAULT 'open',
  admin_reply  text,
  created_at   timestamptz             DEFAULT now(),
  updated_at   timestamptz             DEFAULT now()
);

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_insert_own_support_request"
  ON public.support_requests FOR INSERT
  WITH CHECK (
    profile_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
  );

CREATE POLICY "user_select_own_support_request"
  ON public.support_requests FOR SELECT
  USING (
    profile_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
  );

CREATE POLICY "admin_all_support_requests"
  ON public.support_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE clerk_id = get_clerk_user_id() AND is_admin = true
    )
  );
