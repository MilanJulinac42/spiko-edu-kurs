'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AiChat } from './AiChat'

/**
 * Floating AI dugme dole desno (iznad "Sadržaj" drawera) + slide-over chat sa
 * kontekstom konkretne lekcije.
 */
export function LessonAiButton({ lessonId }: { lessonId: string }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Mount flag za React Portal (SSR safety)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Body scroll lock + ESC za zatvaranje
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const drawer = (
    <>
      {/* Overlay — z-[100] da bude iznad navbar-a (z-40) i sticky elemenata */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] bg-ink/60 backdrop-blur-sm"
          aria-hidden
        />
      )}

      {/* Slide-over panel sa desne strane — z-[110] iznad overlay-a */}
      <aside
        className={`fixed inset-y-0 right-0 z-[110] flex w-full max-w-3xl transform flex-col bg-surface shadow-card transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        <header className="flex items-center justify-between border-b border-ink/5 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary-dark">
              ✨ AI tutor
            </p>
            <h2 className="font-display text-lg font-bold text-ink">
              Pomoć za ovu lekciju
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-surface"
            aria-label="Zatvori AI tutor"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <path
                d="M6 6l12 12M6 18L18 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 p-4 sm:p-5">
          <AiChat lessonId={lessonId} showHistory={false} />
        </div>
      </aside>
    </>
  )

  return (
    <>
      {/* FAB — pozicioniran iznad "Sadržaj" dugmeta na mobile-u (bottom-20),
          dole desno na desktopu (bottom-5). */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-5 z-30 flex h-14 items-center gap-2 rounded-full bg-gradient-to-br from-primary to-secondary px-5 text-sm font-bold text-white shadow-card transition-transform hover:scale-105 lg:bottom-5"
        aria-label="Otvori AI tutora"
      >
        <span className="text-lg">✨</span>
        AI tutor
      </button>

      {/* Portal — renderuje overlay+aside na body, izbegava stacking context probleme */}
      {mounted ? createPortal(drawer, document.body) : null}
    </>
  )
}
