-- Text search: finds listed groomers matching a query string across
-- business_name, city, postcode, bio, and tagline fields.
CREATE OR REPLACE FUNCTION search_groomers_by_text(query text)
RETURNS TABLE (
  id                  uuid,
  business_name       text,
  tagline             text,
  bio                 text,
  city                text,
  postcode            text,
  is_mobile           boolean,
  average_rating      numeric,
  total_reviews       integer,
  is_listed           boolean,
  is_verified         boolean,
  deposit_type        text,
  deposit_percentage  smallint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    business_name,
    tagline,
    bio,
    city,
    postcode,
    is_mobile,
    average_rating,
    total_reviews,
    is_listed,
    is_verified,
    deposit_type,
    deposit_percentage
  FROM groomer_profiles
  WHERE
    is_listed = true
    AND (
      business_name ILIKE '%' || query || '%'
      OR city        ILIKE '%' || query || '%'
      OR postcode    ILIKE '%' || query || '%'
      OR bio         ILIKE '%' || query || '%'
      OR tagline     ILIKE '%' || query || '%'
    )
  ORDER BY average_rating DESC NULLS LAST;
$$;

-- Geo search: finds listed groomers within radius_metres of a lat/lng point.
-- Returns distance and coordinates so the map can pin them.
CREATE OR REPLACE FUNCTION search_groomers_near(
  user_lat       float,
  user_lng       float,
  radius_metres  float
)
RETURNS TABLE (
  id                  uuid,
  business_name       text,
  tagline             text,
  bio                 text,
  city                text,
  postcode            text,
  is_mobile           boolean,
  average_rating      numeric,
  total_reviews       integer,
  is_listed           boolean,
  is_verified         boolean,
  distance_metres     float,
  lat                 float,
  lng                 float,
  deposit_type        text,
  deposit_percentage  smallint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    business_name,
    tagline,
    bio,
    city,
    postcode,
    is_mobile,
    average_rating,
    total_reviews,
    is_listed,
    is_verified,
    ST_Distance(location, ST_MakePoint(user_lng, user_lat)::geography)  AS distance_metres,
    ST_Y(location::geometry)                                             AS lat,
    ST_X(location::geometry)                                             AS lng,
    deposit_type,
    deposit_percentage
  FROM groomer_profiles
  WHERE
    is_listed = true
    AND location IS NOT NULL
    AND ST_DWithin(location, ST_MakePoint(user_lng, user_lat)::geography, radius_metres)
  ORDER BY distance_metres ASC;
$$;
