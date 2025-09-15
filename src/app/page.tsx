'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'
import Link from 'next/link'

export default function Home() {
  const { user, loading, signOut } = useAuth()
  const [showLogin, setShowLogin] = useState(true)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Yükleniyor...</div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
        <nav className="bg-white shadow-md p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-purple-600">Kahoot Clone</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Hoş geldin, {user.email}</span>
              <button
                onClick={signOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">
              Quiz Oyunun Başlasın!
            </h2>
            <p className="text-xl text-purple-100">
              Gerçek zamanlı quiz oyunları oluştur ve oyna
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Link href="/quiz/create">
              <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className="bg-green-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">+</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Quiz Oluştur</h3>
                  <p className="text-gray-600">Yeni bir quiz oluştur ve arkadaşlarınla paylaş</p>
                </div>
              </div>
            </Link>

            <Link href="/quiz/join">
              <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className="bg-blue-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">→</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Oyuna Katıl</h3>
                  <p className="text-gray-600">PIN kodu ile bir oyuna katıl</p>
                </div>
              </div>
            </Link>

            <Link href="/quiz/my-quizzes">
              <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className="bg-purple-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">📋</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Quizlerim</h3>
                  <p className="text-gray-600">Oluşturduğun quizleri yönet</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-6">
            Kahoot Clone
          </h1>
          <p className="text-xl text-purple-100">
            Gerçek zamanlı quiz oyunları oluştur ve oyna
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-2 mb-4">
            <div className="flex rounded-md overflow-hidden">
              <button
                onClick={() => setShowLogin(true)}
                className={`flex-1 py-2 px-4 font-medium transition-colors ${
                  showLogin
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Giriş Yap
              </button>
              <button
                onClick={() => setShowLogin(false)}
                className={`flex-1 py-2 px-4 font-medium transition-colors ${
                  !showLogin
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Kayıt Ol
              </button>
            </div>
          </div>

          {showLogin ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </div>
  )
}
