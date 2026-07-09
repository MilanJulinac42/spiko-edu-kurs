'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)

  // Supabase parsira recovery token iz URL hasha pri mount-u i postavi sesiju.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })
    // posle 1s ako event nije stigao, ipak prikaži formu (Supabase već može imati sesiju)
    const t = setTimeout(() => setReady(true), 1000)
    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(t)
    }
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Lozinke se ne poklapaju.')
      return
    }
    if (password.length < 8) {
      setError('Lozinka mora imati najmanje 8 karaktera.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setTimeout(() => {
        router.replace('/dashboard')
        router.refresh()
      }, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-5xl">✓</div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Lozinka promenjena</h1>
        <p className="text-sm text-muted">Preusmeravam te na dashboard…</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <p className="text-center text-sm text-muted">Učitavanje…</p>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          Postavi novu lozinku
        </h1>
        <p className="mt-2 text-sm text-muted">
          Izaberi lozinku koju ćeš zapamtiti — najmanje 8 karaktera.
        </p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink/80">Nova lozinka</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink/80">Ponovi lozinku</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15"
        />
      </label>

      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
        {loading ? 'Snimam…' : 'Postavi novu lozinku'}
      </Button>
    </form>
  )
}
