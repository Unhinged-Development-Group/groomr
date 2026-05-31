-- contract_terms: versioned custom terms per groomer
CREATE TABLE public.contract_terms (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  groomer_profile_id    uuid        NOT NULL REFERENCES public.groomer_profiles(id) ON DELETE CASCADE,
  version               integer     NOT NULL DEFAULT 1,
  content               text        NOT NULL,
  is_current            boolean     NOT NULL DEFAULT false,
  published_at          timestamptz DEFAULT now(),
  created_at            timestamptz DEFAULT now(),
  UNIQUE (groomer_profile_id, version)
);

CREATE INDEX contract_terms_groomer_idx ON public.contract_terms (groomer_profile_id);

ALTER TABLE public.contract_terms ENABLE ROW LEVEL SECURITY;

-- Groomers manage their own terms
CREATE POLICY "groomer_manage_own_terms" ON public.contract_terms
  FOR ALL USING (
    groomer_profile_id IN (
      SELECT id FROM public.groomer_profiles
      WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
    )
  );

-- Anyone (authenticated) can read current terms to show during booking
CREATE POLICY "authenticated_read_current_terms" ON public.contract_terms
  FOR SELECT TO authenticated
  USING (is_current = true);

-- contract_acceptances: tracks which owner accepted which version
CREATE TABLE public.contract_acceptances (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  groomer_profile_id    uuid        NOT NULL REFERENCES public.groomer_profiles(id) ON DELETE CASCADE,
  owner_id              uuid        NOT NULL REFERENCES public.profiles(id)         ON DELETE CASCADE,
  contract_terms_id     uuid        NOT NULL REFERENCES public.contract_terms(id)  ON DELETE CASCADE,
  accepted_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (groomer_profile_id, owner_id, contract_terms_id)
);

CREATE INDEX contract_acceptances_groomer_idx ON public.contract_acceptances (groomer_profile_id);
CREATE INDEX contract_acceptances_owner_idx   ON public.contract_acceptances (owner_id);

ALTER TABLE public.contract_acceptances ENABLE ROW LEVEL SECURITY;

-- Owners insert and read their own acceptances
CREATE POLICY "owner_insert_own_acceptance" ON public.contract_acceptances
  FOR INSERT WITH CHECK (
    owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
  );

CREATE POLICY "owner_select_own_acceptances" ON public.contract_acceptances
  FOR SELECT USING (
    owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
  );

-- Groomers can see acceptances for their own profile
CREATE POLICY "groomer_select_acceptances_for_own_profile" ON public.contract_acceptances
  FOR SELECT USING (
    groomer_profile_id IN (
      SELECT id FROM public.groomer_profiles
      WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
    )
  );
