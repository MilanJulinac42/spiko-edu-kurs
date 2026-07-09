'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
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
        router.replace('/dashboard')
        router.refresh()
        return
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      router.replace(next)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          {mode === 'register' ? 'Napravi nalog' : 'Pozdrav opet 👋'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {mode === 'register'
            ? 'Registracija je brza — kreni za par sekundi.'
            : 'Prijava za nastavak kursa.'}
        </p>
      </div>

      {mode === 'register' && (
        <Field
          label="Ime i prezime"
          type="text"
          value={fullName}
          onChange={setFullName}
          placeholder="Ana Janković"
          required
        />
      )}

      <Field
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        required
      />

      <div>
        <Field
          label="Lozinka"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          minLength={8}
          required
        />
        {mode === 'login' && (
          <div className="mt-1.5 text-right">
            <Link href="/forgot" className="text-xs font-semibold text-primary-dark hover:underline">
              Zaboravljena lozinka?
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
        {loading
          ? 'Trenutak...'
          : mode === 'register'
            ? 'Registruj se'
            : 'Prijavi se'}
      </Button>

      <p className="text-center text-sm text-muted">
        {mode === 'register' ? (
          <>
            Već imaš nalog?{' '}
            <Link href="/login" className="font-semibold text-primary-dark hover:underline">
              Prijavi se
            </Link>
          </>
        ) : (
          <>
            Nemaš nalog?{' '}
            <Link href="/register" className="font-semibold text-primary-dark hover:underline">
              Registruj se
            </Link>
          </>
        )}
      </p>
    </form>
  )
}

function Field({
  label,
  type,
  value,
  onChange,
  ...rest
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink/80">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15"
        {...rest}
      />
    </label>
  )
}
