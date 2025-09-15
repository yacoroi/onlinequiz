-- SUPABASE RLS POLİTİKA SORUNLARINI TAMAMEN DÜZELT
-- Bu dosyayı Supabase Dashboard'da SQL editöründe çalıştırın

-- 1. Önce tüm problematik politikaları sil
DROP POLICY IF EXISTS "Game sessions are viewable by participants and hosts" ON game_sessions;
DROP POLICY IF EXISTS "Participants can view session participants" ON game_participants;
DROP POLICY IF EXISTS "Users can view answers in their sessions" ON game_answers;

-- 2. Realtime tabloları kaldır (geçici)
ALTER PUBLICATION supabase_realtime DROP TABLE game_sessions;
ALTER PUBLICATION supabase_realtime DROP TABLE game_participants;
ALTER PUBLICATION supabase_realtime DROP TABLE game_answers;

-- 3. RLS'i geçici olarak kapat
ALTER TABLE game_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_answers DISABLE ROW LEVEL SECURITY;

-- 4. Basit politikalar oluştur
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;  
ALTER TABLE game_answers ENABLE ROW LEVEL SECURITY;

-- Game sessions - basit politika
CREATE POLICY "Anyone can view game sessions" ON game_sessions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create sessions" ON game_sessions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Hosts can update their sessions" ON game_sessions
  FOR UPDATE USING (host_id = auth.uid());

-- Game participants - basit politika  
CREATE POLICY "Anyone can view participants" ON game_participants
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join" ON game_participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their participation" ON game_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Game answers - basit politika
CREATE POLICY "Anyone can view answers" ON game_answers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit answers" ON game_answers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Realtime'ı tekrar ekle
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE game_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE game_answers;