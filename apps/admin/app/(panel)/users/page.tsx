'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { EmptyState, EmptyIconUsers } from '@/components/EmptyState'
import { toast } from '@/components/toast'
import { Skeleton } from '@/components/Skeleton'

type Profile = {
  id: string
  fullName: string | null
  role: 'student' | 'teacher' | 'admin'
  targetLevel: string | null
}

type Role = 'student' | 'teacher' | 'admin'

const ROLE_META: Record<Role, { label: string; bg: string; fg: string; dot: string }> = {
  student: {
    label: 'Student',
    bg: 'var(--primary-soft)',
    fg: 'var(--primary-dark)',
    dot: 'var(--primary)',
  },
  teacher: {
    label: 'Nastavnik',
    bg: 'var(--accent-soft)',
    fg: 'var(--accent-dark)',
    dot: 'var(--accent)',
  },
  admin: {
    label: 'Admin',
    bg: 'var(--warning-soft)',
    fg: 'var(--warning)',
    dot: 'var(--warning)',
  },
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  async function load() {
    const { data } = await api.admin.users.get()
    if (Array.isArray(data)) setUsers(data as Profile[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function setRole(id: string, role: Role) {
    setSaving(id)
    try {
      await api.admin.users({ id }).role.patch({ role })
      await load()
      const u = users.find((x) => x.id === id)
      toast.success(`Uloga promenjena na "${ROLE_META[role].label}"`, {
        description: u?.fullName ?? undefined,
      })
    } catch (e) {
      toast.error('Neuspela promena uloge', {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setSaving(null)
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Korisnici</h1>
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '55%' }}>Korisnik</th>
                  <th>ID</th>
                  <th>Nivo</th>
                  <th>Uloga</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }, (_, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <Skeleton width={36} height={36} radius={999} />
                        <div>
                          <Skeleton width={130} height={12} />
                          <br />
                          <Skeleton width={90} height={10} style={{ marginTop: 6 }} />
                        </div>
                      </div>
                    </td>
                    <td><Skeleton width={70} height={10} /></td>
                    <td><Skeleton width={36} height={20} radius={999} /></td>
                    <td><Skeleton width={120} height={28} radius={999} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<EmptyIconUsers />}
            title="Nema korisnika"
            description="Korisnici se kreiraju kad neko otvori nalog kroz registraciju."
          />
        ) : (
          <div className="table-wrap"><table>
            <thead>
              <tr>
                <th>Korisnik</th>
                <th>ID</th>
                <th>Nivo</th>
                <th>Uloga</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <Avatar name={u.fullName ?? u.id} />
                      <div style={{ minWidth: 0 }}>
                        {u.fullName ? (
                          <span className="cell-title">{u.fullName}</span>
                        ) : (
                          <span style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>
                            Bez imena
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td
                    style={{
                      color: 'var(--muted)',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      fontSize: '0.75rem',
                    }}
                  >
                    {u.id.slice(0, 8)}…
                  </td>
                  <td>
                    {u.targetLevel ? (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.15rem 0.55rem',
                          background: 'var(--surface-2)',
                          color: 'var(--ink-soft)',
                          borderRadius: 999,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {u.targetLevel}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <RolePicker
                      value={u.role}
                      disabled={saving === u.id}
                      onChange={(role) => setRole(u.id, role)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  )
}

/* ──────── Avatar ──────── */

function Avatar({ name }: { name: string }) {
  const initials =
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?'

  return (
    <div
      aria-hidden
      style={{
        width: 36,
        height: 36,
        borderRadius: 999,
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
        color: 'white',
        fontWeight: 700,
        fontSize: '0.78rem',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        boxShadow: 'var(--shadow-soft)',
        fontFamily: 'Sora, sans-serif',
      }}
    >
      {initials}
    </div>
  )
}

/* ──────── Role pill dropdown ──────── */

function RolePicker({
  value,
  disabled,
  onChange,
}: {
  value: Role
  disabled: boolean
  onChange: (r: Role) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const meta = ROLE_META[value]

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          background: meta.bg,
          color: meta.fg,
          border: 0,
          padding: '0.3rem 0.7rem 0.3rem 0.6rem',
          borderRadius: 999,
          fontSize: '0.78rem',
          fontWeight: 700,
          cursor: disabled ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          opacity: disabled ? 0.5 : 1,
          transition: 'background-color 0.15s, color 0.15s',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: meta.dot,
            flexShrink: 0,
          }}
        />
        {meta.label}
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            opacity: 0.7,
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.18s ease',
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            minWidth: 160,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-lift)',
            padding: '0.3rem',
            zIndex: 30,
            animation: 'rolePickerIn 0.16s ease-out',
          }}
        >
          {(['student', 'teacher', 'admin'] as Role[]).map((r) => {
            const m = ROLE_META[r]
            const active = r === value
            return (
              <button
                key={r}
                onClick={() => {
                  setOpen(false)
                  if (r !== value) onChange(r)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  width: '100%',
                  background: active ? m.bg : 'transparent',
                  border: 0,
                  padding: '0.5rem 0.7rem',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: active ? 600 : 500,
                  color: active ? m.fg : 'var(--ink)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'background-color 0.12s',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'var(--surface-2)'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: m.dot,
                    flexShrink: 0,
                  }}
                />
                {m.label}
                {active && (
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginLeft: 'auto', opacity: 0.8 }}
                  >
                    <path d="m6 12 4 4 8-8" />
                  </svg>
                )}
              </button>
            )
          })}
          <style>{`
            @keyframes rolePickerIn {
              from { opacity: 0; transform: translateY(-4px) scale(0.97); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
