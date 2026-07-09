import type {
  ExercisePayload,
  ExercisePayloadForStudent,
} from '@spiko/shared'

/**
 * Sklanja tačne odgovore iz payload-a pre slanja klijentu.
 * Student vidi samo pitanje + opcije (izmešane gde treba).
 */
export function scrubExerciseForStudent(p: ExercisePayload): ExercisePayloadForStudent {
  switch (p.type) {
    case 'multiple_choice':
      return {
        type: 'multiple_choice',
        data: {
          question: p.data.question,
          options: p.data.options,
        },
      }
    case 'fill_blank':
      return {
        type: 'fill_blank',
        data: {
          template: p.data.template,
          blankCount: p.data.answers.length,
        },
      }
    case 'matching':
      // Pošalji izmešanu desnu kolonu
      return {
        type: 'matching',
        data: {
          question: p.data.question,
          left: p.data.left,
          right: shuffle(p.data.right),
        },
      }
    case 'ordering':
      // Pošalji izmešane stavke
      return {
        type: 'ordering',
        data: {
          question: p.data.question,
          items: shuffle(p.data.items),
        },
      }
  }
}

/**
 * Ocenjivanje na backendu — vraća score 0-1 i detalje po pitanju.
 */
export function grade(
  payload: ExercisePayload,
  answers: unknown,
): { isCorrect: boolean; score: number; details: unknown } {
  switch (payload.type) {
    case 'multiple_choice': {
      const a = answers as { selectedOptionId?: string }
      const isCorrect = a?.selectedOptionId === payload.data.correctOptionId
      return {
        isCorrect,
        score: isCorrect ? 1 : 0,
        details: {
          correctOptionId: payload.data.correctOptionId,
          explanation: payload.data.explanation,
        },
      }
    }

    case 'fill_blank': {
      const a = answers as { filled?: string[] }
      const filled = a?.filled ?? []
      const blanks = payload.data.answers
      let correctCount = 0
      const perBlank = blanks.map((b, i) => {
        const given = filled[i] ?? ''
        const cs = b.caseSensitive ?? false
        const normGiven = cs ? given.trim() : given.trim().toLowerCase()
        const ok = b.accepted.some((acc) => (cs ? acc : acc.toLowerCase()) === normGiven)
        if (ok) correctCount++
        return { correct: ok, expected: b.accepted[0] }
      })
      const score = blanks.length ? correctCount / blanks.length : 0
      return {
        isCorrect: score === 1,
        score,
        details: { perBlank, explanation: payload.data.explanation },
      }
    }

    case 'matching': {
      const a = answers as { pairs?: Record<string, string> }
      const submitted = a?.pairs ?? {}
      const total = Object.keys(payload.data.pairs).length
      let correctCount = 0
      const perPair: Array<{ leftId: string; correct: boolean; expected: string }> = []
      for (const [leftId, expected] of Object.entries(payload.data.pairs)) {
        const given = submitted[leftId]
        const ok = given === expected
        if (ok) correctCount++
        perPair.push({ leftId, correct: ok, expected })
      }
      const score = total ? correctCount / total : 0
      return { isCorrect: score === 1, score, details: { perPair } }
    }

    case 'ordering': {
      const a = answers as { orderIds?: string[] }
      const given = a?.orderIds ?? []
      const expected = payload.data.items.map((i) => i.id)
      let correctCount = 0
      for (let i = 0; i < expected.length; i++) {
        if (given[i] === expected[i]) correctCount++
      }
      const score = expected.length ? correctCount / expected.length : 0
      return { isCorrect: score === 1, score, details: { expectedOrder: expected } }
    }
  }
}

function shuffle<T>(arr: T[]): T[] {
  // Deterministic-ish shuffle za request — nije bezbedno za kriptografiju,
  // ali dovoljno da student ne vidi tačan redosled.
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
