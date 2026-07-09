'use client'

import { useEffect } from 'react'
import type { FillBlankPayload } from '@spiko/shared'

type Props = {
  value: FillBlankPayload
  onChange: (v: FillBlankPayload) => void
}

const BLANK_TOKEN = '___'

function countBlanks(template: string): number {
  return (template.match(/___/g) ?? []).length
}

export function FillBlankBuilder({ value, onChange }: Props) {
  const blanks = countBlanks(value.template)

  // sinhronizuj answers array sa brojem ___
  useEffect(() => {
    if (value.answers.length !== blanks) {
      const next = Array.from({ length: blanks }, (_, i) =>
        value.answers[i] ?? { accepted: [''], caseSensitive: false },
      )
      onChange({ ...value, answers: next })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blanks])

  function setAnswerText(idx: number, text: string) {
    // accepted = comma-separated lista varijanti
    const accepted = text.split(',').map((s) => s.trim()).filter(Boolean)
    const next = value.answers.map((a, i) => (i === idx ? { ...a, accepted } : a))
    onChange({ ...value, answers: next })
  }
  function setCase(cs: boolean) {
    onChange({
      ...value,
      answers: value.answers.map((a) => ({ ...a, caseSensitive: cs })),
    })
  }

  return (
    <div className="col" style={{ gap: '1rem' }}>
      <label className="label">
        <span>
          Template — ukucaj rečenice, a praznine označi sa{' '}
          <code style={{ background: 'var(--panel-2)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
            {BLANK_TOKEN}
          </code>
        </span>
        <textarea
          className="textarea"
          rows={4}
          value={value.template}
          onChange={(e) => onChange({ ...value, template: e.target.value })}
          placeholder={`npr. "Ich ___ Ana. Ich ___ aus Berlin."`}
        />
        <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
          Pronađeno praznina: <strong>{blanks}</strong>
        </span>
      </label>

      {blanks > 0 && (
        <div className="col" style={{ gap: '0.6rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Tačni odgovori — odvoj zarezom za alternative
          </span>
          {value.answers.map((a, idx) => (
            <div
              key={idx}
              className="row"
              style={{ gap: '0.6rem', alignItems: 'center' }}
            >
              <span
                style={{
                  width: 28,
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                }}
              >
                {idx + 1}
              </span>
              <input
                className="input"
                value={a.accepted.join(', ')}
                onChange={(e) => setAnswerText(idx, e.target.value)}
                placeholder={`Tačan odgovor, varijanta2, varijanta3...`}
              />
            </div>
          ))}
          <label className="row" style={{ gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={value.answers.some((a) => a.caseSensitive)}
              onChange={(e) => setCase(e.target.checked)}
            />
            <span style={{ fontSize: '0.85rem' }}>Razlikuj velika i mala slova</span>
          </label>
        </div>
      )}

      {/* Preview */}
      {blanks > 0 && (
        <div
          style={{
            padding: '0.85rem',
            background: 'rgba(99, 102, 241, 0.06)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 8,
          }}
        >
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
            PREGLED
          </p>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>
            {renderPreview(value.template)}
          </p>
        </div>
      )}

      <label className="label">
        <span>Objašnjenje (opciono)</span>
        <textarea
          className="textarea"
          rows={2}
          value={value.explanation ?? ''}
          onChange={(e) => onChange({ ...value, explanation: e.target.value })}
        />
      </label>
    </div>
  )
}

function renderPreview(template: string) {
  const parts = template.split(BLANK_TOKEN)
  return parts.map((p, i) => (
    <span key={i}>
      {p}
      {i < parts.length - 1 && (
        <span
          style={{
            display: 'inline-block',
            minWidth: 60,
            padding: '0.05rem 0.5rem',
            margin: '0 0.2rem',
            background: 'var(--panel-2)',
            border: '1px dashed var(--border-2)',
            borderRadius: 4,
            color: 'var(--muted)',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
          }}
        >
          {i + 1}
        </span>
      )}
    </span>
  ))
}

export function emptyFillBlank(): FillBlankPayload {
  return {
    template: '',
    answers: [],
  }
}
