'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'

type LessonRow = {
  id: string
  title: string
  type: 'video' | 'text' | 'exercise'
  durationSeconds: number | null
  completed: boolean
}
type ModuleRow = { id: string; title: string; lessons: LessonRow[] }
type Course = {
  id: string
  slug: string
  title: string
  description: string | null
  level: string | null
  language: string | null
  modules: ModuleRow[]
}

export default function CoursePage() {
  const [data, setData] = useState<{
    course: Course | null
    stats?: { total: number; completed: number; percent: number }
    resumeLessonId?: string | null
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.courses.mine.get().then(({ data, error }) => {
      if (error) setError(String(error.value ?? error.status))
      else setData(data as never)
    })
  }, [])

  if (error) return <Container className="py-16"><p className="text-red-600">{error}</p></Container>
  if (!data) return <Container className="py-16"><p className="text-muted">Učitavanje…</p></Container>
  const course = data.course
  if (!course) return <Container className="py-16"><p className="text-muted">Tvoj kurs još nije pripremljen.</p></Container>

  const stats = data.stats ?? { total: 0, completed: 0, percent: 0 }
  const resumeHref = data.resumeLessonId
    ? `/courses/${course.slug}/lessons/${data.resumeLessonId}`
    : null

  return (
    <div className="bg-surface pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink py-14 sm:py-20">
        <div className="pointer-events-none absolute -left-20 top-10 h-60 w-60 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 top-32 h-72 w-72 rounded-full bg-secondary/25 blur-3xl" />

        <Container className="relative z-10">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-white/60 hover:text-primary-light">
            ← Nazad na pregled
          </Link>

          <div className="mt-6 grid items-end gap-8 lg:grid-cols-[1fr_220px]">
            <div className="text-white animate-fade-up">
              <div className="flex flex-wrap items-center gap-2">
                {course.level && (
                  <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary-light">
                    {course.level}
                  </span>
                )}
                {course.language && (
                  <span className="rounded-full bg-secondary/20 px-3 py-1 text-xs font-semibold text-secondary-light">
                    {course.language.toUpperCase()}
                  </span>
                )}
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                  {course.modules.length} modul{course.modules.length === 1 ? '' : 'a'}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                  {stats.total} lekcija
                </span>
              </div>

              <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                {course.title}
              </h1>
              {course.description && (
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/70">
                  {course.description}
                </p>
              )}

              <div className="mt-7 flex items-center gap-3">
                {resumeHref && (
                  <Button href={resumeHref} variant="primary" size="lg">
                    {stats.completed > 0 ? '▶ Nastavi gde si stao' : '▶ Počni kurs'}
                  </Button>
                )}
              </div>
            </div>

            <div className="hidden lg:flex justify-end">
              <div className="text-right text-white">
                <p className="text-xs uppercase tracking-wider text-white/60">Tvoj napredak</p>
                <p className="mt-1 font-display text-6xl font-extrabold text-primary">
                  {stats.percent}%
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {stats.completed} od {stats.total} lekcija
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-700"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </Container>
      </section>

      {/* Modules */}
      <Container className="mt-10">
        <h2 className="font-display text-2xl font-bold text-ink">Sadržaj kursa</h2>
        <p className="mt-1 text-sm text-muted">Idi redom — svaki modul se nadovezuje na prethodni.</p>

        <div className="mt-8 space-y-6">
          {course.modules.map((m, mIdx) => {
            const done = m.lessons.filter((l) => l.completed).length
            const total = m.lessons.length
            const pct = total ? Math.round((done / total) * 100) : 0
            const isComplete = pct === 100
            return (
              <section
                key={m.id}
                className="overflow-hidden rounded-3xl border border-ink/5 bg-white shadow-soft"
              >
                <header className="flex items-center gap-5 border-b border-ink/5 bg-gradient-to-br from-surface to-white px-6 py-5 sm:px-8">
                  <div
                    className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-xl font-extrabold ${
                      isComplete
                        ? 'bg-primary text-white'
                        : pct > 0
                          ? 'bg-primary/15 text-primary-dark'
                          : 'bg-ink/5 text-ink/40'
                    }`}
                  >
                    {isComplete ? '✓' : mIdx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted">
                      Modul {mIdx + 1}
                    </p>
                    <h3 className="mt-0.5 truncate font-display text-lg font-bold text-ink">
                      {m.title}
                    </h3>
                  </div>
                  <div className="hidden text-right text-sm sm:block">
                    <p className="font-semibold text-ink">
                      {done} / {total}
                    </p>
                    <p className="text-xs text-muted">lekcija</p>
                  </div>
                </header>

                <ul className="divide-y divide-ink/5">
                  {m.lessons.map((l, idx) => (
                    <li key={l.id}>
                      <Link
                        href={`/courses/${course.slug}/lessons/${l.id}`}
                        className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-surface sm:px-8"
                      >
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors ${
                            l.completed
                              ? 'bg-primary text-white'
                              : 'border-2 border-ink/15 text-muted group-hover:border-primary group-hover:text-primary-dark'
                          }`}
                        >
                          {l.completed ? <CheckIcon /> : idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-ink group-hover:text-primary-dark">
                            {l.title}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                            <TypeBadge type={l.type} />
                            {l.durationSeconds && <span>· {Math.round(l.durationSeconds / 60)} min</span>}
                          </div>
                        </div>
                        <span className="text-muted group-hover:translate-x-1 group-hover:text-primary-dark transition-transform">→</span>
                      </Link>
                    </li>
                  ))}
                  {m.lessons.length === 0 && (
                    <li className="px-6 py-5 text-sm text-muted sm:px-8">Nema lekcija u modulu.</li>
                  )}
                </ul>
              </section>
            )
          })}

          {course.modules.length === 0 && (
            <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
              <p className="text-4xl">📦</p>
              <h3 className="mt-3 font-display text-xl font-bold text-ink">Modula još nema</h3>
              <p className="mt-2 text-muted">Predavač upravo priprema sadržaj.</p>
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TypeBadge({ type }: { type: 'video' | 'text' | 'exercise' }) {
  const map = {
    video: { label: 'Video', cls: 'bg-secondary/10 text-secondary-dark' },
    text: { label: 'Tekst', cls: 'bg-primary/10 text-primary-dark' },
    exercise: { label: 'Vežba', cls: 'bg-ink/10 text-ink' },
  }
  const c = map[type]
  return (
    <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${c.cls}`}>
      {c.label}
    </span>
  )
}
