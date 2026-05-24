-- Add optional break window to daily availability rows.
-- break_start_time and break_end_time are both NULL when no break is set.
-- If only one is set, treat as no break (UI enforces both or neither).
ALTER TABLE availability
  ADD COLUMN break_start_time time,
  ADD COLUMN break_end_time   time;
