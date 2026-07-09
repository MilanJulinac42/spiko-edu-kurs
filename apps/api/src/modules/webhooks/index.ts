import Elysia, { t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { courses, lessons, modules } from '../../db/schema'
import { pushVideoReadyEvent } from './events'

/**
 * Bunny Stream status kodovi:
 *   0=Created  1=Uploaded  2=Processing  3=Transcoding  4=Finished  5=Error
 */
const BUNNY_STATUS_FINISHED = 4

export const webhooksModule = new Elysia({ prefix: '/webhooks' }).post(
  '/bunny',
  async ({ body }) => {
    if (body.Status === BUNNY_STATUS_FINISHED) {
      // Update lesson + join sa modules/courses da dobijemo metadata
      // za toast obaveštenje na admin strani
      const [lessonInfo] = await db
        .select({
          lessonId: lessons.id,
          lessonTitle: lessons.title,
          courseId: courses.id,
          courseTitle: courses.title,
          courseSlug: courses.slug,
        })
        .from(lessons)
        .leftJoin(modules, eq(modules.id, lessons.moduleId))
        .leftJoin(courses, eq(courses.id, modules.courseId))
        .where(eq(lessons.videoId, body.VideoGuid))
        .limit(1)

      if (lessonInfo) {
        await db
          .update(lessons)
          .set({ videoReady: true })
          .where(eq(lessons.id, lessonInfo.lessonId))

        // Push u in-memory queue — admin client poll-uje /admin/video-events
        pushVideoReadyEvent({
          lessonId: lessonInfo.lessonId,
          lessonTitle: lessonInfo.lessonTitle ?? 'Lekcija',
          courseId: lessonInfo.courseId ?? '',
          courseTitle: lessonInfo.courseTitle ?? 'Kurs',
          courseSlug: lessonInfo.courseSlug ?? '',
          at: new Date().toISOString(),
        })
      }
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
