-- Add verification_status enum to replace/augment the boolean is_verified field.
-- Tracks the full lifecycle: not submitted → awaiting admin review → verified,
-- with two revocation states (temporary vs permanent).

CREATE TYPE verification_status AS ENUM (
  'not_submitted',
  'awaiting',
  'verified',
  'revoked_temp',
  'revoked_perm'
);

ALTER TABLE groomer_profiles
  ADD COLUMN verification_status verification_status NOT NULL DEFAULT 'not_submitted';

-- Backfill: verified groomers
UPDATE groomer_profiles
  SET verification_status = 'verified'
  WHERE is_verified = true;

-- Backfill: groomers with docs uploaded but not yet verified
UPDATE groomer_profiles
  SET verification_status = 'awaiting'
  WHERE is_verified = false
    AND (
      insurance_doc_url IS NOT NULL
      OR qualification_doc_url IS NOT NULL
      OR first_aid_doc_url IS NOT NULL
      OR photo_id_doc_url IS NOT NULL
      OR employers_liability_doc_url IS NOT NULL
    );
