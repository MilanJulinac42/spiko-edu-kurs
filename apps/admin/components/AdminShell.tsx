'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

type Me = {
  user: { userId: string; email: string | null; role: string }
  profile: { fullName: string | null } | null
}

const NAV = [
  { href: '/', label: 'Pregled', icon: '○' },
  { href: '/courses', label: 'Kursevi', icon: '◐' },
  { href: '/exercises', label: 'Vežbe', icon: '◑' },
  { href: '/media', label: 'Mediji', icon: '◍' },
  { href: '/users', label: 'Korisnici', icon: '◎' },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.me.get().then(({ data, error }) => {
      if (error) {
        setError(String(error.value ?? error.status))
        return
      }
      const m = data as Me
      setMe(m)
    })
  }, [])

  if (error) {
    return (
      <main style={{ padding: '3rem', textAlign: 'center' }}>
        <h1>Greška</h1>
        <p style={{ color: 'var(--muted)' }}>{error}</p>
      </main>
    )
  }
  if (!me) {
    return <main style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>Učitavanje...</main>
  }

  if (me.user.role !== 'admin') {
    return (
      <main style={{ padding: '3rem', maxWidth: 560, margin: '0 auto' }}>
        <div className="panel">
          <h1 style={{ marginTop: 0 }}>Pristup odbijen</h1>
          <p style={{ color: 'var(--muted)' }}>
            Tvoj nalog ({me.user.email}) nema admin ulogu. Trenutna uloga: <strong>{me.user.role}</strong>.
          </p>
          <p style={{ color: 'var(--muted)' }}>
            Admin treba da postavi tvoju ulogu u <code>profiles.role = 'admin'</code>.
          </p>
          <button
            className="btn secondary"
            onClick={async () => {
              await supabase.auth.signOut()
              router.replace('/login')
              router.refresh()
            }}
          >
            Odjava
          </button>
        </div>
      </main>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
      <aside
        style={{
          background: 'var(--panel)',
          borderRight: '1px solid var(--border)',
          padding: '1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
          Spiko Admin
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {NAV.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: active ? 'white' : 'var(--muted)',
                  background: active ? 'var(--panel-2)' : 'transparent',
                  display: 'flex',
                  gap: '0.6rem',
                  alignItems: 'center',
                  fontSize: '0.92rem',
                }}
              >
                <span style={{ color: active ? 'var(--accent-hover)' : 'inherit' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{me.user.email}</div>
          <button
            className="btn ghost"
            style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
            onClick={async () => {
              await supabase.auth.signOut()
              router.replace('/login')
              router.refresh()
            }}
          >
            Odjava →
          </button>
        </div>
      </aside>
      <main style={{ padding: '1.75rem 2rem', overflow: 'auto' }}>{children}</main>
    </div>
  )
}
