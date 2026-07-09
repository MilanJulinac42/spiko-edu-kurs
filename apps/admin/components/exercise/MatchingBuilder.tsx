'use client'

import type { MatchingPayload } from '@spiko/shared'

type Props = {
  value: MatchingPayload
  onChange: (v: MatchingPayload) => void
}

function rid() {
  return Math.random().toString(36).slice(2, 9)
}

export function MatchingBuilder({ value, onChange }: Props) {
  function addPair() {
    const lid = rid()
    const rrid = rid()
    onChange({
      ...value,
      left: [...value.left, { id: lid, text: '' }],
      right: [...value.right, { id: rrid, text: '' }],
      pairs: { ...value.pairs, [lid]: rrid },
    })
  }
  function removePair(lid: string) {
    const rrid = value.pairs[lid]
    const nextPairs = { ...value.pairs }
    delete nextPairs[lid]
    onChange({
      ...value,
      left: value.left.filter((l) => l.id !== lid),
      right: value.right.filter((r) => r.id !== rrid),
      pairs: nextPairs,
    })
  }
  function updateLeft(id: string, text: string) {
    onChange({
      ...value,
      left: value.left.map((l) => (l.id === id ? { ...l, text } : l)),
    })
  }
  function updateRight(id: string, text: string) {
    onChange({
      ...value,
      right: value.right.map((r) => (r.id === id ? { ...r, text } : r)),
    })
  }

  return (
    <div className="col" style={{ gap: '1rem' }}>
      <label className="label">
        <span>Pitanje / instrukcija (opciono)</span>
        <input
          className="input"
          value={value.question ?? ''}
          onChange={(e) => onChange({ ...value, question: e.target.value })}
          placeholder='npr. "Uparite nemačke reči sa prevodom"'
        />
      </label>

      <div>
        <div className="row between" style={{ marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Parovi ({value.left.length}) — levi se uparuje sa pravim odgovorom desno
          </span>
          <button className="btn ghost" onClick={addPair}>
            + Par
          </button>
        </div>

        <div
          className="col"
          style={{
            gap: '0.5rem',
            background: 'var(--panel-2)',
            padding: '0.6rem',
            borderRadius: 8,
            border: '1px solid var(--border-2)',
          }}
        >
          {value.left.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem' }}>
              Nema parova. Klikni &quot;+ Par&quot; da dodaš prvi.
            </p>
          )}
          {value.left.map((l, idx) => {
            const r = value.right.find((x) => x.id === value.pairs[l.id])
            return (
              <div key={l.id} className="row" style={{ gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ width: 22, textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>
                  {idx + 1}
                </span>
                <input
                  className="input"
                  style={{ flex: 1 }}
                  value={l.text}
                  onChange={(e) => updateLeft(l.id, e.target.value)}
                  placeholder="Levo (npr. Hund)"
                />
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>↔</span>
                <input
                  className="input"
                  style={{ flex: 1 }}
                  value={r?.text ?? ''}
                  onChange={(e) => r && updateRight(r.id, e.target.value)}
                  placeholder="Desno (npr. Pas)"
                />
                <button
                  className="btn ghost"
                  onClick={() => removePair(l.id)}
                  style={{ color: 'var(--danger)' }}
                  title="Obriši par"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
          💡 Studentu se desna kolona prikazuje izmešana — pravi par mora sam da konstruiše.
        </p>
      </div>
    </div>
  )
}

export function emptyMatching(): MatchingPayload {
  return { left: [], right: [], pairs: {} }
}
