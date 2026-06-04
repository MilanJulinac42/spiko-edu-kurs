import Elysia, { t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { exerciseAttempts, exercises } from '../../db/schema'
import { entitlement } from '../../middleware/entitlement'

export const exercisesModule = new Elysia({ prefix: '/exercises' })
  .use(entitlement)
  .get('/by-lesson/:lessonId', async ({ params }) => {
    return db
      .select()
      .from(exercises)
      .where(eq(exercises.lessonId, params.lessonId))
  })
  .post(
    '/:id/attempt',
    async ({ params, body, user, status }) => {
      const [exercise] = await db
        .select()
        .from(exercises)
        .where(eq(exercises.id, params.id))
        .limit(1)
      if (!exercise) return status(404, { error: 'not found' })

      // TODO: ocenjivanje po `exercise.type` u services/grader.ts
      const isCorrect = false
      const score = '0'

      const [row] = await db
        .insert(exerciseAttempts)
        .values({
          userId: user.userId,
          exerciseId: exercise.id,
          answers: body.answers,
          isCorrect,
          score,
          attemptNumber: 1,
        })
        .returning()
      return row
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ answers: t.Unknown() }),
    },
  )
