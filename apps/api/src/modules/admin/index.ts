import Elysia, { t } from 'elysia'
import { and, asc, eq, inArray, isNull, max } from 'drizzle-orm'
import { db } from '../../db/client'
import {
  courses,
  exercises,
  lessons,
  modules,
  profiles,
} from '../../db/schema'
import { requireRole } from '../../middleware/requireRole'
import {
  bunnyThumbnailUrl,
  createBunnyVideo,
  deleteBunnyVideo,
  fetchBunnyVideoStatus,
  getTusUploadAuth,
  listBunnyVideos,
  signedMp4Url,
  uploadBunnyCaption,
} from '../../services/bunny'
import { isOpenAiConfigured, transcribeVideoWhisper } from '../../services/openai'
import {
  deleteAudio,
  deleteCourseThumbnail,
  isBunnyStorageConfigured,
  uploadAudio,
  uploadCourseThumbnail,
} from '../../services/bunny-storage'
import { getVideoReadyEventsSince } from '../webhooks/events'

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024 // 5 MB — front ionako resize-uje na ~150KB JPEG
import { generateCourseStructure, type GeneratedCourseStructure } from '../../services/claude'

const ContentStatus = t.Union([
  t.Literal('draft'),
  t.Literal('published'),
  t.Literal('hidden'),
])

const LessonType = t.Union([
  t.Literal('video'),
  t.Literal('text'),
  t.Literal('exercise'),
])

const ExerciseType = t.Union([
  t.Literal('multiple_choice'),
  t.Literal('fill_blank'),
  t.Literal('matching'),
  t.Literal('ordering'),
])

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // ukloni dijakritike
    .replace(/đ/g, 'dj')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function inferAudioExtension(mime: string, filename: string): string {
  // Iz MIME prvo (ako server šalje pravilan content-type)
  const mimeMap: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
  }
  if (mime && mimeMap[mime.toLowerCase()]) return mimeMap[mime.toLowerCase()]
  // Inače iz ekstenzije fajla
  const m = filename.match(/\.([a-z0-9]{2,5})$/i)
  if (m) return m[1].toLowerCase()
  return 'webm'
}

async function nextCoursePosition() {
  const [row] = await db.select({ max: max(courses.position) }).from(courses)
  return (row?.max ?? -1) + 1
}
async function nextModulePosition(courseId: string) {
  const [row] = await db
    .select({ max: max(modules.position) })
    .from(modules)
    .where(eq(modules.courseId, courseId))
  return (row?.max ?? -1) + 1
}
async function nextLessonPosition(moduleId: string) {
  const [row] = await db
    .select({ max: max(lessons.position) })
    .from(lessons)
    .where(eq(lessons.moduleId, moduleId))
  return (row?.max ?? -1) + 1
}
async function nextExercisePosition(lessonId: string) {
  const [row] = await db
    .select({ max: max(exercises.position) })
    .from(exercises)
    .where(eq(exercises.lessonId, lessonId))
  return (row?.max ?? -1) + 1
}

export const adminModule = new Elysia({ prefix: '/admin' })
  .use(requireRole('admin'))
  /**
   * Pošalji nazad Bunny video-ready event-ove od `since` timestamp-a.
   * Admin client poll-uje ovo svakih ~20s i prikazuje toast po novom event-u.
   *
   * Empty array je tipičan response — events stižu tek kad Bunny obradi video.
   */
  .get(
    '/video-events',
    ({ query }) => {
      return { events: getVideoReadyEventsSince(query.since ?? '') }
    },
    {
      query: t.Object({
        since: t.Optional(t.String()),
      }),
    },
  )
  // ---------- STATS (dashboard pregled) ----------
  /**
   * Agregirani brojevi za /admin (Pregled) — jedan poziv, manje round-trip-ova.
   */
  .get('/stats', async () => {
    // Template = exercise sa lessonId === null; in-lesson = lessonId IS NOT NULL
    const [
      allCourses,
      allUsers,
      allExercises,
    ] = await Promise.all([
      db.select({ status: courses.status }).from(courses),
      db.select({ role: profiles.role }).from(profiles),
      db.select({ lessonId: exercises.lessonId }).from(exercises),
    ])

    const templateCount = allExercises.filter((e) => e.lessonId === null).length
    const inLessonCount = allExercises.length - templateCount

    return {
      courses: {
        total: allCourses.length,
        published: allCourses.filter((c) => c.status === 'published').length,
        draft: allCourses.filter((c) => c.status === 'draft').length,
        hidden: allCourses.filter((c) => c.status === 'hidden').length,
      },
      users: {
        total: allUsers.length,
        students: allUsers.filter((u) => u.role === 'student').length,
        teachers: allUsers.filter((u) => u.role === 'teacher').length,
        admins: allUsers.filter((u) => u.role === 'admin').length,
      },
      exercises: {
        total: allExercises.length,
        inLessons: inLessonCount,
        templates: templateCount,
      },
    }
  })
  // ---------- COURSES ----------
  .get('/courses', async () => {
    return db.select().from(courses).orderBy(asc(courses.position))
  })
  .post(
    '/courses',
    async ({ body }) => {
      const position = await nextCoursePosition()
      const [row] = await db
        .insert(courses)
        .values({ ...body, position })
        .returning()
      return row
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 200 }),
        slug: t.String({ minLength: 1, maxLength: 100 }),
        description: t.Optional(t.String({ maxLength: 5000 })),
        level: t.Optional(t.String({ maxLength: 10 })),
        language: t.Optional(t.String({ maxLength: 10 })),
        thumbnailUrl: t.Optional(t.String({ maxLength: 1000 })),
        status: t.Optional(ContentStatus),
      }),
    },
  )
  .get('/courses/:id', async ({ params, status }) => {
    const [course] = await db.select().from(courses).where(eq(courses.id, params.id)).limit(1)
    if (!course) return status(404, { error: 'not found' })
    const courseModules = await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, course.id))
      .orderBy(asc(modules.position))
    const moduleIds = courseModules.map((m) => m.id)
    const allLessons = moduleIds.length
      ? await db
          .select()
          .from(lessons)
          .where(inArray(lessons.moduleId, moduleIds))
          .orderBy(asc(lessons.position))
      : []
    // Pridrži i vežbe po lekciji za multi-exercise mode
    const lessonIds = allLessons.map((l) => l.id)
    const allExercises = lessonIds.length
      ? await db
          .select()
          .from(exercises)
          .where(inArray(exercises.lessonId, lessonIds))
          .orderBy(asc(exercises.position))
      : []

    const tree = courseModules.map((m) => ({
      ...m,
      lessons: allLessons
        .filter((l) => l.moduleId === m.id)
        .map((l) => ({
          ...l,
          exercises: allExercises.filter((e) => e.lessonId === l.id),
        })),
    }))
    return { ...course, modules: tree }
  })
  // Lista vežbi po lekciji za admin (pun payload sa tačnim odgovorima)
  .get(
    '/lessons/:id/exercises',
    async ({ params }) => {
      return db
        .select()
        .from(exercises)
        .where(eq(exercises.lessonId, params.id))
        .orderBy(asc(exercises.position))
    },
    { params: t.Object({ id: t.String() }) },
  )
  .post(
    '/lessons/:id/reorder-exercises',
    async ({ params, body }) => {
      for (let i = 0; i < body.ids.length; i++) {
        await db
          .update(exercises)
          .set({ position: i })
          .where(and(eq(exercises.id, body.ids[i]), eq(exercises.lessonId, params.id)))
      }
      return { ok: true }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ ids: t.Array(t.String()) }),
    },
  )
  .patch(
    '/courses/:id',
    async ({ params, body }) => {
      const [row] = await db
        .update(courses)
        .set(body)
        .where(eq(courses.id, params.id))
        .returning()
      return row
    },
    {
      body: t.Partial(
        t.Object({
          title: t.String(),
          slug: t.String(),
          description: t.String(),
          level: t.String(),
          language: t.String(),
          thumbnailUrl: t.String(),
          status: ContentStatus,
          position: t.Integer(),
        }),
      ),
    },
  )
  .delete('/courses/:id', async ({ params }) => {
    await db.delete(courses).where(eq(courses.id, params.id))
    return { ok: true }
  })
  /**
   * Upload course thumbnail — multipart/form-data sa `file` poljem.
   * Slika se već resize-uje na 1280×720 JPEG na frontu pre upload-a
   * (vidi `apps/admin/components/ThumbnailUpload.tsx`).
   */
  .post(
    '/courses/:id/thumbnail',
    async ({ params, body, status }) => {
      if (!isBunnyStorageConfigured()) {
        return status(503, { error: 'Bunny Storage nije konfigurisan na serveru' })
      }
      const file = body.file
      if (!(file instanceof File)) {
        return status(400, { error: 'file is required' })
      }
      if (file.size > MAX_THUMBNAIL_BYTES) {
        return status(413, { error: `Fajl je prevelik (max ${MAX_THUMBNAIL_BYTES / 1024 / 1024} MB)` })
      }
      if (!ALLOWED_IMAGE_MIME.has(file.type)) {
        return status(415, { error: 'Podržani formati: JPEG, PNG, WebP' })
      }

      try {
        // Zapamti stari URL — da obrišemo prethodni fajl posle uspešnog upload-a
        const [prev] = await db
          .select({ thumbnailUrl: courses.thumbnailUrl })
          .from(courses)
          .where(eq(courses.id, params.id))

        const buffer = await file.arrayBuffer()
        const { url } = await uploadCourseThumbnail({ buffer, courseId: params.id })

        const [row] = await db
          .update(courses)
          .set({ thumbnailUrl: url })
          .where(eq(courses.id, params.id))
          .returning()

        // Best-effort cleanup starog fajla — ne blokira odgovor
        if (prev?.thumbnailUrl && prev.thumbnailUrl !== url) {
          deleteCourseThumbnail(prev.thumbnailUrl).catch(() => {})
        }

        return { url, course: row }
      } catch (e) {
        return status(500, {
          error: e instanceof Error ? e.message : 'upload failed',
        })
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ file: t.Any() }),
    },
  )
  /**
   * Brisanje thumbnail-a — vraća na default placeholder.
   */
  .delete(
    '/courses/:id/thumbnail',
    async ({ params, status }) => {
      try {
        const [prev] = await db
          .select({ thumbnailUrl: courses.thumbnailUrl })
          .from(courses)
          .where(eq(courses.id, params.id))

        if (isBunnyStorageConfigured() && prev?.thumbnailUrl) {
          await deleteCourseThumbnail(prev.thumbnailUrl).catch(() => {})
        }

        const [row] = await db
          .update(courses)
          .set({ thumbnailUrl: null })
          .where(eq(courses.id, params.id))
          .returning()
        return { course: row }
      } catch (e) {
        return status(500, {
          error: e instanceof Error ? e.message : 'delete failed',
        })
      }
    },
    {
      params: t.Object({ id: t.String() }),
    },
  )
  // ---------- MODULES ----------
  .post(
    '/modules',
    async ({ body }) => {
      const position = await nextModulePosition(body.courseId)
      const [row] = await db.insert(modules).values({ ...body, position }).returning()
      return row
    },
    {
      body: t.Object({
        courseId: t.String(),
        title: t.String({ minLength: 1, maxLength: 200 }),
      }),
    },
  )
  .patch(
    '/modules/:id',
    async ({ params, body }) => {
      const [row] = await db
        .update(modules)
        .set(body)
        .where(eq(modules.id, params.id))
        .returning()
      return row
    },
    {
      body: t.Partial(
        t.Object({
          title: t.String(),
          position: t.Integer(),
        }),
      ),
    },
  )
  .delete('/modules/:id', async ({ params }) => {
    await db.delete(modules).where(eq(modules.id, params.id))
    return { ok: true }
  })
  // ---------- LESSONS ----------
  .post(
    '/lessons',
    async ({ body }) => {
      const position = await nextLessonPosition(body.moduleId)
      const [row] = await db
        .insert(lessons)
        .values({
          moduleId: body.moduleId,
          title: body.title,
          type: body.type,
          content: body.content ?? null,
          videoId: body.videoId ?? null,
          status: body.status ?? 'draft',
          position,
        })
        .returning()
      return row
    },
    {
      body: t.Object({
        moduleId: t.String(),
        title: t.String({ minLength: 1, maxLength: 200 }),
        type: LessonType,
        content: t.Optional(t.Unknown()),
        videoId: t.Optional(t.String()),
        status: t.Optional(ContentStatus),
      }),
    },
  )
  .patch(
    '/lessons/:id',
    async ({ params, body }) => {
      const [row] = await db
        .update(lessons)
        .set(body)
        .where(eq(lessons.id, params.id))
        .returning()
      return row
    },
    {
      body: t.Partial(
        t.Object({
          title: t.String(),
          type: LessonType,
          content: t.Unknown(),
          videoId: t.String(),
          videoReady: t.Boolean(),
          durationSeconds: t.Integer(),
          status: ContentStatus,
          position: t.Integer(),
          contentOrder: t.Array(
            t.Union([
              t.Literal('video'),
              t.Literal('text'),
              t.Literal('exercises'),
              t.Literal('audio'),
            ]),
          ),
          audioUrl: t.Union([t.String(), t.Null()]),
          audioTitle: t.Union([t.String(), t.Null()]),
          transcript: t.Union([t.String(), t.Null()]),
        }),
      ),
    },
  )
  .delete('/lessons/:id', async ({ params }) => {
    await db.delete(lessons).where(eq(lessons.id, params.id))
    return { ok: true }
  })
  // ---------- WHISPER TRANSKRIPT (titl za video) ----------
  // Ručni okidač: transkribuje video (Whisper) → VTT titl na Bunny plejer (CC)
  // + čist tekst u lessons.transcript (AI tutor kontekst).
  .post(
    '/lessons/:id/transcribe',
    async ({ params, status }) => {
      if (!isOpenAiConfigured()) {
        return status(400, { error: 'OpenAI ključ nije konfigurisan.' })
      }
      const [l] = await db
        .select({
          id: lessons.id,
          videoId: lessons.videoId,
          videoReady: lessons.videoReady,
          language: courses.language,
        })
        .from(lessons)
        .leftJoin(modules, eq(modules.id, lessons.moduleId))
        .leftJoin(courses, eq(courses.id, modules.courseId))
        .where(eq(lessons.id, params.id))
        .limit(1)

      if (!l) return status(404, { error: 'lekcija ne postoji' })
      if (!l.videoId) return status(400, { error: 'lekcija nema video za transkripciju' })
      if (!l.videoReady) return status(400, { error: 'video još nije spreman (u obradi)' })

      const lang = l.language || 'de'
      try {
        const mp4Url = signedMp4Url(l.videoId)
        const { vtt, text } = await transcribeVideoWhisper(mp4Url, lang)

        // Titl na plejer — best-effort (ako padne, tekst svejedno čuvamo)
        let captionOnPlayer = true
        try {
          await uploadBunnyCaption(l.videoId, lang, lang.toUpperCase(), vtt)
        } catch {
          captionOnPlayer = false
        }

        await db.update(lessons).set({ transcript: text }).where(eq(lessons.id, l.id))
        return { transcript: text, captionOnPlayer }
      } catch (e) {
        return status(422, { error: e instanceof Error ? e.message : 'transkripcija nije uspela' })
      }
    },
    { params: t.Object({ id: t.String() }) },
  )
  // ---------- REORDER (bulk position update) ----------
  .post(
    '/reorder/modules',
    async ({ body }) => {
      for (let i = 0; i < body.ids.length; i++) {
        await db
          .update(modules)
          .set({ position: i })
          .where(and(eq(modules.id, body.ids[i]), eq(modules.courseId, body.courseId)))
      }
      return { ok: true }
    },
    {
      body: t.Object({
        courseId: t.String(),
        ids: t.Array(t.String()),
      }),
    },
  )
  .post(
    '/reorder/lessons',
    async ({ body }) => {
      for (let i = 0; i < body.ids.length; i++) {
        await db
          .update(lessons)
          .set({ position: i, moduleId: body.moduleId })
          .where(eq(lessons.id, body.ids[i]))
      }
      return { ok: true }
    },
    {
      body: t.Object({
        moduleId: t.String(),
        ids: t.Array(t.String()),
      }),
    },
  )
  // ---------- EXERCISE TEMPLATES (biblioteka — lessonId IS NULL) ----------
  .get('/exercises/templates', async ({ query }) => {
    return db
      .select()
      .from(exercises)
      .where(
        and(
          isNull(exercises.lessonId),
          query.type ? eq(exercises.type, query.type) : undefined,
        ),
      )
      .orderBy(asc(exercises.title))
  }, {
    query: t.Object({
      type: t.Optional(t.String()),
    }),
  })
  .post(
    '/exercises/templates',
    async ({ body }) => {
      const [row] = await db
        .insert(exercises)
        .values({
          lessonId: null,
          title: body.title,
          type: body.type,
          payload: body.payload,
          status: 'published',
          position: 0,
        })
        .returning()
      return row
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 200 }),
        type: ExerciseType,
        payload: t.Unknown(),
      }),
    },
  )
  /**
   * Ubaci template u lekciju — kopira payload kao NOVI exercise red sa lessonId.
   * Posle ubacivanja izmene više ne utiču na template (decoupled copy).
   */
  .post(
    '/lessons/:id/exercises/from-template',
    async ({ params, body, status }) => {
      const [tpl] = await db
        .select()
        .from(exercises)
        .where(eq(exercises.id, body.templateId))
        .limit(1)
      if (!tpl) return status(404, { error: 'template not found' })
      const position = await nextExercisePosition(params.id)
      const [row] = await db
        .insert(exercises)
        .values({
          lessonId: params.id,
          title: tpl.title,
          type: tpl.type,
          payload: tpl.payload,
          status: 'published',
          position,
        })
        .returning()
      return row
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ templateId: t.String() }),
    },
  )
  // ---------- EXERCISES (per-lesson CRUD) ----------
  .post(
    '/exercises',
    async ({ body }) => {
      const position = await nextExercisePosition(body.lessonId)
      const [row] = await db.insert(exercises).values({ ...body, position }).returning()
      return row
    },
    {
      body: t.Object({
        lessonId: t.String(),
        title: t.String({ minLength: 1, maxLength: 200 }),
        type: ExerciseType,
        payload: t.Unknown(),
        status: t.Optional(ContentStatus),
      }),
    },
  )
  .patch(
    '/exercises/:id',
    async ({ params, body }) => {
      const [row] = await db
        .update(exercises)
        .set(body)
        .where(eq(exercises.id, params.id))
        .returning()
      return row
    },
    {
      body: t.Partial(
        t.Object({
          title: t.String(),
          type: ExerciseType,
          payload: t.Unknown(),
          status: ContentStatus,
          position: t.Integer(),
          audioUrl: t.Union([t.String(), t.Null()]),
          audioTitle: t.Union([t.String(), t.Null()]),
        }),
      ),
    },
  )
  .delete('/exercises/:id', async ({ params }) => {
    await db.delete(exercises).where(eq(exercises.id, params.id))
    return { ok: true }
  })
  // ---------- BUNNY VIDEO UPLOAD ----------
  /**
   * Pre upload-a: kreira prazan video u Bunny library i vraća TUS auth.
   * Browser onda direktno uploaduje fajl na Bunny preko TUS protokola — backend
   * ne prolazi kroz fajl (nema bandwidth trošak, nema chunkovanja kroz nas).
   */
  .post(
    '/bunny/videos',
    async ({ body }) => {
      const { guid } = await createBunnyVideo(body.title)
      const { videoId: _vid, ...tus } = getTusUploadAuth(guid)
      void _vid
      return { videoId: guid, ...tus }
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 200 }),
      }),
    },
  )
  /**
   * Sinhronizuje status video-a sa Bunny-jem — koristi se kad webhook ne stiže
   * (lokalni dev). Ako je `status === 4` (Finished), flipuje `video_ready=true`
   * u svim lekcijama koje koriste taj videoId.
   */
  .post(
    '/bunny/videos/:videoId/sync',
    async ({ params }) => {
      const info = await fetchBunnyVideoStatus(params.videoId)
      if (info.available) {
        await db
          .update(lessons)
          .set({
            videoReady: true,
            durationSeconds: info.length || undefined,
          })
          .where(eq(lessons.videoId, params.videoId))
      }
      return {
        videoId: params.videoId,
        status: info.status,
        ready: info.available,
        durationSeconds: info.length,
        width: info.width,
        height: info.height,
      }
    },
    {
      params: t.Object({ videoId: t.String() }),
    },
  )
  /**
   * Briše video iz Bunny library (kad admin promeni mišljenje pre snimanja
   * lekcije, ili zameni postojeći video).
   */
  .delete(
    '/bunny/videos/:videoId',
    async ({ params }) => {
      await deleteBunnyVideo(params.videoId)
      return { ok: true }
    },
    {
      params: t.Object({ videoId: t.String() }),
    },
  )
  // ---------- MEDIA LIBRARY (Bunny biblioteka, cross-ref sa lekcijama) ----------
  /**
   * Vraća sve videe iz Bunny library-ja, obogaćene informacijom u kojoj
   * lekciji (kursu/modulu) se koriste — ili da su "siročad" bez lekcije.
   */
  .get('/media/videos', async () => {
    const [bunnyVideos, lessonRows] = await Promise.all([
      listBunnyVideos(),
      db
        .select({
          videoId: lessons.videoId,
          lessonId: lessons.id,
          lessonTitle: lessons.title,
          lessonStatus: lessons.status,
          moduleTitle: modules.title,
          courseTitle: courses.title,
          courseSlug: courses.slug,
          courseId: courses.id,
        })
        .from(lessons)
        .leftJoin(modules, eq(modules.id, lessons.moduleId))
        .leftJoin(courses, eq(courses.id, modules.courseId)),
    ])

    // Mapa videoId → niz lekcija koje ga koriste
    const usageMap = new Map<string, Array<{
      lessonId: string
      lessonTitle: string
      lessonStatus: string
      moduleTitle: string | null
      courseTitle: string | null
      courseSlug: string | null
      courseId: string | null
    }>>()
    for (const r of lessonRows) {
      if (!r.videoId) continue
      const arr = usageMap.get(r.videoId) ?? []
      arr.push({
        lessonId: r.lessonId,
        lessonTitle: r.lessonTitle,
        lessonStatus: r.lessonStatus,
        moduleTitle: r.moduleTitle,
        courseTitle: r.courseTitle,
        courseSlug: r.courseSlug,
        courseId: r.courseId,
      })
      usageMap.set(r.videoId, arr)
    }

    const items = bunnyVideos.map((v) => {
      const usage = usageMap.get(v.guid) ?? []
      return {
        guid: v.guid,
        title: v.title,
        dateUploaded: v.dateUploaded,
        length: v.length,
        storageSize: v.storageSize,
        status: v.status, // 0..6 (vidi fetchBunnyVideoStatus komentar)
        encodeProgress: v.encodeProgress,
        width: v.width,
        height: v.height,
        views: v.views,
        thumbnailUrl: v.thumbnailFileName
          ? bunnyThumbnailUrl(v.guid, v.thumbnailFileName)
          : null,
        usage,
        isOrphan: usage.length === 0,
      }
    })

    const totalBytes = items.reduce((s, v) => s + (v.storageSize ?? 0), 0)
    const totalSeconds = items.reduce((s, v) => s + (v.length ?? 0), 0)

    return {
      total: items.length,
      orphans: items.filter((v) => v.isOrphan).length,
      ready: items.filter((v) => v.status === 4).length,
      processing: items.filter((v) => v.status >= 1 && v.status <= 3).length,
      errors: items.filter((v) => v.status === 5 || v.status === 6).length,
      totalBytes,
      totalSeconds,
      items,
    }
  })
  /**
   * Bulk brisanje "siročadi" — videa koji nisu povezani ni sa jednom lekcijom.
   * Vraća broj uspešno obrisanih.
   */
  .post('/media/cleanup-orphans', async () => {
    const [bunnyVideos, lessonRows] = await Promise.all([
      listBunnyVideos(),
      db.select({ videoId: lessons.videoId }).from(lessons),
    ])
    const usedIds = new Set(lessonRows.map((r) => r.videoId).filter(Boolean) as string[])
    const orphans = bunnyVideos.filter((v) => !usedIds.has(v.guid))

    let deleted = 0
    const errors: Array<{ guid: string; error: string }> = []
    for (const o of orphans) {
      try {
        await deleteBunnyVideo(o.guid)
        deleted += 1
      } catch (e) {
        errors.push({
          guid: o.guid,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }
    return { deleted, total: orphans.length, errors }
  })
  // ---------- AUDIO (Bunny Storage upload za snimke izgovora / dijaloge) ----------
  /**
   * Health check za audio servis — frontend pita pre nego što ponudi UI.
   * Vraća da li je Bunny Storage konfigurisan.
   */
  .get('/audio/status', () => {
    return { configured: isBunnyStorageConfigured() }
  })
  /**
   * Upload audio fajla. Body je multipart/form-data sa `file` poljem.
   * Vraća { url } koji se može direktno staviti u `audio_url` polje.
   *
   * Limit: 10MB po fajlu (audio je obično 100KB-1MB, 10MB je rezerva za WAV).
   */
  .post(
    '/audio/upload',
    async ({ body, status }) => {
      const file = body.file
      if (!(file instanceof File)) {
        return status(400, { error: 'file is required' })
      }
      if (file.size > 10 * 1024 * 1024) {
        return status(413, { error: 'file too large (max 10MB)' })
      }

      // Ekstrakcija ekstenzije iz MIME tipa ili imena
      const ext = inferAudioExtension(file.type, file.name)
      const buffer = await file.arrayBuffer()

      try {
        const { url, path } = await uploadAudio({ buffer, extension: ext })
        return { url, path, size: file.size, contentType: file.type }
      } catch (e) {
        return status(500, {
          error: e instanceof Error ? e.message : 'upload failed',
        })
      }
    },
    {
      body: t.Object({
        file: t.Any(),
      }),
    },
  )
  /**
   * Briše audio fajl iz Bunny Storage. Prima ili pun CDN URL ili relativni path.
   */
  .post(
    '/audio/delete',
    async ({ body, status }) => {
      try {
        await deleteAudio(body.url)
        return { ok: true }
      } catch (e) {
        return status(500, {
          error: e instanceof Error ? e.message : 'delete failed',
        })
      }
    },
    {
      body: t.Object({
        url: t.String(),
      }),
    },
  )
  // ---------- AI COURSE BUILDER (generiše strukturu, ne sadržaj) ----------
  /**
   * Pita Claude da generiše SAMO strukturu kursa (course + modules + lessons titles).
   * Ne pravi ništa u bazi — samo vraća JSON koji admin može da pregleda i edituje.
   *
   * Posle pregleda admin zove `/ai/create-from-structure` da kreira u bazi.
   */
  .post(
    '/ai/generate-course',
    async ({ body, status }) => {
      try {
        const structure = await generateCourseStructure({ prompt: body.prompt })
        return structure
      } catch (e) {
        return status(500, {
          error: e instanceof Error ? e.message : 'AI generisanje nije uspelo',
        })
      }
    },
    {
      body: t.Object({
        prompt: t.String({ minLength: 5, maxLength: 4000 }),
      }),
    },
  )
  /**
   * Prima edituju strukturu (admin je mogla da izmeni nazive/tipove nakon AI generisanja)
   * i kreira sve u bazi u jednoj transakciji-style sekvenci.
   * Vraća kreirani courseId za redirect.
   */
  .post(
    '/ai/create-from-structure',
    async ({ body, status }) => {
      try {
        const structure = body as GeneratedCourseStructure

        // Generiši unique slug iz naslova
        const baseSlug = slugify(structure.course.title)
        let slug = baseSlug
        let suffix = 1
        while (true) {
          const [existing] = await db
            .select({ id: courses.id })
            .from(courses)
            .where(eq(courses.slug, slug))
            .limit(1)
          if (!existing) break
          suffix += 1
          slug = `${baseSlug}-${suffix}`
        }

        const position = await nextCoursePosition()
        const [createdCourse] = await db
          .insert(courses)
          .values({
            title: structure.course.title,
            slug,
            description: structure.course.description || null,
            level: structure.course.level,
            language: structure.course.language,
            status: 'draft',
            position,
          })
          .returning()

        // Kreiraj module + lekcije
        for (let mIdx = 0; mIdx < structure.modules.length; mIdx++) {
          const m = structure.modules[mIdx]
          const [createdModule] = await db
            .insert(modules)
            .values({
              courseId: createdCourse.id,
              title: m.title,
              position: mIdx,
            })
            .returning()

          for (let lIdx = 0; lIdx < m.lessons.length; lIdx++) {
            const l = m.lessons[lIdx]
            // Primary type za badge — prvi iz types niza, mapuje 'exercises' → 'exercise'
            const primaryType =
              l.types[0] === 'exercises'
                ? 'exercise'
                : l.types[0] === 'audio'
                  ? 'text' // audio nije validan u type union; pada na 'text' kao fallback
                  : l.types[0]
            await db.insert(lessons).values({
              moduleId: createdModule.id,
              title: l.title,
              type: primaryType,
              position: lIdx,
              status: 'draft',
              // contentOrder pamti koje blokove je AI predložio — Editor ih default-ON kad otvoriš
              contentOrder: l.types,
            })
          }
        }

        return {
          courseId: createdCourse.id,
          slug: createdCourse.slug,
          moduleCount: structure.modules.length,
          lessonCount: structure.modules.reduce((s, m) => s + m.lessons.length, 0),
        }
      } catch (e) {
        return status(500, {
          error: e instanceof Error ? e.message : 'Kreiranje kursa nije uspelo',
        })
      }
    },
    {
      body: t.Object({
        course: t.Object({
          title: t.String({ minLength: 1, maxLength: 200 }),
          description: t.String({ maxLength: 5000 }),
          level: t.Union([
            t.Literal('A1'),
            t.Literal('A2'),
            t.Literal('B1'),
            t.Literal('B2'),
            t.Literal('C1'),
            t.Literal('C2'),
          ]),
          language: t.String({ maxLength: 10 }),
        }),
        modules: t.Array(
          t.Object({
            title: t.String({ minLength: 1, maxLength: 200 }),
            lessons: t.Array(
              t.Object({
                title: t.String({ minLength: 1, maxLength: 200 }),
                types: t.Array(
                  t.Union([
                    t.Literal('video'),
                    t.Literal('text'),
                    t.Literal('exercises'),
                    t.Literal('audio'),
                  ]),
                  { minItems: 1, maxItems: 4 },
                ),
              }),
            ),
          }),
        ),
      }),
    },
  )
  // ---------- USERS / ROLES (čisto admin) ----------
  .get('/users', async () => {
    return db.select().from(profiles).orderBy(asc(profiles.createdAt))
  })
  .patch(
    '/users/:id/role',
    async ({ params, body }) => {
      const [row] = await db
        .update(profiles)
        .set({ role: body.role })
        .where(eq(profiles.id, params.id))
        .returning()
      return row
    },
    {
      body: t.Object({
        role: t.Union([t.Literal('student'), t.Literal('teacher'), t.Literal('admin')]),
      }),
    },
  )
