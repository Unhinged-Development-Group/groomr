CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_profile_id uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  action           text        NOT NULL,
  target_table     text,
  target_id        text,
  metadata         jsonb       DEFAULT '{}',
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON public.admin_audit_log FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON public.admin_audit_log (created_at DESC);
