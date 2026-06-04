import Elysia, { t } from 'elysia'
import { and, asc, eq, max, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import {
  courses,
  exercises,
  lessons,
  modules,
  profiles,
} from '../../db/schema'
import { requireRole } from '../../middleware/requireRole'

const ContentStatus = t.Union([
  t.Literal('draft'),
  t.Literal('published'),
  t.Literal('hidden'),
])

const LessonType = t.Union([
  t.Literal('video'),
  t.Literal('text'),
  t.Literal('exercise'),
])

const ExerciseType = t.Union([
  t.Literal('multiple_choice'),
  t.Literal('fill_blank'),
  t.Literal('matching'),
  t.Literal('ordering'),
])

async function nextCoursePosition() {
  const [row] = await db.select({ max: max(courses.position) }).from(courses)
  return (row?.max ?? -1) + 1
}
async function nextModulePosition(courseId: string) {
  const [row] = await db
    .select({ max: max(modules.position) })
    .from(modules)
    .where(eq(modules.courseId, courseId))
  return (row?.max ?? -1) + 1
}
async function nextLessonPosition(moduleId: string) {
  const [row] = await db
    .select({ max: max(lessons.position) })
    .from(lessons)
    .where(eq(lessons.moduleId, moduleId))
  return (row?.max ?? -1) + 1
}
async function nextExercisePosition(lessonId: string) {
  const [row] = await db
    .select({ max: max(exercises.position) })
    .from(exercises)
    .where(eq(exercises.lessonId, lessonId))
  return (row?.max ?? -1) + 1
}

export const adminModule = new Elysia({ prefix: '/admin' })
  .use(requireRole('admin'))
  // ---------- COURSES ----------
  .get('/courses', async () => {
    return db.select().from(courses).orderBy(asc(courses.position))
  })
  .post(
    '/courses',
    async ({ body }) => {
      const position = await nextCoursePosition()
      const [row] = await db
        .insert(courses)
        .values({ ...body, position })
        .returning()
      return row
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 200 }),
        slug: t.String({ minLength: 1, maxLength: 100 }),
        description: t.Optional(t.String({ maxLength: 5000 })),
        level: t.Optional(t.String({ maxLength: 10 })),
        language: t.Optional(t.String({ maxLength: 10 })),
        thumbnailUrl: t.Optional(t.String({ maxLength: 1000 })),
        status: t.Optional(ContentStatus),
      }),
    },
  )
  .get('/courses/:id', async ({ params, status }) => {
    const [course] = await db.select().from(courses).where(eq(courses.id, params.id)).limit(1)
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
          .where(sql`${lessons.moduleId} = ANY(${moduleIds})`)
          .orderBy(asc(lessons.position))
      : []
    const tree = courseModules.map((m) => ({
      ...m,
      lessons: allLessons.filter((l) => l.moduleId === m.id),
    }))
    return { ...course, modules: tree }
  })
  .patch(
    '/courses/:id',
    async ({ params, body }) => {
      const [row] = await db
        .update(courses)
        .set(body)
        .where(eq(courses.id, params.id))
        .returning()
      return row
    },
    {
      body: t.Partial(
        t.Object({
          title: t.String(),
          slug: t.String(),
          description: t.String(),
          level: t.String(),
          language: t.String(),
          thumbnailUrl: t.String(),
          status: ContentStatus,
          position: t.Integer(),
        }),
      ),
    },
  )
  .delete('/courses/:id', async ({ params }) => {
    await db.delete(courses).where(eq(courses.id, params.id))
    return { ok: true }
  })
  // ---------- MODULES ----------
  .post(
    '/modules',
    async ({ body }) => {
      const position = await nextModulePosition(body.courseId)
      const [row] = await db.insert(modules).values({ ...body, position }).returning()
      return row
    },
    {
      body: t.Object({
        courseId: t.String(),
        title: t.String({ minLength: 1, maxLength: 200 }),
      }),
    },
  )
  .patch(
    '/modules/:id',
    async ({ params, body }) => {
      const [row] = await db
        .update(modules)
        .set(body)
        .where(eq(modules.id, params.id))
        .returning()
      return row
    },
    {
      body: t.Partial(
        t.Object({
          title: t.String(),
          position: t.Integer(),
        }),
      ),
    },
  )
  .delete('/modules/:id', async ({ params }) => {
    await db.delete(modules).where(eq(modules.id, params.id))
    return { ok: true }
  })
  // ---------- LESSONS ----------
  .post(
    '/lessons',
    async ({ body }) => {
      const position = await nextLessonPosition(body.moduleId)
      const [row] = await db
        .insert(lessons)
        .values({
          moduleId: body.moduleId,
          title: body.title,
          type: body.type,
          content: body.content ?? null,
          videoId: body.videoId ?? null,
          status: body.status ?? 'draft',
          position,
        })
        .returning()
      return row
    },
    {
      body: t.Object({
        moduleId: t.String(),
        title: t.String({ minLength: 1, maxLength: 200 }),
        type: LessonType,
        content: t.Optional(t.Unknown()),
        videoId: t.Optional(t.String()),
        status: t.Optional(ContentStatus),
      }),
    },
  )
  .patch(
    '/lessons/:id',
    async ({ params, body }) => {
      const [row] = await db
        .update(lessons)
        .set(body)
        .where(eq(lessons.id, params.id))
        .returning()
      return row
    },
    {
      body: t.Partial(
        t.Object({
          title: t.String(),
          type: LessonType,
          content: t.Unknown(),
          videoId: t.String(),
          videoReady: t.Boolean(),
          durationSeconds: t.Integer(),
          status: ContentStatus,
          position: t.Integer(),
        }),
      ),
    },
  )
  .delete('/lessons/:id', async ({ params }) => {
    await db.delete(lessons).where(eq(lessons.id, params.id))
    return { ok: true }
  })
  // ---------- REORDER (bulk position update) ----------
  .post(
    '/reorder/modules',
    async ({ body }) => {
      for (let i = 0; i < body.ids.length; i++) {
        await db
          .update(modules)
          .set({ position: i })
          .where(and(eq(modules.id, body.ids[i]), eq(modules.courseId, body.courseId)))
      }
      return { ok: true }
    },
    {
      body: t.Object({
        courseId: t.String(),
        ids: t.Array(t.String()),
      }),
    },
  )
  .post(
    '/reorder/lessons',
    async ({ body }) => {
      for (let i = 0; i < body.ids.length; i++) {
        await db
          .update(lessons)
          .set({ position: i, moduleId: body.moduleId })
          .where(eq(lessons.id, body.ids[i]))
      }
      return { ok: true }
    },
    {
      body: t.Object({
        moduleId: t.String(),
        ids: t.Array(t.String()),
      }),
    },
  )
  // ---------- EXERCISES (placeholder CRUD, Phase 3 nadograđuje builder) ----------
  .post(
    '/exercises',
    async ({ body }) => {
      const position = await nextExercisePosition(body.lessonId)
      const [row] = await db.insert(exercises).values({ ...body, position }).returning()
      return row
    },
    {
      body: t.Object({
        lessonId: t.String(),
        title: t.String({ minLength: 1, maxLength: 200 }),
        type: ExerciseType,
        payload: t.Unknown(),
        status: t.Optional(ContentStatus),
      }),
    },
  )
  .patch(
    '/exercises/:id',
    async ({ params, body }) => {
      const [row] = await db
        .update(exercises)
        .set(body)
        .where(eq(exercises.id, params.id))
        .returning()
      return row
    },
    {
      body: t.Partial(
        t.Object({
          title: t.String(),
          type: ExerciseType,
          payload: t.Unknown(),
          status: ContentStatus,
          position: t.Integer(),
        }),
      ),
    },
  )
  .delete('/exercises/:id', async ({ params }) => {
    await db.delete(exercises).where(eq(exercises.id, params.id))
    return { ok: true }
  })
  // ---------- USERS / ROLES (čisto admin) ----------
  .get('/users', async () => {
    return db.select().from(profiles).orderBy(asc(profiles.createdAt))
  })
  .patch(
    '/users/:id/role',
    async ({ params, body }) => {
      const [row] = await db
        .update(profiles)
        .set({ role: body.role })
        .where(eq(profiles.id, params.id))
        .returning()
      return row
    },
    {
      body: t.Object({
        role: t.Union([t.Literal('student'), t.Literal('teacher'), t.Literal('admin')]),
      }),
    },
  )
