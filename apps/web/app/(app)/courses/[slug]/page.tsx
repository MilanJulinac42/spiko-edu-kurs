'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { useApi } from '@/lib/swr'
import { CourseRating } from '@/components/CourseRating'
import { CourseDetailSkeleton } from '@/components/Skeleton'

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

type CourseResp = {
  course: Course | null
  stats?: {
    total: number
    completed: number
    percent: number
    totalExercises?: number
    totalDurationSeconds?: number
  }
  resumeLessonId?: string | null
}

export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>()
  const q = useApi<CourseResp>(`courses:${slug}`, () => api.courses({ slug }).get())
  const [shareToast, setShareToast] = useState<string | null>(null)

  async function shareCourse(courseTitle: string) {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    // Native share API (mobile / podržano), inače copy-to-clipboard fallback
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: courseTitle,
          text: `Učim ${courseTitle} na Spiko Edu — pridruži mi se`,
          url,
        })
        return
      } catch {
        // user cancelled — ignore
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareToast('Link kopiran ✓')
      setTimeout(() => setShareToast(null), 2500)
    } catch {
      setShareToast('Ne mogu da kopiram link')
      setTimeout(() => setShareToast(null), 2500)
    }
  }

  if (q.error) return <Container className="py-16"><p className="text-red-600">{String(q.error)}</p></Container>
  if (!q.data) return <CourseDetailSkeleton />
  const data = q.data
  const course = data.course
  if (!course) return <Container className="py-16"><p className="text-muted">Tvoj kurs još nije pripremljen.</p></Container>

  const stats = data.stats ?? { total: 0, completed: 0, percent: 0 }
  const resumeHref = data.resumeLessonId
    ? `/courses/${course.slug}/lessons/${data.resumeLessonId}`
    : null

  return (
    <div className="bg-surface pb-20 animate-fade-in">
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

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {resumeHref && (
                  <Button href={resumeHref} variant="primary" size="lg">
                    {stats.completed > 0 ? '▶ Nastavi učenje' : '▶ Počni kurs'}
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => shareCourse(course.title)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/90 backdrop-blur transition-all hover:bg-white/10 hover:text-white"
                  title="Pošalji kurs prijatelju"
                >
                  <ShareIcon />
                  {shareToast ?? 'Pošalji'}
                </button>
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

      {/* Quick stats traka — odmah ispod hero-a */}
      <Container className="mt-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickStat
            label="Lekcija"
            value={stats.total}
            icon={<IconBook />}
            tone="primary"
          />
          <QuickStat
            label="Vežbi"
            value={stats.totalExercises ?? 0}
            icon={<IconCheck />}
            tone="accent"
          />
          <QuickStat
            label="Trajanje"
            value={formatTotalDuration(stats.totalDurationSeconds ?? 0)}
            icon={<IconClock />}
            tone="warning"
          />
          <QuickStat
            label="Tvoj napredak"
            value={`${stats.percent}%`}
            icon={<IconTrophy />}
            tone="success"
          />
        </div>
      </Container>

      {/* Modules + Rating sidebar */}
      <Container className="mt-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
          <div>
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
                  <ModuleRing pct={pct} index={mIdx + 1} isComplete={isComplete} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted">
                      Modul {mIdx + 1}
                    </p>
                    <h3 className="mt-0.5 truncate font-display text-lg font-bold text-ink">
                      {m.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      {isComplete ? (
                        <span className="font-semibold text-primary-dark">Modul završen ✓</span>
                      ) : (
                        <>
                          {done} / {total} {total === 1 ? 'lekcija' : 'lekcija'}
                          {done > 0 && ` · ${pct}%`}
                        </>
                      )}
                    </p>
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
          </div>

          {/* Right sidebar — Course rating */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <CourseRating courseId={course.id} />
          </aside>
        </div>
      </Container>
    </div>
  )
}

/* ──── Module progress ring ──── */

function ModuleRing({
  pct,
  index,
  isComplete,
}: {
  pct: number
  index: number
  isComplete: boolean
}) {
  const size = 56
  const stroke = 4
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-ink/8"
        />
        {/* Progress */}
        {pct > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="text-primary transition-[stroke-dashoffset] duration-700 ease-out"
          />
        )}
      </svg>
      <span
        className={`absolute inset-0 grid place-items-center font-display text-lg font-extrabold ${
          isComplete ? 'text-primary' : pct > 0 ? 'text-primary-dark' : 'text-ink/40'
        }`}
      >
        {isComplete ? '✓' : index}
      </span>
    </div>
  )
}

/* ──── Quick stats ──── */

function QuickStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  tone: 'primary' | 'accent' | 'warning' | 'success'
}) {
  const toneClasses = {
    primary: 'bg-primary-light/30 text-primary-dark',
    accent: 'bg-secondary-light/30 text-secondary-dark',
    warning: 'bg-amber-100 text-amber-800',
    success: 'bg-emerald-100 text-emerald-800',
  }[tone]
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-soft">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${toneClasses}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-0.5 font-display text-xl font-extrabold text-ink leading-tight">
          {value}
        </p>
      </div>
    </div>
  )
}

function formatTotalDuration(seconds: number): string {
  if (!seconds || seconds < 60) return '< 1 min'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  if (rem === 0) return `${hours} h`
  return `${hours} h ${rem} min`
}

/* ──── Icons ──── */

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="m16 6-4-4-4 4" />
      <path d="M12 2v13" />
    </svg>
  )
}
function IconBook() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v14H6a2 2 0 0 0-2 2V5Z" />
      <path d="M8 7h7M8 11h5" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="m9 13 2 2 4-4" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}
function IconTrophy() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M17 4h3a1 1 0 0 1 1 1 5 5 0 0 1-5 5M7 4H4a1 1 0 0 0-1 1 5 5 0 0 0 5 5" />
    </svg>
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
