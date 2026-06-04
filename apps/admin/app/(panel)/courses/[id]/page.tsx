'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { CourseBuilder } from '@/components/CourseBuilder'
import { CourseSettings } from '@/components/CourseSettings'

export type Lesson = {
  id: string
  title: string
  type: 'video' | 'text' | 'exercise'
  status: string
  position: number
  videoReady?: boolean
}

export type Module = {
  id: string
  title: string
  position: number
  lessons: Lesson[]
}

export type Course = {
  id: string
  title: string
  slug: string
  description: string | null
  level: string | null
  language: string | null
  status: 'draft' | 'published' | 'hidden'
  thumbnailUrl: string | null
  modules: Module[]
}

type Tab = 'builder' | 'settings'

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [tab, setTab] = useState<Tab>('builder')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await api.admin.courses({ id }).get()
    if (error) {
      setError(String(error.value ?? error.status))
      return
    }
    setCourse(data as Course)
  }, [id])

  useEffect(() => { load() }, [load])

  async function deleteCourse() {
    if (!confirm('Obriši kurs i sve module/lekcije?')) return
    await api.admin.courses({ id }).delete()
    router.replace('/courses')
    router.refresh()
  }

  async function setStatus(status: 'draft' | 'published' | 'hidden') {
    await api.admin.courses({ id }).patch({ status })
    await load()
  }

  if (error) return <div className="panel" style={{ color: 'var(--danger)' }}>{error}</div>
  if (!course) return <div style={{ color: 'var(--muted)' }}>Učitavanje...</div>

  return (
    <div>
      <div className="row between" style={{ marginBottom: '0.25rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          <a href="/courses">← Kursevi</a> / {course.slug}
        </div>
        <div className="row" style={{ gap: '0.5rem' }}>
          <span className={`status-badge ${course.status}`}>{course.status}</span>
          {course.status !== 'published' && (
            <button className="btn" onClick={() => setStatus('published')}>Objavi</button>
          )}
          {course.status === 'published' && (
            <button className="btn secondary" onClick={() => setStatus('draft')}>Vrati u draft</button>
          )}
          <button className="btn danger" onClick={deleteCourse}>Obriši</button>
        </div>
      </div>
      <h1 style={{ margin: '0.5rem 0 1rem' }}>{course.title}</h1>

      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <TabBtn active={tab === 'builder'} onClick={() => setTab('builder')}>Sadržaj</TabBtn>
        <TabBtn active={tab === 'settings'} onClick={() => setTab('settings')}>Podešavanja</TabBtn>
      </div>

      {tab === 'builder' && <CourseBuilder course={course} reload={load} />}
      {tab === 'settings' && <CourseSettings course={course} reload={load} />}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 0,
        color: active ? 'var(--fg)' : 'var(--muted)',
        padding: '0.65rem 1rem',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: 500,
      }}
    >
      {children}
    </button>
  )
}
