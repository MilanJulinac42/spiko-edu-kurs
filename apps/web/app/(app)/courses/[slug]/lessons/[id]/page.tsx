'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ExercisePayloadForStudent } from '@spiko/shared'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { useApi } from '@/lib/swr'
// Lazy load — exercise playeri imaju dnd-kit (~80kb). Lekcije bez vežbi ne treba da plate.
const ExercisePlayer = dynamic(
  () => import('@/components/exercise/ExercisePlayer').then((m) => m.ExercisePlayer),
  { ssr: false, loading: () => <ExerciseLoadingState /> },
)
const ExerciseListPlayer = dynamic(
  () => import('@/components/exercise/ExerciseListPlayer').then((m) => m.ExerciseListPlayer),
  { ssr: false, loading: () => <ExerciseLoadingState /> },
)

function ExerciseLoadingState() {
  return (
    <div className="rounded-2xl bg-surface p-6">
      <div className="h-3 w-2/3 animate-pulse rounded bg-ink/10" />
      <div className="mt-4 h-8 w-full animate-pulse rounded bg-ink/5" />
      <div className="mt-3 h-8 w-full animate-pulse rounded bg-ink/5" />
      <div className="mt-3 h-8 w-3/4 animate-pulse rounded bg-ink/5" />
    </div>
  )
}
// TipTap je oko 250kb gzip — lazy load samo kad lekcija stvarno ima rich text
const RichTextRenderer = dynamic(
  () => import('@/components/RichTextRenderer').then((m) => m.RichTextRenderer),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-2">
        <div className="h-5 w-full animate-pulse rounded bg-ink/5" />
        <div className="h-5 w-5/6 animate-pulse rounded bg-ink/5" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-ink/5" />
      </div>
    ),
  },
)
import { Comments } from '@/components/Comments'
import { LessonSidebarPanel } from '@/components/LessonSidebarPanel'
import { LessonContentDrawer } from '@/components/LessonContentDrawer'
import { LessonAiButton } from '@/components/ai/LessonAiButton'
import { LessonSkeleton } from '@/components/Skeleton'
import { WordLookupPopup } from '@/components/WordLookupPopup'
import { FloatingVideoBlock } from '@/components/FloatingVideoBlock'
import { NextLessonCard } from '@/components/NextLessonCard'
import { AudioPlayer } from '@/components/AudioPlayer'
import { celebrateLessonComplete } from '@/lib/celebrate'
import dynamic from 'next/dynamic'

type LessonRow = {
  id: string
  title: string
  type: 'video' | 'text' | 'exercise'
  durationSeconds: number | null
  completed: boolean
}
type ModuleRow = { id: string; title: string; lessons: LessonRow[] }
type Course = { id: string; slug: string; title: string; modules: ModuleRow[] }

export type LessonExercise = {
  id: string
  title: string
  type: string
  position: number
  audioUrl?: string | null
  audioTitle?: string | null
  payload: ExercisePayloadForStudent | null
}

type LessonDetail = {
  id: string
  title: string
  type: 'video' | 'text' | 'exercise'
  content: { body?: string } | ExercisePayloadForStudent | null
  videoId: string | null
  videoReady: boolean
  playbackUrl: string | null
  embedUrl: string | null
  durationSeconds: number | null
  moduleId: string
  position: number
  exercises: LessonExercise[]
  contentOrder: Array<'video' | 'text' | 'exercises' | 'audio'> | null
  audioUrl: string | null
  audioTitle: string | null
}

export default function LessonPage() {
  const params = useParams<{ slug: string; id: string }>()
  const router = useRouter()

  const [completed, setCompleted] = useState(false)

  // SWR cache — course tree se ne menja između susednih lekcija pa se
  // dedup-uje na 5s. Key uključuje slug da se A1 i A2 ne mešaju.
  const courseQ = useApi<{ course: Course | null }>(
    `courses:${params.slug}`,
    () => api.courses({ slug: params.slug }).get(),
  )
  const lessonQ = useApi<LessonDetail>(
    `lessons-${params.id}`,
    () => api.courses.lessons({ id: params.id }).get(),
    {
      // Auto-poll dok se video obrađuje: ako lekcija ima videoId ali još nije
      // spreman, osvežavaj svakih 15s da uhvatimo trenutak kad Bunny završi.
      // Kad postane spreman (ili nema videoId) → 0 = stop.
      refreshInterval: (data) => {
        const d = data as LessonDetail | undefined
        if (d?.videoId && !d.videoReady) return 15000
        return 0
      },
    },
  )
  const course = (courseQ.data as { course: Course | null } | null)?.course ?? null
  const lesson = lessonQ.data as LessonDetail | null
  const error = courseQ.error ?? lessonQ.error
  const loadCourse = useCallback(() => courseQ.mutate(), [courseQ])
  const loadLesson = useCallback(() => lessonQ.mutate(), [lessonQ])
  // Lazy alias da ne diramo postojeći goto-pozivnik niže
  void loadLesson

  useEffect(() => {
    if (!course || !params.id) return
    const current = course.modules.flatMap((m) => m.lessons).find((l) => l.id === params.id)
    setCompleted(!!current?.completed)
  }, [course, params.id])

  // "View ping" — fire-and-forget, NE blokira render lekcije.
  // Backend je idempotentan (čuva postojeći completed/completedAt sa COALESCE).
  // Course tree ne refreshujemo ovde — sledeći SWR revalidate je dovoljan.
  useEffect(() => {
    if (!params.id) return
    void api.progress({ lessonId: params.id }).post({ progressSeconds: 0 }).catch(() => {})
  }, [params.id])

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
    const wasCompletedBefore = completed
    setCompleted(true)
    // Optimistic — odmah pokaži celebration, šaljemo POST u pozadini.
    // SWR će sledeći mount automatski revalidirati course tree.
    if (!wasCompletedBefore) celebrateLessonComplete()
    void api.progress({ lessonId: params.id })
      .post({
        progressSeconds: lesson?.durationSeconds ?? 0,
        completed: true,
      })
      .then(() => loadCourse())
      .catch(() => {})
  }

  async function goNext() {
    if (!completed) await markComplete()
    if (next) router.push(`/courses/${params.slug}/lessons/${next.id}`)
  }

  // Keyboard navigacija: ←/→ prethodna/sledeća lekcija, J/K skrol dole/gore.
  // Ignoriše kad je fokus u polju za unos (beleške, komentari, AI chat) ili
  // kad je pritisnut modifier (Ctrl/Cmd shortcuts ostaju netaknuti).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const el = document.activeElement
      const tag = el?.tagName
      const editable =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (el as HTMLElement | null)?.isContentEditable
      if (editable) return

      if (e.key === 'ArrowRight' && next) {
        router.push(`/courses/${params.slug}/lessons/${next.id}`)
      } else if (e.key === 'ArrowLeft' && prev) {
        router.push(`/courses/${params.slug}/lessons/${prev.id}`)
      } else if (e.key === 'j' || e.key === 'J') {
        window.scrollBy({ top: window.innerHeight * 0.4, behavior: 'smooth' })
      } else if (e.key === 'k' || e.key === 'K') {
        window.scrollBy({ top: -window.innerHeight * 0.4, behavior: 'smooth' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, params.slug, router])

  if (error) return <Container className="py-16"><p className="text-red-600">{String(error)}</p></Container>
  if (!course || !lesson) {
    return <LessonSkeleton />
  }

  const currentInList = allLessons.find((l) => l.id === params.id)

  // Progres kroz ceo kurs — koliko lekcija je završeno + trenutna pozicija.
  // Trenutna lekcija se broji kao "u toku" ako još nije završena.
  const completedCount = allLessons.filter((l) => l.completed).length
  const coursePercent = allLessons.length
    ? Math.round((completedCount / allLessons.length) * 100)
    : 0
  const remainingCount = allLessons.length - completedCount

  return (
    <div className="bg-surface pb-24 animate-fade-in">
      {/* Reading progress — tanka linija na samom vrhu, prati skrol kroz lekciju */}
      <ReadingProgress />

      {/* Sticky progres traka — uvek vidljiva dok se skroluje kroz lekciju */}
      <div className="sticky top-0 z-30 border-b border-ink/5 bg-white/90 backdrop-blur-md">
        <Container className="py-3">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/courses/${params.slug}`}
              className="group inline-flex min-w-0 items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-primary-dark"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface transition-colors group-hover:bg-primary/10">
                ←
              </span>
              <span className="min-w-0">
                {currentInList && (
                  <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-muted/70">
                    Modul {currentInList.moduleIdx + 1}
                  </span>
                )}
                <span className="block truncate font-semibold text-ink">{course.title}</span>
              </span>
            </Link>

            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden text-xs text-muted sm:inline">
                {remainingCount === 0
                  ? 'Sve završeno 🎉'
                  : `${remainingCount} ${remainingCount === 1 ? 'lekcija' : 'lekcija'} do kraja`}
              </span>
              <span className="text-sm font-bold text-ink">
                {currentIdx + 1}
                <span className="text-muted/60"> / {allLessons.length}</span>
              </span>
            </div>
          </div>

          {/* Progres bar kroz ceo kurs */}
          <div className="mt-2.5 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-[width] duration-700 ease-out"
                style={{ width: `${coursePercent}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-bold text-primary-dark">{coursePercent}%</span>
          </div>
        </Container>
      </div>

      <Container className="pt-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main content */}
          {(() => {
            // Capture lesson as non-nullable local — narrowing iz outer guarda
            // ne prolazi kroz inner closures (renderBlock).
            const l = lesson
            const textBody = (l.content as { body?: string } | null)?.body ?? ''
            const hasText = !!textBody.trim()
            const hasMultiExercises = l.exercises.length > 0
            const hasSingleExercise = !hasMultiExercises && isExercisePayload(l.content)
            const hasExercises = hasMultiExercises || hasSingleExercise
            const hasVideo = !!l.videoId
            const hasAudio = !!l.audioUrl

            type BlockKey = 'video' | 'text' | 'exercises' | 'audio'
            const KNOWN_BLOCKS: BlockKey[] = ['video', 'text', 'exercises', 'audio']
            // Redosled blokova — admin može da prevuče (contentOrder).
            // Filtriramo nepoznate ključeve (npr. zaostali 'vocabulary' iz starih
            // lekcija) da render ne pukne na nepostojećem tipu bloka.
            const rawOrder =
              Array.isArray(l.contentOrder) && l.contentOrder.length > 0
                ? l.contentOrder
                : ['video', 'text', 'exercises', 'audio']
            const order: BlockKey[] = rawOrder.filter((k): k is BlockKey =>
              KNOWN_BLOCKS.includes(k as BlockKey),
            )
            const visibleBlocks = order.filter((k) =>
              k === 'video'
                ? hasVideo
                : k === 'text'
                  ? hasText
                  : k === 'audio'
                    ? hasAudio
                    : hasExercises,
            )
            const videoIsFirst = visibleBlocks[0] === 'video'

            function renderBlock(blockKey: BlockKey) {
              if (blockKey === 'audio' && l.audioUrl) {
                return (
                  <AudioPlayer
                    key="audio"
                    src={l.audioUrl}
                    label={l.audioTitle || 'Slušaj'}
                  />
                )
              }
              if (blockKey === 'video') {
                return (
                  <InlineVideoBlock
                    key="video"
                    embedUrl={l.embedUrl}
                    ready={l.videoReady}
                  />
                )
              }
              if (blockKey === 'text') {
                return <TextBlock key="text" body={textBody} />
              }
              if (blockKey === 'exercises' && hasMultiExercises) {
                return (
                  <ExerciseListPlayer
                    key="exercises-multi"
                    exercises={l.exercises}
                    onAllCompleted={async () => {
                      const wasCompleted = completed
                      await loadCourse()
                      setCompleted(true)
                      if (!wasCompleted) celebrateLessonComplete()
                    }}
                  />
                )
              }
              if (blockKey === 'exercises' && hasSingleExercise) {
                return (
                  <ExercisePlayer
                    key="exercises-single"
                    lessonId={l.id}
                    payload={l.content as ExercisePayloadForStudent}
                    onCompleted={async () => {
                      await loadCourse()
                      setCompleted(true)
                    }}
                  />
                )
              }
              return null
            }

            return (
              <article className="rounded-3xl bg-white shadow-soft" data-lesson-content>
                {/* Floating video samo ako je PRVI blok (zauzima top of card) */}
                {videoIsFirst && (
                  <FloatingVideoBlock embedUrl={lesson.embedUrl} ready={lesson.videoReady} />
                )}

                <div className="p-5 sm:p-10">
                  <header>
                    {currentInList && (
                      <p className="text-xs font-bold uppercase tracking-wider text-muted">
                        Modul {currentInList.moduleIdx + 1} · {currentInList.moduleTitle}
                      </p>
                    )}
                    <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
                      {lesson.title}
                    </h1>
                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      {completed && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-primary-dark">
                          <CheckIcon /> Završena
                        </span>
                      )}
                      {lesson.durationSeconds ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <ClockIcon /> ≈ {Math.round(lesson.durationSeconds / 60)} min
                        </span>
                      ) : null}
                      {hasMultiExercises && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          ✍️ {l.exercises.length} {l.exercises.length === 1 ? 'vežba' : 'vežbe'}
                        </span>
                      )}
                    </div>
                  </header>

                  {(() => {
                    // Blokovi koji se renderuju u toku (bez video-first koji je gore floating)
                    const flowBlocks = visibleBlocks.filter(
                      (k) => !(k === 'video' && videoIsFirst),
                    )
                    if (flowBlocks.length === 0) {
                      // Video-only lekcija (video je floating gore) → nema šta u toku
                      return visibleBlocks.length === 0 ? (
                        <div className="mt-8 rounded-2xl bg-surface p-6 text-sm text-muted">
                          Sadržaj lekcije još nije unet.
                        </div>
                      ) : null
                    }
                    return (
                      <div className="mt-8 space-y-8">
                        {flowBlocks.map((k) => (
                          <BlockSection key={k} kind={k}>
                            {renderBlock(k)}
                          </BlockSection>
                        ))}
                      </div>
                    )
                  })()}

              {/* Next lesson rich preview — pojavljuje se kad je lekcija završena */}
              <NextLessonCard
                courseSlug={params.slug}
                next={next ? {
                  id: next.id,
                  title: next.title,
                  type: next.type,
                  durationSeconds: next.durationSeconds,
                  moduleIdx: next.moduleIdx,
                  moduleTitle: next.moduleTitle,
                } : null}
                visible={completed}
              />

              {/* Footer navigacija — uvek prev/next u istom stilu (text linkovi).
                  Akcijska dugmad ("Označi kao završeno") samo ako lekcija nema
                  interaktivne vežbe (vežbe automatski označe kao završeno). */}
              {(() => {
                const hasExercises = lesson.exercises.length > 0
                return (
                  <footer className="mt-12 border-t border-ink/5 pt-6">
                    {/* Akcijski red — center, samo ako relevantno */}
                    {!hasExercises && !completed && (
                      <div className="mb-4 flex justify-center">
                        <Button variant="primary" size="md" onClick={markComplete}>
                          ✓ Označi kao završeno
                        </Button>
                      </div>
                    )}
                    {completed && (
                      <div className="mb-4 flex justify-center">
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-dark">
                          <CheckIcon /> Lekcija završena
                        </span>
                      </div>
                    )}

                    {/* Prev / Next linkovi — uvek u istom stilu, oba diskretna */}
                    <nav className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        {prev ? (
                          <Link
                            href={`/courses/${params.slug}/lessons/${prev.id}`}
                            className="group inline-flex items-start gap-2 text-sm text-muted transition-colors hover:text-primary-dark"
                          >
                            <span className="mt-0.5">←</span>
                            <span className="min-w-0">
                              <span className="block text-xs uppercase tracking-wider opacity-70">
                                Prethodna
                              </span>
                              <span className="block max-w-[16rem] truncate font-medium">
                                {prev.title}
                              </span>
                            </span>
                          </Link>
                        ) : (
                          <span />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-right">
                        {next ? (
                          <Link
                            href={`/courses/${params.slug}/lessons/${next.id}`}
                            className="group inline-flex items-start gap-2 text-sm text-muted transition-colors hover:text-primary-dark"
                          >
                            <span className="min-w-0 text-right">
                              <span className="block text-xs uppercase tracking-wider opacity-70">
                                Sledeća
                              </span>
                              <span className="block max-w-[16rem] truncate font-medium">
                                {next.title}
                              </span>
                            </span>
                            <span className="mt-0.5">→</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/courses/${params.slug}`}
                            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-primary-dark"
                          >
                            Pregled kursa →
                          </Link>
                        )}
                      </div>
                    </nav>
                  </footer>
                )
              })()}
            </div>
              </article>
            )
          })()}

          {/* Sidebar — sticky kao jedinica na desktopu, interni scroll za oba panela */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
            <LessonContentDrawer
              modules={course.modules}
              slug={params.slug}
              currentLessonId={params.id}
            />

            {/* Beleške + bookmarkovane reči — vidi se i na mobile i desktop */}
            <LessonSidebarPanel lessonId={lesson.id} />
          </aside>
        </div>

        {/* Comments ispod glavnog content-a */}
        <div className="mt-10 rounded-3xl bg-white p-5 shadow-soft sm:p-10 lg:max-w-[calc(100%-344px)]">
          <Comments lessonId={lesson.id} />
        </div>
      </Container>

      {/* Floating AI tutor */}
      <LessonAiButton lessonId={lesson.id} />

      {/* AI inline lookup — selektuj reč u glavnom contentu lekcije */}
      <WordLookupPopup lessonId={lesson.id} scopeSelector="[data-lesson-content]" />
    </div>
  )
}

/**
 * Inline video — koristi se kad video NIJE prvi blok u lekciji.
 * Plain iframe u flow-u, bez floating ponašanja (FloatingVideoBlock je rezervisan
 * za top-of-card poziciju).
 */
function InlineVideoBlock({ embedUrl, ready }: { embedUrl: string | null; ready: boolean }) {
  if (!ready || !embedUrl) {
    return (
      <div className="aspect-video rounded-2xl bg-gradient-to-br from-ink to-ink-soft">
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
          <div className="text-4xl">⏳</div>
          <p className="mt-3 font-display text-lg font-bold text-white">
            Video se priprema
          </p>
          <p className="mt-1 max-w-md text-sm text-white/70">
            Bunny još obrađuje fajl. Vrati se za par minuta.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
      <iframe
        src={embedUrl}
        loading="lazy"
        allow="accelerometer; gyroscope; encrypted-media; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
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
  // Detektuj da li je HTML iz TipTap (sadrži <p>, <h2>, itd) ili plain text
  const isHtml = /<[a-z][\s\S]*>/i.test(body)
  if (isHtml) {
    return <RichTextRenderer html={body} />
  }
  return (
    <div className="whitespace-pre-wrap text-base leading-relaxed text-ink/85">
      {body}
    </div>
  )
}

function isExercisePayload(c: unknown): c is ExercisePayloadForStudent {
  return (
    !!c &&
    typeof c === 'object' &&
    'type' in c &&
    'data' in c &&
    typeof (c as { type: unknown }).type === 'string'
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

/**
 * Tanka reading-progress linija na samom vrhu viewport-a — prati koliko je
 * strane skrolovano. Sekundarna boja da se razlikuje od course-progress trake.
 */
function ReadingProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      setPct(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <div className="fixed inset-x-0 top-0 z-40 h-0.5" aria-hidden>
      <div
        className="h-full bg-secondary transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/**
 * Sekcijski wrapper oko svakog bloka lekcije (video/tekst/audio/vežbe).
 * Daje vizuelni ritam: ikona + label + opcioni "Korak N/M".
 */
function BlockSection({
  kind,
  children,
}: {
  kind: 'video' | 'text' | 'exercises' | 'audio'
  children: React.ReactNode
}) {
  const meta: Record<typeof kind, { icon: string; label: string; accent: string }> = {
    video: { icon: '📺', label: 'Video lekcija', accent: 'text-secondary-dark' },
    text: { icon: '📖', label: 'Pročitaj', accent: 'text-primary-dark' },
    audio: { icon: '🔊', label: 'Slušaj i ponovi', accent: 'text-secondary-dark' },
    exercises: { icon: '✍️', label: 'Vežbaj', accent: 'text-primary-dark' },
  }
  const m = meta[kind]
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface text-base shadow-soft ring-1 ring-ink/5">
          {m.icon}
        </span>
        <span className={`text-sm font-bold ${m.accent}`}>{m.label}</span>
      </div>
      {children}
    </section>
  )
}
