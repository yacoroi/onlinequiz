-- Bu dosyayı Supabase Dashboard'da SQL editöründe çalıştırın

-- Eski politikaları sil
DROP POLICY IF EXISTS "Game sessions are viewable by participants and hosts" ON game_sessions;
DROP POLICY IF EXISTS "Participants can view session participants" ON game_participants;
DROP POLICY IF EXISTS "Users can view answers in their sessions" ON game_answers;

-- Düzeltilmiş politikalar
CREATE POLICY "Game sessions are viewable by participants and hosts" ON game_sessions
  FOR SELECT USING (
    host_id = auth.uid() OR
    id IN (
      SELECT session_id FROM game_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can view session participants" ON game_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM game_sessions 
      WHERE game_sessions.id = game_participants.session_id 
      AND game_sessions.host_id = auth.uid()
    )
  );

CREATE POLICY "Users can view answers in their sessions" ON game_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_participants 
      WHERE game_participants.id = game_answers.participant_id 
      AND game_participants.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM game_sessions 
      WHERE game_sessions.id = game_answers.session_id 
      AND game_sessions.host_id = auth.uid()
    )
  );