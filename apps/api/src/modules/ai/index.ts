import Elysia, { t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { aiConversations, aiMessages } from '../../db/schema'
import { entitlement } from '../../middleware/entitlement'
import { aiRateLimit } from '../../middleware/rateLimit'
import { askClaude } from '../../services/claude'

export const aiModule = new Elysia({ prefix: '/ai' })
  .use(entitlement)
  .use(aiRateLimit)
  .post(
    '/message',
    async ({ body, user, bumpAiUsage }) => {
      let conversationId = body.conversationId
      if (!conversationId) {
        const [c] = await db
          .insert(aiConversations)
          .values({ userId: user.userId, lessonId: body.lessonId ?? null })
          .returning()
        conversationId = c.id
      }

      const history = await db
        .select({ role: aiMessages.role, content: aiMessages.content })
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, conversationId))

      await db.insert(aiMessages).values({
        conversationId,
        role: 'user',
        content: body.message,
      })

      const response = await askClaude({
        messages: [
          ...history.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user', content: body.message },
        ],
      })

      await db.insert(aiMessages).values({
        conversationId,
        role: 'assistant',
        content: response.text,
        tokensIn: response.tokensIn,
        tokensOut: response.tokensOut,
      })

      await bumpAiUsage(response.tokensIn, response.tokensOut)

      return { conversationId, reply: response.text }
    },
    {
      body: t.Object({
        message: t.String({ minLength: 1, maxLength: 4000 }),
        conversationId: t.Optional(t.String()),
        lessonId: t.Optional(t.String()),
      }),
    },
  )
