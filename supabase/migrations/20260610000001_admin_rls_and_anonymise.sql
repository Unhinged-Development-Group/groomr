-- Security backlog S13 + S7b support.
--
-- Part 1: admin_all RLS policies for tables created after the base schema.
--   The base schema gave admins a DB-level policy on the original tables, but
--   later migrations (messages, notifications, client pricing, recurring,
--   contracts, tips, portfolio, overrides) never got one — admin access to
--   those was enforced in application code only.
--
-- Part 2: trigger preventing privilege escalation via profiles.is_admin.
--   The "update own profile" policy lets a user UPDATE their own row, which
--   includes is_admin. This trigger rejects any is_admin change unless it
--   comes from a privileged connection (service role / dashboard) or an
--   existing admin acting through the anon client.
--
-- Part 3: anonymised_at column for the 30-day GDPR cleanup cron.
--   Profiles that must be retained for the UK 7-year tax window (payments)
--   or open disputes are PII-scrubbed instead of hard-deleted; this column
--   marks them done so the cron doesn't reprocess them daily.

-- ---------------------------------------------------------------------------
-- Part 1: missing admin_all policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "admin_all_availability_overrides" ON public.availability_overrides;
CREATE POLICY "admin_all_availability_overrides"
  ON public.availability_overrides FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

DROP POLICY IF EXISTS "admin_all_messages" ON public.messages;
CREATE POLICY "admin_all_messages"
  ON public.messages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

DROP POLICY IF EXISTS "admin_all_portfolio_photos" ON public.portfolio_photos;
CREATE POLICY "admin_all_portfolio_photos"
  ON public.portfolio_photos FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

DROP POLICY IF EXISTS "admin_all_notifications" ON public.notifications;
CREATE POLICY "admin_all_notifications"
  ON public.notifications FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

DROP POLICY IF EXISTS "admin_all_client_settings" ON public.client_settings;
CREATE POLICY "admin_all_client_settings"
  ON public.client_settings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

DROP POLICY IF EXISTS "admin_all_client_service_prices" ON public.client_service_prices;
CREATE POLICY "admin_all_client_service_prices"
  ON public.client_service_prices FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

DROP POLICY IF EXISTS "admin_all_recurring_series" ON public.recurring_series;
CREATE POLICY "admin_all_recurring_series"
  ON public.recurring_series FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

DROP POLICY IF EXISTS "admin_all_contract_terms" ON public.contract_terms;
CREATE POLICY "admin_all_contract_terms"
  ON public.contract_terms FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

DROP POLICY IF EXISTS "admin_all_contract_acceptances" ON public.contract_acceptances;
CREATE POLICY "admin_all_contract_acceptances"
  ON public.contract_acceptances FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

DROP POLICY IF EXISTS "admin_all_tips" ON public.tips;
CREATE POLICY "admin_all_tips"
  ON public.tips FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = get_clerk_user_id() AND is_admin = true
  ));

-- ---------------------------------------------------------------------------
-- Part 2: block is_admin self-escalation
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_is_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    -- Privileged connections: service-role server actions, dashboard/postgres.
    IF current_user NOT IN ('anon', 'authenticated') THEN
      RETURN NEW;
    END IF;
    -- Existing admins acting through the anon client (admin UI).
    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE clerk_id = get_clerk_user_id() AND is_admin = true
    ) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'is_admin can only be changed by an administrator';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_is_admin_trigger ON public.profiles;
CREATE TRIGGER protect_is_admin_trigger
  BEFORE UPDATE OF is_admin ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_is_admin();

-- ---------------------------------------------------------------------------
-- Part 3: anonymisation marker for the cleanup cron
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS anonymised_at timestamptz;
