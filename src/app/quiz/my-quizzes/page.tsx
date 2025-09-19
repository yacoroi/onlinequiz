'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { generateGamePin } from '@/lib/utils'
import QuizCard from '@/components/QuizCard'

interface Quiz {
  id: string
  title: string
  description: string
  created_at: string
  questions: { count: number }[]
}

export default function MyQuizzes() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null)
  const [startingQuizId, setStartingQuizId] = useState<string | null>(null)

  useEffect(() => {
    console.log('MyQuizzes useEffect:', { authLoading, user: !!user })
    
    // Add timeout for auth loading
    const authTimeout = setTimeout(() => {
      if (authLoading) {
        console.log('Auth loading timeout - proceeding anyway')
        setLoading(true)
        fetchQuizzes()
      }
    }, 2000)
    
    if (authLoading) {
      console.log('Still loading auth, waiting...')
      return () => clearTimeout(authTimeout)
    }
    
    clearTimeout(authTimeout)
    
    if (!user) {
      console.log('No user, redirecting to home')
      router.push('/')
      return
    }

    console.log('Starting to fetch quizzes')
    setLoading(true)
    fetchQuizzes()
    
    return () => clearTimeout(authTimeout)
  }, [user, authLoading, router])

  const fetchQuizzes = async () => {
    console.log('fetchQuizzes called with user:', user?.id)
    
    // Get current session instead of relying on user state
    const { data: { session } } = await supabase.auth.getSession()
    const currentUserId = session?.user?.id || user?.id
    
    if (!currentUserId) {
      console.log('No user ID available, stopping fetch')
      setLoading(false)
      setError('Kullanıcı girişi gerekli')
      return
    }
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Fetch quizzes timeout')
      setLoading(false)
      setError('Yükleme zaman aşımına uğradı - Lütfen sayfayı yenileyin')
    }, 10000)
    
    try {
      setError('') // Clear previous errors
      console.log('Making Supabase query...')
      
      // First get quizzes only
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('id, title, description, created_at')
        .eq('creator_id', currentUserId)
        .order('created_at', { ascending: false })

      if (quizzesError) throw quizzesError

      // Then get question counts in parallel if we have quizzes
      let quizzesWithCount: Quiz[] = []
      if (quizzesData && quizzesData.length > 0) {
        const questionCountPromises = quizzesData.map(async (quiz) => {
          const { count } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', quiz.id)
          
          return {
            ...quiz,
            questions: [{ count: count || 0 }]
          }
        })
        
        quizzesWithCount = await Promise.all(questionCountPromises)
      }

      clearTimeout(timeoutId)
      console.log('Supabase query result:', { data: quizzesWithCount })
      
      setQuizzes(quizzesWithCount)
    } catch (error: any) {
      clearTimeout(timeoutId)
      console.error('Fetch quizzes error:', error)
      setError('Quiz\'ler yüklenirken bir hata oluştu: ' + error.message)
    } finally {
      setLoading(false)
      console.log('fetchQuizzes completed')
    }
  }

  const deleteQuiz = useCallback(async (quizId: string) => {
    if (!confirm('Bu quiz\'i silmek istediğinizden emin misiniz?')) return

    setDeletingQuizId(quizId)
    
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)
        .eq('creator_id', user?.id)

      if (error) throw error
      
      setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId))
      setError('') // Clear any previous errors
    } catch (error: any) {
      console.error('Delete quiz error:', error)
      setError('Quiz silinirken bir hata oluştu: ' + error.message)
    } finally {
      setDeletingQuizId(null)
    }
  }, [user?.id])

  const startGame = useCallback(async (quizId: string) => {
    setStartingQuizId(quizId)
    setError('') // Clear any previous errors
    
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .insert([
          {
            quiz_id: quizId,
            host_id: user?.id,
            game_pin: generateGamePin(),
            status: 'waiting'
          }
        ])
        .select()
        .single()

      if (error) throw error

      console.log('Game session created with PIN:', data.game_pin)
      
      // Use router for better state management
      router.push(`/game/host/${data.id}`)
    } catch (error: any) {
      console.error('Error creating game session:', error)
      setError('Oyun başlatılırken bir hata oluştu: ' + error.message)
    } finally {
      setStartingQuizId(null)
    }
  }, [user?.id, router])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Yükleniyor...</div>
      </div>
    )
  }

  if (!user) {
    return null // This will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">Quizlerim</h1>
          <div className="flex gap-4">
            <Link
              href="/quiz/create"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
            >
              Yeni Quiz
            </Link>
            <Link
              href="/"
              className="text-black hover:text-black px-4 py-2 rounded transition-colors"
            >
              Ana Sayfa
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={() => {
                  setError('')
                  setLoading(true)
                  fetchQuizzes()
                }}
                className="ml-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        )}

        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-black text-xl mb-4">
              Henüz hiç quiz oluşturmadınız
            </div>
            <Link
              href="/quiz/create"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg inline-block transition-colors"
            >
              İlk Quiz'inizi Oluşturun
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onStartGame={startGame}
                onDeleteQuiz={deleteQuiz}
                isStarting={startingQuizId === quiz.id}
                isDeleting={deletingQuizId === quiz.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}