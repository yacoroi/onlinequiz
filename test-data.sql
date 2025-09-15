-- TEST VERİSİ EKLEME
-- Bu komutları Supabase Dashboard'da çalıştırın

-- 1. Önce mevcut test verilerini temizle (isteğe bağlı)
-- DELETE FROM game_answers;
-- DELETE FROM game_participants; 
-- DELETE FROM game_sessions;
-- DELETE FROM question_options;
-- DELETE FROM questions;
-- DELETE FROM quizzes;

-- 2. Test quiz'i oluştur (manuel olarak creator_id'yi güncelleyin)
INSERT INTO quizzes (id, title, description, creator_id, is_public) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Test Quiz', 'Basit test quiz', 'YOUR_USER_ID_HERE', true);

-- 3. Test sorusu ekle
INSERT INTO questions (id, quiz_id, question_text, question_type, time_limit, points, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Hangi renk birincil renktir?', 'multiple_choice', 30, 1000, 0);

-- 4. Test seçenekleri ekle
INSERT INTO question_options (id, question_id, option_text, is_correct, color, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Kırmızı', true, 'red', 0),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Pembe', false, 'blue', 1),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Mor', false, 'yellow', 2),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Turuncu', false, 'green', 3);

-- 5. Test oyun oturumu oluştur
INSERT INTO game_sessions (id, quiz_id, host_id, game_pin, status, current_question_index) VALUES
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440000', 'YOUR_USER_ID_HERE', '123456', 'waiting', 0);