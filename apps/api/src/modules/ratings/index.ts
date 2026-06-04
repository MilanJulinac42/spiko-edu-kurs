import Elysia, { t } from 'elysia'
import { and, avg, count, eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { ratings } from '../../db/schema'
import { auth } from '../../middleware/auth'

export const ratingsModule = new Elysia({ prefix: '/ratings' })
  .get('/by-course/:courseId', async ({ params }) => {
    const [agg] = await db
      .select({ avg: avg(ratings.rating), count: count() })
      .from(ratings)
      .where(and(eq(ratings.courseId, params.courseId), eq(ratings.status, 'visible')))
    return agg
  })
  .use(auth)
  .post(
    '/',
    async ({ body, user }) => {
      const [row] = await db
        .insert(ratings)
        .values({
          userId: user.userId,
          courseId: body.courseId,
          rating: body.rating,
          reviewText: body.reviewText ?? null,
        })
        .onConflictDoUpdate({
          target: [ratings.userId, ratings.courseId],
          set: {
            rating: body.rating,
            reviewText: body.reviewText ?? null,
          },
        })
        .returning()
      return row
    },
    {
      body: t.Object({
        courseId: t.String(),
        rating: t.Integer({ minimum: 1, maximum: 5 }),
        reviewText: t.Optional(t.String({ maxLength: 4000 })),
      }),
    },
  )
