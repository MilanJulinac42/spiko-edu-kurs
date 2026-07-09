/**
 * Mapira DB enum vrednost status-a (`draft` / `published` / `hidden`) u srpski
 * label koji se prikazuje korisniku. Zadržavamo eng enum u DB i kodu — samo
 * prevodimo na prikazu.
 */

export type ContentStatus = 'draft' | 'published' | 'hidden'

const LABELS: Record<ContentStatus, string> = {
  draft: 'Skica',
  published: 'Objavljeno',
  hidden: 'Skriveno',
}

export function statusLabel(s: string | null | undefined): string {
  if (!s) return ''
  if (s in LABELS) return LABELS[s as ContentStatus]
  return s
}
