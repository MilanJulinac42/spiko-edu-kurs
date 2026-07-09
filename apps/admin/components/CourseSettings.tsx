'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CEFR } from '@spiko/shared'
import { api } from '@/lib/api'
import type { Course } from '@/app/(panel)/courses/[id]/page'
import { confirmDialog } from './dialog'
import { toast } from './toast'
import { ThumbnailUpload } from './ThumbnailUpload'

const LANGUAGES = [
  { code: 'de', flag: '🇩🇪', name: 'Nemački' },
  { code: 'en', flag: '🇬🇧', name: 'Engleski' },
]

const DESC_MAX = 280

export function CourseSettings({ course, reload }: { course: Course; reload: () => void }) {
  const router = useRouter()
  const [title, setTitle] = useState(course.title)
  const [slug, setSlug] = useState(course.slug)
  const [description, setDescription] = useState(course.description ?? '')
  const [level, setLevel] = useState(course.level ?? 'A1')
  const [language, setLanguage] = useState(course.language ?? 'de')
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnailUrl ?? '')
  const [saving, setSaving] = useState(false)

  // Reset state ako se course menja spolja (npr. posle reload-a)
  useEffect(() => {
    setTitle(course.title)
    setSlug(course.slug)
    setDescription(course.description ?? '')
    setLevel(course.level ?? 'A1')
    setLanguage(course.language ?? 'de')
    setThumbnailUrl(course.thumbnailUrl ?? '')
  }, [course])

  const dirty = useMemo(
    () =>
      title !== course.title ||
      slug !== course.slug ||
      description !== (course.description ?? '') ||
      level !== (course.level ?? 'A1') ||
      language !== (course.language ?? 'de'),
    // thumbnailUrl namerno izostavljen — ThumbnailUpload menja DB direktno preko
    // /admin/courses/:id/thumbnail endpoint-a, ne kroz ovaj PATCH form
    [title, slug, description, level, language, course],
  )

  // Warn ako pokušaš da zatvoriš tab sa nesačuvanim izmenama
  useEffect(() => {
    if (!dirty) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  async function save() {
    if (!dirty || saving) return
    setSaving(true)
    try {
      // thumbnailUrl izostavljen — ThumbnailUpload ima svoj endpoint, ne ide kroz PATCH
      const { error } = await api.admin.courses({ id: course.id }).patch({
        title,
        slug,
        description,
        level,
        language,
      })
      if (error) throw new Error(String(error.value ?? error.status))
      await reload()
      toast.success('Izmene sačuvane')
    } catch (e) {
      toast.error('Neuspelo čuvanje', {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setTitle(course.title)
    setSlug(course.slug)
    setDescription(course.description ?? '')
    setLevel(course.level ?? 'A1')
    setLanguage(course.language ?? 'de')
    setThumbnailUrl(course.thumbnailUrl ?? '')
  }

  async function deleteCourse() {
    const ok = await confirmDialog({
      title: `Obriši kurs "${course.title}"?`,
      message:
        'Kurs i svi njegovi moduli i lekcije će biti trajno obrisani. Studenti gube pristup. Ova radnja se ne može poništiti.',
      okLabel: 'Obriši kurs',
      tone: 'danger',
    })
    if (!ok) return
    try {
      await api.admin.courses({ id: course.id }).delete()
      toast.success(`Kurs "${course.title}" obrisan`)
      router.replace('/courses')
      router.refresh()
    } catch (e) {
      toast.error('Neuspelo brisanje', {
        description: e instanceof Error ? e.message : String(e),
      })
    }
  }

  return (
    <>
      <div className="settings-grid">
        {/* Left: Osnovni podaci */}
        <div className="panel" style={{ padding: '1.5rem 1.6rem' }}>
          <SectionHeader title="Osnovni podaci" />
          <div className="col" style={{ gap: '1.2rem' }}>
            <Field label="Naslov">
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="npr. Nemački A2 — Svakodnevni razgovori"
              />
            </Field>

            <Field
              label="Slug"
              hint={
                <span style={{ color: 'var(--ink-soft)' }}>
                  Vidljiv u URL-u:{' '}
                  <span
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      color: 'var(--accent-dark)',
                      fontWeight: 600,
                    }}
                  >
                    /courses/{slug || '…'}
                  </span>
                </span>
              }
            >
              <input
                className="input"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="auto-slug"
              />
            </Field>

            <Field
              label="Opis"
              hint={
                <span
                  style={{
                    color:
                      description.length > DESC_MAX
                        ? 'var(--danger)'
                        : 'var(--muted)',
                    fontWeight: description.length > DESC_MAX ? 600 : 500,
                  }}
                >
                  {description.length} / {DESC_MAX}
                </span>
              }
            >
              <textarea
                className="textarea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Šta studenti uče u ovom kursu? Koja je ciljana publika?"
              />
            </Field>

            <div className="row" style={{ gap: '1.25rem', alignItems: 'flex-start' }}>
              <Field label="CEFR nivo" style={{ flex: 1 }}>
                <CefrPicker value={level} onChange={setLevel} />
              </Field>
            </div>

            <Field label="Jezik">
              <LanguagePicker value={language} onChange={setLanguage} />
            </Field>
          </div>
        </div>

        {/* Right: Vizuelni identitet */}
        <div className="col" style={{ gap: '1rem' }}>
          <div className="panel" style={{ padding: '1.5rem 1.6rem' }}>
            <SectionHeader title="Vizuelni identitet" />
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--ink-soft)',
                marginBottom: '0.75rem',
                lineHeight: 1.4,
              }}
            >
              Slika koja se prikazuje na dashboard-u i marketing kartici. Optimalno
              16:9 (1280×720). Originalna slika će biti resize-ovana automatski.
            </div>
            <ThumbnailUpload
              courseId={course.id}
              value={thumbnailUrl || null}
              title={title}
              onChange={(url) => {
                setThumbnailUrl(url ?? '')
                reload()
              }}
            />
          </div>

          {/* Danger zone */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--danger-soft)',
              borderRadius: 'var(--r-lg)',
              padding: '1.25rem 1.4rem',
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.85rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--danger)',
                }}
              >
                Opasna zona
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '0.85rem',
                color: 'var(--ink-soft)',
                lineHeight: 1.5,
                marginBottom: '0.85rem',
              }}
            >
              Brisanje kursa je nepovratno. Svi moduli, lekcije i progres
              studenata se gube zauvek.
            </p>
            <button className="btn danger" onClick={deleteCourse}>
              Obriši kurs
            </button>
          </div>
        </div>
      </div>

      {/* Sticky save bar */}
      {dirty && (
        <div
          style={{
            position: 'sticky',
            bottom: '1rem',
            zIndex: 20,
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              background: 'var(--ink)',
              color: 'white',
              padding: '0.55rem 0.55rem 0.55rem 1.2rem',
              borderRadius: 999,
              boxShadow: 'var(--shadow-lift)',
              animation: 'saveBarIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: 'var(--primary)',
                boxShadow: '0 0 8px var(--primary)',
              }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>
              Imaš nesačuvane izmene
            </span>
            <button
              onClick={reset}
              disabled={saving}
              style={{
                background: 'transparent',
                border: 0,
                color: 'rgba(255,255,255,0.6)',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '0.4rem 0.7rem',
                borderRadius: 999,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')
              }
            >
              Otkaži
            </button>
            <button
              onClick={save}
              disabled={saving || description.length > DESC_MAX}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 0,
                padding: '0.5rem 1.1rem',
                borderRadius: 999,
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: saving ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 2px 6px rgba(94, 158, 46, 0.4)',
                opacity: description.length > DESC_MAX ? 0.5 : 1,
              }}
            >
              {saving ? 'Snimam…' : 'Sačuvaj izmene'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .settings-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr);
          gap: 1.25rem;
          align-items: start;
        }
        @media (max-width: 900px) {
          .settings-grid { grid-template-columns: 1fr; }
        }
        @keyframes saveBarIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}

/* ──────── helpers ──────── */

function SectionHeader({ title }: { title: string }) {
  return (
    <h2
      style={{
        margin: '0 0 1.25rem',
        fontSize: '0.95rem',
        fontWeight: 700,
        color: 'var(--ink)',
      }}
    >
      {title}
    </h2>
  )
}

function Field({
  label,
  hint,
  children,
  style,
}: {
  label: string
  hint?: React.ReactNode
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', ...style }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <label
          style={{
            fontSize: '0.78rem',
            color: 'var(--ink-soft)',
            fontWeight: 600,
          }}
        >
          {label}
        </label>
        {hint && <div style={{ fontSize: '0.72rem' }}>{hint}</div>}
      </div>
      {children}
    </div>
  )
}

function CefrPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
      {CEFR.map((l) => {
        const active = l === value
        return (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            style={{
              minWidth: 48,
              padding: '0.5rem 0.7rem',
              background: active ? 'var(--primary)' : 'var(--surface)',
              color: active ? 'white' : 'var(--ink)',
              border: '1px solid',
              borderColor: active ? 'var(--primary)' : 'var(--border-2)',
              borderRadius: 10,
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Sora, sans-serif',
              boxShadow: active ? '0 2px 6px rgba(94, 158, 46, 0.25)' : 'none',
              transition: 'background-color 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.background = 'var(--surface-2)'
                e.currentTarget.style.borderColor = 'var(--border-2)'
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.background = 'var(--surface)'
              }
            }}
          >
            {l}
          </button>
        )
      })}
    </div>
  )
}

function LanguagePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  // Dozvoli i custom kod (npr. user želi "pt" iako nije u presetu)
  const known = LANGUAGES.find((l) => l.code === value)

  return (
    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
      {LANGUAGES.map((l) => {
        const active = l.code === value
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => onChange(l.code)}
            title={l.name}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.8rem',
              background: active ? 'var(--accent-soft)' : 'var(--surface)',
              color: active ? 'var(--accent-dark)' : 'var(--ink)',
              border: '1px solid',
              borderColor: active ? 'var(--accent)' : 'var(--border-2)',
              borderRadius: 999,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
            }}
          >
            <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{l.flag}</span>
            {l.name}
          </button>
        )
      })}
      {!known && value && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.45rem 0.8rem',
            background: 'var(--surface-2)',
            color: 'var(--ink-soft)',
            border: '1px solid var(--border-2)',
            borderRadius: 999,
            fontSize: '0.82rem',
            fontWeight: 600,
          }}
        >
          Custom: <strong style={{ marginLeft: 4 }}>{value}</strong>
        </span>
      )}
    </div>
  )
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
