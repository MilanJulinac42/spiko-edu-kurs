'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CEFR } from '@spiko/shared'
import { api } from '@/lib/api'
import { EmptyState, EmptyIconBook } from '@/components/EmptyState'
import { toast } from '@/components/toast'
import { TableSkeleton } from '@/components/Skeleton'
import { AiCourseGenerator } from '@/components/AiCourseGenerator'
import { statusLabel } from '@/lib/status'

type Course = {
  id: string
  title: string
  slug: string
  level: string | null
  language: string | null
  status: string
  position: number
}

export default function CoursesPage() {
  const [list, setList] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [showAi, setShowAi] = useState(false)

  async function reload() {
    const { data } = await api.admin.courses.get()
    if (Array.isArray(data)) setList(data as Course[])
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  return (
    <div>
      <div className="row between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Kursevi</h1>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className="btn secondary"
            onClick={() => setShowAi(true)}
            title="AI generiše strukturu kursa iz kratkog opisa"
          >
            ✨ Generiši sa AI
          </button>
          <button className="btn" onClick={() => setShowNew(true)}>+ Novi kurs</button>
        </div>
      </div>

      {showNew && <NewCourseModal onClose={() => setShowNew(false)} onCreated={reload} />}
      {showAi && <AiCourseGenerator onClose={() => setShowAi(false)} />}

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="table-wrap">
            <TableSkeleton headers={['Naslov', 'Nivo', 'Jezik', 'Status', '']} rows={5} />
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<EmptyIconBook />}
            title="Nema kurseva"
            description="Napravi prvi kurs — sa AI za 30 sekundi, ili ručno korak po korak."
            cta={
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="btn" onClick={() => setShowAi(true)}>
                  ✨ Generiši sa AI
                </button>
                <button className="btn secondary" onClick={() => setShowNew(true)}>
                  + Ručno
                </button>
              </div>
            }
          />
        ) : (
          <div className="table-wrap"><table>
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Naslov</th>
                <th>Nivo</th>
                <th>Jezik</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/courses/${c.id}`} className="cell-title">{c.title}</Link>
                    <span className="cell-sub">/{c.slug}</span>
                  </td>
                  <td>{c.level ?? '—'}</td>
                  <td>{c.language ?? '—'}</td>
                  <td><span className={`status-badge ${c.status}`}>{statusLabel(c.status)}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/courses/${c.id}`} className="btn ghost">Uredi →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  )
}

function NewCourseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [level, setLevel] = useState<string>('A1')
  const [language, setLanguage] = useState('en')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function slugify(s: string) {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { error } = await api.admin.courses.post({
        title,
        slug: slug || slugify(title),
        description: description || undefined,
        level,
        language,
        status: 'draft',
      })
      if (error) throw new Error(String(error.value ?? error.status))
      toast.success('Kurs napravljen', { description: title })
      onCreated()
      onClose()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Greška'
      setError(msg)
      toast.error('Neuspelo kreiranje kursa', { description: msg })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'grid', placeItems: 'center', zIndex: 10,
        padding: '0.5rem',
      }}
    >
      <div className="panel" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: 'calc(100dvh - 1rem)', overflowY: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>Novi kurs</h2>
        <form onSubmit={submit} className="col">
          <label className="label">
            <span>Naslov</span>
            <input className="input" value={title} onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(slugify(e.target.value)) }} required />
          </label>
          <label className="label">
            <span>Slug (URL deo)</span>
            <input className="input" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="auto iz naslova" />
          </label>
          <label className="label">
            <span>Opis</span>
            <textarea className="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="row" style={{ gap: '0.75rem' }}>
            <label className="label" style={{ flex: 1 }}>
              <span>CEFR nivo</span>
              <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
                {CEFR.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
            <label className="label" style={{ flex: 1 }}>
              <span>Jezik (ISO)</span>
              <input className="input" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en" />
            </label>
          </div>
          {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn secondary" onClick={onClose}>Otkaži</button>
            <button type="submit" className="btn" disabled={saving}>{saving ? 'Snimam...' : 'Napravi'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
