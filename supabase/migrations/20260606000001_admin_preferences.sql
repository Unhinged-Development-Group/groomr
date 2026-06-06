ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_preferences jsonb DEFAULT '{}';
