import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useAuth } from './AuthContext'
import './auth.css'

type AuthMode = 'signin' | 'signup'

export default function AuthPage() {
  const { signIn, signUp, resendConfirmation, configurationError } = useAuth()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [status, setStatus] = useState<{ kind: 'error' | 'success'; message: string; needsConfirmation?: boolean } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)
    if (mode === 'signup' && password !== confirmation) {
      setStatus({ kind: 'error', message: 'Passwords do not match.' })
      return
    }
    if (mode === 'signup' && displayName.trim().length < 2) {
      setStatus({ kind: 'error', message: 'Enter your display name.' })
      return
    }
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        const result = await signUp(email, password, displayName)
        if (result.needsEmailConfirmation) {
          setMode('signin')
          setStatus({ kind: 'success', message: 'Account created. Check your email and click the confirmation link before signing in.', needsConfirmation: true })
        }
      } else {
        await signIn(email, password)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to authenticate.'
      const needsConfirmation = message.startsWith('EMAIL_NOT_CONFIRMED:')
      setStatus({ kind: 'error', message: needsConfirmation ? message.replace('EMAIL_NOT_CONFIRMED: ', '') : message, needsConfirmation })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand"><div className="auth-brand-icon">◈</div><span>Viva<span>Bank</span></span></div>
        <p className="auth-eyebrow">Academic practice workspace</p>
        <h1 id="auth-title">{mode === 'signin' ? 'Welcome back' : 'Create your student account'}</h1>
        <p className="auth-subtitle">{mode === 'signin' ? 'Sign in to continue your verified study history.' : 'Save your progress across devices with Supabase Auth.'}</p>
        {configurationError && <div className="auth-alert error" role="alert">{configurationError}</div>}
        {status && <div className={`auth-alert ${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'}>{status.message}{status.needsConfirmation && <button className="auth-resend" type="button" onClick={async () => { setSubmitting(true); try { await resendConfirmation(email); setStatus({ kind: 'success', message: 'A new confirmation email was sent. Check your inbox and spam folder.' }) } catch (error) { setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Unable to resend confirmation email.' }) } finally { setSubmitting(false) } }}>Resend confirmation email</button>}</div>}
        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && <label className="auth-field"><span>Display name</span><div className="auth-input-wrap"><UserRound size={17} /><input required minLength={2} value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" /></div></label>}
          <label className="auth-field"><span>Email address</span><div className="auth-input-wrap"><Mail size={17} /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></div></label>
          <label className="auth-field"><span>Password</span><div className="auth-input-wrap"><LockKeyhole size={17} /><input required minLength={6} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} /><button type="button" className="auth-visibility" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          {mode === 'signup' && <label className="auth-field"><span>Confirm password</span><div className="auth-input-wrap"><LockKeyhole size={17} /><input required minLength={6} type={showConfirmation ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" /><button type="button" className="auth-visibility" onClick={() => setShowConfirmation((visible) => !visible)} aria-label={showConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}>{showConfirmation ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>}
          <button className="auth-submit" type="submit" disabled={submitting || Boolean(configurationError)}>{submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
        </form>
        <p className="auth-switch">{mode === 'signin' ? 'New to VivaBank?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setStatus(null) }}>{mode === 'signin' ? 'Create an account' : 'Sign in'}</button></p>
      </section>
    </main>
  )
}
