import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'
import { env, PORT } from './env'
import { adminModule } from './modules/admin'
import { aiModule } from './modules/ai'
import { authModule } from './modules/auth'
import { bookingsModule } from './modules/bookings'
import { commentsModule } from './modules/comments'
import { coursesModule } from './modules/courses'
import { exercisesModule } from './modules/exercises'
import { notesModule } from './modules/notes'
import { progressModule } from './modules/progress'
import { ratingsModule } from './modules/ratings'
import { searchModule } from './modules/search'
import { subscriptionsModule } from './modules/subscriptions'
import { webhooksModule } from './modules/webhooks'

/**
 * Pre-handle compression — gzip/deflate JSON odgovore preko ~1kb.
 * Bun ima native zlib pa nema dodatnu zavisnost.
 */
function shouldCompress(body: unknown): boolean {
  if (typeof body !== 'string') return false
  if (body.length < 1024) return false
  return true
}

function pickEncoding(acceptHeader: string | null): 'gzip' | null {
  if (!acceptHeader) return null
  if (acceptHeader.includes('gzip')) return 'gzip'
  return null
}

export const app = new Elysia()
  .use(
    cors({
      origin: env.FRONTEND_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  )
  .mapResponse(({ response, set, request }) => {
    if (!response || typeof response !== 'object') return
    const body = JSON.stringify(response)
    if (!shouldCompress(body)) return
    const enc = pickEncoding(request.headers.get('accept-encoding'))
    if (enc !== 'gzip') return
    const compressed = Bun.gzipSync(body)
    set.headers['content-encoding'] = 'gzip'
    set.headers['content-type'] = 'application/json'
    set.headers['vary'] = 'Accept-Encoding'
    return new Response(compressed.buffer as ArrayBuffer, { headers: set.headers as Record<string, string> })
  })
  .use(swagger({ path: '/docs' }))
  /**
   * Sve GET odgovore tagujemo sa kratkim privatnim cache-om — browser i SWR
   * dele isti zahtev kroz dedup interval i, ako se isti URL ponovi za 10s,
   * vraćaju sačuvanu vrednost umesto da pogode server.
   *
   * `private` = ne keš na CDN-u/proxy (sadržaj je per-user), `must-revalidate`
   * sprečava korišćenje keša ako server vrati 401.
   */
  .onAfterHandle(({ request, set }) => {
    if (request.method !== 'GET') return
    if (set.headers['cache-control']) return
    const path = new URL(request.url).pathname
    if (path.startsWith('/admin')) return // admin podaci se ne keširaju
    if (path.startsWith('/health')) return

    // Real-time podaci — uvek revalidiraj sa serverom (browser može keširati ali mora pitati).
    // Ovi endpoint-i se osvežavaju često nakon user akcija (lesson complete, exercise submit),
    // i 10s disk cache pravi ozbiljnu konfuziju kad korisnik vidi "stari" snapshot.
    const REAL_TIME = ['/progress/stats', '/courses/mine', '/courses/mine/list', '/me']
    if (REAL_TIME.some((p) => path === p || path.startsWith(p + '/'))) {
      set.headers['cache-control'] = 'private, no-cache, must-revalidate'
      return
    }

    set.headers['cache-control'] = 'private, max-age=10, must-revalidate'
  })
  .get('/health', () => ({ ok: true }))
  .use(authModule)
  .use(notesModule)
  .use(subscriptionsModule)
  .use(coursesModule)
  .use(progressModule)
  .use(exercisesModule)
  .use(bookingsModule)
  .use(aiModule)
  .use(commentsModule)
  .use(ratingsModule)
  .use(searchModule)
  .use(adminModule)
  .use(webhooksModule)
  .listen(PORT)

console.log(`[api] http://localhost:${PORT}`)

export type App = typeof app
