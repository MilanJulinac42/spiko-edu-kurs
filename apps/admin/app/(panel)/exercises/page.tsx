'use client'

import { useEffect, useState } from 'react'
import type { ExercisePayload } from '@spiko/shared'
import { api } from '@/lib/api'
import { ExerciseBuilder } from '@/components/exercise/ExerciseBuilder'
import { EmptyState, EmptyIconClipboard } from '@/components/EmptyState'
import { confirmDialog } from '@/components/dialog'
import { toast } from '@/components/toast'
import { ExerciseGridSkeleton } from '@/components/Skeleton'

type Template = {
  id: string
  title: string
  type: string
  payload: ExercisePayload
}

type EditState = {
  id?: string
  title: string
  payload: ExercisePayload | null
}

type TypeMeta = {
  label: string
  emoji: string
  cls: string
  bg: string
  fg: string
  rail: string
}

const TYPE_LABEL: Record<string, TypeMeta> = {
  multiple_choice: {
    label: 'Multiple choice',
    emoji: '◉',
    cls: 'mc',
    bg: 'var(--primary-soft)',
    fg: 'var(--primary-dark)',
    rail: 'var(--primary)',
  },
  fill_blank: {
    label: 'Popuni prazninu',
    emoji: '✏',
    cls: 'fb',
    bg: 'var(--accent-soft)',
    fg: 'var(--accent-dark)',
    rail: 'var(--accent)',
  },
  matching: {
    label: 'Uparivanje',
    emoji: '↔',
    cls: 'mt',
    bg: 'var(--warning-soft)',
    fg: 'var(--warning)',
    rail: 'var(--warning)',
  },
  ordering: {
    label: 'Redosled',
    emoji: '↕',
    cls: 'or',
    bg: '#ede4f7',
    fg: '#6a3fa0',
    rail: '#8b5cd6',
  },
}

export default function ExercisesPage() {
  const [list, setList] = useState<Template[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [editing, setEditing] = useState<EditState | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await api.admin.exercises.templates.get({
      query: { type: filter === 'all' ? undefined : filter },
    })
    if (Array.isArray(data)) setList(data as Template[])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function remove(id: string, templateTitle: string) {
    const ok = await confirmDialog({
      title: `Obriši template "${templateTitle}"?`,
      message:
        'Lekcije koje su ovaj template ranije ubacile ostaju nepogođene — svaka ima svoju kopiju.',
      okLabel: 'Obriši template',
      tone: 'danger',
    })
    if (!ok) return
    try {
      await api.admin.exercises({ id }).delete()
      await load()
      toast.success(`Template "${templateTitle}" obrisan`)
    } catch (e) {
      toast.error('Neuspelo brisanje', {
        description: e instanceof Error ? e.message : String(e),
      })
    }
  }

  function add() {
    setEditing({ title: '', payload: null })
  }

  function edit(tpl: Template) {
    setEditing({ id: tpl.id, title: tpl.title, payload: tpl.payload })
  }

  async function duplicate(tpl: Template) {
    try {
      await api.admin.exercises.templates.post({
        title: `${tpl.title} (kopija)`,
        type: tpl.type as 'multiple_choice' | 'fill_blank' | 'matching' | 'ordering',
        payload: tpl.payload,
      })
      await load()
      toast.success('Template dupliran', { description: `${tpl.title} (kopija)` })
    } catch (e) {
      toast.error('Neuspelo dupliranje', {
        description: e instanceof Error ? e.message : String(e),
      })
    }
  }

  const filtered = list

  return (
    <div>
      <div className="row between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Biblioteka vežbi</h1>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Pravi template-e jednom — ubacuj ih u kurseve u par klikova. Svaka kopija u
            lekciji se nezavisno menja.
          </p>
        </div>
        <button className="btn" onClick={add}>+ Novi template</button>
      </div>

      <div className="row" style={{ marginBottom: '1rem', gap: '0.4rem', flexWrap: 'wrap' }}>
        <FilterPill
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          Sve ({list.length})
        </FilterPill>
        {Object.entries(TYPE_LABEL).map(([type, info]) => (
          <FilterPill
            key={type}
            active={filter === type}
            onClick={() => setFilter(type)}
            tone={info}
          >
            {info.emoji} {info.label}
          </FilterPill>
        ))}
      </div>

      {editing && (
        <TemplateEditorModal
          state={editing}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await load()
          }}
        />
      )}

      {loading ? (
        <ExerciseGridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <EmptyState
            icon={<EmptyIconClipboard />}
            title="Nema template-a"
            description="Napravi prvi template — multiple choice, popunjavanje praznine, uparivanje ili redosled. Posle ga koristiš u bilo kojoj lekciji."
            cta={
              <button className="btn" onClick={add}>+ Napravi prvi</button>
            }
          />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '0.75rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {filtered.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              tpl={tpl}
              onEdit={() => edit(tpl)}
              onDelete={() => remove(tpl.id, tpl.title)}
              onDuplicate={() => duplicate(tpl)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  children,
  tone,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  tone?: { bg: string; fg: string; rail: string }
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? (tone?.bg ?? 'var(--primary-soft)') : 'transparent',
        color: active ? (tone?.fg ?? 'var(--primary-dark)') : 'var(--ink-soft)',
        border: '1px solid',
        borderColor: active ? (tone?.rail ?? 'var(--primary)') : 'var(--border-2)',
        padding: '0.45rem 0.9rem',
        borderRadius: 999,
        fontSize: '0.85rem',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function TemplateCard({
  tpl,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  tpl: Template
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const info: TypeMeta = TYPE_LABEL[tpl.type] ?? {
    label: tpl.type,
    emoji: '•',
    cls: '',
    bg: 'var(--surface-2)',
    fg: 'var(--ink-soft)',
    rail: 'var(--border-2)',
  }
  const preview = previewText(tpl.payload)

  return (
    <article
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '1.1rem 1.15rem 1rem',
        paddingLeft: 'calc(1.15rem + 4px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        minHeight: 180,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-soft)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow-soft)'
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: info.rail,
        }}
      />
      <div className="row between">
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: info.bg,
            color: info.fg,
            padding: '0.25rem 0.65rem',
            borderRadius: 999,
            fontSize: '0.68rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {info.emoji} {info.label}
        </span>
      </div>

      <div>
        <h3
          style={{
            margin: 0,
            fontSize: '1rem',
            color: 'var(--fg)',
            lineHeight: 1.3,
          }}
        >
          {tpl.title}
        </h3>
        {preview && (
          <p
            style={{
              margin: '0.5rem 0 0',
              color: 'var(--muted)',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {preview}
          </p>
        )}
      </div>

      <div className="row" style={{ marginTop: 'auto', gap: '0.35rem' }}>
        <button className="btn secondary" onClick={onEdit} style={{ flex: 1 }}>
          Uredi
        </button>
        <button className="btn ghost" onClick={onDuplicate} title="Dupliraj">
          ⎘
        </button>
        <button className="btn ghost" onClick={onDelete} title="Obriši" style={{ color: 'var(--danger)' }}>
          ×
        </button>
      </div>
    </article>
  )
}

function previewText(payload: ExercisePayload): string {
  if (payload.type === 'multiple_choice') return payload.data.question || ''
  if (payload.type === 'fill_blank') return payload.data.template || ''
  if (payload.type === 'matching') {
    return payload.data.question || `${payload.data.left?.length ?? 0} parova`
  }
  if (payload.type === 'ordering') {
    return payload.data.question || `${payload.data.items?.length ?? 0} stavki`
  }
  return ''
}

/* ───────── modal ───────── */

function TemplateEditorModal({
  state,
  onChange,
  onClose,
  onSaved,
}: {
  state: EditState
  onChange: (s: EditState) => void
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!state.payload) {
      setError('Konfiguriši tip vežbe pre čuvanja.')
      return
    }
    if (!state.title.trim()) {
      setError('Naslov template-a je obavezan.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (state.id) {
        const { error } = await api.admin.exercises({ id: state.id }).patch({
          title: state.title,
          type: state.payload.type,
          payload: state.payload,
        })
        if (error) throw new Error(String(error.value ?? error.status))
        toast.success('Template ažuriran', { description: state.title })
      } else {
        const { error } = await api.admin.exercises.templates.post({
          title: state.title,
          type: state.payload.type,
          payload: state.payload,
        })
        if (error) throw new Error(String(error.value ?? error.status))
        toast.success('Template napravljen', { description: state.title })
      }
      onSaved()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Greška'
      setError(msg)
      toast.error('Neuspelo čuvanje template-a', { description: msg })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'grid', placeItems: 'center', zIndex: 20, padding: '0.5rem',
      }}
    >
      <div
        className="panel"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 720, maxHeight: 'calc(100dvh - 1rem)', overflowY: 'auto' }}
      >
        <h2 style={{ marginTop: 0 }}>
          {state.id ? 'Izmeni template' : 'Novi template'}
        </h2>

        <div className="col" style={{ gap: '1rem' }}>
          <label className="label">
            <span>Naslov template-a (interno)</span>
            <input
              className="input"
              value={state.title}
              onChange={(e) => onChange({ ...state, title: e.target.value })}
              placeholder="npr. Pozdravi A1 — Wie heißt du?"
            />
          </label>

          <ExerciseBuilder
            value={state.payload}
            onChange={(p) => onChange({ ...state, payload: p })}
          />

          {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</div>}

          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn secondary" onClick={onClose}>Otkaži</button>
            <button
              className="btn"
              onClick={save}
              disabled={saving || !state.title.trim() || !state.payload}
            >
              {saving ? 'Snimam…' : 'Sačuvaj template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
