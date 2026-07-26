'use client'

import { useCallback, useEffect, useState } from 'react'
import { Container } from '@/components/ui/Container'
import { api } from '@/lib/api'

type Slot = { startAt: string; endAt: string }
type MyBooking = { id: string; status: string; meetLink: string | null; startAt: string | null; endAt: string | null }

const DAYS = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota']
const DAYS_SHORT = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub']
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

export default function ZakazivanjePage() {
  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState<Slot[]>([])
  const [mine, setMine] = useState<MyBooking[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selected, setSelected] = useState<Slot | null>(null)
  const [booking, setBooking] = useState(false)
  const [canceling, setCanceling] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [available, setAvailable] = useState(true)

  const load = useCallback(async () => {
    const [av, bk] = await Promise.all([api.bookings.slots.get(), api.bookings.mine.get()])
    const avd = av.data as { slots: Slot[]; googleConnected: boolean; zoomReady: boolean } | null
    setSlots(avd?.slots ?? [])
    setAvailable(!!avd?.googleConnected && !!avd?.zoomReady)
    if (Array.isArray(bk.data)) setMine(bk.data as MyBooking[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Dani koji imaju bar jedan slot (redosled kakav stiže — sortiran na serveru)
  const dayList: { key: string; iso: string }[] = []
  const seen = new Set<string>()
  for (const s of slots) {
    const k = dayKey(s.startAt)
    if (!seen.has(k)) {
      seen.add(k)
      dayList.push({ key: k, iso: s.startAt })
    }
  }

  // Default izabrani dan = prvi dostupan
  useEffect(() => {
    if (dayList.length && (!selectedDay || !seen.has(selectedDay))) {
      setSelectedDay(dayList[0].key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots])

  const daySlots = slots.filter((s) => dayKey(s.startAt) === selectedDay)

  async function book() {
    if (!selected) return
    setBooking(true)
    setError(null)
    try {
      const { error: apiErr } = await api.bookings.post({ startAt: selected.startAt, endAt: selected.endAt })
      if (apiErr) {
        const val = (apiErr as { value?: { error?: string } }).value
        throw new Error(val?.error ?? 'Rezervacija nije uspela')
      }
      setSelected(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setBooking(false)
    }
  }

  async function cancel(id: string) {
    if (!window.confirm('Otkazati ovaj termin? Zoom poziv i upis u kalendar se brišu.')) return
    setCanceling(id)
    try {
      await api.bookings({ id }).delete()
      await load()
    } finally {
      setCanceling(null)
    }
  }

  const upcomingMine = mine
    .filter((b) => b.status === 'confirmed' && b.startAt && +new Date(b.startAt) > Date.now() - 3600_000)
    .sort((a, b) => +new Date(a.startAt!) - +new Date(b.startAt!))

  return (
    <div className="bg-surface">
      <Container className="py-8 sm:py-12">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Živi časovi</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-ink sm:text-4xl">Zakaži čas</h1>
          <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">
            Izaberi dan pa slobodan termin — dobićeš Zoom link za poziv, a termin ti stiže i u kalendar.
          </p>
        </header>

        {/* Moji termini */}
        {upcomingMine.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 font-display text-lg font-bold text-ink">Moji termini</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {upcomingMine.map((b) => (
                <div key={b.id} className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-light/15 via-white to-secondary-light/15 p-4 shadow-soft">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-primary-dark">Zakazano</div>
                      <div className="mt-1 font-display text-lg font-bold capitalize text-ink">
                        {b.startAt ? dayLabel(b.startAt) : ''}
                      </div>
                      <div className="text-sm text-ink/70">
                        {b.startAt && b.endAt ? `${fmtTime(b.startAt)}–${fmtTime(b.endAt)}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => cancel(b.id)}
                      disabled={canceling === b.id}
                      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {canceling === b.id ? 'Otkazujem…' : 'Otkaži'}
                    </button>
                  </div>
                  {b.meetLink && (
                    <a
                      href={b.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-secondary-dark"
                    >
                      ▶ Pridruži se (Zoom)
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Izbor dana + slotovi */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-ink">Slobodni termini</h2>

          {loading ? (
            <p className="text-sm text-muted">Učitavanje…</p>
          ) : dayList.length === 0 ? (
            <div className="rounded-2xl border border-ink/10 bg-white p-8 text-center shadow-soft">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface text-2xl">📅</div>
              <p className="mt-3 font-semibold text-ink">
                {available ? 'Trenutno nema slobodnih termina' : 'Zakazivanje trenutno nije dostupno'}
              </p>
              <p className="mt-1 text-sm text-muted">
                {available ? 'Proveri kasnije — termini se otvaraju redovno.' : 'Uskoro će biti moguće — pokušaj kasnije.'}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:p-5">
              {/* Traka dana */}
              <div className="-mx-1 flex gap-2 overflow-x-auto pb-2">
                {dayList.map(({ key, iso }) => {
                  const d = new Date(iso)
                  const isSel = selectedDay === key
                  return (
                    <button
                      key={key}
                      onClick={() => { setSelectedDay(key); setSelected(null) }}
                      className={`flex min-w-[68px] shrink-0 flex-col items-center rounded-xl border px-3 py-2 transition-all ${
                        isSel
                          ? 'border-primary bg-primary text-ink shadow-soft'
                          : 'border-ink/10 bg-white text-ink/70 hover:border-primary/50'
                      }`}
                    >
                      <span className="text-[0.7rem] font-semibold uppercase">{DAYS_SHORT[d.getDay()]}</span>
                      <span className="font-display text-xl font-extrabold leading-none">{d.getDate()}</span>
                      <span className="text-[0.68rem] text-current/70">{MONTHS[d.getMonth()]}</span>
                    </button>
                  )
                })}
              </div>

              {/* Slotovi za izabrani dan */}
              <div className="mt-4 border-t border-ink/5 pt-4">
                <div className="mb-2 text-sm font-semibold capitalize text-primary-dark">
                  {daySlots[0] ? dayLabel(daySlots[0].startAt) : ''}
                </div>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((s) => {
                    const isSel = selected?.startAt === s.startAt
                    return (
                      <button
                        key={s.startAt}
                        onClick={() => setSelected(isSel ? null : s)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                          isSel
                            ? 'border-primary bg-primary text-ink shadow-soft'
                            : 'border-ink/15 bg-white text-ink/80 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5'
                        }`}
                      >
                        {fmtTime(s.startAt)}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </Container>

      {/* Sticky confirm bar */}
      {selected && (
        <div className="sticky bottom-0 z-40 border-t border-ink/10 bg-white/95 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
          <Container className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <div className="text-sm font-semibold capitalize text-ink">
                {dayLabel(selected.startAt)} · {fmtTime(selected.startAt)}–{fmtTime(selected.endAt)}
              </div>
              {error && <div className="text-xs text-red-600">{error}</div>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setSelected(null); setError(null) }} className="rounded-full px-4 py-2 text-sm font-semibold text-ink/70 hover:text-ink">
                Otkaži
              </button>
              <button
                onClick={book}
                disabled={booking}
                className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-ink shadow-soft transition-colors hover:bg-primary-dark hover:text-white disabled:opacity-60"
              >
                {booking ? 'Rezervišem…' : 'Potvrdi rezervaciju'}
              </button>
            </div>
          </Container>
        </div>
      )}
    </div>
  )
}
