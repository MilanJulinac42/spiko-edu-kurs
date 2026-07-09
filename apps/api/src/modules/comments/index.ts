import Elysia, { t } from 'elysia'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { comments, profiles } from '../../db/schema'
import { auth } from '../../middleware/auth'

export const commentsModule = new Elysia({ prefix: '/comments' })
  .get(
    '/',
    async ({ query }) => {
      const rows = await db
        .select({
          id: comments.id,
          body: comments.body,
          parentId: comments.parentId,
          userId: comments.userId,
          lessonId: comments.lessonId,
          courseId: comments.courseId,
          createdAt: comments.createdAt,
          authorName: profiles.fullName,
          authorAvatar: profiles.avatarUrl,
        })
        .from(comments)
        .leftJoin(profiles, eq(profiles.id, comments.userId))
        .where(
          and(
            eq(comments.status, 'visible'),
            query.lessonId ? eq(comments.lessonId, query.lessonId) : undefined,
            query.courseId ? eq(comments.courseId, query.courseId) : undefined,
          ),
        )
        .orderBy(asc(comments.createdAt))
      return rows
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
  .delete('/:id', async ({ params, user, status }) => {
    // korisnik može da obriše samo svoj komentar (soft delete = hidden)
    const [c] = await db
      .select({ userId: comments.userId })
      .from(comments)
      .where(eq(comments.id, params.id))
      .limit(1)
    if (!c) return status(404, { error: 'not found' })
    if (c.userId !== user.userId) return status(403, { error: 'not yours' })
    await db.update(comments).set({ status: 'hidden' }).where(eq(comments.id, params.id))
    return { ok: true }
  }, {
    params: t.Object({ id: t.String() }),
  })
