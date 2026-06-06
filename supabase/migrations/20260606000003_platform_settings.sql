CREATE TABLE IF NOT EXISTS public.platform_settings (
  id                        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_fee_pct          numeric NOT NULL DEFAULT 0.08,
  founding_groomer_fee_pct  numeric NOT NULL DEFAULT 0.00,
  founding_groomer_deadline date,
  updated_at                timestamptz DEFAULT now(),
  updated_by                uuid    REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON public.platform_settings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

-- Seed single settings row (idempotent)
INSERT INTO public.platform_settings (platform_fee_pct, founding_groomer_fee_pct)
SELECT 0.08, 0.00
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);
