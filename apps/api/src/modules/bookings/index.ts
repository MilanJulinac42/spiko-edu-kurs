import Elysia, { t } from 'elysia'
import { and, eq, gte } from 'drizzle-orm'
import { db } from '../../db/client'
import { availabilitySlots, bookings, teachers } from '../../db/schema'
import { auth } from '../../middleware/auth'
import { createCalendarEvent } from '../../services/google'
import { createZoomMeeting, isZoomConfigured } from '../../services/zoom'

// NAPOMENA: zakazivanje je za sad otvoreno svakom ulogovanom polazniku (auth).
// Kad krene naplata (Raiffeisen), vratiti `entitlement` da traži aktivnu pretplatu.
export const bookingsModule = new Elysia({ prefix: '/bookings' })
  .use(auth)
  .get('/availability', async ({ query }) => {
    const teacherId = query.teacherId
    return db
      .select()
      .from(availabilitySlots)
      .where(
        and(
          teacherId ? eq(availabilitySlots.teacherId, teacherId) : undefined,
          eq(availabilitySlots.status, 'open'),
          gte(availabilitySlots.startAt, new Date()),
        ),
      )
  }, {
    query: t.Object({ teacherId: t.Optional(t.String()) }),
  })
  .post(
    '/',
    async ({ body, user, status }) => {
      const [slot] = await db
        .select()
        .from(availabilitySlots)
        .where(eq(availabilitySlots.id, body.slotId))
        .limit(1)
      if (!slot || slot.status !== 'open') {
        return status(409, { error: 'slot not available' })
      }

      const [teacher] = await db
        .select()
        .from(teachers)
        .where(eq(teachers.id, slot.teacherId))
        .limit(1)
      if (!teacher) return status(404, { error: 'teacher not found' })

      if (!isZoomConfigured()) {
        return status(503, { error: 'Zoom nije konfigurisan — zakazivanje trenutno nedostupno.' })
      }

      const durationMin = Math.max(
        15,
        Math.round((slot.endAt.getTime() - slot.startAt.getTime()) / 60000),
      )

      // 1) Zoom sastanak (obavezan — to je sam poziv)
      let zoom
      try {
        zoom = await createZoomMeeting({
          topic: 'Spiko Edu — čas',
          startAt: slot.startAt,
          durationMinutes: durationMin,
        })
      } catch {
        return status(502, { error: 'Zoom sastanak nije mogao da se napravi. Pokušaj ponovo.' })
      }

      // 2) Google Calendar event sa Zoom linkom (best-effort — ne ruši booking)
      let googleEventId: string | null = null
      if (teacher.googleRefreshToken) {
        try {
          const ev = await createCalendarEvent({
            teacher,
            startAt: slot.startAt,
            endAt: slot.endAt,
            zoomJoinUrl: zoom.joinUrl,
            studentEmail: user.email,
          })
          googleEventId = ev.id
        } catch {
          /* kalendar nije uspeo — poziv i dalje postoji preko Zoom linka */
        }
      }

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

      await db
        .update(availabilitySlots)
        .set({ status: 'booked' })
        .where(eq(availabilitySlots.id, slot.id))

      return booking
    },
    {
      body: t.Object({ slotId: t.String() }),
    },
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
