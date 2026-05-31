-- =============================================================================
-- Notifications table for groomers
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  groomer_profile_id uuid    NOT NULL REFERENCES groomer_profiles(id) ON DELETE CASCADE,
  type           text        NOT NULL,
  -- 'new_appointment' | 'cancelled_appointment' | 'rescheduled_appointment'
  -- | 'new_review' | 'payout_processed' | 'new_client'
  title          text        NOT NULL,
  body           text        NOT NULL,
  metadata       jsonb       DEFAULT '{}',
  read_at        timestamptz,
  created_at     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_groomer_profile_id_idx ON notifications(groomer_profile_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(groomer_profile_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; grant for realtime broadcast receive
GRANT ALL ON notifications TO service_role;

-- =============================================================================
-- Seed realistic mock notifications for existing groomers
-- =============================================================================

INSERT INTO notifications (groomer_profile_id, type, title, body, read_at, created_at)
SELECT
  gp.id,
  unnested.type,
  unnested.title,
  unnested.body,
  unnested.read_at,
  unnested.created_at
FROM groomer_profiles gp
CROSS JOIN LATERAL (
  VALUES
    ('new_appointment',      'New booking — Bella',          'Jamie booked a Full Groom for Bella (Golden Retriever) on Thu 5 Jun at 10:00am.',                               now() - interval '5 minutes',  NULL::timestamptz),
    ('new_client',           'First booking from a new client', 'Sam Wilson has made their first booking with you — Full Groom for Charlie on Fri 6 Jun at 2:00pm.',          now() - interval '22 minutes', NULL::timestamptz),
    ('new_review',           'New 5-star review',            'Anya left you a review: "Murphy looks absolutely gorgeous — best groom yet. Will be back every 6 weeks!"',       now() - interval '2 hours',    NULL::timestamptz),
    ('payout_processed',     'Payout of £342 initiated',     'Your weekly payout of £342.00 is on its way and should arrive in your account within 1–2 business days.',       now() - interval '6 hours',    now() - interval '5 hours'),
    ('rescheduled_appointment','Appointment rescheduled',    'Tom moved his appointment for Biscuit (Border Terrier) from Wed 4 Jun 11:30am to Thu 5 Jun 2:00pm.',            now() - interval '1 day',      now() - interval '23 hours'),
    ('cancelled_appointment', 'Booking cancelled — Otis',   'Priya has cancelled her Full Groom for Otis (Cockapoo) on Mon 2 Jun at 3:00pm. The slot is now free.',          now() - interval '2 days',     now() - interval '2 days'),
    ('new_appointment',      'New booking — Luna',           'Rachel booked a Bath & Blowdry for Luna (Goldendoodle) on Sat 7 Jun at 11:00am.',                               now() - interval '3 days',     now() - interval '3 days'),
    ('payout_processed',     'Payout of £285 initiated',    'Your weekly payout of £285.00 is on its way and should arrive in your account within 1–2 business days.',       now() - interval '8 days',     now() - interval '8 days')
) AS unnested(type, title, body, created_at, read_at)
ON CONFLICT DO NOTHING;
