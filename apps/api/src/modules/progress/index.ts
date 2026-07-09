import Elysia, { t } from 'elysia'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import { lessonProgress } from '../../db/schema'
import { auth } from '../../middleware/auth'
import { getProgressStats } from './stats'

export const progressModule = new Elysia({ prefix: '/progress' })
  .use(auth)
  // Full progress stats — heatmap (365 days), timeline, exercise stats, hardest exercises
  .get('/stats', async ({ user }) => {
    return getProgressStats(user.userId)
  })
  .get('/resume', async ({ user }) => {
    const [row] = await db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, user.userId))
      .orderBy(desc(lessonProgress.lastViewedAt))
      .limit(1)
    return row ?? null
  })
  /**
   * Upsertuje progress za lekciju.
   *
   * BITNO: ovaj endpoint se zove i kao "view ping" (sa progressSeconds=0,
   * bez completed) — u tom slučaju NE SMEMO da resetujemo ranije postavljen
   * `completed=true` i `completedAt`. Zato upsert ima conditional set:
   *   - `completed` se postavlja samo ako je eksplicitno true u body-ju
   *     (preko COALESCE, čuva postojeću vrednost ako je null)
   *   - `progressSeconds` se uvek uzima MAX da napredak ne ide unazad
   */
  .post(
    '/:lessonId',
    async ({ params, body, user }) => {
      const now = new Date()
      const markingComplete = body.completed === true

      const baseValues = {
        userId: user.userId,
        lessonId: params.lessonId,
        progressSeconds: body.progressSeconds,
        completed: markingComplete,
        completedAt: markingComplete ? now : null,
        lastViewedAt: now,
      }

      const [row] = await db
        .insert(lessonProgress)
        .values(baseValues)
        .onConflictDoUpdate({
          target: [lessonProgress.userId, lessonProgress.lessonId],
          set: {
            // progressSeconds ide samo na više (ne resetuj na view-ping=0)
            progressSeconds: sql`GREATEST(${lessonProgress.progressSeconds}, ${body.progressSeconds})`,
            // completed: ako sad postavlja true → true; inače čuva postojeće
            completed: markingComplete
              ? sql`true`
              : lessonProgress.completed,
            // completedAt: ako sad postavlja true i nije već postavljeno → now
            completedAt: markingComplete
              ? sql`COALESCE(${lessonProgress.completedAt}, ${now})`
              : lessonProgress.completedAt,
            // lastViewedAt: uvek osvežavamo (i view-ping i complete to rade)
            lastViewedAt: now,
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
