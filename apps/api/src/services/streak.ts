import { eq, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { lessonProgress } from '../db/schema'

/**
 * Vraća trenutni "niz dana" — koliko uzastopnih dana je student bio aktivan.
 * Aktivnost se računa po `lesson_progress.last_viewed_at`.
 *
 * Logika:
 * - Uzmi DISTINCT datume kad je korisnik gledao bilo koju lekciju (UTC).
 * - Ako je poslednji datum ranije od juče → streak = 0 (prekinut niz).
 * - U suprotnom broji unazad uzastopne dane.
 */
export async function calculateStreak(userId: string): Promise<number> {
  const rows = (await db
    .select({
      day: sql<string>`to_char(${lessonProgress.lastViewedAt} at time zone 'UTC', 'YYYY-MM-DD')`,
    })
    .from(lessonProgress)
    .where(eq(lessonProgress.userId, userId))
    .groupBy(sql`to_char(${lessonProgress.lastViewedAt} at time zone 'UTC', 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${lessonProgress.lastViewedAt} at time zone 'UTC', 'YYYY-MM-DD') desc`)) as Array<{ day: string }>

  if (!rows.length) return 0

  const days = rows.map((r) => parseUtcDate(r.day))
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)

  const latest = days[0]
  if (latest.getTime() < yesterday.getTime()) return 0

  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const expectedPrev = new Date(days[i - 1])
    expectedPrev.setUTCDate(expectedPrev.getUTCDate() - 1)
    if (days[i].getTime() === expectedPrev.getTime()) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function parseUtcDate(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt
}
