-- Allow anonymous/authenticated users to read active availability rows.
-- The modal and booking flow use the anon client; without this policy
-- the availability table returns empty, hiding opening hours and blocking
-- day selection in the booking calendar.
CREATE POLICY "public_read_availability"
  ON availability
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Same for overrides — getAvailableSlots reads these via the admin client
-- (server action) so this is precautionary for any future client-side reads.
CREATE POLICY "public_read_availability_overrides"
  ON availability_overrides
  FOR SELECT
  TO anon, authenticated
  USING (true);
