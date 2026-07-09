'use client'

import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { api } from '@/lib/api'
import { useApi } from '@/lib/swr'
import { ProgressSkeleton } from '@/components/Skeleton'
import { computeAchievements } from '@/lib/achievements'

type ProgressData = {
  streak: number
  bestStreak: number
  totals: {
    lessonsCompleted: number
    totalLessons: number
    percent: number
    activeDays: number
    exercisesSolved: number
    exercisesAttempted: number
  }
  heatmap: Array<{ day: string; count: number }>
  timeline: Array<{
    kind: 'lesson_completed' | 'lesson_viewed' | 'exercise_correct' | 'exercise_wrong'
    at: string | Date
    title: string
    subtitle: string
    href: string | null
  }>
  exerciseStats: Array<{
    type: string
    total: number
    correct: number
    accuracy: number
    avgScore: number
  }>
  hardestExercises: Array<{
    id: string
    title: string
    type: string
    attempts: number
    accuracy: number
    href: string | null
  }>
}

/** Mini-tip za per-course progres unutar Ritam kartice. Ista SWR ključ kao dashboard
 *  ('courses-mine-list') — cache se deli, nema duplog fetch-a. */
type CourseSummary = {
  id: string
  slug: string
  title: string
  language: string | null
  stats: { total: number; completed: number; percent: number }
}
type CoursesListResp = { courses: CourseSummary[]; streak: number }

export default function ProgressPage() {
  const q = useApi<ProgressData>(
    'progress-stats',
    () => api.progress.stats.get(),
    {
      // Real-time stats — revalidiraj na mount ali prikaži keširane podatke
      // dok stignu novi (sprečava skeleton flash).
      revalidateOnMount: true,
      keepPreviousData: true,
    },
  )

  // Per-course progres za Ritam karticu — isti SWR ključ kao dashboard,
  // pa cache se deli (instant prikaz ako je korisnik prošao kroz dashboard).
  const coursesList = useApi<CoursesListResp>(
    'courses-mine-list',
    () => api.courses.mine.list.get(),
  )

  if (q.error) {
    return (
      <Container className="py-16">
        <p className="text-red-600">Greška: {String(q.error)}</p>
      </Container>
    )
  }
  if (!q.data) {
    return <ProgressSkeleton />
  }
  const data = q.data
  const courses = coursesList.data?.courses ?? null

  return (
    <div className="bg-surface pb-20 animate-fade-in">
      <Container className="py-10">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Tvoj napredak</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold text-ink sm:text-5xl">
          Statistika učenja
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Sve tvoje aktivnosti, kalendar konzistentnosti, performanse po tipu vežbe i
          šta ti je najteže.
        </p>

        {/* ─── Stats row ─── */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon="🔥"
            label="Trenutni niz"
            value={data.streak}
            unit={pluralDay(data.streak)}
            subtitle={data.streak > 0 ? 'zaredom' : 'pokreni novi niz'}
            highlight={data.streak > 0}
          />
          <StatCard
            icon="🏆"
            label="Najduži niz"
            value={data.bestStreak}
            unit={pluralDay(data.bestStreak)}
            subtitle="ikada"
          />
          <StatCard
            icon="✓"
            label="Završene lekcije"
            value={data.totals.lessonsCompleted}
            unit={`od ${data.totals.totalLessons}`}
            subtitle={`${data.totals.percent}% kursa završeno`}
          />
          <StatCard
            icon="✎"
            label="Vežbi rešeno"
            value={data.totals.exercisesSolved}
            unit={pluralExercise(data.totals.exercisesSolved)}
            subtitle={
              data.totals.exercisesAttempted > 0
                ? `od ${data.totals.exercisesAttempted} pokušaja (${Math.round((data.totals.exercisesSolved / data.totals.exercisesAttempted) * 100)}% tačno)`
                : 'kreni sa prvom vežbom'
            }
          />
        </div>

        {/* ─── Achievements ─── */}
        {(() => {
          const achievements = computeAchievements({
            streak: data.streak,
            bestStreak: data.bestStreak,
            lessonsCompleted: data.totals.lessonsCompleted,
            totalLessons: data.totals.totalLessons,
            exercisesSolved: data.totals.exercisesSolved,
            activeDays: data.totals.activeDays,
          })
          const unlocked = achievements.filter((a) => a.unlocked)
          return (
            <section className="mt-10 rounded-3xl border border-ink/5 bg-white p-6 shadow-soft sm:p-8">
              <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">Achievements</h2>
                  <p className="mt-1 text-sm text-muted">
                    Otključano: {unlocked.length} od {achievements.length} značaka.
                  </p>
                </div>
              </header>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {achievements.map((a) => (
                  <AchievementCard key={a.id} a={a} />
                ))}
              </div>
            </section>
          )
        })()}

        {/* ─── Week Pulse ─── */}
        <WeekPulseSection heatmap={data.heatmap} streak={data.streak} bestStreak={data.bestStreak} />

        {/* ─── Exercise stats ─── */}
        {data.exerciseStats.length > 0 && (
          <section className="mt-10 rounded-3xl border border-ink/5 bg-white p-6 shadow-soft sm:p-8">
            <h2 className="font-display text-xl font-bold text-ink">Performanse po tipu vežbe</h2>
            <p className="mt-1 text-sm text-muted">Tačnost preko svih pokušaja.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.exerciseStats.map((s) => (
                <ExerciseTypeCard key={s.type} stat={s} />
              ))}
            </div>
          </section>
        )}

        {/* ─── Profil učenja — radar po tipu vežbe + ritam tempa ─── */}
        <ProfilPanel data={data} courses={courses} />
      </Container>
    </div>
  )
}

/* ════════ COMPONENTS ════════ */

function StatCard({
  icon,
  label,
  value,
  unit,
  subtitle,
  highlight,
}: {
  icon: string
  label: string
  value: string | number
  unit?: string
  subtitle?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border bg-white p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card ${
        highlight ? 'border-primary/30 ring-2 ring-primary/20' : 'border-ink/5'
      }`}
    >
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl ${highlight ? 'bg-primary/30' : 'bg-primary/10'}`} />
      <div className="relative">
        {/* Eyebrow: icon + label */}
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">
            {label}
          </span>
        </div>

        {/* Big value sa unitom inline */}
        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="font-display text-5xl font-extrabold leading-none text-ink">
            {value}
          </span>
          {unit && (
            <span className="font-display text-base font-semibold text-muted">
              {unit}
            </span>
          )}
        </div>

        {subtitle && <p className="mt-2 text-xs text-muted">{subtitle}</p>}
      </div>
    </div>
  )
}

/** "1 dan" / "2 dana" / "5 dana" — pravilan padež za broj dana */
function pluralDay(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'dan'
  return 'dana'
}

/* ───── Achievement card ───── */

type AchievementInfo = {
  id: string
  title: string
  desc: string
  emoji: string
  color: 'primary' | 'secondary' | 'gold' | 'fire'
  unlocked: boolean
  progress: number
  current: number
  target: number
}

function AchievementCard({ a }: { a: AchievementInfo }) {
  const bgClass = a.unlocked
    ? a.color === 'gold'
      ? 'bg-gradient-to-br from-yellow-100 to-amber-50 border-amber-300'
      : a.color === 'fire'
        ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
        : a.color === 'secondary'
          ? 'bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/30'
          : 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary/30'
    : 'bg-surface border-ink/5'

  const emojiOpacity = a.unlocked ? '' : 'opacity-30 grayscale'
  const textColor = a.unlocked ? 'text-ink' : 'text-ink/50'

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${bgClass} ${
        a.unlocked ? 'hover:-translate-y-1 hover:shadow-card' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`text-4xl ${emojiOpacity}`}>{a.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className={`font-display text-sm font-bold ${textColor}`}>{a.title}</p>
          <p className={`mt-0.5 text-xs ${a.unlocked ? 'text-ink/65' : 'text-muted'}`}>{a.desc}</p>
        </div>
        {a.unlocked && (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs text-white">
            ✓
          </span>
        )}
      </div>
      {!a.unlocked && a.target > 0 && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-primary/60 transition-all duration-500"
              style={{ width: `${Math.round(a.progress * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[0.7rem] text-muted">
            {a.current} / {a.target}
          </p>
        </div>
      )}
    </div>
  )
}

/** "1 vežba" / "2 vežbe" / "5 vežbi" */
function pluralExercise(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'vežba'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'vežbe'
  return 'vežbi'
}

/* ─── Week Pulse — replaces yearly heatmap ─── */

const WEEKDAYS_FULL = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned']

function formatDay(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Normalizuje Date ili string u "YYYY-MM-DD" string ključ (UTC). */
function normalizeDay(value: string | Date): string {
  if (value instanceof Date) return formatDay(value)
  // String — može biti već "YYYY-MM-DD" ili ISO; uzmi prvih 10 karaktera
  return String(value).slice(0, 10)
}

function WeekPulseSection({
  heatmap,
  streak,
  bestStreak,
}: {
  heatmap: Array<{ day: string | Date; count: number }>
  streak: number
  bestStreak: number
}) {
  // Eden/Elysia ponekad auto-parsuje ISO-like stringove u Date objekte.
  // Normalizujemo svaki ključ u "YYYY-MM-DD" string pre nego što napravimo mapu.
  const counts = new Map<string, number>(
    heatmap.map((d) => [normalizeDay(d.day), d.count]),
  )
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayDow = (today.getUTCDay() + 6) % 7
  const todayStr = formatDay(today)

  // Trenutna nedelja Pon-Ned
  const week: Array<{ date: string; dow: number; count: number; isToday: boolean; isFuture: boolean }> = []
  const monStart = new Date(today)
  monStart.setUTCDate(monStart.getUTCDate() - todayDow)
  for (let i = 0; i < 7; i++) {
    const d = new Date(monStart)
    d.setUTCDate(d.getUTCDate() + i)
    const key = formatDay(d)
    week.push({
      date: key,
      dow: i,
      count: counts.get(key) ?? 0,
      isToday: key === todayStr,
      isFuture: d.getTime() > today.getTime(),
    })
  }

  // Poslednjih 30 dana (5 redova × 6 kolona) — mali sat-style mini grid
  const last30: Array<{ date: string; count: number; isToday: boolean }> = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    const key = formatDay(d)
    last30.push({
      date: key,
      count: counts.get(key) ?? 0,
      isToday: key === todayStr,
    })
  }

  const todayCount = counts.get(todayStr) ?? 0
  const activeDaysThisWeek = week.filter((d) => !d.isFuture && d.count > 0).length
  const activeDaysLast30 = last30.filter((d) => d.count > 0).length
  const max = Math.max(1, ...week.map((d) => d.count))

  return (
    <section className="mt-10 grid gap-5 lg:grid-cols-3">
      {/* LEVO — velika kartica "Tvoja nedelja" */}
      <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft sm:p-8 lg:col-span-2">
        <header className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Tvoja nedelja</h2>
            <p className="mt-1 text-sm text-muted">
              {activeDaysThisWeek === 0
                ? 'Još nije bilo aktivnosti ove nedelje — počni danas.'
                : `Aktivna ${activeDaysThisWeek} ${pluralDay(activeDaysThisWeek)} ove nedelje.`}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-extrabold text-primary-dark">
              {todayCount}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              {todayCount === 0 ? 'aktivnosti danas' : `${pluralActivity(todayCount)} danas`}
            </p>
          </div>
        </header>

        <div className="mt-7 flex items-end gap-2 sm:gap-4">
          {week.map((d) => {
            const heightPct = d.isFuture ? 0 : (d.count / max) * 100
            const isEmpty = !d.isFuture && d.count === 0
            return (
              <div
                key={d.date}
                className="flex flex-1 flex-col items-center gap-2"
                title={d.isFuture ? '' : `${WEEKDAYS_FULL[d.dow]} ${d.date.slice(8)}.${d.date.slice(5, 7)} · ${d.count} ${pluralActivity(d.count)}`}
              >
                {/* Count above bar (samo ako > 0) */}
                <div className="h-5 text-xs font-bold text-ink/70">
                  {d.count > 0 ? d.count : ''}
                </div>

                {/* Bar */}
                <div
                  className={`relative w-full overflow-hidden rounded-xl transition-all ${
                    d.isFuture
                      ? 'border border-dashed border-ink/10 bg-transparent'
                      : isEmpty
                        ? 'border border-ink/10 bg-ink/5'
                        : ''
                  }`}
                  style={{ height: 140 }}
                >
                  {!d.isFuture && d.count > 0 && (
                    <div
                      className={`absolute bottom-0 left-0 right-0 rounded-xl transition-all duration-700 ease-out ${
                        d.isToday
                          ? 'bg-gradient-to-t from-primary-dark to-primary'
                          : 'bg-gradient-to-t from-primary/80 to-primary/60'
                      }`}
                      style={{ height: `${Math.max(8, heightPct)}%` }}
                    />
                  )}
                  {d.isToday && d.count === 0 && (
                    <div className="absolute inset-x-0 bottom-0 h-2 rounded-xl bg-primary/40" />
                  )}
                </div>

                {/* Day label */}
                <div
                  className={`text-xs ${
                    d.isToday
                      ? 'font-extrabold text-primary-dark'
                      : d.isFuture
                        ? 'text-muted/60'
                        : 'font-semibold text-ink/70'
                  }`}
                >
                  {WEEKDAYS_FULL[d.dow]}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* DESNO — stack 2 kartice */}
      <div className="flex flex-col gap-5">
        {/* Streak kartica */}
        <div className="relative overflow-hidden rounded-3xl border border-ink/5 bg-gradient-to-br from-primary-light/40 via-white to-secondary-light/30 p-6 shadow-soft">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/25 blur-3xl"
          />
          <p className="text-xs font-bold uppercase tracking-wider text-primary-dark">
            Streak
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-5xl font-extrabold text-ink leading-none">
              {streak}
            </span>
            <span className="pb-1 text-xl">{streak >= 30 ? '🐉' : streak >= 7 ? '🚀' : streak > 0 ? '🔥' : '✨'}</span>
          </div>
          <p className="mt-1 text-sm text-ink/70">
            {streak === 0
              ? 'Pokreni svoj prvi niz danas'
              : `${pluralDay(streak)} zaredom`}
          </p>
          {bestStreak > streak && (
            <p className="mt-3 text-xs font-semibold text-muted">
              Rekord: <span className="text-ink">{bestStreak} {pluralDay(bestStreak)}</span>
            </p>
          )}
        </div>

        {/* Poslednjih 30 dana mini */}
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Poslednjih 30 dana
            </p>
            <p className="font-display text-lg font-bold text-ink">
              {activeDaysLast30}<span className="text-sm font-medium text-muted">/30</span>
            </p>
          </div>
          <div className="mt-3 grid grid-cols-10 gap-1">
            {last30.map((d) => {
              const tone =
                d.count === 0
                  ? 'bg-ink/8'
                  : d.count === 1
                    ? 'bg-primary/35'
                    : d.count <= 3
                      ? 'bg-primary/60'
                      : 'bg-primary'
              return (
                <div
                  key={d.date}
                  title={`${d.date} · ${d.count} ${pluralActivity(d.count)}`}
                  className={`aspect-square rounded transition-transform hover:scale-125 ${tone} ${
                    d.isToday ? 'ring-2 ring-secondary ring-offset-1' : ''
                  }`}
                />
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[0.65rem] text-muted">
            <span>Manje</span>
            <div className="h-2.5 w-2.5 rounded bg-ink/8" />
            <div className="h-2.5 w-2.5 rounded bg-primary/35" />
            <div className="h-2.5 w-2.5 rounded bg-primary/60" />
            <div className="h-2.5 w-2.5 rounded bg-primary" />
            <span>Više</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function pluralActivity(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'aktivnost'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'aktivnosti'
  return 'aktivnosti'
}

/* ─── Exercise type cards ─── */

function ExerciseTypeCard({
  stat,
}: {
  stat: { type: string; total: number; correct: number; accuracy: number; avgScore: number }
}) {
  const labels: Record<string, { label: string; icon: string }> = {
    multiple_choice: { label: 'Multiple choice', icon: '◉' },
    fill_blank: { label: 'Popuni prazninu', icon: '✏' },
    matching: { label: 'Uparivanje', icon: '↔' },
    ordering: { label: 'Redosled', icon: '↕' },
  }
  const info = labels[stat.type] ?? { label: stat.type, icon: '•' }
  const good = stat.accuracy >= 70

  return (
    <div className="rounded-2xl border border-ink/5 bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">{info.icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          {info.label}
        </span>
      </div>
      <p className={`mt-3 font-display text-3xl font-extrabold ${good ? 'text-primary-dark' : 'text-ink'}`}>
        {stat.accuracy}%
      </p>
      <p className="mt-1 text-xs text-muted">
        {stat.correct} od {stat.total} pokušaja
      </p>
    </div>
  )
}

/* ─── Hardest exercises ─── */

/* ════════════════════════════════════════════════════════════════════
   Profil učenja — radar po tipu vežbe + ritam tempa
   ════════════════════════════════════════════════════════════════════ */

function ProfilPanel({
  data,
  courses,
}: {
  data: ProgressData
  courses: CourseSummary[] | null
}) {
  return (
    <section className="mt-10 grid gap-6 lg:grid-cols-2">
      <RadarCard stats={data.exerciseStats} />
      <RitamCard data={data} courses={courses} />
    </section>
  )
}

/* ─── Radar: tačnost po tipu vežbe (SVG) ─── */

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Izbor',
  fill_blank: 'Praznine',
  matching: 'Uparivanje',
  ordering: 'Redosled',
}

function RadarCard({ stats }: { stats: ProgressData['exerciseStats'] }) {
  // Trebamo bar 5 pokušaja po tipu da bi tačnost bila smislena
  const eligible = stats
    .filter((s) => s.total >= 5)
    .map((s) => ({
      label: TYPE_LABELS[s.type] ?? s.type,
      type: s.type,
      accuracy: s.accuracy,
      total: s.total,
    }))

  if (eligible.length < 2) {
    return (
      <div className="rounded-3xl border border-ink/5 bg-white p-8 shadow-soft">
        <h2 className="font-display text-xl font-bold text-ink">Šta ti dobro ide</h2>
        <p className="mt-3 text-sm text-muted">
          Treba još malo vežbi da napravimo profil — bar 5 pokušaja po tipu vežbe.
        </p>
        <div className="mt-6 grid h-48 place-items-center rounded-2xl bg-surface text-4xl opacity-40">
          🎯
        </div>
      </div>
    )
  }

  const sorted = [...eligible].sort((a, b) => b.accuracy - a.accuracy)
  const strongest = sorted[0]
  const weakest = sorted[sorted.length - 1]

  // SVG koordinate — viewBox je dovoljno veliki da labele uvek stanu (max ~50px sa
  // strana, ~20px gore/dole), bez obzira na ugao
  const cx = 150
  const cy = 140
  const maxR = 80
  const n = eligible.length
  const angles = eligible.map((_, i) => (i / n) * 2 * Math.PI - Math.PI / 2)
  const polygonPoints = eligible
    .map((t, i) => {
      const r = (t.accuracy / 100) * maxR
      return `${(cx + r * Math.cos(angles[i])).toFixed(1)},${(cy + r * Math.sin(angles[i])).toFixed(1)}`
    })
    .join(' ')

  return (
    <div className="rounded-3xl border border-ink/5 bg-white p-8 shadow-soft">
      <h2 className="font-display text-xl font-bold text-ink">Šta ti dobro ide</h2>
      <p className="mt-1 text-sm text-muted">Tačnost po tipu vežbe.</p>

      <div className="mt-6 grid place-items-center">
        <svg viewBox="0 0 300 280" className="h-60 w-full max-w-sm sm:h-72">
          {/* Koncentrične mreže 25/50/75/100% */}
          {[0.25, 0.5, 0.75, 1].map((p) => {
            const pts = angles
              .map((a) => {
                const r = p * maxR
                return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
              })
              .join(' ')
            return (
              <polygon
                key={p}
                points={pts}
                fill="none"
                stroke="rgb(14 22 34)"
                strokeOpacity={0.1}
                strokeWidth={1}
              />
            )
          })}

          {/* Ose */}
          {angles.map((a, i) => (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={(cx + maxR * Math.cos(a)).toFixed(1)}
              y2={(cy + maxR * Math.sin(a)).toFixed(1)}
              stroke="rgb(14 22 34)"
              strokeOpacity={0.12}
              strokeWidth={1}
            />
          ))}

          {/* Polygon korisnika — pojačan: jača boja, deblja linija */}
          <polygon
            points={polygonPoints}
            fill="rgb(134 196 64)"
            fillOpacity={0.35}
            stroke="#5e9e2e"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* Tačkice na vrhovima */}
          {eligible.map((t, i) => {
            const r = (t.accuracy / 100) * maxR
            const x = cx + r * Math.cos(angles[i])
            const y = cy + r * Math.sin(angles[i])
            return (
              <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={4} fill="#5e9e2e" stroke="white" strokeWidth={1.5} />
            )
          })}

          {/* Labele oko grafikona — textAnchor se prilagođava strani da ne iskaču */}
          {eligible.map((t, i) => {
            const a = angles[i]
            const labelR = maxR + 18
            const x = cx + labelR * Math.cos(a)
            const y = cy + labelR * Math.sin(a)
            // anchor: levo → end, desno → start, gore/dole → middle
            const cosA = Math.cos(a)
            const anchor: 'start' | 'middle' | 'end' =
              cosA > 0.3 ? 'start' : cosA < -0.3 ? 'end' : 'middle'
            return (
              <g key={i}>
                <text
                  x={x.toFixed(1)}
                  y={y.toFixed(1)}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fill="rgb(14 22 34)"
                  fontSize="11"
                  fontWeight="700"
                >
                  {t.label}
                </text>
                <text
                  x={x.toFixed(1)}
                  y={(y + 13).toFixed(1)}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fill="rgb(91 102 117)"
                  fontSize="10"
                >
                  {t.accuracy}%
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <p className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-xs">
            ✓
          </span>
          <span>
            <span className="font-bold text-primary-dark">Najbolji si u:</span>{' '}
            <span className="font-semibold text-ink">{strongest.label}</span>{' '}
            <span className="text-muted">({strongest.accuracy}%)</span>
          </span>
        </p>
        {weakest.accuracy < strongest.accuracy && (
          <p className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-red-100 text-xs text-red-700">
              ↻
            </span>
            <span>
              <span className="font-bold text-red-700">Vredi vežbati:</span>{' '}
              <span className="font-semibold text-ink">{weakest.label}</span>{' '}
              <span className="text-muted">({weakest.accuracy}%)</span>
            </span>
          </p>
        )}
      </div>
    </div>
  )
}

/* ─── Ritam: tempo (bez predviđanja) ─── */

function RitamCard({
  data,
  courses,
}: {
  data: ProgressData
  courses: CourseSummary[] | null
}) {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // Prvi dan aktivnosti — defensivan parser jer backend može da vrati malformiran datum
  const start = findFirstActivityDate(data.heatmap)
  const { lessonsCompleted } = data.totals

  // Empty state: nema validnog starta i nema završenih lekcija
  if (!start && lessonsCompleted === 0) {
    return (
      <div className="rounded-3xl border border-ink/5 bg-white p-8 shadow-soft">
        <h2 className="font-display text-xl font-bold text-ink">Ritam učenja</h2>
        <p className="mt-3 text-sm text-muted">
          Probaj prvu lekciju — pa krećemo da računamo tempo.
        </p>
        <div className="mt-6 grid h-48 place-items-center rounded-2xl bg-surface text-4xl opacity-40">
          ⏱
        </div>
      </div>
    )
  }

  const daysLearning = start
    ? Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86_400_000))
    : null

  // Prosečno lekcija nedeljno — heatmap zadnjih 30 dana
  const last30 = data.heatmap.slice(-30)
  const last30Sum = last30.reduce((acc, d) => acc + (Number(d.count) || 0), 0)
  const lessonsPerWeek = Math.max(0, Math.round((last30Sum / 30) * 7))

  // Za "Po kursu" breakdown — sortiraj po napretku (najviše dovršeni prvi),
  // skloni kurseve bez ijedne lekcije
  const enrolledCourses = (courses ?? [])
    .filter((c) => c.stats.total > 0)
    .sort((a, b) => b.stats.percent - a.stats.percent)

  return (
    <div className="rounded-3xl border border-ink/5 bg-white p-8 shadow-soft">
      <h2 className="font-display text-xl font-bold text-ink">Ritam učenja</h2>
      <p className="mt-1 text-sm text-muted">Tvoj tempo do sada.</p>

      <ul className="mt-6 space-y-4">
        {/* Stavka 1 — dani učenja (samo ako imamo validan start) */}
        {daysLearning && start ? (
          <RhythmRow
            icon="🗓"
            headline={`${daysLearning} ${pluralDay(daysLearning)}`}
            sub={`od prve aktivnosti (${start.toLocaleDateString('sr-RS', { day: 'numeric', month: 'long' })})`}
          />
        ) : (
          <RhythmRow
            icon="🗓"
            headline={`${lessonsCompleted} ${pluralLessonShort(lessonsCompleted)} završeno`}
            sub="kreni redovnije pa krećemo da pratimo tempo"
          />
        )}

        {/* Stavka 2 — tempo zadnjih 30 dana */}
        <RhythmRow
          icon="⚡"
          headline={
            lessonsPerWeek > 0
              ? `${lessonsPerWeek} ${pluralLessonShort(lessonsPerWeek)} nedeljno`
              : 'Tihih mesec dana'
          }
          sub={
            lessonsPerWeek > 0
              ? 'prosečan tempo u poslednjih mesec dana'
              : 'kreni opet pa se vraćamo na šinama'
          }
        />
      </ul>

      {/* Per-course breakdown — jasno koji kurs ima koji napredak */}
      {enrolledCourses.length > 0 && (
        <div className="mt-6 border-t border-ink/5 pt-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted">
            Po kursu
          </p>
          <ul className="mt-3 space-y-3">
            {enrolledCourses.map((c) => (
              <CourseProgressLine key={c.id} course={c} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function CourseProgressLine({ course }: { course: CourseSummary }) {
  const { title, language, stats } = course
  const flag = languageFlag(language)
  return (
    <li>
      <Link
        href={`/courses/${course.slug}`}
        className="group block rounded-xl px-2 py-2 -mx-2 transition-colors hover:bg-surface"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-base leading-none">{flag}</span>
            <span className="truncate text-sm font-semibold text-ink group-hover:text-primary-dark">
              {title}
            </span>
          </span>
          <span className="shrink-0 text-xs font-bold tabular-nums text-ink">
            {stats.completed} / {stats.total}
            <span className="ml-1.5 text-muted">({stats.percent}%)</span>
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all"
            style={{ width: `${Math.max(2, stats.percent)}%` }}
          />
        </div>
      </Link>
    </li>
  )
}

function languageFlag(lang: string | null): string {
  if (!lang) return '🎓'
  const l = lang.toLowerCase()
  if (l.startsWith('de') || l.includes('nemack') || l.includes('german')) return '🇩🇪'
  if (l.startsWith('en') || l.includes('englesk') || l.includes('english')) return '🇬🇧'
  return '🎓'
}

/**
 * Vraća prvi validan datum aktivnosti iz heatmap-a, ili null ako ga nema.
 * Defensivno parsira — radi i sa "2026-06-30" i sa "2026-06-30T..." formatima.
 */
function findFirstActivityDate(heatmap: ProgressData['heatmap']): Date | null {
  for (const d of heatmap) {
    if (!d || !d.day || (Number(d.count) || 0) <= 0) continue
    const dayStr = String(d.day)
    const normalized = dayStr.includes('T') ? dayStr : dayStr + 'T00:00:00Z'
    const parsed = new Date(normalized)
    if (!isNaN(parsed.getTime())) return parsed
  }
  return null
}

function RhythmRow({
  icon,
  headline,
  sub,
}: {
  icon: string
  headline: string
  sub: string
}) {
  return (
    <li className="flex items-start gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-xl shadow-soft ring-1 ring-primary/15">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-bold leading-tight text-ink">{headline}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{sub}</p>
      </div>
    </li>
  )
}

function pluralLessonShort(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'lekcija'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'lekcije'
  return 'lekcija'
}
