'use client'

import { useEffect, useState } from 'react'

type Data = {
  question: string
  options: Array<{ id: string; text: string }>
}

type Result = {
  isCorrect: boolean
  details: unknown
}

export function MultipleChoicePlayer({
  payload,
  onAnswers,
  locked,
  result,
}: {
  payload: Data
  onAnswers: (a: unknown) => void
  locked: boolean
  result: Result | null
}) {
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    onAnswers(selected ? { selectedOptionId: selected } : null)
  }, [selected, onAnswers])

  const correctId = (result?.details as { correctOptionId?: string } | undefined)?.correctOptionId
  const explanation = (result?.details as { explanation?: string } | undefined)?.explanation

  return (
    <div>
      <p className="font-display text-xl font-bold text-ink">{payload.question}</p>
      <div className="mt-5 grid gap-2">
        {payload.options.map((opt, idx) => {
          const isSelected = selected === opt.id
          const isCorrect = locked && correctId === opt.id
          const isWrongPick = locked && isSelected && correctId !== opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => !locked && setSelected(opt.id)}
              disabled={locked}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                isCorrect
                  ? 'border-primary bg-primary/10'
                  : isWrongPick
                    ? 'border-red-400 bg-red-50'
                    : isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-ink/10 bg-white hover:border-primary/40'
              } ${locked ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  isCorrect
                    ? 'bg-primary text-ink'
                    : isWrongPick
                      ? 'bg-red-500 text-white'
                      : isSelected
                        ? 'bg-primary/20 text-primary-dark'
                        : 'bg-ink/5 text-muted'
                }`}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1 text-ink/85">{opt.text}</span>
              {isCorrect && <span className="text-primary-dark font-bold">✓</span>}
              {isWrongPick && <span className="text-red-500 font-bold">✗</span>}
            </button>
          )
        })}
      </div>
      {locked && explanation && (
        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-ink/85">
          <strong className="text-primary-dark">Objašnjenje:</strong> {explanation}
        </div>
      )}
    </div>
  )
}
