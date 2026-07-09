'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

type LookupResult = {
  translation: string
  explanation: string
  /** true ako reč nije na jeziku koji se uči → ne prikazujemo ništa */
  isNative?: boolean
}

type Props = {
  lessonId: string
  /** CSS selector u kome traži reči. Default = ceo dokument. */
  scopeSelector?: string
}

type Anchor = { x: number; top: number; bottom: number }

/**
 * Word lookup — namerni gest, ne okida se na obično čitanje/selekciju:
 *  - Desktop: DUPLI-KLIK na reč
 *  - Mobilni: DUGI PRITISAK (long-press) na reč
 *
 * Reč se snap-uje na cele granice reči, pa se šalje AI-ju. AI zna koji jezik
 * student uči — ako je reč na maternjem jeziku, ne prevodi je.
 */
export function WordLookupPopup({ lessonId, scopeSelector }: Props) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [word, setWord] = useState('')
  const [result, setResult] = useState<LookupResult | null>(null)
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setAnchor(null)
    setWord('')
    setResult(null)
    setBookmarked(false)
    setError(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  // Pokreni lookup za dati range (snap na cele reči)
  const triggerFromRange = useCallback(
    (range: Range) => {
      const scope = scopeSelector ? document.querySelector(scopeSelector) : document.body
      if (!scope) return

      const node = range.commonAncestorContainer
      const el = node.nodeType === 1 ? (node as HTMLElement) : node.parentElement
      if (!el || !scope.contains(el)) return
      // Ne reaguj na selekciju unutar samog popupa
      if (popupRef.current && popupRef.current.contains(el)) return

      const snapped = expandToWords(range)
      if (!snapped || !isLookupableWord(snapped.text)) return

      const rect = snapped.rect
      const anchorPos = {
        x: rect.left + rect.width / 2 + window.scrollX,
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY,
      }
      // Bez skeleton loadera — popup se otvara tek kad prevod stigne.
      // Dok AI radi, native highlight selekcije služi kao feedback.
      ;(async () => {
        try {
          const { data, error } = await api.ai['quick-lookup'].post({ word: snapped.text, lessonId })
          if (error) return
          const res = data as LookupResult
          // Maternja/nepoznata reč → ne prikazuj ništa
          if (res.isNative || !res.translation?.trim()) return
          setAnchor(anchorPos)
          setWord(snapped.text)
          setError(null)
          setBookmarked(false)
          setResult(res)
          setOpen(true)
          window.getSelection()?.removeAllRanges()
        } catch {
          /* tiho — ne otvaraj popup na grešci */
        }
      })()
    },
    [scopeSelector, lessonId, close],
  )

  // Okidač: selekcija (highlight / drag) ILI dupli-klik.
  // Dupli-klik automatski selektuje reč, pa `pointerup` sa aktivnom selekcijom
  // pokriva oba slučaja. Običan tap/klik (bez selekcije) ne okida ništa.
  useEffect(() => {
    function fromSelection() {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return
      const text = sel.toString().trim()
      if (!text) return
      triggerFromRange(sel.getRangeAt(0).cloneRange())
    }

    function onPointerUp(e: PointerEvent) {
      if (popupRef.current?.contains(e.target as Node)) return
      // Malo odloži da se selekcija stabilizuje posle otpuštanja
      setTimeout(fromSelection, 10)
    }
    function onDblClick(e: MouseEvent) {
      if (popupRef.current?.contains(e.target as Node)) return
      setTimeout(fromSelection, 10)
    }

    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('dblclick', onDblClick)
    return () => {
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('dblclick', onDblClick)
    }
  }, [triggerFromRange])

  // Zatvori na Esc + klik van popupa
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    function onDown(e: PointerEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) close()
    }
    window.addEventListener('keydown', onKey)
    // Odloži da se ne uhvati isti gest koji je otvorio popup
    const t = setTimeout(() => document.addEventListener('pointerdown', onDown), 0)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(t)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open, close])

  async function bookmark() {
    if (!word) return
    setBookmarkLoading(true)
    try {
      await api.me.bookmarks.post({
        lessonId,
        word,
        translation: result?.translation || undefined,
        note: result?.explanation || undefined,
      })
      setBookmarked(true)
    } finally {
      setBookmarkLoading(false)
    }
  }

  if (!open || !anchor) return null

  const popupWidth = 340
  const estimatedPopupHeight = 300
  const left = Math.max(8, Math.min(anchor.x - popupWidth / 2, window.innerWidth - popupWidth - 8))
  const spaceAbove = anchor.top - window.scrollY
  const placeBelow = spaceAbove < estimatedPopupHeight + 12
  const top = placeBelow ? anchor.bottom + 8 : anchor.top - 8

  return (
    <div
      ref={popupRef}
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        transform: placeBelow ? 'translateY(0)' : 'translateY(-100%)',
        zIndex: 60,
        width: `${popupWidth}px`,
        maxWidth: 'calc(100vw - 16px)',
      }}
      className="rounded-2xl border border-ink/10 bg-white p-4 shadow-card animate-fade-in"
    >
      <div className="flex items-start justify-between gap-3 border-b border-ink/5 pb-3">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted">Odabrano</p>
          <p className="mt-0.5 truncate font-semibold text-ink">{word}</p>
        </div>
        <button
          onClick={close}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink"
          aria-label="Zatvori"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
            <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="mt-3">
        {error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : result ? (
          <>
            <p className="font-display text-lg font-bold text-primary-dark">
              {result.translation || '—'}
            </p>
            {result.explanation && (
              <p className="mt-1.5 text-sm leading-relaxed text-ink/80">{result.explanation}</p>
            )}
          </>
        ) : null}
      </div>

      {result && !error && result.translation && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink/5 pt-3">
          {bookmarked ? (
            <span className="text-xs font-semibold text-primary-dark">✓ Sačuvano</span>
          ) : (
            <button
              onClick={bookmark}
              disabled={bookmarkLoading}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-primary-dark hover:text-white disabled:opacity-60"
            >
              ⭐ {bookmarkLoading ? 'Snimam…' : 'Bookmark'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────── Helperi ─────────── */

const WORD_CHAR = /[\p{L}\p{M}\p{N}'’-]/u

/** Proširi range na cele reči sa oba kraja (snap na granice reči). */
function expandToWords(range: Range): { text: string; rect: DOMRect } | null {
  const r = range.cloneRange()
  if (r.startContainer.nodeType === Node.TEXT_NODE) {
    const text = r.startContainer.textContent ?? ''
    let s = r.startOffset
    while (s > 0 && WORD_CHAR.test(text[s - 1])) s--
    r.setStart(r.startContainer, s)
  }
  if (r.endContainer.nodeType === Node.TEXT_NODE) {
    const text = r.endContainer.textContent ?? ''
    let e = r.endOffset
    while (e < text.length && WORD_CHAR.test(text[e])) e++
    r.setEnd(r.endContainer, e)
  }
  const text = r.toString().trim()
  if (!text) return null
  const rect = r.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return null
  return { text, rect }
}

/** Reč vredi tražiti — bar 2 znaka, sadrži bar jedno slovo. */
function isLookupableWord(text: string): boolean {
  if (!text || text.length < 2 || text.length > 80) return false
  return /\p{L}/u.test(text)
}
