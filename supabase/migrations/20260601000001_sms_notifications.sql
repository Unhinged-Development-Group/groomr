-- Add SMS notification preference to owner profiles
ALTER TABLE profiles
  ADD COLUMN sms_notifications_enabled boolean NOT NULL DEFAULT true;

-- Track SMS reminders independently from email reminders
ALTER TABLE appointments
  ADD COLUMN sms_reminder_sent_at timestamptz;
