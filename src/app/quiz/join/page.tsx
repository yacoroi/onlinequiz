'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function JoinGame() {
  const { user } = useAuth()
  const router = useRouter()
  const [gamePin, setGamePin] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const joinGame = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Environment kontrolü
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('Missing Supabase environment variables')
        throw new Error('Supabase yapılandırması eksik. .env.local dosyasını kontrol edin.')
      }

      const pinCode = gamePin.trim().padStart(6, '0')
      console.log('Searching for game with PIN:', pinCode)
      console.log('User:', user?.id, user?.email)
      
      // Find game session by PIN - önce tüm durumları kontrol et
      const { data: allSessions, error: allSessionsError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('game_pin', pinCode)

      console.log('All sessions with PIN:', { allSessions, allSessionsError })

      if (allSessionsError) {
        console.error('Database error:', allSessionsError)
        throw new Error('Veritabanı hatası: ' + allSessionsError.message)
      }

      if (!allSessions || allSessions.length === 0) {
        throw new Error('Bu PIN kodu ile aktif bir oyun bulunamadı')
      }

      // Waiting durumundaki oturumu bul
      const session = allSessions.find(s => s.status === 'waiting')
      
      if (!session) {
        const sessionStatuses = allSessions.map(s => s.status).join(', ')
        throw new Error(`Bu PIN kodlu oyun şu anda katılıma açık değil. Durum: ${sessionStatuses}`)
      }

      console.log('Found waiting session:', session)

      // Check if user already joined (only for authenticated users)
      if (user) {
        const { data: existingParticipant, error: participantCheckError } = await supabase
          .from('game_participants')
          .select('*')
          .eq('session_id', session.id)
          .eq('user_id', user.id)
          .single()

        if (participantCheckError && participantCheckError.code !== 'PGRST116') {
          console.error('Error checking existing participant:', participantCheckError)
          throw new Error('Katılımcı kontrolü sırasında hata: ' + participantCheckError.message)
        }

        if (existingParticipant) {
          console.log('User already joined, redirecting...')
          router.push(`/game/play/${session.id}`)
          return
        }
      }

      // Join the game
      const participantNickname = nickname.trim() || (user?.email?.split('@')[0]) || 'Anonim Oyuncu'
      console.log('Attempting to join game with:', {
        session_id: session.id,
        user_id: user?.id || null,
        nickname: participantNickname
      })

      const { data: newParticipant, error: joinError } = await supabase
        .from('game_participants')
        .insert([
          {
            session_id: session.id,
            user_id: user?.id || null,
            nickname: participantNickname
          }
        ])
        .select()
        .single()

      console.log('Join result:', { newParticipant, joinError })

      if (joinError) {
        console.error('Join error:', joinError)
        throw new Error('Oyuna katılım hatası: ' + joinError.message)
      }

      // For anonymous users, save participant ID to localStorage
      if (!user && newParticipant) {
        localStorage.setItem(`participant_${session.id}`, newParticipant.id)
      }

      console.log('Successfully joined, redirecting to:', `/game/play/${session.id}`)
      router.push(`/game/play/${session.id}`)
    } catch (error: any) {
      console.error('Overall error:', error)
      setError(error.message || 'Bilinmeyen bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">Oyuna Katıl</h1>
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-800"
          >
            Ana Sayfa
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Oyuna Katıl
              </h2>
              <p className="text-gray-600">
                Host'tan aldığınız PIN kodunu girin
              </p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <form onSubmit={joinGame}>
              <div className="mb-6">
                <label htmlFor="gamePin" className="block text-sm font-medium text-gray-700 mb-2">
                  Oyun PIN Kodu *
                </label>
                <input
                  type="text"
                  id="gamePin"
                  value={gamePin}
                  onChange={(e) => setGamePin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 text-2xl text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 tracking-wider"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                  {user ? 'Takma Ad (İsteğe bağlı)' : 'Oyuncu Adınız *'}
                </label>
                <input
                  type="text"
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={user?.email?.split('@')[0] || 'Oyuncu adınızı girin'}
                  maxLength={20}
                  required={!user}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {user 
                    ? `Boş bırakırsanız: ${user.email?.split('@')[0] || 'Oyuncu'}`
                    : 'Bu isim diğer oyuncular tarafından görülecek'
                  }
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || gamePin.length < 6 || (!user && !nickname.trim())}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg text-lg transition-colors"
              >
                {loading ? 'Katılınıyor...' : 'Oyuna Katıl'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <div className="text-sm text-gray-500">
                PIN kodunuz yok mu?
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Host'tan 6 haneli PIN kodunu isteyin
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white/10 backdrop-blur rounded-lg p-6 text-white">
            <h3 className="font-bold mb-2">Nasıl Oynanır?</h3>
            <ul className="text-sm space-y-1 opacity-90">
              <li>• Host'tan PIN kodunu alın</li>
              <li>• PIN kodunu girin ve oyuna katılın</li>
              <li>• Host oyunu başlatmasını bekleyin</li>
              <li>• Soruları okuyun ve doğru cevabı seçin</li>
              <li>• Hızlı cevap verin ve puanı kaptın!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}