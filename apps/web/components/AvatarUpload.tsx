'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL!
const TARGET_SIZE = 512
const JPEG_QUALITY = 0.85
const MAX_INPUT_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Avatar upload sa client-side resize + center-crop na 1:1.
 *
 * Korak po korak:
 *  1. Korisnik bira sliku ili je drag-drop-uje
 *  2. Canvas crta originalnu sliku u centar 512×512 kvadrata (object-cover ponašanje)
 *  3. Canvas → JPEG blob (quality 0.85, ~30-60KB)
 *  4. POST kao multipart/form-data na /me/avatar
 *  5. Server upload-uje u Bunny Storage, vraća nov CDN URL
 *
 * Ovim štedimo Bunny bandwidth + storage (originalne fotke su MB, mi šaljemo KB).
 */
export function AvatarUpload({
  value,
  initials,
  onChange,
}: {
  value: string | null
  initials: string
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
      const blob = await resizeAndCropToJpeg(file, TARGET_SIZE, JPEG_QUALITY)
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Nisi prijavljen.')

      const form = new FormData()
      form.append('file', blob, 'avatar.jpg')

      const res = await fetch(`${API_URL}/me/avatar`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: form,
      })

      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!res.ok) {
        throw new Error(json.error || `Greška ${res.status}`)
      }
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

      const res = await fetch(`${API_URL}/me/avatar`, {
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
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start">
      {/* Preview */}
      <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-soft">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-3xl font-extrabold text-white">{initials}</span>
        )}
      </div>

      {/* Drop / select zone + akcije */}
      <div className="flex-1">
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
          onClick={() => fileRef.current?.click()}
          className={`group flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed bg-white px-5 py-5 text-center transition-all hover:border-primary hover:bg-primary/5 ${
            dragOver ? 'border-primary bg-primary/10' : 'border-ink/15'
          } ${busy ? 'pointer-events-none opacity-60' : ''}`}
        >
          <span className="text-2xl" aria-hidden>
            🖼
          </span>
          <span className="text-sm font-semibold text-ink">
            {busy === 'upload'
              ? 'Šaljem…'
              : value
                ? 'Promeni sliku'
                : 'Klikni ili prevuci sliku'}
          </span>
          <span className="text-xs text-muted">JPEG, PNG ili WebP · do 5 MB</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = '' // omogućava re-upload istog fajla
            }}
          />
        </div>

        {value && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={!!busy}
            className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-60"
          >
            {busy === 'delete' ? 'Brišem…' : '✕ Ukloni sliku'}
          </button>
        )}

        {error && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Učitava sliku, draw-uje je u canvas 512×512 sa centar-crop ponašanjem
 * (object-cover), eksportuje JPEG blob.
 */
async function resizeAndCropToJpeg(
  file: File,
  size: number,
  quality: number,
): Promise<Blob> {
  const bitmap = await loadBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D nije dostupan.')

  // Center crop: skala da kraća strana popuni size, sečenje viška
  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const drawW = bitmap.width * scale
  const drawH = bitmap.height * scale
  const dx = (size - drawW) / 2
  const dy = (size - drawH) / 2

  // Bela pozadina za slučaj transparentnih PNG-ova
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)
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
  // Prefer createImageBitmap kad je dostupan (brže, bez DOM-a)
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      // pad na <img> fallback
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
    // URL.revokeObjectURL je sigurniji posle drawImage-a, ali u praksi browser ga drži
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }
}
