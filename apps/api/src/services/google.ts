import { google } from 'googleapis'
import { env } from '../env'

export function makeOAuthClient() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  )
}

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

/** Consent URL — `state` nosi teacherId da callback zna čiji je token. */
export function getConsentUrl(state: string): string {
  return makeOAuthClient().generateAuthUrl({
    access_type: 'offline', // daje refresh_token
    prompt: 'consent', // forsira refresh_token na svakom povezivanju
    scope: [CALENDAR_SCOPE],
    state,
  })
}

/** Razmeni auth code za refresh token (posle Google redirect-a na callback). */
export async function exchangeCodeForRefreshToken(code: string): Promise<string | null> {
  const { tokens } = await makeOAuthClient().getToken(code)
  return tokens.refresh_token ?? null
}

export function isGoogleConfigured(): boolean {
  return !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET
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
