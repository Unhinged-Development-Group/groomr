-- Per-groomer founding-rate expiry date.
-- The founding incentive is "0% commission for 6 months from signup", so the
-- end date differs per groomer — a single global deadline can't represent it.
-- Fee resolution (lib/fees.ts) charges founding_groomer_fee_pct while
-- is_founding_groomer = true AND founding_until has not passed; afterwards the
-- standard platform_fee_pct applies automatically (no cron needed).
-- Falls back to platform_settings.founding_groomer_deadline when NULL.

ALTER TABLE groomer_profiles
  ADD COLUMN IF NOT EXISTS founding_until date;

-- Backfill existing founding groomers: signup + 6 months
UPDATE groomer_profiles
SET founding_until = (created_at + interval '6 months')::date
WHERE is_founding_groomer = true AND founding_until IS NULL;
