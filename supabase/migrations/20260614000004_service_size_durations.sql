ALTER TABLE services ADD COLUMN IF NOT EXISTS size_durations jsonb NOT NULL DEFAULT '{}';
