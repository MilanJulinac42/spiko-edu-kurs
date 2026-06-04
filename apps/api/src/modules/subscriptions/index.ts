import Elysia from 'elysia'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { db } from '../../db/client'
import { plans, subscriptions } from '../../db/schema'
import { auth } from '../../middleware/auth'

export const subscriptionsModule = new Elysia({ prefix: '/subscriptions' })
  .get('/plans', async () => {
    return db.select().from(plans).where(eq(plans.isActive, true))
  })
  .use(auth)
  .get('/me', async ({ user }) => {
    const [row] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, user.userId),
          inArray(subscriptions.status, ['active', 'trialing', 'past_due']),
        ),
      )
      .orderBy(desc(subscriptions.currentPeriodEnd))
      .limit(1)
    return { subscription: row ?? null }
  })
