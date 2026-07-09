'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * Tanka progress traka na vrhu koja se pojavi pri navigaciji između stranica.
 * Nije savršen indikator jer Next.js App Router ne emituje navigation events,
 * ali daje dobar vizuelni signal pri prvom paint-u nove rute.
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Pri promeni rute, kratko prikaži progress
    setVisible(true)
    setProgress(20)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    const steps = [
      { ms: 50, p: 40 },
      { ms: 150, p: 70 },
      { ms: 300, p: 92 },
    ]
    const timers = steps.map(({ ms, p }) => setTimeout(() => setProgress(p), ms))

    timeoutRef.current = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 200)
    }, 450)

    return () => {
      timers.forEach(clearTimeout)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[100] h-0.5"
      aria-hidden
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-primary-light to-secondary shadow-[0_0_10px_rgba(134,196,64,0.6)]"
        style={{
          width: `${progress}%`,
          transition: 'width 0.25s ease-out, opacity 0.2s',
          opacity: progress < 100 ? 1 : 0,
        }}
      />
    </div>
  )
}
