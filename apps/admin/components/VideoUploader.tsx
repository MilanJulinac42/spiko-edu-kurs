'use client'

import { useRef, useState } from 'react'
import * as tus from 'tus-js-client'
import { api } from '@/lib/api'

type Stage = 'idle' | 'creating' | 'uploading' | 'done' | 'error'

export function VideoUploader({
  initialVideoId,
  defaultTitle,
  onUploaded,
}: {
  initialVideoId?: string | null
  defaultTitle: string
  onUploaded: (videoId: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<tus.Upload | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [percent, setPercent] = useState(0)
  const [speedMBs, setSpeedMBs] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(initialVideoId ?? null)
  const [filename, setFilename] = useState<string>('')

  async function startUpload(file: File) {
    setError(null)
    setFilename(file.name)
    setStage('creating')

    try {
      // 1) Backend kreira prazan video u Bunny i vraća TUS auth
      const { data, error: apiError } = await api.admin.bunny.videos.post({
        title: defaultTitle || file.name,
      })
      if (apiError) throw new Error(String(apiError.value ?? apiError.status))
      const ctx = data as {
        videoId: string
        endpoint: string
        libraryId: string
        signature: string
        expires: number
      }
      setVideoId(ctx.videoId)

      // 2) Browser uploaduje direktno u Bunny TUS endpoint
      setStage('uploading')
      let lastTime = Date.now()
      let lastBytes = 0

      const upload = new tus.Upload(file, {
        endpoint: ctx.endpoint,
        retryDelays: [0, 1000, 3000, 5000, 10000],
        metadata: {
          filetype: file.type,
          title: defaultTitle || file.name,
        },
        headers: {
          AuthorizationSignature: ctx.signature,
          AuthorizationExpire: String(ctx.expires),
          VideoId: ctx.videoId,
          LibraryId: ctx.libraryId,
        },
        onError: (err) => {
          uploadRef.current = null
          setStage('error')
          setError(err.message)
        },
        onProgress: (sent, total) => {
          const now = Date.now()
          const dt = (now - lastTime) / 1000
          if (dt > 0.4) {
            const dbytes = sent - lastBytes
            setSpeedMBs(dbytes / dt / (1024 * 1024))
            lastTime = now
            lastBytes = sent
          }
          setPercent(Math.round((sent / total) * 100))
        },
        onSuccess: () => {
          uploadRef.current = null
          setStage('done')
          setPercent(100)
          onUploaded(ctx.videoId)
        },
      })
      uploadRef.current = upload
      upload.start()
    } catch (e) {
      setStage('error')
      setError(e instanceof Error ? e.message : 'Greška')
    }
  }

  function cancel() {
    if (uploadRef.current) {
      uploadRef.current.abort()
      uploadRef.current = null
    }
    setStage('idle')
    setPercent(0)
  }

  function reset() {
    setStage('idle')
    setPercent(0)
    setError(null)
    setVideoId(null)
    setFilename('')
  }

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) startUpload(file)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) startUpload(file)
  }

  // ───── existing video (već uploadovan ranije) ─────
  if (stage === 'idle' && videoId) {
    return <VideoPreviewCard videoId={videoId} onReplace={reset} />
  }

  // ───── upload u toku ─────
  if (stage === 'creating' || stage === 'uploading') {
    return (
      <div className="rounded-2xl border border-primary/30 bg-white p-5">
        <div className="row between" style={{ marginBottom: '0.75rem' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              className="truncate text-sm font-bold text-ink"
              title={filename}
            >
              {filename}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {stage === 'creating'
                ? 'Kreiram video stavku u Bunny…'
                : `${percent}% · ${speedMBs.toFixed(1)} MB/s`}
            </p>
          </div>
          <button className="btn ghost" onClick={cancel} style={{ color: 'var(--danger)' }}>
            Otkaži
          </button>
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: 'var(--panel-2)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percent}%`,
              background: 'linear-gradient(90deg, #6366f1, #818cf8)',
              transition: 'width 0.25s ease-out',
            }}
          />
        </div>
      </div>
    )
  }

  // ───── posle uspeha (just done) ─────
  if (stage === 'done' && videoId) {
    return <VideoPreviewCard videoId={videoId} onReplace={reset} justUploaded />
  }

  // ───── error ─────
  if (stage === 'error') {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--danger)' }}>
          Greška
        </p>
        <p className="mt-1 text-sm text-ink/85">{error}</p>
        <button className="btn secondary" onClick={reset} style={{ marginTop: '0.75rem' }}>
          Probaj ponovo
        </button>
      </div>
    )
  }

  // ───── idle drag-drop dropzone ─────
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="cursor-pointer rounded-2xl border-2 border-dashed bg-white p-8 text-center transition-colors"
      style={{
        borderColor: 'var(--border-2)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        style={{ display: 'none' }}
        onChange={handlePick}
      />
      <div className="text-4xl">📤</div>
      <p className="mt-3 font-display text-base font-bold text-ink">
        Prevuci video ovde ili klikni da izabereš
      </p>
      <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
        MP4, MOV, WEBM, MKV — Bunny obrađuje sve formate. Bez limita veličine
        sa naše strane.
      </p>
    </div>
  )
}

/* ────────── VideoPreviewCard ────────── */

function VideoPreviewCard({
  videoId,
  onReplace,
  justUploaded,
}: {
  videoId: string
  onReplace: () => void
  justUploaded?: boolean
}) {
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID
  const embedUrl = libraryId
    ? `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false`
    : null

  return (
    <div
      style={{
        background: 'var(--panel-2)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Player */}
      {embedUrl ? (
        <div
          style={{
            position: 'relative',
            paddingBottom: '56.25%',
            background: '#000',
          }}
        >
          <iframe
            src={embedUrl}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 0,
            }}
            title="Bunny preview"
          />
        </div>
      ) : (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: '0.85rem',
          }}
        >
          Postavi <code>NEXT_PUBLIC_BUNNY_LIBRARY_ID</code> u admin <code>.env.local</code> da
          vidiš preview.
        </div>
      )}

      {/* Meta + actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          borderTop: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: justUploaded ? '#86efac' : 'var(--muted)',
            }}
          >
            {justUploaded ? '✓ Upload završen' : 'Video u lekciji'}
          </p>
          <p style={{ margin: '0.2rem 0 0', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--muted)' }}>
            {videoId}
          </p>
          {justUploaded && (
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
              Bunny obrađuje video — može da potraje par minuta. Plejer iznad pokazuje progres.
            </p>
          )}
        </div>
        <button className="btn secondary" onClick={onReplace}>
          Zameni video
        </button>
      </div>
    </div>
  )
}
