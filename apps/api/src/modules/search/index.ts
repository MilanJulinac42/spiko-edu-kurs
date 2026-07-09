import Elysia, { t } from 'elysia'
import { and, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import {
  courses,
  exercises,
  lessons,
  modules,
  vocabularyBookmarks,
} from '../../db/schema'
import { auth } from '../../middleware/auth'

const LIMIT = 6

export const searchModule = new Elysia({ prefix: '/search' })
  .use(auth)
  .get(
    '/',
    async ({ user, query }) => {
      const q = (query.q ?? '').trim()
      if (q.length < 2) return { lessons: [], exercises: [], bookmarks: [] }

      const term = `%${q}%`

      // Lekcije — pretraga po naslovu i sadržaju (text body iz jsonb content.body)
      const lessonRows = await db
        .select({
          id: lessons.id,
          title: lessons.title,
          type: lessons.type,
          content: lessons.content,
          moduleTitle: modules.title,
          courseTitle: courses.title,
          courseSlug: courses.slug,
        })
        .from(lessons)
        .leftJoin(modules, eq(modules.id, lessons.moduleId))
        .leftJoin(courses, eq(courses.id, modules.courseId))
        .where(
          and(
            eq(lessons.status, 'published'),
            eq(courses.status, 'published'),
            or(
              ilike(lessons.title, term),
              sql`${lessons.content}->>'body' ilike ${term}`,
            ),
          ),
        )
        .limit(LIMIT)

      const lessonResults = lessonRows.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        moduleTitle: r.moduleTitle ?? '',
        courseTitle: r.courseTitle ?? '',
        href: r.courseSlug ? `/courses/${r.courseSlug}/lessons/${r.id}` : null,
        snippet: extractSnippet(
          (r.content as { body?: string } | null)?.body ?? '',
          q,
        ),
      }))

      // Vežbe — pretraga po naslovu
      const exerciseRows = await db
        .select({
          id: exercises.id,
          title: exercises.title,
          type: exercises.type,
          lessonId: exercises.lessonId,
          lessonTitle: lessons.title,
          courseSlug: courses.slug,
        })
        .from(exercises)
        .leftJoin(lessons, eq(lessons.id, exercises.lessonId))
        .leftJoin(modules, eq(modules.id, lessons.moduleId))
        .leftJoin(courses, eq(courses.id, modules.courseId))
        .where(
          and(
            eq(exercises.status, 'published'),
            ilike(exercises.title, term),
          ),
        )
        .limit(LIMIT)

      const exerciseResults = exerciseRows.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        lessonTitle: r.lessonTitle ?? '',
        href:
          r.courseSlug && r.lessonId
            ? `/courses/${r.courseSlug}/lessons/${r.lessonId}`
            : null,
      }))

      // Bookmark-ovane reči — samo svoje
      const bookmarkRows = await db
        .select()
        .from(vocabularyBookmarks)
        .where(
          and(
            eq(vocabularyBookmarks.userId, user.userId),
            or(
              ilike(vocabularyBookmarks.word, term),
              ilike(vocabularyBookmarks.translation, term),
            ),
          ),
        )
        .limit(LIMIT)

      return {
        lessons: lessonResults,
        exercises: exerciseResults,
        bookmarks: bookmarkRows.map((b) => ({
          id: b.id,
          word: b.word,
          translation: b.translation,
          note: b.note,
        })),
      }
    },
    {
      query: t.Object({ q: t.Optional(t.String({ maxLength: 100 })) }),
    },
  )

function extractSnippet(text: string, query: string, maxLen = 140): string {
  if (!text) return ''
  const plain = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!plain) return ''
  const lowerPlain = plain.toLowerCase()
  const idx = lowerPlain.indexOf(query.toLowerCase())
  if (idx === -1) {
    return plain.slice(0, maxLen) + (plain.length > maxLen ? '…' : '')
  }
  const before = 40
  const start = Math.max(0, idx - before)
  const end = Math.min(plain.length, start + maxLen)
  return (
    (start > 0 ? '…' : '') +
    plain.slice(start, end) +
    (end < plain.length ? '…' : '')
  )
}
