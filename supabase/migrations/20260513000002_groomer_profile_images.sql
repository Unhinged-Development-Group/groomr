-- Add image URL columns to groomer_profiles
-- Required for cover photo upload and gallery features (Phase 5)

ALTER TABLE public.groomer_profiles
  ADD COLUMN IF NOT EXISTS profile_image_url  text,
  ADD COLUMN IF NOT EXISTS banner_image_url   text;
