-- Manual Quiz Creation SQL for "1.gün" Quiz
-- User ID: d61a42b4-66e9-479c-b5b4-6d30d1b65370
-- Fixed SQL without updated_at columns

DO $$
DECLARE
    quiz_id uuid;
    q1_id uuid;
    q2_id uuid;
    q3_id uuid;
    q4_id uuid;
    q5_id uuid;
    q6_id uuid;
    q7_id uuid;
    q8_id uuid;
    q9_id uuid;
    q10_id uuid;
    q11_id uuid;
    q12_id uuid;
    q13_id uuid;
    q14_id uuid;
    q15_id uuid;
    q16_id uuid;
    q17_id uuid;
    q18_id uuid;
BEGIN
    -- Create quiz
    INSERT INTO quizzes (title, description, creator_id)
    VALUES ('1.gün', '', 'd61a42b4-66e9-479c-b5b4-6d30d1b65370')
    RETURNING id INTO quiz_id;
    
    -- Question 1
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, 'Hangi Güney Amerika ülkesinde, gökkuşağı renklerinde akan bir nehir bulunur?', 20, 1000, 0)
    RETURNING id INTO q1_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q1_id, 'Kolombiya', true, 'red', 0),
    (q1_id, 'Arjantin', false, 'blue', 1),
    (q1_id, 'Brezilya', false, 'yellow', 2),
    (q1_id, 'Venezuela', false, 'green', 3);
    
    -- Question 2
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, 'Nil Nehri''nin yazın çok, kışın az akmasının sebebi nedir?', 20, 1000, 1)
    RETURNING id INTO q2_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q2_id, 'Dağlardaki karın yazın erimesi', false, 'red', 0),
    (q2_id, 'Rüzgarların yazın çok esmesi', false, 'blue', 1),
    (q2_id, 'Yaz aylarında Tropikal yağmurların sık yağması', true, 'yellow', 2),
    (q2_id, 'Kışın çok bulutlu hava olması', false, 'green', 3);
    
    -- Question 3
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, 'Aşağıdaki birleşik sözcüklerden hangisinde yazım yanlışı yapılmıştır?', 20, 1000, 2)
    RETURNING id INTO q3_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q3_id, 'Partiler arası işbirliği', true, 'red', 0),
    (q3_id, 'Akşamüstü kahvesi', false, 'blue', 1),
    (q3_id, 'Haldun Pekdemir', false, 'yellow', 2),
    (q3_id, 'Güler yüzlü amca', false, 'green', 3);
    
    -- Question 4
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, 'Hangi Asya ülkesinde, kedilere adanmış bir ada olan "Tashirojima" bulunur?', 20, 1000, 3)
    RETURNING id INTO q4_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q4_id, 'Japonya', true, 'red', 0),
    (q4_id, 'Çin', false, 'blue', 1),
    (q4_id, 'Tayland', false, 'yellow', 2),
    (q4_id, 'Güney Kore', false, 'green', 3);
    
    -- Question 5
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, 'Milli Görüş''ün ilk siyasi partisi olan Milli Nizam Partisi hangi yıl kuruldu?', 20, 1000, 4)
    RETURNING id INTO q5_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q5_id, '1972', false, 'red', 0),
    (q5_id, '1970', true, 'blue', 1),
    (q5_id, '1978', false, 'yellow', 2),
    (q5_id, '1969', false, 'green', 3);
    
    -- Question 6
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, 'Hangi ülkede, dünyanın en uzun süre görev yapan kadın başbakanı (17 yıl) görev yapmıştır?', 20, 1000, 5)
    RETURNING id INTO q6_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q6_id, 'Almanya', true, 'red', 0),
    (q6_id, 'Yeni Zelanda', false, 'blue', 1),
    (q6_id, 'Norveç', false, 'yellow', 2),
    (q6_id, 'İzlanda', false, 'green', 3);
    
    -- Question 7
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, 'Hangi hayvan, kendi kuyruğunu yiyerek hayatta kalabilir ve yeniden büyütebilir?', 20, 1000, 6)
    RETURNING id INTO q7_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q7_id, 'Bukalemun', false, 'red', 0),
    (q7_id, 'Semender', true, 'blue', 1),
    (q7_id, 'Yılan', false, 'yellow', 2),
    (q7_id, 'Kertenkele', false, 'green', 3);
    
    -- Question 8
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, 'TÜİK verilerine göre Türkiye''deki erkeklerde evlenme yaş ortalaması kaçtır?', 20, 1000, 7)
    RETURNING id INTO q8_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q8_id, '25', false, 'red', 0),
    (q8_id, '26,4', false, 'blue', 1),
    (q8_id, '28,3', true, 'yellow', 2),
    (q8_id, '25,8', false, 'green', 3);
    
    -- Question 9
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, 'Refah partisi, hangi yıl Anayasa Mahkemesi tarafından kapatıldı?', 20, 1000, 8)
    RETURNING id INTO q9_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q9_id, '1999', false, 'red', 0),
    (q9_id, '1998', true, 'blue', 1),
    (q9_id, '2001', false, 'yellow', 2),
    (q9_id, '1997', false, 'green', 3);
    
    -- Question 10
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, 'Hangi ünlü yazar, kahve bağımlılığı yüzünden günde 50 fincan kahve içerdiği söylenir?', 20, 1000, 9)
    RETURNING id INTO q10_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q10_id, 'Charles Dickens', false, 'red', 0),
    (q10_id, 'Mark Twain', false, 'blue', 1),
    (q10_id, 'Honoré de Balzac', true, 'yellow', 2),
    (q10_id, 'Ernest Hemingway', false, 'green', 3);
    
    -- Question 11
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, 'Hangi Türk siyasi figür, 1990''larda "Yeşil sermaye" kavramıyla ilişkilendirilmiştir?', 20, 1000, 10)
    RETURNING id INTO q11_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q11_id, 'Alparslan Türkeş', false, 'red', 0),
    (q11_id, 'Necmettin Erbakan', true, 'blue', 1),
    (q11_id, 'Tansu Çiller', false, 'yellow', 2),
    (q11_id, 'Mesut Yılmaz', false, 'green', 3);
    
    -- Question 12
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, 'Aşağıdakilerden hangisi Kemal Kılıçdaroğlu''nun özür dilediği konulardan bir tanesidir?', 20, 1000, 11)
    RETURNING id INTO q12_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q12_id, 'Yürüyen merdivene ters binmesi', false, 'red', 0),
    (q12_id, 'Seccadeye basması', true, 'blue', 1),
    (q12_id, '2023 Cb Seçimini kaybetmesi', false, 'yellow', 2),
    (q12_id, 'Kurultay mağlubiyeti', false, 'green', 3);
    
    -- Question 13
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, 'Hangi ülkede, trafik ışıklarında kırmızı yerine kalp şekli kullanılır?', 20, 1000, 12)
    RETURNING id INTO q13_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q13_id, 'Japonya', false, 'red', 0),
    (q13_id, 'Güney Kore', false, 'blue', 1),
    (q13_id, 'Tayvan', true, 'yellow', 2),
    (q13_id, 'Tayland', false, 'green', 3);
    
    -- Question 14
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, 'Yapılan bir sokak röportajında, Ekrem İmamoğlu yerine hangi ifade kullanılmamıştır?', 20, 1000, 13)
    RETURNING id INTO q14_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q14_id, 'İmam Kurum', false, 'red', 0),
    (q14_id, 'Ekrem İmaroğlu', true, 'blue', 1),
    (q14_id, 'Ekrem Veba', false, 'yellow', 2),
    (q14_id, 'Eklem Karabulut', false, 'green', 3);
    
    -- Question 15
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, 'Hangi gezegen, "gaz devi" olarak sınıflandırılmaz?', 20, 1000, 14)
    RETURNING id INTO q15_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q15_id, 'Jüpiter', false, 'red', 0),
    (q15_id, 'Venüs', true, 'blue', 1),
    (q15_id, 'Satürn', false, 'yellow', 2),
    (q15_id, 'Uranüs', false, 'green', 3);
    
    -- Question 16
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, 'Hangi uzay teknolojisi, 2025''te Ay''a insanlı görevleri yeniden başlatmayı hedefliyor?', 20, 1000, 15)
    RETURNING id INTO q16_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q16_id, 'Artemis Programı', true, 'red', 0),
    (q16_id, 'Apollo Programı', false, 'blue', 1),
    (q16_id, 'Starlink Projesi', false, 'yellow', 2),
    (q16_id, 'Voyager', false, 'green', 3);
    
    -- Question 17
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, '"Büyük Kudüs Mitingi" ne zaman düzenlenmiştir?', 20, 1000, 16)
    RETURNING id INTO q17_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q17_id, '1980', true, 'red', 0),
    (q17_id, '1974', false, 'blue', 1),
    (q17_id, '1982', false, 'yellow', 2),
    (q17_id, '1977', false, 'green', 3);
    
    -- Question 18
    INSERT INTO questions (quiz_id, question_text, time_limit, points, order_index)
    VALUES (quiz_id, '1924 Anayasası''nda, Türkiye''nin resmi dini olarak ne belirtilmiştir?', 20, 1000, 17)
    RETURNING id INTO q18_id;
    
    INSERT INTO question_options (question_id, option_text, is_correct, color, order_index) VALUES
    (q18_id, 'İslam', true, 'red', 0),
    (q18_id, 'Belirtilmemiştir', false, 'blue', 1),
    (q18_id, 'Laiklik', false, 'yellow', 2),
    (q18_id, 'Müslümanlık', false, 'green', 3);
    
    RAISE NOTICE 'Quiz "1.gün" created successfully with 18 questions!';
    RAISE NOTICE 'Quiz ID: %', quiz_id;
END $$;