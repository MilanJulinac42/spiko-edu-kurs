'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
type Course = { id: string; slug: string; title: string; modules: ModuleRow[] }

type LessonDetail = {
  id: string
  title: string
  type: 'video' | 'text' | 'exercise'
  content: { body?: string } | null
  videoId: string | null
  videoReady: boolean
  playbackUrl: string | null
  durationSeconds: number | null
  moduleId: string
  position: number
}

export default function LessonPage() {
  const params = useParams<{ slug: string; id: string }>()
  const router = useRouter()

  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCourse = useCallback(async () => {
    const { data, error } = await api.courses.mine.get()
    if (error) {
      setError(String(error.value ?? error.status))
      return
    }
    const c = (data as { course: Course | null }).course
    setCourse(c)
  }, [])

  const loadLesson = useCallback(async () => {
    const { data, error } = await api.courses.lessons({ id: params.id }).get()
    if (error) {
      setError(String(error.value ?? error.status))
      return
    }
    const l = data as LessonDetail
    setLesson(l)
  }, [params.id])

  useEffect(() => { loadCourse() }, [loadCourse])
  useEffect(() => { loadLesson() }, [loadLesson])

  useEffect(() => {
    if (!course || !params.id) return
    const current = course.modules.flatMap((m) => m.lessons).find((l) => l.id === params.id)
    setCompleted(!!current?.completed)
  }, [course, params.id])

  const allLessons = useMemo(() => {
    if (!course) return []
    return course.modules.flatMap((m, mIdx) =>
      m.lessons.map((l) => ({ ...l, moduleTitle: m.title, moduleIdx: mIdx })),
    )
  }, [course])

  const currentIdx = useMemo(
    () => allLessons.findIndex((l) => l.id === params.id),
    [allLessons, params.id],
  )
  const prev = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const next = currentIdx >= 0 && currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

  async function markComplete() {
    setCompleted(true)
    await api.progress({ lessonId: params.id }).post({
      progressSeconds: lesson?.durationSeconds ?? 0,
      completed: true,
    })
    await loadCourse()
  }

  async function goNext() {
    if (!completed) await markComplete()
    if (next) router.push(`/courses/${params.slug}/lessons/${next.id}`)
  }

  if (error) return <Container className="py-16"><p className="text-red-600">{error}</p></Container>
  if (!course || !lesson) {
    return <Container className="py-16"><p className="text-muted">Učitavanje…</p></Container>
  }

  const currentInList = allLessons.find((l) => l.id === params.id)

  return (
    <div className="bg-surface pb-24">
      {/* Top bar */}
      <div className="border-b border-ink/5 bg-white">
        <Container className="flex items-center justify-between py-4">
          <Link
            href={`/courses/${params.slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-primary-dark"
          >
            ← {course.title}
          </Link>
          <span className="hidden text-sm font-semibold text-ink/70 sm:inline">
            Lekcija {currentIdx + 1} / {allLessons.length}
          </span>
        </Container>
      </div>

      <Container className="pt-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main content */}
          <article className="rounded-3xl bg-white shadow-soft">
            {lesson.type === 'video' && (
              <VideoBlock playbackUrl={lesson.playbackUrl} ready={lesson.videoReady} />
            )}

            <div className="p-6 sm:p-10">
              <header>
                {currentInList && (
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">
                    Modul {currentInList.moduleIdx + 1} · {currentInList.moduleTitle}
                  </p>
                )}
                <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
                  {lesson.title}
                </h1>
                <div className="mt-4 flex items-center gap-2">
                  <TypeBadge type={lesson.type} />
                  {lesson.durationSeconds && (
                    <span className="text-xs text-muted">≈ {Math.round(lesson.durationSeconds / 60)} min</span>
                  )}
                </div>
              </header>

              <div className="mt-8">
                {lesson.type === 'text' && <TextBlock body={lesson.content?.body ?? ''} />}
                {lesson.type === 'exercise' && <ExerciseBlock />}
                {lesson.type === 'video' && lesson.content?.body && (
                  <TextBlock body={lesson.content.body} />
                )}
              </div>

              {/* Navigation */}
              <footer className="mt-12 flex flex-col gap-4 border-t border-ink/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  {prev ? (
                    <Link
                      href={`/courses/${params.slug}/lessons/${prev.id}`}
                      className="group inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary-dark"
                    >
                      <span>←</span>
                      <span className="max-w-[12rem] truncate">{prev.title}</span>
                    </Link>
                  ) : (
                    <span />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {!completed && (
                    <Button variant="outline" size="md" onClick={markComplete}>
                      Označi kao završeno
                    </Button>
                  )}
                  {completed && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-dark">
                      <CheckIcon /> Završeno
                    </span>
                  )}
                  {next ? (
                    <Button variant="primary" size="md" onClick={goNext}>
                      Sledeća lekcija →
                    </Button>
                  ) : (
                    <Button href={`/courses/${params.slug}`} variant="primary" size="md">
                      Pregled kursa
                    </Button>
                  )}
                </div>
              </footer>
            </div>
          </article>

          {/* Sidebar — kompletan sadržaj */}
          <aside className="space-y-4">
            <div className="sticky top-20 rounded-3xl bg-white shadow-soft">
              <div className="border-b border-ink/5 px-5 py-4">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted">
                  Sadržaj kursa
                </h3>
              </div>
              <div className="max-h-[70vh] overflow-y-auto px-2 py-3">
                {course.modules.map((m, mIdx) => (
                  <div key={m.id} className="mb-3 last:mb-0">
                    <p className="px-3 pt-2 text-xs font-bold uppercase tracking-wider text-muted">
                      {mIdx + 1}. {m.title}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {m.lessons.map((l) => {
                        const isCurrent = l.id === params.id
                        return (
                          <li key={l.id}>
                            <Link
                              href={`/courses/${params.slug}/lessons/${l.id}`}
                              className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                                isCurrent
                                  ? 'bg-primary/10 font-semibold text-primary-dark'
                                  : 'text-ink/70 hover:bg-surface'
                              }`}
                            >
                              <span
                                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[0.6rem] ${
                                  l.completed
                                    ? 'bg-primary text-white'
                                    : isCurrent
                                      ? 'border border-primary text-primary-dark'
                                      : 'border border-ink/15 text-muted'
                                }`}
                              >
                                {l.completed ? <CheckIcon /> : ''}
                              </span>
                              <span className="flex-1">{l.title}</span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  )
}

function VideoBlock({ playbackUrl, ready }: { playbackUrl: string | null; ready: boolean }) {
  if (!ready || !playbackUrl) {
    return (
      <div className="aspect-video rounded-t-3xl bg-gradient-to-br from-ink to-ink-soft">
        <div className="flex h-full flex-col items-center justify-center p-10 text-center">
          <div className="text-5xl">⏳</div>
          <p className="mt-4 font-display text-xl font-bold text-white">Video se priprema</p>
          <p className="mt-2 max-w-md text-sm text-white/70">
            Bunny još obrađuje fajl. Vrati se za par minuta.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="aspect-video overflow-hidden rounded-t-3xl bg-black">
      <video src={playbackUrl} controls className="h-full w-full" />
    </div>
  )
}

function TextBlock({ body }: { body: string }) {
  if (!body.trim()) {
    return (
      <div className="rounded-2xl bg-surface p-6 text-sm text-muted">
        Sadržaj lekcije još nije unet.
      </div>
    )
  }
  return (
    <div className="whitespace-pre-wrap text-base leading-relaxed text-ink/85">
      {body}
    </div>
  )
}

function ExerciseBlock() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/15 bg-surface p-10 text-center">
      <div className="text-4xl">✎</div>
      <p className="mt-3 font-display text-lg font-bold text-ink">Interaktivna vežba uskoro</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Builderi za 4 tipa vežbi (multiple choice, fill blank, matching, ordering)
        stižu u Fazi 3.
      </p>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
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
