import Anthropic from '@anthropic-ai/sdk'
import { env } from '../env'

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

type ChatMessage = { role: 'user' | 'assistant'; content: string }
type ProfileContext = {
  fullName: string | null
  targetLevel: string | null
  nativeLanguage: string | null
  goal: string | null
}
type LessonContext = { title: string; type: string; snippet: string }

const BASE_SYSTEM = `Ti si AI tutor za učenje jezika u aplikaciji Spiko Edu.

Stil:
- Sažeto i jasno — 2–4 rečenice za prosta pitanja, više kad je potrebno (objašnjenje gramatike, primeri).
- Toplo ali profesionalno. Ohrabri studenta da nastavi.
- Odgovori na korisnikovom jeziku (najčešće srpski), ali daj i original na ciljnom jeziku kad pitaju za prevod.

VAŽNO — RODNO NEUTRALNO PISANJE (srpski):
- Ne znaš pol korisnika. NIKAD ne koristi rodno-zavisne glagolske forme za korisnikove radnje.
- LOŠE: "Pogodila si", "Pogodio si", "Mogla bi", "Mogao bi", "Sjajna si", "Sjajan si", "Hvala što si pokušala/pokušao".
- DOBRO: "Tačno", "Odgovor je tačan", "Pokušaj", "Probaj", "Sjajno", "Bravo", "Hvala na trudu", "Možeš da pokušaš", "Vredi probati".
- Koristi imperativ (Pokušaj, Probaj, Pogledaj), pasiv (Tačno je, Pogrešno je), ili infinitiv (Pokušati ovako, Pamtiti kao…).
- Vokativ imena je OK ("Milane, …") jer je gender-neutral u srpskom.

Kako pomažeš:
- Prevodi reči i fraze. Daj alternativne formulacije.
- Objašnjavaj gramatiku sa primerima.
- Ako student greši (gramatika, pravopis) — prvo odgovori, pa NA KRAJU pomeni ispravku ljubazno (impersonal, npr. "Sitna napomena: ispravno je…").
- Daj mnemoničke trikove i asocijacije za pamćenje.
- Ako pitanje izlazi van učenja jezika — kratko vrati u temu.

Format:
- Reči i fraze u ciljnom jeziku bold-uj: **Hund**, **Wie heißt du?**
- Prevode kursivuj: *pas*, *kako se zoveš?*
- Za nove reči daj rod (m./ž./s.) i množinu kad je relevantno: **die Stadt** *(grad, ž., mn. Städte)*`

/**
 * Brza pretraga reči — vrlo kratak odgovor.
 * Vraća JSON sa `translation` i `explanation`.
 */
const LANGUAGE_NAMES: Record<string, string> = {
  de: 'nemački',
  en: 'engleski',
  sr: 'srpski',
  es: 'španski',
  fr: 'francuski',
  it: 'italijanski',
}

export async function quickLookup({
  word,
  nativeLanguage,
  targetLevel,
  targetLanguage,
  lesson,
}: {
  word: string
  nativeLanguage: string
  targetLevel: string | null
  /** ISO kod jezika koji student uči (de/en...). Null ako nepoznat. */
  targetLanguage: string | null
  lesson: LessonContext | null
}) {
  const nativeName = LANGUAGE_NAMES[nativeLanguage] ?? nativeLanguage
  const targetName = targetLanguage ? LANGUAGE_NAMES[targetLanguage] ?? targetLanguage : null

  const sys = `Ti si rečnik u jezičkoj aplikaciji za učenje jezika.
Student uči ${targetName ? `${targetName} jezik` : 'strani jezik'}, a maternji jezik mu je ${nativeName} (ISO: ${nativeLanguage}).
Odabrao je reč ili kratku frazu u lekciji.

VAŽNO — prvo utvrdi jezik odabrane reči:
- Ako je reč na jeziku KOJI SE UČI (${targetName ?? 'strani jezik'}): daj prevod + kratko objašnjenje. TO je glavna svrha.
- Ako je reč na MATERNJEM jeziku (${nativeName}) — student je već zna: NE prevodi je. U prvu liniju stavi kratku napomenu tipa "(reč na maternjem jeziku)", a u drugu liniju samo "Ova reč je na tvom maternjem jeziku — objašnjenje nije potrebno.".

Format odgovora — ISKLJUČIVO dve linije:
  Prva linija: SAMO prevod (1-3 reči), ili napomena ako je maternji jezik.
  Druga linija: SAMO objašnjenje (1-2 kratke rečenice — gramatika, rod, množina, kontekst, primer).
- Bez markdown, bez bold, bez kvota, bez prefiksa "Prevod:" ili "Objašnjenje:".
- Reči na jeziku koji se uči navedi sa članom kad je relevantno (npr. "der Hund").

${
  lesson
    ? `Kontekst lekcije "${lesson.title}":\n${lesson.snippet.slice(0, 800)}`
    : ''
}
${targetLevel ? `\nNivo studenta: ${targetLevel}` : ''}`

  const res = await client.messages.create({
    model: env.ANTHROPIC_MODEL_SMART,
    max_tokens: 200,
    system: [{ type: 'text', text: sys, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: word }],
  })

  const raw = res.content
    .map((c) => (c.type === 'text' ? c.text : ''))
    .join('\n')
    .trim()

  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  return {
    translation: lines[0] ?? '',
    explanation: lines.slice(1).join(' '),
    isNative: false,
  }
}

/**
 * Objasni studentu zašto je odgovor pogrešan + daj korak ka tačnom rešavanju.
 * Kratak, pedagoški ton — nikad ne kažemo direktno tačan odgovor (da ne nagrađujemo skok),
 * ali jasno usmeravamo.
 */
export async function explainWrongAnswer({
  question,
  exerciseType,
  studentAnswer,
  correctAnswer,
  nativeLanguage,
  targetLevel,
}: {
  question: string
  exerciseType: string
  studentAnswer: string
  correctAnswer: string
  nativeLanguage: string
  targetLevel: string | null
}) {
  const sys = `Ti si AI tutor u jezičkoj aplikaciji.
Student je pogrešno odgovorio na vežbu. Tvoj zadatak je da objasniš ZAŠTO je pogrešno,
i daš kratko gramatičko/leksičko objašnjenje koje će pomoći da se sledeći put pogodi.

VAŽNO — RODNO NEUTRALNO PISANJE:
Ne znaš pol korisnika. NIKAD ne koristi rodno-zavisne glagolske forme.
LOŠE: "Pogrešila si", "Pogrešio si", "Mogla bi", "Mogao bi", "Hvala što si pokušala/pokušao".
DOBRO: "Pogrešno je", "Odgovor nije tačan", "Vredi probati", "Možeš probati", "Pravilo je sledeće".
Koristi pasiv ("Greška je u…", "Tačno je…"), imperativ ("Probaj", "Zapamti"), ili impersonalne konstrukcije.

Pravila:
- Odgovori na maternjem jeziku studenta (ISO: ${nativeLanguage}).
- 2–4 rečenice MAX. Kratko, jasno, prijateljski.
- Najpre POMENI grešku ("Odgovor X znači…" ili "Greška je u tome što…"), pa daj OBJAŠNJENJE pravila.
- Daj tačan odgovor jasno označen kao "Tačno je: **X**".
- Ako ima koristan trik za pamćenje (mnemonik, asocijacija), dodaj ga na kraju.
- Bez markdown osim **bold** za reči/fraze na ciljnom jeziku.
- Ne moraliziraj, ne hvali se. Drži se na pomoć.
${targetLevel ? `\nNivo studenta: ${targetLevel}` : ''}`

  const userMsg = `Tip vežbe: ${exerciseType}
Pitanje: ${question}

Odgovor korisnika: ${studentAnswer}
Tačan odgovor: ${correctAnswer}

Objasni zašto je odgovor pogrešan i kako razumeti pravilo. PIŠI RODNO NEUTRALNO.`

  const res = await client.messages.create({
    model: env.ANTHROPIC_MODEL_SMART,
    max_tokens: 400,
    system: [{ type: 'text', text: sys, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMsg }],
  })

  const text = res.content
    .map((c) => (c.type === 'text' ? c.text : ''))
    .join('\n')
    .trim()

  return {
    explanation: text,
    tokensIn: res.usage.input_tokens,
    tokensOut: res.usage.output_tokens,
  }
}

/**
 * Generiše strukturu kursa (course + modules + lessons SKELETON) iz slobodno
 * pisanog prompta. Vraća samo strukturu — bez sadržaja vežbi, teksta ili videa.
 *
 * Admin posle pregleda preview, edituje, i jednim klikom kreira sve u bazi.
 */
export type LessonBlockType = 'video' | 'text' | 'exercises' | 'audio'

export type GeneratedCourseStructure = {
  course: {
    title: string
    description: string
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
    language: string // 'de' | 'en' | 'fr' | 'es' | 'it' | 'sr' | ...
  }
  modules: Array<{
    title: string
    lessons: Array<{
      title: string
      /**
       * Koje vrste sadržaja AI predlaže za ovu lekciju.
       * Lekcija može imati više tipova — npr. video uvod + tekst objašnjenje + vežba.
       * Najmanje 1 stavka, najviše 4.
       */
      types: LessonBlockType[]
    }>
  }>
}

export async function generateCourseStructure({
  prompt,
}: {
  prompt: string
}): Promise<GeneratedCourseStructure> {
  const sys = `Ti si dizajner kurikuluma za Spiko Edu — onlajn platformu za učenje stranih jezika za srpsko tržište.

Korisnik (autor kursa) ti opisuje šta želi. Generiši PEDAGOŠKI SOLIDNU strukturu kursa.

PRAVILA:
- Kurs ima 3-8 modula. Svaki modul ima 4-8 lekcija.
- Naslovi modula i lekcija su NA SRPSKOM. Reči/fraze ciljnog jezika u zagradi ako treba.

TIPOVI SADRŽAJA U LEKCIJI:
Svaka lekcija može imati VIŠE tipova sadržaja (kombinacija):
- "video" — vizuelni primer, dijalog, izgovor, kulturno objašnjenje
- "audio" — slušna vežba, snimak izgovora, dijalog samo zvuk
- "text" — gramatika, pravila, lista reči, objašnjenje koncepta
- "exercises" — interaktivne vežbe (multiple choice, popunjavanje, uparivanje)

Polje "types" je NIZ (1-4 stavke) — biraj sve što ima smisla pedagoški.
Tipični obrasci:
- Uvodna lekcija: ["video", "text"] — video + objašnjenje
- Gramatika: ["text", "exercises"] — pravilo + vežba
- Slušanje: ["audio", "exercises"] — snimak + razumevanje
- Pun mix: ["video", "text", "audio", "exercises"] — kompletna lekcija
- Pure praksa: ["exercises"] — samo vežba

Lekcije unutar modula idu PROGRESIVNO — od jednostavnijih ka složenijim.
Moduli unutar kursa idu PROGRESIVNO — od osnovnih ka kompleksnijim temama.
CEFR nivo treba da bude realan (A1 = početnik, B2 = razgovor o širim temama).
Description je 1-2 rečenice, friendly ali profesionalno.

RODNO NEUTRALAN JEZIK:
- Naslovi i opis bez "Naučićeš/Naučila ćeš". Koristi imenice ("Učenje brojeva", "Pozdravi i predstavljanje") ili imperativ ("Nauči brojeve").

JEZIK KÔD:
- de=nemački, en=engleski, fr=francuski, es=španski, it=italijanski, ru=ruski, sr=srpski
- Default ako nije jasno: probaj da iz prompta detektuješ; ako je nemoguće → "de".

OBAVEZNO: vrati ISKLJUČIVO validan JSON, bez ikakvog markdown-a, bez objašnjenja, bez wrapper-a. Direktno:
{
  "course": { "title": "...", "description": "...", "level": "A1", "language": "de" },
  "modules": [
    {
      "title": "Modul naziv",
      "lessons": [
        { "title": "Naziv lekcije", "types": ["video", "text"] }
      ]
    }
  ]
}`

  const res = await client.messages.create({
    model: env.ANTHROPIC_MODEL_SMART,
    max_tokens: 4000,
    system: [{ type: 'text', text: sys, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = res.content
    .map((c) => (c.type === 'text' ? c.text : ''))
    .join('\n')
    .trim()

  // Probaj direktan JSON parse; ako ima markdown wrapper, izvuci.
  let jsonText = raw
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenceMatch) jsonText = fenceMatch[1]

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch (e) {
    throw new Error(
      `AI je vratio nevažeći JSON: ${e instanceof Error ? e.message : 'parse error'}. Probaj ponovo sa konkretnijim promptom.`,
    )
  }

  return validateCourseStructure(parsed)
}

function validateCourseStructure(data: unknown): GeneratedCourseStructure {
  if (!data || typeof data !== 'object') {
    throw new Error('AI nije vratio očekivanu strukturu (root nije objekat)')
  }
  const d = data as Record<string, unknown>
  if (!d.course || typeof d.course !== 'object') {
    throw new Error('AI struktura nema "course" objekat')
  }
  if (!Array.isArray(d.modules)) {
    throw new Error('AI struktura nema "modules" niz')
  }
  const course = d.course as Record<string, unknown>
  if (typeof course.title !== 'string' || !course.title.trim()) {
    throw new Error('Kurs nema naslov')
  }

  // Normalizacija nivoa
  const allowedLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
  const level = allowedLevels.includes(course.level as typeof allowedLevels[number])
    ? (course.level as typeof allowedLevels[number])
    : 'A1'

  // Normalizacija lekcija — prima `types` niz; ako stari `type` single string, konvertuje
  const allowedTypes: LessonBlockType[] = ['video', 'text', 'exercises', 'audio']
  function normalizeTypes(raw: unknown, fallbackSingle: unknown): LessonBlockType[] {
    // Novi format: types array
    if (Array.isArray(raw)) {
      const out: LessonBlockType[] = []
      const seen = new Set<LessonBlockType>()
      for (const t of raw) {
        // Backward compat: AI ponekad piše "exercise" (singular) — mapuj na "exercises"
        const normalized = t === 'exercise' ? 'exercises' : t
        if (allowedTypes.includes(normalized as LessonBlockType) && !seen.has(normalized as LessonBlockType)) {
          out.push(normalized as LessonBlockType)
          seen.add(normalized as LessonBlockType)
        }
      }
      if (out.length > 0) return out.slice(0, 4)
    }
    // Stari format: type single string (backward compat)
    const single = fallbackSingle === 'exercise' ? 'exercises' : fallbackSingle
    if (allowedTypes.includes(single as LessonBlockType)) {
      return [single as LessonBlockType]
    }
    return ['text']
  }

  const modules = (d.modules as Array<unknown>).map((m, mIdx) => {
    const mod = m as Record<string, unknown>
    const mTitle = typeof mod.title === 'string' ? mod.title : `Modul ${mIdx + 1}`
    const lessons = Array.isArray(mod.lessons)
      ? (mod.lessons as Array<unknown>).map((l, lIdx) => {
          const lesson = l as Record<string, unknown>
          return {
            title: typeof lesson.title === 'string' ? lesson.title : `Lekcija ${lIdx + 1}`,
            types: normalizeTypes(lesson.types, lesson.type),
          }
        })
      : []
    return { title: mTitle, lessons }
  })

  return {
    course: {
      title: String(course.title),
      description: typeof course.description === 'string' ? course.description : '',
      level,
      language:
        typeof course.language === 'string' && course.language.trim()
          ? course.language.trim().toLowerCase()
          : 'de',
    },
    modules,
  }
}

export async function askClaude({
  messages,
  profile,
  lesson,
}: {
  messages: ChatMessage[]
  profile: ProfileContext | null
  lesson: LessonContext | null
}) {
  const systemParts: string[] = [BASE_SYSTEM]

  if (profile) {
    const lines: string[] = []
    if (profile.fullName) lines.push(`Student: ${profile.fullName}`)
    if (profile.targetLevel) lines.push(`Trenutni CEFR nivo: ${profile.targetLevel}`)
    if (profile.nativeLanguage) lines.push(`Maternji jezik (ISO): ${profile.nativeLanguage}`)
    if (profile.goal) lines.push(`Cilj: ${profile.goal}`)
    if (lines.length) {
      systemParts.push(`\n--- O studentu ---\n${lines.join('\n')}`)
    }
  }

  if (lesson) {
    systemParts.push(
      `\n--- Trenutna lekcija ---\nNaslov: ${lesson.title}\nTip: ${lesson.type}${
        lesson.snippet ? `\nIzvod sadržaja:\n"""\n${lesson.snippet}\n"""` : ''
      }\n\nReferiši se na ovu lekciju kad ima smisla.`,
    )
  }

  const res = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: systemParts.join('\n'),
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
  })

  const text = res.content
    .map((c) => (c.type === 'text' ? c.text : ''))
    .join('\n')
    .trim()

  return {
    text,
    tokensIn: res.usage.input_tokens,
    tokensOut: res.usage.output_tokens,
  }
}
