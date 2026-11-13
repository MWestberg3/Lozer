import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function WhoIsThisPage() {
  const { user, loading, accessDenied, signInWithAppPassword, clearAccessDenied } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="landing">
        <p className="landing-subtitle" style={{ textAlign: 'center' }}>
          Loading…
        </p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/home" replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signInWithAppPassword(password)
      setPassword('')
    } catch (err) {
      const code = (err as { code?: string; message?: string }).code
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Wrong password. Try again.')
      } else if ((err as Error).message === 'invalid-password') {
        setError('Wrong password. Try again.')
      } else if ((err as Error).message === 'missing-config') {
        setError('App passwords are not configured on this build.')
      } else {
        setError('Sign-in failed. Try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="landing">
      <div className="landing-inner">
        <p className="landing-brand">Lozer</p>
        <h1 className="landing-title">Who is this?</h1>
        <p className="landing-subtitle">
          Enter your password once. You&apos;ll stay signed in on this device until you sign out.
        </p>

        <form onSubmit={handleSubmit} className="card" style={{ marginTop: '0.5rem' }}>
          <label htmlFor="app-password" style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--muted)' }}>
            Password
          </label>
          <input
            id="app-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
          />
          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.75rem' }} disabled={submitting || !password}>
            {submitting ? 'Signing in…' : 'Continue'}
          </button>
        </form>

        {accessDenied && (
          <p className="card" style={{ marginTop: '0.75rem', color: '#ff8a7a' }} role="alert">
            That account isn&apos;t allowed on this app.
            <button
              type="button"
              className="btn btn-ghost btn-small"
              style={{ marginTop: '0.5rem' }}
              onClick={clearAccessDenied}
            >
              Dismiss
            </button>
          </p>
        )}

        {error && (
          <p style={{ color: '#ff8a7a', fontSize: '0.9rem', marginTop: '0.75rem' }} role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
