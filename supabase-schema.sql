-- Kullanıcılar tablosu (Supabase auth kullanacağız ama ek bilgiler için)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizler tablosu
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz soruları tablosu
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice', -- multiple_choice, true_false
  time_limit INTEGER DEFAULT 30, -- saniye cinsinden
  points INTEGER DEFAULT 1000,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Soru seçenekleri tablosu
CREATE TABLE IF NOT EXISTS question_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  color TEXT DEFAULT 'blue', -- red, blue, yellow, green (Online Quiz tarzı renkler)
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz oturumları tablosu (gerçek zamanlı oyun oturumları)
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_pin TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'waiting', -- waiting, started, finished
  current_question_index INTEGER DEFAULT 0,
  current_question_started_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Oyuncu katılımları tablosu
CREATE TABLE IF NOT EXISTS game_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  total_score INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Oyuncu cevapları tablosu
CREATE TABLE IF NOT EXISTS game_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES game_participants(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_taken INTEGER, -- milisaniye cinsinden
  points_earned INTEGER DEFAULT 0,
  is_correct BOOLEAN DEFAULT false
);

-- Row Level Security (RLS) politikaları
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_answers ENABLE ROW LEVEL SECURITY;

-- Profil politikaları
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Quiz politikaları
CREATE POLICY "Public quizzes are viewable by everyone" ON quizzes
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create quizzes" ON quizzes
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own quizzes" ON quizzes
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own quizzes" ON quizzes
  FOR DELETE USING (auth.uid() = creator_id);

-- Soru politikaları
CREATE POLICY "Questions are viewable by quiz owners and session participants" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND (quizzes.creator_id = auth.uid() OR quizzes.is_public = true)
    )
  );

CREATE POLICY "Quiz owners can manage questions" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.creator_id = auth.uid()
    )
  );

-- Soru seçenekleri politikaları
CREATE POLICY "Question options follow question policies" ON question_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = question_options.question_id
      AND (quizzes.creator_id = auth.uid() OR quizzes.is_public = true)
    )
  );

CREATE POLICY "Quiz owners can manage question options" ON question_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = question_options.question_id
      AND quizzes.creator_id = auth.uid()
    )
  );

-- Oyun oturumu politikaları
CREATE POLICY "Game sessions are viewable by participants and hosts" ON game_sessions
  FOR SELECT USING (
    host_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM game_participants 
      WHERE game_participants.session_id = game_sessions.id 
      AND game_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can manage their game sessions" ON game_sessions
  FOR ALL USING (host_id = auth.uid());

-- Katılımcı politikaları
CREATE POLICY "Participants can view session participants" ON game_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM game_sessions 
      WHERE game_sessions.id = game_participants.session_id 
      AND (
        game_sessions.host_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM game_participants gp2 
          WHERE gp2.session_id = game_sessions.id 
          AND gp2.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can join game sessions" ON game_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cevap politikaları
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

CREATE POLICY "Participants can submit their own answers" ON game_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_participants 
      WHERE game_participants.id = game_answers.participant_id 
      AND game_participants.user_id = auth.uid()
    )
  );

-- Fonksiyonlar
-- Oyun PIN'i üretme fonksiyonu
CREATE OR REPLACE FUNCTION generate_game_pin()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Realtime abonelikleri
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE game_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE game_answers;