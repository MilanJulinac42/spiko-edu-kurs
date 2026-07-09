'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { useApi } from '@/lib/swr'
import { celebrateBig } from '@/lib/celebrate'

type Bookmark = {
  id: string
  word: string
  translation: string | null
  note: string | null
  lessonId: string | null
}

type Group = {
  lessonId: string | null
  count: number
  lessonTitle: string | null
  moduleTitle: string | null
  courseTitle: string | null
  courseSlug: string | null
}

type Groups = {
  total: number
  groups: Group[]
}

type Selection =
  | { kind: 'all' }
  | { kind: 'lesson'; lessonId: string | null; title: string }

export default function PonavljanjePage() {
  const groupsQ = useApi<Groups>('me-bookmark-groups', () =>
    api.me['bookmark-groups'].get(),
  )
  const [selection, setSelection] = useState<Selection | null>(null)

  if (groupsQ.error) {
    return (
      <Container className="py-16">
        <p className="text-red-600">Greška: {String(groupsQ.error)}</p>
      </Container>
    )
  }
  if (!groupsQ.data) {
    return (
      <Container className="py-16">
        <p className="text-muted">Učitavam tvoje reči…</p>
      </Container>
    )
  }

  const data = groupsQ.data
  if (data.total === 0) {
    return (
      <Container className="py-16">
        <EmptyState />
      </Container>
    )
  }

  if (selection) {
    return <ReviewSession selection={selection} onExit={() => setSelection(null)} />
  }

  return (
    <div className="bg-surface pb-20 animate-fade-in">
      <Container className="py-10">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Ponavljanje</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold text-ink sm:text-5xl">
          Vežbaj svoj rečnik
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Bookmarkovane reči podeljene po lekciji. Odaberi koju grupu želiš da ponoviš.
        </p>

        {/* Mix all */}
        <div className="mt-8 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <button
            type="button"
            onClick={() => setSelection({ kind: 'all' })}
            className="group relative overflow-hidden rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/15 via-white to-secondary/10 p-6 text-left shadow-soft transition-all hover:-translate-y-1 hover:shadow-card sm:p-8"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/25 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-2xl shadow-soft">
                  🎲
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-dark">
                    Sve reči
                  </p>
                  <h2 className="font-display text-2xl font-extrabold text-ink">
                    Mešovito ponavljanje
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink/85">
                Shuffle kroz svih <strong>{data.total}</strong>{' '}
                {pluralWord(data.total)} preko svih lekcija. Najbolje za temeljnu proveru.
              </p>
              <div className="mt-5 inline-flex items-center gap-1.5 font-bold text-primary-dark transition-transform group-hover:translate-x-1">
                Pokreni mix →
              </div>
            </div>
          </button>

          <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Ukupno</p>
            <p className="mt-3 font-display text-5xl font-extrabold text-ink">{data.total}</p>
            <p className="mt-2 text-sm text-muted">
              {pluralWord(data.total)} u {data.groups.length}{' '}
              {pluralLesson(data.groups.length)}
            </p>
          </div>
        </div>

        {/* Per lesson */}
        <h3 className="mt-12 font-display text-xl font-bold text-ink">Po lekciji</h3>
        <p className="mt-1 text-sm text-muted">
          Vežbaj samo reči iz konkretne lekcije — fokusirano ponavljanje.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.groups.map((g) => (
            <LessonGroupCard
              key={g.lessonId ?? 'standalone'}
              group={g}
              onSelect={() =>
                setSelection({
                  kind: 'lesson',
                  lessonId: g.lessonId,
                  title: g.lessonTitle ?? 'Reči bez lekcije',
                })
              }
            />
          ))}
        </div>
      </Container>
    </div>
  )
}

function LessonGroupCard({
  group,
  onSelect,
}: {
  group: Group
  onSelect: () => void
}) {
  const isStandalone = group.lessonId === null

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative overflow-hidden rounded-2xl border border-ink/5 bg-white p-5 text-left shadow-soft transition-all hover:-translate-y-1 hover:shadow-card hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isStandalone ? (
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Bez lekcije</p>
          ) : (
            <p className="text-[0.7rem] font-bold uppercase tracking-wider text-muted line-clamp-1">
              {group.moduleTitle ?? group.courseTitle ?? 'Lekcija'}
            </p>
          )}
          <h4 className="mt-1 font-display text-base font-bold leading-snug text-ink line-clamp-2">
            {group.lessonTitle ?? 'Reči bez lekcije'}
          </h4>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary-dark">
          {group.count}
        </span>
      </div>
      <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary-dark transition-transform group-hover:translate-x-1">
        Vežbaj →
      </div>
    </button>
  )
}

/* ═══════════════ SESSION ═══════════════ */

function ReviewSession({
  selection,
  onExit,
}: {
  selection: Selection
  onExit: () => void
}) {
  const queryKey =
    selection.kind === 'all'
      ? 'bookmarks-all'
      : `bookmarks-lesson-${selection.lessonId ?? 'standalone'}`

  const q = useApi<Bookmark[]>(queryKey, () => {
    if (selection.kind === 'all') return api.me.bookmarks.get({ query: {} })
    if (selection.lessonId) return api.me.bookmarks.get({ query: { lessonId: selection.lessonId } })
    return api.me.bookmarks.get({ query: {} })
  })

  if (q.error) {
    return (
      <Container className="py-16">
        <p className="text-red-600">Greška: {String(q.error)}</p>
        <Button variant="outline" size="md" onClick={onExit} className="mt-4">
          Nazad
        </Button>
      </Container>
    )
  }
  if (!q.data) {
    return (
      <Container className="py-16">
        <p className="text-muted">Učitavam reči…</p>
      </Container>
    )
  }

  // Filter standalone (lessonId null) case kad nije lessonId-targeted ali jeste standalone group
  let filtered = q.data
  if (selection.kind === 'lesson' && !selection.lessonId) {
    filtered = q.data.filter((b) => b.lessonId === null)
  }

  return (
    <FlashcardRunner
      bookmarks={filtered}
      title={selection.kind === 'all' ? 'Sve reči' : selection.title}
      onExit={onExit}
    />
  )
}

function FlashcardRunner({
  bookmarks,
  title,
  onExit,
}: {
  bookmarks: Bookmark[]
  title: string
  onExit: () => void
}) {
  const shuffled = useMemo(() => {
    const arr = [...bookmarks]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [bookmarks])

  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<Array<{ id: string; known: boolean }>>([])
  const [done, setDone] = useState(false)

  const current = shuffled[idx]

  if (shuffled.length === 0) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-soft sm:p-16">
          <div className="text-6xl">📭</div>
          <h2 className="mt-5 font-display text-2xl font-extrabold text-ink">
            Nema reči u ovoj grupi
          </h2>
          <Button variant="primary" size="lg" onClick={onExit} className="mt-6">
            Nazad
          </Button>
        </div>
      </Container>
    )
  }

  function next(known: boolean) {
    if (!current) return
    const r = [...results, { id: current.id, known }]
    setResults(r)
    setFlipped(false)
    if (idx + 1 >= shuffled.length) {
      setDone(true)
      celebrateBig()
    } else {
      setIdx(idx + 1)
    }
  }

  function restart() {
    setIdx(0)
    setFlipped(false)
    setResults([])
    setDone(false)
  }

  if (done) {
    const known = results.filter((r) => r.known).length
    const pct = Math.round((known / results.length) * 100)
    const msg =
      pct >= 80
        ? 'Odlično! Imaš snažan rečnik.'
        : pct >= 50
          ? 'Solidan rezultat. Još malo vežbanja!'
          : 'Vredi ponoviti — biće lakše svaki put.'

    return (
      <Container className="py-16">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-card sm:p-16">
          <div className="text-7xl">{pct >= 80 ? '🏆' : pct >= 50 ? '🎉' : '💪'}</div>
          <h2 className="mt-6 font-display text-3xl font-extrabold text-ink">
            Sesija završena
          </h2>
          <p className="mt-2 text-sm text-muted">{title}</p>
          <p className="mt-3 text-muted">{msg}</p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-surface p-4">
              <p className="font-display text-3xl font-extrabold text-primary-dark">{known}</p>
              <p className="mt-1 text-xs text-muted">znala</p>
            </div>
            <div className="rounded-2xl bg-surface p-4">
              <p className="font-display text-3xl font-extrabold text-red-600">
                {results.length - known}
              </p>
              <p className="mt-1 text-xs text-muted">nisi</p>
            </div>
            <div className="rounded-2xl bg-surface p-4">
              <p className="font-display text-3xl font-extrabold text-ink">{pct}%</p>
              <p className="mt-1 text-xs text-muted">tačnost</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="primary" size="lg" onClick={restart}>
              Probaj ponovo
            </Button>
            <Button variant="outline" size="lg" onClick={onExit}>
              Drugu grupu
            </Button>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <div className="bg-surface pb-20 animate-fade-in">
      <Container className="py-10">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Ponavljanje</p>
            <h1 className="mt-1 truncate font-display text-2xl font-extrabold text-ink sm:text-3xl">
              {title}
            </h1>
          </div>
          <button
            onClick={onExit}
            className="text-sm font-medium text-muted hover:text-primary-dark"
          >
            ← Odustani
          </button>
        </div>

        {/* Progress */}
        <div className="mt-8 flex items-center gap-1.5">
          {shuffled.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < idx
                  ? results[i]?.known
                    ? 'bg-primary'
                    : 'bg-red-400'
                  : i === idx
                    ? 'bg-primary/40'
                    : 'bg-ink/10'
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-muted">
          {idx + 1} / {shuffled.length}
        </p>

        {/* Card */}
        <div className="mt-8 grid place-items-center">
          <button
            type="button"
            onClick={() => setFlipped((v) => !v)}
            className="group relative w-full max-w-xl"
            style={{ perspective: '1200px' }}
          >
            {/* Grid stacking: oba lica u istom grid cell-u → container zauzima visinu
                veće strane. Bez absolute pozicioniranja → BACK ne overflow-uje FRONT. */}
            <div
              className="grid transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* FRONT */}
              <div
                className="col-start-1 row-start-1 flex flex-col items-center justify-center break-words rounded-3xl bg-white p-8 text-center shadow-card sm:p-12"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Reč</p>
                <p className="mt-6 font-display text-4xl font-extrabold leading-tight text-ink sm:text-6xl">
                  {current.word}
                </p>
                <p className="mt-8 text-xs text-muted">Klikni za prevod ↻</p>
              </div>

              {/* BACK */}
              <div
                className="col-start-1 row-start-1 flex flex-col items-center justify-center break-words rounded-3xl bg-gradient-to-br from-primary/15 to-secondary/10 p-8 text-center shadow-card sm:p-12"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-primary-dark">
                  Prevod
                </p>
                <p className="mt-6 font-display text-3xl font-extrabold leading-tight text-ink sm:text-5xl">
                  {current.translation ?? '—'}
                </p>
                {current.note && (
                  <p className="mt-6 max-w-md text-sm italic leading-relaxed text-muted">
                    &ldquo;{current.note}&rdquo;
                  </p>
                )}
                <p className="mt-8 text-xs text-muted">↻ Klikni nazad</p>
              </div>
            </div>
          </button>
        </div>

        {/* Actions */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:mx-auto sm:max-w-md">
          <Button
            variant="outline"
            size="lg"
            onClick={() => next(false)}
            className="w-full !border-red-300 !text-red-600 hover:!border-red-500 hover:!text-red-700"
          >
            ✗ Ne znam
          </Button>
          <Button variant="primary" size="lg" onClick={() => next(true)} className="w-full">
            ✓ Znam
          </Button>
        </div>
      </Container>
    </div>
  )
}

/* ═══════════════ helpers ═══════════════ */

function EmptyState() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-soft sm:p-16">
      <div className="text-6xl">📭</div>
      <h2 className="mt-5 font-display text-2xl font-extrabold text-ink">Još nemaš reči</h2>
      <p className="mt-3 text-muted">
        Selektuj nepoznatu reč u lekciji → klikni <strong>⭐ Bookmark</strong> u AI
        popup-u → reč se pojavi ovde za ponavljanje.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-ink shadow-soft hover:bg-primary-dark hover:text-white"
      >
        Otvori lekciju
      </Link>
    </div>
  )
}

function pluralWord(n: number): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'reč'
  return 'reči'
}

function pluralLesson(n: number): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'lekciji'
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'lekcije'
  return 'lekcija'
}
