-- Add invite_token to team_members for race-safe invite claiming.
-- The token is generated server-side, passed through Clerk publicMetadata,
-- and matched atomically in the user.created webhook (UPDATE WHERE invite_token = ? AND invite_status = 'pending').
-- UNIQUE ensures only one Clerk account can claim a given invite row even under concurrent webhook delivery.

ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS invite_token uuid UNIQUE;
