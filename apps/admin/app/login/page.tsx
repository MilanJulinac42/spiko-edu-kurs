'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { supabase } from '@/lib/supabase'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.replace(next)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
      }}
    >
      <div className="panel" style={{ width: '100%', maxWidth: 380 }}>
        <h1 style={{ margin: '0 0 0.25rem' }}>Spiko Admin</h1>
        <p style={{ margin: '0 0 1.5rem', color: 'var(--muted)' }}>
          Prijavi se sa admin nalogom.
        </p>

        <form onSubmit={onSubmit} className="col">
          <label className="label">
            <span>Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="label">
            <span>Lozinka</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
          <button type="submit" disabled={loading} className="btn">
            {loading ? 'Trenutak...' : 'Prijavi se'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
