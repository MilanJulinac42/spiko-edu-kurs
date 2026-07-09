import OpenAI from 'openai'
import { env } from '../env'

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY })

export function isOpenAiConfigured(): boolean {
  return !!env.OPENAI_API_KEY
}

const LANGUAGE_NAMES: Record<string, string> = {
  de: 'nemački',
  en: 'engleski',
  sr: 'srpski',
  es: 'španski',
  fr: 'francuski',
  it: 'italijanski',
}

type LessonContext = { title: string; type: string; snippet: string }

/**
 * Brz prevod reči preko OpenAI (gpt-4o-mini) — jeftino i brzo, za inline word
 * lookup u lekciji. AI zna koji jezik student uči: ako je reč na maternjem
 * jeziku, ne prevodi je.
 *
 * Vraća { translation, explanation } — dve linije, isti format kao Claude verzija.
 */
export async function wordLookupOpenAI({
  word,
  nativeLanguage,
  targetLevel,
  targetLanguage,
  lesson,
}: {
  word: string
  nativeLanguage: string
  targetLevel: string | null
  targetLanguage: string | null
  lesson: LessonContext | null
}): Promise<{ translation: string; explanation: string; isNative: boolean }> {
  const nativeName = LANGUAGE_NAMES[nativeLanguage] ?? nativeLanguage
  const targetName = targetLanguage ? LANGUAGE_NAMES[targetLanguage] ?? targetLanguage : null

  const sys = `Ti si rečnik u jezičkoj aplikaciji za učenje jezika.
Student uči ${targetName ? `${targetName} jezik` : 'strani jezik'}, a maternji jezik mu je ${nativeName}.
Odabrao je reč ili kratku frazu u lekciji.

VAŽNO — prvo utvrdi jezik odabrane reči:
- Ako je reč na jeziku KOJI SE UČI (${targetName ?? 'strani jezik'}): daj prevod + kratko objašnjenje. TO je glavna svrha.
- Ako reč NIJE na jeziku koji se uči (npr. na maternjem ${nativeName} jeziku, ili je broj/interpunkcija/nepoznato): vrati TAČNO jednu reč: NATIVE (velikim slovima, ništa više). Ne objašnjavaj.

Format odgovora kad JESTE reč koja se uči — ISKLJUČIVO dve linije:
  Prva linija: SAMO prevod (1-4 reči). Za imenice dodaj član (npr. "der Hund"). Za glagole daj infinitiv.
  Druga linija: bogatije objašnjenje (2-4 rečenice) koje uključuje:
    • kada i kako se reč koristi (formalno/neformalno, tipičan kontekst),
    • gramatičku napomenu (rod i množina za imenice; osnovni oblik/konjugacija za glagole),
    • JEDAN kratak primer rečenice na jeziku koji se uči SA prevodom u zagradi.
Piši toplo i jasno, kao dobar nastavnik. Sve na ${nativeName} jeziku (osim primera).
Bez markdown, bez bold, bez kvota, bez prefiksa "Prevod:" ili "Objašnjenje:". Sve objašnjenje u JEDNOJ liniji (bez preloma).${
    lesson ? `\n\nKontekst lekcije "${lesson.title}":\n${lesson.snippet.slice(0, 500)}` : ''
  }${targetLevel ? `\nNivo studenta: ${targetLevel}` : ''}`

  const res = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    max_tokens: 400,
    temperature: 0.4,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: word },
    ],
  })

  const raw = (res.choices[0]?.message?.content ?? '').trim()

  // Reč nije na jeziku koji se uči → signal frontendu da ne prikazuje ništa
  if (/^NATIVE\b/i.test(raw)) {
    return { translation: '', explanation: '', isNative: true }
  }

  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  return {
    translation: lines[0] ?? '',
    explanation: lines.slice(1).join(' '),
    isNative: false,
  }
}
