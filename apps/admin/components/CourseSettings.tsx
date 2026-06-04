'use client'

import { useState } from 'react'
import { CEFR } from '@spiko/shared'
import { api } from '@/lib/api'
import type { Course } from '@/app/(panel)/courses/[id]/page'

export function CourseSettings({ course, reload }: { course: Course; reload: () => void }) {
  const [title, setTitle] = useState(course.title)
  const [slug, setSlug] = useState(course.slug)
  const [description, setDescription] = useState(course.description ?? '')
  const [level, setLevel] = useState(course.level ?? 'A1')
  const [language, setLanguage] = useState(course.language ?? 'en')
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnailUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  async function save() {
    setSaving(true)
    await api.admin.courses({ id: course.id }).patch({
      title, slug, description, level, language,
      thumbnailUrl: thumbnailUrl || undefined,
    })
    await reload()
    setSavedAt(Date.now())
    setSaving(false)
  }

  return (
    <div className="panel" style={{ maxWidth: 720 }}>
      <h2 style={{ marginTop: 0 }}>Podešavanja kursa</h2>
      <div className="col">
        <label className="label">
          <span>Naslov</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="label">
          <span>Slug</span>
          <input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </label>
        <label className="label">
          <span>Opis</span>
          <textarea className="textarea" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="row">
          <label className="label" style={{ flex: 1 }}>
            <span>CEFR nivo</span>
            <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
              {CEFR.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label className="label" style={{ flex: 1 }}>
            <span>Jezik (ISO)</span>
            <input className="input" value={language} onChange={(e) => setLanguage(e.target.value)} />
          </label>
        </div>
        <label className="label">
          <span>Thumbnail URL</span>
          <input className="input" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://..." />
        </label>
        <div className="row" style={{ justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem' }}>
          {savedAt && <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>Sačuvano</span>}
          <button className="btn" onClick={save} disabled={saving}>{saving ? 'Snimam...' : 'Sačuvaj'}</button>
        </div>
      </div>
    </div>
  )
}
