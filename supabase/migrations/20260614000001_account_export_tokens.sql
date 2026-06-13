CREATE TABLE IF NOT EXISTS public.account_export_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid        REFERENCES public.profiles(id) ON DELETE CASCADE,
  token       uuid        NOT NULL DEFAULT gen_random_uuid(),
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS account_export_tokens_token_idx
  ON public.account_export_tokens (token);

ALTER TABLE public.account_export_tokens ENABLE ROW LEVEL SECURITY;
-- No user-facing RLS policies: only accessed via supabaseAdmin (service role).
