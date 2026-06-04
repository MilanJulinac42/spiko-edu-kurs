import Elysia, { t } from 'elysia'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { lessonProgress } from '../../db/schema'
import { auth } from '../../middleware/auth'

export const progressModule = new Elysia({ prefix: '/progress' })
  .use(auth)
  .get('/resume', async ({ user }) => {
    const [row] = await db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, user.userId))
      .orderBy(desc(lessonProgress.lastViewedAt))
      .limit(1)
    return row ?? null
  })
  .post(
    '/:lessonId',
    async ({ params, body, user }) => {
      const values = {
        userId: user.userId,
        lessonId: params.lessonId,
        progressSeconds: body.progressSeconds,
        completed: body.completed ?? false,
        completedAt: body.completed ? new Date() : null,
        lastViewedAt: new Date(),
      }
      const [row] = await db
        .insert(lessonProgress)
        .values(values)
        .onConflictDoUpdate({
          target: [lessonProgress.userId, lessonProgress.lessonId],
          set: {
            progressSeconds: values.progressSeconds,
            completed: values.completed,
            completedAt: values.completedAt,
            lastViewedAt: values.lastViewedAt,
          },
        })
        .returning()
      return row
    },
    {
      params: t.Object({ lessonId: t.String() }),
      body: t.Object({
        progressSeconds: t.Integer({ minimum: 0 }),
        completed: t.Optional(t.Boolean()),
      }),
    },
  )
