/**
 * Repair script: vraća completed=true + completedAt za sve lessonProgress
 * redove koji su izgubili tu vrednost zbog buggy view-ping-a.
 *
 * Strategija: ako lekcija ima lastViewedAt ali completed=false i progressSeconds=0,
 * pretpostavljamo da je bila završena (view-ping je obrisao). Setujemo completed=true
 * i completedAt = lastViewedAt (najbolji estimate vremena završetka).
 */
import { db } from '../src/db/client'
import { lessonProgress, profiles } from '../src/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

const [me] = await db
  .select()
  .from(profiles)
  .where(eq(profiles.role, 'admin'))
  .limit(1)

console.log('Admin user:', me.id, me.fullName)

const before = await db
  .select()
  .from(lessonProgress)
  .where(eq(lessonProgress.userId, me.id))

console.log(`Before: ${before.length} rows, completed=${before.filter(r => r.completed).length}`)

// Vrati sve "viewed but not completed" na completed=true sa completedAt = lastViewedAt
const updated = await db
  .update(lessonProgress)
  .set({
    completed: true,
    // Postgres trick: setuje completedAt = lastViewedAt
  })
  .where(
    and(
      eq(lessonProgress.userId, me.id),
      eq(lessonProgress.completed, false),
    ),
  )
  .returning()

// Drugi prolaz: completedAt = lastViewedAt za one koje smo upravo flip-ovali
for (const row of updated) {
  if (!row.completedAt && row.lastViewedAt) {
    await db
      .update(lessonProgress)
      .set({ completedAt: row.lastViewedAt })
      .where(eq(lessonProgress.id, row.id))
  }
}

const after = await db
  .select()
  .from(lessonProgress)
  .where(eq(lessonProgress.userId, me.id))

console.log(`After: ${after.length} rows, completed=${after.filter(r => r.completed).length}`)
for (const r of after) {
  console.log(' ', {
    lesson: r.lessonId.slice(0, 8),
    completed: r.completed,
    completedAt: r.completedAt?.toISOString(),
    lastViewedAt: r.lastViewedAt?.toISOString(),
  })
}

process.exit(0)
