-- RLS policies for the messages table so participants can only read/write their own threads.
-- Note: the app uses supabaseAdmin (service-role) in server actions, which bypasses RLS.
-- These policies protect against future anon/client-side access.

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Participants (sender or appointment owner/groomer) can read messages
DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    sender_id = auth.uid()
    OR appointment_id IN (
      SELECT id FROM appointments
      WHERE owner_id = auth.uid()
         OR groomer_profile_id IN (
              SELECT id FROM groomer_profiles WHERE user_id = auth.uid()
         )
    )
  );

-- Only the authenticated sender can insert
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());
