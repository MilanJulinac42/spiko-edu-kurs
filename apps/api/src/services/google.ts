import { google } from 'googleapis'
import { env } from '../env'

export function makeOAuthClient() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  )
}

type Teacher = { id: string; googleRefreshToken: string | null }

type EventInput = {
  teacher: Teacher
  studentId: string
  startAt: Date
  endAt: Date
}

export async function createMeetEvent({ teacher, startAt, endAt }: EventInput) {
  if (!teacher.googleRefreshToken) {
    throw new Error('teacher google not connected')
  }
  const oauth = makeOAuthClient()
  oauth.setCredentials({ refresh_token: teacher.googleRefreshToken })
  const calendar = google.calendar({ version: 'v3', auth: oauth })

  const res = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: 'Spiko Edu — konverzacija',
      start: { dateTime: startAt.toISOString() },
      end: { dateTime: endAt.toISOString() },
      conferenceData: {
        createRequest: {
          requestId: `spiko-${teacher.id}-${startAt.getTime()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  })

  const meetLink =
    res.data.hangoutLink ??
    res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ??
    null

  return { id: res.data.id!, meetLink: meetLink ?? '' }
}
