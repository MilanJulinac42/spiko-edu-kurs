'use client'

import { useEffect, useRef, useState } from 'react'

type Data = {
  template: string
  blankCount: number
}

type Result = {
  details: unknown
}

const DE_CHARS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü']

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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const activeIdx = useRef<number>(0)

  useEffect(() => {
    onAnswers({ filled })
  }, [filled, onAnswers])

  const details = result?.details as
    | { perBlank?: Array<{ correct: boolean; expected: string }> }
    | undefined
  const perBlank = details?.perBlank ?? []

  const parts = payload.template.split('___')

  // Ubaci nemački znak na poziciju kursora u trenutno fokusiranom polju
  function insertChar(ch: string) {
    const idx = activeIdx.current
    const el = inputRefs.current[idx]
    if (!el) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? start
    const cur = el.value
    const next = cur.slice(0, start) + ch + cur.slice(end)
    setFilled((f) => {
      const n = [...f]
      n[idx] = next
      return n
    })
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + ch.length
      el.setSelectionRange(pos, pos)
    })
  }

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
                registerRef={(el) => {
                  inputRefs.current[i] = el
                }}
                onFocus={() => {
                  activeIdx.current = i
                }}
              />
            )}
          </span>
        ))}
      </p>

      {/* Traka za nemačke znakove — klik ubaci u polje na koje si zadnje kliknuo */}
      {!locked && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted">Nemačka slova:</span>
          {DE_CHARS.map((c) => (
            <button
              key={c}
              type="button"
              onMouseDown={(e) => e.preventDefault()} /* ne gubi fokus polja */
              onClick={() => insertChar(c)}
              className="grid h-8 min-w-[2rem] place-items-center rounded-lg border border-ink/15 bg-white px-1 font-semibold text-ink transition-colors hover:border-primary hover:bg-primary/5"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function BlankInput({
  value,
  onChange,
  index,
  locked,
  grade,
  registerRef,
  onFocus,
}: {
  value: string
  onChange: (v: string) => void
  index: number
  locked: boolean
  grade?: { correct: boolean; expected: string }
  registerRef: (el: HTMLInputElement | null) => void
  onFocus: () => void
}) {
  const isCorrect = locked && grade?.correct
  const isWrong = locked && grade?.correct === false

  return (
    <span className="inline-block align-baseline mx-1">
      <span className="relative inline-block">
        <input
          ref={registerRef}
          onFocus={onFocus}
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
