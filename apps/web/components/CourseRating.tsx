'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

type Agg = { avg: string | null; count: number }
type Mine = { rating: number; reviewText: string | null } | null

export function CourseRating({ courseId }: { courseId: string }) {
  const { session } = useAuth()
  const [agg, setAgg] = useState<Agg | null>(null)
  const [mine, setMine] = useState<Mine>(null)
  const [editing, setEditing] = useState(false)
  const [draftRating, setDraftRating] = useState(5)
  const [draftReview, setDraftReview] = useState('')
  const [hover, setHover] = useState(0)
  const [loading, setLoading] = useState(false)

  async function load() {
    const a = await api.ratings['by-course']({ courseId }).get()
    if (a.data) setAgg(a.data as Agg)
    if (session) {
      const m = await api.ratings.me['by-course']({ courseId }).get()
      if (m.data) {
        const md = m.data as Mine
        setMine(md)
        if (md) {
          setDraftRating(md.rating)
          setDraftReview(md.reviewText ?? '')
        }
      }
    }
  }

  useEffect(() => { load() }, [courseId, session])

  async function save() {
    setLoading(true)
    await api.ratings.post({
      courseId,
      rating: draftRating,
      reviewText: draftReview.trim() || undefined,
    })
    setLoading(false)
    setEditing(false)
    await load()
  }

  const avg = agg?.avg ? Number(agg.avg) : 0
  const count = agg?.count ?? 0

  return (
    <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Ocena kursa</p>
          <div className="mt-2 flex items-center gap-4">
            <span className="font-display text-5xl font-extrabold text-ink">
              {avg ? avg.toFixed(1) : '—'}
            </span>
            <div>
              <Stars value={avg} size="lg" />
              <p className="mt-1 text-sm text-muted">{count} {count === 1 ? 'ocena' : 'ocena'}</p>
            </div>
          </div>
        </div>

        {session && !editing && (
          <Button variant="outline" size="md" onClick={() => setEditing(true)}>
            {mine ? '✎ Izmeni ocenu' : '⭐ Oceni kurs'}
          </Button>
        )}
      </div>

      {editing && (
        <div className="mt-6 border-t border-ink/5 pt-6">
          <p className="font-display text-base font-bold text-ink">Tvoja ocena</p>
          <div className="mt-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = (hover || draftRating) >= n
              return (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setDraftRating(n)}
                  className="transition-transform hover:scale-110"
                  aria-label={`${n} zvezdica`}
                >
                  <svg viewBox="0 0 24 24" className={`h-9 w-9 ${active ? 'fill-primary' : 'fill-ink/10'}`}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
                  </svg>
                </button>
              )
            })}
            <span className="ml-3 text-sm font-semibold text-ink">
              {draftRating} / 5
            </span>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-ink/80">Recenzija (opciono)</span>
            <textarea
              value={draftReview}
              onChange={(e) => setDraftReview(e.target.value)}
              rows={3}
              placeholder="Šta misliš o kursu? Šta je bilo dobro, šta ne?"
              className="mt-1.5 w-full rounded-xl border border-ink/10 bg-white p-3 text-sm text-ink outline-none focus:border-primary"
            />
          </label>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Otkaži</Button>
            <Button variant="primary" size="sm" onClick={save} disabled={loading}>
              {loading ? 'Snimam…' : 'Sačuvaj ocenu'}
            </Button>
          </div>
        </div>
      )}

      {mine && !editing && mine.reviewText && (
        <div className="mt-6 border-t border-ink/5 pt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Tvoja recenzija</p>
          <div className="mt-2 flex items-center gap-2">
            <Stars value={mine.rating} size="sm" />
            <span className="text-sm font-semibold text-ink">{mine.rating} / 5</span>
          </div>
          <p className="mt-3 text-sm text-ink/85">{mine.reviewText}</p>
        </div>
      )}
    </div>
  )
}

function Stars({ value, size }: { value: number; size: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const isFull = i <= Math.floor(value)
        const isHalf = !isFull && i - 0.5 <= value
        return (
          <svg key={i} viewBox="0 0 24 24" className={`${cls} ${isFull || isHalf ? 'fill-primary' : 'fill-ink/15'}`}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
        )
      })}
    </div>
  )
}
