import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  invert = false,
  href = '/dashboard',
}: {
  className?: string
  invert?: boolean
  href?: string
}) {
  return (
    <Link
      href={href}
      className={cn('group inline-flex items-center text-2xl font-extrabold tracking-tight', className)}
      aria-label="Spiko Edu — početna"
    >
      <span className="font-display text-primary">spik</span>
      <span
        className="relative inline-flex h-[1.05em] w-[1.05em] items-center justify-center"
        aria-hidden
      >
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <circle cx="20" cy="20" r="19" className="fill-secondary" />
          <path
            d="M20 1a19 19 0 0 0 0 38M3 14h34M3 26h34M20 1c6 6 6 32 0 38M20 1c-6 6-6 32 0 38"
            className="stroke-white/70"
            strokeWidth="1.4"
            fill="none"
          />
          <path
            d="M9 11c3 1 5 0 7 2s5 1 5 4-3 2-2 5-4 2-6 1-1-4-4-5-2-6 0-7Z"
            className="fill-primary"
          />
          <path
            d="M27 24c2-1 4 0 5 2s-1 4-3 4-3-1-3-3 0-2 1-3Z"
            className="fill-primary"
          />
        </svg>
      </span>
      <span className={cn('font-display', invert ? 'text-white' : 'text-ink')}> edu</span>
    </Link>
  )
}
