import { env } from '../env'

/**
 * Zoom Server-to-Server OAuth — pravljenje sastanaka za zakazane časove.
 * Token se dobija account-level (grant_type=account_credentials), pa se sastanak
 * pravi u ime host korisnika (ZOOM_HOST_EMAIL).
 */

export function isZoomConfigured(): boolean {
  return !!(env.ZOOM_ACCOUNT_ID && env.ZOOM_CLIENT_ID && env.ZOOM_CLIENT_SECRET && env.ZOOM_HOST_EMAIL)
}

// Keširaj token (važi ~1h); osvežavaj malo ranije.
let cached: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt - 60_000) return cached.token

  const basic = Buffer.from(`${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`).toString('base64')
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(env.ZOOM_ACCOUNT_ID)}`,
    { method: 'POST', headers: { Authorization: `Basic ${basic}` } },
  )
  if (!res.ok) {
    throw new Error(`zoom token failed: ${res.status} ${await res.text()}`)
  }
  const data = (await res.json()) as { access_token: string; expires_in: number }
  cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return data.access_token
}

export type ZoomMeeting = {
  meetingId: string
  joinUrl: string
  startUrl: string
}

/**
 * Napravi zakazani Zoom sastanak na host nalogu (ZOOM_HOST_EMAIL).
 * `startAt` mora biti ISO; durationMinutes u minutima.
 */
export async function createZoomMeeting({
  topic,
  startAt,
  durationMinutes,
  timezone = 'Europe/Belgrade',
}: {
  topic: string
  startAt: Date
  durationMinutes: number
  timezone?: string
}): Promise<ZoomMeeting> {
  const token = await getAccessToken()
  const res = await fetch(
    `https://api.zoom.us/v2/users/${encodeURIComponent(env.ZOOM_HOST_EMAIL)}/meetings`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        topic,
        type: 2, // scheduled meeting
        start_time: startAt.toISOString(),
        duration: durationMinutes,
        timezone,
        settings: {
          join_before_host: true,
          waiting_room: false,
          approval_type: 2,
        },
      }),
    },
  )
  if (!res.ok) {
    throw new Error(`zoom create meeting failed: ${res.status} ${await res.text()}`)
  }
  const data = (await res.json()) as { id: number; join_url: string; start_url: string }
  return { meetingId: String(data.id), joinUrl: data.join_url, startUrl: data.start_url }
}

/** Obriši Zoom sastanak (pri otkazivanju termina). Best-effort. */
export async function deleteZoomMeeting(meetingId: string): Promise<void> {
  const token = await getAccessToken()
  const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok && res.status !== 404) {
    throw new Error(`zoom delete failed: ${res.status}`)
  }
}
