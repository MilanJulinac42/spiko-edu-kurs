/**
 * Kanonski oblik `exercises.payload` jsonb polja po tipu.
 * Frontend builder + backend grader oba čitaju ove tipove iz jednog mesta.
 */

export type MultipleChoicePayload = {
  question: string
  options: Array<{ id: string; text: string }>
  correctOptionId: string
  explanation?: string
}

export type FillBlankPayload = {
  /** Tekst sa `___` markerima za praznine, npr "Idem ___ školu ___ autobusom." */
  template: string
  /** Tačni odgovori redom kako se pojavljuju `___` u template-u. */
  answers: Array<{ accepted: string[]; caseSensitive?: boolean }>
  explanation?: string
}

export type MatchingPayload = {
  question?: string
  /** Levi parovi (npr reči) */
  left: Array<{ id: string; text: string }>
  /** Desni parovi (npr prevodi) */
  right: Array<{ id: string; text: string }>
  /** Tačno mapiranje: leftId → rightId */
  pairs: Record<string, string>
}

export type OrderingPayload = {
  question?: string
  /** Stavke u TAČNOM redosledu — frontend ih prikazuje izmešane */
  items: Array<{ id: string; text: string }>
}

export type ExercisePayload =
  | { type: 'multiple_choice'; data: MultipleChoicePayload }
  | { type: 'fill_blank'; data: FillBlankPayload }
  | { type: 'matching'; data: MatchingPayload }
  | { type: 'ordering'; data: OrderingPayload }

/**
 * Klijent NIKAD ne sme da vidi tačne odgovore pre nego što submituje.
 * Backend sklanja `correctOptionId`, `answers`, `pairs`, redosled `items`
 * pre slanja na klijenta.
 */
export type ExercisePayloadForStudent =
  | { type: 'multiple_choice'; data: Omit<MultipleChoicePayload, 'correctOptionId' | 'explanation'> }
  | { type: 'fill_blank'; data: { template: string; blankCount: number } }
  | { type: 'matching'; data: Omit<MatchingPayload, 'pairs'> }
  | { type: 'ordering'; data: { question?: string; items: Array<{ id: string; text: string }> } }
