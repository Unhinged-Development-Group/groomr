-- Extend dispute_status enum with new workflow states
ALTER TYPE dispute_status ADD VALUE IF NOT EXISTS 'pending' BEFORE 'open';
ALTER TYPE dispute_status ADD VALUE IF NOT EXISTS 'awaiting_agreement' BEFORE 'resolved';
ALTER TYPE dispute_status ADD VALUE IF NOT EXISTS 'final_review' BEFORE 'resolved';
ALTER TYPE dispute_status ADD VALUE IF NOT EXISTS 'awaiting_final_agreement' BEFORE 'resolved';

-- Add comment + two-round resolution columns
ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS raised_by                    text DEFAULT 'owner',
  ADD COLUMN IF NOT EXISTS owner_comment                text,
  ADD COLUMN IF NOT EXISTS groomer_comment              text,
  ADD COLUMN IF NOT EXISTS proposed_resolution          text,
  ADD COLUMN IF NOT EXISTS resolution_proposed_at       timestamptz,
  ADD COLUMN IF NOT EXISTS owner_agreed                 boolean,
  ADD COLUMN IF NOT EXISTS groomer_agreed               boolean,
  ADD COLUMN IF NOT EXISTS final_resolution             text,
  ADD COLUMN IF NOT EXISTS final_resolution_proposed_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_agreed_final           boolean,
  ADD COLUMN IF NOT EXISTS groomer_agreed_final         boolean;

-- Explicit grants required — service role bypasses RLS but still needs GRANT
GRANT ALL ON public.disputes TO authenticated, service_role, anon;
