-- client_settings: per-owner deposit override and discount for a groomer's clients
CREATE TABLE public.client_settings (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  groomer_profile_id    uuid        NOT NULL REFERENCES public.groomer_profiles(id) ON DELETE CASCADE,
  owner_id              uuid        NOT NULL REFERENCES public.profiles(id)         ON DELETE CASCADE,
  deposit_override      text        NOT NULL DEFAULT 'inherit'
                                    CHECK (deposit_override IN ('inherit', 'none')),
  discount_percentage   smallint    DEFAULT NULL
                                    CHECK (discount_percentage IS NULL OR discount_percentage BETWEEN 0 AND 100),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE (groomer_profile_id, owner_id)
);

CREATE INDEX client_settings_groomer_idx ON public.client_settings (groomer_profile_id);
CREATE INDEX client_settings_owner_idx   ON public.client_settings (owner_id);

ALTER TABLE public.client_settings ENABLE ROW LEVEL SECURITY;

-- Groomers manage settings for their own clients
CREATE POLICY "groomer_crud_own_client_settings" ON public.client_settings
  FOR ALL USING (
    groomer_profile_id IN (
      SELECT id FROM public.groomer_profiles
      WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
    )
  );

-- Owners can read their own settings so the booking flow can check pricing/deposit
CREATE POLICY "owner_read_own_client_settings" ON public.client_settings
  FOR SELECT USING (
    owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
  );

-- client_service_prices: per-service fixed price overrides
CREATE TABLE public.client_service_prices (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  groomer_profile_id    uuid        NOT NULL REFERENCES public.groomer_profiles(id) ON DELETE CASCADE,
  owner_id              uuid        NOT NULL REFERENCES public.profiles(id)         ON DELETE CASCADE,
  service_id            uuid        NOT NULL REFERENCES public.services(id)         ON DELETE CASCADE,
  override_price_pence  integer     NOT NULL DEFAULT 0
                                    CHECK (override_price_pence >= 0),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE (groomer_profile_id, owner_id, service_id)
);

CREATE INDEX client_service_prices_groomer_idx ON public.client_service_prices (groomer_profile_id);
CREATE INDEX client_service_prices_owner_idx   ON public.client_service_prices (owner_id);

ALTER TABLE public.client_service_prices ENABLE ROW LEVEL SECURITY;

-- Groomers manage price overrides for their own clients
CREATE POLICY "groomer_crud_client_service_prices" ON public.client_service_prices
  FOR ALL USING (
    groomer_profile_id IN (
      SELECT id FROM public.groomer_profiles
      WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
    )
  );

-- Owners can read their own price overrides so the booking flow shows correct prices
CREATE POLICY "owner_read_own_client_service_prices" ON public.client_service_prices
  FOR SELECT USING (
    owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
  );
