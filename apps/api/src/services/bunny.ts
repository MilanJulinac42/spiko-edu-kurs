import { createHash } from 'node:crypto'
import { env } from '../env'

/**
 * Bunny Stream signed playback URL (token auth).
 * Token = sha256(authKey + videoId + expires + userId).
 * Frontend dobija ovaj URL; ne sme se kešovati duže od `expires`.
 */
export function signPlaybackUrl(videoId: string, userId: string, ttlSeconds = 60 * 60) {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds
  const raw = `${env.BUNNY_TOKEN_AUTH_KEY}${videoId}${expires}${userId}`
  const token = createHash('sha256').update(raw).digest('hex')
  return `https://${env.BUNNY_CDN_HOSTNAME}/${videoId}/playlist.m3u8?token=${token}&expires=${expires}&user_id=${userId}`
}

export async function createBunnyVideo(title: string) {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${env.BUNNY_LIBRARY_ID}/videos`,
    {
      method: 'POST',
      headers: {
        AccessKey: env.BUNNY_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title }),
    },
  )
  if (!res.ok) throw new Error(`bunny create failed: ${res.status}`)
  return (await res.json()) as { guid: string }
}

export type BunnyWebhookPayload = {
  VideoLibraryId: number
  VideoGuid: string
  Status: number
}
