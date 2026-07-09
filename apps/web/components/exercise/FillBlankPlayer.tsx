'use client'

import { useEffect, useState } from 'react'

type Data = {
  template: string
  blankCount: number
}

type Result = {
  details: unknown
}

export function FillBlankPlayer({
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
  const [filled, setFilled] = useState<string[]>(() => Array(payload.blankCount).fill(''))

  useEffect(() => {
    onAnswers({ filled })
  }, [filled, onAnswers])

  const details = result?.details as
    | { perBlank?: Array<{ correct: boolean; expected: string }> }
    | undefined
  const perBlank = details?.perBlank ?? []

  const parts = payload.template.split('___')

  return (
    <div>
      <p className="text-lg leading-loose text-ink/85">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <BlankInput
                value={filled[i] ?? ''}
                onChange={(v) => {
                  const next = [...filled]
                  next[i] = v
                  setFilled(next)
                }}
                index={i}
                locked={locked}
                grade={perBlank[i]}
              />
            )}
          </span>
        ))}
      </p>
    </div>
  )
}

function BlankInput({
  value,
  onChange,
  index,
  locked,
  grade,
}: {
  value: string
  onChange: (v: string) => void
  index: number
  locked: boolean
  grade?: { correct: boolean; expected: string }
}) {
  const isCorrect = locked && grade?.correct
  const isWrong = locked && grade?.correct === false

  return (
    <span className="inline-block align-baseline mx-1">
      <span className="relative inline-block">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={locked}
          placeholder={`#${index + 1}`}
          className={`min-w-[6rem] rounded-md border-b-2 bg-transparent px-2 py-0.5 text-center font-semibold outline-none ${
            isCorrect
              ? 'border-primary text-primary-dark bg-primary/10'
              : isWrong
                ? 'border-red-400 text-red-700 bg-red-50'
                : 'border-ink/30 text-ink focus:border-primary'
          }`}
          style={{ width: `${Math.max(value.length, 6) + 2}ch` }}
        />
        {locked && (
          <span
            className={`absolute -right-1 -top-2 text-xs font-bold ${
              isCorrect ? 'text-primary-dark' : 'text-red-500'
            }`}
          >
            {isCorrect ? '✓' : '✗'}
          </span>
        )}
      </span>
      {locked && isWrong && grade && (
        <span className="ml-1 text-xs text-muted">
          (tačno: <strong className="text-primary-dark">{grade.expected}</strong>)
        </span>
      )}
    </span>
  )
}
