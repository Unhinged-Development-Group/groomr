-- Add is_accepting_bookings flag to groomer_profiles.
-- New groomers start with bookings closed; they open once set up and ready.
ALTER TABLE groomer_profiles
  ADD COLUMN IF NOT EXISTS is_accepting_bookings boolean NOT NULL DEFAULT false;
