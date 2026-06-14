-- Add GoCardless columns to payments table.
-- payment_method distinguishes Stripe (default) from GoCardless.
-- gc_* columns store GoCardless resource IDs for webhook reconciliation.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS gc_billing_request_id text,
  ADD COLUMN IF NOT EXISTS gc_mandate_id text,
  ADD COLUMN IF NOT EXISTS gc_payment_id text;

CREATE INDEX IF NOT EXISTS payments_gc_billing_request_id_idx ON payments (gc_billing_request_id);
CREATE INDEX IF NOT EXISTS payments_gc_payment_id_idx ON payments (gc_payment_id);
