'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CEFR } from '@spiko/shared'
import { api } from '@/lib/api'

export default function OnboardingPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [nativeLanguage, setNativeLanguage] = useState('sr')
  const [targetLevel, setTargetLevel] = useState<string>('A1')
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.me.get().then(({ data }) => {
      const p = (data as { profile?: { fullName?: string | null; nativeLanguage?: string | null; targetLevel?: string | null; goal?: string | null } } | null)?.profile
      if (p?.fullName) setFullName(p.fullName)
      if (p?.nativeLanguage) setNativeLanguage(p.nativeLanguage)
      if (p?.targetLevel) setTargetLevel(p.targetLevel)
      if (p?.goal) setGoal(p.goal)
    })
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await api.me.onboarding.post({
        fullName,
        nativeLanguage,
        targetLevel,
        goal,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      if (error) throw new Error(String(error.value ?? error.status))
      router.replace('/dashboard')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={pageStyle}>
      <h1>Završi profil</h1>
      <p style={{ opacity: 0.8 }}>
        Ove podatke koristimo da prilagodimo lekcije i AI asistenta.
      </p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
        <Field label="Ime i prezime">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Maternji jezik">
          <input
            value={nativeLanguage}
            onChange={(e) => setNativeLanguage(e.target.value)}
            placeholder="sr"
            style={inputStyle}
          />
        </Field>

        <Field label="Ciljni CEFR nivo">
          <select
            value={targetLevel}
            onChange={(e) => setTargetLevel(e.target.value)}
            style={inputStyle}
          >
            {CEFR.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tvoj cilj">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Hoću da pričam tečno za putovanja..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </Field>

        {error && <div style={{ color: '#ff6b6b' }}>{error}</div>}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Snimam...' : 'Sačuvaj'}
        </button>
      </form>
    </main>
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

const pageStyle: React.CSSProperties = {
  padding: '3rem 1.5rem',
  maxWidth: 560,
  margin: '0 auto',
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
