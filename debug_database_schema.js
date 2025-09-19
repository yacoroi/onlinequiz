const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDatabase() {
  try {
    console.log('=== DATABASE SCHEMA DEBUG ===\n')
    
    // 1. Check quizzes table structure
    console.log('1. Testing quizzes table...')
    const { data: quizTest, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .limit(1)
    
    if (quizError) {
      console.error('❌ Quizzes table error:', quizError)
    } else {
      console.log('✅ Quizzes table accessible')
      if (quizTest && quizTest.length > 0) {
        console.log('Sample quiz structure:', Object.keys(quizTest[0]))
      }
    }
    
    // 2. Check questions table structure
    console.log('\n2. Testing questions table...')
    const { data: questionTest, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .limit(1)
    
    if (questionError) {
      console.error('❌ Questions table error:', questionError)
    } else {
      console.log('✅ Questions table accessible')
      if (questionTest && questionTest.length > 0) {
        console.log('Sample question structure:', Object.keys(questionTest[0]))
      }
    }
    
    // 3. Test the exact query from my-quizzes page
    console.log('\n3. Testing my-quizzes page query...')
    
    // Get a real user ID first
    const { data: sampleQuiz } = await supabase
      .from('quizzes')
      .select('creator_id')
      .limit(1)
    
    if (sampleQuiz && sampleQuiz.length > 0) {
      const testUserId = sampleQuiz[0].creator_id
      console.log('Using test user ID:', testUserId)
      
      // Test the main query
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('id, title, description, created_at')
        .eq('creator_id', testUserId)
        .order('created_at', { ascending: false })

      if (quizzesError) {
        console.error('❌ Main quizzes query error:', quizzesError)
      } else {
        console.log('✅ Main quizzes query works')
        console.log(`Found ${quizzesData.length} quizzes for user`)
        
        if (quizzesData.length > 0) {
          // Test question count query
          console.log('\n4. Testing question count query...')
          
          const testQuizId = quizzesData[0].id
          const { count, error: countError } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', testQuizId)
          
          if (countError) {
            console.error('❌ Question count query error:', countError)
          } else {
            console.log('✅ Question count query works')
            console.log(`Quiz ${testQuizId} has ${count} questions`)
          }
        }
      }
    }
    
    // 4. Test auth context
    console.log('\n5. Testing auth...')
    const { data: authData, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('❌ No authenticated user (expected for script)')
    } else {
      console.log('✅ Auth user found:', authData.user?.id)
    }
    
    // 5. Check RLS policies
    console.log('\n6. Testing RLS permissions...')
    
    // Try to read all quizzes without user filter
    const { data: allQuizzes, error: allQuizzesError } = await supabase
      .from('quizzes')
      .select('id, title, creator_id')
      .limit(5)
    
    if (allQuizzesError) {
      console.error('❌ RLS blocking all reads:', allQuizzesError)
    } else {
      console.log('✅ Can read quizzes without auth (RLS allows public read)')
      console.log(`Sample creators: ${allQuizzes.map(q => q.creator_id.substring(0, 8)).join(', ')}`)
    }

  } catch (error) {
    console.error('Script error:', error)
  }
}

debugDatabase()