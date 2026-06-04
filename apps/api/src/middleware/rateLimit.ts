import Elysia from 'elysia'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { aiUsage } from '../db/schema'
import { auth } from './auth'

const DAILY_AI_MESSAGE_LIMIT = 50

export const aiRateLimit = new Elysia({ name: 'aiRateLimit' })
  .use(auth)
  .resolve(async ({ user, set }) => {
    const today = new Date().toISOString().slice(0, 10)

    const [row] = await db
      .select({ messageCount: aiUsage.messageCount })
      .from(aiUsage)
      .where(and(eq(aiUsage.userId, user.userId), eq(aiUsage.period, today)))
      .limit(1)

    if (row && row.messageCount >= DAILY_AI_MESSAGE_LIMIT) {
      set.status = 429
      throw new Error('ai daily limit reached')
    }

    return {
      bumpAiUsage: async (tokensIn: number, tokensOut: number) => {
        await db
          .insert(aiUsage)
          .values({
            userId: user.userId,
            period: today,
            messageCount: 1,
            tokensUsed: tokensIn + tokensOut,
          })
          .onConflictDoUpdate({
            target: [aiUsage.userId, aiUsage.period],
            set: {
              messageCount: sql`${aiUsage.messageCount} + 1`,
              tokensUsed: sql`${aiUsage.tokensUsed} + ${tokensIn + tokensOut}`,
            },
          })
      },
    }
  })
  .as('scoped')
