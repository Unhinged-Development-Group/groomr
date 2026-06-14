-- Admin support notes on appointments, separate from groomer/owner user notes
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS admin_note_groomer      text,
  ADD COLUMN IF NOT EXISTS admin_note_groomer_author text,
  ADD COLUMN IF NOT EXISTS admin_note_owner        text,
  ADD COLUMN IF NOT EXISTS admin_note_owner_author  text;
