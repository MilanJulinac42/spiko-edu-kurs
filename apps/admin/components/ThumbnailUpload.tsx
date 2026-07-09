'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL!
const TARGET_W = 1280
const TARGET_H = 720 // 16:9
const JPEG_QUALITY = 0.85
const MAX_INPUT_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Course thumbnail upload sa client-side resize + center-crop na 16:9 (1280×720).
 *
 * Korak po korak:
 *  1. Korisnik bira sliku ili je drag-drop-uje
 *  2. Canvas crta originalnu sliku u 1280×720 sa center-crop ponašanjem (object-cover)
 *  3. Canvas → JPEG blob (quality 0.85, ~100-200KB)
 *  4. POST kao multipart/form-data na /admin/courses/:id/thumbnail
 *  5. Server upload-uje u Bunny Storage, update-uje courses.thumbnailUrl, vraća nov URL
 *
 * Tako štedimo Bunny bandwidth + storage (originalne fotke su MB, mi šaljemo KB).
 */
export function ThumbnailUpload({
  courseId,
  value,
  title,
  onChange,
}: {
  courseId: string
  value: string | null
  /** Za prikaz u placeholder-u kad nema slike */
  title: string
  onChange: (url: string | null) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'upload' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Izaberi sliku (JPEG, PNG ili WebP).')
      return
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError(`Slika je prevelika (max ${MAX_INPUT_BYTES / 1024 / 1024} MB).`)
      return
    }

    setBusy('upload')
    try {
      const blob = await resizeAndCropToJpeg(file, TARGET_W, TARGET_H, JPEG_QUALITY)
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Nisi prijavljen.')

      const form = new FormData()
      form.append('file', blob, 'thumbnail.jpg')

      const res = await fetch(`${API_URL}/admin/courses/${courseId}/thumbnail`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: form,
      })

      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!res.ok) throw new Error(json.error || `Greška ${res.status}`)
      if (!json.url) throw new Error('Nedostaje URL u odgovoru.')

      onChange(json.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška prilikom upload-a.')
    } finally {
      setBusy(null)
    }
  }

  async function handleDelete() {
    if (!value) return
    setError(null)
    setBusy('delete')
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Nisi prijavljen.')

      const res = await fetch(`${API_URL}/admin/courses/${courseId}/thumbnail`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(json.error || `Greška ${res.status}`)
      }
      onChange(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška prilikom brisanja.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {/* Drop zone / Preview */}
      <div
        onDragEnter={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files?.[0]
          if (file) handleFile(file)
        }}
        onClick={() => !busy && fileRef.current?.click()}
        role="button"
        tabIndex={0}
        style={{
          position: 'relative',
          aspectRatio: '16 / 9',
          background: value
            ? 'var(--surface-2)'
            : 'linear-gradient(135deg, var(--primary-soft) 0%, var(--accent-soft) 100%)',
          border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border-2)'}`,
          borderRadius: 'var(--r-md)',
          overflow: 'hidden',
          cursor: busy ? 'wait' : 'pointer',
          opacity: busy ? 0.7 : 1,
          transition: 'border-color 0.15s, opacity 0.15s',
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={title || 'Thumbnail'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
              color: 'var(--ink-soft)',
              fontSize: '0.85rem',
              textAlign: 'center',
              padding: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>🖼️</div>
              <div style={{ fontWeight: 600 }}>
                {busy === 'upload' ? 'Šaljem…' : 'Klikni ili prevuci sliku'}
              </div>
              <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 4 }}>
                JPEG / PNG / WebP · 16:9 · do 5 MB
              </div>
            </div>
          </div>
        )}

        {/* Overlay sa "Promeni sliku" za postojeću sliku */}
        {value && !busy && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(14, 22, 34, 0.55)',
              opacity: 0,
              transition: 'opacity 0.15s',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0'
            }}
          >
            🔄 Promeni sliku
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = '' // omogući re-upload istog fajla
          }}
        />
      </div>

      {value && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={!!busy}
          style={{
            alignSelf: 'flex-start',
            background: 'transparent',
            border: 'none',
            color: 'var(--danger, #dc2626)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: busy ? 'wait' : 'pointer',
            padding: '2px 0',
          }}
        >
          {busy === 'delete' ? 'Brišem…' : '✕ Ukloni sliku'}
        </button>
      )}

      {error && (
        <div
          style={{
            background: 'rgba(220, 38, 38, 0.08)',
            color: '#b91c1c',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--r-sm, 6px)',
            fontSize: '0.78rem',
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}

/**
 * Učitava sliku, draw-uje je u 1280×720 canvas sa center-crop ponašanjem,
 * eksportuje JPEG blob.
 */
async function resizeAndCropToJpeg(
  file: File,
  targetW: number,
  targetH: number,
  quality: number,
): Promise<Blob> {
  const bitmap = await loadBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D nije dostupan.')

  const srcW = 'width' in bitmap ? bitmap.width : (bitmap as ImageBitmap).width
  const srcH = 'height' in bitmap ? bitmap.height : (bitmap as ImageBitmap).height

  // Object-cover skala: kraća strana popunjava, viška se odseca
  const scale = Math.max(targetW / srcW, targetH / srcH)
  const drawW = srcW * scale
  const drawH = srcH * scale
  const dx = (targetW - drawW) / 2
  const dy = (targetH - drawH) / 2

  // Bela pozadina za PNG sa providnošću
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, targetW, targetH)
  ctx.drawImage(bitmap, dx, dy, drawW, drawH)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas → JPEG konverzija nije uspela.'))
      },
      'image/jpeg',
      quality,
    )
  })
}

async function loadBitmap(file: File): Promise<HTMLImageElement | ImageBitmap> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      // fallback ispod
    }
  }
  const url = URL.createObjectURL(file)
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Slika ne može da se učita.'))
      img.src = url
    })
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }
}
