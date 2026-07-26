import Elysia, { t } from 'elysia'
import { and, eq, gte, isNotNull } from 'drizzle-orm'
import { db } from '../../db/client'
import { availabilitySlots, bookings, teachers } from '../../db/schema'
import { auth } from '../../middleware/auth'
import { createCalendarEvent, getBusyIntervals } from '../../services/google'
import { createZoomMeeting, isZoomConfigured } from '../../services/zoom'

// Radno vreme + trajanje časa (test vrednosti — kasnije konfigurabilno po nastavniku).
const WORK_START = 7 // 07:00
const WORK_END = 19 // 19:00
const SLOT_MIN = 45 // trajanje časa
const DAYS_AHEAD = 14 // koliko dana unapred nudimo

type Interval = { start: Date; end: Date }
const overlaps = (aS: Date, aE: Date, b: Interval) => aS < b.end && b.start < aE

/** Nađi (jedinog) nastavnika sa povezanim Google kalendarom. */
async function connectedTeacher() {
  const [t] = await db.select().from(teachers).where(isNotNull(teachers.googleRefreshToken)).limit(1)
  return t ?? null
}

// NAPOMENA: zakazivanje je za sad otvoreno svakom ulogovanom polazniku (auth).
// Kad krene naplata (Raiffeisen), vratiti `entitlement` da traži aktivnu pretplatu.
export const bookingsModule = new Elysia({ prefix: '/bookings' })
  .use(auth)
  // ---------- SLOBODNI TERMINI (freebusy iz Eminog kalendara) ----------
  .get('/slots', async () => {
    const teacher = await connectedTeacher()
    if (!teacher?.googleRefreshToken) {
      return { slots: [] as { startAt: string; endAt: string }[], googleConnected: false, zoomReady: isZoomConfigured() }
    }
    const now = new Date()
    const to = new Date(now.getTime() + DAYS_AHEAD * 24 * 3600 * 1000)

    let busy: Interval[] = []
    try {
      busy = await getBusyIntervals(teacher, now, to)
    } catch {
      busy = []
    }

    const slots: { startAt: string; endAt: string }[] = []
    for (let day = 0; day <= DAYS_AHEAD; day++) {
      const base = new Date(now)
      base.setDate(base.getDate() + day)
      for (let hour = WORK_START; hour < WORK_END; hour++) {
        const start = new Date(base)
        start.setHours(hour, 0, 0, 0)
        const end = new Date(start.getTime() + SLOT_MIN * 60000)
        if (end.getHours() > WORK_END || (end.getHours() === WORK_END && end.getMinutes() > 0)) continue
        if (start.getTime() <= now.getTime()) continue // prošlo / trenutni sat
        if (busy.some((b) => overlaps(start, end, b))) continue
        slots.push({ startAt: start.toISOString(), endAt: end.toISOString() })
      }
    }
    return { slots, googleConnected: true, zoomReady: isZoomConfigured() }
  })
  // ---------- REZERVIŠI (freebusy: startAt/endAt) ----------
  .post(
    '/',
    async ({ body, user, status }) => {
      if (!isZoomConfigured()) {
        return status(503, { error: 'Zoom nije konfigurisan — zakazivanje trenutno nedostupno.' })
      }
      const teacher = await connectedTeacher()
      if (!teacher) return status(503, { error: 'Nastavnik nije povezao kalendar.' })

      const startAt = new Date(body.startAt)
      const endAt = new Date(body.endAt)
      if (isNaN(startAt.getTime()) || isNaN(endAt.getTime()) || endAt <= startAt) {
        return status(400, { error: 'neispravno vreme' })
      }
      if (startAt.getTime() <= Date.now()) {
        return status(409, { error: 'termin je prošao' })
      }

      // Re-provera da termin nije u međuvremenu zauzet
      try {
        const busy = await getBusyIntervals(teacher, startAt, endAt)
        if (busy.some((b) => overlaps(startAt, endAt, b))) {
          return status(409, { error: 'Termin je upravo zauzet — izaberi drugi.' })
        }
      } catch {
        /* freebusy nedostupan — nastavi (best-effort) */
      }

      const durationMin = Math.max(15, Math.round((endAt.getTime() - startAt.getTime()) / 60000))

      // 1) Zoom sastanak (obavezan)
      let zoom
      try {
        zoom = await createZoomMeeting({ topic: 'Spiko Edu — čas', startAt, durationMinutes: durationMin })
      } catch {
        return status(502, { error: 'Zoom sastanak nije mogao da se napravi. Pokušaj ponovo.' })
      }

      // 2) Google Calendar event sa Zoom linkom (blokira i taj termin na kalendaru)
      let googleEventId: string | null = null
      try {
        const ev = await createCalendarEvent({ teacher, startAt, endAt, zoomJoinUrl: zoom.joinUrl, studentEmail: user.email })
        googleEventId = ev.id
      } catch {
        /* kalendar nije uspeo — poziv i dalje radi preko Zoom linka */
      }

      // 3) Materijalizuj slot (booked) + booking (FK zahtev)
      const [slot] = await db
        .insert(availabilitySlots)
        .values({ teacherId: teacher.id, startAt, endAt, status: 'booked' })
        .returning()

      const [booking] = await db
        .insert(bookings)
        .values({
          slotId: slot.id,
          studentId: user.userId,
          teacherId: teacher.id,
          status: 'confirmed',
          googleEventId,
          meetLink: zoom.joinUrl,
          zoomMeetingId: zoom.meetingId,
        })
        .returning()

      return booking
    },
    { body: t.Object({ startAt: t.String(), endAt: t.String() }) },
  )
  // Moje rezervacije (student) — sa vremenom i Zoom linkom
  .get('/mine', async ({ user }) => {
    return db
      .select({
        id: bookings.id,
        status: bookings.status,
        meetLink: bookings.meetLink,
        startAt: availabilitySlots.startAt,
        endAt: availabilitySlots.endAt,
      })
      .from(bookings)
      .leftJoin(availabilitySlots, eq(availabilitySlots.id, bookings.slotId))
      .where(eq(bookings.studentId, user.userId))
      .orderBy(availabilitySlots.startAt)
  })
