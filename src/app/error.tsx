'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-white mb-4">Bir Hata Oluştu</h1>
        <p className="text-purple-200 mb-8">
          Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            Tekrar Dene
          </button>
          
          <Link
            href="/"
            className="bg-purple-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-400 transition-colors"
          >
            Ana Sayfa
          </Link>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="text-white cursor-pointer">Hata Detayları</summary>
            <pre className="mt-4 text-sm text-red-200 bg-red-900 p-4 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}