'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Video plejer koji se "otkači" u floating mini-player kad student skroluje
 * van. Isti iframe DOM node, samo se menja CSS pozicija — bez reload-a.
 *
 * UX:
 * - Inline mode: u toku flow-a, klasičan aspect-video u kartici.
 * - Floating mode: bottom-right, 320×180, sa close × i expand ⤢ kontrolama.
 *   Placeholder kartica u originalnom mestu ostaje da scroll target ne skoči.
 */
export function FloatingVideoBlock({
  embedUrl,
  ready,
}: {
  embedUrl: string | null
  ready: boolean
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [floating, setFloating] = useState(false)
  // Korisnik je manuelno zatvorio float — ne pokazuj ga ponovo dok ne osveži lekciju
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!ready || !embedUrl || dismissed) return
    const target = wrapperRef.current
    if (!target) return

    // Trigger pre nego što video u potpunosti nestane sa ekrana — kad više
    // od 30% nije vidljivo (rootMargin -100px gore da float ne iskoči odmah)
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setFloating(!entry.isIntersecting)
        }
      },
      { threshold: 0, rootMargin: '-120px 0px 0px 0px' },
    )

    obs.observe(target)
    return () => obs.disconnect()
  }, [ready, embedUrl, dismissed])

  // Ako video nije spreman, prikaži "priprema se" panel
  if (!ready || !embedUrl) {
    return (
      <div className="aspect-video rounded-t-3xl bg-gradient-to-br from-ink to-ink-soft">
        <div className="flex h-full flex-col items-center justify-center p-10 text-center">
          <div className="text-5xl">⏳</div>
          <p className="mt-4 font-display text-xl font-bold text-white">
            Video se priprema
          </p>
          <p className="mt-2 max-w-md text-sm text-white/70">
            Bunny još obrađuje fajl. Vrati se za par minuta.
          </p>
        </div>
      </div>
    )
  }

  function scrollBackToVideo() {
    wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function dismiss() {
    setDismissed(true)
    setFloating(false)
  }

  const isFloating = floating && !dismissed

  return (
    <div ref={wrapperRef} className="relative">
      {/* Placeholder kartica koja drži layout kad iframe ode u float */}
      {isFloating && (
        <div className="relative aspect-video overflow-hidden rounded-t-3xl bg-ink/95">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white/80">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m10 9 5 3-5 3V9Z" />
            </svg>
            <div>
              <p className="font-display text-sm font-bold">
                Video je u mini-plejeru
              </p>
              <button
                onClick={scrollBackToVideo}
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/20"
              >
                Vrati video ovde ↑
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sam iframe — isti DOM node u oba moda, samo se CSS klasa menja */}
      <div
        className={cn(
          'transition-all duration-200 ease-out',
          isFloating
            ? 'pip-floating'
            : 'pip-inline relative aspect-video overflow-hidden rounded-t-3xl bg-black',
        )}
      >
        <iframe
          src={embedUrl}
          loading="lazy"
          allow="accelerometer; gyroscope; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
          style={{ borderRadius: 'inherit' }}
        />

        {/* Floating mode kontrole */}
        {isFloating && (
          <div className="absolute right-2 top-2 z-10 flex gap-1">
            <button
              onClick={scrollBackToVideo}
              title="Vrati u glavni plejer"
              className="grid h-7 w-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6" />
                <path d="M9 21H3v-6" />
                <path d="M21 3 14 10" />
                <path d="M3 21l7-7" />
              </svg>
            </button>
            <button
              onClick={dismiss}
              title="Zatvori mini-plejer"
              className="grid h-7 w-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        :global(.pip-floating) {
          position: fixed;
          bottom: 1.25rem;
          right: 1.25rem;
          width: min(360px, calc(100vw - 2rem));
          aspect-ratio: 16 / 9;
          z-index: 60;
          border-radius: 14px;
          overflow: hidden;
          background: black;
          box-shadow:
            0 12px 32px -6px rgba(0, 0, 0, 0.35),
            0 4px 12px -4px rgba(0, 0, 0, 0.25);
          animation: pipPop 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes pipPop {
          from { transform: scale(0.85) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @media (max-width: 640px) {
          :global(.pip-floating) {
            bottom: 0.75rem;
            right: 0.75rem;
            width: min(260px, calc(100vw - 1.5rem));
          }
        }
      `}</style>
    </div>
  )
}
