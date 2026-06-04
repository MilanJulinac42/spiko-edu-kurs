import Elysia, { t } from 'elysia'
import { and, eq, gte } from 'drizzle-orm'
import { db } from '../../db/client'
import { availabilitySlots, bookings, teachers } from '../../db/schema'
import { entitlement } from '../../middleware/entitlement'
import { createMeetEvent } from '../../services/google'

export const bookingsModule = new Elysia({ prefix: '/bookings' })
  .use(entitlement)
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

      const event = await createMeetEvent({
        teacher,
        studentId: user.userId,
        startAt: slot.startAt,
        endAt: slot.endAt,
      })

      const [booking] = await db
        .insert(bookings)
        .values({
          slotId: slot.id,
          studentId: user.userId,
          teacherId: teacher.id,
          status: 'confirmed',
          googleEventId: event.id,
          meetLink: event.meetLink,
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
