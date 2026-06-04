'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type MeResponse = {
  user: { userId: string; email: string | null; role: string }
  profile: {
    id: string
    fullName: string | null
    targetLevel: string | null
    goal: string | null
    nativeLanguage: string | null
  } | null
}

export default function DashboardPage() {
  const [data, setData] = useState<MeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.me.get().then(({ data, error }) => {
      if (error) setError(String(error.value ?? error.status))
      else setData(data as MeResponse)
    })
  }, [])

  if (error) {
    return (
      <main style={pageStyle}>
        <h1>Dashboard</h1>
        <p style={{ color: '#ff6b6b' }}>Greška: {error}</p>
      </main>
    )
  }
  if (!data) {
    return (
      <main style={pageStyle}>
        <h1>Dashboard</h1>
        <p style={{ opacity: 0.7 }}>Učitavanje...</p>
      </main>
    )
  }

  const needsOnboarding = !data.profile?.targetLevel || !data.profile?.goal

  return (
    <main style={pageStyle}>
      <h1>Zdravo{data.profile?.fullName ? `, ${data.profile.fullName}` : ''} 👋</h1>
      <p style={{ opacity: 0.8 }}>{data.user.email}</p>

      {needsOnboarding && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem 1.25rem',
            background: '#1c2230',
            border: '1px solid #2a3344',
            borderRadius: 10,
          }}
        >
          <strong>Završi profil</strong>
          <p style={{ margin: '0.4rem 0 0.8rem', opacity: 0.85 }}>
            Reci nam svoj nivo i cilj da bismo prilagodili lekcije.
          </p>
          <a href="/onboarding" style={ctaStyle}>
            Podesi profil
          </a>
        </div>
      )}

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Detalji</h2>
        <pre
          style={{
            background: '#11151a',
            border: '1px solid #1f2630',
            padding: '1rem',
            borderRadius: 8,
            overflow: 'auto',
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      </section>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  padding: '3rem 1.5rem',
  maxWidth: 960,
  margin: '0 auto',
}

const ctaStyle: React.CSSProperties = {
  display: 'inline-block',
  background: '#3b82f6',
  color: 'white',
  padding: '0.55rem 1rem',
  borderRadius: 8,
  textDecoration: 'none',
  fontWeight: 600,
}
