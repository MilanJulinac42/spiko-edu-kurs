'use client'

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Course, Lesson, Module } from '@/app/(panel)/courses/[id]/page'
import { LessonEditor } from './LessonEditor'
import { promptDialog, confirmDialog } from './dialog'
import { toast } from './toast'
import { statusLabel } from '@/lib/status'

export function CourseBuilder({ course, reload }: { course: Course; reload: () => Promise<void> }) {
  const [modules, setModules] = useState<Module[]>(course.modules)
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lesson?: Lesson } | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  // Moduli su podrazumevano SKUPLJENI — vidi se samo zaglavlje; klik na strelicu otvara lekcije.
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(
    () => new Set(course.modules.map((m) => m.id)),
  )

  useEffect(() => {
    setModules(course.modules)
  }, [course.modules])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function toggleModule(moduleId: string) {
    setCollapsedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  function toggleExpand(lessonId: string) {
    const next = new Set(expanded)
    if (next.has(lessonId)) next.delete(lessonId)
    else next.add(lessonId)
    setExpanded(next)
  }

  async function addModule() {
    const title = await promptDialog({
      title: 'Novi modul',
      label: 'Naslov modula',
      placeholder: 'npr. Pozdravi i predstavljanje',
      okLabel: 'Napravi modul',
    })
    if (!title) return
    try {
      await api.admin.modules.post({ courseId: course.id, title })
      await reload()
      toast.success('Modul napravljen', { description: title })
    } catch (e) {
      toast.error('Neuspelo kreiranje modula', { description: errMsg(e) })
    }
  }

  async function deleteModule(id: string, moduleTitle: string, lessonCount: number) {
    const ok = await confirmDialog({
      title: `Obriši modul "${moduleTitle}"?`,
      message:
        lessonCount > 0
          ? `Modul i svih ${lessonCount} lekcij${lessonCount === 1 ? 'u' : 'a'} u njemu će biti trajno obrisano. Ova radnja se ne može poništiti.`
          : 'Modul će biti trajno obrisan. Ova radnja se ne može poništiti.',
      okLabel: 'Obriši modul',
      tone: 'danger',
    })
    if (!ok) return
    try {
      await api.admin.modules({ id }).delete()
      await reload()
      toast.success(`Modul "${moduleTitle}" obrisan`)
    } catch (e) {
      toast.error('Neuspelo brisanje modula', { description: errMsg(e) })
    }
  }

  async function renameModule(m: Module) {
    const title = await promptDialog({
      title: 'Preimenuj modul',
      label: 'Novi naslov',
      initialValue: m.title,
      okLabel: 'Sačuvaj',
    })
    if (!title || title === m.title) return
    try {
      await api.admin.modules({ id: m.id }).patch({ title })
      await reload()
      toast.success('Modul preimenovan', { description: title })
    } catch (e) {
      toast.error('Neuspelo preimenovanje', { description: errMsg(e) })
    }
  }

  async function onModuleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return
    const oldIdx = modules.findIndex((m) => m.id === e.active.id)
    const newIdx = modules.findIndex((m) => m.id === e.over!.id)
    const reordered = arrayMove(modules, oldIdx, newIdx)
    setModules(reordered)
    await api.admin.reorder.modules.post({
      courseId: course.id,
      ids: reordered.map((m) => m.id),
    })
  }

  async function onLessonDragEnd(moduleId: string, e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return
    const mIdx = modules.findIndex((m) => m.id === moduleId)
    if (mIdx === -1) return
    const m = modules[mIdx]
    const oldIdx = m.lessons.findIndex((l) => l.id === e.active.id)
    const newIdx = m.lessons.findIndex((l) => l.id === e.over!.id)
    const reordered = arrayMove(m.lessons, oldIdx, newIdx)
    const newModules = [...modules]
    newModules[mIdx] = { ...m, lessons: reordered }
    setModules(newModules)
    await api.admin.reorder.lessons.post({
      moduleId,
      ids: reordered.map((l) => l.id),
    })
  }

  async function deleteLesson(id: string, lessonTitle: string) {
    const ok = await confirmDialog({
      title: `Obriši lekciju "${lessonTitle}"?`,
      message: 'Lekcija i sav njen sadržaj (video, tekst, vežbe) će biti trajno obrisani.',
      okLabel: 'Obriši lekciju',
      tone: 'danger',
    })
    if (!ok) return
    try {
      await api.admin.lessons({ id }).delete()
      await reload()
      toast.success(`Lekcija "${lessonTitle}" obrisana`)
    } catch (e) {
      toast.error('Neuspelo brisanje lekcije', { description: errMsg(e) })
    }
  }

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0)

  return (
    <div>
      {editingLesson && (
        <LessonEditor
          moduleId={editingLesson.moduleId}
          lesson={editingLesson.lesson}
          onClose={() => setEditingLesson(null)}
          onSaved={async () => {
            setEditingLesson(null)
            await reload()
          }}
        />
      )}

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Sadržaj kursa</h2>
        <button className="btn" onClick={addModule}>+ Modul</button>
      </div>

      {modules.length === 0 && (
        <div
          style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            background: 'var(--surface)',
            border: '1px dashed var(--border-2)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 0.5rem',
              borderRadius: 999,
              background: 'var(--primary-soft)',
              color: 'var(--primary-dark)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <path d="M3 11h18M8 7V4h8v3" />
            </svg>
          </div>
          <h3 style={{ marginTop: '0.5rem', marginBottom: 0 }}>Prazan kurs</h3>
          <p style={{ color: 'var(--ink-soft)', maxWidth: 380, margin: '0.5rem auto 1.25rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Kreni od modula — to je grupa povezanih lekcija. Posle u njega dodaj
            lekcije sa video, tekst i vežbama.
          </p>
          <button className="btn" onClick={addModule}>+ Napravi prvi modul</button>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onModuleDragEnd}>
        <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {modules.map((m, mIdx) => (
              <SortableModule
                key={m.id}
                module={m}
                index={mIdx}
                collapsed={collapsedModules.has(m.id)}
                onToggleCollapse={() => toggleModule(m.id)}
                expanded={expanded}
                onToggleExpand={toggleExpand}
                onRename={() => renameModule(m)}
                onDelete={() => deleteModule(m.id, m.title, m.lessons.length)}
                onAddLesson={() => setEditingLesson({ moduleId: m.id })}
                onEditLesson={(l) => setEditingLesson({ moduleId: m.id, lesson: l })}
                onDeleteLesson={(id, title) => deleteLesson(id, title)}
                onLessonDragEnd={(e) => onLessonDragEnd(m.id, e)}
                sensors={sensors}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

/* ──────── Module card ──────── */

function SortableModule({
  module: m,
  index,
  collapsed,
  onToggleCollapse,
  expanded,
  onToggleExpand,
  onRename,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onLessonDragEnd,
  sensors,
}: {
  module: Module
  index: number
  collapsed: boolean
  onToggleCollapse: () => void
  expanded: Set<string>
  onToggleExpand: (id: string) => void
  onRename: () => void
  onDelete: () => void
  onAddLesson: () => void
  onEditLesson: (l: Lesson) => void
  onDeleteLesson: (id: string, title: string) => void
  onLessonDragEnd: (e: DragEndEvent) => void
  sensors: ReturnType<typeof useSensors>
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: m.id })

  const totalContent = m.lessons.length
  const published = m.lessons.filter((l) => l.status === 'published').length

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        boxShadow: isDragging ? 'var(--shadow-lift)' : 'var(--shadow-soft)',
      }}
    >
      {/* Module header */}
      <header
        style={{
          padding: '0.9rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          borderBottom: !collapsed && m.lessons.length > 0 ? '1px solid var(--border)' : 'none',
          background:
            'linear-gradient(135deg, var(--primary-soft) 0%, transparent 70%)',
        }}
      >
        <span
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            color: 'var(--muted)',
            userSelect: 'none',
            display: 'inline-flex',
            padding: '0.2rem',
          }}
          title="Prevuci da promeniš redosled modula"
        >
          <DragHandleIcon />
        </span>

        <button
          onClick={onToggleCollapse}
          className="btn ghost"
          style={{ padding: '0.25rem', display: 'inline-flex', color: 'var(--ink-soft)' }}
          title={collapsed ? 'Prikaži lekcije' : 'Sakrij lekcije'}
          aria-label={collapsed ? 'Prikaži lekcije' : 'Sakrij lekcije'}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
              transition: 'transform 0.15s',
            }}
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 34,
            height: 34,
            background: 'var(--surface)',
            color: 'var(--primary-dark)',
            borderRadius: 10,
            fontWeight: 800,
            fontSize: '0.85rem',
            fontFamily: 'Sora, sans-serif',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          {index + 1}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>{m.title}</h3>
          <p
            style={{
              margin: 0,
              fontSize: '0.78rem',
              color: 'var(--ink-soft)',
              marginTop: '0.15rem',
            }}
          >
            {totalContent} lekcij{totalContent === 1 ? 'a' : 'a'}
            {totalContent > 0 && (
              <>
                {' · '}
                <span style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>
                  {published} objavljen{published === 1 ? 'a' : 'ih'}
                </span>
              </>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.2rem' }}>
          <button className="btn ghost" onClick={onRename}>Preimenuj</button>
          <button className="btn ghost" onClick={onDelete} style={{ color: 'var(--danger)' }}>Obriši</button>
        </div>
      </header>

      {/* Lessons — skriveno kad je modul skupljen */}
      {!collapsed && m.lessons.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onLessonDragEnd}>
          <SortableContext items={m.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div style={{ padding: '0.6rem' }}>
              {m.lessons.map((l) => (
                <SortableLesson
                  key={l.id}
                  lesson={l}
                  isExpanded={expanded.has(l.id)}
                  onToggle={() => onToggleExpand(l.id)}
                  onEdit={() => onEditLesson(l)}
                  onDelete={() => onDeleteLesson(l.id, l.title)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {!collapsed && (
      <div style={{ padding: '0.65rem 1rem 1rem' }}>
        <button
          onClick={onAddLesson}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'transparent',
            color: 'var(--ink-soft)',
            border: '1.5px dashed var(--border-2)',
            borderRadius: 12,
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
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
          + Dodaj lekciju u {m.title}
        </button>
      </div>
      )}
    </article>
  )
}

/* ──────── Lesson row (expandable) ──────── */

function SortableLesson({
  lesson,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  lesson: Lesson
  isExpanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id })

  const hasVideo = !!lesson.videoId
  const hasText = !!lesson.content && typeof lesson.content === 'object' && 'body' in (lesson.content as object) && !!(lesson.content as { body?: string }).body
  const hasAudio = !!lesson.audioUrl
  const exerciseCount = (lesson as Lesson & { exercises?: unknown[] }).exercises?.length ?? 0
  const contentBadges = [
    hasVideo && { icon: '📺', label: 'Video', bg: 'var(--accent-soft)', fg: 'var(--accent-dark)' },
    hasText && { icon: '📝', label: 'Tekst', bg: 'var(--primary-soft)', fg: 'var(--primary-dark)' },
    hasAudio && { icon: '🔊', label: 'Audio', bg: 'var(--secondary-soft, #dbeafe)', fg: 'var(--secondary-dark, #1e40af)' },
    exerciseCount > 0 && {
      icon: '✎',
      label: `${exerciseCount} vežb${exerciseCount === 1 ? 'a' : 'i'}`,
      bg: 'var(--warning-soft)',
      fg: 'var(--warning)',
    },
  ].filter(Boolean) as Array<{ icon: string; label: string; bg: string; fg: string }>

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: '0.35rem',
      }}
    >
      {/* Lesson row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.7rem 0.85rem',
          background: isExpanded ? 'var(--primary-soft)' : 'var(--surface-2)',
          border: '1px solid',
          borderColor: isExpanded ? 'var(--primary)' : 'var(--border)',
          borderRadius: 10,
          transition: 'background-color 0.15s, border-color 0.15s',
        }}
      >
        <span
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab', color: 'var(--muted)', userSelect: 'none', display: 'inline-flex', padding: '0.15rem' }}
          title="Prevuci da promeniš redosled"
        >
          <DragHandleIcon />
        </span>

        <button
          onClick={onToggle}
          style={{
            background: 'transparent',
            border: 0,
            color: 'var(--ink-soft)',
            width: 24,
            height: 24,
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            transition: 'transform 0.2s, color 0.15s',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
          aria-label={isExpanded ? 'Skupi' : 'Proširi'}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          onClick={onEdit}
          style={{
            background: 'transparent',
            border: 0,
            color: 'var(--ink)',
            flex: 1,
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '0.92rem',
            fontWeight: 600,
            padding: 0,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
          }}
        >
          {lesson.title}
        </button>

        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {contentBadges.map((b, i) => (
            <span
              key={i}
              style={{
                background: b.bg,
                color: b.fg,
                padding: '0.2rem 0.55rem',
                borderRadius: 999,
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title={b.label}
            >
              {b.icon} {b.label}
            </span>
          ))}
        </div>

        <span
          className={`status-badge ${lesson.status}`}
          style={{ marginLeft: '0.2rem' }}
        >
          {statusLabel(lesson.status)}
        </span>

        <button className="btn ghost" onClick={onEdit} title="Uredi">✎</button>
        <button className="btn ghost" onClick={onDelete} title="Obriši" style={{ color: 'var(--danger)' }}>×</button>
      </div>

      {/* Expanded preview */}
      {isExpanded && (
        <div
          style={{
            margin: '0.4rem 0 0.4rem 2rem',
            padding: '1rem 1.15rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          {contentBadges.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem', lineHeight: 1.5 }}>
              Lekcija je prazna — klikni <strong>✎ Uredi</strong> da dodaš video, tekst ili vežbe.
            </p>
          ) : (
            <>
              {hasVideo && (
                <div className="col" style={{ gap: '0.5rem' }}>
                  <ContentPreviewRow icon="📺" label="Video">
                    GUID:{' '}
                    <code
                      style={{
                        background: 'var(--surface-2)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        color: 'var(--ink)',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      }}
                    >
                      {lesson.videoId?.slice(0, 8)}…{lesson.videoId?.slice(-4)}
                    </code>
                    {lesson.videoReady ? (
                      <span style={{ color: 'var(--success)', marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
                        ✓ spreman
                      </span>
                    ) : (
                      <VideoStatusButton videoId={lesson.videoId!} />
                    )}
                  </ContentPreviewRow>
                  <VideoInlinePlayer videoId={lesson.videoId!} />
                </div>
              )}
              {hasText && (
                <ContentPreviewRow icon="📝" label="Tekst">
                  <span style={{ color: 'var(--ink-soft)' }}>
                    {textSnippet((lesson.content as { body?: string }).body ?? '')}
                  </span>
                </ContentPreviewRow>
              )}
              {hasAudio && (
                <ContentPreviewRow icon="🔊" label="Audio">
                  {lesson.audioTitle ? (
                    <span style={{ color: 'var(--ink)' }}>{lesson.audioTitle}</span>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                      Audio zapis (bez naziva)
                    </span>
                  )}
                </ContentPreviewRow>
              )}
              {exerciseCount > 0 && (
                <ContentPreviewRow icon="✎" label="Vežbe">
                  <span style={{ color: 'var(--ink-soft)' }}>
                    {exerciseCount} interaktivn{exerciseCount === 1 ? 'a vežba' : 'e vežbe'} u lekciji
                  </span>
                </ContentPreviewRow>
              )}
            </>
          )}
          <button
            onClick={onEdit}
            className="btn secondary"
            style={{ alignSelf: 'flex-start', marginTop: '0.3rem' }}
          >
            ✎ Otvori uređivanje
          </button>
        </div>
      )}
    </div>
  )
}

function ContentPreviewRow({
  icon,
  label,
  children,
}: {
  icon: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.85rem', alignItems: 'baseline' }}>
      <span style={{ minWidth: 72, color: 'var(--ink-soft)' }}>
        {icon}{' '}
        <strong style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </strong>
      </span>
      <span style={{ flex: 1, minWidth: 0, color: 'var(--ink)' }}>{children}</span>
    </div>
  )
}

function DragHandleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </svg>
  )
}

function VideoInlinePlayer({ videoId }: { videoId: string }) {
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID
  if (!libraryId) {
    return (
      <div
        style={{
          padding: '0.7rem 0.85rem',
          background: 'var(--surface-2)',
          border: '1px dashed var(--border-2)',
          borderRadius: 8,
          color: 'var(--ink-soft)',
          fontSize: '0.78rem',
        }}
      >
        Postavi <code style={{ background: 'var(--surface)', padding: '0 4px', borderRadius: 4 }}>NEXT_PUBLIC_BUNNY_LIBRARY_ID</code> u admin{' '}
        <code style={{ background: 'var(--surface)', padding: '0 4px', borderRadius: 4 }}>.env.local</code> da prikažeš plejer.
      </div>
    )
  }
  return <VideoPosterPlayer libraryId={libraryId} videoId={videoId} />
}

/**
 * Kompaktan video preview za course builder — po defaultu prikazuje malu
 * „poster" karticu, a tek na klik učitava pravi Bunny plejer (16:9, max 480px).
 * Time se izbegava ogroman crni iframe koji dominira pregledom lekcije.
 */
function VideoPosterPlayer({ libraryId, videoId }: { libraryId: string; videoId: string }) {
  const [show, setShow] = useState(false)

  if (!show) {
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          width: '100%',
          maxWidth: 480,
          padding: '0.7rem 0.85rem',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'border-color 0.15s, background 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--primary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)'
        }}
      >
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: '50%',
            background: 'var(--primary)',
            color: '#fff',
            fontSize: '0.9rem',
          }}
        >
          ▶
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: 'block', fontSize: '0.82rem', color: 'var(--ink)' }}>
            Pogledaj video
          </strong>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
            Plejer se učitava na klik
          </span>
        </span>
      </button>
    )
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <div
        style={{
          position: 'relative',
          paddingBottom: '56.25%',
          background: '#0a0c10',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        <iframe
          src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false`}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          title={`Preview ${videoId}`}
        />
      </div>
      <button
        type="button"
        onClick={() => setShow(false)}
        className="btn ghost"
        style={{ marginTop: '0.4rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
      >
        ✕ Sakrij plejer
      </button>
    </div>
  )
}

function VideoStatusButton({ videoId }: { videoId: string }) {
  const [state, setState] = useState<'idle' | 'checking' | 'ready' | 'still-processing'>('idle')
  const [statusCode, setStatusCode] = useState<number | null>(null)

  // Auto-pokušaj sync jednom kad se komponent mount-uje
  useEffect(() => {
    let cancelled = false
    void (async () => {
      setState('checking')
      try {
        const { data } = await api.admin.bunny.videos({ videoId }).sync.post()
        if (cancelled) return
        const r = data as { ready: boolean; status: number }
        setStatusCode(r.status)
        if (r.ready) {
          setState('ready')
          // reload stranice da course tree se osveži sa videoReady=true
          setTimeout(() => window.location.reload(), 500)
        } else {
          setState('still-processing')
        }
      } catch {
        if (!cancelled) setState('still-processing')
      }
    })()
    return () => { cancelled = true }
  }, [videoId])

  async function manualCheck() {
    setState('checking')
    try {
      const { data } = await api.admin.bunny.videos({ videoId }).sync.post()
      const r = data as { ready: boolean; status: number }
      setStatusCode(r.status)
      if (r.ready) {
        setState('ready')
        setTimeout(() => window.location.reload(), 300)
      } else {
        setState('still-processing')
      }
    } catch {
      setState('still-processing')
    }
  }

  if (state === 'ready') {
    return <span style={{ color: 'var(--success)', marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>✓ spreman</span>
  }

  return (
    <span style={{ marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
      <span style={{ color: 'var(--warning)', fontSize: '0.75rem', fontWeight: 600 }}>
        {state === 'checking' ? '⏳ proveravam…' : '⏳ obrađuje se'}
        {statusCode !== null && statusCode !== 4 && (
          <span style={{ marginLeft: '0.3rem', color: 'var(--ink-soft)', fontWeight: 400 }}>
            (status: {bunnyStatusLabel(statusCode)})
          </span>
        )}
      </span>
      <button
        onClick={manualCheck}
        disabled={state === 'checking'}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-2)',
          color: 'var(--accent-dark)',
          padding: '0.2rem 0.55rem',
          borderRadius: 6,
          cursor: state === 'checking' ? 'wait' : 'pointer',
          fontSize: '0.72rem',
          fontWeight: 600,
          fontFamily: 'inherit',
        }}
      >
        ↻ Proveri sada
      </button>
    </span>
  )
}

function bunnyStatusLabel(code: number): string {
  switch (code) {
    case 0: return 'kreiran'
    case 1: return 'uploadovan'
    case 2: return 'processing'
    case 3: return 'transcoding'
    case 4: return 'završen'
    case 5: return 'greška'
    case 6: return 'upload neuspeo'
    default: return `kod ${code}`
  }
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  try { return JSON.stringify(e) } catch { return 'Nepoznata greška' }
}

function textSnippet(body: string, maxLen = 140): string {
  const stripped = body
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (stripped.length <= maxLen) return stripped || '(prazno)'
  return stripped.slice(0, maxLen) + '…'
}
