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
import { useState } from 'react'
import { api } from '@/lib/api'
import type { Course, Lesson, Module } from '@/app/(panel)/courses/[id]/page'
import { LessonEditor } from './LessonEditor'

export function CourseBuilder({ course, reload }: { course: Course; reload: () => Promise<void> }) {
  const [modules, setModules] = useState<Module[]>(course.modules)
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lesson?: Lesson } | null>(null)

  // Sync kad parent ponovo učita
  if (modules !== course.modules && JSON.stringify(modules.map((m) => m.id)) !== JSON.stringify(course.modules.map((m) => m.id))) {
    setModules(course.modules)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  async function addModule() {
    const title = prompt('Naslov modula:')?.trim()
    if (!title) return
    await api.admin.modules.post({ courseId: course.id, title })
    await reload()
  }

  async function deleteModule(id: string) {
    if (!confirm('Obrisati modul i sve lekcije u njemu?')) return
    await api.admin.modules({ id }).delete()
    await reload()
  }

  async function renameModule(m: Module) {
    const title = prompt('Novi naslov:', m.title)?.trim()
    if (!title || title === m.title) return
    await api.admin.modules({ id: m.id }).patch({ title })
    await reload()
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

  async function deleteLesson(id: string) {
    if (!confirm('Obrisati lekciju?')) return
    await api.admin.lessons({ id }).delete()
    await reload()
  }

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

      <div className="row between" style={{ marginBottom: '1rem' }}>
        <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          {modules.length} modul{modules.length === 1 ? '' : 'a'} ·{' '}
          {modules.reduce((s, m) => s + m.lessons.length, 0)} lekcij
          {modules.reduce((s, m) => s + m.lessons.length, 0) === 1 ? 'a' : 'a'}
        </div>
        <button className="btn" onClick={addModule}>+ Modul</button>
      </div>

      {modules.length === 0 && (
        <div className="panel" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          Nema modula. Klikni "+ Modul" da dodaš prvi.
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onModuleDragEnd}>
        <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="col">
            {modules.map((m) => (
              <SortableModule
                key={m.id}
                module={m}
                onRename={() => renameModule(m)}
                onDelete={() => deleteModule(m.id)}
                onAddLesson={() => setEditingLesson({ moduleId: m.id })}
                onEditLesson={(l) => setEditingLesson({ moduleId: m.id, lesson: l })}
                onDeleteLesson={deleteLesson}
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

function SortableModule({
  module: m,
  onRename,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onLessonDragEnd,
  sensors,
}: {
  module: Module
  onRename: () => void
  onDelete: () => void
  onAddLesson: () => void
  onEditLesson: (l: Lesson) => void
  onDeleteLesson: (id: string) => void
  onLessonDragEnd: (e: DragEndEvent) => void
  sensors: ReturnType<typeof useSensors>
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: m.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="panel" >
      <div className="row between" style={{ marginBottom: '0.85rem' }}>
        <div className="row" style={{ gap: '0.6rem' }}>
          <span
            {...attributes}
            {...listeners}
            style={{ cursor: 'grab', color: 'var(--muted)', userSelect: 'none' }}
            title="Prevuci da promeniš redosled"
          >⋮⋮</span>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>{m.title}</h3>
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>· {m.lessons.length} lekcija</span>
        </div>
        <div className="row" style={{ gap: '0.35rem' }}>
          <button className="btn ghost" onClick={onRename}>Preimenuj</button>
          <button className="btn ghost" onClick={onDelete} style={{ color: 'var(--danger)' }}>Obriši</button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onLessonDragEnd}>
        <SortableContext items={m.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="col" style={{ gap: '0.4rem' }}>
            {m.lessons.map((l) => (
              <SortableLesson key={l.id} lesson={l} onEdit={() => onEditLesson(l)} onDelete={() => onDeleteLesson(l.id)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button className="btn secondary" onClick={onAddLesson} style={{ marginTop: '0.75rem', width: '100%' }}>
        + Lekcija
      </button>
    </div>
  )
}

function SortableLesson({ lesson, onEdit, onDelete }: { lesson: Lesson; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: 'var(--panel-2)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '0.55rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  }

  const icon = lesson.type === 'video' ? '▶' : lesson.type === 'text' ? '≡' : '✎'

  return (
    <div ref={setNodeRef} style={style}>
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', color: 'var(--muted)', userSelect: 'none' }}
      >⋮⋮</span>
      <span style={{ color: 'var(--accent-hover)', width: 18, textAlign: 'center' }}>{icon}</span>
      <button onClick={onEdit} style={{ background: 'transparent', border: 0, color: 'var(--fg)', flex: 1, textAlign: 'left', cursor: 'pointer', padding: 0, fontSize: '0.92rem' }}>
        {lesson.title}
      </button>
      <span className={`status-badge ${lesson.status}`}>{lesson.status}</span>
      <button className="btn ghost" onClick={onDelete} style={{ color: 'var(--danger)' }}>×</button>
    </div>
  )
}
