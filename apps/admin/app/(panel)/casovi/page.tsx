'use client'

import { useCallback, useEffect, useState } from 'react'
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

      {/* Dodaj termin */}
      <section style={{ ...cardBase, padding: '1.15rem', marginBottom: '1.5rem' }}>
        <strong style={{ display: 'block', marginBottom: '0.75rem' }}>Dodaj slobodan termin</strong>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label className="label" style={{ margin: 0 }}>
            <span>Datum (dd/mm/gggg)</span>
            <DateField value={date} onChange={setDate} />
          </label>
          <label className="label" style={{ margin: 0 }}>
            <span>Početak</span>
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <label className="label" style={{ margin: 0 }}>
            <span>Trajanje</span>
            <select className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
            </select>
          </label>
          <button className="btn" onClick={addSlot} disabled={adding}>
            {adding ? 'Dodajem…' : '+ Dodaj termin'}
          </button>
        </div>
        {!zoomReady && (
          <p style={{ margin: '0.6rem 0 0', fontSize: '0.78rem', color: 'var(--danger)' }}>
            ⚠️ Zoom nije podešen — termini se mogu dodati, ali rezervacija neće raditi dok se ne unese ZOOM_* env.
          </p>
        )}
      </section>

      {/* Slobodni termini */}
      <section style={{ marginBottom: '2rem' }}>
        <strong style={{ display: 'block', marginBottom: '0.75rem' }}>Termini</strong>
        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Učitavanje…</p>
        ) : groups.size === 0 ? (
          <div style={{ ...cardBase, padding: '1.5rem', textAlign: 'center', color: 'var(--ink-soft)' }}>
            Još nema termina. Dodaj prvi iznad.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[...groups.entries()].map(([k, daySlots]) => (
              <div key={k} style={{ ...cardBase, padding: '1rem 1.15rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.6rem', textTransform: 'capitalize' }}>
                  {dayLabel(daySlots[0].startAt)}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {daySlots.map((s) => {
                    const booked = s.status === 'booked'
                    return (
                      <span
                        key={s.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.4rem 0.65rem',
                          borderRadius: 999,
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          border: '1px solid',
                          borderColor: booked ? 'var(--border)' : 'var(--primary)',
                          background: booked ? 'var(--surface-2)' : 'var(--primary-soft)',
                          color: booked ? 'var(--muted)' : 'var(--primary-dark)',
                        }}
                      >
                        {fmtTime(s.startAt)}–{fmtTime(s.endAt)}
                        {booked ? (
                          <span style={{ fontSize: '0.68rem' }}>· rezervisano</span>
                        ) : (
                          <button
                            onClick={() => deleteSlot(s.id)}
                            title="Obriši termin"
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 700, lineHeight: 1, padding: 0 }}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
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

/**
 * Custom datum polje — uvek dd/mm/gggg, radi nezavisno od lokacije browsera.
 * Interno drži tekst dok se kuca; `value`/`onChange` su u ISO formatu (yyyy-mm-dd).
 */
function DateField({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const isoToDMY = (iso: string) => {
    const [y, m, d] = iso.split('-')
    return y && m && d ? `${d}/${m}/${y}` : ''
  }
  const [text, setText] = useState(isoToDMY(value))
  useEffect(() => {
    setText(isoToDMY(value))
  }, [value])

  function handle(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    let out = digits
    if (digits.length > 4) out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
    else if (digits.length > 2) out = `${digits.slice(0, 2)}/${digits.slice(2)}`
    setText(out)
    if (digits.length === 8) {
      const dd = digits.slice(0, 2)
      const mm = digits.slice(2, 4)
      const yyyy = digits.slice(4)
      onChange(`${yyyy}-${mm}-${dd}`)
    } else {
      onChange('')
    }
  }

  return (
    <input
      className="input"
      inputMode="numeric"
      placeholder="dd/mm/gggg"
      value={text}
      onChange={(e) => handle(e.target.value)}
      style={{ width: 130 }}
    />
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
