'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * Tanak 2px brand progress bar na vrhu ekrana koji se animira pri svakoj
 * promeni rute. Pattern: kreće na 30%, lagano puzi do 80%, na complete
 * skoči do 100% pa fade-out.
 */
export function RouteProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const lastPath = useRef(pathname)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname

    // Clear sve postojeće timer-e
    timers.current.forEach(clearTimeout)
    timers.current = []

    setVisible(true)
    setProgress(30)

    // Postepeno puzi: 30 → 60 → 80 → 95 (čeka stvarni paint)
    timers.current.push(setTimeout(() => setProgress(60), 80))
    timers.current.push(setTimeout(() => setProgress(80), 220))
    timers.current.push(setTimeout(() => setProgress(95), 450))

    // Na sledeći paint smatraj da je stranica spremna → 100 + fade
    timers.current.push(
      setTimeout(() => {
        setProgress(100)
        timers.current.push(
          setTimeout(() => {
            setVisible(false)
            setProgress(0)
          }, 220),
        )
      }, 600),
    )

    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [pathname])

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: 'transparent',
        zIndex: 200,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.18s ease',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--primary), var(--accent))',
          boxShadow: '0 0 8px rgba(134, 196, 64, 0.5)',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </div>
  )
}
