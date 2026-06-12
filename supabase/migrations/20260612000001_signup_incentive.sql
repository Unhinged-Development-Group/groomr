-- v2 sign-up incentive (public/policies/groomer-sign-up-incentive.html):
-- EVERY groomer's first N completed bookings are commission-free (N = 150).
-- Replaces the date-based founding-groomer commission deal — founding groomer
-- is now a permanent status badge with no fee implications (founding_until and
-- founding_groomer_fee_pct/deadline are retained but no longer drive fees).

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS signup_incentive_bookings integer NOT NULL DEFAULT 150;
