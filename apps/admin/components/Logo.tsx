import Link from 'next/link'
import Image from 'next/image'

/**
 * Spiko Edu logo — full color PNG. Visina kontroliše `size` (default 36px),
 * širina se računa automatski iz aspect ratio-a (580×220).
 */
export function Logo({ href = '/', size = 36 }: { href?: string; size?: number }) {
  return (
    <Link
      href={href}
      aria-label="Spiko Edu — početna"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        textDecoration: 'none',
        lineHeight: 0,
      }}
    >
      <Image
        src="/logo.png"
        alt="Spiko Edu"
        width={580}
        height={220}
        priority
        style={{ height: `${size}px`, width: 'auto' }}
      />
    </Link>
  )
}
