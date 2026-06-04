import { and, between, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { bookings, profiles } from '../db/schema'
import { sendEmail } from '../services/email'

/**
 * Kandidat za cron job — pokreće se npr. na svakih 5 min.
 * Šalje podsetnik 24h i 1h pre zakazanog booking-a.
 */
export async function sendBookingReminders() {
  const now = new Date()

  const ranges: Array<{ from: Date; to: Date; label: string }> = [
    {
      from: new Date(now.getTime() + 24 * 60 * 60 * 1000 - 2.5 * 60 * 1000),
      to: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 2.5 * 60 * 1000),
      label: '24h',
    },
    {
      from: new Date(now.getTime() + 60 * 60 * 1000 - 2.5 * 60 * 1000),
      to: new Date(now.getTime() + 60 * 60 * 1000 + 2.5 * 60 * 1000),
      label: '1h',
    },
  ]

  for (const range of ranges) {
    const rows = await db
      .select({
        id: bookings.id,
        meetLink: bookings.meetLink,
        studentId: bookings.studentId,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, 'confirmed'),
          // booking-u treba startAt — pa join sa availability_slots; preskačemo radi MVP stubova
        ),
      )

    for (const b of rows) {
      const [p] = await db
        .select({ fullName: profiles.fullName })
        .from(profiles)
        .where(eq(profiles.id, b.studentId))
        .limit(1)
      await sendEmail({
        to: '', // TODO: profil/email iz auth.users
        subject: `Podsetnik (${range.label}) — Spiko konverzacija`,
        html: `<p>Vaš termin je za ${range.label}. ${
          b.meetLink ? `<a href="${b.meetLink}">Meet link</a>` : ''
        }</p>`,
      })
      void p
    }
  }
}
