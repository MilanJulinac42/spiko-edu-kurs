import Elysia, { t } from 'elysia'
import { and, asc, desc, eq, isNull } from 'drizzle-orm'
import type { ExercisePayload } from '@spiko/shared'
import { db } from '../../db/client'
import { aiConversations, aiMessages, courses, exercises, lessons, modules, profiles } from '../../db/schema'
import { auth } from '../../middleware/auth'
import { aiRateLimit } from '../../middleware/rateLimit'
import { askClaude, explainWrongAnswer, quickLookup } from '../../services/claude'
import { isOpenAiConfigured, wordLookupOpenAI } from '../../services/openai'

export const aiModule = new Elysia({ prefix: '/ai' })
  .use(auth)
  // Lista konverzacija (general + per-lesson) za sidebar/historik
  .get('/conversations', async ({ user, query }) => {
    const rows = await db
      .select({
        id: aiConversations.id,
        lessonId: aiConversations.lessonId,
        createdAt: aiConversations.createdAt,
      })
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.userId, user.userId),
          query.scope === 'general' ? isNull(aiConversations.lessonId) : undefined,
          query.lessonId ? eq(aiConversations.lessonId, query.lessonId) : undefined,
        ),
      )
      .orderBy(desc(aiConversations.createdAt))
      .limit(50)
    return rows
  }, {
    query: t.Object({
      scope: t.Optional(t.Union([t.Literal('general'), t.Literal('lesson')])),
      lessonId: t.Optional(t.String()),
    }),
  })
  // Konkretna konverzacija + poruke
  .get('/conversations/:id', async ({ user, params, status }) => {
    const [conv] = await db
      .select()
      .from(aiConversations)
      .where(and(eq(aiConversations.id, params.id), eq(aiConversations.userId, user.userId)))
      .limit(1)
    if (!conv) return status(404, { error: 'not found' })
    const messages = await db
      .select({
        id: aiMessages.id,
        role: aiMessages.role,
        content: aiMessages.content,
        createdAt: aiMessages.createdAt,
      })
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conv.id))
      .orderBy(asc(aiMessages.createdAt))
    return { conversation: conv, messages }
  })
  .delete('/conversations/:id', async ({ user, params, status }) => {
    const [conv] = await db
      .select({ id: aiConversations.id })
      .from(aiConversations)
      .where(and(eq(aiConversations.id, params.id), eq(aiConversations.userId, user.userId)))
      .limit(1)
    if (!conv) return status(404, { error: 'not found' })
    await db.delete(aiConversations).where(eq(aiConversations.id, conv.id))
    return { ok: true }
  })
  /**
   * Brza pretraga reči — inline u lekciji.
   * Vrlo kratak odgovor (1-2 rečenice), sa kontekstom lekcije ako je dat.
   * Kešira se SWR-om na klijentu za isti (word + lessonId) par.
   */
  .post(
    '/quick-lookup',
    async ({ body, user }) => {
      // Učitaj profile za maternji jezik
      const [profile] = await db
        .select({
          nativeLanguage: profiles.nativeLanguage,
          targetLevel: profiles.targetLevel,
        })
        .from(profiles)
        .where(eq(profiles.id, user.userId))
        .limit(1)

      let lessonContext: { title: string; type: string; snippet: string } | null = null
      let targetLanguage: string | null = null
      if (body.lessonId) {
        const [l] = await db
          .select({
            title: lessons.title,
            type: lessons.type,
            content: lessons.content,
            language: courses.language,
          })
          .from(lessons)
          .leftJoin(modules, eq(modules.id, lessons.moduleId))
          .leftJoin(courses, eq(courses.id, modules.courseId))
          .where(eq(lessons.id, body.lessonId))
          .limit(1)
        if (l) {
          lessonContext = {
            title: l.title,
            type: l.type,
            snippet: extractContextSnippet(l.content, l.type),
          }
          targetLanguage = l.language ?? null
        }
      }

      // Word lookup → OpenAI (gpt-4o-mini): brzo + jeftino. Fallback na Claude
      // ako OpenAI ključ nije postavljen (npr. lokalno bez ključa).
      const lookupArgs = {
        word: body.word,
        nativeLanguage: profile?.nativeLanguage ?? 'sr',
        targetLevel: profile?.targetLevel ?? null,
        targetLanguage,
        lesson: lessonContext,
      }
      const res = isOpenAiConfigured()
        ? await wordLookupOpenAI(lookupArgs)
        : await quickLookup(lookupArgs)

      return {
        word: body.word,
        translation: res.translation,
        explanation: res.explanation,
        isNative: res.isNative ?? false,
      }
    },
    {
      body: t.Object({
        word: t.String({ minLength: 1, maxLength: 200 }),
        lessonId: t.Optional(t.String()),
      }),
    },
  )
  /**
   * Objasni studentu zašto je odgovor pogrešan. Koristi se u exercise player-u
   * kao "✨ Objasni mi" dugme. Server sam izvlači tačan odgovor iz baze, klijent
   * šalje samo `exerciseId` i svoj odgovor — tako da fronted nikad ne dobija
   * "naked" tačan odgovor preko REST-a.
   */
  .post(
    '/explain-wrong',
    async ({ body, user, status }) => {
      // Učitaj payload — ili iz `exercises` (multi-exercise mode) ili iz
      // `lessons.content` (legacy single-exercise lesson).
      let payload: ExercisePayload | null = null
      if ('exerciseId' in body && body.exerciseId) {
        const [ex] = await db
          .select()
          .from(exercises)
          .where(eq(exercises.id, body.exerciseId))
          .limit(1)
        if (!ex) return status(404, { error: 'exercise not found' })
        payload = ex.payload as ExercisePayload | null
      } else if ('lessonId' in body && body.lessonId) {
        const [l] = await db
          .select()
          .from(lessons)
          .where(eq(lessons.id, body.lessonId))
          .limit(1)
        if (!l) return status(404, { error: 'lesson not found' })
        payload = l.content as ExercisePayload | null
      }
      if (!payload) return status(400, { error: 'no payload' })

      const { question, correctAnswer, studentAnswer } = describeAnswerPair(
        payload,
        body.studentAnswer,
      )

      const [profile] = await db
        .select({
          nativeLanguage: profiles.nativeLanguage,
          targetLevel: profiles.targetLevel,
        })
        .from(profiles)
        .where(eq(profiles.id, user.userId))
        .limit(1)

      const res = await explainWrongAnswer({
        question,
        exerciseType: payload.type,
        studentAnswer,
        correctAnswer,
        nativeLanguage: profile?.nativeLanguage ?? 'sr',
        targetLevel: profile?.targetLevel ?? null,
      })

      return { explanation: res.explanation }
    },
    {
      body: t.Object({
        exerciseId: t.Optional(t.String()),
        lessonId: t.Optional(t.String()),
        studentAnswer: t.Unknown(),
      }),
    },
  )
  // Pošalji novu poruku — sa lesson kontekstom ako je vezan
  .use(aiRateLimit)
  .post(
    '/message',
    async ({ body, user, bumpAiUsage }) => {
      let conversationId = body.conversationId
      let conversationLessonId: string | null = body.lessonId ?? null

      if (!conversationId) {
        const [c] = await db
          .insert(aiConversations)
          .values({ userId: user.userId, lessonId: body.lessonId ?? null })
          .returning()
        conversationId = c.id
      } else {
        const [c] = await db
          .select({ lessonId: aiConversations.lessonId })
          .from(aiConversations)
          .where(eq(aiConversations.id, conversationId))
          .limit(1)
        conversationLessonId = c?.lessonId ?? null
      }

      // Učitaj kontekst za system prompt
      const [profile] = await db
        .select({
          fullName: profiles.fullName,
          targetLevel: profiles.targetLevel,
          nativeLanguage: profiles.nativeLanguage,
          goal: profiles.goal,
        })
        .from(profiles)
        .where(eq(profiles.id, user.userId))
        .limit(1)

      let lessonContext: { title: string; type: string; snippet: string } | null = null
      if (conversationLessonId) {
        const [l] = await db
          .select()
          .from(lessons)
          .where(eq(lessons.id, conversationLessonId))
          .limit(1)
        if (l) {
          const exRows = await db
            .select({ title: exercises.title, type: exercises.type, payload: exercises.payload })
            .from(exercises)
            .where(and(eq(exercises.lessonId, l.id), eq(exercises.status, 'published')))
            .orderBy(asc(exercises.position))
          const textSnippet = extractContextSnippet(l.content, l.type)
          const exSummary = summarizeExercises(exRows)
          // Transkript videa (Whisper) — često glavni sadržaj lekcije
          const transcript = (l.transcript ?? '').trim()
          const snippet = [
            textSnippet,
            transcript ? `Transkript videa:\n${transcript.slice(0, 4000)}` : '',
            exSummary ? `Vežbe u lekciji:\n${exSummary}` : '',
          ]
            .filter(Boolean)
            .join('\n\n')
          lessonContext = { title: l.title, type: l.type, snippet }
        }
      }

      const history = await db
        .select({ role: aiMessages.role, content: aiMessages.content })
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, conversationId))
        .orderBy(asc(aiMessages.createdAt))

      await db.insert(aiMessages).values({
        conversationId,
        role: 'user',
        content: body.message,
      })

      const response = await askClaude({
        profile: profile ?? null,
        lesson: lessonContext,
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

/**
 * Pretvori payload + student response u plain text reprezentaciju koju
 * AI može da koristi. Format: pitanje + tačan + student.
 */
function describeAnswerPair(payload: ExercisePayload, student: unknown): {
  question: string
  correctAnswer: string
  studentAnswer: string
} {
  if (payload.type === 'multiple_choice') {
    const d = payload.data
    const correctOpt = d.options.find((o) => o.id === d.correctOptionId)
    const correctText = correctOpt?.text ?? '(nepoznato)'
    const studentText =
      typeof student === 'string'
        ? d.options.find((o) => o.id === student)?.text ?? student
        : '(bez odgovora)'
    return {
      question: d.question,
      correctAnswer: correctText,
      studentAnswer: studentText,
    }
  }
  if (payload.type === 'fill_blank') {
    const d = payload.data
    const correct = d.answers.map((a) => a.accepted[0] ?? '').join(' | ')
    const studentArr = Array.isArray(student) ? (student as string[]) : []
    return {
      question: `Šablon: ${d.template}`,
      correctAnswer: correct,
      studentAnswer: studentArr.join(' | ') || '(bez odgovora)',
    }
  }
  if (payload.type === 'matching') {
    const d = payload.data
    const rightById = new Map(d.right.map((r) => [r.id, r.text]))
    const correctPairs = d.left
      .map((l) => {
        const rightId = d.pairs[l.id]
        const rightText = rightId ? rightById.get(rightId) ?? '(?)' : '(?)'
        return `${l.text} → ${rightText}`
      })
      .join('; ')
    return {
      question: d.question ?? 'Uparivanje',
      correctAnswer: correctPairs,
      studentAnswer: JSON.stringify(student),
    }
  }
  if (payload.type === 'ordering') {
    const d = payload.data
    const correctText = d.items.map((i) => i.text).join(' → ')
    let studentText: string
    if (Array.isArray(student)) {
      const byId = new Map(d.items.map((i) => [i.id, i.text]))
      studentText = (student as string[])
        .map((id) => byId.get(id) ?? id)
        .join(' → ')
    } else {
      studentText = JSON.stringify(student)
    }
    return {
      question: d.question ?? 'Redosled',
      correctAnswer: correctText,
      studentAnswer: studentText,
    }
  }
  return {
    question: '(nepoznat tip vežbe)',
    correctAnswer: '(nepoznat)',
    studentAnswer: JSON.stringify(student),
  }
}

function extractContextSnippet(content: unknown, type: string): string {
  if (!content || typeof content !== 'object') return ''
  // Kompozitne lekcije imaju type 'video'/'text', ali tekst uvek živi u content.body.
  // Uzmi ga uvek kad postoji — ne zavisi od `type`.
  if ('body' in content) {
    const body = String((content as { body?: string }).body ?? '')
    const stripped = stripHtml(body).slice(0, 1500)
    if (stripped) return stripped
  }
  // Legacy single-exercise lekcije (content je sam exercise payload).
  if ('type' in content && 'data' in content) {
    const ex = content as ExercisePayload
    if (ex.type === 'multiple_choice') return `Pitanje: ${ex.data.question}`
    if (ex.type === 'fill_blank') return `Šablon: ${ex.data.template}`
    if (ex.type === 'matching') return `Uparivanje: ${ex.data.question ?? ''}`
    if (ex.type === 'ordering') return `Redosled: ${ex.data.question ?? ''}`
  }
  return ''
}

/** Kratak pregled vežbi u lekciji — naslovi + pitanja, da tutor zna šta se vežba. */
function summarizeExercises(rows: Array<{ title: string; type: string; payload: unknown }>): string {
  if (rows.length === 0) return ''
  const lines = rows.map((r, i) => {
    const p = r.payload as ExercisePayload | null
    let q = ''
    if (p && typeof p === 'object' && 'type' in p && 'data' in p) {
      if (p.type === 'multiple_choice') q = p.data.question ?? ''
      else if (p.type === 'fill_blank') q = p.data.template ?? ''
      else if (p.type === 'matching') q = p.data.question ?? ''
      else if (p.type === 'ordering') q = p.data.question ?? ''
    }
    return `${i + 1}. ${r.title}${q ? ` — ${stripHtml(q).slice(0, 160)}` : ''}`
  })
  return lines.join('\n')
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
