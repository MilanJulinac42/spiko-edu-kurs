import Elysia, { t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { lessons } from '../../db/schema'

const BUNNY_STATUS_FINISHED = 4

export const webhooksModule = new Elysia({ prefix: '/webhooks' }).post(
  '/bunny',
  async ({ body }) => {
    if (body.Status === BUNNY_STATUS_FINISHED) {
      await db
        .update(lessons)
        .set({ videoReady: true })
        .where(eq(lessons.videoId, body.VideoGuid))
    }
    return { ok: true }
  },
  {
    body: t.Object({
      VideoLibraryId: t.Number(),
      VideoGuid: t.String(),
      Status: t.Number(),
    }),
  },
)
