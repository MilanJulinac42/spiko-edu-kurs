'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { toast } from './toast'

/**
 * Globalni watcher za Bunny video-ready event-ove.
 *
 * Svakih 20s povlači `/admin/video-events?since=ISO` (`since` je timestamp
 * poslednje provere, čuvamo ga u state-u). Za svaki novi event → toast.
 *
 * Strategija da admin ne dobije toast za stare event-ove kad otvori tab:
 *  - prvi fetch postavlja `since` = trenutno vreme i ignoriše rezultate
 *  - tek od drugog fetch-a se nova obaveštenja prikazuju
 *
 * Pošto je in-memory queue na API-ju (1h TTL), bez SSE/Realtime infrastrukture.
 */
export function VideoReadyWatcher() {
  const router = useRouter()
  // ISO timestamp za sledeći poll
  const sinceRef = useRef<string>(new Date().toISOString())
  // Prvi fetch samo sinhronizuje cursor — ne prikazuje toast za zatečene event-ove
  const armedRef = useRef(false)

  useEffect(() => {
    let active = true

    async function poll() {
      try {
        const { data } = await api.admin['video-events'].get({
          query: { since: sinceRef.current },
        })
        if (!active) return

        // Eden client returns union `{error} | {events}` — narrow pre nego što čitamo
        const events =
          data && 'events' in data
            ? (data.events as Array<{
                lessonId: string
                lessonTitle: string
                courseId: string
                courseTitle: string
                courseSlug: string
                at: string
              }>)
            : []

        // Cursor → najnoviji event "at" (ako ih ima)
        if (events.length > 0) {
          const latest = events.reduce(
            (max, e) => (Date.parse(e.at) > Date.parse(max) ? e.at : max),
            events[0].at,
          )
          sinceRef.current = latest
        }

        if (armedRef.current && events.length > 0) {
          // Toast po lekciji — može biti više ako je Bunny obradio batch
          for (const ev of events) {
            const title = `Video je spreman ✓`
            const desc = `${ev.lessonTitle} · ${ev.courseTitle}`
            toast.success(title, {
              description: desc,
              action: ev.courseId
                ? {
                    label: 'Otvori kurs',
                    onClick: () => router.push(`/courses/${ev.courseId}`),
                  }
                : undefined,
            })
          }
        }

        armedRef.current = true
      } catch {
        // Tiho — poll će probati ponovo za 20s. Nema spam toast-ova za network blip-ove.
      }
    }

    // Prvi poll odmah da se cursor poravna sa real-time stanjem na API-ju
    poll()
    const id = window.setInterval(poll, 20_000)

    return () => {
      active = false
      window.clearInterval(id)
    }
  }, [router])

  return null
}
