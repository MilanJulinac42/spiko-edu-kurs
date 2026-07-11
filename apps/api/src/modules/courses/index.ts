import Elysia, { t } from 'elysia'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import { courses, exercises, lessonProgress, lessons, modules } from '../../db/schema'
import type { ExercisePayload } from '@spiko/shared'
import { auth } from '../../middleware/auth'
import { fetchBunnyVideoStatus, iframeEmbedUrl, signPlaybackUrl } from '../../services/bunny'
import { grade, scrubExerciseForStudent } from '../../services/grader'
import { calculateStreak } from '../../services/streak'

export const coursesModule = new Elysia({ prefix: '/courses' })
  // Javni katalog
  .get('/', async () => {
    return db
      .select()
      .from(courses)
      .where(eq(courses.status, 'published'))
      .orderBy(asc(courses.position))
  })
  .use(auth)
  // Lista SVIH kurseva studenta sa progresom za svaki — koristi se za "Moji kursevi" grid
  .get('/mine/list', async ({ user }) => {
    const allCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.status, 'published'))
      .orderBy(asc(courses.position))

    if (allCourses.length === 0) return { courses: [], streak: 0 }

    const allModules = await db
      .select()
      .from(modules)
      .where(inArray(modules.courseId, allCourses.map((c) => c.id)))

    const allLessons = allModules.length
      ? await db
          .select({ id: lessons.id, moduleId: lessons.moduleId, status: lessons.status })
          .from(lessons)
          .where(
            and(
              inArray(lessons.moduleId, allModules.map((m) => m.id)),
              eq(lessons.status, 'published'),
            ),
          )
      : []

    const progressRows = allLessons.length
      ? await db
          .select()
          .from(lessonProgress)
          .where(and(
            eq(lessonProgress.userId, user.userId),
            inArray(lessonProgress.lessonId, allLessons.map((l) => l.id)),
          ))
      : []
    const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]))

    const enriched = allCourses.map((c) => {
      const courseModuleIds = allModules.filter((m) => m.courseId === c.id).map((m) => m.id)
      const courseLessons = allLessons.filter((l) => courseModuleIds.includes(l.moduleId))
      const total = courseLessons.length
      const completed = courseLessons.filter((l) => progressByLesson.get(l.id)?.completed).length
      const lastViewed = courseLessons
        .map((l) => progressByLesson.get(l.id)?.lastViewedAt)
        .filter(Boolean) as Date[]
      const lastActivityAt = lastViewed.length
        ? lastViewed.sort((a, b) => b.getTime() - a.getTime())[0]
        : null
      const lastLessonId = progressRows
        .filter((p) => courseLessons.some((l) => l.id === p.lessonId))
        .sort((a, b) => (b.lastViewedAt?.getTime() ?? 0) - (a.lastViewedAt?.getTime() ?? 0))[0]
        ?.lessonId
      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        level: c.level,
        language: c.language,
        thumbnailUrl: c.thumbnailUrl,
        stats: {
          total,
          completed,
          percent: total ? Math.round((completed / total) * 100) : 0,
        },
        resumeLessonId: lastLessonId ?? courseLessons[0]?.id ?? null,
        lastActivityAt,
      }
    })

    const streak = await calculateStreak(user.userId)
    return { courses: enriched, streak }
  })
  // "Moj kurs" — vraća detalj prvog kursa (zadržano radi back-compat sa dashboard-om;
  // u budućnosti ćemo verovatno ovo zameniti sa /courses/:slug/student-detail)
  .get('/mine', async ({ user }) => {
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.status, 'published'))
      .orderBy(asc(courses.position))
      .limit(1)
    if (!course) return { course: null }

    const courseModules = await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, course.id))
      .orderBy(asc(modules.position))

    const moduleIds = courseModules.map((m) => m.id)
    const allLessons = moduleIds.length
      ? await db
          .select()
          .from(lessons)
          .where(and(inArray(lessons.moduleId, moduleIds), eq(lessons.status, 'published')))
          .orderBy(asc(lessons.position))
      : []

    const lessonIds = allLessons.map((l) => l.id)
    const progress = lessonIds.length
      ? await db
          .select()
          .from(lessonProgress)
          .where(and(eq(lessonProgress.userId, user.userId), inArray(lessonProgress.lessonId, lessonIds)))
      : []

    const progressMap = new Map(progress.map((p) => [p.lessonId, p]))

    const tree = courseModules.map((m) => ({
      ...m,
      lessons: allLessons
        .filter((l) => l.moduleId === m.id)
        .map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          position: l.position,
          durationSeconds: l.durationSeconds,
          completed: progressMap.get(l.id)?.completed ?? false,
          progressSeconds: progressMap.get(l.id)?.progressSeconds ?? 0,
        })),
    }))

    const total = allLessons.length
    const completed = progress.filter((p) => p.completed).length
    const last = progress
      .filter((p) => p.lastViewedAt)
      .sort((a, b) => (b.lastViewedAt!.getTime() - a.lastViewedAt!.getTime()))[0]

    const streak = await calculateStreak(user.userId)

    return {
      course: { ...course, modules: tree },
      stats: {
        total,
        completed,
        percent: total ? Math.round((completed / total) * 100) : 0,
        streak,
      },
      resumeLessonId: last?.lessonId ?? allLessons[0]?.id ?? null,
    }
  })
  // Detalj jednog kursa po slug-u — vraća modules + lessons + per-lesson progress
  // + stats + resumeLessonId. Koristi se za /courses/:slug stranicu.
  .get('/:slug', async ({ params, status, user }) => {
    // Admin "Pregled kao student" — vidi i draft/hidden; student samo objavljeno.
    const isAdmin = user.role === 'admin'
    const [course] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.slug, params.slug), isAdmin ? undefined : eq(courses.status, 'published')))
      .limit(1)
    if (!course) return status(404, { error: 'not found' })

    const courseModules = await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, course.id))
      .orderBy(asc(modules.position))

    const moduleIds = courseModules.map((m) => m.id)
    const allLessons = moduleIds.length
      ? await db
          .select()
          .from(lessons)
          .where(and(inArray(lessons.moduleId, moduleIds), isAdmin ? undefined : eq(lessons.status, 'published')))
          .orderBy(asc(lessons.position))
      : []

    const lessonIds = allLessons.map((l) => l.id)
    const progress = lessonIds.length
      ? await db
          .select()
          .from(lessonProgress)
          .where(and(eq(lessonProgress.userId, user.userId), inArray(lessonProgress.lessonId, lessonIds)))
      : []

    const progressMap = new Map(progress.map((p) => [p.lessonId, p]))

    const tree = courseModules.map((m) => ({
      ...m,
      lessons: allLessons
        .filter((l) => l.moduleId === m.id)
        .map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          position: l.position,
          durationSeconds: l.durationSeconds,
          completed: progressMap.get(l.id)?.completed ?? false,
          progressSeconds: progressMap.get(l.id)?.progressSeconds ?? 0,
        })),
    }))

    const total = allLessons.length
    const completed = progress.filter((p) => p.completed).length
    const last = progress
      .filter((p) => p.lastViewedAt)
      .sort((a, b) => (b.lastViewedAt!.getTime() - a.lastViewedAt!.getTime()))[0]

    // Ukupno trajanje (sekunde) i ukupno vežbi za "quick stats" traku
    const totalDurationSeconds = allLessons.reduce(
      (sum, l) => sum + (l.durationSeconds ?? 0),
      0,
    )
    const exerciseCountRows = lessonIds.length
      ? await db
          .select({ id: exercises.id })
          .from(exercises)
          .where(
            and(
              inArray(exercises.lessonId, lessonIds),
              eq(exercises.status, 'published'),
            ),
          )
      : []
    const totalExercises = exerciseCountRows.length

    return {
      course: { ...course, modules: tree },
      stats: {
        total,
        completed,
        percent: total ? Math.round((completed / total) * 100) : 0,
        totalExercises,
        totalDurationSeconds,
      },
      resumeLessonId: last?.lessonId ?? allLessons[0]?.id ?? null,
    }
  }, {
    params: t.Object({ slug: t.String() }),
  })
  // Lekcija — za sad samo auth; entitlement (subscription gate) dodaje se uz billing
  .get('/lessons/:id', async ({ params, status, user }) => {
    // Admin "Pregled kao student" vidi i draft/hidden lekcije.
    const isAdmin = user.role === 'admin'
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, params.id))
      .limit(1)
    if (!lesson || (lesson.status !== 'published' && !isAdmin)) {
      return status(404, { error: 'not found' })
    }

    // Video je spreman ako ima videoId i (videoReady u bazi ILI Bunny potvrdi).
    //
    // Fallback poll: kad webhook ne stigne (lokalni dev bez ngrok-a, ili propušten
    // webhook), videoReady ostaje `false` iako je Bunny odavno završio encoding.
    // Zato ovde, ako je videoId prisutan a videoReady još false, pitamo Bunny
    // direktno. Ako je gotov → update-ujemo DB da sledeći put ne moramo da pitamo.
    //
    // NAPOMENA: uslov više NE zavisi od `lesson.type === 'video'` jer multi-content
    // lekcije drže video kroz `contentOrder`, a `type` može biti 'text'/'exercise'.
    let playbackUrl: string | null = null
    let embedUrl: string | null = null
    let videoReady = lesson.videoReady

    if (lesson.videoId && !videoReady) {
      try {
        const bunny = await fetchBunnyVideoStatus(lesson.videoId)
        if (bunny.available) {
          videoReady = true
          // Persist da sledeći request ne mora da pita Bunny (fire-and-forget bi
          // bilo ok, ali await je jeftin i garantuje konzistentnost).
          await db
            .update(lessons)
            .set({ videoReady: true })
            .where(eq(lessons.id, lesson.id))
        }
      } catch {
        // Bunny nedostupan → tretiraj kao "još nije spreman", pokušaćemo opet
      }
    }

    if (lesson.videoId && videoReady) {
      playbackUrl = signPlaybackUrl(lesson.videoId, user.userId)
      embedUrl = iframeEmbedUrl(lesson.videoId)
    }

    // Ako je vežba — sklanjamo tačne odgovore pre slanja klijentu
    let scrubbedContent: unknown = lesson.content
    if (lesson.type === 'exercise' && isExercisePayload(lesson.content)) {
      scrubbedContent = scrubExerciseForStudent(lesson.content as ExercisePayload)
    }

    // Dodatne vežbe iz `exercises` tabele (multi-exercise mode)
    const lessonExercises = await db
      .select()
      .from(exercises)
      .where(and(eq(exercises.lessonId, lesson.id), isAdmin ? undefined : eq(exercises.status, 'published')))
      .orderBy(asc(exercises.position))

    const exercisesForStudent = lessonExercises.map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      position: e.position,
      audioUrl: e.audioUrl,
      audioTitle: e.audioTitle,
      payload: isExercisePayload(e.payload)
        ? scrubExerciseForStudent(e.payload as ExercisePayload)
        : null,
    }))

    return {
      ...lesson,
      videoReady, // override — može biti ažuriran fallback poll-om iznad
      content: scrubbedContent,
      playbackUrl,
      embedUrl,
      exercises: exercisesForStudent,
    }
  }, {
    params: t.Object({ id: t.String() }),
  })
  .post(
    '/lessons/:id/grade',
    async ({ params, body, user, status }) => {
      const [lesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, params.id))
        .limit(1)
      if (!lesson) return status(404, { error: 'not found' })
      if (lesson.type !== 'exercise' || !isExercisePayload(lesson.content)) {
        return status(400, { error: 'lesson has no exercise' })
      }

      const result = grade(lesson.content as ExercisePayload, body.answers)

      // Snimi progres ako tačno
      if (result.isCorrect) {
        await db
          .insert(lessonProgress)
          .values({
            userId: user.userId,
            lessonId: lesson.id,
            completed: true,
            completedAt: new Date(),
            lastViewedAt: new Date(),
            progressSeconds: 0,
          })
          .onConflictDoUpdate({
            target: [lessonProgress.userId, lessonProgress.lessonId],
            set: {
              completed: true,
              completedAt: new Date(),
              lastViewedAt: new Date(),
            },
          })
      }

      return result
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ answers: t.Unknown() }),
    },
  )

function isExercisePayload(c: unknown): c is ExercisePayload {
  return (
    !!c &&
    typeof c === 'object' &&
    'type' in c &&
    'data' in c &&
    typeof (c as { type: unknown }).type === 'string'
  )
}
