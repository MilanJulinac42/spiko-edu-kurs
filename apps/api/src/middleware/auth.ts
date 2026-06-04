import Elysia from 'elysia'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { eq } from 'drizzle-orm'
import { env } from '../env'
import { db } from '../db/client'
import { profiles } from '../db/schema'
import type { Role } from '@spiko/shared'

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

async function verifyJwt(token: string): Promise<AuthContext> {
  const { payload } = await jwtVerify(token, JWKS, {
    audience: env.SUPABASE_JWT_AUDIENCE,
  })
  const userId = String(payload.sub)
  const email = (payload.email as string | undefined) ?? null

  let role: Role = 'student'
  const row = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
  if (row[0]?.role) role = row[0].role as Role

  return { userId, email, role }
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
    try {
      const user = await verifyJwt(header.slice('Bearer '.length))
      return { user }
    } catch (e) {
      if (e instanceof HttpError) throw e
      throw new HttpError(401, 'invalid token')
    }
  })
  .as('scoped')
