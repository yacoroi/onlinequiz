'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let timeout: NodeJS.Timeout
    
    const initAuth = async () => {
      // Set shorter timeout to prevent long loading
      timeout = setTimeout(() => {
        if (mounted) {
          console.warn('Auth initialization timeout - proceeding without auth')
          setSession(null)
          setUser(null)
          setLoading(false)
        }
      }, 3000) // 3 second timeout

      try {
        // Get initial session with race condition to timeout
        const sessionPromise = supabase.auth.getSession()
        const { data: { session }, error } = await sessionPromise
        
        if (!mounted) return
        
        clearTimeout(timeout)
        
        if (error) {
          console.error('Auth session error:', error)
          // Clear corrupted session data
          if (error.message?.includes('Refresh Token')) {
            await supabase.auth.signOut()
          }
          setSession(null)
          setUser(null)
          setLoading(false)
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        if (!mounted) return
        console.error('Auth session error:', error)
        clearTimeout(timeout)
        // Clear any corrupted auth state
        setSession(null)
        setUser(null)
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Create or update user profile
            await supabase
              .from('profiles')
              .upsert({
                id: session.user.id,
                email: session.user.email,
                updated_at: new Date().toISOString(),
              })
          } catch (error) {
            console.error('Profile update error:', error)
          }
        }
      }
    )

    return () => {
      mounted = false
      if (timeout) clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    
    // Create profile with username
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          email,
          username,
        }
      ])
    
    if (profileError) throw profileError
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  }), [user, session, loading, signIn, signUp, signOut])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}