import Elysia, { t } from 'elysia'
import { and, asc, eq } from 'drizzle-orm'
import type { ExercisePayload } from '@spiko/shared'
import { db } from '../../db/client'
import { exerciseAttempts, exercises, lessonProgress, lessons } from '../../db/schema'
import { auth } from '../../middleware/auth'
import { grade, scrubExerciseForStudent } from '../../services/grader'

function isExercisePayload(c: unknown): c is ExercisePayload {
  return !!c && typeof c === 'object' && 'type' in c && 'data' in c
}

export const exercisesModule = new Elysia({ prefix: '/exercises' })
  .use(auth)
  // Lista vežbi po lekciji (scrubbed za studenta)
  .get('/by-lesson/:lessonId', async ({ params }) => {
    const rows = await db
      .select()
      .from(exercises)
      .where(and(eq(exercises.lessonId, params.lessonId), eq(exercises.status, 'published')))
      .orderBy(asc(exercises.position))

    return rows.map((r) => {
      const isPayload = isExercisePayload(r.payload)
      return {
        id: r.id,
        title: r.title,
        type: r.type,
        position: r.position,
        payload: isPayload ? scrubExerciseForStudent(r.payload as ExercisePayload) : null,
      }
    })
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
      if (!isExercisePayload(exercise.payload)) {
        return status(400, { error: 'exercise has no payload' })
      }

      const result = grade(exercise.payload as ExercisePayload, body.answers)

      await db.insert(exerciseAttempts).values({
        userId: user.userId,
        exerciseId: exercise.id,
        answers: body.answers as unknown[],
        isCorrect: result.isCorrect,
        score: String(result.score),
        attemptNumber: 1,
      })

      // Ako je svih vežbi u lekciji rešeno tačno, markiraj progress
      if (result.isCorrect && exercise.lessonId) {
        const all = await db
          .select({ id: exercises.id })
          .from(exercises)
          .where(and(eq(exercises.lessonId, exercise.lessonId), eq(exercises.status, 'published')))
        const correctAttempts = await db
          .select({ exerciseId: exerciseAttempts.exerciseId })
          .from(exerciseAttempts)
          .where(
            and(
              eq(exerciseAttempts.userId, user.userId),
              eq(exerciseAttempts.isCorrect, true),
            ),
          )
        const correctSet = new Set(correctAttempts.map((a) => a.exerciseId))
        const allCorrect = all.every((e) => correctSet.has(e.id))
        if (allCorrect) {
          // markiraj lekciju kao završenu
          await db
            .insert(lessonProgress)
            .values({
              userId: user.userId,
              lessonId: exercise.lessonId,
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
      }

      void lessons
      return result
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ answers: t.Unknown() }),
    },
  )
