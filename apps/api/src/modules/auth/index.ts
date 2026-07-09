import Elysia, { t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { profiles } from '../../db/schema'
import { auth } from '../../middleware/auth'
import { supabaseAdmin } from '../../services/supabase-admin'
import {
  deleteAvatar,
  isBunnyStorageConfigured,
  uploadAvatar,
} from '../../services/bunny-storage'

const ALLOWED_AVATAR_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5 MB — front ionako resize-uje na ~50KB JPEG

export const authModule = new Elysia({ prefix: '/me' })
  .use(auth)
  .get('/', async ({ user }) => {
    let [row] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.userId))
      .limit(1)

    if (!row) {
      const inserted = await db
        .insert(profiles)
        .values({ id: user.userId })
        .onConflictDoNothing()
        .returning()
      row = inserted[0]
        ?? (
          await db
            .select()
            .from(profiles)
            .where(eq(profiles.id, user.userId))
            .limit(1)
        )[0]
    }

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
        fullName: t.Optional(t.String({ maxLength: 200 })),
        nativeLanguage: t.Optional(t.String({ maxLength: 50 })),
        targetLevel: t.Optional(t.String({ maxLength: 10 })),
        goal: t.Optional(t.String({ maxLength: 1000 })),
        timezone: t.Optional(t.String({ maxLength: 50 })),
      }),
    },
  )
  .patch(
    '/profile',
    async ({ user, body }) => {
      const [row] = await db
        .update(profiles)
        .set(body)
        .where(eq(profiles.id, user.userId))
        .returning()
      return row
    },
    {
      body: t.Partial(
        t.Object({
          fullName: t.String({ maxLength: 200 }),
          nativeLanguage: t.String({ maxLength: 50 }),
          targetLevel: t.String({ maxLength: 10 }),
          goal: t.String({ maxLength: 1000 }),
          timezone: t.String({ maxLength: 50 }),
          avatarUrl: t.String({ maxLength: 1000 }),
        }),
      ),
    },
  )
  /**
   * Upload avatar slike — multipart/form-data sa `file` poljem.
   * Slika se već resize-uje na 512×512 JPEG na frontu pre upload-a (vidi
   * `apps/web/components/AvatarUpload.tsx`). Backend samo validira veličinu/MIME
   * i prosleđuje u Bunny Storage.
   */
  .post(
    '/avatar',
    async ({ user, body, status }) => {
      if (!isBunnyStorageConfigured()) {
        return status(503, { error: 'Bunny Storage nije konfigurisan na serveru' })
      }
      const file = body.file
      if (!(file instanceof File)) {
        return status(400, { error: 'file is required' })
      }
      if (file.size > MAX_AVATAR_BYTES) {
        return status(413, { error: `Fajl je prevelik (max ${MAX_AVATAR_BYTES / 1024 / 1024} MB)` })
      }
      if (!ALLOWED_AVATAR_MIME.has(file.type)) {
        return status(415, { error: 'Podržani formati: JPEG, PNG, WebP' })
      }

      try {
        // Zapamti staru URL pre upload-a — da je obrišemo posle (best-effort)
        const [prev] = await db
          .select({ avatarUrl: profiles.avatarUrl })
          .from(profiles)
          .where(eq(profiles.id, user.userId))

        const buffer = await file.arrayBuffer()
        const { url } = await uploadAvatar({ buffer, userId: user.userId })

        const [row] = await db
          .update(profiles)
          .set({ avatarUrl: url })
          .where(eq(profiles.id, user.userId))
          .returning()

        // Obriši prethodni fajl iz Bunny-ja (ne blokira odgovor)
        if (prev?.avatarUrl && prev.avatarUrl !== url) {
          deleteAvatar(prev.avatarUrl).catch(() => {})
        }

        return { url, profile: row }
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
   * Brisanje avatar slike — vraća korisnika na default (inicijali).
   * Idempotentno: ako fajl ne postoji u Bunny, ipak nuluje avatarUrl u DB.
   */
  .delete('/avatar', async ({ user, status }) => {
    try {
      const [prev] = await db
        .select({ avatarUrl: profiles.avatarUrl })
        .from(profiles)
        .where(eq(profiles.id, user.userId))

      if (isBunnyStorageConfigured() && prev?.avatarUrl) {
        await deleteAvatar(prev.avatarUrl).catch(() => {})
      }

      const [row] = await db
        .update(profiles)
        .set({ avatarUrl: null })
        .where(eq(profiles.id, user.userId))
        .returning()
      return { profile: row }
    } catch (e) {
      return status(500, {
        error: e instanceof Error ? e.message : 'delete failed',
      })
    }
  })
  /**
   * Brisanje naloga — koristi service_role da bi obrisao auth.users red.
   * RLS cascade briše profiles → lesson_progress, comments, ratings, itd.
   */
  .delete('/', async ({ user, status }) => {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.userId)
    if (error) return status(500, { error: error.message })
    return { ok: true }
  })
