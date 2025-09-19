'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    fetchQuizzes()
  }, [user, router])

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          description,
          created_at,
          questions (count)
        `)
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuizzes(data || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteQuiz = async (quizId: string) => {
    if (!confirm('Bu quiz\'i silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)
        .eq('creator_id', user?.id)

      if (error) throw error
      
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId))
    } catch (error: any) {
      setError(error.message)
    }
  }

  const startGame = async (quizId: string) => {
    try {
      // 6 haneli PIN kodu üret
      const generatePin = () => {
        return Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0')
      }

      const { data, error } = await supabase
        .from('game_sessions')
        .insert([
          {
            quiz_id: quizId,
            host_id: user?.id,
            game_pin: generatePin(),
            status: 'waiting'
          }
        ])
        .select()
        .single()

      if (error) throw error

      console.log('Game session created with PIN:', data.game_pin)
      router.push(`/game/host/${data.id}`)
    } catch (error: any) {
      console.error('Error creating game session:', error)
      setError(error.message)
    }
  }

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
            <button
              onClick={() => router.push('/')}
              className="text-black hover:text-black"
            >
              Ana Sayfa
            </button>
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
              <div key={quiz.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-black mb-2">
                  {quiz.title}
                </h3>
                
                {quiz.description && (
                  <p className="text-black mb-4">
                    {quiz.description}
                  </p>
                )}

                <div className="text-sm text-black mb-4">
                  <div>
                    Soru Sayısı: {quiz.questions?.[0]?.count || 0}
                  </div>
                  <div>
                    Oluşturulma: {new Date(quiz.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => startGame(quiz.id)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    disabled={!quiz.questions?.[0]?.count}
                  >
                    {quiz.questions?.[0]?.count ? 'Oyun Başlat' : 'Soru Yok'}
                  </button>
                  
                  <div className="flex gap-2">
                    <Link
                      href={`/quiz/edit/${quiz.id}`}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded text-center transition-colors"
                    >
                      Düzenle
                    </Link>
                    
                    <button
                      onClick={() => deleteQuiz(quiz.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}