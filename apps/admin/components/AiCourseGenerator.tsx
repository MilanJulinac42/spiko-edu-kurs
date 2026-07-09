'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/api'
import { toast } from './toast'

type BlockType = 'video' | 'text' | 'exercises' | 'audio'
type Lesson = { title: string; types: BlockType[] }
type Module = { title: string; lessons: Lesson[] }
type Structure = {
  course: {
    title: string
    description: string
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
    language: string
  }
  modules: Module[]
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const TYPES: BlockType[] = ['video', 'text', 'exercises', 'audio']
const TYPE_META: Record<BlockType, { label: string; short: string; bg: string; fg: string; border: string }> = {
  video: { label: '📺 Video', short: '📺', bg: 'var(--accent-soft)', fg: 'var(--accent-dark)', border: 'var(--accent)' },
  text: { label: '📝 Tekst', short: '📝', bg: 'var(--primary-soft)', fg: 'var(--primary-dark)', border: 'var(--primary)' },
  exercises: { label: '✎ Vežbe', short: '✎', bg: 'var(--warning-soft)', fg: 'var(--warning)', border: 'var(--warning)' },
  audio: { label: '🎙 Audio', short: '🎙', bg: '#dbeaf6', fg: '#1e4d7a', border: '#3e8fd0' },
}

const EXAMPLES = [
  'Nemački A1 za potpune početnike — 5 modula, dijalozi iz svakodnevnog života',
  'Italijanski B1 sa fokusom na restoran i putovanje, 4 modula',
  'Poslovni engleski C1 — pregovori, emailovi, prezentacije',
  'Španski A2 sa naglaskom na slušanje i izgovor — kratki kurs od 3 modula',
]

/**
 * Modal sa 3 stanja:
 *  1. PROMPT — admin kuca želju za kurs + (opciono) example chips
 *  2. PREVIEW — AI generisana struktura, admin može da edituje sve
 *  3. CREATING — kreira u bazi, redirect kad gotovo
 */
export function AiCourseGenerator({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [phase, setPhase] = useState<'prompt' | 'preview' | 'creating'>('prompt')
  const [prompt, setPrompt] = useState('')
  const [structure, setStructure] = useState<Structure | null>(null)
  const [generating, setGenerating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    if (!prompt.trim()) return
    setGenerating(true)
    setError(null)
    try {
      const { data, error: apiError } = await api.admin.ai['generate-course'].post({
        prompt: prompt.trim(),
      })
      if (apiError) throw new Error(String((apiError as { value?: unknown }).value ?? apiError.status))
      setStructure(data as Structure)
      setPhase('preview')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Greška'
      setError(msg)
      toast.error('AI generisanje nije uspelo', { description: msg })
    } finally {
      setGenerating(false)
    }
  }

  async function createCourse() {
    if (!structure) return
    setCreating(true)
    setPhase('creating')
    try {
      const { data, error: apiError } = await api.admin.ai['create-from-structure'].post(
        structure,
      )
      if (apiError) throw new Error(String((apiError as { value?: unknown }).value ?? apiError.status))
      const r = data as { courseId: string; lessonCount: number; moduleCount: number }
      toast.success(
        `Kurs napravljen — ${r.moduleCount} modula, ${r.lessonCount} lekcija`,
      )
      onClose()
      router.push(`/courses/${r.courseId}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Greška'
      setError(msg)
      toast.error('Kreiranje nije uspelo', { description: msg })
      setPhase('preview')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26, 39, 56, 0.35)',
        backdropFilter: 'blur(3px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 100,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 760,
          maxHeight: 'calc(100dvh - 2rem)',
          background: 'var(--surface)',
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-lift)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.1rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              'linear-gradient(135deg, var(--primary-soft) 0%, var(--accent-soft) 100%)',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--primary-dark)',
              }}
            >
              ✨ AI generator
            </p>
            <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.15rem' }}>
              {phase === 'prompt' && 'Opiši kurs koji želiš'}
              {phase === 'preview' && 'Pregled — izmeni šta želiš pre kreiranja'}
              {phase === 'creating' && 'Pravim kurs…'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 0,
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--ink-soft)',
              padding: '0 0.5rem',
              lineHeight: 1,
            }}
            aria-label="Zatvori"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {phase === 'prompt' && (
            <div className="col" style={{ gap: '1rem' }}>
              <div>
                <label
                  className="label"
                  style={{ marginBottom: '0.4rem', display: 'block', fontSize: '0.82rem' }}
                >
                  Opiši kurs koji želiš
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="textarea"
                  placeholder="npr. Nemački A1 za potpune početnike — 5 modula, dijalozi iz svakodnevnog života i osnovna gramatika"
                  rows={5}
                  autoFocus
                  style={{ resize: 'vertical', minHeight: 100, fontSize: '0.95rem' }}
                />
                <p
                  style={{
                    margin: '0.5rem 0 0',
                    fontSize: '0.78rem',
                    color: 'var(--ink-soft)',
                  }}
                >
                  AI generiše samo <strong>strukturu</strong> (kurs + moduli + lekcije sa naslovima i tipovima).
                  Sadržaj svake lekcije (video, tekst, vežbe) ćeš dodati ručno posle.
                </p>
              </div>

              <div>
                <p
                  style={{
                    margin: '0 0 0.5rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--muted)',
                  }}
                >
                  Brzi primeri
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setPrompt(ex)}
                      style={{
                        textAlign: 'left',
                        padding: '0.6rem 0.85rem',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        color: 'var(--ink-soft)',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--primary-soft)'
                        e.currentTarget.style.borderColor = 'var(--primary)'
                        e.currentTarget.style.color = 'var(--primary-dark)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--surface-2)'
                        e.currentTarget.style.borderColor = 'var(--border)'
                        e.currentTarget.style.color = 'var(--ink-soft)'
                      }}
                    >
                      “{ex}”
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: '0.7rem 0.9rem',
                    background: 'var(--danger-soft)',
                    color: 'var(--danger)',
                    borderRadius: 8,
                    fontSize: '0.85rem',
                  }}
                >
                  {error}
                </div>
              )}
            </div>
          )}

          {phase === 'preview' && structure && (
            <StructureEditor structure={structure} onChange={setStructure} />
          )}

          {phase === 'creating' && (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'var(--ink-soft)',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  margin: '0 auto 1rem',
                  border: '4px solid var(--border-2)',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  animation: 'aiCourseSpin 0.7s linear infinite',
                }}
              />
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--ink)' }}>
                Kreiram kurs, module i lekcije u bazi…
              </p>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem' }}>
                Trenutak. Posle ovog ide redirect na pregled kursa.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: '0.9rem 1.5rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--surface)',
          }}
        >
          {phase === 'prompt' && (
            <>
              <button className="btn secondary" onClick={onClose}>
                Otkaži
              </button>
              <button
                className="btn"
                onClick={generate}
                disabled={generating || !prompt.trim()}
              >
                {generating ? '✨ Generišem…' : '✨ Generiši strukturu'}
              </button>
            </>
          )}
          {phase === 'preview' && structure && (
            <>
              <button className="btn secondary" onClick={() => setPhase('prompt')}>
                ← Promeni opis
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
                  {structure.modules.length} modula ·{' '}
                  {structure.modules.reduce((s, m) => s + m.lessons.length, 0)} lekcija
                </span>
                <button className="btn" onClick={createCourse} disabled={creating}>
                  ✓ Kreiraj kurs
                </button>
              </div>
            </>
          )}
          {phase === 'creating' && (
            <button className="btn secondary" disabled style={{ marginLeft: 'auto' }}>
              Sačekaj…
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes aiCourseSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

/* ───────── Preview editor ───────── */

function StructureEditor({
  structure,
  onChange,
}: {
  structure: Structure
  onChange: (s: Structure) => void
}) {
  function updateCourse<K extends keyof Structure['course']>(
    key: K,
    value: Structure['course'][K],
  ) {
    onChange({ ...structure, course: { ...structure.course, [key]: value } })
  }
  function updateModule(mIdx: number, patch: Partial<Module>) {
    const next = structure.modules.map((m, i) => (i === mIdx ? { ...m, ...patch } : m))
    onChange({ ...structure, modules: next })
  }
  function updateLesson(mIdx: number, lIdx: number, patch: Partial<Lesson>) {
    const next = structure.modules.map((m, i) => {
      if (i !== mIdx) return m
      return {
        ...m,
        lessons: m.lessons.map((l, j) => (j === lIdx ? { ...l, ...patch } : l)),
      }
    })
    onChange({ ...structure, modules: next })
  }
  function deleteLesson(mIdx: number, lIdx: number) {
    const next = structure.modules.map((m, i) => {
      if (i !== mIdx) return m
      return { ...m, lessons: m.lessons.filter((_, j) => j !== lIdx) }
    })
    onChange({ ...structure, modules: next })
  }
  function deleteModule(mIdx: number) {
    onChange({ ...structure, modules: structure.modules.filter((_, i) => i !== mIdx) })
  }
  function addLesson(mIdx: number) {
    const next = structure.modules.map((m, i) => {
      if (i !== mIdx) return m
      return {
        ...m,
        lessons: [...m.lessons, { title: 'Nova lekcija', types: ['text' as const] }],
      }
    })
    onChange({ ...structure, modules: next })
  }

  function toggleLessonType(mIdx: number, lIdx: number, type: BlockType) {
    const next = structure.modules.map((m, i) => {
      if (i !== mIdx) return m
      return {
        ...m,
        lessons: m.lessons.map((l, j) => {
          if (j !== lIdx) return l
          const has = l.types.includes(type)
          // Ne dopuštaj prazan niz — bar jedan tip mora ostati
          if (has && l.types.length === 1) return l
          return {
            ...l,
            types: has ? l.types.filter((t) => t !== type) : [...l.types, type],
          }
        }),
      }
    })
    onChange({ ...structure, modules: next })
  }
  function addModule() {
    onChange({
      ...structure,
      modules: [...structure.modules, { title: 'Novi modul', lessons: [] }],
    })
  }

  return (
    <div className="col" style={{ gap: '1rem' }}>
      {/* Course header */}
      <div
        style={{
          padding: '0.9rem 1rem',
          background: 'var(--surface-2)',
          borderRadius: 10,
          border: '1px solid var(--border)',
        }}
      >
        <input
          value={structure.course.title}
          onChange={(e) => updateCourse('title', e.target.value)}
          className="input"
          style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}
          placeholder="Naslov kursa"
        />
        <textarea
          value={structure.course.description}
          onChange={(e) => updateCourse('description', e.target.value)}
          className="textarea"
          rows={2}
          placeholder="Kratak opis…"
          style={{ resize: 'vertical', fontSize: '0.88rem' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <select
            value={structure.course.level}
            onChange={(e) => updateCourse('level', e.target.value as Structure['course']['level'])}
            className="select"
            style={{ width: 100 }}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <input
            value={structure.course.language}
            onChange={(e) => updateCourse('language', e.target.value.toLowerCase())}
            className="input"
            style={{ width: 80 }}
            maxLength={5}
            placeholder="de"
          />
        </div>
      </div>

      {/* Modules */}
      {structure.modules.map((mod, mIdx) => (
        <div
          key={mIdx}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'var(--surface)',
          }}
        >
          <div
            style={{
              padding: '0.7rem 0.9rem',
              background:
                'linear-gradient(135deg, var(--primary-soft) 0%, transparent 70%)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <span
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 28,
                height: 28,
                background: 'var(--surface)',
                color: 'var(--primary-dark)',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 800,
                boxShadow: 'var(--shadow-soft)',
                flexShrink: 0,
              }}
            >
              {mIdx + 1}
            </span>
            <input
              value={mod.title}
              onChange={(e) => updateModule(mIdx, { title: e.target.value })}
              className="input"
              style={{ flex: 1, fontWeight: 600 }}
              placeholder="Naziv modula"
            />
            <button
              className="btn ghost"
              onClick={() => deleteModule(mIdx)}
              title="Obriši modul"
              style={{ color: 'var(--danger)' }}
            >
              ×
            </button>
          </div>

          <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
            {mod.lessons.map((l, lIdx) => (
              <div
                key={lIdx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  padding: '0.5rem',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                }}
              >
                {/* Red 1: broj, naslov, delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'var(--surface)',
                      borderRadius: 6,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--muted)',
                      flexShrink: 0,
                    }}
                  >
                    {lIdx + 1}
                  </span>
                  <input
                    value={l.title}
                    onChange={(e) => updateLesson(mIdx, lIdx, { title: e.target.value })}
                    className="input"
                    style={{ flex: 1, fontSize: '0.88rem', background: 'var(--surface)' }}
                    placeholder="Naziv lekcije"
                  />
                  <button
                    className="btn ghost"
                    onClick={() => deleteLesson(mIdx, lIdx)}
                    title="Obriši lekciju"
                    style={{ color: 'var(--danger)', padding: '0.2rem 0.4rem' }}
                  >
                    ×
                  </button>
                </div>

                {/* Red 2: type chips — multi-select */}
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', paddingLeft: 30 }}>
                  {TYPES.map((t) => {
                    const active = l.types.includes(t)
                    const meta = TYPE_META[t]
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleLessonType(mIdx, lIdx, t)}
                        title={active ? `Skloni ${meta.label}` : `Dodaj ${meta.label}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '0.25rem 0.6rem',
                          borderRadius: 999,
                          border: '1px solid',
                          borderColor: active ? meta.border : 'var(--border-2)',
                          background: active ? meta.bg : 'var(--surface)',
                          color: active ? meta.fg : 'var(--muted)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all 0.12s',
                        }}
                      >
                        {meta.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addLesson(mIdx)}
              style={{
                marginTop: '0.4rem',
                width: '100%',
                padding: '0.5rem',
                background: 'transparent',
                border: '1.5px dashed var(--border-2)',
                borderRadius: 8,
                color: 'var(--ink-soft)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)'
                e.currentTarget.style.color = 'var(--primary-dark)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-2)'
                e.currentTarget.style.color = 'var(--ink-soft)'
              }}
            >
              + Dodaj lekciju
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addModule}
        style={{
          padding: '0.75rem',
          background: 'transparent',
          border: '1.5px dashed var(--border-2)',
          borderRadius: 12,
          color: 'var(--ink-soft)',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--primary)'
          e.currentTarget.style.color = 'var(--primary-dark)'
          e.currentTarget.style.background = 'var(--primary-soft)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-2)'
          e.currentTarget.style.color = 'var(--ink-soft)'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        + Dodaj modul
      </button>
    </div>
  )
}
