import Elysia, { t } from 'elysia'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { courses, lessons, modules } from '../../db/schema'
import { entitlement } from '../../middleware/entitlement'
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
  // Lekcija — iza entitlementa
  .use(entitlement)
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
