'use client'

import { useCallback, useEffect, useState } from 'react'

type Item = { id: string; text: string }
type Data = {
  question?: string
  left: Item[]
  right: Item[]
}

type Result = {
  details: unknown
}

/**
 * Pair colors — svaki par dobija unique soft brand boju da student vidi
 * koje stavke su povezane. Cikliramo kroz paletu.
 */
const PAIR_COLORS = [
  { bg: 'bg-primary/15', border: 'border-primary/60', text: 'text-primary-dark', badge: 'bg-primary text-ink' },
  { bg: 'bg-secondary/15', border: 'border-secondary/60', text: 'text-secondary-dark', badge: 'bg-secondary text-white' },
  { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-800', badge: 'bg-amber-400 text-ink' },
  { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800', badge: 'bg-purple-400 text-white' },
  { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-800', badge: 'bg-pink-400 text-white' },
  { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-800', badge: 'bg-teal-400 text-white' },
  { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800', badge: 'bg-orange-400 text-white' },
  { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-800', badge: 'bg-rose-400 text-white' },
]

export function MatchingPlayer({
  payload,
  onAnswers,
  locked,
  result,
}: {
  payload: Data
  onAnswers: (a: unknown) => void
  locked: boolean
  result: Result | null
}) {
  // pairs: leftId -> rightId (ono što je student izabrao)
  const [pairs, setPairs] = useState<Record<string, string>>({})
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null)

  useEffect(() => {
    onAnswers({ pairs })
  }, [pairs, onAnswers])

  const perPair =
    (result?.details as { perPair?: Array<{ leftId: string; correct: boolean; expected: string }> })
      ?.perPair ?? []
  const gradeMap = new Map(perPair.map((p) => [p.leftId, p]))

  // Inverzna mapa rightId -> leftId i indeks para
  const rightToLeft = new Map<string, string>()
  Object.entries(pairs).forEach(([l, r]) => rightToLeft.set(r, l))

  // Indeks para za boju (po redosledu levog iz payload.left)
  const pairIdxByLeftId = new Map<string, number>()
  let idx = 0
  for (const l of payload.left) {
    if (pairs[l.id]) {
      pairIdxByLeftId.set(l.id, idx)
      idx++
    }
  }

  const handleLeftClick = useCallback((leftId: string) => {
    if (locked) return
    // Ako je već uparen → razveži (vraća se u "selectable")
    if (pairs[leftId]) {
      const next = { ...pairs }
      delete next[leftId]
      setPairs(next)
      setSelectedLeftId(leftId)
      return
    }
    // Toggle selekcije
    setSelectedLeftId((cur) => (cur === leftId ? null : leftId))
  }, [pairs, locked])

  const handleRightClick = useCallback((rightId: string) => {
    if (locked) return
    const linkedLeft = rightToLeft.get(rightId)
    // Ako je već uparen → razveži
    if (linkedLeft) {
      const next = { ...pairs }
      delete next[linkedLeft]
      setPairs(next)
      return
    }
    // Ako postoji selektovan levi → upari
    if (selectedLeftId) {
      setPairs({ ...pairs, [selectedLeftId]: rightId })
      setSelectedLeftId(null)
    }
  }, [pairs, selectedLeftId, locked, rightToLeft])

  const allPaired = Object.keys(pairs).length === payload.left.length

  return (
    <div>
      {payload.question && (
        <p className="font-display text-lg font-bold text-ink">{payload.question}</p>
      )}

      {/* Status traka */}
      {!locked && (
        <div className="mt-3 text-sm text-muted">
          {selectedLeftId ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary-dark">
              ✓ Izabrana stavka levo — klikni odgovarajuću desno
            </span>
          ) : allPaired ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary-dark">
              Sve upareno — predaj odgovor
            </span>
          ) : (
            <span>Klikni stavku levo, pa odgovarajuću desno. Klik na uparenu razvezuje.</span>
          )}
        </div>
      )}

      <div className="mt-5 grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
        {/* LEFT column */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">
            Pojam
          </div>
          {payload.left.map((l) => {
            const pairedRightId = pairs[l.id]
            const isPaired = !!pairedRightId
            const isSelected = selectedLeftId === l.id
            const pairIdx = pairIdxByLeftId.get(l.id) ?? 0
            const color = PAIR_COLORS[pairIdx % PAIR_COLORS.length]
            const g = gradeMap.get(l.id)
            const isCorrect = locked && g?.correct
            const isWrong = locked && g && !g.correct
            const expectedItem = locked && isWrong ? payload.right.find((r) => r.id === g.expected) : null

            // Klase u zavisnosti od stanja
            let classes = 'border-ink/10 bg-white hover:border-primary/40 hover:bg-surface'
            if (locked) {
              classes = isCorrect
                ? 'border-primary bg-primary/5'
                : 'border-red-300 bg-red-50'
            } else if (isPaired) {
              classes = `${color.border} ${color.bg}`
            } else if (isSelected) {
              classes = 'border-primary bg-primary/10 ring-4 ring-primary/20'
            }

            return (
              <button
                key={l.id}
                type="button"
                onClick={() => handleLeftClick(l.id)}
                disabled={locked}
                className={`group relative flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3.5 text-left font-medium text-ink transition-all ${classes} ${
                  locked ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'
                }`}
              >
                <span className="flex-1">{l.text}</span>

                {isPaired && !locked && (
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${color.badge}`}
                    title="Klikni da razvežeš"
                  >
                    {pairIdx + 1}
                  </span>
                )}

                {locked && (
                  <span className={`shrink-0 text-lg ${isCorrect ? 'text-primary-dark' : 'text-red-600'}`}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                )}

                {/* Tačan odgovor ispod, kad je pogrešno */}
                {isWrong && expectedItem && (
                  <div className="absolute left-4 right-4 -bottom-1 translate-y-full text-xs text-muted">
                    tačno: <strong className="text-primary-dark">{expectedItem.text}</strong>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* RIGHT column */}
        <div className="mt-6 flex flex-col gap-2.5 sm:mt-0">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">
            Odgovor
          </div>
          {payload.right.map((r) => {
            const pairedLeftId = rightToLeft.get(r.id)
            const isPaired = !!pairedLeftId
            const pairIdx = pairedLeftId ? pairIdxByLeftId.get(pairedLeftId) ?? 0 : 0
            const color = PAIR_COLORS[pairIdx % PAIR_COLORS.length]
            const canPair = !locked && !!selectedLeftId && !isPaired

            let classes = 'border-ink/10 bg-white hover:border-primary/40 hover:bg-surface'
            if (locked) {
              classes = 'border-ink/10 bg-white opacity-70'
            } else if (isPaired) {
              classes = `${color.border} ${color.bg}`
            } else if (canPair) {
              classes = 'border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10 animate-pulse'
            }

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRightClick(r.id)}
                disabled={locked || (!isPaired && !selectedLeftId)}
                className={`group flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3.5 text-left font-medium text-ink transition-all ${classes} ${
                  locked || (!isPaired && !selectedLeftId)
                    ? 'cursor-default'
                    : 'cursor-pointer active:scale-[0.98]'
                }`}
              >
                <span className="flex-1">{r.text}</span>

                {isPaired && !locked && (
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${color.badge}`}
                    title="Klikni da razvežeš"
                  >
                    {pairIdx + 1}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
