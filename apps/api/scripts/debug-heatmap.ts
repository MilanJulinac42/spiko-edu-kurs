import { db } from '../src/db/client'
import { profiles, lessonProgress } from '../src/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getProgressStats } from '../src/modules/progress/stats'

const [me] = await db
  .select()
  .from(profiles)
  .where(eq(profiles.role, 'admin'))
  .limit(1)

console.log('User:', me.id, me.fullName)
console.log('Today (local):', new Date().toISOString())

const rawRows = await db
  .select()
  .from(lessonProgress)
  .where(eq(lessonProgress.userId, me.id))
  .orderBy(desc(lessonProgress.lastViewedAt))

console.log(`\nRAW lesson_progress rows (${rawRows.length}):`)
for (const r of rawRows) {
  console.log(' ', {
    lesson: r.lessonId.slice(0, 8),
    completed: r.completed,
    lastViewedAt: r.lastViewedAt?.toISOString(),
  })
}

console.log('\nCalling getProgressStats…')
const stats = await getProgressStats(me.id)
console.log('streak:', stats.streak, 'best:', stats.bestStreak)
console.log('totals:', stats.totals)
console.log(`heatmap rows (${stats.heatmap.length}):`)
for (const h of stats.heatmap) console.log(' ', h)

process.exit(0)
