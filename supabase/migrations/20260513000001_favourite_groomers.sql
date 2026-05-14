-- Create favourite_groomers table
-- Tracks which groomers an owner has saved/favourited

CREATE TABLE IF NOT EXISTS public.favourite_groomers (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  groomer_profile_id  uuid        NOT NULL REFERENCES public.groomer_profiles(id) ON DELETE CASCADE,
  created_at          timestamptz DEFAULT now(),

  UNIQUE (owner_id, groomer_profile_id)
);

-- RLS
ALTER TABLE public.favourite_groomers ENABLE ROW LEVEL SECURITY;

-- Owner can view their own favourites
CREATE POLICY "owner_select_own_favourites"
  ON public.favourite_groomers
  FOR SELECT
  USING (
    owner_id = (
      SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()
    )
  );

-- Owner can add favourites
CREATE POLICY "owner_insert_own_favourites"
  ON public.favourite_groomers
  FOR INSERT
  WITH CHECK (
    owner_id = (
      SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()
    )
  );

-- Owner can remove their own favourites
CREATE POLICY "owner_delete_own_favourites"
  ON public.favourite_groomers
  FOR DELETE
  USING (
    owner_id = (
      SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id()
    )
  );

-- Admins can do everything
CREATE POLICY "admin_all_favourite_groomers"
  ON public.favourite_groomers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE clerk_id = get_clerk_user_id() AND is_admin = true
    )
  );
