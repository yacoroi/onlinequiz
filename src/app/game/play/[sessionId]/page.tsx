'use client'

import { useState, useEffect, use } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface GameSession {
  id: string
  quiz_id: string
  game_pin: string
  status: string
  current_question_index: number
  current_question_started_at: string
  quiz: {
    title: string
  }
}

interface Question {
  id: string
  question_text: string
  time_limit: number
  points: number
  question_options: QuestionOption[]
}

interface QuestionOption {
  id: string
  option_text: string
  is_correct: boolean
  color: string
}

interface Participant {
  id: string
  nickname: string
  total_score: number
}

export default function PlayGame({ params }: { params: Promise<{ sessionId: string }> }) {
  const { user } = useAuth()
  const router = useRouter()
  const resolvedParams = use(params)
  const sessionId = resolvedParams.sessionId
  
  const [session, setSession] = useState<GameSession | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [leaderboard, setLeaderboard] = useState<Participant[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(0)
  const [showEarnedPoints, setShowEarnedPoints] = useState(false)

  useEffect(() => {
    fetchGameData()

    // Subscribe to real-time updates
    const sessionSubscription = supabase
      .channel('game-session')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${sessionId}`
      }, (payload) => {
        const newSession = payload.new as GameSession
        setSession(newSession)
        
        if (newSession.status === 'started') {
          // Quiz ID'yi payload'dan alarak direkt kullan
          fetchCurrentQuestionWithQuizId(newSession.current_question_index, newSession.quiz_id, newSession)
          setSelectedAnswer(null)
          setHasAnswered(false)
          setShowLeaderboard(false)
          setEarnedPoints(0)
          setShowEarnedPoints(false)
        } else if (newSession.status === 'finished') {
          fetchLeaderboard()
          setShowLeaderboard(true)
        }
      })
      .subscribe()

    const participantsSubscription = supabase
      .channel('participants')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_participants',
        filter: `session_id=eq.${sessionId}`
      }, () => {
        fetchLeaderboard()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(sessionSubscription)
      supabase.removeChannel(participantsSubscription)
    }
  }, [user, sessionId, router])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (session?.status === 'started' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1 && hasAnswered && earnedPoints > 0) {
            // Süre bitti, kazanılan puanı göster ve participant skorunu güncelle
            setShowEarnedPoints(true)
            setParticipant(prevParticipant => 
              prevParticipant ? { ...prevParticipant, total_score: prevParticipant.total_score + earnedPoints } : null
            )
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timeLeft, session?.status, hasAnswered, earnedPoints])

  const fetchGameData = async () => {
    try {
      // Get session info
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select(`
          *,
          quiz:quizzes (title)
        `)
        .eq('id', sessionId)
        .single()

      if (sessionError) throw sessionError
      setSession(sessionData)

      // Get participant info - for authenticated users by user_id, for anonymous by session storage
      let participantData = null
      let participantError = null

      if (user) {
        // Authenticated user - find by user_id
        const result = await supabase
          .from('game_participants')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .single()
        participantData = result.data
        participantError = result.error
      } else {
        // Anonymous user - check if we have a participant ID in localStorage
        const anonymousParticipantId = localStorage.getItem(`participant_${sessionId}`)
        if (anonymousParticipantId) {
          const result = await supabase
            .from('game_participants')
            .select('*')
            .eq('id', anonymousParticipantId)
            .eq('session_id', sessionId)
            .single()
          participantData = result.data
          participantError = result.error
        }
      }

      if (participantError || !participantData) {
        router.push('/quiz/join')
        return
      }
      
      setParticipant(participantData)

      // If game is started, get current question
      if (sessionData.status === 'started') {
        await fetchCurrentQuestion(sessionData.current_question_index)
      }

      await fetchLeaderboard()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentQuestion = async (questionIndex: number) => {
    try {
      if (!session?.quiz_id) {
        console.error('No session or quiz_id available')
        return
      }

      console.log('Fetching question:', { questionIndex, quiz_id: session.quiz_id })
      
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          question_options (*)
        `)
        .eq('quiz_id', session.quiz_id)
        .eq('order_index', questionIndex)
        .single()

      console.log('Question query result:', { data, error })

      if (error) throw error

      // Sort options by order_index
      data.question_options.sort((a: any, b: any) => a.order_index - b.order_index)
      setCurrentQuestion(data)
      
      // Calculate time left based on server time
      const currentSession = sessionData || session
      if (currentSession?.current_question_started_at) {
        const startTime = new Date(currentSession.current_question_started_at).getTime()
        const currentTime = Date.now()
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000)
        const timeRemaining = Math.max(0, data.time_limit - elapsedSeconds)
        setTimeLeft(timeRemaining)
      } else {
        setTimeLeft(data.time_limit)
      }

      // Check if user already answered this question
      const { data: existingAnswer } = await supabase
        .from('game_answers')
        .select('*')
        .eq('session_id', sessionId)
        .eq('participant_id', participant?.id)
        .eq('question_id', data.id)
        .single()

      if (existingAnswer) {
        setSelectedAnswer(existingAnswer.selected_option_id)
        setHasAnswered(true)
      }
    } catch (error: any) {
      console.error('Error fetching question:', error)
    }
  }

  const fetchCurrentQuestionWithQuizId = async (questionIndex: number, quizId: string, sessionData?: GameSession) => {
    try {
      console.log('Fetching question with quiz ID:', { questionIndex, quizId })
      
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          question_options (*)
        `)
        .eq('quiz_id', quizId)
        .eq('order_index', questionIndex)
        .single()

      console.log('Question query result:', { data, error })

      if (error) throw error

      // Sort options by order_index
      data.question_options.sort((a: any, b: any) => a.order_index - b.order_index)
      setCurrentQuestion(data)
      
      // Calculate time left based on server time
      const currentSession = sessionData || session
      if (currentSession?.current_question_started_at) {
        const startTime = new Date(currentSession.current_question_started_at).getTime()
        const currentTime = Date.now()
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000)
        const timeRemaining = Math.max(0, data.time_limit - elapsedSeconds)
        setTimeLeft(timeRemaining)
      } else {
        setTimeLeft(data.time_limit)
      }

      // Check if user already answered this question
      const { data: existingAnswer } = await supabase
        .from('game_answers')
        .select('*')
        .eq('session_id', sessionId)
        .eq('participant_id', participant?.id)
        .eq('question_id', data.id)
        .single()

      if (existingAnswer) {
        setSelectedAnswer(existingAnswer.selected_option_id)
        setHasAnswered(true)
      } else {
        // Reset answer state for new question
        setSelectedAnswer(null)
        setHasAnswered(false)
        setEarnedPoints(0)
        setShowEarnedPoints(false)
      }
    } catch (error: any) {
      console.error('Error fetching question with quiz ID:', error)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('game_participants')
        .select('*')
        .eq('session_id', sessionId)
        .order('total_score', { ascending: false })
        .limit(10)

      if (error) throw error
      setLeaderboard(data)
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error)
    }
  }

  const submitAnswer = async (optionId: string) => {
    if (hasAnswered || !currentQuestion || !participant) return

    setSelectedAnswer(optionId)
    setHasAnswered(true)

    try {
      const selectedOption = currentQuestion.question_options.find(opt => opt.id === optionId)
      const isCorrect = selectedOption?.is_correct || false

      // Calculate points based on current time left
      let points = 0
      if (isCorrect) {
        const maxPoints = currentQuestion.points
        const minPoints = Math.floor(maxPoints / 2)
        const timeElapsed = currentQuestion.time_limit - timeLeft
        const pointsRange = maxPoints - minPoints
        const pointReductionPerSecond = pointsRange / currentQuestion.time_limit
        const totalPointReduction = timeElapsed * pointReductionPerSecond
        points = Math.max(minPoints, Math.round(maxPoints - totalPointReduction))
      }

      // Save answer with calculated points
      const { error } = await supabase
        .from('game_answers')
        .insert([
          {
            session_id: sessionId,
            participant_id: participant.id,
            question_id: currentQuestion.id,
            selected_option_id: optionId,
            time_taken: (currentQuestion.time_limit - timeLeft) * 1000,
            points_earned: points,
            is_correct: isCorrect
          }
        ])

      if (error) throw error

      // Update participant's total score in database immediately but don't show it to user yet
      const { error: updateError } = await supabase
        .from('game_participants')
        .update({
          total_score: participant.total_score + points
        })
        .eq('id', participant.id)

      if (updateError) throw updateError

      // Store earned points but don't update UI score yet
      setEarnedPoints(points)
    } catch (error: any) {
      setError(error.message)
      setHasAnswered(false)
      setSelectedAnswer(null)
    }
  }


  const getColorClass = (color: string, isSelected = false, isCorrect = false) => {
    let baseClass = ''
    switch (color) {
      case 'red': baseClass = 'bg-red-500 hover:bg-red-600 text-white'; break
      case 'blue': baseClass = 'bg-blue-500 hover:bg-blue-600 text-white'; break
      case 'yellow': baseClass = 'bg-yellow-500 hover:bg-yellow-600 text-white'; break
      case 'green': baseClass = 'bg-green-500 hover:bg-green-600 text-white'; break
      default: baseClass = 'bg-gray-500 hover:bg-gray-600 text-white'
    }

    if (isSelected) {
      baseClass += ' ring-4 ring-white'
    }
    
    if (hasAnswered && isCorrect) {
      baseClass += ' ring-4 ring-yellow-400'
    }

    return baseClass
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Yükleniyor...</div>
      </div>
    )
  }

  if (!session || !participant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Oyun bulunamadı</div>
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold text-white mb-2">{session?.quiz?.title || 'Quiz Yükleniyor...'}</h1>
          <div className="text-lg text-purple-100 mb-2">
            Hoş geldin, <span className="font-bold">{participant?.nickname || 'Oyuncu'}</span>
          </div>
          <div className="text-lg text-purple-100">
            Toplam Puanın: <span className="font-bold">{participant?.total_score || 0}</span>
          </div>
        </div>

        {/* Waiting Room */}
        {session?.status === 'waiting' && (
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-black mb-6">
                Oyun Başlamasını Bekliyoruz...
              </h2>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-black mt-4">
                Host oyunu başlatacak
              </p>
            </div>
          </div>
        )}

        {/* Active Question */}
        {session?.status === 'started' && currentQuestion && !showLeaderboard && (
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div className="text-lg font-medium text-black">
                  Soru {(session?.current_question_index || 0) + 1}
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {timeLeft}s
                </div>
              </div>

              <h2 className="text-xl font-bold text-black mb-8">
                {currentQuestion.question_text}
              </h2>

              {hasAnswered ? (
                <div className="text-center py-8">
                  {timeLeft > 0 ? (
                    <>
                      <div className="text-2xl font-bold text-green-600 mb-4">
                        Cevabın Alındı! ✓
                      </div>
                      <div className="text-black">
                        Süre bitmesini bekliyoruz...
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-blue-600 mb-4">
                        Süre Bitti!
                      </div>
                      {currentQuestion.question_options.find(opt => opt.id === selectedAnswer)?.is_correct ? (
                        <div className="text-xl text-green-600 font-bold">
                          Doğru Cevap! 🎉
                        </div>
                      ) : (
                        <div className="text-xl text-red-600 font-bold">
                          Yanlış Cevap 😔
                        </div>
                      )}
                      {showEarnedPoints && earnedPoints > 0 && (
                        <div className="text-2xl font-bold text-yellow-600 mt-4">
                          +{earnedPoints} puan kazandın!
                        </div>
                      )}
                      <div className="text-black mt-2">
                        Sonraki soruyu bekliyoruz...
                      </div>
                    </>
                  )}
                </div>
              ) : timeLeft <= 0 ? (
                <div className="text-center py-8">
                  <div className="text-2xl font-bold text-red-600 mb-4">
                    Süre Bitti!
                  </div>
                  <div className="text-black">
                    Cevap veremdin...
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {currentQuestion.question_options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => submitAnswer(option.id)}
                      disabled={timeLeft <= 0}
                      className={`p-6 rounded-lg font-bold text-lg transition-all ${getColorClass(
                        option.color,
                        selectedAnswer === option.id,
                        option.is_correct
                      )} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {option.option_text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Game Finished - Leaderboard */}
        {(session?.status === 'finished' || showLeaderboard) && (
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-black mb-8">
                🏆 Oyun Bitti!
              </h2>

              <div className="space-y-4">
                {leaderboard.map((p, index) => (
                  <div
                    key={p.id}
                    className={`flex justify-between items-center p-4 rounded-lg ${
                      p.id === participant?.id ? 'bg-blue-100 border-2 border-blue-400' :
                      index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' :
                      index === 1 ? 'bg-gray-100' :
                      index === 2 ? 'bg-orange-100' :
                      'bg-gray-50'
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
                      <div className="font-medium text-black">
                        {p.nickname}
                        {p.id === participant?.id && ' (Sen)'}
                      </div>
                    </div>
                    <div className="font-bold text-lg text-black">
                      {p.total_score} puan
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <button
                  onClick={() => router.push('/')}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Ana Sayfa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}