import Elysia, { t } from 'elysia'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import { courses, lessonNotes, lessons, modules, vocabularyBookmarks } from '../../db/schema'
import { auth } from '../../middleware/auth'

export const notesModule = new Elysia({ prefix: '/me' })
  .use(auth)
  // ---------- LESSON NOTES (lične beleške) ----------
  .get(
    '/notes/:lessonId',
    async ({ user, params }) => {
      const [row] = await db
        .select()
        .from(lessonNotes)
        .where(and(eq(lessonNotes.userId, user.userId), eq(lessonNotes.lessonId, params.lessonId)))
        .limit(1)
      return row ?? { body: '' }
    },
    { params: t.Object({ lessonId: t.String() }) },
  )
  .put(
    '/notes/:lessonId',
    async ({ user, params, body }) => {
      const [row] = await db
        .insert(lessonNotes)
        .values({
          userId: user.userId,
          lessonId: params.lessonId,
          body: body.body,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [lessonNotes.userId, lessonNotes.lessonId],
          set: { body: body.body, updatedAt: new Date() },
        })
        .returning()
      return row
    },
    {
      params: t.Object({ lessonId: t.String() }),
      body: t.Object({ body: t.String({ maxLength: 10000 }) }),
    },
  )
  // ---------- VOCABULARY BOOKMARKS ----------
  .get('/bookmarks', async ({ user, query }) => {
    return db
      .select()
      .from(vocabularyBookmarks)
      .where(
        and(
          eq(vocabularyBookmarks.userId, user.userId),
          query.lessonId ? eq(vocabularyBookmarks.lessonId, query.lessonId) : undefined,
        ),
      )
      .orderBy(desc(vocabularyBookmarks.createdAt))
  }, {
    query: t.Object({ lessonId: t.Optional(t.String()) }),
  })
  .post(
    '/bookmarks',
    async ({ user, body }) => {
      const [row] = await db
        .insert(vocabularyBookmarks)
        .values({
          userId: user.userId,
          lessonId: body.lessonId ?? null,
          word: body.word,
          translation: body.translation ?? null,
          note: body.note ?? null,
        })
        .returning()
      return row
    },
    {
      body: t.Object({
        lessonId: t.Optional(t.String()),
        word: t.String({ minLength: 1, maxLength: 200 }),
        translation: t.Optional(t.String({ maxLength: 500 })),
        note: t.Optional(t.String({ maxLength: 1000 })),
      }),
    },
  )
  .delete(
    '/bookmarks/:id',
    async ({ user, params }) => {
      await db
        .delete(vocabularyBookmarks)
        .where(and(eq(vocabularyBookmarks.id, params.id), eq(vocabularyBookmarks.userId, user.userId)))
      return { ok: true }
    },
    { params: t.Object({ id: t.String() }) },
  )
  /**
   * Vraća listu bookmark grupa: po lekciji + posebno "standalone" (lessonId IS NULL).
   * Koristi se za "Ponavljanje" stranicu da student bira sa kojom lekcijom da vežba.
   */
  .get('/bookmark-groups', async ({ user }) => {
    const grouped = (await db
      .select({
        lessonId: vocabularyBookmarks.lessonId,
        count: sql<number>`count(*)::int`,
        lessonTitle: lessons.title,
        moduleTitle: modules.title,
        courseTitle: courses.title,
        courseSlug: courses.slug,
      })
      .from(vocabularyBookmarks)
      .leftJoin(lessons, eq(lessons.id, vocabularyBookmarks.lessonId))
      .leftJoin(modules, eq(modules.id, lessons.moduleId))
      .leftJoin(courses, eq(courses.id, modules.courseId))
      .where(eq(vocabularyBookmarks.userId, user.userId))
      .groupBy(
        vocabularyBookmarks.lessonId,
        lessons.title,
        modules.title,
        courses.title,
        courses.slug,
      )
      .orderBy(desc(sql`count(*)`))) as Array<{
        lessonId: string | null
        count: number
        lessonTitle: string | null
        moduleTitle: string | null
        courseTitle: string | null
        courseSlug: string | null
      }>

    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vocabularyBookmarks)
      .where(eq(vocabularyBookmarks.userId, user.userId))

    return {
      total: totalRow?.count ?? 0,
      groups: grouped.map((g) => ({
        lessonId: g.lessonId,
        count: g.count,
        lessonTitle: g.lessonTitle,
        moduleTitle: g.moduleTitle,
        courseTitle: g.courseTitle,
        courseSlug: g.courseSlug,
      })),
    }
  })
