import Elysia from 'elysia'
import type { Role } from '@spiko/shared'
import { auth } from './auth'

export const requireRole = (...roles: Role[]) =>
  new Elysia({ name: `requireRole:${roles.join(',')}` })
    .use(auth)
    .onBeforeHandle(({ user, set }) => {
      if (!roles.includes(user.role)) {
        set.status = 403
        throw new Error('forbidden')
      }
    })
    .as('scoped')
