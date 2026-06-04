'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Container } from '@/components/ui/Container'
import { Section, SectionHeading } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { WaveDivider } from '@/components/ui/WaveDivider'
import { StudentHeroArt } from '@/components/StudentHeroArt'
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
  title: string
  slug: string
  description: string | null
  level: string | null
  language: string | null
  modules: ModuleRow[]
}
type Me = {
  user: { userId: string; email: string | null; role: string }
  profile: { fullName: string | null } | null
}
type MineResp = {
  course: Course | null
  stats?: { total: number; completed: number; percent: number }
  resumeLessonId?: string | null
}

const STREAK = 1 // TODO: računaj iz lessonProgress.lastViewedAt — Faza 5

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null)
  const [data, setData] = useState<MineResp | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.me.get().then(({ data, error }) => {
      if (error) setError(String(error.value ?? error.status))
      else setMe(data as Me)
    })
    api.courses.mine.get().then(({ data, error }) => {
      if (error) setError(String(error.value ?? error.status))
      else setData(data as MineResp)
    })
  }, [])

  if (error) {
    return (
      <Container className="py-16">
        <p className="text-red-600">Greška: {error}</p>
      </Container>
    )
  }
  if (!me || !data) {
    return (
      <Container className="py-16">
        <p className="text-muted">Učitavanje…</p>
      </Container>
    )
  }

  const firstName = me.profile?.fullName?.split(' ')[0] ?? ''
  const course = data.course

  if (!course) return <EmptyDashboard firstName={firstName} />

  const stats = data.stats ?? { total: 0, completed: 0, percent: 0 }
  const resumeHref = data.resumeLessonId
    ? `/courses/${course.slug}/lessons/${data.resumeLessonId}`
    : `/courses/${course.slug}`

  const allLessons = course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title })))
  const totalMinutes = allLessons.reduce((s, l) => s + (l.durationSeconds ?? 0), 0) / 60
  const completedMinutes = allLessons.filter((l) => l.completed).reduce((s, l) => s + (l.durationSeconds ?? 0), 0) / 60
  const upNext = allLessons.filter((l) => !l.completed).slice(0, 3)

  return (
    <div>
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
              Nastavi{' '}
              <span className="relative inline-block text-primary">
                tamo
                <svg
                  className="absolute -bottom-2 left-0 w-full text-primary/40"
                  viewBox="0 0 200 12"
                  fill="none"
                  aria-hidden
                >
                  <path d="M2 9C40 3 160 3 198 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>{' '}
              gde si stao
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70 lg:mx-0">
              <strong className="text-white">{course.title}</strong> — {course.description ?? `Tvoj ${course.level ?? ''} kurs jezika.`}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start lg:justify-start">
              <Button href={resumeHref} variant="primary" size="lg">
                {stats.completed > 0 ? '▶ Nastavi gde si stao' : '▶ Počni kurs'}
              </Button>
              <Button
                href={`/courses/${course.slug}`}
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:border-primary hover:text-primary-light"
              >
                Sve lekcije
              </Button>
            </div>

            {/* Stat traka */}
            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
              <HeroStat value={`${stats.percent}%`} label="Napretka" />
              <HeroStat value={`${stats.completed}/${stats.total}`} label="Lekcije" />
              <HeroStat value={`${Math.round(completedMinutes)}m`} label="Učeno" />
            </dl>
          </div>

          {/* Hero art sa plivajućim chipovima */}
          <div className="hidden lg:block lg:w-[420px]">
            <StudentHeroArt
              percent={stats.percent}
              totalLessons={stats.total}
              completedLessons={stats.completed}
              level={course.level}
              streak={STREAK}
            />
          </div>
        </Container>

        <WaveDivider variant="wave" position="bottom" fillClassName="fill-surface" />
      </Section>

      {/* ────────── STATS GRID ────────── */}
      <Section className="bg-surface py-20">
        <Container>
          <SectionHeading
            eyebrow="Tvoj progress"
            title="Pregled za danas"
            description="Kratak pregled tvog napretka — drži se ritma i niz raste."
            align="left"
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <BigStatCard icon="🔥" value={STREAK} label="dana zaredom" hint="Niz ne prekidaj!" accent="primary" />
            <BigStatCard icon="✓" value={stats.completed} label={`od ${stats.total} lekcija`} hint={`${stats.percent}% kursa`} accent="secondary" />
            <BigStatCard icon="⏱" value={`${Math.round(completedMinutes)}m`} label={`od ≈ ${Math.round(totalMinutes)}m ukupno`} hint="vreme učenja" accent="primary" />
            <BigStatCard icon="🎯" value={course.level ?? '—'} label="trenutni CEFR" hint={course.language?.toUpperCase() ?? ''} accent="secondary" />
          </div>
        </Container>
      </Section>

      {/* ────────── UP NEXT (samo ako ima šta) ────────── */}
      {upNext.length > 0 && (
        <Section className="bg-white py-20">
          <Container>
            <SectionHeading
              eyebrow="Sledeće na redu"
              title="Tvoja sledeća tri koraka"
              description="Tačno tamo gde si stao. Kreni sa prvom."
              align="left"
            />

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {upNext.map((l, idx) => (
                <Link
                  key={l.id}
                  href={`/courses/${course.slug}/lessons/${l.id}`}
                  className="group relative overflow-hidden rounded-3xl border border-ink/5 bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
                >
                  <div
                    className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl transition-opacity ${
                      idx === 0 ? 'bg-primary/20' : idx === 1 ? 'bg-secondary/15' : 'bg-primary/15'
                    } opacity-60 group-hover:opacity-100`}
                  />
                  <div className="relative">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                      <span>Korak {idx + 1}</span>
                      <span>·</span>
                      <TypeBadge type={l.type} />
                    </div>
                    <h3 className="mt-4 font-display text-xl font-bold leading-snug text-ink">{l.title}</h3>
                    <p className="mt-2 text-sm text-muted">{l.moduleTitle}</p>

                    <div className="mt-6 flex items-center justify-between text-sm">
                      <span className="text-muted">
                        {l.durationSeconds ? `≈ ${Math.round(l.durationSeconds / 60)} min` : 'kratko'}
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-primary-dark transition-transform group-hover:translate-x-1">
                        Otvori <span>→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ────────── MODULE PATH (ink section, sa talasima sa obe strane) ────────── */}
      <Section className="overflow-hidden bg-ink py-24">
        <WaveDivider variant="wave-soft" position="top" fillClassName="fill-white" />
        <div className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-32 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" />

        <Container className="relative z-10">
          <SectionHeading
            eyebrow="Putanja kursa"
            title="Tvoja avantura kroz kurs"
            description="Svaki modul je korak ka tvom cilju. Idi redom, ne preskači."
            align="left"
            light
          />

          <div className="mt-14 relative">
            {/* Vertikalna linija u pozadini */}
            <div className="pointer-events-none absolute left-7 top-7 h-[calc(100%-3.5rem)] w-px bg-gradient-to-b from-primary/40 via-white/10 to-secondary/40 sm:left-9" />

            <div className="space-y-4">
              {course.modules.map((m, mIdx) => {
                const done = m.lessons.filter((l) => l.completed).length
                const total = m.lessons.length
                const pct = total ? Math.round((done / total) * 100) : 0
                const isComplete = pct === 100
                const inProgress = pct > 0 && !isComplete
                return (
                  <Link
                    key={m.id}
                    href={`/courses/${course.slug}`}
                    className="group relative flex items-center gap-5 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/10 sm:gap-6"
                  >
                    <div
                      className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-xl font-extrabold shadow-card transition-transform group-hover:scale-110 sm:h-[4.5rem] sm:w-[4.5rem] sm:text-2xl ${
                        isComplete
                          ? 'bg-primary text-ink'
                          : inProgress
                            ? 'bg-gradient-to-br from-primary to-primary-dark text-ink'
                            : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {isComplete ? '✓' : mIdx + 1}
                      {inProgress && (
                        <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse-soft rounded-full bg-primary shadow-[0_0_12px] shadow-primary/80" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-white">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary-light">
                        Modul {mIdx + 1}
                      </p>
                      <h3 className="mt-0.5 truncate font-display text-lg font-bold">{m.title}</h3>
                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs font-bold text-white/80">
                          {done}/{total}
                        </span>
                      </div>
                    </div>
                    <span className="hidden text-white/40 group-hover:text-primary-light sm:inline">→</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </Container>

        <WaveDivider variant="wave" position="bottom" fillClassName="fill-white" />
      </Section>

      {/* ────────── AI ASISTENT CTA ────────── */}
      <Section className="bg-white py-24">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary/10 via-white to-primary/10 p-10 sm:p-14">
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-secondary/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-primary/20 blur-2xl" />

            <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary-dark">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  AI asistent
                </span>
                <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
                  Zapeo si na lekciji? Pitaj asistenta.
                </h2>
                <p className="mt-4 max-w-lg leading-relaxed text-muted">
                  AI asistent zna kontekst lekcije, ispravlja gramatiku i objašnjava reči.
                  Dostupan ti je 24/7 — kao tutor u džepu.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button href="/ai" variant="secondary" size="lg">
                    Otvori AI asistenta
                  </Button>
                  <Button href={resumeHref} variant="ghost" size="lg">
                    Vrati se na lekciju
                  </Button>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="relative">
                  {/* Lažni chat preview */}
                  <div className="relative space-y-3 rounded-2xl border border-ink/5 bg-white p-5 shadow-card">
                    <div className="flex items-start gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary/15 text-secondary-dark font-bold">
                        T
                      </div>
                      <div className="rounded-2xl rounded-tl-sm bg-surface px-4 py-2.5 text-sm text-ink">
                        Kako se kaže &quot;da li bih mogla&quot; na nemačkom?
                      </div>
                    </div>
                    <div className="flex items-start gap-3 flex-row-reverse">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary-dark font-bold">
                        AI
                      </div>
                      <div className="rounded-2xl rounded-tr-sm bg-primary/10 px-4 py-2.5 text-sm text-ink">
                        <strong>Könnte ich…</strong> ✨ <br />
                        Konjugacija: ich könnte, du könntest…
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary/15 text-secondary-dark font-bold">
                        T
                      </div>
                      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-surface px-4 py-3">
                        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-ink/40" />
                        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-ink/40" style={{ animationDelay: '0.2s' }} />
                        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-ink/40" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  )
}

/* ─── helpers ─── */

function greetingByHour() {
  const h = new Date().getHours()
  if (h < 12) return 'Dobro jutro'
  if (h < 18) return 'Dobar dan'
  return 'Dobro veče'
}

function HeroStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center lg:text-left">
      <dt className="font-display text-2xl font-bold text-primary sm:text-3xl">{value}</dt>
      <dd className="mt-1 text-xs text-white/60 sm:text-sm">{label}</dd>
    </div>
  )
}

function BigStatCard({
  icon,
  value,
  label,
  hint,
  accent,
}: {
  icon: string
  value: string | number
  label: string
  hint?: string
  accent: 'primary' | 'secondary'
}) {
  const dotCls = accent === 'primary' ? 'bg-primary' : 'bg-secondary'
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-ink/5 bg-white p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-60 ${dotCls}`} />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-surface text-xl shadow-soft ring-1 ring-ink/5">
            {icon}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-muted">{label.split(' ')[0]}</span>
        </div>
        <p className="mt-4 font-display text-4xl font-extrabold text-ink">{value}</p>
        <p className="mt-1 text-sm text-muted">{label}</p>
        {hint && <p className="mt-2 text-xs font-semibold text-primary-dark">{hint}</p>}
      </div>
    </div>
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

/* ─── empty state — kad nema kursa, raskošan ali bez podataka ─── */

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
              Tvoj kurs se priprema. Čim sadržaj bude spreman, vidiš ga ovde i možeš da kreneš.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              <Feature>Video lekcije sa transkriptom</Feature>
              <Feature>Interaktivne vežbe sa proverom</Feature>
              <Feature>AI asistent za sva pitanja</Feature>
              <Feature>Praćenje napretka i niza</Feature>
            </ul>
          </div>

          <div className="hidden lg:block lg:w-[420px]">
            <StudentHeroArt percent={0} totalLessons={0} completedLessons={0} level="A1" streak={0} />
          </div>
        </Container>

        <WaveDivider variant="wave" position="bottom" fillClassName="fill-surface" />
      </Section>

      <Section className="bg-surface py-20">
        <Container>
          <SectionHeading
            eyebrow="Šta te očekuje"
            title="Sve što ti treba za savladavanje jezika"
            description="Spiko Edu kombinuje video, tekst, vežbu i AI tutora u jedan glatki tok."
            align="center"
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <PreviewCard icon="📺" title="Video lekcije" desc="Native speaker objašnjava temu, sa transkriptom i pauzama." />
            <PreviewCard icon="✎" title="Interaktivne vežbe" desc="4 tipa: multiple choice, popuni prazninu, uparivanje, redosled." />
            <PreviewCard icon="🤖" title="AI asistent" desc="Pita ga sve što ti je nejasno — zna kontekst tvoje lekcije." />
          </div>
        </Container>
      </Section>
    </div>
  )
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-sm text-white/85">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-ink">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  )
}

function PreviewCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-ink/5 bg-white p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-3xl shadow-soft ring-1 ring-ink/5">
          {icon}
        </div>
        <h3 className="mt-5 font-display text-xl font-bold text-ink">{title}</h3>
        <p className="mt-3 leading-relaxed text-muted">{desc}</p>
      </div>
    </div>
  )
}
