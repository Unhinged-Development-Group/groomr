-- Manual bookings created by groomers don't have a dog profile.
-- dog_id must be nullable so groomer-initiated appointments can omit it.
ALTER TABLE appointments ALTER COLUMN dog_id DROP NOT NULL;
