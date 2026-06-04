import { cn } from '@/lib/utils'

export function Section({
  id,
  className,
  children,
}: {
  id?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className={cn('relative', className)}>
      {children}
    </section>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  light = false,
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  light?: boolean
}) {
  const wrap = align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'
  return (
    <div className={wrap}>
      {eyebrow && (
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider',
            light
              ? 'bg-white/10 text-primary-light'
              : 'bg-primary/10 text-primary-dark',
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          'mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl',
          light ? 'text-white' : 'text-ink',
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'mt-4 text-lg leading-relaxed',
            light ? 'text-white/70' : 'text-muted',
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
