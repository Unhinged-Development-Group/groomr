-- Add missing verification document columns to groomer_profiles.
-- Only insurance_doc_url existed from the base schema; these were referenced
-- in code and the verification_status migration but never created.

ALTER TABLE groomer_profiles
  ADD COLUMN IF NOT EXISTS qualification_doc_url            text,
  ADD COLUMN IF NOT EXISTS first_aid_doc_url                text,
  ADD COLUMN IF NOT EXISTS photo_id_doc_url                 text,
  ADD COLUMN IF NOT EXISTS employers_liability_doc_url      text,
  ADD COLUMN IF NOT EXISTS has_employees                    boolean,
  ADD COLUMN IF NOT EXISTS insurance_doc_verified           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS qualification_doc_verified       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_aid_doc_verified           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_id_doc_verified            boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS employers_liability_doc_verified boolean NOT NULL DEFAULT false;
