'use client'

import type { MultipleChoicePayload } from '@spiko/shared'

type Props = {
  value: MultipleChoicePayload
  onChange: (v: MultipleChoicePayload) => void
}

function rid() {
  return Math.random().toString(36).slice(2, 9)
}

export function MultipleChoiceBuilder({ value, onChange }: Props) {
  const v = value

  function updateOption(id: string, text: string) {
    onChange({
      ...v,
      options: v.options.map((o) => (o.id === id ? { ...o, text } : o)),
    })
  }
  function addOption() {
    const id = rid()
    onChange({
      ...v,
      options: [...v.options, { id, text: '' }],
      correctOptionId: v.correctOptionId || id,
    })
  }
  function removeOption(id: string) {
    if (v.options.length <= 2) return
    const next = v.options.filter((o) => o.id !== id)
    onChange({
      ...v,
      options: next,
      correctOptionId: v.correctOptionId === id ? next[0].id : v.correctOptionId,
    })
  }
  function setCorrect(id: string) {
    onChange({ ...v, correctOptionId: id })
  }

  return (
    <div className="col" style={{ gap: '1rem' }}>
      <label className="label">
        <span>Pitanje</span>
        <textarea
          className="textarea"
          rows={2}
          value={v.question}
          onChange={(e) => onChange({ ...v, question: e.target.value })}
          placeholder='npr. "Šta &quot;Wie heißt du?&quot; znači?"'
        />
      </label>

      <div>
        <div className="row between" style={{ marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Opcije ({v.options.length}) — klikni radio da označiš tačnu
          </span>
          <button className="btn ghost" onClick={addOption}>
            + Opcija
          </button>
        </div>
        <div className="col" style={{ gap: '0.5rem' }}>
          {v.options.map((opt, idx) => (
            <div
              key={opt.id}
              className="row"
              style={{
                gap: '0.6rem',
                padding: '0.6rem',
                background:
                  opt.id === v.correctOptionId ? 'rgba(34, 197, 94, 0.08)' : 'var(--panel-2)',
                border:
                  opt.id === v.correctOptionId
                    ? '1px solid rgba(34, 197, 94, 0.4)'
                    : '1px solid var(--border-2)',
                borderRadius: 8,
              }}
            >
              <input
                type="radio"
                checked={opt.id === v.correctOptionId}
                onChange={() => setCorrect(opt.id)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem', minWidth: 18 }}>
                {String.fromCharCode(65 + idx)}.
              </span>
              <input
                className="input"
                style={{ flex: 1 }}
                value={opt.text}
                onChange={(e) => updateOption(opt.id, e.target.value)}
                placeholder={`Opcija ${idx + 1}`}
              />
              {v.options.length > 2 && (
                <button
                  className="btn ghost"
                  onClick={() => removeOption(opt.id)}
                  style={{ color: 'var(--danger)' }}
                  title="Obriši opciju"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <label className="label">
        <span>Objašnjenje (opciono — pokazuje se posle odgovora)</span>
        <textarea
          className="textarea"
          rows={2}
          value={v.explanation ?? ''}
          onChange={(e) => onChange({ ...v, explanation: e.target.value })}
          placeholder="Zašto je ovaj odgovor tačan?"
        />
      </label>
    </div>
  )
}

export function emptyMultipleChoice(): MultipleChoicePayload {
  const a = rid()
  return {
    question: '',
    options: [
      { id: a, text: '' },
      { id: rid(), text: '' },
    ],
    correctOptionId: a,
  }
}
