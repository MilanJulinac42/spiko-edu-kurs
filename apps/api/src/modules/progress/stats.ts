import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import {
  courses,
  exerciseAttempts,
  exercises,
  lessonProgress,
  lessons,
  modules,
} from '../../db/schema'

const DAYS_BACK = 365

/**
 * Vraća sve podatke za /progress stranicu.
 *
 * Optimizacije:
 * - Sve upite koji nisu međuzavisni paralelizujemo preko `Promise.all`.
 * - Merge streak + bestStreak u JEDNU pretragu nad `lesson_progress`
 *   (umesto 2 odvojena upita).
 * - Indeksi iz migracije 0003 omogućavaju ovo da bude vrlo brzo:
 *   `lesson_progress_user_last_viewed_idx` (user_id, last_viewed_at desc).
 */
export async function getProgressStats(userId: string) {
  const since = new Date()
  since.setUTCHours(0, 0, 0, 0)
  since.setUTCDate(since.getUTCDate() - DAYS_BACK)

  const [
    heatmapRows,
    recentLessons,
    recentAttempts,
    byTypeRows,
    hardRows,
    progressAgg,
    exerciseAgg,
    allLessons,
    allDaysRows,
  ] = await Promise.all([
    /* HEATMAP — broj lekcija viđenih po danu (UTC) — poslednjih 365 dana */
    db
      .select({
        day: sql<string>`to_char(${lessonProgress.lastViewedAt} at time zone 'UTC', 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          gte(lessonProgress.lastViewedAt, since),
        ),
      )
      .groupBy(sql`to_char(${lessonProgress.lastViewedAt} at time zone 'UTC', 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${lessonProgress.lastViewedAt} at time zone 'UTC', 'YYYY-MM-DD') asc`),

    /* TIMELINE — poslednje 20 lekcija */
    db
      .select({
        id: lessonProgress.id,
        lessonId: lessonProgress.lessonId,
        completed: lessonProgress.completed,
        lastViewedAt: lessonProgress.lastViewedAt,
        lessonTitle: lessons.title,
        moduleTitle: modules.title,
        courseSlug: courses.slug,
      })
      .from(lessonProgress)
      .leftJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
      .leftJoin(modules, eq(modules.id, lessons.moduleId))
      .leftJoin(courses, eq(courses.id, modules.courseId))
      .where(eq(lessonProgress.userId, userId))
      .orderBy(desc(lessonProgress.lastViewedAt))
      .limit(20),

    /* TIMELINE — poslednje 20 attemptova */
    db
      .select({
        id: exerciseAttempts.id,
        exerciseId: exerciseAttempts.exerciseId,
        isCorrect: exerciseAttempts.isCorrect,
        createdAt: exerciseAttempts.createdAt,
        exerciseTitle: exercises.title,
        lessonId: exercises.lessonId,
        lessonTitle: lessons.title,
        courseSlug: courses.slug,
      })
      .from(exerciseAttempts)
      .leftJoin(exercises, eq(exercises.id, exerciseAttempts.exerciseId))
      .leftJoin(lessons, eq(lessons.id, exercises.lessonId))
      .leftJoin(modules, eq(modules.id, lessons.moduleId))
      .leftJoin(courses, eq(courses.id, modules.courseId))
      .where(eq(exerciseAttempts.userId, userId))
      .orderBy(desc(exerciseAttempts.createdAt))
      .limit(20),

    /* EXERCISE STATS PO TIPU */
    db
      .select({
        type: exercises.type,
        total: sql<number>`count(*)::int`,
        correct: sql<number>`count(*) filter (where ${exerciseAttempts.isCorrect})::int`,
        avgScore: sql<string>`coalesce(avg(${exerciseAttempts.score})::text, '0')`,
      })
      .from(exerciseAttempts)
      .leftJoin(exercises, eq(exercises.id, exerciseAttempts.exerciseId))
      .where(eq(exerciseAttempts.userId, userId))
      .groupBy(exercises.type),

    /* NAJTEŽE VEŽBE */
    db
      .select({
        exerciseId: exerciseAttempts.exerciseId,
        attempts: sql<number>`count(*)::int`,
        correctCount: sql<number>`count(*) filter (where ${exerciseAttempts.isCorrect})::int`,
        exerciseTitle: exercises.title,
        exerciseType: exercises.type,
        lessonId: exercises.lessonId,
        lessonTitle: lessons.title,
        courseSlug: courses.slug,
      })
      .from(exerciseAttempts)
      .leftJoin(exercises, eq(exercises.id, exerciseAttempts.exerciseId))
      .leftJoin(lessons, eq(lessons.id, exercises.lessonId))
      .leftJoin(modules, eq(modules.id, lessons.moduleId))
      .leftJoin(courses, eq(courses.id, modules.courseId))
      .where(eq(exerciseAttempts.userId, userId))
      .groupBy(
        exerciseAttempts.exerciseId,
        exercises.title,
        exercises.type,
        exercises.lessonId,
        lessons.title,
        courses.slug,
      )
      .having(sql`count(*) >= 2`)
      .orderBy(sql`avg(${exerciseAttempts.score}) asc`)
      .limit(5),

    /* AGGREGATE TOTALS */
    db
      .select({
        completed: sql<number>`count(*) filter (where ${lessonProgress.completed})::int`,
        seconds: sql<number>`coalesce(sum(${lessonProgress.progressSeconds}), 0)::int`,
      })
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, userId)),

    /* VEŽBI REŠENO — broj tačnih attempt-a + ukupno pokušaja */
    db
      .select({
        correct: sql<number>`count(*) filter (where ${exerciseAttempts.isCorrect})::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(exerciseAttempts)
      .where(eq(exerciseAttempts.userId, userId)),

    /* TOTAL DOSTUPNIH LEKCIJA — za procenat */
    db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.status, 'published')),

    /* SVI DANI AKTIVNOSTI — za streak + bestStreak (jedan upit umesto dva) */
    db
      .select({
        day: sql<string>`to_char(${lessonProgress.lastViewedAt} at time zone 'UTC', 'YYYY-MM-DD')`,
      })
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, userId))
      .groupBy(sql`to_char(${lessonProgress.lastViewedAt} at time zone 'UTC', 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${lessonProgress.lastViewedAt} at time zone 'UTC', 'YYYY-MM-DD') asc`),
  ])

  /* Streak + bestStreak iz jednog niza dana */
  const { streak, bestStreak } = computeStreaks(allDaysRows.map((r) => r.day))

  /* Spojen timeline */
  const timeline = [
    ...recentLessons
      .filter((r) => r.lastViewedAt)
      .map((r) => ({
        kind: r.completed ? ('lesson_completed' as const) : ('lesson_viewed' as const),
        at: r.lastViewedAt!,
        title: r.lessonTitle ?? 'Lekcija',
        subtitle: r.moduleTitle ?? '',
        href: r.courseSlug && r.lessonId ? `/courses/${r.courseSlug}/lessons/${r.lessonId}` : null,
      })),
    ...recentAttempts.map((r) => ({
      kind: r.isCorrect ? ('exercise_correct' as const) : ('exercise_wrong' as const),
      at: r.createdAt,
      title: r.exerciseTitle ?? 'Vežba',
      subtitle: r.lessonTitle ? `u "${r.lessonTitle}"` : '',
      href: r.courseSlug && r.lessonId ? `/courses/${r.courseSlug}/lessons/${r.lessonId}` : null,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 30)

  const exerciseStats = byTypeRows
    .filter((r) => r.type)
    .map((r) => ({
      type: r.type as string,
      total: r.total,
      correct: r.correct,
      accuracy: r.total ? Math.round((r.correct / r.total) * 100) : 0,
      avgScore: Math.round(Number(r.avgScore) * 100),
    }))

  const hardestExercises = hardRows.map((r) => ({
    id: r.exerciseId,
    title: r.exerciseTitle ?? 'Vežba',
    type: r.exerciseType ?? '',
    attempts: r.attempts,
    accuracy: r.attempts ? Math.round((r.correctCount / r.attempts) * 100) : 0,
    href: r.courseSlug && r.lessonId ? `/courses/${r.courseSlug}/lessons/${r.lessonId}` : null,
  }))

  const totalLessons = allLessons.length
  const agg = progressAgg[0] ?? { completed: 0, seconds: 0 }
  const exAgg = exerciseAgg[0] ?? { correct: 0, total: 0 }

  return {
    streak,
    bestStreak,
    totals: {
      lessonsCompleted: agg.completed,
      totalLessons,
      percent: totalLessons ? Math.round((agg.completed / totalLessons) * 100) : 0,
      activeDays: allDaysRows.length,
      exercisesSolved: exAgg.correct,
      exercisesAttempted: exAgg.total,
    },
    heatmap: heatmapRows,
    timeline,
    exerciseStats,
    hardestExercises,
  }
}

/**
 * Iz sortiranog niza dana ('YYYY-MM-DD'), izračunaj trenutni streak (završno
 * danas/juče) i najduži ikada — jednim prolazom.
 */
function computeStreaks(days: string[]): { streak: number; bestStreak: number } {
  if (days.length === 0) return { streak: 0, bestStreak: 0 }

  const dayMs = days.map((s) => {
    const [y, m, d] = s.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  })

  // Best streak — jedan prolaz preko sortiranog niza
  let best = 1
  let run = 1
  for (let i = 1; i < dayMs.length; i++) {
    const diff = (dayMs[i] - dayMs[i - 1]) / (24 * 60 * 60 * 1000)
    if (diff === 1) {
      run++
      if (run > best) best = run
    } else {
      run = 1
    }
  }

  // Current streak — krećemo unazad od danas/juče
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayMs = today.getTime()
  const yesterdayMs = todayMs - 24 * 60 * 60 * 1000
  const latest = dayMs[dayMs.length - 1]

  let current = 0
  if (latest === todayMs || latest === yesterdayMs) {
    current = 1
    let prev = latest
    for (let i = dayMs.length - 2; i >= 0; i--) {
      const diff = (prev - dayMs[i]) / (24 * 60 * 60 * 1000)
      if (diff === 1) {
        current++
        prev = dayMs[i]
      } else {
        break
      }
    }
  }

  return { streak: current, bestStreak: best }
}
