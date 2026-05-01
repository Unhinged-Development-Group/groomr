-- Migration: create favourite_groomers table

CREATE TABLE IF NOT EXISTS favourite_groomers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    groomer_profile_id UUID REFERENCES groomer_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(owner_id, groomer_profile_id)
);

-- Enable RLS
ALTER TABLE favourite_groomers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Owners can view their own favourites"
ON favourite_groomers
FOR SELECT
USING (owner_id IN (SELECT id FROM profiles WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "Owners can insert their own favourites"
ON favourite_groomers
FOR INSERT
WITH CHECK (owner_id IN (SELECT id FROM profiles WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "Owners can delete their own favourites"
ON favourite_groomers
FOR DELETE
USING (owner_id IN (SELECT id FROM profiles WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "Admin access"
ON favourite_groomers
FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true));

-- Grant table-level permissions
GRANT ALL ON favourite_groomers TO service_role;
GRANT ALL ON favourite_groomers TO authenticated;
GRANT SELECT ON favourite_groomers TO anon;
