-- portfolio_photos: stores groomer work gallery images uploaded via Cloudinary
CREATE TABLE IF NOT EXISTS portfolio_photos (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  groomer_profile_id  uuid        NOT NULL REFERENCES groomer_profiles(id) ON DELETE CASCADE,
  url                 text        NOT NULL,
  caption             text,
  sort_order          smallint    DEFAULT 0,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_photos_groomer_idx ON portfolio_photos(groomer_profile_id);
