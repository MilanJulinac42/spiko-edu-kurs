'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Logo } from './Logo'
import { DialogRoot } from './dialog'
import { ToastRoot } from './toast'
import { RouteProgress } from './RouteProgress'
import { VideoReadyWatcher } from './VideoReadyWatcher'
import { ThemeToggle } from './ThemeToggle'

type Me = {
  user: { userId: string; email: string | null; role: string }
  profile: { fullName: string | null } | null
}

/**
 * Inline SVG ikone — thin stroke (1.6), 18px, currentColor. Bez fill-a, suptilne,
 * iste „težine" kao tekst pa lepo sede kao label-i.
 */
function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}
function IconCourses() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v14H6a2 2 0 0 0-2 2V5Z" />
      <path d="M6 19a2 2 0 0 0-2 2" />
      <path d="M8 7h7M8 11h5" />
    </svg>
  )
}
function IconExercises() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 4.5h6V6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4.5Z" />
      <path d="m9 13 2 2 4-4" />
      <path d="M9 18h6" />
    </svg>
  )
}
function IconMedia() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m10 9 5 3-5 3V9Z" />
    </svg>
  )
}
function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 20c.6-3.2 3-5 5.5-5s4.9 1.8 5.5 5" />
      <circle cx="17" cy="9.5" r="2.5" />
      <path d="M16 14.5c2.4.2 4 1.8 4.5 4.5" />
    </svg>
  )
}

const NAV_SECTIONS: Array<{
  label?: string
  items: Array<{ href: string; label: string; Icon: () => React.JSX.Element }>
}> = [
  {
    items: [{ href: '/', label: 'Pregled', Icon: IconDashboard }],
  },
  {
    label: 'Sadržaj',
    items: [
      { href: '/courses', label: 'Kursevi', Icon: IconCourses },
      { href: '/exercises', label: 'Vežbe', Icon: IconExercises },
      { href: '/media', label: 'Mediji', Icon: IconMedia },
    ],
  },
  {
    label: 'Sistem',
    items: [{ href: '/users', label: 'Korisnici', Icon: IconUsers }],
  },
]

const SIDEBAR_WIDTH = 240

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    api.me.get().then(({ data, error }) => {
      if (error) {
        setError(String(error.value ?? error.status))
        return
      }
      setMe(data as Me)
    })
  }, [])

  // Zatvori drawer pri promeni rute
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  // Body scroll lock kad je drawer otvoren
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  if (error) {
    return (
      <main style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <h1>Greška</h1>
        <p style={{ color: 'var(--muted)' }}>{error}</p>
      </main>
    )
  }
  if (!me) {
    return <ShellSkeleton />
  }

  if (me.user.role !== 'admin') {
    return (
      <main style={{ padding: '3rem 1rem', maxWidth: 560, margin: '0 auto' }}>
        <div className="panel">
          <h1 style={{ marginTop: 0 }}>Pristup odbijen</h1>
          <p style={{ color: 'var(--muted)' }}>
            Tvoj nalog ({me.user.email}) nema admin ulogu. Trenutna uloga: <strong>{me.user.role}</strong>.
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

  // Inicijali iz imena ili email-a — za avatar krug
  const displayName = me.profile?.fullName || me.user.email || 'A'
  const initials = displayName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || 'A'

  const sidebarContent = (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: '1.75rem',
          padding: '0 0.25rem',
        }}
      >
        <Logo size={20} />
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            background: 'var(--primary-soft)',
            color: 'var(--primary-dark)',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            borderRadius: 999,
            lineHeight: 1.4,
          }}
        >
          Admin
        </span>
      </div>
      <nav className="admin-nav">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className="admin-nav-section">
            {section.label && (
              <div className="admin-nav-section-label">{section.label}</div>
            )}
            {section.items.map((item) => {
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)
              const { Icon } = item
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-link${active ? ' is-active' : ''}`}
                >
                  <span className="admin-nav-rail" aria-hidden />
                  <span className="admin-nav-icon" aria-hidden>
                    <Icon />
                  </span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div
        style={{
          marginTop: 'auto',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0.4rem 0.25rem',
          }}
        >
          <div
            aria-hidden
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            {me.profile?.fullName && (
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {me.profile.fullName}
              </div>
            )}
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {me.user.email}
            </div>
          </div>
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <ThemeToggle />
        </div>
        <button
          className="btn ghost"
          style={{ marginTop: '0.35rem', fontSize: '0.82rem', width: '100%', justifyContent: 'flex-start' }}
          onClick={async () => {
            await supabase.auth.signOut()
            router.replace('/login')
            router.refresh()
          }}
        >
          ← Odjava
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="admin-mobile-bar">
        <button
          aria-label="Otvori meni"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
          style={{
            background: 'transparent',
            border: 0,
            color: 'var(--ink)',
            width: 44,
            height: 44,
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <Logo size={18} />
        <div style={{ width: 44 }} />
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26, 39, 56, 0.35)',
            backdropFilter: 'blur(2px)',
            zIndex: 49,
          }}
          className="admin-drawer-overlay"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className="admin-drawer"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: SIDEBAR_WIDTH,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease-out',
          boxShadow: drawerOpen ? 'var(--shadow-lift)' : 'none',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Desktop layout */}
      <div className="admin-layout">
        <aside className="admin-sidebar">
          {sidebarContent}
        </aside>
        <main className="admin-main">{children}</main>
      </div>

      {/* Global dialog (prompt/confirm) */}
      <DialogRoot />

      {/* Global toast notifications */}
      <ToastRoot />

      {/* Route change progress bar */}
      <RouteProgress />

      {/* Globalni polling za Bunny video-ready toast obaveštenja */}
      <VideoReadyWatcher />

      <style>{`
        /* ---------- Sidebar nav ---------- */
        .admin-nav {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .admin-nav-section {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .admin-nav-section-label {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
          opacity: 0.6;
          padding: 0 0.85rem;
          margin-bottom: 0.35rem;
        }
        .admin-nav-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.55rem 0.85rem;
          border-radius: 10px;
          font-size: 0.92rem;
          line-height: 1;
          min-height: 38px;
          color: var(--ink-soft);
          text-decoration: none;
          font-weight: 500;
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .admin-nav-link:hover {
          color: var(--ink);
          background: var(--surface-2);
        }
        .admin-nav-icon {
          display: inline-flex;
          width: 18px;
          height: 18px;
          align-items: center;
          justify-content: center;
          color: var(--muted);
          transition: color 0.15s ease;
          flex-shrink: 0;
        }
        .admin-nav-link:hover .admin-nav-icon {
          color: var(--ink);
        }
        /* Aktivni state: primary-soft pozadina + primary-dark tekst + brand rail levo */
        .admin-nav-link.is-active {
          color: var(--primary-dark);
          background: var(--primary-soft);
          font-weight: 600;
        }
        .admin-nav-link.is-active .admin-nav-icon {
          color: var(--primary-dark);
        }
        .admin-nav-rail {
          position: absolute;
          left: -0.5rem;
          top: 8px;
          bottom: 8px;
          width: 3px;
          border-radius: 2px;
          background: transparent;
          transition: background-color 0.15s ease;
        }
        .admin-nav-link.is-active .admin-nav-rail {
          background: var(--primary);
        }

        /* Mobile (< 1024px) */
        .admin-mobile-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem 1rem;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 40;
        }
        .admin-layout {
          display: grid;
          grid-template-columns: 1fr;
          min-height: calc(100vh - 60px);
        }
        .admin-sidebar { display: none; }
        .admin-main {
          padding: 1.25rem 1rem;
          overflow-x: hidden;
        }

        /* Desktop (>= 1024px) */
        @media (min-width: 1024px) {
          .admin-mobile-bar { display: none; }
          .admin-drawer, .admin-drawer-overlay { display: none !important; }
          .admin-layout {
            grid-template-columns: ${SIDEBAR_WIDTH}px 1fr;
            /* Fiksna visina viewporta — prozor se NE skroluje; scroll ide samo unutar .admin-main */
            height: 100vh;
            overflow: hidden;
          }
          .admin-sidebar {
            display: flex;
            flex-direction: column;
            background: var(--surface);
            border-right: 1px solid var(--border);
            padding: 1.5rem 1.1rem;
            /* Fiksiran — puna visina, ne pomera se sa sadržajem */
            height: 100vh;
            min-height: 0;
            overflow-y: auto;
          }
          .admin-main {
            padding: 2rem 2.25rem;
            /* min-height:0 je KLJUČNO — bez njega grid item ima min-height:auto
               pa se ne skroluje interno nego razvuče grid i skroluje ceo prozor */
            min-height: 0;
            height: 100vh;
            overflow-y: auto;
            max-width: 1280px;
            width: 100%;
            margin: 0 auto;
          }
        }
      `}</style>
    </>
  )
}

/* ──────── Shell skeleton (dok stiže /me) ──────── */

function ShellSkeleton() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="admin-skeleton"
            style={{ width: 110, height: 22, borderRadius: 6, display: 'inline-block' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className="admin-skeleton"
              style={{ height: 36, borderRadius: 10, display: 'block' }}
            />
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="admin-skeleton"
              style={{ width: 34, height: 34, borderRadius: 999, display: 'inline-block' }}
            />
            <div style={{ flex: 1 }}>
              <span
                className="admin-skeleton"
                style={{ width: '70%', height: 11, borderRadius: 4, display: 'block' }}
              />
              <span
                className="admin-skeleton"
                style={{ width: '90%', height: 10, borderRadius: 4, display: 'block', marginTop: 4 }}
              />
            </div>
          </div>
        </div>
      </aside>
      <main className="admin-main">
        <span
          className="admin-skeleton"
          style={{ display: 'block', width: 140, height: 22, borderRadius: 6, marginBottom: 24 }}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
          }}
        >
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="stat-card" style={{ minHeight: 110 }}>
              <span
                className="admin-skeleton"
                style={{ width: 120, height: 10, borderRadius: 4, display: 'block' }}
              />
              <span
                className="admin-skeleton"
                style={{ width: 50, height: 28, borderRadius: 6, display: 'block', marginTop: 8 }}
              />
              <span
                className="admin-skeleton"
                style={{ width: 140, height: 10, borderRadius: 4, display: 'block', marginTop: 8 }}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
