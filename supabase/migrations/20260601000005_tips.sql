CREATE TABLE public.tips (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id        uuid        NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  owner_id              uuid        NOT NULL REFERENCES public.profiles(id),
  groomer_profile_id    uuid        NOT NULL REFERENCES public.groomer_profiles(id),
  amount_pence          integer     NOT NULL CHECK (amount_pence > 0),
  stripe_payment_intent_id text     UNIQUE,
  status                text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX tips_appointment_idx      ON public.tips (appointment_id);
CREATE INDEX tips_owner_idx            ON public.tips (owner_id);
CREATE INDEX tips_groomer_profile_idx  ON public.tips (groomer_profile_id);

ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Owner can insert and read their own tips
CREATE POLICY "owner_manage_own_tips" ON public.tips
  FOR ALL USING (
    owner_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
  );

-- Groomer can read tips paid to their profile
CREATE POLICY "groomer_read_received_tips" ON public.tips
  FOR SELECT USING (
    groomer_profile_id IN (
      SELECT id FROM public.groomer_profiles
      WHERE user_id = (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_user_id())
    )
  );
