const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Simulate authenticated user (we'll need to sign in first)
async function authenticateUser() {
  // For this script, we'll create a temporary user or use existing auth
  // You might need to provide your actual login credentials
  const email = 'test@example.com' // Replace with your actual email
  const password = 'password123' // Replace with your actual password
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) {
    console.error('Authentication error:', error.message)
    console.log('Please update the email/password in the script or use service role key')
    return false
  }
  
  console.log('Authenticated successfully')
  return true
}

const userId = 'd61a42b4-66e9-479c-b5b4-6d30d1b65370'
const quizData = {
  title: '1.gün',
  description: '',
  questions: [
    {
      question_text: 'Hangi Güney Amerika ülkesinde, gökkuşağı renklerinde akan bir nehir bulunur?',
      time_limit: 20,
      points: 1000,
      options: [
        { text: 'Kolombiya', is_correct: true, color: 'red' },
        { text: 'Arjantin', is_correct: false, color: 'blue' },
        { text: 'Brezilya', is_correct: false, color: 'yellow' },
        { text: 'Venezuela', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: "Nil Nehri'nin yazın çok, kışın az akmasının sebebi nedir?",
      time_limit: 20,
      points: 1000,
      options: [
        { text: 'Dağlardaki karın yazın erimesi', is_correct: false, color: 'red' },
        { text: 'Rüzgarların yazın çok esmesi', is_correct: false, color: 'blue' },
        { text: 'Yaz aylarında Tropikal yağmurların sık yağması', is_correct: true, color: 'yellow' },
        { text: 'Kışın çok bulutlu hava olması', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: 'Aşağıdaki birleşik sözcüklerden hangisinde yazım yanlışı yapılmıştır?',
      time_limit: 20,
      points: 1000,
      options: [
        { text: 'Partiler arası işbirliği', is_correct: true, color: 'red' },
        { text: 'Akşamüstü kahvesi', is_correct: false, color: 'blue' },
        { text: 'Haldun Pekdemir', is_correct: false, color: 'yellow' },
        { text: 'Güler yüzlü amca', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: 'Hangi Asya ülkesinde, kedilere adanmış bir ada olan "Tashirojima" bulunur?',
      time_limit: 20,
      points: 1000,
      options: [
        { text: 'Japonya', is_correct: true, color: 'red' },
        { text: 'Çin', is_correct: false, color: 'blue' },
        { text: 'Tayland', is_correct: false, color: 'yellow' },
        { text: 'Güney Kore', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: "Milli Görüş'ün ilk siyasi partisi olan Milli Nizam Partisi hangi yıl kuruldu?",
      time_limit: 20,
      points: 1000,
      options: [
        { text: '1972', is_correct: false, color: 'red' },
        { text: '1970', is_correct: true, color: 'blue' },
        { text: '1978', is_correct: false, color: 'yellow' },
        { text: '1969', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: 'Hangi ülkede, dünyanın en uzun süre görev yapan kadın başbakanı (17 yıl) görev yapmıştır?',
      time_limit: 20,
      points: 1000,
      options: [
        { text: 'Almanya', is_correct: true, color: 'red' },
        { text: 'Yeni Zelanda', is_correct: false, color: 'blue' },
        { text: 'Norveç', is_correct: false, color: 'yellow' },
        { text: 'İzlanda', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: 'Hangi hayvan, kendi kuyruğunu yiyerek hayatta kalabilir ve yeniden büyütebilir?',
      time_limit: 20,
      points: 1000,
      options: [
        { text: 'Bukalemun', is_correct: false, color: 'red' },
        { text: 'Semender', is_correct: true, color: 'blue' },
        { text: 'Yılan', is_correct: false, color: 'yellow' },
        { text: 'Kertenkele', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: "TÜİK verilerine göre Türkiye'deki erkeklerde evlenme yaş ortalaması kaçtır?",
      time_limit: 20,
      points: 1000,
      options: [
        { text: '25', is_correct: false, color: 'red' },
        { text: '26,4', is_correct: false, color: 'blue' },
        { text: '28,3', is_correct: true, color: 'yellow' },
        { text: '25,8', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: 'Refah partisi, hangi yıl Anayasa Mahkemesi tarafından kapatıldı?',
      time_limit: 20,
      points: 1000,
      options: [
        { text: '1999', is_correct: false, color: 'red' },
        { text: '1998', is_correct: true, color: 'blue' },
        { text: '2001', is_correct: false, color: 'yellow' },
        { text: '1997', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: 'Hangi ünlü yazar, kahve bağımlılığı yüzünden günde 50 fincan kahve içerdiği söylenir?',
      time_limit: 20,
      points: 1000,
      options: [
        { text: 'Charles Dickens', is_correct: false, color: 'red' },
        { text: 'Mark Twain', is_correct: false, color: 'blue' },
        { text: 'Honoré de Balzac', is_correct: true, color: 'yellow' },
        { text: 'Ernest Hemingway', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: 'Hangi Türk siyasi figür, 1990\'larda "Yeşil sermaye" kavramıyla ilişkilendirilmiştir?',
      time_limit: 20,
      points: 1000,
      options: [
        { text: 'Alparslan Türkeş', is_correct: false, color: 'red' },
        { text: 'Necmettin Erbakan', is_correct: true, color: 'blue' },
        { text: 'Tansu Çiller', is_correct: false, color: 'yellow' },
        { text: 'Mesut Yılmaz', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: "Aşağıdakilerden hangisi Kemal Kılıçdaroğlu'nun özür dilediği konulardan bir tanesidir?",
      time_limit: 20,
      points: 1000,
      options: [
        { text: 'Yürüyen merdivene ters binmesi', is_correct: false, color: 'red' },
        { text: 'Seccadeye basması', is_correct: true, color: 'blue' },
        { text: '2023 Cb Seçimini kaybetmesi', is_correct: false, color: 'yellow' },
        { text: 'Kurultay mağlubiyeti', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: 'Hangi ülkede, trafik ışıklarında kırmızı yerine kalp şekli kullanılır?',
      time_limit: 20,
      points: 1000,
      options: [
        { text: 'Japonya', is_correct: false, color: 'red' },
        { text: 'Güney Kore', is_correct: false, color: 'blue' },
        { text: 'Tayvan', is_correct: true, color: 'yellow' },
        { text: 'Tayland', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: 'Yapılan bir sokak röportajında, Ekrem İmamoğlu yerine hangi ifade kullanılmamıştır?',
      time_limit: 20,
      points: 1000,
      options: [
        { text: 'İmam Kurum', is_correct: false, color: 'red' },
        { text: 'Ekrem İmaroğlu', is_correct: true, color: 'blue' },
        { text: 'Ekrem Veba', is_correct: false, color: 'yellow' },
        { text: 'Eklem Karabulut', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: 'Hangi gezegen, "gaz devi" olarak sınıflandırılmaz?',
      time_limit: 20,
      points: 1000,
      options: [
        { text: 'Jüpiter', is_correct: false, color: 'red' },
        { text: 'Venüs', is_correct: true, color: 'blue' },
        { text: 'Satürn', is_correct: false, color: 'yellow' },
        { text: 'Uranüs', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: "Hangi uzay teknolojisi, 2025'te Ay'a insanlı görevleri yeniden başlatmayı hedefliyor?",
      time_limit: 20,
      points: 1000,
      options: [
        { text: 'Artemis Programı', is_correct: true, color: 'red' },
        { text: 'Apollo Programı', is_correct: false, color: 'blue' },
        { text: 'Starlink Projesi', is_correct: false, color: 'yellow' },
        { text: 'Voyager', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: '"Büyük Kudüs Mitingi" ne zaman düzenlenmiştir?',
      time_limit: 20,
      points: 1000,
      options: [
        { text: '1980', is_correct: true, color: 'red' },
        { text: '1974', is_correct: false, color: 'blue' },
        { text: '1982', is_correct: false, color: 'yellow' },
        { text: '1977', is_correct: false, color: 'green' }
      ]
    },
    {
      question_text: "1924 Anayasası'nda, Türkiye'nin resmi dini olarak ne belirtilmiştir?",
      time_limit: 20,
      points: 1000,
      options: [
        { text: 'İslam', is_correct: true, color: 'red' },
        { text: 'Belirtilmemiştir', is_correct: false, color: 'blue' },
        { text: 'Laiklik', is_correct: false, color: 'yellow' },
        { text: 'Müslümanlık', is_correct: false, color: 'green' }
      ]
    }
  ]
}

async function createQuiz() {
  try {
    // First authenticate
    const authenticated = await authenticateUser()
    if (!authenticated) {
      console.error('Failed to authenticate. Quiz creation cancelled.')
      return
    }
    
    console.log('Creating quiz:', quizData.title)
    
    // Create quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert([
        {
          title: quizData.title,
          description: quizData.description,
          creator_id: userId,
        }
      ])
      .select()
      .single()

    if (quizError) {
      console.error('Quiz creation error:', quizError)
      return
    }

    console.log('Quiz created successfully:', quiz.id)

    // Add questions
    for (let i = 0; i < quizData.questions.length; i++) {
      const questionData = quizData.questions[i]
      console.log(`Adding question ${i + 1}: ${questionData.question_text}`)
      
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert([
          {
            quiz_id: quiz.id,
            question_text: questionData.question_text,
            time_limit: questionData.time_limit,
            points: questionData.points,
            order_index: i,
          }
        ])
        .select()
        .single()

      if (questionError) {
        console.error(`Question ${i + 1} creation error:`, questionError)
        continue
      }

      // Add options
      for (let j = 0; j < questionData.options.length; j++) {
        const option = questionData.options[j]
        
        const { error: optionError } = await supabase
          .from('question_options')
          .insert([
            {
              question_id: question.id,
              option_text: option.text,
              is_correct: option.is_correct,
              color: option.color,
              order_index: j,
            }
          ])

        if (optionError) {
          console.error(`Option ${j + 1} for question ${i + 1} error:`, optionError)
        }
      }
      
      console.log(`Question ${i + 1} completed with ${questionData.options.length} options`)
    }

    console.log('🎉 Quiz creation completed successfully!')
    console.log(`Quiz ID: ${quiz.id}`)
    console.log(`Total questions: ${quizData.questions.length}`)
    
  } catch (error) {
    console.error('Script error:', error)
  }
}

createQuiz()