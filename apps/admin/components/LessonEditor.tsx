'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
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
import type { ExercisePayload } from '@spiko/shared'
import { api } from '@/lib/api'
import type { Lesson } from '@/app/(panel)/courses/[id]/page'
import { VideoUploader } from './VideoUploader'
import { ExerciseBuilder } from './exercise/ExerciseBuilder'
import { AudioRecorderUploader } from './AudioRecorderUploader'
import { confirmDialog } from './dialog'

type BlockKey = 'video' | 'text' | 'exercises' | 'audio'
const DEFAULT_ORDER: BlockKey[] = ['video', 'text', 'exercises', 'audio']

// TipTap je ~250kb gzip — lazy load tek kad otvoriš editor
const RichTextEditor = dynamic(
  () => import('./RichTextEditor').then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          background: 'var(--panel-2)',
          border: '1px solid var(--border-2)',
          borderRadius: 8,
          padding: '0.85rem',
          fontSize: '0.85rem',
          color: 'var(--muted)',
        }}
      >
        Učitavam editor…
      </div>
    ),
  },
)

type AdminExercise = {
  id: string
  title: string
  type: string
  position: number
  status: string
  payload: ExercisePayload
}

/**
 * Lekcija sad podržava VIŠE tipova sadržaja istovremeno:
 * - Video (Bunny)
 * - Rich text (TipTap)
 * - Interaktivne vežbe (lista)
 *
 * Svaka sekcija se uključuje/isključuje togglom. Tip lekcije se računa
 * automatski na osnovu prisutnog sadržaja (za badge prikaz na student strani).
 */
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
  const [status, setStatus] = useState<string>(lesson?.status ?? 'draft')

  // Kad korisnik snimi novu lekciju "u pozadini" (da dobije lessonId za vežbe),
  // čuvamo ovaj id pa modal nastavlja u edit-mode bez zatvaranja.
  const [createdLessonId, setCreatedLessonId] = useState<string | null>(null)
  const effectiveLessonId = lesson?.id ?? createdLessonId
  const isPersisted = !!effectiveLessonId

  const initialText = (() => {
    const c = lesson?.content
    if (c && typeof c === 'object' && 'body' in c) return String((c as { body?: string }).body ?? '')
    return ''
  })()

  // Sekcijski toggle: koji tipovi sadržaja su prisutni u ovoj lekciji.
  // Ako lekcija ima `contentOrder` (npr. AI-generated kostur), default-uj toggle-e
  // na osnovu te liste — i kad još nije popunjen sadržaj.
  const plannedTypes = new Set(
    Array.isArray(lesson?.contentOrder) ? lesson!.contentOrder : [],
  )
  const [hasVideo, setHasVideo] = useState(!!lesson?.videoId || plannedTypes.has('video'))
  const [hasText, setHasText] = useState(!!initialText || plannedTypes.has('text'))
  const [hasExercises, setHasExercises] = useState(plannedTypes.has('exercises')) // dodatno se postavi iz panela
  const [hasAudio, setHasAudio] = useState(!!lesson?.audioUrl || plannedTypes.has('audio'))

  const [textContent, setTextContent] = useState<string>(initialText)
  const [videoId, setVideoId] = useState<string | null>(lesson?.videoId ?? null)
  const [audioUrl, setAudioUrl] = useState<string | null>(lesson?.audioUrl ?? null)
  const [audioTitle, setAudioTitle] = useState<string>(lesson?.audioTitle ?? '')

  // Redosled blokova sadržaja unutar lekcije. Ako lekcija nema sačuvani redosled,
  // koristimo default (video → text → exercises) i normalizujemo da svih 3 budu prisutni.
  const [contentOrder, setContentOrder] = useState<BlockKey[]>(() => {
    const stored = lesson?.contentOrder
    if (Array.isArray(stored) && stored.length > 0) {
      // Garantujemo da nedostajući blokovi budu dodati na kraj (i da nema duplikata)
      const seen = new Set<BlockKey>()
      const valid: BlockKey[] = []
      for (const k of stored) {
        if ((k === 'video' || k === 'text' || k === 'exercises') && !seen.has(k)) {
          valid.push(k)
          seen.add(k)
        }
      }
      for (const k of DEFAULT_ORDER) if (!seen.has(k)) valid.push(k)
      return valid
    }
    return [...DEFAULT_ORDER]
  })

  // Zaključaj scroll stranice iza modala dok je editor otvoren.
  // Na desktopu scroll kontejner NIJE body nego `.admin-main` (overflow: auto),
  // pa zaključavamo oba za svaki slučaj.
  useEffect(() => {
    const html = document.documentElement
    const main = document.querySelector<HTMLElement>('.admin-main')
    const prev = {
      html: html.style.overflow,
      body: document.body.style.overflow,
      main: main?.style.overflow ?? '',
    }
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    if (main) main.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prev.html
      document.body.style.overflow = prev.body
      if (main) main.style.overflow = prev.main
    }
  }, [])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function onReorderBlocks(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return
    const from = contentOrder.indexOf(e.active.id as BlockKey)
    const to = contentOrder.indexOf(e.over.id as BlockKey)
    if (from === -1 || to === -1) return
    setContentOrder(arrayMove(contentOrder, from, to))
  }

  // Collapsed stanje po sekciji — sesijski (ne perzistujemo u localStorage).
  // Postojeća lekcija se otvara sa SVIM blokovima minimiziranim (pregledniji edit;
  // ne učitava odmah težak video plejer). Nova lekcija ostaje otvorena za unos.
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<BlockKey>>(() =>
    lesson ? new Set<BlockKey>(['video', 'text', 'exercises', 'audio']) : new Set<BlockKey>(),
  )
  function toggleCollapse(key: BlockKey) {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-aktiviraj sve sekcije koje imaju sadržaj
  useEffect(() => {
    if (videoId) setHasVideo(true)
  }, [videoId])

  function deriveType(): 'video' | 'text' | 'exercise' {
    if (hasVideo && videoId) return 'video'
    if (hasExercises) return 'exercise'
    return 'text'
  }

  async function save({ keepOpen = false }: { keepOpen?: boolean } = {}) {
    if (!title.trim()) {
      setError('Naslov je obavezan.')
      return
    }
    if (hasVideo && !videoId) {
      setError('Uploaduj video ili isključi video sekciju.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const content = hasText ? { body: textContent } : null
      const finalVideoId = hasVideo ? videoId ?? undefined : undefined
      const finalAudioUrl = hasAudio ? audioUrl : null
      const finalAudioTitle = hasAudio ? audioTitle.trim() || null : null

      if (isNew && !createdLessonId) {
        // CREATE — vraća novi lesson red sa id
        const { data, error } = await api.admin.lessons.post({
          moduleId,
          title,
          type: deriveType(),
          status: status as 'draft' | 'published' | 'hidden',
          content: content ?? undefined,
          videoId: finalVideoId,
        })
        if (error) throw new Error(String(error.value ?? error.status))
        const newId = (data as { id: string } | null)?.id
        if (newId) {
          setCreatedLessonId(newId)
          // Snimi redosled + audio odmah posle kreiranja
          if (
            JSON.stringify(contentOrder) !== JSON.stringify(DEFAULT_ORDER) ||
            finalAudioUrl ||
            finalAudioTitle
          ) {
            await api.admin.lessons({ id: newId }).patch({
              contentOrder,
              audioUrl: finalAudioUrl,
              audioTitle: finalAudioTitle,
            })
          }
        }
      } else {
        // UPDATE — ili postojeća lekcija (lesson.id) ili upravo kreirana (createdLessonId)
        const id = effectiveLessonId!
        const { error } = await api.admin.lessons({ id }).patch({
          title,
          type: deriveType(),
          status: status as 'draft' | 'published' | 'hidden',
          content: content ?? undefined,
          videoId: finalVideoId,
          contentOrder,
          audioUrl: finalAudioUrl,
          audioTitle: finalAudioTitle,
        })
        if (error) throw new Error(String(error.value ?? error.status))
      }
      if (!keepOpen) onSaved()
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
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'grid', placeItems: 'center', zIndex: 20, padding: '0.75rem',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 840,
          maxHeight: 'calc(100dvh - 1.5rem)',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.1rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--panel)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
            {isNew ? 'Nova lekcija' : 'Izmeni lekciju'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 0, color: 'var(--muted)',
              width: 36, height: 36, borderRadius: 8, cursor: 'pointer', fontSize: '1.2rem',
            }}
            aria-label="Zatvori"
          >×</button>
        </div>

        {/* Body — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div className="col" style={{ gap: '1.25rem' }}>
            {/* Naslov + status */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '0.75rem',
                alignItems: 'end',
              }}
            >
              <label className="label">
                <span>Naslov lekcije</span>
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="npr. Pozdravi i predstavljanje"
                  required
                  autoFocus
                />
              </label>
              <label className="label" style={{ minWidth: 140 }}>
                <span>Status</span>
                <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="draft">Skica</option>
                  <option value="published">Objavljeno</option>
                  <option value="hidden">Skriveno</option>
                </select>
              </label>
            </div>

            {/* Sekcijski toggle */}
            <div>
              <p
                style={{
                  margin: 0,
                  marginBottom: '0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--muted)',
                }}
              >
                Šta lekcija sadrži
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <ToggleChip
                  icon="📺"
                  label="Video"
                  active={hasVideo}
                  onClick={() => setHasVideo(!hasVideo)}
                />
                <ToggleChip
                  icon="📝"
                  label="Tekst"
                  active={hasText}
                  onClick={() => setHasText(!hasText)}
                />
                <ToggleChip
                  icon="✎"
                  label="Vežbe"
                  active={hasExercises || isPersisted}
                  onClick={() => setHasExercises(!hasExercises)}
                />
                <ToggleChip
                  icon="🎙"
                  label="Audio"
                  active={hasAudio}
                  onClick={() => setHasAudio(!hasAudio)}
                />
              </div>
            </div>

            {/* DND-aware redosled blokova sadržaja — admin može da prevuče kojim
                redosledom student vidi Video / Tekst / Vežbe / Audio. */}
            {(hasVideo || hasText || hasExercises || hasAudio || isPersisted) && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onReorderBlocks}
              >
                <SortableContext
                  items={contentOrder.filter((k) =>
                    k === 'video'
                      ? hasVideo
                      : k === 'text'
                        ? hasText
                        : k === 'audio'
                          ? hasAudio
                          : hasExercises || isPersisted,
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {contentOrder.map((blockKey) => {
                      if (blockKey === 'video' && hasVideo) {
                        return (
                          <SortableSection
                            key="video"
                            id="video"
                            icon="📺"
                            title="Video"
                            collapsed={collapsedBlocks.has('video')}
                            onToggleCollapse={() => toggleCollapse('video')}
                          >
                            <VideoUploader
                              initialVideoId={videoId}
                              defaultTitle={title || 'Lekcija'}
                              onUploaded={(id) => setVideoId(id)}
                            />
                            <p style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--muted)' }}>
                              Direktan upload na Bunny (TUS). Webhook flag-uje <code>video_ready</code> kad
                              transcoding završi.
                            </p>
                          </SortableSection>
                        )
                      }
                      if (blockKey === 'text' && hasText) {
                        return (
                          <SortableSection
                            key="text"
                            id="text"
                            icon="📝"
                            title="Tekstualni sadržaj"
                            collapsed={collapsedBlocks.has('text')}
                            onToggleCollapse={() => toggleCollapse('text')}
                          >
                            <RichTextEditor
                              value={textContent}
                              onChange={setTextContent}
                              placeholder="Napiši lekciju — naslove, paragrafe, primere…"
                            />
                          </SortableSection>
                        )
                      }
                      if (blockKey === 'audio' && hasAudio) {
                        return (
                          <SortableSection
                            key="audio"
                            id="audio"
                            icon="🎙"
                            title="Audio blok"
                            collapsed={collapsedBlocks.has('audio')}
                            onToggleCollapse={() => toggleCollapse('audio')}
                          >
                            <label className="label" style={{ marginBottom: '0.75rem' }}>
                              <span>Naziv audia (opciono)</span>
                              <input
                                className="input"
                                value={audioTitle}
                                onChange={(e) => setAudioTitle(e.target.value)}
                                placeholder="npr. Dijalog u kafiću"
                                maxLength={120}
                              />
                            </label>
                            <AudioRecorderUploader
                              value={audioUrl}
                              onChange={setAudioUrl}
                              label="Audio za ovu lekciju"
                              hint="Dijalog, slušanje, izgovor — student vidi audio plejer ovde u lekciji."
                            />
                          </SortableSection>
                        )
                      }
                      if (blockKey === 'exercises' && (hasExercises || isPersisted)) {
                        return (
                          <SortableSection
                            key="exercises"
                            id="exercises"
                            icon="✎"
                            title="Interaktivne vežbe"
                            collapsed={collapsedBlocks.has('exercises')}
                            onToggleCollapse={() => toggleCollapse('exercises')}
                          >
                            {isPersisted ? (
                              <ExercisesPanel
                                lessonId={effectiveLessonId!}
                                onCountChange={(n) => setHasExercises(n > 0)}
                              />
                            ) : (
                              <SaveDraftFirst
                                title={title}
                                saving={saving}
                                onSaveDraft={() => save({ keepOpen: true })}
                              />
                            )}
                          </SortableSection>
                        )
                      }
                      return null
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {!hasVideo && !hasText && !hasExercises && !hasAudio && !isPersisted && (
              <div
                style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: 'var(--surface-2)',
                  borderRadius: 12,
                  border: '1px dashed var(--border-2)',
                  color: 'var(--ink-soft)',
                  fontSize: '0.9rem',
                  lineHeight: 1.55,
                }}
              >
                💡 Uključi bar jednu sekciju iznad — Video, Tekst, Vežbe ili Audio — da bi lekcija imala sadržaj.
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '0.7rem 0.9rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 8,
                  color: 'var(--danger)',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            padding: '0.9rem 1.5rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--panel)',
          }}
        >
          <button
            className="btn secondary"
            onClick={() => (createdLessonId ? onSaved() : onClose())}
          >
            {createdLessonId ? 'Zatvori' : 'Otkaži'}
          </button>
          <button
            className="btn"
            onClick={() => save()}
            disabled={saving || !title.trim()}
          >
            {saving
              ? 'Snimam…'
              : isNew && !createdLessonId
                ? 'Napravi lekciju'
                : 'Sačuvaj izmene'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───────── primitives ───────── */

function ToggleChip({
  icon,
  label,
  active,
  onClick,
  disabled,
  hint,
}: {
  icon: string
  label: string
  active: boolean
  onClick: () => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={hint}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.55rem 0.95rem',
        borderRadius: 999,
        border: '1px solid',
        borderColor: active ? 'var(--primary)' : 'var(--border-2)',
        background: active ? 'var(--primary-soft)' : 'var(--surface)',
        color: active ? 'var(--primary-dark)' : 'var(--ink-soft)',
        fontSize: '0.85rem',
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        fontFamily: 'inherit',
        transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {active && <span style={{ fontWeight: 700 }}>✓</span>}
    </button>
  )
}

/**
 * Prikazuje se u "Vežbe" sekciji kad je lekcija još novi nacrt — vežbe
 * tehnički zahtevaju lessonId. Klik kreira draft sa minimum (samo naslov),
 * pa panel ostane otvoren da admin nastavi sa dodavanjem vežbi.
 */
function SaveDraftFirst({
  title,
  saving,
  onSaveDraft,
}: {
  title: string
  saving: boolean
  onSaveDraft: () => void
}) {
  const canSave = title.trim().length > 0
  return (
    <div
      style={{
        padding: '1.5rem',
        textAlign: 'center',
        background: 'var(--primary-soft)',
        borderRadius: 12,
        border: '1px dashed var(--primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.85rem',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          background: 'var(--surface)',
          color: 'var(--primary-dark)',
          display: 'grid',
          placeItems: 'center',
          boxShadow: 'var(--shadow-soft)',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="m9 13 2 2 4-4" />
        </svg>
      </div>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--ink)',
            fontFamily: 'Sora, sans-serif',
          }}
        >
          Snimi nacrt za dodavanje vežbi
        </p>
        <p
          style={{
            margin: '0.35rem 0 0',
            fontSize: '0.82rem',
            color: 'var(--ink-soft)',
            lineHeight: 1.5,
            maxWidth: 380,
          }}
        >
          {canSave
            ? 'Lekcija se snima kao draft (možeš kasnije da je objaviš). Vežbe se odmah otključavaju.'
            : 'Unesi naslov lekcije gore pa stigneš nazad ovde.'}
        </p>
      </div>
      <button
        className="btn"
        onClick={onSaveDraft}
        disabled={saving || !canSave}
      >
        {saving ? 'Snimam…' : '✓ Snimi nacrt'}
      </button>
    </div>
  )
}

/**
 * Sortable verzija sekcije — drag handle, grab cursor, primary border kad se drag-uje.
 * Koristi se za reorder Video / Tekst / Vežbe blokova unutar lekcije.
 */
function SortableSection({
  id,
  icon,
  title,
  collapsed = false,
  onToggleCollapse,
  children,
}: {
  id: string
  icon: string
  title: string
  collapsed?: boolean
  onToggleCollapse?: () => void
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <section
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        background: 'var(--surface)',
        border: '1px solid',
        borderColor: isDragging ? 'var(--primary)' : 'var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: isDragging ? 'var(--shadow-lift)' : 'var(--shadow-soft)',
        opacity: isDragging ? 0.85 : 1,
      }}
    >
      <div
        onClick={(e) => {
          // Klik na sam header (ne na drag handle) → toggle collapse
          if (onToggleCollapse) onToggleCollapse()
          e.stopPropagation()
        }}
        style={{
          padding: '0.75rem 1rem',
          borderBottom: collapsed ? 'none' : '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: 'linear-gradient(135deg, var(--primary-soft) 0%, transparent 70%)',
          cursor: onToggleCollapse ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label="Prevuci za promenu redosleda"
          title="Prevuci za promenu redosleda"
          style={{
            cursor: 'grab',
            background: 'transparent',
            border: 0,
            padding: '0.15rem',
            color: 'var(--muted)',
            display: 'inline-flex',
            alignItems: 'center',
          }}
          onMouseDown={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.cursor = 'grabbing'
          }}
          onMouseUp={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.cursor = 'grab'
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <circle cx="9" cy="6" r="1.4" />
            <circle cx="15" cy="6" r="1.4" />
            <circle cx="9" cy="12" r="1.4" />
            <circle cx="15" cy="12" r="1.4" />
            <circle cx="9" cy="18" r="1.4" />
            <circle cx="15" cy="18" r="1.4" />
          </svg>
        </button>
        <span style={{ fontSize: '1.05rem' }}>{icon}</span>
        <strong style={{ flex: 1, fontSize: '0.92rem' }}>{title}</strong>
        {onToggleCollapse && (
          <span
            aria-hidden
            style={{
              display: 'inline-flex',
              color: 'var(--ink-soft)',
              transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              transition: 'transform 0.18s ease',
            }}
            title={collapsed ? 'Proširi' : 'Skupi'}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        )}
      </div>
      {!collapsed && <div style={{ padding: '1rem' }}>{children}</div>}
    </section>
  )
}

/* ───────── Multi-exercise panel ───────── */

function ExercisesPanel({
  lessonId,
  onCountChange,
}: {
  lessonId: string
  onCountChange?: (n: number) => void
}) {
  const [list, setList] = useState<AdminExercise[]>([])
  const [editing, setEditing] = useState<{ id?: string; title: string; payload: ExercisePayload | null; audioUrl: string | null; audioTitle: string } | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const { data } = await api.admin.lessons({ id: lessonId }).exercises.get()
    if (Array.isArray(data)) {
      setList(data as AdminExercise[])
      onCountChange?.(data.length)
    }
  }

  useEffect(() => { load() }, [lessonId])

  async function insertFromTemplate(templateId: string) {
    await api.admin.lessons({ id: lessonId }).exercises['from-template'].post({ templateId })
    setLibraryOpen(false)
    await load()
  }

  function add() { setEditing({ title: '', payload: null, audioUrl: null, audioTitle: '' }) }
  function edit(ex: AdminExercise) {
    setEditing({
      id: ex.id,
      title: ex.title,
      payload: ex.payload,
      audioUrl: (ex as AdminExercise & { audioUrl?: string | null }).audioUrl ?? null,
      audioTitle: (ex as AdminExercise & { audioTitle?: string | null }).audioTitle ?? '',
    })
  }

  async function remove(id: string, title: string) {
    const ok = await confirmDialog({
      title: `Obriši vežbu "${title || 'bez naslova'}"?`,
      message: 'Vežba će biti uklonjena iz ove lekcije.',
      okLabel: 'Obriši',
      tone: 'danger',
    })
    if (!ok) return
    await api.admin.exercises({ id }).delete()
    await load()
  }

  async function saveExercise() {
    if (!editing) return
    if (!editing.payload) { setError('Konfiguriši vežbu pre čuvanja.'); return }
    if (!editing.title.trim()) { setError('Naslov vežbe je obavezan.'); return }
    try {
      if (editing.id) {
        const { error } = await api.admin.exercises({ id: editing.id }).patch({
          title: editing.title,
          type: editing.payload.type,
          payload: editing.payload,
          audioUrl: editing.audioUrl,
          audioTitle: editing.audioUrl ? editing.audioTitle.trim() || null : null,
        })
        if (error) throw new Error(String(error.value ?? error.status))
      } else {
        const { error: createErr, data: created } = await api.admin.exercises.post({
          lessonId,
          title: editing.title,
          type: editing.payload.type,
          payload: editing.payload,
          status: 'published',
        })
        if (createErr) throw new Error(String(createErr.value ?? createErr.status))
        // Audio se setuje posebnim PATCH-om jer POST shape ne zna za njega
        const newId = (created as { id: string } | null)?.id
        if (newId && editing.audioUrl) {
          await api.admin.exercises({ id: newId }).patch({
            audioUrl: editing.audioUrl,
            audioTitle: editing.audioTitle.trim() || null,
          })
        }
      }
      setEditing(null)
      setError(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
    }
  }

  if (editing) {
    return (
      <div className="col" style={{ gap: '0.85rem' }}>
        <div className="row between">
          <strong>{editing.id ? 'Izmeni vežbu' : 'Nova vežba'}</strong>
          <button className="btn ghost" onClick={() => { setEditing(null); setError(null) }}>
            ← Nazad na listu
          </button>
        </div>

        <label className="label">
          <span>Naslov vežbe</span>
          <input
            className="input"
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            placeholder="npr. Vežba 1 — pozdravi"
          />
        </label>

        {/* Audio uz vežbu — "Slušaj i odgovori" pattern */}
        <AudioRecorderUploader
          value={editing.audioUrl}
          onChange={(url) => setEditing({ ...editing, audioUrl: url })}
          label="Audio uz pitanje (opciono)"
          hint="Ako postoji, student vidi audio plejer iznad pitanja. Idealno za 'Slušaj i odgovori' vežbe."
        />
        {editing.audioUrl && (
          <label className="label">
            <span>Naziv audia (opciono)</span>
            <input
              className="input"
              value={editing.audioTitle}
              onChange={(e) => setEditing({ ...editing, audioTitle: e.target.value })}
              placeholder="npr. Slušaj dijalog"
              maxLength={120}
            />
          </label>
        )}

        <ExerciseBuilder
          value={editing.payload}
          onChange={(p) => setEditing({ ...editing, payload: p })}
        />

        {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</div>}

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn" onClick={saveExercise} disabled={!editing.payload || !editing.title.trim()}>
            Sačuvaj vežbu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="col" style={{ gap: '0.6rem' }}>
      {libraryOpen && (
        <LibraryPicker onClose={() => setLibraryOpen(false)} onPick={insertFromTemplate} />
      )}

      <div className="row between">
        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{list.length} vežb{list.length === 1 ? 'a' : 'i'}</span>
        <div className="row" style={{ gap: '0.35rem' }}>
          <button className="btn secondary" onClick={() => setLibraryOpen(true)}>
            📚 Iz biblioteke
          </button>
          <button className="btn" onClick={add}>+ Nova</button>
        </div>
      </div>

      {list.length === 0 ? (
        <div
          style={{
            padding: '1.25rem',
            textAlign: 'center',
            color: 'var(--muted)',
            background: 'var(--bg)',
            borderRadius: 8,
            fontSize: '0.85rem',
            border: '1px dashed var(--border-2)',
          }}
        >
          Nema vežbi u lekciji. Dodaj iz biblioteke ili od nule.
        </div>
      ) : (
        <div className="col" style={{ gap: '0.4rem' }}>
          {list.map((ex, idx) => (
            <div
              key={ex.id}
              className="row"
              style={{
                gap: '0.6rem',
                padding: '0.6rem 0.75rem',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            >
              <span style={{ width: 24, textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>
                {idx + 1}
              </span>
              <span style={{ flex: 1, fontSize: '0.9rem' }}>{ex.title}</span>
              <span
                style={{
                  fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.04em', background: 'rgba(99,102,241,0.15)',
                  color: 'var(--accent-hover)', padding: '0.15rem 0.5rem', borderRadius: 999,
                }}
              >
                {labelType(ex.type)}
              </span>
              <button className="btn ghost" onClick={() => edit(ex)}>Uredi</button>
              <button className="btn ghost" onClick={() => remove(ex.id, ex.title)} style={{ color: 'var(--danger)' }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ───────── Library picker ───────── */

type LibraryTemplate = {
  id: string
  title: string
  type: string
  payload: ExercisePayload
}

function LibraryPicker({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  const [list, setList] = useState<LibraryTemplate[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await api.admin.exercises.templates.get({
      query: { type: filter === 'all' ? undefined : filter },
    })
    if (Array.isArray(data)) setList(data as LibraryTemplate[])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'grid', placeItems: 'center', zIndex: 30, padding: '0.5rem',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="panel"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 720, maxHeight: 'calc(100dvh - 1rem)', overflowY: 'auto' }}
      >
        <div className="row between" style={{ marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>📚 Biblioteka vežbi</h2>
          <button className="btn ghost" onClick={onClose}>×</button>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 0 }}>
          Klikni template da ga ubaciš u lekciju. Kopija je nezavisna od originala.
        </p>

        <div className="row" style={{ gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {(['all', 'multiple_choice', 'fill_blank', 'matching', 'ordering'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                background: filter === t ? 'var(--accent)' : 'transparent',
                color: filter === t ? 'white' : 'var(--muted)',
                border: '1px solid',
                borderColor: filter === t ? 'var(--accent)' : 'var(--border-2)',
                padding: '0.35rem 0.75rem', borderRadius: 999,
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {t === 'all' ? 'Sve' : labelType(t)}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>Učitavam…</p>
        ) : list.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2rem' }}>📭</div>
            <p>Nema template-a. Otvori <strong>Vežbe</strong> u meniju da napraviš prvi.</p>
          </div>
        ) : (
          <div className="col" style={{ gap: '0.45rem' }}>
            {list.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => onPick(tpl.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  background: 'var(--panel-2)', border: '1px solid var(--border-2)',
                  borderRadius: 8, padding: '0.75rem', cursor: 'pointer',
                  color: 'var(--fg)', textAlign: 'left', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-2)'
                  e.currentTarget.style.background = 'var(--panel-2)'
                }}
              >
                <span style={{ fontSize: '1.4rem', color: 'var(--accent-hover)', width: 30, textAlign: 'center' }}>
                  {emojiForType(tpl.type)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{tpl.title}</div>
                  <div
                    style={{
                      marginTop: '0.2rem', fontSize: '0.78rem', color: 'var(--muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {libraryPreview(tpl.payload)}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.04em', background: 'rgba(99,102,241,0.15)',
                    color: 'var(--accent-hover)', padding: '0.2rem 0.55rem', borderRadius: 999,
                  }}
                >
                  {labelType(tpl.type)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function emojiForType(t: string) {
  if (t === 'multiple_choice') return '◉'
  if (t === 'fill_blank') return '✏'
  if (t === 'matching') return '↔'
  if (t === 'ordering') return '↕'
  return '•'
}

function libraryPreview(p: ExercisePayload): string {
  if (p.type === 'multiple_choice') return p.data.question || '—'
  if (p.type === 'fill_blank') return p.data.template || '—'
  if (p.type === 'matching') return p.data.question || `${p.data.left?.length ?? 0} parova`
  if (p.type === 'ordering') return p.data.question || `${p.data.items?.length ?? 0} stavki`
  return '—'
}

function labelType(t: string) {
  if (t === 'multiple_choice') return 'MC'
  if (t === 'fill_blank') return 'FB'
  if (t === 'matching') return '↔'
  if (t === 'ordering') return '↕'
  return t
}
