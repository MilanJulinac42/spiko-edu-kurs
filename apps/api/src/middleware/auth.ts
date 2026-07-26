import Elysia from 'elysia'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { eq } from 'drizzle-orm'
import { env } from '../env'
import { db } from '../db/client'
import { profiles } from '../db/schema'
import type { Role } from '@spiko/shared'
import { checkSession, deviceLabel } from '../services/session-guard'

const JWKS = createRemoteJWKSet(new URL(env.SUPABASE_JWKS_URL))

export type AuthContext = {
  userId: string
  email: string | null
  role: Role
}

class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}

async function verifyJwt(token: string): Promise<AuthContext & { sessionId: string | null }> {
  const { payload } = await jwtVerify(token, JWKS, {
    audience: env.SUPABASE_JWT_AUDIENCE,
  })
  const userId = String(payload.sub)
  const email = (payload.email as string | undefined) ?? null
  const sessionId = (payload.session_id as string | undefined) ?? null

  let role: Role = 'student'
  const row = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
  if (row[0]?.role) role = row[0].role as Role

  return { userId, email, role, sessionId }
}

export const auth = new Elysia({ name: 'auth' })
  .error({ HttpError })
  .onError(({ error, set }) => {
    if (error instanceof HttpError) {
      set.status = error.statusCode
      return { error: error.message }
    }
  })
  .resolve(async ({ headers }) => {
    const header = headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new HttpError(401, 'missing bearer token')
    }
    let sessionId: string | null
    let user: AuthContext
    try {
      const decoded = await verifyJwt(header.slice('Bearer '.length))
      const { sessionId: sid, ...rest } = decoded
      sessionId = sid
      user = rest
    } catch (e) {
      if (e instanceof HttpError) throw e
      throw new HttpError(401, 'invalid token')
    }
    // Anti password-sharing: limit uređaja. Fail-open ako nema session_id.
    if (sessionId) {
      const check = await checkSession(user.userId, sessionId, deviceLabel(headers['user-agent']))
      if (check === 'revoked') {
        throw new HttpError(401, 'session_revoked')
      }
    }
    return { user }
  })
  .as('scoped')
