-- Add per-size pricing to services.
-- size_prices JSONB stores {xs, small, medium, large, xl} → price in pence.
-- Presence of a key means that size is available; absence means not offered.
-- price_pence stays as a fallback for dogs with unset size (derived = min of enabled sizes).
-- applicable_sizes is kept in sync by saveServices so existing queries/indexes still work.

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS size_prices jsonb NOT NULL DEFAULT '{}';
