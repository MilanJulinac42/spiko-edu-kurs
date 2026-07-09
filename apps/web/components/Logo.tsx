import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Spiko Edu logo — full color PNG (radi i na svetloj i na tamnoj podlozi).
 * `invert` se zadrzava radi kompatibilnosti sa Navbar/Footer pozivima, ali nema vizuelni efekat.
 */
export function Logo({
  className,
  href = '/',
}: {
  className?: string
  invert?: boolean
  href?: string
}) {
  return (
    <Link
      href={href}
      className={cn('inline-flex items-center', className)}
      aria-label="Spiko Edu — početna"
    >
      <Image
        src="/logo.png"
        alt="Spiko Edu"
        width={580}
        height={220}
        priority
        className="h-9 w-auto sm:h-10"
      />
    </Link>
  )
}
