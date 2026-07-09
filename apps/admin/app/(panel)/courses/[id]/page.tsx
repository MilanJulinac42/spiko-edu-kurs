'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { CourseBuilder } from '@/components/CourseBuilder'
import { CourseSettings } from '@/components/CourseSettings'
import { confirmDialog } from '@/components/dialog'
import { toast } from '@/components/toast'
import { CourseHeroSkeleton, CourseBuilderSkeleton } from '@/components/Skeleton'
import { statusLabel } from '@/lib/status'
import { openStudentPreview } from '@/lib/studentPreview'

export type Lesson = {
  id: string
  title: string
  type: 'video' | 'text' | 'exercise'
  status: string
  position: number
  videoId?: string | null
  videoReady?: boolean | null
  content?: { body?: string } | null
  contentOrder?: Array<'video' | 'text' | 'exercises' | 'audio'> | null
  audioUrl?: string | null
  audioTitle?: string | null
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
    if (!course) return
    const ok = await confirmDialog({
      title: `Obriši kurs "${course.title}"?`,
      message:
        'Kurs i svi njegovi moduli i lekcije će biti trajno obrisani. Studenti gube pristup. Ova radnja se ne može poništiti.',
      okLabel: 'Obriši kurs',
      tone: 'danger',
    })
    if (!ok) return
    try {
      await api.admin.courses({ id }).delete()
      toast.success(`Kurs "${course.title}" obrisan`)
      router.replace('/courses')
      router.refresh()
    } catch (e) {
      toast.error('Neuspelo brisanje kursa', {
        description: e instanceof Error ? e.message : String(e),
      })
    }
  }

  async function setStatus(status: 'draft' | 'published' | 'hidden') {
    try {
      await api.admin.courses({ id }).patch({ status })
      await load()
      const msg =
        status === 'published'
          ? 'Kurs je objavljen i vidljiv studentima'
          : status === 'draft'
            ? 'Kurs je vraćen u skicu'
            : 'Kurs je sakriven'
      toast.success(msg)
    } catch (e) {
      toast.error('Neuspela promena statusa', {
        description: e instanceof Error ? e.message : String(e),
      })
    }
  }

  if (error) return <div className="panel" style={{ color: 'var(--danger)' }}>{error}</div>
  if (!course) {
    return (
      <div>
        <div style={{ marginBottom: '0.75rem' }}>
          <span style={{ color: 'var(--ink-soft)', fontSize: '0.82rem', fontWeight: 500 }}>
            ← Svi kursevi
          </span>
        </div>
        <CourseHeroSkeleton />
        <CourseBuilderSkeleton />
      </div>
    )
  }

  const totalModules = course.modules.length
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0)

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '0.75rem' }}>
        <Link
          href="/courses"
          style={{
            color: 'var(--ink-soft)',
            fontSize: '0.82rem',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← Svi kursevi
        </Link>
      </div>

      {/* Hero header */}
      <div
        style={{
          position: 'relative',
          padding: '1.6rem 1.75rem',
          borderRadius: 'var(--r-lg)',
          background:
            'linear-gradient(135deg, var(--primary-soft) 0%, var(--accent-soft) 100%)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-soft)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -40,
            top: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(134,196,64,0.18), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            position: 'relative',
            zIndex: 1,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span className={`status-badge ${course.status}`}>{statusLabel(course.status)}</span>
              {course.level && (
                <span
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    color: 'var(--ink)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: 999,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                >
                  {course.level}
                </span>
              )}
              {course.language && (
                <span
                  style={{
                    background: 'rgba(255,255,255,0.5)',
                    color: 'var(--ink-soft)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: 999,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {course.language}
                </span>
              )}
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', lineHeight: 1.15 }}>
              {course.title}
            </h1>
            {course.description && (
              <p
                style={{
                  margin: '0.5rem 0 0',
                  color: 'var(--ink-soft)',
                  fontSize: '0.92rem',
                  maxWidth: 620,
                  lineHeight: 1.5,
                }}
              >
                {course.description}
              </p>
            )}
            <div
              style={{
                display: 'flex',
                gap: '1.25rem',
                marginTop: '0.85rem',
                fontSize: '0.82rem',
                color: 'var(--ink-soft)',
                flexWrap: 'wrap',
              }}
            >
              <span>
                <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>{totalModules}</strong>{' '}
                modul{totalModules === 1 ? '' : 'a'}
              </span>
              <span>
                <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>{totalLessons}</strong>{' '}
                lekcij{totalLessons === 1 ? 'a' : 'a'}
              </span>
              <span>/{course.slug}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
            <button
              className="btn ghost"
              onClick={() => openStudentPreview(course.slug)}
              title="Otvori kurs u studentskom pregledu (novi tab)"
            >
              👁 Pregled kao student
            </button>
            {course.status !== 'published' && (
              <button className="btn" onClick={() => setStatus('published')}>
                Objavi
              </button>
            )}
            {course.status === 'published' && (
              <button className="btn secondary" onClick={() => setStatus('draft')}>
                Vrati u skicu
              </button>
            )}
            <button
              className="btn ghost"
              onClick={deleteCourse}
              style={{ color: 'var(--danger)' }}
              title="Obriši kurs"
            >
              Obriši
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          borderBottom: '1px solid var(--border)',
          marginBottom: '1.5rem',
        }}
      >
        <TabBtn active={tab === 'builder'} onClick={() => setTab('builder')}>
          Sadržaj
        </TabBtn>
        <TabBtn active={tab === 'settings'} onClick={() => setTab('settings')}>
          Podešavanja
        </TabBtn>
      </div>

      {tab === 'builder' && <CourseBuilder course={course} reload={load} />}
      {tab === 'settings' && <CourseSettings course={course} reload={load} />}
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 0,
        color: active ? 'var(--ink)' : 'var(--ink-soft)',
        padding: '0.7rem 1.1rem',
        borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
        cursor: 'pointer',
        fontSize: '0.92rem',
        fontWeight: active ? 700 : 500,
        fontFamily: 'inherit',
        transition: 'color 0.15s ease, border-color 0.15s ease',
        marginBottom: '-1px',
      }}
    >
      {children}
    </button>
  )
}
