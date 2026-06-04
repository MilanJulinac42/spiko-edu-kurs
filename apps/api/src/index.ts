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
import { progressModule } from './modules/progress'
import { ratingsModule } from './modules/ratings'
import { subscriptionsModule } from './modules/subscriptions'
import { webhooksModule } from './modules/webhooks'

export const app = new Elysia()
  .use(
    cors({
      origin: env.FRONTEND_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  )
  .use(swagger({ path: '/docs' }))
  .get('/health', () => ({ ok: true }))
  .use(authModule)
  .use(subscriptionsModule)
  .use(coursesModule)
  .use(progressModule)
  .use(exercisesModule)
  .use(bookingsModule)
  .use(aiModule)
  .use(commentsModule)
  .use(ratingsModule)
  .use(adminModule)
  .use(webhooksModule)
  .listen(PORT)

console.log(`[api] http://localhost:${PORT}`)

export type App = typeof app
