/**
 * Otvara student pogled kursa u novom tab-u.
 *
 * URL na koji se ide se određuje iz sledećih izvora, redom:
 *  1. `NEXT_PUBLIC_WEB_URL` env var (u prod-u će biti `https://kurs.spikoedu.rs`)
 *  2. Automatska zamena porta na trenutnom hostu (dev: `localhost:3001` → `localhost:3000`)
 *  3. Automatska zamena subdomena na trenutnom hostu (`admin.spikoedu.rs` → `kurs.spikoedu.rs`)
 */
export function studentWebOrigin(): string {
  const envUrl = process.env.NEXT_PUBLIC_WEB_URL
  if (envUrl) return envUrl.replace(/\/+$/, '')

  if (typeof window === 'undefined') return ''

  const origin = window.location.origin

  // Dev: :3001 → :3000
  if (origin.includes(':3001')) {
    return origin.replace(':3001', ':3000')
  }

  // Prod: admin.spikoedu.rs → kurs.spikoedu.rs
  if (origin.startsWith('https://admin.')) {
    return origin.replace('https://admin.', 'https://kurs.')
  }

  return origin
}

export function openStudentPreview(courseSlug: string): void {
  const base = studentWebOrigin()
  if (!base) return
  const url = `${base}/courses/${encodeURIComponent(courseSlug)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
