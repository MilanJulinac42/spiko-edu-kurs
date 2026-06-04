import Elysia, { t } from 'elysia'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import { courses, lessonProgress, lessons, modules } from '../../db/schema'
import { auth } from '../../middleware/auth'
import { signPlaybackUrl } from '../../services/bunny'

export const coursesModule = new Elysia({ prefix: '/courses' })
  // Javni katalog
  .get('/', async () => {
    return db
      .select()
      .from(courses)
      .where(eq(courses.status, 'published'))
      .orderBy(asc(courses.position))
  })
  // "Moj kurs" — student vidi prvi objavljen kurs sa svojim napretkom po lekciji
  .use(auth)
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

    return {
      course: { ...course, modules: tree },
      stats: { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 },
      resumeLessonId: last?.lessonId ?? allLessons[0]?.id ?? null,
    }
  })
  .get('/:slug', async ({ params, status }) => {
    const [course] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.slug, params.slug), eq(courses.status, 'published')))
      .limit(1)
    if (!course) return status(404, { error: 'not found' })

    const courseModules = await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, course.id))
      .orderBy(asc(modules.position))

    return { ...course, modules: courseModules }
  })
  // Lekcija — za sad samo auth; entitlement (subscription gate) dodaje se uz billing
  .get('/lessons/:id', async ({ params, status, user }) => {
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, params.id))
      .limit(1)
    if (!lesson || lesson.status !== 'published') {
      return status(404, { error: 'not found' })
    }

    let playbackUrl: string | null = null
    if (lesson.type === 'video' && lesson.videoId && lesson.videoReady) {
      playbackUrl = signPlaybackUrl(lesson.videoId, user.userId)
    }

    return { ...lesson, playbackUrl }
  }, {
    params: t.Object({ id: t.String() }),
  })
