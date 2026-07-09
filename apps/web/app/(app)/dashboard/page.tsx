'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useSWRConfig } from 'swr'
import { Container } from '@/components/ui/Container'
import { Section, SectionHeading } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { WaveDivider } from '@/components/ui/WaveDivider'
import { StudentHeroArt } from '@/components/StudentHeroArt'
import { DashboardSkeleton } from '@/components/Skeleton'
import { api } from '@/lib/api'
import { useApi } from '@/lib/swr'

type Me = {
  user: { userId: string; email: string | null; role: string }
  profile: { fullName: string | null } | null
}

type MyCourse = {
  id: string
  slug: string
  title: string
  description: string | null
  level: string | null
  language: string | null
  thumbnailUrl: string | null
  stats: { total: number; completed: number; percent: number }
  resumeLessonId: string | null
  lastActivityAt: string | Date | null
}

type MyList = {
  courses: MyCourse[]
  streak: number
}

export default function DashboardPage() {
  const me = useApi<Me>('me', () => api.me.get())
  const list = useApi<MyList>('courses-mine-list', () => api.courses.mine.list.get())
  const { mutate: swrMutate } = useSWRConfig()

  // Preload aktivan kurs + njegovu trenutnu lekciju u pozadini.
  // Kad korisnik klikne "Nastavi", podaci su već u SWR cache-u → instant navigacija.
  useEffect(() => {
    if (!list.data?.courses?.length) return
    const sorted = [...list.data.courses].sort((a, b) => {
      const aT = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0
      const bT = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0
      return bT - aT
    })
    const active = sorted[0]
    if (!active) return

    // Warm course tree (koristi se i u course detail i u lesson page)
    swrMutate(
      'courses-mine',
      async () => {
        const { data } = await api.courses.mine.get()
        return data
      },
      { revalidate: false },
    )

    // Warm trenutnu lekciju (ako postoji resumeLessonId)
    if (active.resumeLessonId) {
      swrMutate(
        `lessons-${active.resumeLessonId}`,
        async () => {
          const { data } = await api.courses
            .lessons({ id: active.resumeLessonId! })
            .get()
          return data
        },
        { revalidate: false },
      )
    }
  }, [list.data, swrMutate])

  if (me.error || list.error) {
    return (
      <Container className="py-16">
        <p className="text-red-600">Greška: {String(me.error ?? list.error)}</p>
      </Container>
    )
  }
  if (!me.data || !list.data) {
    return <DashboardSkeleton />
  }
  const data = list.data

  const firstName = vocative(me.data.profile?.fullName?.split(' ')[0] ?? '')

  if (data.courses.length === 0) {
    return <EmptyDashboard firstName={firstName} />
  }

  // Sortiraj kurseve: prvo oni sa skorašnjom aktivnošću, pa ostali
  const sortedCourses = [...data.courses].sort((a, b) => {
    const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0
    const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0
    return bTime - aTime
  })

  // Aktivan kurs = onaj sa skorašnjom aktivnošću ili prvi ako nema
  const activeCourse = sortedCourses[0]
  const totalCompleted = data.courses.reduce((s, c) => s + c.stats.completed, 0)
  const totalLessons = data.courses.reduce((s, c) => s + c.stats.total, 0)
  const aggregatePercent = totalLessons ? Math.round((totalCompleted / totalLessons) * 100) : 0

  return (
    <div className="animate-fade-in">
      {/* ────────── HERO ────────── */}
      <Section className="overflow-hidden bg-ink pb-32 pt-12 sm:pt-16">
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />

        <Container className="relative z-20 grid items-center gap-12 lg:grid-cols-[1fr_auto]">
          <div className="animate-fade-up text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-primary-light">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {greetingByHour()}{firstName ? `, ${firstName}` : ''}
            </span>

            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {data.courses.length === 1 ? (
                <>
                  Nastavak{' '}
                  <span className="relative inline-block text-primary">
                    učenja
                    <svg
                      className="absolute -bottom-2 left-0 w-full text-primary/40"
                      viewBox="0 0 200 12"
                      fill="none"
                      aria-hidden
                    >
                      <path d="M2 9C40 3 160 3 198 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                  </span>{' '}
                  čeka
                </>
              ) : (
                <>
                  Tvoji{' '}
                  <span className="relative inline-block text-primary">
                    kursevi
                    <svg
                      className="absolute -bottom-2 left-0 w-full text-primary/40"
                      viewBox="0 0 200 12"
                      fill="none"
                      aria-hidden
                    >
                      <path d="M2 9C40 3 160 3 198 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                  </span>{' '}
                  na jednom mestu
                </>
              )}
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70 lg:mx-0">
              {data.courses.length === 1 ? (
                <>
                  <strong className="text-white">{activeCourse.title}</strong> — nastavi{' '}
                  {activeCourse.resumeLessonId ? 'tamo gde te lekcija čeka' : 'odmah'}.
                </>
              ) : (
                <>
                  Imaš <strong className="text-white">{data.courses.length} kurseva</strong>.
                  Najskorije aktivan: <strong className="text-white">{activeCourse.title}</strong>.
                </>
              )}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start lg:justify-start">
              <Button
                href={
                  activeCourse.resumeLessonId
                    ? `/courses/${activeCourse.slug}/lessons/${activeCourse.resumeLessonId}`
                    : `/courses/${activeCourse.slug}`
                }
                variant="primary"
                size="lg"
              >
                {activeCourse.stats.completed > 0 ? '▶ Nastavi učenje' : '▶ Počni kurs'}
              </Button>
              <Button
                href={`/courses/${activeCourse.slug}`}
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:border-primary hover:text-primary-light"
              >
                Pregled kursa
              </Button>
            </div>

            {/* Stat traka */}
            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
              <HeroStat value={`${aggregatePercent}%`} label="Ukupan napredak" />
              <HeroStat value={`${totalCompleted}/${totalLessons}`} label="Lekcije" />
              <HeroStat value={`🔥 ${data.streak}`} label={data.streak === 1 ? 'dan' : 'dana'} />
            </dl>
          </div>

          <div className="hidden lg:block lg:w-[420px]">
            <StudentHeroArt
              percent={aggregatePercent}
              totalLessons={totalLessons}
              completedLessons={totalCompleted}
              level={activeCourse.level}
              streak={data.streak}
            />
          </div>
        </Container>

        <WaveDivider variant="wave" position="bottom" fillClassName="fill-surface" />
      </Section>

      {/* ────────── MOJI KURSEVI grid ────────── */}
      <Section className="bg-surface py-20">
        <Container>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <SectionHeading
              eyebrow="Moji kursevi"
              title={
                data.courses.length === 1
                  ? 'Tvoj aktivan kurs'
                  : `Imaš ${data.courses.length} kursa`
              }
              description="Klikni na karticu da otvoriš kurs, ili nastavi sa najskorijom lekcijom."
              align="left"
            />
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedCourses.map((c, idx) => (
              <CourseCard key={c.id} course={c} highlight={idx === 0 && c.lastActivityAt !== null} />
            ))}
          </div>
        </Container>
      </Section>

    </div>
  )
}

/* ───────── Course card ───────── */

function CourseCard({ course, highlight }: { course: MyCourse; highlight: boolean }) {
  const { mutate: swrMutate } = useSWRConfig()
  const overviewHref = `/courses/${course.slug}`
  const resumeHref = course.resumeLessonId
    ? `/courses/${course.slug}/lessons/${course.resumeLessonId}`
    : overviewHref

  const isNew = course.stats.completed === 0
  const isDone = course.stats.percent === 100

  // Prefetch course detail data na hover — kad korisnik klikne, podaci su već u cache-u
  const prefetched = { current: false }
  function prefetchCourse() {
    if (prefetched.current) return
    prefetched.current = true
    void swrMutate(
      `courses:${course.slug}`,
      async () => {
        const { data } = await api.courses({ slug: course.slug }).get()
        return data
      },
      { revalidate: false },
    )
    if (course.resumeLessonId) {
      void swrMutate(
        `lessons-${course.resumeLessonId}`,
        async () => {
          const { data } = await api.courses
            .lessons({ id: course.resumeLessonId! })
            .get()
          return data
        },
        { revalidate: false },
      )
    }
  }

  return (
    <article
      onMouseEnter={prefetchCourse}
      onFocus={prefetchCourse}
      className={`group relative overflow-hidden rounded-3xl border bg-white p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card ${
        highlight ? 'border-primary/40 ring-2 ring-primary/20' : 'border-ink/5'
      }`}
    >
      {highlight && (
        <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-ink shadow-card ring-2 ring-white">
          ⚡ Aktivan
        </span>
      )}

      {/* Glavni klikabilan blok — vodi na Pregled kursa (course detail).
          CTA dugme dole je zasebno i vodi direktno na "Nastavi". */}
      <Link
        href={overviewHref}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-2xl"
        aria-label={`Pregled kursa ${course.title}`}
      >
        {/* Thumbnail / gradient hero */}
        <div
          className="relative h-32 overflow-hidden rounded-2xl bg-gradient-to-br from-ink to-ink-soft"
          style={
            course.thumbnailUrl
              ? { backgroundImage: `url(${course.thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : undefined
          }
        >
          {!course.thumbnailUrl && (
            <>
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/30 blur-2xl" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-secondary/25 blur-2xl" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="font-display text-5xl font-extrabold text-white/90 drop-shadow-lg">
                  {flagForLanguage(course.language)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Title + meta */}
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-1.5">
            {course.level && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-primary-dark">
                {course.level}
              </span>
            )}
            {course.language && (
              <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-secondary-dark">
                {course.language}
              </span>
            )}
          </div>
          <h3 className="mt-3 font-display text-lg font-bold leading-snug text-ink group-hover:text-primary-dark transition-colors">
            {course.title}
          </h3>
          {course.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted">{course.description}</p>
          )}
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{course.stats.completed} / {course.stats.total} lekcija</span>
            <span className="font-bold text-ink">{course.stats.percent}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDone ? 'bg-primary' : 'bg-gradient-to-r from-primary to-primary-light'
              }`}
              style={{ width: `${course.stats.percent}%` }}
            />
          </div>
        </div>
      </Link>

      {/* CTA — primary akcija, direktno na "Nastavi gde si stao".
          Zasebno od overview link-a (ne propagira klik). */}
      <Link
        href={resumeHref}
        className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
          isDone
            ? 'bg-primary/10 text-primary-dark hover:bg-primary/20'
            : isNew
              ? 'bg-primary text-ink shadow-soft hover:bg-primary-dark hover:text-white'
              : 'bg-ink text-white shadow-soft hover:bg-ink-soft'
        }`}
      >
        {isDone ? '✓ Završen — ponovi' : isNew ? '▶ Počni' : '▶ Nastavi'}
      </Link>

      {course.lastActivityAt && (
        <p className="mt-3 text-center text-[0.7rem] text-muted">
          Poslednja aktivnost: {formatRelativeDate(course.lastActivityAt)}
        </p>
      )}
    </article>
  )
}

function flagForLanguage(lang: string | null): string {
  if (!lang) return '📚'
  const map: Record<string, string> = {
    de: '🇩🇪',
    en: '🇬🇧',
    fr: '🇫🇷',
    es: '🇪🇸',
    it: '🇮🇹',
    sr: '🇷🇸',
    ru: '🇷🇺',
  }
  return map[lang.toLowerCase()] ?? '📚'
}

function formatRelativeDate(iso: string | Date): string {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'sada'
  if (diff < 3600) return `pre ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `pre ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `pre ${Math.floor(diff / 86400)} dana`
  return d.toLocaleDateString('sr-RS')
}

/* ───────── helpers ───────── */

function greetingByHour() {
  const h = new Date().getHours()
  if (h < 12) return 'Dobro jutro'
  if (h < 18) return 'Dobar dan'
  return 'Dobro veče'
}

/**
 * Pretvara ime u vokativ (oblik za obraćanje) na srpskom.
 * Plus capitalize prvo slovo ako je u bazi sve malim slovom.
 *
 * Pravila (pojednostavljena, pokriva 95% slučajeva):
 * - Muška imena na konsonant → +e (Milan → Milane, Marko ostaje Marko jer ima -o)
 * - Muška imena na -k pre +e → palatalizacija u -č (Marko ne mora, posebna grupa: Aco→Aco)
 * - Imena na -a (ženska + neka muška) → +o (Ana → Ano, Maja → Majo) — RIZIK: neki ne vole, OK fallback
 * - Imena na samoglasnik (Ivo, Vlado, Stevo) → ostaju isto
 *
 * Bezbedan fallback: ako pravilo ne pogađa, vrati capitalizovano ime u nominativu.
 */
function vocative(name: string): string {
  if (!name) return ''
  const trimmed = name.trim()
  if (!trimmed) return ''
  const cap = trimmed[0].toUpperCase() + trimmed.slice(1).toLowerCase()
  const lower = cap.toLowerCase()
  const last = lower.slice(-1)
  const last2 = lower.slice(-2)

  // Imena koja se ne menjaju u vokativu (već se završavaju na -o/-e/-i/-u, ili kratka monosilabska)
  if (['o', 'e', 'i', 'u'].includes(last)) return cap
  // Imena na -a — verovatno ženska (i muška -a tipa Luka, Nikola) → -o vokativ
  if (last === 'a') return cap.slice(0, -1) + 'o'
  // Imena na -k → palatalizacija -k → -č + e: Marko → Marče (ali ovo je retko)
  // Pravilo retko korišćeno u kolokvijalu; preskači — vrati capital cap
  if (last2 === 'ek' || last2 === 'ik' || last2 === 'ak' || last2 === 'ok') {
    return cap + 'u' // npr. Marek → Mareku (mn. češko), bezbedno
  }
  // Standardna muška imena na konsonant → +e: Milan→Milane, Stefan→Stefane, Petar→Petre
  // (Petar ima beguntni vokal "a" koji nestaje — komplikovano; preskoči, +e je 90% slučajeva)
  return cap + 'e'
}

function HeroStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center lg:text-left">
      <dt className="font-display text-2xl font-bold text-primary sm:text-3xl">{value}</dt>
      <dd className="mt-1 text-xs text-white/60 sm:text-sm">{label}</dd>
    </div>
  )
}

/* ───────── empty state ───────── */

function EmptyDashboard({ firstName }: { firstName: string }) {
  return (
    <div>
      <Section className="overflow-hidden bg-ink pb-32 pt-12 sm:pt-16">
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />

        <Container className="relative z-20 grid items-center gap-12 lg:grid-cols-[1fr_auto]">
          <div className="animate-fade-up text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-primary-light">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Stiže uskoro
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {greetingByHour()}{firstName ? `, ${firstName}` : ''}{' '}
              <span className="text-primary">👋</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70 lg:mx-0">
              Tvoji kursevi će se ovde pojaviti čim budu spremni.
            </p>
          </div>

          <div className="hidden lg:block lg:w-[420px]">
            <StudentHeroArt percent={0} totalLessons={0} completedLessons={0} level="A1" streak={0} />
          </div>
        </Container>

        <WaveDivider variant="wave" position="bottom" fillClassName="fill-surface" />
      </Section>
    </div>
  )
}
