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
  const { user } = useAuth()
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null)
  const [startingQuizId, setStartingQuizId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    fetchQuizzes()
  }, [user, router])

  const fetchQuizzes = async () => {
    if (!user?.id) return
    
    try {
      // Optimize with aggregated count query
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          description,
          created_at,
          questions!inner (
            id
          )
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform data to include question count
      const quizzesWithCount = (data || []).map(quiz => ({
        ...quiz,
        questions: [{ count: quiz.questions?.length || 0 }]
      }))
      
      setQuizzes(quizzesWithCount)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Yükleniyor...</div>
      </div>
    )
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
            {error}
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