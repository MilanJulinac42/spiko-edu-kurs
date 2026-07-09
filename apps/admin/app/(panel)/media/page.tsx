'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { EmptyState, EmptyIconMedia } from '@/components/EmptyState'
import { Skeleton } from '@/components/Skeleton'
import { confirmDialog } from '@/components/dialog'
import { toast } from '@/components/toast'

type Usage = {
  lessonId: string
  lessonTitle: string
  lessonStatus: string
  moduleTitle: string | null
  courseTitle: string | null
  courseSlug: string | null
  courseId: string | null
}

type MediaItem = {
  guid: string
  title: string
  dateUploaded: string
  length: number
  storageSize: number
  status: number
  encodeProgress: number
  width: number
  height: number
  views: number
  thumbnailUrl: string | null
  usage: Usage[]
  isOrphan: boolean
}

type MediaResp = {
  total: number
  orphans: number
  ready: number
  processing: number
  errors: number
  totalBytes: number
  totalSeconds: number
  items: MediaItem[]
}

type Filter = 'all' | 'used' | 'orphan' | 'processing' | 'error'

export default function MediaPage() {
  const [data, setData] = useState<MediaResp | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [cleaningUp, setCleaningUp] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: apiError } = await api.admin.media.videos.get()
      if (apiError) throw new Error(String(apiError.value ?? apiError.status))
      setData(data as MediaResp)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function deleteVideo(v: MediaItem) {
    const usageDesc =
      v.usage.length > 0
        ? `OPREZ: Video je u upotrebi u ${v.usage.length} lekcij${v.usage.length === 1 ? 'i' : 'a'}. Lekcije neće biti obrisane, ali video u njima više neće raditi.`
        : 'Video nije u upotrebi ni u jednoj lekciji.'
    const ok = await confirmDialog({
      title: `Obriši "${v.title || 'video bez naslova'}"?`,
      message: `${usageDesc} Brisanje sa Bunny biblioteke je trajno.`,
      okLabel: 'Obriši video',
      tone: 'danger',
    })
    if (!ok) return
    try {
      await api.admin.bunny.videos({ videoId: v.guid }).delete()
      toast.success('Video obrisan')
      await load()
    } catch (e) {
      toast.error('Neuspelo brisanje', {
        description: e instanceof Error ? e.message : String(e),
      })
    }
  }

  async function cleanupOrphans() {
    if (!data || data.orphans === 0) return
    const ok = await confirmDialog({
      title: `Obriši ${data.orphans} siroče?`,
      message:
        'Obrisaće se svi videi koji nisu povezani ni sa jednom lekcijom. Ova radnja se ne može poništiti.',
      okLabel: `Obriši ${data.orphans}`,
      tone: 'danger',
    })
    if (!ok) return
    setCleaningUp(true)
    try {
      const { data: result, error: apiError } = await api.admin.media['cleanup-orphans'].post()
      if (apiError) throw new Error(String(apiError.value ?? apiError.status))
      const r = result as { deleted: number; total: number; errors: Array<{ guid: string; error: string }> }
      if (r.errors.length > 0) {
        toast.error(`Obrisano ${r.deleted}/${r.total}, ${r.errors.length} sa greškom`, {
          description: r.errors[0].error,
        })
      } else {
        toast.success(`Obrisano ${r.deleted} siroče`)
      }
      await load()
    } catch (e) {
      toast.error('Neuspelo čišćenje', {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setCleaningUp(false)
    }
  }

  const filtered = useMemo(() => {
    if (!data) return []
    switch (filter) {
      case 'used':
        return data.items.filter((v) => !v.isOrphan)
      case 'orphan':
        return data.items.filter((v) => v.isOrphan)
      case 'processing':
        return data.items.filter((v) => v.status >= 1 && v.status <= 3)
      case 'error':
        return data.items.filter((v) => v.status === 5 || v.status === 6)
      default:
        return data.items
    }
  }, [data, filter])

  return (
    <div>
      <div
        className="row between"
        style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Mediji</h1>
          <p style={{ margin: '0.3rem 0 0', color: 'var(--ink-soft)', fontSize: '0.88rem' }}>
            Sve što je uploadovano na Bunny Stream biblioteku.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className="btn secondary"
            onClick={load}
            disabled={loading}
            title="Osveži"
          >
            ↻ Osveži
          </button>
          {data && data.orphans > 0 && (
            <button
              className="btn"
              onClick={cleanupOrphans}
              disabled={cleaningUp}
              style={{
                background: 'var(--danger)',
                backgroundImage: 'none',
              }}
            >
              {cleaningUp
                ? 'Brišem…'
                : `Obriši ${data.orphans} siroče`}
            </button>
          )}
        </div>
      </div>

      {/* Stat strip */}
      {!loading && data && (
        <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
          <MediaStat
            label="Ukupno video-a"
            value={data.total}
            hint={formatDuration(data.totalSeconds)}
            tone="primary"
          />
          <MediaStat
            label="Spremnih"
            value={data.ready}
            hint={`${data.processing} u obradi`}
            tone="primary"
          />
          <MediaStat
            label="Siročad"
            value={data.orphans}
            hint={data.orphans > 0 ? 'Nisu u lekciji' : 'Sve je iskorišćeno'}
            tone={data.orphans > 0 ? 'warning' : 'muted'}
          />
          <MediaStat
            label="Storage"
            value={formatBytes(data.totalBytes)}
            hint="Bunny Stream"
            tone="accent"
          />
        </div>
      )}

      {/* Filter pills */}
      {!loading && data && data.items.length > 0 && (
        <div
          className="row"
          style={{ marginBottom: '1rem', gap: '0.4rem', flexWrap: 'wrap' }}
        >
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
            Sve ({data.total})
          </FilterPill>
          <FilterPill active={filter === 'used'} onClick={() => setFilter('used')}>
            U upotrebi ({data.total - data.orphans})
          </FilterPill>
          <FilterPill active={filter === 'orphan'} onClick={() => setFilter('orphan')}>
            Siročad ({data.orphans})
          </FilterPill>
          {data.processing > 0 && (
            <FilterPill
              active={filter === 'processing'}
              onClick={() => setFilter('processing')}
            >
              U obradi ({data.processing})
            </FilterPill>
          )}
          {data.errors > 0 && (
            <FilterPill active={filter === 'error'} onClick={() => setFilter('error')}>
              Greška ({data.errors})
            </FilterPill>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <MediaGridSkeleton />
      ) : error ? (
        <div className="panel" style={{ color: 'var(--danger)' }}>
          {error}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <EmptyState
            icon={<EmptyIconMedia />}
            title="Bunny biblioteka je prazna"
            description="Kad uploaduješ prvi video preko lekcije, pojaviće se ovde."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <EmptyState
            icon={<EmptyIconMedia />}
            title="Nema video-a u ovom filteru"
            description="Promeni filter gore da vidiš ostale."
          />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {filtered.map((v) => (
            <MediaCard key={v.guid} video={v} onDelete={() => deleteVideo(v)} />
          ))}
        </div>
      )}
    </div>
  )
}

function MediaCard({ video, onDelete }: { video: MediaItem; onDelete: () => void }) {
  const status = STATUS_INFO[video.status] ?? { label: `kod ${video.status}`, tone: 'muted' as const }
  const isReady = video.status === 4
  const isError = video.status === 5 || video.status === 6

  function copyId() {
    navigator.clipboard.writeText(video.guid)
    toast.success('GUID kopiran', { description: video.guid.slice(0, 12) + '…' })
  }

  return (
    <article
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-soft)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow-soft)'
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '16 / 9',
          background: '#0a0c10',
          overflow: 'hidden',
        }}
      >
        {video.thumbnailUrl && isReady ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            {isError ? (
              <span style={{ fontSize: '2rem' }}>⚠</span>
            ) : (
              <span style={{ fontSize: '0.8rem', textAlign: 'center', padding: '0 1rem' }}>
                {!isReady ? `${video.encodeProgress ?? 0}% obrađeno` : 'bez thumbnail-a'}
              </span>
            )}
          </div>
        )}

        {/* Duration overlay */}
        {video.length > 0 && (
          <span
            style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: '0.72rem',
              fontWeight: 600,
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            {formatDuration(video.length)}
          </span>
        )}

        {/* Status badge top-left */}
        <span
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            background: status.tone === 'success'
              ? 'var(--primary-soft)'
              : status.tone === 'warning'
                ? 'var(--warning-soft)'
                : status.tone === 'danger'
                  ? 'var(--danger-soft)'
                  : 'rgba(255,255,255,0.85)',
            color: status.tone === 'success'
              ? 'var(--primary-dark)'
              : status.tone === 'warning'
                ? 'var(--warning)'
                : status.tone === 'danger'
                  ? 'var(--danger)'
                  : 'var(--ink-soft)',
            padding: '3px 8px',
            borderRadius: 999,
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {status.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '0.85rem 1rem 0.6rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h3
          style={{
            margin: 0,
            fontSize: '0.95rem',
            lineHeight: 1.3,
            color: 'var(--ink)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={video.title}
        >
          {video.title || '(bez naslova)'}
        </h3>

        {/* Usage */}
        {video.isOrphan ? (
          <span
            style={{
              alignSelf: 'flex-start',
              background: 'var(--warning-soft)',
              color: 'var(--warning)',
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            ⚠ Siroče
          </span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {video.usage.slice(0, 2).map((u) => (
              <Link
                key={u.lessonId}
                href={u.courseId ? `/courses/${u.courseId}` : '#'}
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--ink-soft)',
                  textDecoration: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={`${u.courseTitle ?? '?'} · ${u.moduleTitle ?? '?'} · ${u.lessonTitle}`}
              >
                📘 {u.courseTitle ?? '?'} · {u.lessonTitle}
              </Link>
            ))}
            {video.usage.length > 2 && (
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                + još {video.usage.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Meta footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'auto',
            fontSize: '0.7rem',
            color: 'var(--muted)',
            paddingTop: '0.4rem',
          }}
        >
          <span>
            {formatBytes(video.storageSize)} · {video.views} {video.views === 1 ? 'gledanje' : 'gledanja'}
          </span>
          <span>{video.width}×{video.height || '?'}</span>
        </div>
      </div>

      {/* Action footer */}
      <div
        style={{
          display: 'flex',
          gap: '0.3rem',
          padding: '0.5rem 0.75rem 0.75rem',
          borderTop: '1px solid var(--border)',
        }}
      >
        <button
          className="btn ghost"
          onClick={copyId}
          title="Kopiraj GUID"
          style={{ flex: 1, fontSize: '0.78rem' }}
        >
          ⎘ Kopiraj ID
        </button>
        <button
          className="btn ghost"
          onClick={onDelete}
          title="Obriši"
          style={{ color: 'var(--danger)' }}
        >
          ×
        </button>
      </div>
    </article>
  )
}

/* ───────────── helpers ───────────── */

function MediaStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string | number
  hint?: string
  tone?: 'primary' | 'accent' | 'warning' | 'muted'
}) {
  const dotStyle: React.CSSProperties = (() => {
    switch (tone) {
      case 'accent':
        return { background: 'var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft)' }
      case 'warning':
        return { background: 'var(--warning)', boxShadow: '0 0 0 3px var(--warning-soft)' }
      case 'muted':
        return { background: 'var(--border-2)' }
      default:
        return { background: 'var(--primary)', boxShadow: '0 0 0 3px var(--primary-soft)' }
    }
  })()
  return (
    <div className="stat-card">
      <div className="stat-card-label">
        <span className="stat-card-dot" style={dotStyle} />
        {label}
      </div>
      <div className="stat-card-value">{value}</div>
      {hint && <div className="stat-card-hint">{hint}</div>}
    </div>
  )
}

function FilterPill({
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
        background: active ? 'var(--primary-soft)' : 'transparent',
        color: active ? 'var(--primary-dark)' : 'var(--ink-soft)',
        border: '1px solid',
        borderColor: active ? 'var(--primary)' : 'var(--border-2)',
        padding: '0.45rem 0.9rem',
        borderRadius: 999,
        fontSize: '0.82rem',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function MediaGridSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      }}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-soft)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Skeleton width="100%" height={158} radius={0} />
          <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton width="80%" height={14} />
            <Skeleton width="60%" height={11} />
            <Skeleton width="40%" height={10} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Status kodovi iz Bunny-ja: 0 Created · 1 Uploaded · 2 Processing · 3 Transcoding · 4 Finished · 5 Error · 6 UploadFailed */
const STATUS_INFO: Record<number, { label: string; tone: 'success' | 'warning' | 'danger' | 'muted' }> = {
  0: { label: 'Kreiran', tone: 'muted' },
  1: { label: 'Uploadovan', tone: 'warning' },
  2: { label: 'Obrada', tone: 'warning' },
  3: { label: 'Encoding', tone: 'warning' },
  4: { label: 'Spreman', tone: 'success' },
  5: { label: 'Greška', tone: 'danger' },
  6: { label: 'Upload neuspeo', tone: 'danger' },
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 1) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`
}
