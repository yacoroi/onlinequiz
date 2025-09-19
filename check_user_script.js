const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const userId = 'd61a42b4-66e9-479c-b5b4-6d30d1b65370'

async function checkUser() {
  try {
    console.log('Checking if user exists:', userId)
    
    // Check if user exists in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .single()

    if (userError) {
      console.log('User query error:', userError.message)
      if (userError.code === 'PGRST116') {
        console.log('User does not exist in users table')
      }
    } else {
      console.log('User found:', userData)
    }

    // Also check auth.users table via RPC if we have one
    console.log('\nTrying to check existing quizzes to understand RLS...')
    
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('id, title, creator_id')
      .limit(5)

    if (quizError) {
      console.log('Quiz query error:', quizError.message)
    } else {
      console.log('Sample quizzes:', quizData)
      if (quizData && quizData.length > 0) {
        console.log('RLS allows reading quizzes, issue might be with insert policy')
      }
    }

  } catch (error) {
    console.error('Script error:', error)
  }
}

checkUser()