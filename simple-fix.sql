-- BASIT RLS DÜZELTMESİ - Her komutu tek tek çalıştırın

-- 1. Problematik politikaları sil
DROP POLICY IF EXISTS "Game sessions are viewable by participants and hosts" ON game_sessions;

-- 2. Problematik politikaları sil
DROP POLICY IF EXISTS "Participants can view session participants" ON game_participants;

-- 3. Problematik politikaları sil  
DROP POLICY IF EXISTS "Users can view answers in their sessions" ON game_answers;

-- 4. Game sessions için basit politika
CREATE POLICY "Simple game sessions policy" ON game_sessions
  FOR ALL USING (true);

-- 5. Game participants için basit politika
CREATE POLICY "Simple participants policy" ON game_participants
  FOR ALL USING (true);

-- 6. Game answers için basit politika
CREATE POLICY "Simple answers policy" ON game_answers
  FOR ALL USING (true);