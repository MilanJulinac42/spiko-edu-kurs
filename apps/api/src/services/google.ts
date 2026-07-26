import { google } from 'googleapis'
import { env } from '../env'

export function makeOAuthClient() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  )
}

const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events', // pravljenje evenata
  'https://www.googleapis.com/auth/calendar.readonly', // freebusy (kad je Ema zauzeta)
]

/** Consent URL — `state` nosi teacherId da callback zna čiji je token. */
export function getConsentUrl(state: string): string {
  return makeOAuthClient().generateAuthUrl({
    access_type: 'offline', // daje refresh_token
    prompt: 'consent', // forsira refresh_token na svakom povezivanju
    scope: CALENDAR_SCOPES,
    state,
  })
}

/** Vrati zauzete intervale iz Eminog primarnog kalendara (freebusy). */
export async function getBusyIntervals(
  teacher: { googleRefreshToken: string | null },
  timeMin: Date,
  timeMax: Date,
): Promise<Array<{ start: Date; end: Date }>> {
  if (!teacher.googleRefreshToken) return []
  const oauth = makeOAuthClient()
  oauth.setCredentials({ refresh_token: teacher.googleRefreshToken })
  const calendar = google.calendar({ version: 'v3', auth: oauth })
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: 'primary' }],
    },
  })
  const busy = res.data.calendars?.primary?.busy ?? []
  return busy
    .filter((b) => b.start && b.end)
    .map((b) => ({ start: new Date(b.start!), end: new Date(b.end!) }))
}

/** Razmeni auth code za refresh token (posle Google redirect-a na callback). */
export async function exchangeCodeForRefreshToken(code: string): Promise<string | null> {
  const { tokens } = await makeOAuthClient().getToken(code)
  return tokens.refresh_token ?? null
}

export function isGoogleConfigured(): boolean {
  return !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET
}

type Teacher = { googleRefreshToken: string | null }

type CalendarEventInput = {
  teacher: Teacher
  startAt: Date
  endAt: Date
  /** Zoom join link — ide u lokaciju + opis eventa (klik = poziv). */
  zoomJoinUrl: string
  /** Email polaznika — dodaje se kao gost na event. */
  studentEmail: string | null
  summary?: string
}

/**
 * Napravi Google Calendar event na Eminom kalendaru sa Zoom linkom.
 * Zoom link ide u `location` + opis, polaznik kao gost. Vraća event id.
 */
export async function createCalendarEvent({
  teacher,
  startAt,
  endAt,
  zoomJoinUrl,
  studentEmail,
  summary = 'Spiko Edu — čas',
}: CalendarEventInput): Promise<{ id: string }> {
  if (!teacher.googleRefreshToken) {
    throw new Error('teacher google not connected')
  }
  const oauth = makeOAuthClient()
  oauth.setCredentials({ refresh_token: teacher.googleRefreshToken })
  const calendar = google.calendar({ version: 'v3', auth: oauth })

  const res = await calendar.events.insert({
    calendarId: 'primary',
    sendUpdates: 'all', // pošalji poziv gostu (polazniku)
    requestBody: {
      summary,
      location: zoomJoinUrl,
      description: `Pridruži se času preko Zoom-a:\n${zoomJoinUrl}`,
      start: { dateTime: startAt.toISOString() },
      end: { dateTime: endAt.toISOString() },
      ...(studentEmail ? { attendees: [{ email: studentEmail }] } : {}),
    },
  })

  return { id: res.data.id! }
}

/** Obriši kalendar event (pri otkazivanju termina). Best-effort. */
export async function deleteCalendarEvent(teacher: Teacher, eventId: string): Promise<void> {
  if (!teacher.googleRefreshToken) return
  const oauth = makeOAuthClient()
  oauth.setCredentials({ refresh_token: teacher.googleRefreshToken })
  const calendar = google.calendar({ version: 'v3', auth: oauth })
  try {
    await calendar.events.delete({ calendarId: 'primary', eventId, sendUpdates: 'all' })
  } catch {
    /* best-effort */
  }
}
