import Link from 'next/link'

export default function LandingPage() {
  return (
    <main style={{ padding: '5rem 1.5rem', maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: '3rem', margin: 0, lineHeight: 1.1 }}>Spiko Edu</h1>
      <p style={{ opacity: 0.8, lineHeight: 1.6, fontSize: '1.15rem', marginTop: '1rem' }}>
        Učenje jezika kroz video lekcije, vežbe, konverzacije sa nastavnicima i
        AI asistenta.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
        <Link
          href="/register"
          style={{
            background: '#3b82f6',
            color: 'white',
            padding: '0.75rem 1.25rem',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Registruj se
        </Link>
        <Link
          href="/login"
          style={{
            border: '1px solid #2a323d',
            padding: '0.75rem 1.25rem',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          Prijava
        </Link>
      </div>
    </main>
  )
}
