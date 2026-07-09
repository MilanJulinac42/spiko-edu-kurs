/**
 * Bunny Storage (Edge Storage) — odvojen servis od Bunny Stream.
 * Koristi se za audio fajlove (snimci izgovora, dijalozi, slušanja).
 *
 * API docs: https://docs.bunny.net/reference/storage-api
 *
 * Cena: ~$0.005/GB storage + $0.005/GB bandwidth. Audio fajlovi su 100KB-500KB
 * — hiljade snimaka pre nego što naplati par centi.
 */
import { env } from '../env'

const STORAGE_HOST_BY_REGION: Record<string, string> = {
  '': 'storage.bunnycdn.com', // Falkenstein (main)
  de: 'storage.bunnycdn.com',
  ny: 'ny.storage.bunnycdn.com',
  la: 'la.storage.bunnycdn.com',
  sg: 'sg.storage.bunnycdn.com',
  syd: 'syd.storage.bunnycdn.com',
  uk: 'uk.storage.bunnycdn.com',
  se: 'se.storage.bunnycdn.com',
  br: 'br.storage.bunnycdn.com',
  jh: 'jh.storage.bunnycdn.com', // Johannesburg
}

function storageHost(): string {
  const region = (env.BUNNY_STORAGE_REGION ?? '').toLowerCase()
  return STORAGE_HOST_BY_REGION[region] ?? STORAGE_HOST_BY_REGION['']
}

function assertConfigured(): void {
  if (!env.BUNNY_STORAGE_ZONE_NAME || !env.BUNNY_STORAGE_PASSWORD || !env.BUNNY_STORAGE_CDN_HOSTNAME) {
    throw new Error(
      'Bunny Storage nije konfigurisan. Postavi BUNNY_STORAGE_ZONE_NAME, BUNNY_STORAGE_PASSWORD i BUNNY_STORAGE_CDN_HOSTNAME u .env.',
    )
  }
}

/**
 * Upload audio buffer u Bunny Storage.
 * Vraća javni CDN URL (preko Pull Zone-a).
 *
 * `filename` mora biti unique unutar zone — koristim {timestamp}-{random}.{ext}
 * pattern da ne bismo overpisali postojeće.
 */
export async function uploadAudio({
  buffer,
  extension = 'webm',
  prefix = 'audio',
}: {
  buffer: ArrayBuffer | Uint8Array | Buffer
  extension?: string
  prefix?: string
}): Promise<{ url: string; path: string }> {
  assertConfigured()

  const safeExt = extension.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 5) || 'webm'
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 10)
  const path = `${prefix}/${ts}-${rand}.${safeExt}`

  const url = `https://${storageHost()}/${env.BUNNY_STORAGE_ZONE_NAME}/${path}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      AccessKey: env.BUNNY_STORAGE_PASSWORD,
      'content-type': contentTypeFor(safeExt),
    },
    body: buffer as BodyInit,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`bunny storage upload failed: ${res.status} ${body}`)
  }

  return {
    url: `https://${env.BUNNY_STORAGE_CDN_HOSTNAME}/${path}`,
    path,
  }
}

/**
 * Briše fajl iz Bunny Storage. `path` je relativni path (`audio/abc.webm`),
 * NE pun CDN URL. Ako prosledi pun URL, ekstraktovaće path automatski.
 */
export async function deleteAudio(pathOrUrl: string): Promise<void> {
  assertConfigured()

  let path = pathOrUrl
  if (path.startsWith('https://') || path.startsWith('http://')) {
    try {
      const u = new URL(path)
      path = u.pathname.replace(/^\/+/, '')
    } catch {
      // ignore
    }
  }

  const url = `https://${storageHost()}/${env.BUNNY_STORAGE_ZONE_NAME}/${path}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { AccessKey: env.BUNNY_STORAGE_PASSWORD },
  })
  if (!res.ok && res.status !== 404) {
    throw new Error(`bunny storage delete failed: ${res.status}`)
  }
}

function contentTypeFor(ext: string): string {
  switch (ext) {
    case 'webm':
      return 'audio/webm'
    case 'mp3':
      return 'audio/mpeg'
    case 'm4a':
      return 'audio/mp4'
    case 'ogg':
      return 'audio/ogg'
    case 'wav':
      return 'audio/wav'
    default:
      return 'application/octet-stream'
  }
}

export function isBunnyStorageConfigured(): boolean {
  return !!(env.BUNNY_STORAGE_ZONE_NAME && env.BUNNY_STORAGE_PASSWORD && env.BUNNY_STORAGE_CDN_HOSTNAME)
}

/**
 * Generički delete — prihvata pun CDN URL ili relativni path, izvlači path,
 * šalje DELETE u Bunny Storage. Idempotentno: 404 = uspeh.
 *
 * Koristi se za cleanup starih slika kad korisnik upload-uje novu (deterministički
 * naziv ne radi jer Bunny CDN Pull Zone keširaše po path-u, ignoriše query string).
 */
export async function deleteFromStorageByUrl(pathOrUrl: string): Promise<void> {
  assertConfigured()
  if (!pathOrUrl) return

  let path = pathOrUrl
  if (path.startsWith('https://') || path.startsWith('http://')) {
    try {
      const u = new URL(path)
      path = u.pathname.replace(/^\/+/, '')
    } catch {
      return
    }
  }
  // Strip query string ako je ostao
  const qIdx = path.indexOf('?')
  if (qIdx !== -1) path = path.slice(0, qIdx)

  // Path mora da bude relativan na storage zone, ne CDN
  // (CDN url je npr. `/avatars/xyz.jpg`, Bunny očekuje isto)
  const url = `https://${storageHost()}/${env.BUNNY_STORAGE_ZONE_NAME}/${path}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { AccessKey: env.BUNNY_STORAGE_PASSWORD },
  })
  if (!res.ok && res.status !== 404) {
    throw new Error(`bunny storage delete failed: ${res.status}`)
  }
}

/**
 * Upload avatar (slika korisnika) u Bunny Storage.
 *
 * Path uključuje **timestamp** (`avatars/{userId}-{timestamp}.jpg`) jer Bunny CDN
 * Pull Zone keširaše po path-u, ne po query string-u. Bez ovoga, re-upload na isti
 * path ne bi probio CDN cache i browser bi video staru sliku.
 *
 * Stara slika se briše posebno (delete-old-then-upload pattern) — vidi
 * route handler u `apps/api/src/modules/auth/index.ts`.
 *
 * `buffer` mora već biti resize-ovan + kompresovan JPEG sa fronta (512×512).
 */
export async function uploadAvatar({
  buffer,
  userId,
}: {
  buffer: ArrayBuffer | Uint8Array | Buffer
  userId: string
}): Promise<{ url: string; path: string }> {
  assertConfigured()

  const safeUserId = userId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64)
  if (!safeUserId) throw new Error('invalid userId for avatar path')

  const timestamp = Date.now().toString(36)
  const path = `avatars/${safeUserId}-${timestamp}.jpg`

  const url = `https://${storageHost()}/${env.BUNNY_STORAGE_ZONE_NAME}/${path}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      AccessKey: env.BUNNY_STORAGE_PASSWORD,
      'content-type': 'image/jpeg',
    },
    body: buffer as BodyInit,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`bunny storage avatar upload failed: ${res.status} ${body}`)
  }

  return {
    url: `https://${env.BUNNY_STORAGE_CDN_HOSTNAME}/${path}`,
    path,
  }
}

/**
 * Briše konkretan avatar fajl. Prihvata pun CDN URL (sa ili bez query string-a).
 * Alias za `deleteFromStorageByUrl` koji čuva ime za jasnoću u call site-u.
 */
export async function deleteAvatar(urlOrPath: string): Promise<void> {
  return deleteFromStorageByUrl(urlOrPath)
}

/**
 * Upload thumbnail slike za kurs u Bunny Storage.
 *
 * Path uključuje timestamp da bi CDN cache invalidacija radila pouzdano
 * (vidi obrazloženje na `uploadAvatar`).
 *
 * `buffer` mora biti resize-ovan + kompresovan JPEG sa fronta (1280×720).
 */
export async function uploadCourseThumbnail({
  buffer,
  courseId,
}: {
  buffer: ArrayBuffer | Uint8Array | Buffer
  courseId: string
}): Promise<{ url: string; path: string }> {
  assertConfigured()

  const safeCourseId = courseId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64)
  if (!safeCourseId) throw new Error('invalid courseId for thumbnail path')

  const timestamp = Date.now().toString(36)
  const path = `course-thumbnails/${safeCourseId}-${timestamp}.jpg`

  const url = `https://${storageHost()}/${env.BUNNY_STORAGE_ZONE_NAME}/${path}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      AccessKey: env.BUNNY_STORAGE_PASSWORD,
      'content-type': 'image/jpeg',
    },
    body: buffer as BodyInit,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`bunny storage thumbnail upload failed: ${res.status} ${body}`)
  }

  return {
    url: `https://${env.BUNNY_STORAGE_CDN_HOSTNAME}/${path}`,
    path,
  }
}

/**
 * Briše konkretan thumbnail fajl. Alias za `deleteFromStorageByUrl`.
 */
export async function deleteCourseThumbnail(urlOrPath: string): Promise<void> {
  return deleteFromStorageByUrl(urlOrPath)
}
