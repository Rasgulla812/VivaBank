import { createClient, SupabaseClient } from '@supabase/supabase-js'

const LOCAL_STORAGE_URL_KEY = 'vivabank_supabase_url'
const LOCAL_STORAGE_KEY_KEY = 'vivabank_supabase_anon_key'

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || ''
  const envKey = (
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string)
    || (import.meta.env.VITE_SUPABASE_ANON_KEY as string)
    || ''
  )

  if (typeof window === 'undefined') {
    return { url: envUrl, anonKey: envKey }
  }

  const storedUrl = window.localStorage.getItem(LOCAL_STORAGE_URL_KEY) || ''
  const storedKey = window.localStorage.getItem(LOCAL_STORAGE_KEY_KEY) || ''

  return {
    url: storedUrl || envUrl,
    anonKey: storedKey || envKey,
  }
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_STORAGE_URL_KEY, url.trim())
  window.localStorage.setItem(LOCAL_STORAGE_KEY_KEY, anonKey.trim())
  // Reinitialize client
  cachedClient = null
}

let cachedClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient

  const { url, anonKey } = getSupabaseCredentials()
  if (!url || !anonKey) {
    return null
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
      },
    })
    return cachedClient
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error)
    return null
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials()
  return Boolean(url && anonKey)
}

export function getSupabaseConfigurationError(): string | null {
  const { url, anonKey } = getSupabaseCredentials()
  if (!url || !anonKey) {
    return 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.'
  }
  return null
}

export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'unauthenticated'
  return window.localStorage.getItem('vivabank_user_id') || 'unauthenticated'
}
