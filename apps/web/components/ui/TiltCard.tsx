'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Kartica sa 3D tilt efektom na hover + spotlight koji prati kursor,
 * sa ugradjenim scroll-reveal-om (stagger preko `index`).
 */
export function TiltCard({
  children,
  className,
  index = 0,
  glow = true,
  max = 7,
}: {
  children: React.ReactNode
  className?: string
  index?: number
  glow?: boolean
  max?: number
}) {
  const outer = useRef<HTMLDivElement | null>(null)
  const inner = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)
  const reduce = useRef(false)

  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = outer.current
    if (!el) return
    const inView = () => {
      const r = el.getBoundingClientRect()
      return r.top < window.innerHeight * 0.92 && r.bottom > 0
    }
    if (inView()) {
      setVisible(true)
      return
    }
    let io: IntersectionObserver | undefined
    const onScroll = () => {
      if (inView()) reveal()
    }
    const reveal = () => {
      setVisible(true)
      cleanup()
    }
    function cleanup() {
      io?.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) reveal()
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
      )
      io.observe(el)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return cleanup
  }, [])

  const onMove = (e: React.PointerEvent) => {
    if (reduce.current || e.pointerType === 'touch') return
    const host = outer.current
    const el = inner.current
    if (!host || !el) return
    const r = host.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    const rx = (0.5 - py) * max
    const ry = (px - 0.5) * max
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`
  }

  const onLeave = () => {
    const el = inner.current
    if (el) el.style.transform = ''
  }

  return (
    <div
      ref={outer}
      className={cn('reveal-item h-full', visible && 'is-visible')}
      style={{ animationDelay: `${index * 0.08}s` }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div
        ref={inner}
        className={cn('tilt-inner h-full', glow && 'tilt-glow', className)}
      >
        {children}
      </div>
    </div>
  )
}
