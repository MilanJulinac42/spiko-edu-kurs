'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { EmptyState, EmptyIconBook } from '@/components/EmptyState'
import { Skeleton, TableSkeleton } from '@/components/Skeleton'
import { statusLabel } from '@/lib/status'

type Course = { id: string; title: string; status: string; slug?: string; level?: string | null }

type Stats = {
  courses: { total: number; published: number; draft: number; hidden: number }
  users: { total: number; students: number; teachers: number; admins: number }
  exercises: { total: number; inLessons: number; templates: number }
}

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.admin.courses.get(),
      api.admin.stats.get(),
    ]).then(([cRes, sRes]) => {
      if (Array.isArray(cRes.data)) setCourses(cRes.data as Course[])
      if (sRes.data) setStats(sRes.data as Stats)
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <p
          style={{
            margin: 0,
            color: 'var(--ink-soft)',
            fontSize: '0.82rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Spiko Admin
        </p>
        <h1 style={{ margin: '0.2rem 0 0' }}>Pregled</h1>
      </div>

      <div className="stat-grid" style={{ marginBottom: '1.75rem' }}>
        <StatCard
          label="Ukupno kurseva"
          value={loading ? null : (stats?.courses.total ?? 0)}
          hint={
            loading
              ? null
              : `${stats?.courses.published ?? 0} objavljeno · ${stats?.courses.draft ?? 0} skica`
          }
          tone="primary"
        />
        <StatCard
          label="Korisnici"
          value={loading ? null : (stats?.users.total ?? 0)}
          hint={
            loading
              ? null
              : `${stats?.users.students ?? 0} student · ${stats?.users.admins ?? 0} admin`
          }
          tone="accent"
        />
        <StatCard
          label="Vežbe"
          value={loading ? null : (stats?.exercises.total ?? 0)}
          hint={
            loading
              ? null
              : `${stats?.exercises.templates ?? 0} template · ${stats?.exercises.inLessons ?? 0} u lekcijama`
          }
          tone="primary"
        />
        <StatCard label="Zakazivanja" value="—" hint="uskoro" />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
          gap: '1.25rem',
          alignItems: 'start',
        }}
        className="dash-grid"
      >
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            className="row between"
            style={{
              padding: '1.1rem 1.35rem',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1rem' }}>Skorašnji kursevi</h2>
            <Link href="/courses" className="btn secondary" style={{ fontSize: '0.8rem' }}>
              Svi kursevi →
            </Link>
          </div>
          {loading ? (
            <TableSkeleton headers={['Naslov', 'Nivo', 'Status']} rows={4} />
          ) : courses.length === 0 ? (
            <EmptyState
              icon={<EmptyIconBook />}
              title="Još uvek nema kurseva"
              description="Napravi prvi kurs da bi studenti imali šta da uče."
              cta={
                <Link href="/courses" className="btn">
                  + Napravi prvi kurs
                </Link>
              }
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: '60%' }}>Naslov</th>
                  <th>Nivo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {courses.slice(0, 5).map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/courses/${c.id}`} className="cell-title">
                        {c.title}
                      </Link>
                      {c.slug && <span className="cell-sub">/{c.slug}</span>}
                    </td>
                    <td style={{ color: 'var(--ink-soft)' }}>{c.level ?? '—'}</td>
                    <td>
                      <span className={`status-badge ${c.status}`}>{statusLabel(c.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="col" style={{ gap: '1.25rem' }}>
          <QuickLinks />
          <BrandTip />
        </div>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .dash-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string | number | null
  hint?: string | null
  tone?: 'primary' | 'accent'
}) {
  const loading = value === null
  const isPlaceholder = value === '—'
  const dotClass = tone === 'accent' ? 'accent' : tone === 'primary' ? '' : 'muted'
  return (
    <div className="stat-card">
      <div className="stat-card-label">
        <span className={`stat-card-dot ${dotClass}`} />
        {label}
      </div>
      {loading ? (
        <Skeleton width={56} height={28} radius={6} style={{ marginTop: 4 }} />
      ) : (
        <div className={`stat-card-value${isPlaceholder ? ' placeholder' : ''}`}>{value}</div>
      )}
      {loading ? (
        <Skeleton width={140} height={10} style={{ marginTop: 4 }} />
      ) : (
        hint && <div className="stat-card-hint">{hint}</div>
      )}
    </div>
  )
}

function QuickLinks() {
  const links = [
    {
      href: '/courses',
      icon: <IconPlus />,
      title: 'Novi kurs',
      desc: 'Kreni od nule sa novim kursom',
      tone: 'primary' as const,
    },
    {
      href: '/exercises',
      icon: <IconStack />,
      title: 'Dodaj template',
      desc: 'Biblioteka vežbi za sve kurseve',
      tone: 'accent' as const,
    },
    {
      href: '/users',
      icon: <IconPerson />,
      title: 'Pregled korisnika',
      desc: 'Upravljaj ulogama i pristupom',
      tone: 'muted' as const,
    },
  ]
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1.1rem 1.35rem', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Brzi linkovi</h2>
      </div>
      <div style={{ padding: '0.5rem' }}>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`quick-link tone-${l.tone}`}
          >
            <span className="quick-link-icon">{l.icon}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 600, color: 'var(--ink)', fontSize: '0.9rem' }}>
                {l.title}
              </span>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: 1 }}>
                {l.desc}
              </span>
            </span>
            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>→</span>
          </Link>
        ))}
      </div>
      <style>{`
        .quick-link {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.65rem 0.85rem;
          border-radius: 10px;
          text-decoration: none;
          transition: background-color 0.15s ease;
        }
        .quick-link:hover { background: var(--surface-2); }
        .quick-link-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .quick-link.tone-primary .quick-link-icon { background: var(--primary-soft); color: var(--primary-dark); }
        .quick-link.tone-accent .quick-link-icon { background: var(--accent-soft); color: var(--accent-dark); }
        .quick-link.tone-muted .quick-link-icon { background: var(--surface-2); color: var(--ink-soft); }
      `}</style>
    </div>
  )
}

function BrandTip() {
  return (
    <div
      style={{
        position: 'relative',
        padding: '1.35rem 1.35rem 1.5rem',
        borderRadius: 'var(--r-lg)',
        background:
          'linear-gradient(135deg, var(--primary-soft) 0%, var(--accent-soft) 100%)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -20,
          top: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(134,196,64,0.25), transparent 70%)',
        }}
      />
      <p
        style={{
          margin: 0,
          fontSize: '0.72rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--primary-dark)',
        }}
      >
        Savet
      </p>
      <h3
        style={{
          margin: '0.35rem 0 0.5rem',
          fontSize: '1rem',
          color: 'var(--ink)',
        }}
      >
        Pravi template-e jednom
      </h3>
      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
        Vežbe iz biblioteke ubacuješ u lekcije u par klikova. Svaka kopija u
        lekciji se nezavisno menja — original ostaje netaknut.
      </p>
      <Link
        href="/exercises"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginTop: '0.7rem',
          color: 'var(--primary-dark)',
          fontWeight: 600,
          fontSize: '0.85rem',
        }}
      >
        Otvori biblioteku →
      </Link>
    </div>
  )
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
function IconStack() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
      <path d="m3 18 9 5 9-5" />
    </svg>
  )
}
function IconPerson() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1-4 4-6 7-6s6 2 7 6" />
    </svg>
  )
}
