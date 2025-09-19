const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkExistingQuiz() {
  try {
    console.log('Checking existing "1.gün" quiz...')
    
    // Get the existing quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('title', '1.gün')
      .eq('creator_id', 'd61a42b4-66e9-479c-b5b4-6d30d1b65370')
      .single()

    if (quizError) {
      console.log('Quiz not found or error:', quizError.message)
      return
    }

    console.log('Existing quiz found:', quiz)
    
    // Get questions for this quiz
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        question_text,
        time_limit,
        points,
        order_index,
        question_options(
          id,
          option_text,
          is_correct,
          color,
          order_index
        )
      `)
      .eq('quiz_id', quiz.id)
      .order('order_index')

    if (questionsError) {
      console.log('Questions error:', questionsError.message)
      return
    }

    console.log(`\nQuiz has ${questions.length} questions:`)
    questions.forEach((q, index) => {
      console.log(`\n${index + 1}. ${q.question_text}`)
      console.log(`   Time: ${q.time_limit}s, Points: ${q.points}`)
      if (q.question_options) {
        q.question_options.forEach((option, optIndex) => {
          const correct = option.is_correct ? ' ✓' : ''
          console.log(`   ${String.fromCharCode(65 + optIndex)}. ${option.option_text}${correct}`)
        })
      }
    })

    if (questions.length === 18) {
      console.log('\n✅ The quiz already exists with all 18 questions!')
      console.log(`Quiz ID: ${quiz.id}`)
    } else {
      console.log(`\n⚠️  Quiz exists but has ${questions.length} questions instead of 18`)
    }

  } catch (error) {
    console.error('Script error:', error)
  }
}

checkExistingQuiz()