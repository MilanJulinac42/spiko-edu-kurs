'use client'

import type { ExercisePayload } from '@spiko/shared'
import { MultipleChoiceBuilder, emptyMultipleChoice } from './MultipleChoiceBuilder'
import { FillBlankBuilder, emptyFillBlank } from './FillBlankBuilder'
import { MatchingBuilder, emptyMatching } from './MatchingBuilder'
import { OrderingBuilder, emptyOrdering } from './OrderingBuilder'
import { confirmDialog } from '../dialog'

type Type = ExercisePayload['type']

const TYPES: Array<{ type: Type; label: string; emoji: string; desc: string }> = [
  { type: 'multiple_choice', label: 'Multiple choice', emoji: '◉', desc: 'Jedan tačan odgovor od više ponuđenih.' },
  { type: 'fill_blank', label: 'Popuni prazninu', emoji: '✏', desc: 'Tekst sa prazninama koje student popunjava.' },
  { type: 'matching', label: 'Uparivanje', emoji: '↔', desc: 'Levi pojam povezuje sa pravim odgovorom desno.' },
  { type: 'ordering', label: 'Redosled', emoji: '↕', desc: 'Stavke poređaj u tačan redosled.' },
]

type Props = {
  value: ExercisePayload | null
  onChange: (v: ExercisePayload | null) => void
}

export function ExerciseBuilder({ value, onChange }: Props) {
  function pickType(t: Type) {
    if (t === 'multiple_choice') onChange({ type: t, data: emptyMultipleChoice() })
    else if (t === 'fill_blank') onChange({ type: t, data: emptyFillBlank() })
    else if (t === 'matching') onChange({ type: t, data: emptyMatching() })
    else if (t === 'ordering') onChange({ type: t, data: emptyOrdering() })
  }

  // Type picker
  if (!value) {
    return (
      <div className="col" style={{ gap: '0.75rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          Izaberi tip vežbe:
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.6rem',
          }}
        >
          {TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => pickType(t.type)}
              style={{
                textAlign: 'left',
                padding: '0.9rem',
                background: 'var(--panel-2)',
                border: '1px solid var(--border-2)',
                borderRadius: 10,
                cursor: 'pointer',
                color: 'var(--fg)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-2)'
                e.currentTarget.style.background = 'var(--panel-2)'
              }}
            >
              <div className="row" style={{ alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem', color: 'var(--accent-hover)' }}>{t.emoji}</span>
                <strong style={{ fontSize: '0.95rem' }}>{t.label}</strong>
              </div>
              <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                {t.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const current = TYPES.find((t) => t.type === value.type)

  return (
    <div className="col" style={{ gap: '0.75rem' }}>
      <div
        className="row between"
        style={{
          padding: '0.5rem 0.75rem',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 8,
        }}
      >
        <div>
          <span style={{ color: 'var(--accent-hover)', fontWeight: 700, marginRight: '0.4rem' }}>
            {current?.emoji}
          </span>
          <strong>{current?.label}</strong>
        </div>
        <button
          className="btn ghost"
          onClick={async () => {
            const ok = await confirmDialog({
              title: 'Promeniti tip vežbe?',
              message: 'Trenutni unos će biti izgubljen.',
              okLabel: 'Promeni tip',
              tone: 'danger',
            })
            if (ok) onChange(null)
          }}
          style={{ fontSize: '0.8rem' }}
        >
          Promeni tip
        </button>
      </div>

      {value.type === 'multiple_choice' && (
        <MultipleChoiceBuilder
          value={value.data}
          onChange={(data) => onChange({ type: 'multiple_choice', data })}
        />
      )}
      {value.type === 'fill_blank' && (
        <FillBlankBuilder
          value={value.data}
          onChange={(data) => onChange({ type: 'fill_blank', data })}
        />
      )}
      {value.type === 'matching' && (
        <MatchingBuilder
          value={value.data}
          onChange={(data) => onChange({ type: 'matching', data })}
        />
      )}
      {value.type === 'ordering' && (
        <OrderingBuilder
          value={value.data}
          onChange={(data) => onChange({ type: 'ordering', data })}
        />
      )}
    </div>
  )
}
