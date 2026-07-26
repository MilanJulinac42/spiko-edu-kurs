import { and, desc, eq, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { userSessions } from '../db/schema'
import { env } from '../env'

/**
 * Anti password-sharing: ograniči broj aktivnih uređaja po nalogu.
 *
 * MAX_ACTIVE_SESSIONS = 1 (jedna sesija), 2 (telefon+laptop, default), 0 (isključeno).
 * Nova sesija preko limita → najstarija se `revoked` → izbačena na sledećem zahtevu.
 *
 * BEZBEDNOST: fail-open. Ako nema session_id, limit je 0, ili DB pukne — NE
 * zaključavamo nikog (vrati 'ok'). Radije propusti sharing nego da zaključaš legit.
 */
const MAX = Number(env.MAX_ACTIVE_SESSIONS) || 0
const TOUCH_INTERVAL_MS = 5 * 60 * 1000 // ne piši lastSeen češće od 5 min

export type SessionCheck = 'ok' | 'revoked'

export async function checkSession(
  userId: string,
  sessionId: string,
  deviceInfo: string | null,
): Promise<SessionCheck> {
  if (!MAX) return 'ok' // isključeno

  try {
    const [row] = await db
      .select({ id: userSessions.id, revoked: userSessions.revoked, lastSeenAt: userSessions.lastSeenAt })
      .from(userSessions)
      .where(eq(userSessions.sessionId, sessionId))
      .limit(1)

    if (row) {
      if (row.revoked) return 'revoked'
      if (Date.now() - row.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
        await db.update(userSessions).set({ lastSeenAt: new Date() }).where(eq(userSessions.id, row.id))
      }
      return 'ok'
    }

    // Nova sesija (nov uređaj/login)
    await db
      .insert(userSessions)
      .values({ userId, sessionId, deviceInfo })
      .onConflictDoNothing({ target: userSessions.sessionId })

    // Izbaci najstarije preko limita (najnoviji uvek prolazi jer mu je lastSeen = sad)
    const active = await db
      .select({ id: userSessions.id })
      .from(userSessions)
      .where(and(eq(userSessions.userId, userId), eq(userSessions.revoked, false)))
      .orderBy(desc(userSessions.lastSeenAt))

    if (active.length > MAX) {
      const toRevoke = active.slice(MAX).map((r) => r.id)
      if (toRevoke.length) {
        await db.update(userSessions).set({ revoked: true }).where(inArray(userSessions.id, toRevoke))
      }
    }
    return 'ok'
  } catch {
    return 'ok' // fail-open na DB grešci
  }
}

/** Sažmi user-agent na kratak opis uređaja za prikaz. */
export function deviceLabel(ua: string | undefined): string | null {
  if (!ua) return null
  const s = ua.slice(0, 200)
  const os = /Windows/.test(s) ? 'Windows' : /iPhone|iPad|iOS/.test(s) ? 'iOS' : /Android/.test(s) ? 'Android' : /Mac/.test(s) ? 'macOS' : /Linux/.test(s) ? 'Linux' : '?'
  const br = /Edg/.test(s) ? 'Edge' : /Chrome/.test(s) ? 'Chrome' : /Firefox/.test(s) ? 'Firefox' : /Safari/.test(s) ? 'Safari' : '?'
  return `${br} · ${os}`
}
