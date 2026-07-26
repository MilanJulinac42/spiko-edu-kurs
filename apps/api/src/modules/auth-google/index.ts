import Elysia, { t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { teachers } from '../../db/schema'
import { exchangeCodeForRefreshToken } from '../../services/google'

/** Mini HTML stranica koju Google redirect prikaže u prozoru. */
function page(title: string, ok: boolean): string {
  return `<!doctype html><html lang="sr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Spiko Edu — Google</title>
<style>
  body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#0e1622;color:#fff}
  .card{background:#182234;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:2rem 2.5rem;text-align:center;max-width:380px}
  .ico{font-size:2.5rem}
  h1{font-size:1.15rem;margin:.75rem 0 .25rem}
  p{color:#9fb0c3;font-size:.9rem;margin:0}
</style></head><body>
<div class="card"><div class="ico">${ok ? '✅' : '⚠️'}</div>
<h1>${title}</h1>
<p>${ok ? 'Možeš da zatvoriš ovaj prozor i vratiš se u admin panel.' : 'Zatvori prozor i pokušaj ponovo iz admin panela.'}</p>
</div></body></html>`
}

/**
 * Google OAuth callback — JAVNA ruta (Google redirect ovde posle autorizacije).
 * Razmeni `code` za refresh token i sačuvaj ga uz teacher-a (state = teacherId).
 */
export const googleAuthModule = new Elysia({ prefix: '/auth/google' }).get(
  '/callback',
  async ({ query, set }) => {
    set.headers['content-type'] = 'text/html; charset=utf-8'

    if (query.error) {
      set.status = 400
      return page('Autorizacija odbijena', false)
    }
    if (!query.code || !query.state) {
      set.status = 400
      return page('Nedostaje code ili state', false)
    }

    try {
      const refreshToken = await exchangeCodeForRefreshToken(query.code)
      if (!refreshToken) {
        set.status = 400
        return page('Google nije vratio refresh token — pokušaj ponovo', false)
      }
      await db
        .update(teachers)
        .set({ googleRefreshToken: refreshToken })
        .where(eq(teachers.id, query.state))
      return page('Google kalendar povezan!', true)
    } catch {
      set.status = 500
      return page('Greška pri povezivanju sa Google-om', false)
    }
  },
  {
    query: t.Object({
      code: t.Optional(t.String()),
      state: t.Optional(t.String()),
      scope: t.Optional(t.String()),
      error: t.Optional(t.String()),
    }),
  },
)
