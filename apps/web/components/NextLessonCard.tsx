'use client'

import { useRef } from 'react'
import Link from 'next/link'

type NextLesson = {
  id: string
  title: string
  type: 'video' | 'text' | 'exercise'
  durationSeconds: number | null
  moduleIdx: number
  moduleTitle: string
}

/**
 * Rich kartica koja se prikazuje kad je lekcija završena — primamljiv CTA
 * da nastaviš odmah, sa pregledom sledeće lekcije.
 *
 * Ako nema sledeće (kraj kursa), prikazuje "celebrate end" varijantu sa
 * link-om na pregled kursa.
 */
export function NextLessonCard({
  courseSlug,
  next,
  visible,
}: {
  courseSlug: string
  next: NextLesson | null
  visible: boolean
}) {
  const ctaRef = useRef<HTMLAnchorElement | null>(null)

  if (!visible) return null

  if (!next) {
    return (
      <div
        className="my-8 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-light/40 via-white to-secondary-light/30 p-7 shadow-card animate-fade-up sm:p-9"
      >
        <div className="flex items-start gap-4">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-2xl text-ink shadow-soft"
            aria-hidden
          >
            🎉
          </span>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-primary-dark">
              Bravo!
            </p>
            <h3 className="mt-1 font-display text-2xl font-extrabold text-ink">
              Kraj kursa — sve lekcije završene
            </h3>
            <p className="mt-2 text-sm text-ink/70">
              Sav sadržaj iz kursa je iza tebe. Vrati se na pregled da vidiš
              napredak ili pređi na drugi kurs.
            </p>
            <Link
              ref={ctaRef}
              href={`/courses/${courseSlug}`}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-ink shadow-card transition-all hover:bg-primary-dark hover:text-white"
            >
              Pregled kursa →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const minutes = next.durationSeconds ? Math.max(1, Math.round(next.durationSeconds / 60)) : null

  return (
    <div className="my-8 animate-fade-up">
      <div className="overflow-hidden rounded-3xl border border-primary/15 bg-white shadow-card">
        <div className="grid sm:grid-cols-[1fr_auto]">
          {/* Left: meta */}
          <div className="p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Sledeća lekcija
            </p>
            <p className="mt-1 text-xs text-muted">
              Modul {next.moduleIdx + 1} · {next.moduleTitle}
            </p>
            <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight text-ink">
              {next.title}
            </h3>
            <div className="mt-3 flex items-center gap-2">
              <NextTypeBadge type={next.type} />
              {minutes && (
                <span className="text-xs text-muted">≈ {minutes} min</span>
              )}
            </div>
          </div>

          {/* Right: CTA panel */}
          <div className="relative flex items-center justify-center bg-gradient-to-br from-primary-light/35 via-primary-light/15 to-secondary-light/25 px-6 py-6 sm:px-10 sm:py-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/25 blur-3xl"
            />
            <Link
              ref={ctaRef}
              href={`/courses/${courseSlug}/lessons/${next.id}`}
              className="relative inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-ink shadow-card transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:text-white hover:shadow-lift focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:outline-none"
            >
              Pređi sada →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function NextTypeBadge({ type }: { type: 'video' | 'text' | 'exercise' }) {
  const map = {
    video: { label: 'Video', cls: 'bg-secondary/15 text-secondary-dark' },
    text: { label: 'Tekst', cls: 'bg-primary/15 text-primary-dark' },
    exercise: { label: 'Vežba', cls: 'bg-ink/10 text-ink' },
  }
  const c = map[type]
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${c.cls}`}
    >
      {c.label}
    </span>
  )
}
