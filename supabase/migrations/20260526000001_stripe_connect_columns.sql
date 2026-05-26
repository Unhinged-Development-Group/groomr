-- Add Stripe Connect status columns to groomer_profiles
-- These are synced from Stripe via webhook (account.updated)
-- and via getConnectAccountStatus() server action.

ALTER TABLE groomer_profiles
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_details_submitted boolean DEFAULT false;

COMMENT ON COLUMN groomer_profiles.stripe_charges_enabled   IS 'True when Stripe has approved the account for live charges';
COMMENT ON COLUMN groomer_profiles.stripe_details_submitted IS 'True when the groomer has completed Stripe onboarding form';
