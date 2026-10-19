/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseClient, getSupabaseConfigurationError } from '../supabaseClient'

interface AuthContextValue {
  session: Session | null
  user: User | null
  displayName: string
  loading: boolean
  configurationError: string | null
  signUp: (email: string, password: string, displayName: string) => Promise<{ needsEmailConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<void>
  resendConfirmation: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function authErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Authentication failed. Please try again.'
}

function isEmailNotConfirmedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const candidate = error as { code?: string; message?: string }
  return candidate.code === 'email_not_confirmed' || candidate.message?.toLowerCase().includes('email not confirmed') === true
}

async function upsertProfile(user: User, displayName: string): Promise<void> {
  const client = getSupabaseClient()
  if (!client) throw new Error(getSupabaseConfigurationError() || 'Supabase is unavailable.')
  const { error } = await client.from('profiles').upsert({
    id: user.id,
    display_name: displayName.trim() || user.email?.split('@')[0] || 'Student',
  }, { onConflict: 'id' })
  if (error) throw error
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = getSupabaseClient()
  const configurationError = getSupabaseConfigurationError()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(() => Boolean(client))
  const [profileName, setProfileName] = useState('')

  useEffect(() => {
    if (!client) {
      return
    }

    let active = true
    void client.auth.getSession().then(({ data, error }) => {
      if (error) console.error('Unable to restore Supabase session:', error.message)
      if (active) {
        setSession(data.session)
        setLoading(false)
      }
    })

    const { data: subscription } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) setProfileName('')
      setLoading(false)
      if (nextSession?.user?.id) {
        window.localStorage.setItem('vivabank_user_id', nextSession.user.id)
      }
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [client])

  useEffect(() => {
    if (!session?.user) {
      return
    }

    const metadataName = session.user.user_metadata?.display_name
    if (typeof metadataName === 'string' && metadataName.trim()) {
      return
    }

    const client = getSupabaseClient()
    if (!client) return
    void client.from('profiles').select('display_name').eq('id', session.user.id).maybeSingle().then(({ data, error }) => {
      if (error) {
        console.error('Unable to load student profile:', error.message)
        return
      }
      setProfileName(data?.display_name || session.user.email?.split('@')[0] || 'Student')
    })
  }, [session])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user || null,
    displayName: session
      ? (profileName || (typeof session.user.user_metadata?.display_name === 'string' ? session.user.user_metadata.display_name : '') || session.user.email?.split('@')[0] || 'Student')
      : '',
    loading,
    configurationError,
    signUp: async (email, password, name) => {
      if (!client) throw new Error(configurationError || 'Supabase is unavailable.')
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: name.trim() } },
      })
      if (error) throw new Error(authErrorMessage(error))
      if (data.user && data.session) await upsertProfile(data.user, name)
      return { needsEmailConfirmation: !data.session }
    },
    signIn: async (email, password) => {
      if (!client) throw new Error(configurationError || 'Supabase is unavailable.')
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        if (isEmailNotConfirmedError(error)) {
          throw new Error('EMAIL_NOT_CONFIRMED: Confirm your email address before signing in.')
        }
        throw new Error(authErrorMessage(error))
      }
      if (data.user) await upsertProfile(data.user, String(data.user.user_metadata?.display_name || ''))
    },
    resendConfirmation: async (email) => {
      if (!client) throw new Error(configurationError || 'Supabase is unavailable.')
      const { error } = await client.auth.resend({ type: 'signup', email: email.trim() })
      if (error) throw new Error(authErrorMessage(error))
    },
    signOut: async () => {
      if (!client) return
      const { error } = await client.auth.signOut()
      if (error) throw new Error(authErrorMessage(error))
      window.localStorage.removeItem('vivabank_user_id')
    },
  }), [client, configurationError, loading, profileName, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
