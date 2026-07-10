import { createHash } from 'node:crypto'
import { env } from '../env'

/**
 * Bunny Stream signed playback URL (token auth).
 * Token = sha256(authKey + videoId + expires + userId).
 */
export function signPlaybackUrl(videoId: string, userId: string, ttlSeconds = 60 * 60) {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds
  const raw = `${env.BUNNY_TOKEN_AUTH_KEY}${videoId}${expires}${userId}`
  const token = createHash('sha256').update(raw).digest('hex')
  return `https://${env.BUNNY_CDN_HOSTNAME}/${videoId}/playlist.m3u8?token=${token}&expires=${expires}&user_id=${userId}`
}

/**
 * Signed MP4 URL (token auth) — za server-side transkripciju (Whisper).
 * Koristi 240p da fajl bude mali (Whisper limit 25MB). Zahteva da je u Bunny
 * library-ju uključen "MP4 Fallback". Isti token šablon kao HLS playback.
 */
export function signedMp4Url(videoId: string, userId = 'transcribe-bot', resolution = '240p', ttlSeconds = 60 * 30) {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds
  const raw = `${env.BUNNY_TOKEN_AUTH_KEY}${videoId}${expires}${userId}`
  const token = createHash('sha256').update(raw).digest('hex')
  return `https://${env.BUNNY_CDN_HOSTNAME}/${videoId}/play_${resolution}.mp4?token=${token}&expires=${expires}&user_id=${userId}`
}

/**
 * Okači VTT titl na Bunny Stream video → pojavi se CC dugme u plejeru.
 * `vtt` je sirov WEBVTT string; Bunny prima base64 sadržaja.
 */
export async function uploadBunnyCaption(videoId: string, srclang: string, label: string, vtt: string) {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${env.BUNNY_LIBRARY_ID}/videos/${videoId}/captions/${srclang}`,
    {
      method: 'POST',
      headers: {
        AccessKey: env.BUNNY_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        srclang,
        label,
        captionsFile: Buffer.from(vtt, 'utf-8').toString('base64'),
      }),
    },
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`bunny caption upload failed: ${res.status} ${body}`)
  }
}

/**
 * Direct iframe embed URL (Bunny player) — koristimo dok ne implementiramo
 * sopstveni HLS plejer.
 */
export function iframeEmbedUrl(videoId: string) {
  // autoplay=false — video ne kreće sam kad se učita stranica, korisnik mora da klikne play
  // preload=true — ali se učita prvi frejm da se vidi thumbnail/poster
  return `https://iframe.mediadelivery.net/embed/${env.BUNNY_LIBRARY_ID}/${videoId}?autoplay=false&preload=true`
}

/**
 * Kreira prazan video u Bunny Stream library — vraća GUID.
 */
export async function createBunnyVideo(title: string): Promise<{ guid: string }> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${env.BUNNY_LIBRARY_ID}/videos`,
    {
      method: 'POST',
      headers: {
        AccessKey: env.BUNNY_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({ title }),
    },
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`bunny create failed: ${res.status} ${body}`)
  }
  return (await res.json()) as { guid: string }
}

/**
 * TUS upload autorizacija za browser.
 *
 * Bunny ZAHTEVA `AuthorizationExpire` u MILISEKUNDAMA (unix timestamp).
 *
 * Veliki TTL (24h) jer postoji clock skew između našeg servera i Bunny-ja
 * (videli smo Windows mašinu 1h iza Bunny-jevog "GMT") — sa 1h TTL-a
 * dobijamo "cannot be in the past".
 *
 * Signature = sha256(LibraryId + APIKey + ExpireMs + VideoId)
 */
export function getTusUploadAuth(videoId: string, ttlSeconds = 24 * 60 * 60) {
  const expires = Date.now() + ttlSeconds * 1000
  const raw = `${env.BUNNY_LIBRARY_ID}${env.BUNNY_API_KEY}${expires}${videoId}`
  const signature = createHash('sha256').update(raw).digest('hex')
  return {
    endpoint: 'https://video.bunnycdn.com/tusupload',
    libraryId: env.BUNNY_LIBRARY_ID,
    videoId,
    expires,
    signature,
  }
}

/**
 * Status video-a iz Bunny library — koristi se za sync `video_ready` flaga
 * kad webhook ne stiže (lokalni dev bez ngrok-a).
 *
 * Status kodovi:
 *   0 Created · 1 Uploaded · 2 Processing · 3 Transcoding · 4 Finished
 *   5 Error · 6 UploadFailed
 */
export async function fetchBunnyVideoStatus(videoId: string): Promise<{
  status: number
  length: number
  width: number
  height: number
  available: boolean
}> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${env.BUNNY_LIBRARY_ID}/videos/${videoId}`,
    {
      headers: { AccessKey: env.BUNNY_API_KEY, accept: 'application/json' },
    },
  )
  if (!res.ok) {
    throw new Error(`bunny status fetch failed: ${res.status}`)
  }
  const data = await res.json() as { status?: number; length?: number; width?: number; height?: number }
  return {
    status: data.status ?? 0,
    length: data.length ?? 0,
    width: data.width ?? 0,
    height: data.height ?? 0,
    available: data.status === 4,
  }
}

/**
 * Lista svih videa iz Bunny Stream library-ja.
 *
 * Bunny API vraća stranicovanu listu — uzimamo prvu stranicu sa
 * `itemsPerPage` (max 1000). Za sad nemamo paginaciju na našoj strani jer
 * očekujemo < par stotina videa.
 */
export type BunnyVideoListItem = {
  guid: string
  title: string
  dateUploaded: string
  length: number // sekunde
  storageSize: number // bytes
  status: number
  thumbnailFileName: string
  encodeProgress: number
  width: number
  height: number
  views: number
}

export async function listBunnyVideos(): Promise<BunnyVideoListItem[]> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${env.BUNNY_LIBRARY_ID}/videos?itemsPerPage=1000&orderBy=date`,
    {
      headers: { AccessKey: env.BUNNY_API_KEY, accept: 'application/json' },
    },
  )
  if (!res.ok) {
    throw new Error(`bunny list failed: ${res.status}`)
  }
  const data = (await res.json()) as { items?: BunnyVideoListItem[] }
  return data.items ?? []
}

/**
 * Vraća CDN URL za thumbnail (poster image) datog video-a.
 * Bunny generiše thumbnail automatski; ime fajla je u BunnyVideoListItem.
 */
export function bunnyThumbnailUrl(videoId: string, thumbnailFileName: string): string {
  return `https://${env.BUNNY_CDN_HOSTNAME}/${videoId}/${thumbnailFileName}`
}

/**
 * Briše video iz Bunny library.
 */
export async function deleteBunnyVideo(videoId: string) {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${env.BUNNY_LIBRARY_ID}/videos/${videoId}`,
    {
      method: 'DELETE',
      headers: { AccessKey: env.BUNNY_API_KEY },
    },
  )
  if (!res.ok && res.status !== 404) {
    throw new Error(`bunny delete failed: ${res.status}`)
  }
}

export type BunnyWebhookPayload = {
  VideoLibraryId: number
  VideoGuid: string
  Status: number
}
