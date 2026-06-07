ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_fee_pence integer DEFAULT 0;
