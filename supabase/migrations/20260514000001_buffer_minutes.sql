-- Add default buffer time between appointments to groomer_profiles
ALTER TABLE groomer_profiles
  ADD COLUMN IF NOT EXISTS default_buffer_minutes smallint NOT NULL DEFAULT 0;
