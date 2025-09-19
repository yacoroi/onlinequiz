'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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
    
    // Set timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization timeout')
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return
        
        if (error) {
          console.error('Auth session error:', error)
          // Clear corrupted session data
          if (error.message?.includes('Refresh Token')) {
            supabase.auth.signOut()
          }
          setSession(null)
          setUser(null)
          setLoading(false)
          clearTimeout(timeout)
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        clearTimeout(timeout)
      })
      .catch((error) => {
        if (!mounted) return
        console.error('Auth session error:', error)
        // Clear any corrupted auth state
        setSession(null)
        setUser(null)
        setLoading(false)
        clearTimeout(timeout)
      })

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
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, username: string) => {
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
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}