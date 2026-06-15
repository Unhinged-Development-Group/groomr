ALTER TABLE groomer_profiles
  ADD COLUMN IF NOT EXISTS insurance_doc_rejection_reason text,
  ADD COLUMN IF NOT EXISTS photo_id_doc_rejection_reason text,
  ADD COLUMN IF NOT EXISTS qualification_doc_rejection_reason text,
  ADD COLUMN IF NOT EXISTS first_aid_doc_rejection_reason text,
  ADD COLUMN IF NOT EXISTS employers_liability_doc_rejection_reason text;
