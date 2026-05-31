-- Add public_slug to groomer_profiles for clean shareable URLs
ALTER TABLE public.groomer_profiles
  ADD COLUMN public_slug text UNIQUE;

CREATE INDEX groomer_profiles_public_slug_idx ON public.groomer_profiles (public_slug);
