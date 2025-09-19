'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getStaticColorClass, generateGamePin } from '@/lib/utils'

interface GameSession {
  id: string
  quiz_id: string
  game_pin: string
  status: string
  current_question_index: number
  current_question_started_at: string
  quiz: {
    title: string
    questions: Question[]
  }
}

interface Question {
  id: string
  question_text: string
  time_limit: number
  points: number
  order_index: number
  question_options: QuestionOption[]
}

interface QuestionOption {
  id: string
  option_text: string
  is_correct: boolean
  color: string
  order_index: number
}

interface Participant {
  id: string
  nickname: string
  total_score: number
  is_active: boolean
}

export default function HostGame({ params }: { params: Promise<{ sessionId: string }> }) {
  const { user } = useAuth()
  const router = useRouter()
  const resolvedParams = use(params)
  const sessionId = resolvedParams.sessionId
  
  const [session, setSession] = useState<GameSession | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [questionResults, setQuestionResults] = useState<any[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    let mounted = true
    fetchSessionData()
    
    // Subscribe to real-time updates with better channel management
    const participantsChannel = supabase
      .channel(`participants-${sessionId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'game_participants',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        if (!mounted) return
        console.log('Participant change detected:', payload)
        // Kısa bir delay ekleyerek database'in güncellendiğinden emin olalım
        setTimeout(() => {
          if (mounted) {
            fetchParticipants()
          }
        }, 100)
      })
      .subscribe((status) => {
        if (!mounted) return
        console.log('Participants subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to participant changes')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to participant changes')
        }
      })

    return () => {
      mounted = false
      participantsChannel.unsubscribe()
      supabase.removeChannel(participantsChannel)
    }
  }, [user, sessionId, router])

  useEffect(() => {
    let interval: NodeJS.Timeout
    let mounted = true
    
    if (session?.status === 'started' && timeLeft > 0) {
      interval = setInterval(async () => {
        // Check if all active participants have answered
        const allAnswered = await checkAllPlayersAnswered()
        
        setTimeLeft(prev => {
          if (!mounted) return prev
          if (prev <= 1 || allAnswered) {
            showQuestionResults()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      mounted = false
      if (interval) clearInterval(interval)
    }
  }, [timeLeft, session?.status])

  const fetchSessionData = async () => {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select(`
          *,
          quiz:quizzes (
            title,
            questions (
              id,
              question_text,
              time_limit,
              points,
              order_index,
              question_options (
                id,
                option_text,
                is_correct,
                color,
                order_index
              )
            )
          )
        `)
        .eq('id', sessionId)
        .eq('host_id', user?.id)
        .single()

      if (error) throw error

      // Sort questions and options
      data.quiz.questions.sort((a: Question, b: Question) => a.order_index - b.order_index)
      data.quiz.questions.forEach((q: Question) => {
        q.question_options.sort((a: QuestionOption, b: QuestionOption) => a.order_index - b.order_index)
      })

      setSession(data)
      await fetchParticipants()
    } catch (error: any) {
      setError(error.message)
      router.push('/quiz/my-quizzes')
    } finally {
      setLoading(false)
    }
  }

  const fetchParticipants = async () => {
    try {
      console.log('Fetching participants for session:', sessionId)
      const { data, error } = await supabase
        .from('game_participants')
        .select('*')
        .eq('session_id', sessionId)
        .order('total_score', { ascending: false })

      console.log('Participants query result:', { data, error })

      if (error) throw error
      
      setParticipants(data || [])
      console.log('Updated participants state:', data?.length || 0, 'participants')
    } catch (error: any) {
      console.error('Error fetching participants:', error)
    }
  }

  const checkAllPlayersAnswered = async () => {
    if (!session || session.status !== 'started') return false
    
    try {
      // Get active participants count
      const activeParticipants = participants.filter(p => p.is_active)
      if (activeParticipants.length === 0) return false
      
      // Get current question
      const currentQuestion = session.quiz.questions[session.current_question_index]
      if (!currentQuestion) return false
      
      // Count answers for current question
      const { count, error } = await supabase
        .from('game_answers')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('question_id', currentQuestion.id)
      
      if (error) {
        console.error('Error checking answers:', error)
        return false
      }
      
      const allAnswered = count >= activeParticipants.length
      if (allAnswered) {
        console.log(`All ${activeParticipants.length} players have answered! Auto-advancing...`)
      }
      
      return allAnswered
    } catch (error) {
      console.error('Error in checkAllPlayersAnswered:', error)
      return false
    }
  }

  const startGame = async () => {
    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({ 
          status: 'started',
          started_at: new Date().toISOString(),
          current_question_index: 0,
          current_question_started_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) throw error

      const firstQuestion = session?.quiz.questions[0]
      if (!firstQuestion) {
        endGame()
        return
      }

      setSession(prev => prev ? { 
        ...prev, 
        status: 'started',
        current_question_index: 0,
        current_question_started_at: new Date().toISOString()
      } : null)
      
      setTimeLeft(firstQuestion.time_limit)
      setShowResults(false)
      setQuestionResults([])
    } catch (error: any) {
      setError(error.message)
    }
  }

  const showNextQuestion = async () => {
    if (!session) return

    const nextIndex = session.current_question_index + 1
    const nextQuestion = session.quiz.questions[nextIndex]
    
    if (!nextQuestion) {
      endGame()
      return
    }

    try {
      const startTime = new Date().toISOString()
      
      // Update database first
      const { error } = await supabase
        .from('game_sessions')
        .update({
          current_question_index: nextIndex,
          current_question_started_at: startTime
        })
        .eq('id', sessionId)

      if (error) throw error

      // Then update local state with same timestamp
      setSession(prev => prev ? {
        ...prev,
        current_question_index: nextIndex,
        current_question_started_at: startTime
      } : null)
      
      setTimeLeft(nextQuestion.time_limit)
      setShowResults(false)
      setQuestionResults([])
      
      console.log(`Started question ${nextIndex + 1} at ${startTime}`)
    } catch (error: any) {
      console.error('Error showing next question:', error)
      setError(error.message)
    }
  }

  const showQuestionResults = async () => {
    if (!session) return

    try {
      const { data, error } = await supabase
        .from('game_answers')
        .select(`
          *,
          participant:game_participants (
            nickname,
            total_score
          ),
          question_option:question_options (
            option_text,
            is_correct,
            color
          )
        `)
        .eq('session_id', sessionId)
        .eq('question_id', session.quiz.questions[session.current_question_index].id)

      if (error) throw error

      setQuestionResults(data)
      setShowResults(true)

      // Update participant scores
      await fetchParticipants()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const endGame = async () => {
    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({
          status: 'finished',
          finished_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) throw error

      setSession(prev => prev ? { ...prev, status: 'finished' } : null)
    } catch (error: any) {
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

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Oyun bulunamadı</div>
      </div>
    )
  }

  const currentQuestion = session.quiz.questions[session.current_question_index]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3">
          {error}
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{session.quiz.title}</h1>
          <div className="text-2xl text-purple-100 mb-4">
            PIN: <span className="font-mono bg-white/20 px-4 py-2 rounded">{session.game_pin}</span>
          </div>
          <div className="flex items-center gap-4 text-lg text-purple-100">
            <span>Katılımcı Sayısı: {participants.filter(p => p.is_active).length}</span>
            <button
              onClick={fetchParticipants}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
              title="Katılımcıları Yenile"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Waiting Room */}
        {session.status === 'waiting' && (
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto mb-8">
              <h2 className="text-2xl font-bold text-black mb-6">
                Oyuncular Katılıyor...
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {participants.length === 0 ? (
                  <div className="col-span-full text-center text-gray-500 py-8">
                    Henüz katılan oyuncu yok...
                  </div>
                ) : (
                  participants.map((participant) => (
                    <div
                      key={participant.id}
                      className={`rounded-lg p-4 text-center ${
                        participant.is_active 
                          ? 'bg-blue-100 border-2 border-blue-300' 
                          : 'bg-gray-100 border-2 border-gray-300'
                      }`}
                    >
                      <div className={`font-medium ${
                        participant.is_active ? 'text-blue-800' : 'text-black'
                      }`}>
                        {participant.nickname}
                      </div>
                      <div className="text-xs mt-1 text-gray-500">
                        {participant.is_active ? 'Aktif' : 'Pasif'}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={startGame}
                disabled={participants.length === 0}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
              >
                Oyunu Başlat ({session.quiz.questions.length} Soru)
              </button>
            </div>
          </div>
        )}

        {/* Active Question */}
        {session.status === 'started' && currentQuestion && !showResults && (
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div className="text-lg font-medium text-black">
                  Soru {session.current_question_index + 1} / {session.quiz.questions.length}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {participants.filter(p => p.is_active).length} aktif oyuncu
                  </div>
                  <div className="text-3xl font-bold text-red-600">
                    {timeLeft}s
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-black mb-8">
                {currentQuestion.question_text}
              </h2>

              <div className="grid grid-cols-2 gap-6">
                {currentQuestion.question_options.map((option, index) => (
                  <div
                    key={option.id}
                    className={`${getStaticColorClass(option.color)} p-6 rounded-lg`}
                  >
                    <div className="text-xl font-bold">
                      {option.option_text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Question Results */}
        {showResults && currentQuestion && (
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto mb-8">
              <h2 className="text-2xl font-bold text-black mb-6">Sonuçlar</h2>

              <div className="grid grid-cols-2 gap-6 mb-8">
                {currentQuestion.question_options.map((option) => {
                  const answerCount = questionResults.filter(r => r.selected_option_id === option.id).length
                  const isCorrect = option.is_correct
                  
                  return (
                    <div
                      key={option.id}
                      className={`${getStaticColorClass(option.color)} p-6 rounded-lg relative ${
                        isCorrect ? 'ring-4 ring-yellow-400' : ''
                      }`}
                    >
                      <div className="text-xl font-bold mb-2">
                        {option.option_text}
                        {isCorrect && ' ✓'}
                      </div>
                      <div className="text-lg">
                        {answerCount} cevap
                      </div>
                      {isCorrect && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center">
                          ✓
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-4 justify-center">
                {session.current_question_index < session.quiz.questions.length - 1 ? (
                  <button
                    onClick={showNextQuestion}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Sonraki Soru
                  </button>
                ) : (
                  <button
                    onClick={endGame}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Oyunu Bitir
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Game Finished */}
        {session.status === 'finished' && (
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-black mb-8">
                🏆 Oyun Bitti!
              </h2>

              <div className="space-y-4">
                {participants.slice(0, 10).map((participant, index) => (
                  <div
                    key={participant.id}
                    className={`flex justify-between items-center p-4 rounded-lg ${
                      index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' :
                      index === 1 ? 'bg-gray-100' :
                      index === 2 ? 'bg-orange-100' :
                      'bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-400 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-400 text-white' :
                        'bg-blue-400 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="font-medium text-black">{participant.nickname}</div>
                    </div>
                    <div className="font-bold text-lg">
                      {participant.total_score} puan
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <button
                  onClick={() => router.push('/quiz/my-quizzes')}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Quiz'lerime Dön
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}