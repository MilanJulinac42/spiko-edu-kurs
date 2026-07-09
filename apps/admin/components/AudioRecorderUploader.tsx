'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from './toast'
import { confirmDialog } from './dialog'

/**
 * Reusable audio recorder + uploader. Daje admin-u tri puta da doda audio:
 *  1. Snimi direktno u browseru (MediaRecorder API → mikrofon)
 *  2. Upload .mp3/.m4a/.webm fajla
 *  3. Već postoji audio → prikazuje plejer + dugme Promeni / Obriši
 *
 * Audio se POST-uje na `/admin/audio/upload` (multipart) → backend uploaduje
 * na Bunny Storage i vraća CDN URL.
 */
export function AudioRecorderUploader({
  value,
  onChange,
  label = 'Audio',
  hint,
}: {
  value: string | null
  onChange: (url: string | null) => void
  label?: string
  hint?: string
}) {
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Cleanup pri unmount-u — zatvori mikrofon ako je još uvek aktivan
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [])

  async function startRecording() {
    if (recording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = pickRecordingMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        if (tickRef.current) clearInterval(tickRef.current)
        tickRef.current = null
        setElapsedSec(0)
        await uploadBlob(blob, extFromMime(recorder.mimeType))
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      setElapsedSec(0)
      tickRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000)
    } catch (e) {
      toast.error('Mikrofon nije dostupan', {
        description:
          e instanceof Error
            ? e.message
            : 'Dozvoli pristup mikrofonu u podešavanjima browsera.',
      })
    }
  }

  function stopRecording() {
    if (!recording) return
    recorderRef.current?.stop()
    setRecording(false)
  }

  function cancelRecording() {
    if (!recording) return
    chunksRef.current = []
    recorderRef.current?.stop()
    recorderRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = null
    setRecording(false)
    setElapsedSec(0)
  }

  async function uploadBlob(blob: Blob, ext: string) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', blob, `recording.${ext}`)
      // Eden ne podržava multipart elegantno — direkt fetch sa auth cookie-jem.
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const token = await getAuthToken()
      const res = await fetch(`${apiBase}/admin/audio/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`)
      }
      const data = (await res.json()) as { url: string }
      onChange(data.url)
      toast.success('Audio snimak sačuvan')
    } catch (e) {
      toast.error('Neuspeo upload', {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setUploading(false)
    }
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fajl je veći od 10MB')
      return
    }
    await uploadBlob(file, extFromName(file.name))
    e.target.value = '' // reset da isti fajl može opet
  }

  async function removeAudio() {
    if (!value) return
    const ok = await confirmDialog({
      title: 'Obriši audio snimak?',
      message: 'Snimak će biti uklonjen sa servera i više neće biti dostupan studentima.',
      okLabel: 'Obriši',
      tone: 'danger',
    })
    if (!ok) return
    onChange(null)
    // Backend obrisanje fajla — fire-and-forget, ne blokira UI
    void (async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        const token = await getAuthToken()
        await fetch(`${apiBase}/admin/audio/delete`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ url: value }),
        })
      } catch {
        /* ignore — snimak je već skinut iz DB sa onChange(null) */
      }
    })()
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        padding: '0.85rem 1rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            background: 'var(--primary-soft)',
            color: 'var(--primary-dark)',
            borderRadius: 8,
            flexShrink: 0,
          }}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" />
          </svg>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)' }}>
            {label}
          </p>
          {hint && (
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--muted)' }}>
              {hint}
            </p>
          )}
        </div>
      </div>

      {/* Postoji audio → prikaži plejer + brisanje */}
      {value && !recording && !uploading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <audio
            controls
            src={value}
            style={{ width: '100%', height: 38 }}
            preload="metadata"
          />
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              className="btn ghost"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: '0.78rem' }}
            >
              ↑ Promeni
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={removeAudio}
              style={{ fontSize: '0.78rem', color: 'var(--danger)' }}
            >
              × Obriši
            </button>
          </div>
        </div>
      )}

      {/* Aktivno snimanje */}
      {recording && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.6rem 0.8rem',
            background: 'var(--danger-soft)',
            borderRadius: 10,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: 'var(--danger)',
              animation: 'audioRecPulse 1s ease-in-out infinite',
            }}
          />
          <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger)' }}>
            Snimam… {formatTime(elapsedSec)}
          </span>
          <button
            type="button"
            className="btn"
            onClick={stopRecording}
            style={{ fontSize: '0.78rem' }}
          >
            ⏹ Završi
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={cancelRecording}
            style={{ fontSize: '0.78rem' }}
          >
            Otkaži
          </button>
        </div>
      )}

      {/* Upload u toku */}
      {uploading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.82rem',
            color: 'var(--ink-soft)',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 14,
              height: 14,
              border: '2px solid var(--border-2)',
              borderTopColor: 'var(--primary)',
              borderRadius: 999,
              animation: 'audioRecSpin 0.7s linear infinite',
            }}
          />
          Šaljem snimak…
        </div>
      )}

      {/* Prazno stanje — ponudi snimanje ili upload */}
      {!value && !recording && !uploading && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            onClick={startRecording}
            style={{ fontSize: '0.85rem' }}
          >
            ⏺ Snimi mikrofon
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{ fontSize: '0.85rem' }}
          >
            ↑ Upload fajla
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.webm,.ogg,.wav"
        onChange={onFilePicked}
        style={{ display: 'none' }}
      />

      <style>{`
        @keyframes audioRecPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes audioRecSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

/* ───────── helpers ───────── */

function pickRecordingMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t
  }
  return null
}

function extFromMime(mime: string): string {
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('mp4')) return 'm4a'
  if (mime.includes('mpeg')) return 'mp3'
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('wav')) return 'wav'
  return 'webm'
}

function extFromName(name: string): string {
  const m = name.match(/\.([a-z0-9]{2,5})$/i)
  return m ? m[1].toLowerCase() : 'webm'
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

async function getAuthToken(): Promise<string | null> {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  } catch {
    return null
  }
}
