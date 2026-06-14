-- break_start_time stores either a legacy plain "HH:MM" string or a JSON array
-- of break slots e.g. '[{"s":"09:00","e":"10:00"},{"s":"12:00","e":"13:00"}]'.
-- Change from time → text so both formats can be persisted.
ALTER TABLE availability
  ALTER COLUMN break_start_time TYPE text USING break_start_time::text,
  ALTER COLUMN break_end_time   TYPE text USING break_end_time::text;
