-- Grant SELECT on public-facing tables to anon and authenticated roles.
-- Without these grants the anon client gets 401 (permission denied at the
-- role level, before RLS even runs).

GRANT SELECT ON availability            TO anon, authenticated;
GRANT SELECT ON availability_overrides  TO anon, authenticated;
GRANT SELECT ON reviews                 TO anon, authenticated;
GRANT SELECT ON services                TO anon, authenticated;
GRANT SELECT ON groomer_profiles        TO anon, authenticated;
GRANT SELECT ON profiles                TO anon, authenticated;

-- RLS policies for availability (drop first in case the earlier migration
-- ran partially and left a duplicate).
DROP POLICY IF EXISTS "public_read_availability"          ON availability;
DROP POLICY IF EXISTS "public_read_availability_overrides" ON availability_overrides;

CREATE POLICY "public_read_availability"
  ON availability
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- For reviews, only show visible ones
DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
CREATE POLICY "public_read_reviews"
  ON reviews
  FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);
