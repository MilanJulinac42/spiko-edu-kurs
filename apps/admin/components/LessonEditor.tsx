'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import type { Lesson } from '@/app/(panel)/courses/[id]/page'

type LessonType = 'video' | 'text' | 'exercise'

export function LessonEditor({
  moduleId,
  lesson,
  onClose,
  onSaved,
}: {
  moduleId: string
  lesson?: Lesson
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = !lesson
  const [title, setTitle] = useState(lesson?.title ?? '')
  const [type, setType] = useState<LessonType>((lesson?.type as LessonType) ?? 'text')
  const [status, setStatus] = useState<string>(lesson?.status ?? 'draft')
  const [textContent, setTextContent] = useState<string>('')
  const [videoId, setVideoId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const content =
        type === 'text' ? { body: textContent } :
        type === 'exercise' ? { body: 'Otvori Vežbe da konfigurišeš tačan tip pitanja.' } :
        null

      if (isNew) {
        const { error } = await api.admin.lessons.post({
          moduleId, title, type, status: status as 'draft' | 'published' | 'hidden',
          content: content ?? undefined,
          videoId: type === 'video' ? videoId || undefined : undefined,
        })
        if (error) throw new Error(String(error.value ?? error.status))
      } else {
        const { error } = await api.admin.lessons({ id: lesson!.id }).patch({
          title, type, status: status as 'draft' | 'published' | 'hidden',
          content: content ?? undefined,
          videoId: type === 'video' ? videoId || undefined : undefined,
        })
        if (error) throw new Error(String(error.value ?? error.status))
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'grid', placeItems: 'center', zIndex: 20,
      }}
    >
      <div className="panel" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 640 }}>
        <h2 style={{ marginTop: 0 }}>{isNew ? 'Nova lekcija' : 'Izmeni lekciju'}</h2>

        <div className="col">
          <label className="label">
            <span>Naslov</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>

          <div className="row">
            <label className="label" style={{ flex: 1 }}>
              <span>Tip</span>
              <select className="select" value={type} onChange={(e) => setType(e.target.value as LessonType)}>
                <option value="text">Tekst</option>
                <option value="video">Video (Bunny)</option>
                <option value="exercise">Vežba</option>
              </select>
            </label>
            <label className="label" style={{ flex: 1 }}>
              <span>Status</span>
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="hidden">hidden</option>
              </select>
            </label>
          </div>

          {type === 'text' && (
            <label className="label">
              <span>Sadržaj (markdown / plain text)</span>
              <textarea
                className="textarea"
                rows={10}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Napiši lekciju. Rich-text editor stiže u Fazi 2."
              />
            </label>
          )}

          {type === 'video' && (
            <div className="col" style={{ gap: '0.6rem' }}>
              <label className="label">
                <span>Bunny Video GUID</span>
                <input
                  className="input"
                  value={videoId}
                  onChange={(e) => setVideoId(e.target.value)}
                  placeholder="npr 73c11f64-3e34-4..."
                />
              </label>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', background: 'var(--panel-2)', padding: '0.75rem', borderRadius: 6 }}>
                <strong>Faza 2:</strong> direktan upload na Bunny sa progress barom. Trenutno
                — ručno unesi GUID iz Bunny dashboard-a. Webhook flag-uje <code>video_ready</code>.
              </div>
            </div>
          )}

          {type === 'exercise' && (
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', background: 'var(--panel-2)', padding: '0.75rem', borderRadius: 6 }}>
              <strong>Faza 3:</strong> exercise builderi po tipu (multiple choice, fill blank,
              matching, ordering). Za sad sačuvaj lekciju kao "exercise" placeholder i kasnije
              joj dodaj pitanja iz <strong>Vežbe</strong> ekrana.
            </div>
          )}

          {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}

          <div className="row" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button className="btn secondary" onClick={onClose}>Otkaži</button>
            <button className="btn" onClick={save} disabled={saving || !title.trim()}>
              {saving ? 'Snimam...' : 'Sačuvaj'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
