import Elysia from 'elysia'
import { and, eq, gt, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { subscriptions } from '../db/schema'
import { auth } from './auth'

export const entitlement = new Elysia({ name: 'entitlement' })
  .use(auth)
  .resolve(async ({ user, set }) => {
    const rows = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, user.userId),
          inArray(subscriptions.status, ['active', 'trialing']),
          gt(subscriptions.currentPeriodEnd, new Date()),
        ),
      )
      .limit(1)

    if (!rows.length) {
      set.status = 402
      throw new Error('subscription required')
    }
    return { entitled: true as const }
  })
  .as('scoped')
