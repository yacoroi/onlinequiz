import React, { memo } from 'react'
import Link from 'next/link'

interface Quiz {
  id: string
  title: string
  description: string
  created_at: string
  questions: { count: number }[]
}

interface QuizCardProps {
  quiz: Quiz
  onStartGame: (quizId: string) => void
  onDeleteQuiz: (quizId: string) => void
  isStarting?: boolean
  isDeleting?: boolean
}

const QuizCard = memo(({ 
  quiz, 
  onStartGame, 
  onDeleteQuiz, 
  isStarting = false, 
  isDeleting = false 
}: QuizCardProps) => {
  const questionCount = quiz.questions?.[0]?.count || 0

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
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
          Soru Sayısı: {questionCount}
        </div>
        <div>
          Oluşturulma: {new Date(quiz.created_at).toLocaleDateString('tr-TR')}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => onStartGame(quiz.id)}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
          disabled={!questionCount || isStarting}
        >
          {isStarting ? 'Başlatılıyor...' : 
           questionCount ? 'Oyun Başlat' : 'Soru Yok'}
        </button>
        
        <div className="flex gap-2">
          <Link
            href={`/quiz/edit/${quiz.id}`}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded text-center transition-colors"
          >
            Düzenle
          </Link>
          
          <button
            onClick={() => onDeleteQuiz(quiz.id)}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
            disabled={isDeleting}
          >
            {isDeleting ? 'Siliniyor...' : 'Sil'}
          </button>
        </div>
      </div>
    </div>
  )
})

QuizCard.displayName = 'QuizCard'

export default QuizCard