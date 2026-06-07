-- Soft-delete support for GDPR compliance.
-- Instead of destroying profile rows on account closure, we flag them as deleted
-- and retain them for 30 days to allow dispute/financial record lookups.
-- A future cron job should hard-delete rows where is_deleted = true AND deleted_at < now() - interval '30 days',
-- excluding profiles linked to unresolved disputes or payments within the UK 7-year tax retention window.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_deleted  boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at  timestamptz;

CREATE INDEX IF NOT EXISTS profiles_is_deleted_idx ON profiles (is_deleted) WHERE is_deleted = true;
