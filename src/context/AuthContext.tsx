import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null      // the logged-in user, or null if not logged in
  loading: boolean       // true while we're checking if a session exists
  signOut: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

// Creates the context with a default of null (will be filled by AuthProvider)
const AuthContext = createContext<AuthContextType | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────
// Wrap your entire app with this so every component can access auth state.

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // Step 1 — Check if a session already exists (e.g. user refreshed the page)
    // Supabase stores the session in localStorage automatically.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Step 2 — Listen for auth changes (login, logout, token refresh)
    // This fires automatically whenever the auth state changes anywhere in the app.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Step 3 — Clean up the listener when the component unmounts
    return () => subscription.unsubscribe()
  }, [])

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
    // onAuthStateChange above will automatically set user to null
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── useAuth hook ─────────────────────────────────────────────────────────────
// Use this in any component to access auth state.
// Example: const { user, loading, signOut } = useAuth()

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  // This error only triggers if you forget to wrap your app with AuthProvider
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }

  return context
}