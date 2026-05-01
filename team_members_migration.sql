-- Migration: create team_members table

CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    groomer_profile_id UUID REFERENCES groomer_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    since_year SMALLINT,
    public_slug TEXT UNIQUE,
    average_rating NUMERIC(3, 2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Public can view all team members
CREATE POLICY "Public can view team members"
ON team_members
FOR SELECT
USING (true);

-- 2. Groomers can manage their own team members
-- The groomer_profiles table has user_id which references profiles.id.
CREATE POLICY "Groomers can manage their own team members"
ON team_members
FOR ALL
USING (
    groomer_profile_id IN (
        SELECT id FROM groomer_profiles 
        WHERE user_id IN (SELECT id FROM profiles WHERE clerk_id = get_clerk_user_id())
    )
)
WITH CHECK (
    groomer_profile_id IN (
        SELECT id FROM groomer_profiles 
        WHERE user_id IN (SELECT id FROM profiles WHERE clerk_id = get_clerk_user_id())
    )
);

-- Admin policy
CREATE POLICY "Admin access"
ON team_members
FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE clerk_id = get_clerk_user_id() AND is_admin = true));
