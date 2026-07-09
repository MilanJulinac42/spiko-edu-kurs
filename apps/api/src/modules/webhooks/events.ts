/**
 * In-memory queue za Bunny video-ready događaje.
 *
 * Kad webhook stigne sa status=FINISHED, dodajemo event u queue. Admin client
 * poll-uje `/admin/video-events?since=ISO` svakih ~20s, dobija nove eventove
 * i prikazuje toast.
 *
 * Ograničenja:
 *  - Single-process: ako API skaliramo na više instanci, treba Redis pub/sub
 *  - Volatilan: restart API-ja briše queue. Webhook poruke nisu kritične za
 *    funkciju (lesson.videoReady je već persistovan u DB) — samo se gubi
 *    UI feedback ako se admin nije ulogovao u prozoru aktivnih event-ova.
 *
 * Queue je capped na MAX_EVENTS — najnoviji event "potiskuje" najstariji.
 */

export type VideoReadyEvent = {
  lessonId: string
  lessonTitle: string
  courseId: string
  courseTitle: string
  courseSlug: string
  /** ISO string */
  at: string
}

const MAX_EVENTS = 100
const TTL_MS = 60 * 60 * 1000 // 1h — stariji eventovi se sami brišu

let events: VideoReadyEvent[] = []

export function pushVideoReadyEvent(e: VideoReadyEvent): void {
  events.push(e)
  prune()
}

export function getVideoReadyEventsSince(sinceIso: string): VideoReadyEvent[] {
  prune()
  if (!sinceIso) return events.slice()
  const sinceMs = Date.parse(sinceIso)
  if (Number.isNaN(sinceMs)) return events.slice()
  return events.filter((e) => Date.parse(e.at) > sinceMs)
}

function prune(): void {
  const cutoff = Date.now() - TTL_MS
  events = events.filter((e) => Date.parse(e.at) > cutoff)
  if (events.length > MAX_EVENTS) {
    events = events.slice(events.length - MAX_EVENTS)
  }
}
