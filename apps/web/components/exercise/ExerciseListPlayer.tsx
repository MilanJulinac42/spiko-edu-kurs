'use client'

import { useState } from 'react'
import type { ExercisePayloadForStudent } from '@spiko/shared'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { MultipleChoicePlayer } from './MultipleChoicePlayer'
import { FillBlankPlayer } from './FillBlankPlayer'
import { MatchingPlayer } from './MatchingPlayer'
import { OrderingPlayer } from './OrderingPlayer'
import { AudioPlayer } from '@/components/AudioPlayer'

type Exercise = {
  id: string
  title: string
  type: string
  position: number
  payload: ExercisePayloadForStudent | null
  audioUrl?: string | null
  audioTitle?: string | null
}

type GradeResult = {
  isCorrect: boolean
  score: number
  details: unknown
}

export function ExerciseListPlayer({
  exercises,
  onAllCompleted,
}: {
  exercises: Exercise[]
  onAllCompleted: () => void
}) {
  const [idx, setIdx] = useState(0)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const current = exercises[idx]
  const isLast = idx === exercises.length - 1
  const allDone = completedIds.size === exercises.length

  function advance() {
    if (allDone) {
      onAllCompleted()
      return
    }
    // Pronađi sledeću nezavršenu vežbu (ako je trenutna zadnja, idi na bilo koju nezavršenu)
    const startFrom = idx + 1
    for (let i = startFrom; i < exercises.length; i++) {
      if (!completedIds.has(exercises[i].id)) {
        setIdx(i)
        return
      }
    }
    // Ako nema posle, traži od početka
    for (let i = 0; i < idx; i++) {
      if (!completedIds.has(exercises[i].id)) {
        setIdx(i)
        return
      }
    }
    onAllCompleted()
  }

  function jump(i: number) {
    setIdx(i)
  }

  if (!current?.payload) {
    return (
      <div className="rounded-2xl bg-surface p-6 text-sm text-muted">
        Vežba nije ispravno konfigurisana.
      </div>
    )
  }

  return (
    <div>
      {/* Progress dots — i klikabilna navigacija */}
      <div className="mb-6 flex items-center gap-2">
        {exercises.map((e, i) => {
          const done = completedIds.has(e.id)
          const isCurrent = i === idx
          return (
            <button
              key={e.id}
              onClick={() => jump(i)}
              title={`${i + 1}. ${e.title}${done ? ' · ✓' : ''}`}
              className={`h-2.5 flex-1 rounded-full transition-all ${
                done
                  ? 'bg-primary'
                  : isCurrent
                    ? 'bg-primary/40 ring-2 ring-primary/30'
                    : 'bg-ink/10 hover:bg-ink/20'
              }`}
              aria-label={`Vežba ${i + 1}`}
            />
          )
        })}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Vežba {idx + 1} / {exercises.length}
        </p>
        <p className="text-sm text-muted">
          {completedIds.size} / {exercises.length} završeno
        </p>
      </div>

      <h3 className="font-display text-2xl font-bold text-ink">{current.title}</h3>

      {/* Audio uz vežbu — "Slušaj i odgovori" */}
      {current.audioUrl && (
        <div className="mt-4">
          <AudioPlayer src={current.audioUrl} label={current.audioTitle || 'Slušaj'} />
        </div>
      )}

      <div className="mt-6">
        <SingleExercise
          key={current.id}
          exerciseId={current.id}
          payload={current.payload}
          isLast={isLast}
          allDone={allDone}
          onCorrect={() => {
            const next = new Set(completedIds)
            next.add(current.id)
            setCompletedIds(next)
          }}
          onAdvance={advance}
          onFinishLesson={onAllCompleted}
        />
      </div>
    </div>
  )
}

function SingleExercise({
  exerciseId,
  payload,
  isLast,
  allDone,
  onCorrect,
  onAdvance,
  onFinishLesson,
}: {
  exerciseId: string
  payload: ExercisePayloadForStudent
  isLast: boolean
  allDone: boolean
  onCorrect: () => void
  onAdvance: () => void
  onFinishLesson: () => void
}) {
  const [answers, setAnswers] = useState<unknown>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<GradeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (answers === null) return
    setSubmitting(true)
    setError(null)
    try {
      const { data, error: apiError } = await api.exercises({ id: exerciseId }).attempt.post({ answers })
      if (apiError) throw new Error(String(apiError.value ?? apiError.status))
      const r = data as GradeResult
      setResult(r)
      if (r.isCorrect) onCorrect()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setSubmitting(false)
    }
  }

  function retry() {
    setAnswers(null)
    setResult(null)
  }

  const locked = result !== null
  const isCorrect = result?.isCorrect ?? false

  // Tekst primarnog dugmeta po kontekstu
  let primaryLabel = 'Predaj odgovor'
  let primaryAction: () => void = submit
  let primaryDisabled = submitting || answers === null

  if (locked && isCorrect) {
    if (isLast && allDone) {
      primaryLabel = '✓ Završi lekciju'
      primaryAction = onFinishLesson
    } else if (isLast) {
      primaryLabel = 'Završi i pređi na sledeću'
      primaryAction = onAdvance
    } else {
      primaryLabel = 'Sledeća vežba →'
      primaryAction = onAdvance
    }
    primaryDisabled = false
  }

  return (
    <div className="space-y-6">
      {payload.type === 'multiple_choice' && (
        <MultipleChoicePlayer payload={payload.data} onAnswers={setAnswers} locked={locked} result={result} />
      )}
      {payload.type === 'fill_blank' && (
        <FillBlankPlayer payload={payload.data} onAnswers={setAnswers} locked={locked} result={result} />
      )}
      {payload.type === 'matching' && (
        <MatchingPlayer payload={payload.data} onAnswers={setAnswers} locked={locked} result={result} />
      )}
      {payload.type === 'ordering' && (
        <OrderingPlayer payload={payload.data} onAnswers={setAnswers} locked={locked} result={result} />
      )}

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Feedback box samo za pogrešne odgovore */}
      {locked && !isCorrect && (
        <WrongAnswerFeedback
          exerciseId={exerciseId}
          studentAnswer={answers}
          score={result?.score ?? 0}
          onRetry={retry}
        />
      )}

      {/* Tačan odgovor — diskretan green pill */}
      {locked && isCorrect && (
        <div className="flex items-center gap-3 rounded-full border border-primary/30 bg-primary/10 px-4 py-2.5">
          <span className="text-primary-dark">✓</span>
          <p className="flex-1 text-sm font-semibold text-primary-dark">Tačno!</p>
        </div>
      )}

      {/* Jedno primarno dugme — kontekstualno */}
      <div className="flex justify-end">
        <Button variant="primary" size="lg" onClick={primaryAction} disabled={primaryDisabled}>
          {submitting ? 'Šaljem…' : primaryLabel}
        </Button>
      </div>
    </div>
  )
}

function WrongAnswerFeedback({
  exerciseId,
  studentAnswer,
  score,
  onRetry,
}: {
  exerciseId: string
  studentAnswer: unknown
  score: number
  onRetry: () => void
}) {
  const [explanation, setExplanation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function askAi() {
    if (loading || explanation) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: apiError } = await api.ai['explain-wrong'].post({
        exerciseId,
        studentAnswer,
      })
      if (apiError) throw new Error(String(apiError.value ?? apiError.status))
      const r = data as { explanation: string }
      setExplanation(r.explanation)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-red-500 text-lg text-white">
          ✗
        </span>
        <div className="flex-1">
          <p className="font-bold text-red-700">Probaj ponovo</p>
          <p className="text-xs text-muted">Rezultat: {Math.round(score * 100)}%</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Pokušaj ponovo
        </Button>
      </div>

      {/* AI explanation panel */}
      <div className="mt-4 border-t border-red-200/70 pt-4">
        {!explanation && !loading && !error && (
          <button
            type="button"
            onClick={askAi}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft transition-all hover:bg-primary-light/30 hover:text-primary-dark hover:shadow-card"
          >
            <span>✨</span> Objasni mi gde sam pogrešio
          </button>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            AI tutor razmišlja…
          </div>
        )}
        {error && (
          <div className="text-sm text-red-700">
            Nije mi pošlo za rukom — {error}.{' '}
            <button
              type="button"
              onClick={askAi}
              className="underline"
            >
              Probaj ponovo
            </button>
          </div>
        )}
        {explanation && (
          <div className="rounded-xl border border-primary/20 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-base">✨</span>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-dark">
                AI tutor
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/85">
              {renderInlineMarkdown(explanation)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/** Minimalan render-er — pretvori **bold** u <strong>, ostalo ostavi kao tekst. */
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = /\*\*([^*]+)\*\*/g
  let lastIdx = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index))
    }
    parts.push(
      <strong key={key++} className="font-bold text-primary-dark">
        {match[1]}
      </strong>,
    )
    lastIdx = match.index + match[0].length
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx))
  return parts
}
