'use client'

import { useState, useEffect, use } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getQuizEditColorClass } from '@/lib/utils'

interface Question {
  id: string
  question_text: string
  time_limit: number
  points: number
  order_index: number
  options: Option[]
}

interface Option {
  id: string
  option_text: string
  is_correct: boolean
  color: 'red' | 'blue' | 'yellow' | 'green'
  order_index: number
}

interface Quiz {
  id: string
  title: string
  description: string
  creator_id: string
}

const COLORS = ['red', 'blue', 'yellow', 'green'] as const

export default function EditQuiz({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const router = useRouter()
  const resolvedParams = use(params)
  const quizId = resolvedParams.id
  
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    question_text: '',
    time_limit: 30,
    points: 1000,
    order_index: 0,
    options: [
      { id: '1', option_text: '', is_correct: false, color: 'red', order_index: 0 },
      { id: '2', option_text: '', is_correct: false, color: 'blue', order_index: 1 },
      { id: '3', option_text: '', is_correct: false, color: 'yellow', order_index: 2 },
      { id: '4', option_text: '', is_correct: false, color: 'green', order_index: 3 },
    ]
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    fetchQuizData()
  }, [user, quizId, router])

  const fetchQuizData = async () => {
    try {
      // Get quiz info
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .eq('creator_id', user?.id)
        .single()

      if (quizError) throw quizError
      
      setQuiz(quizData)
      setTitle(quizData.title)
      setDescription(quizData.description || '')

      // Get questions with options
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select(`
          *,
          question_options (*)
        `)
        .eq('quiz_id', quizId)
        .order('order_index')

      if (questionsError) throw questionsError

      const formattedQuestions = questionsData.map(q => ({
        ...q,
        options: q.question_options
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((opt: any) => ({
            id: opt.id,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            color: opt.color,
            order_index: opt.order_index
          }))
      }))

      setQuestions(formattedQuestions)
    } catch (error: any) {
      setError(error.message)
      router.push('/quiz/my-quizzes')
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = () => {
    if (!currentQuestion.question_text.trim()) {
      setError('Soru metni gereklidir')
      return
    }

    const hasCorrectAnswer = currentQuestion.options.some(opt => opt.is_correct && opt.option_text.trim())
    if (!hasCorrectAnswer) {
      setError('En az bir doğru cevap seçmelisiniz')
      return
    }

    const filledOptions = currentQuestion.options.filter(opt => opt.option_text.trim())
    if (filledOptions.length < 2) {
      setError('En az 2 seçenek gereklidir')
      return
    }

    const newQuestion = {
      ...currentQuestion,
      id: Date.now().toString(),
      order_index: questions.length,
      options: currentQuestion.options.map((opt, index) => ({
        ...opt,
        id: Date.now().toString() + index,
        order_index: index
      }))
    }

    setQuestions([...questions, newQuestion])
    setCurrentQuestion({
      id: '',
      question_text: '',
      time_limit: 30,
      points: 1000,
      order_index: 0,
      options: [
        { id: '1', option_text: '', is_correct: false, color: 'red', order_index: 0 },
        { id: '2', option_text: '', is_correct: false, color: 'blue', order_index: 1 },
        { id: '3', option_text: '', is_correct: false, color: 'yellow', order_index: 2 },
        { id: '4', option_text: '', is_correct: false, color: 'green', order_index: 3 },
      ]
    })
    setError('')
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateOption = (optionIndex: number, field: keyof Option, value: any) => {
    const updatedOptions = currentQuestion.options.map((option, index) => {
      if (index === optionIndex) {
        return { ...option, [field]: value }
      }
      return option
    })
    setCurrentQuestion({ ...currentQuestion, options: updatedOptions })
  }

  const saveQuiz = async () => {
    if (!title.trim()) {
      setError('Quiz başlığı gereklidir')
      return
    }

    if (questions.length === 0) {
      setError('En az bir soru olmalıdır')
      return
    }

    setSaving(true)
    setError('')

    try {
      // Update quiz info
      const { error: quizUpdateError } = await supabase
        .from('quizzes')
        .update({
          title: title.trim(),
          description: description.trim(),
        })
        .eq('id', quizId)
        .eq('creator_id', user?.id)

      if (quizUpdateError) throw quizUpdateError

      // Delete existing questions and options
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('quiz_id', quizId)

      if (deleteError) throw deleteError

      // Add updated questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i]
        
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .insert([
            {
              quiz_id: quizId,
              question_text: question.question_text,
              time_limit: question.time_limit,
              points: question.points,
              order_index: i,
            }
          ])
          .select()
          .single()

        if (questionError) throw questionError

        // Add options
        const validOptions = question.options.filter(opt => opt.option_text.trim())
        for (let j = 0; j < validOptions.length; j++) {
          const option = validOptions[j]
          
          const { error: optionError } = await supabase
            .from('question_options')
            .insert([
              {
                question_id: questionData.id,
                option_text: option.option_text,
                is_correct: option.is_correct,
                color: option.color,
                order_index: j,
              }
            ])

          if (optionError) throw optionError
        }
      }

      router.push('/quiz/my-quizzes')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Yükleniyor...</div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Quiz bulunamadı</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">Quiz Düzenle</h1>
          <button
            onClick={() => router.push('/quiz/my-quizzes')}
            className="text-black hover:text-black"
          >
            Geri Dön
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Quiz Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Quiz Bilgileri</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Quiz Başlığı *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Örnek: Genel Kültür Quizi"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Quiz hakkında kısa bir açıklama..."
            />
          </div>
        </div>

        {/* Questions List */}
        {questions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Mevcut Sorular ({questions.length})</h2>
            
            {questions.map((question, index) => (
              <div key={question.id} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:mb-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-black mb-2">
                      {index + 1}. {question.question_text}
                    </h3>
                    <div className="text-sm text-black mb-2">
                      Süre: {question.time_limit}s | Puan: {question.points}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {question.options
                        .filter(opt => opt.option_text.trim())
                        .map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`px-3 py-2 rounded text-sm ${getQuizEditColorClass(option.color)} ${
                            option.is_correct ? 'ring-2 ring-offset-1 ring-black' : ''
                          }`}
                        >
                          {option.option_text} {option.is_correct && '✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => removeQuestion(index)}
                    className="text-red-500 hover:text-red-700 ml-4"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Question */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Yeni Soru Ekle</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Soru Metni *
            </label>
            <textarea
              value={currentQuestion.question_text}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Soruyu buraya yazın..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Süre (saniye)
              </label>
              <input
                type="number"
                value={currentQuestion.time_limit}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, time_limit: parseInt(e.target.value) })}
                min="5"
                max="300"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Puan
              </label>
              <input
                type="number"
                value={currentQuestion.points}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) })}
                min="100"
                max="2000"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-2">
              Seçenekler (Doğru cevapları işaretleyin)
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded ${getQuizEditColorClass(option.color)} flex-shrink-0`}></div>
                  
                  <input
                    type="text"
                    value={option.option_text}
                    onChange={(e) => updateOption(index, 'option_text', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={`Seçenek ${index + 1}`}
                  />
                  
                  <input
                    type="checkbox"
                    checked={option.is_correct}
                    onChange={(e) => updateOption(index, 'is_correct', e.target.checked)}
                    className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={addQuestion}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4 transition-colors"
          >
            Soru Ekle
          </button>
        </div>

        {/* Save Quiz */}
        <div className="text-center">
          <button
            onClick={saveQuiz}
            disabled={saving || questions.length === 0}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors mr-4"
          >
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
          
          <button
            onClick={() => router.push('/quiz/my-quizzes')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  )
}
