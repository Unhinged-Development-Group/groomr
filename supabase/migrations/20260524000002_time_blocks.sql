-- time_blocks: multi-day vacation / unavailability blocks (distinct from weekly availability)
CREATE TABLE IF NOT EXISTS time_blocks (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  groomer_profile_id  uuid        NOT NULL REFERENCES groomer_profiles(id) ON DELETE CASCADE,
  start_date          date        NOT NULL,
  end_date            date        NOT NULL,
  start_time          time,
  end_time            time,
  all_day             boolean     DEFAULT true,
  reason              text,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS time_blocks_groomer_idx ON time_blocks(groomer_profile_id);
