'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Mode = 'login' | 'register'

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error
        // Confirm email isključen → sesija odmah aktivna
        router.replace('/onboarding')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace(next)
        router.refresh()
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Greška pri autentifikaciji')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.85rem' }}>
      <h1 style={{ margin: 0, fontSize: '1.6rem' }}>
        {mode === 'register' ? 'Registracija' : 'Prijava'}
      </h1>

      {mode === 'register' && (
        <Field label="Ime i prezime">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Marko Marković"
            required
            style={inputStyle}
          />
        </Field>
      )}

      <Field label="Email">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={inputStyle}
        />
      </Field>

      <Field label="Lozinka">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          style={inputStyle}
        />
      </Field>

      {error && (
        <div style={{ color: '#ff6b6b', fontSize: '0.9rem' }}>{error}</div>
      )}

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading
          ? 'Trenutak...'
          : mode === 'register'
            ? 'Registruj se'
            : 'Prijavi se'}
      </button>

      <div style={{ fontSize: '0.9rem', opacity: 0.8, textAlign: 'center' }}>
        {mode === 'register' ? (
          <>
            Imaš nalog? <a href="/login">Prijavi se</a>
          </>
        ) : (
          <>
            Nemaš nalog? <a href="/register">Registruj se</a>
          </>
        )}
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.9rem' }}>
      <span style={{ opacity: 0.8 }}>{label}</span>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#0b0d10',
  border: '1px solid #2a323d',
  color: '#f3f4f6',
  padding: '0.7rem 0.85rem',
  borderRadius: 8,
  fontSize: '1rem',
  outline: 'none',
}

const buttonStyle: React.CSSProperties = {
  background: '#3b82f6',
  border: 0,
  color: 'white',
  padding: '0.8rem 1rem',
  borderRadius: 8,
  fontSize: '1rem',
  cursor: 'pointer',
  fontWeight: 600,
}
