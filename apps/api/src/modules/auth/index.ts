import Elysia, { t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { profiles } from '../../db/schema'
import { auth } from '../../middleware/auth'

export const authModule = new Elysia({ prefix: '/me' })
  .use(auth)
  .get('/', async ({ user }) => {
    const [row] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.userId))
      .limit(1)
    return { user, profile: row ?? null }
  })
  .post(
    '/onboarding',
    async ({ user, body }) => {
      const [row] = await db
        .insert(profiles)
        .values({ id: user.userId, ...body })
        .onConflictDoUpdate({ target: profiles.id, set: body })
        .returning()
      return row
    },
    {
      body: t.Object({
        fullName: t.Optional(t.String()),
        nativeLanguage: t.Optional(t.String()),
        targetLevel: t.Optional(t.String()),
        goal: t.Optional(t.String()),
        timezone: t.Optional(t.String()),
      }),
    },
  )
