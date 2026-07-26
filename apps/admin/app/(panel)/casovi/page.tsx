'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { toast } from '@/components/toast'
import { confirmDialog } from '@/components/dialog'

type Slot = { id: string; startAt: string; endAt: string; status: string }
type Booking = {
  id: string
  status: string
  meetLink: string | null
  startAt: string | null
  endAt: string | null
  studentName: string | null
}

const cardBase: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  boxShadow: 'var(--shadow-soft)',
}

const DAYS = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota']
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec']

function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
function dayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
function dayLabel(iso: string) {
  const d = new Date(iso)
  return `${DAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`
}

export default function CasoviPage() {
  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [zoomReady, setZoomReady] = useState(false)
  const [google, setGoogle] = useState<{ connected: boolean; configured: boolean }>({ connected: false, configured: false })

  // Forma za nov termin
  const [date, setDate] = useState('')
  const [time, setTime] = useState('18:00')
  const [duration, setDuration] = useState(45)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    const [av, bk, gs] = await Promise.all([
      api.admin.availability.get(),
      api.admin.bookings.get(),
      api.admin.google.status.get(),
    ])
    const avd = av.data as { slots: Slot[]; zoomReady: boolean } | null
    if (avd) {
      setSlots(avd.slots ?? [])
      setZoomReady(!!avd.zoomReady)
    }
    if (Array.isArray(bk.data)) setBookings(bk.data as Booking[])
    if (gs.data) setGoogle(gs.data as { connected: boolean; configured: boolean })
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function connectGoogle() {
    const { data } = await api.admin.google.connect.get()
    const url = (data as { url?: string } | null)?.url
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
    else toast.error('Google OAuth nije konfigurisan (GOOGLE_* env).')
  }

  async function disconnectGoogle() {
    const ok = await confirmDialog({ title: 'Otkači Google kalendar?', message: 'Termini se više neće upisivati u kalendar (Zoom link i dalje radi).', okLabel: 'Otkači', tone: 'danger' })
    if (!ok) return
    await api.admin.google.delete()
    setGoogle((g) => ({ ...g, connected: false }))
    toast.success('Google otkačen')
  }

  async function addSlot() {
    if (!date) {
      toast.error('Izaberi datum')
      return
    }
    const start = new Date(`${date}T${time}:00`)
    if (isNaN(start.getTime())) {
      toast.error('Neispravan datum/vreme')
      return
    }
    if (start.getTime() < Date.now()) {
      toast.error('Termin ne može biti u prošlosti')
      return
    }
    const end = new Date(start.getTime() + duration * 60000)
    setAdding(true)
    try {
      const { error } = await api.admin.availability.post({ startAt: start.toISOString(), endAt: end.toISOString() })
      if (error) throw new Error()
      toast.success('Termin dodat')
      setDate('')
      await load()
    } catch {
      toast.error('Greška pri dodavanju')
    } finally {
      setAdding(false)
    }
  }

  async function deleteSlot(id: string) {
    const { error } = await api.admin.availability({ id }).delete()
    if (error) {
      toast.error('Rezervisan termin — ne može da se obriše')
      return
    }
    setSlots((s) => s.filter((x) => x.id !== id))
  }

  // Grupiši termine po danu
  const groups = new Map<string, Slot[]>()
  for (const s of [...slots].sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))) {
    const k = dayKey(s.startAt)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(s)
  }
  const upcomingBookings = bookings.filter((b) => b.status === 'confirmed' && b.startAt && +new Date(b.startAt) > Date.now() - 3600_000)

  return (
    <div style={{ maxWidth: 820 }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontFamily: 'Sora, sans-serif' }}>Časovi</h1>
        <p style={{ margin: '0.35rem 0 0', color: 'var(--ink-soft)' }}>
          Otvori slobodne termine — polaznici rezervišu, a poziv (Zoom) i kalendarski upis se prave automatski.
        </p>
      </header>

      {/* Integracije status */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <StatusChip
          ok={google.connected}
          label={google.connected ? 'Google kalendar povezan' : google.configured ? 'Google nije povezan' : 'Google nije podešen'}
          action={
            !google.configured ? null : google.connected ? (
              <button className="btn ghost" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} onClick={disconnectGoogle}>Otkači</button>
            ) : (
              <button className="btn secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }} onClick={connectGoogle}>Poveži</button>
            )
          }
        />
        <StatusChip ok={zoomReady} label={zoomReady ? 'Zoom spreman' : 'Zoom nije podešen'} />
      </div>

      {/* Kako radi (freebusy) */}
      <section style={{ ...cardBase, padding: '1.15rem', marginBottom: '1.5rem' }}>
        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Slobodni termini se računaju automatski</strong>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
          Polaznici vide slobodne termine na osnovu <strong>tvog Google kalendara</strong> — radno vreme
          <strong> 07:00–19:00</strong>, časovi <strong>45 min</strong>. Sve što je već zauzeto u kalendaru se
          automatski izuzima. Da blokiraš neko vreme, samo ga zauzmi u Google kalendaru (npr. „Zauzeto"). Ne
          moraš ništa ručno da unosiš ovde.
        </p>
        {!zoomReady && (
          <p style={{ margin: '0.6rem 0 0', fontSize: '0.78rem', color: 'var(--danger)' }}>
            ⚠️ Zoom nije podešen — rezervacija neće raditi dok se ne unese ZOOM_* env.
          </p>
        )}
        {!google.connected && google.configured && (
          <p style={{ margin: '0.6rem 0 0', fontSize: '0.78rem', color: 'var(--danger)' }}>
            ⚠️ Google kalendar nije povezan — poveži ga gore da bi se termini prikazivali.
          </p>
        )}
      </section>

      {/* Rezervacije */}
      <section>
        <strong style={{ display: 'block', marginBottom: '0.75rem' }}>Rezervacije ({upcomingBookings.length})</strong>
        {upcomingBookings.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Nema nadolazećih rezervacija.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {upcomingBookings.map((b) => (
              <div key={b.id} style={{ ...cardBase, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{b.studentName || 'Polaznik'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', textTransform: 'capitalize' }}>
                    {b.startAt ? `${dayLabel(b.startAt)} · ${fmtTime(b.startAt)}` : ''}
                  </div>
                </div>
                {b.meetLink && (
                  <a className="btn secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }} href={b.meetLink} target="_blank" rel="noreferrer">
                    Zoom link
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

const MONTHS_FULL = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar']
const WEEK = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned']

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmtDMY(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/**
 * Datum picker sa kalendarom (popup) — prikaz dd/mm/gggg. Klik na dan bira,
 * prošli dani su onemogućeni. `value`/`onChange` u ISO formatu (yyyy-mm-dd).
 */
function DatePicker({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = value ? new Date(`${value}T00:00:00`) : null
  const [view, setView] = useState<Date>(() => selected ?? new Date())

  useEffect(() => {
    if (!open) return
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const y = view.getFullYear()
  const m = view.getMonth()
  const startOffset = (new Date(y, m, 1).getDay() + 6) % 7 // ponedeljak prvi
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d))

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="input"
        onClick={() => setOpen((o) => !o)}
        style={{ width: 160, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}
      >
        <span style={{ color: selected ? 'var(--ink)' : 'var(--muted)' }}>{selected ? fmtDMY(selected) : 'dd/mm/gggg'}</span>
        <span aria-hidden>📅</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            zIndex: 60,
            top: 'calc(100% + 6px)',
            left: 0,
            width: 268,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-lift)',
            padding: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <button type="button" className="btn ghost" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setView(new Date(y, m - 1, 1))}>‹</button>
            <strong style={{ fontSize: '0.85rem' }}>{MONTHS_FULL[m]} {y}</strong>
            <button type="button" className="btn ghost" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setView(new Date(y, m + 1, 1))}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, fontSize: '0.68rem', color: 'var(--muted)', textAlign: 'center', marginBottom: 4 }}>
            {WEEK.map((d) => <div key={d}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {cells.map((c, i) => {
              if (!c) return <div key={i} />
              const past = c < today
              const isSel = !!selected && c.getTime() === selected.getTime()
              return (
                <button
                  key={i}
                  type="button"
                  disabled={past}
                  onClick={() => { onChange(toISO(c)); setOpen(false) }}
                  style={{
                    padding: '0.4rem 0',
                    borderRadius: 8,
                    border: 'none',
                    cursor: past ? 'not-allowed' : 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: isSel ? 700 : 400,
                    background: isSel ? 'var(--primary)' : 'transparent',
                    color: isSel ? 'var(--ink)' : 'var(--ink)',
                    opacity: past ? 0.35 : 1,
                  }}
                >
                  {c.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusChip({ ok, label, action }: { ok: boolean; label: string; action?: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.45rem 0.75rem',
        borderRadius: 10,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        fontSize: '0.83rem',
        fontWeight: 600,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: ok ? 'var(--success)' : 'var(--muted)' }} />
      {label}
      {action}
    </span>
  )
}
