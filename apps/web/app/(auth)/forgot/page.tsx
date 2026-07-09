'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset`,
      })
      if (error) throw error
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            Email poslat ✉
          </h1>
          <p className="mt-2 text-sm text-muted">
            Ako nalog sa <strong>{email}</strong> postoji, poslali smo ti link
            za reset lozinke. Proveri inbox (i spam).
          </p>
        </div>

        <div className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-ink/85">
          💡 Link važi 1 sat. Klik na link te vodi na stranicu gde unosiš novu lozinku.
        </div>

        <Link href="/login" className="block text-center text-sm font-semibold text-primary-dark hover:underline">
          ← Nazad na prijavu
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          Resetuj lozinku
        </h1>
        <p className="mt-2 text-sm text-muted">
          Unesi email sa nalogom — poslaćemo ti link za postavljanje nove lozinke.
        </p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink/80">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15"
        />
      </label>

      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
        {loading ? 'Šaljem…' : 'Pošalji link'}
      </Button>

      <p className="text-center text-sm text-muted">
        Lozinka je tu?{' '}
        <Link href="/login" className="font-semibold text-primary-dark hover:underline">
          Vrati se na prijavu
        </Link>
      </p>
    </form>
  )
}
