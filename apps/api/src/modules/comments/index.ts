import Elysia, { t } from 'elysia'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { comments } from '../../db/schema'
import { auth } from '../../middleware/auth'

export const commentsModule = new Elysia({ prefix: '/comments' })
  .get(
    '/',
    async ({ query }) => {
      return db
        .select()
        .from(comments)
        .where(
          and(
            eq(comments.status, 'visible'),
            query.lessonId ? eq(comments.lessonId, query.lessonId) : undefined,
            query.courseId ? eq(comments.courseId, query.courseId) : undefined,
          ),
        )
        .orderBy(asc(comments.createdAt))
    },
    {
      query: t.Object({
        lessonId: t.Optional(t.String()),
        courseId: t.Optional(t.String()),
      }),
    },
  )
  .use(auth)
  .post(
    '/',
    async ({ body, user }) => {
      const [row] = await db
        .insert(comments)
        .values({
          userId: user.userId,
          body: body.body,
          lessonId: body.lessonId ?? null,
          courseId: body.courseId ?? null,
          parentId: body.parentId ?? null,
        })
        .returning()
      return row
    },
    {
      body: t.Object({
        body: t.String({ minLength: 1, maxLength: 2000 }),
        lessonId: t.Optional(t.String()),
        courseId: t.Optional(t.String()),
        parentId: t.Optional(t.String()),
      }),
    },
  )
