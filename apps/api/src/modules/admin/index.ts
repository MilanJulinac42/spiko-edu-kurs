import Elysia, { t } from 'elysia'
import { db } from '../../db/client'
import { courses } from '../../db/schema'
import { requireRole } from '../../middleware/requireRole'

export const adminModule = new Elysia({ prefix: '/admin' })
  .use(requireRole('admin'))
  .get('/courses', async () => {
    return db.select().from(courses)
  })
  .post(
    '/courses',
    async ({ body }) => {
      const [row] = await db.insert(courses).values(body).returning()
      return row
    },
    {
      body: t.Object({
        title: t.String(),
        slug: t.String(),
        description: t.Optional(t.String()),
        level: t.Optional(t.String()),
        language: t.Optional(t.String()),
        thumbnailUrl: t.Optional(t.String()),
        status: t.Optional(t.String()),
        position: t.Optional(t.Integer()),
      }),
    },
  )
