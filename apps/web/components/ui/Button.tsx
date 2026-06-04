import Link from 'next/link'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:opacity-60 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-ink shadow-soft hover:bg-primary-dark hover:-translate-y-0.5 hover:text-white',
  secondary:
    'bg-secondary text-white shadow-soft hover:bg-secondary-dark hover:-translate-y-0.5',
  outline:
    'border-2 border-ink/15 text-ink hover:border-primary hover:text-primary-dark',
  ghost: 'text-ink hover:text-primary-dark',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-8 text-base',
}

type BaseProps = {
  variant?: Variant
  size?: Size
  className?: string
  children: React.ReactNode
}

type LinkProps = BaseProps &
  Omit<React.ComponentProps<typeof Link>, 'className' | 'children'> & { href: string }

type ButtonProps = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { href?: undefined }

export function Button(props: LinkProps | ButtonProps) {
  const { variant = 'primary', size = 'md', className, children } = props
  const classes = cn(base, variants[variant], sizes[size], className)

  if (props.href) {
    const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props as LinkProps
    return (
      <Link className={classes} {...rest}>
        {children}
      </Link>
    )
  }
  const { variant: _v, size: _s, className: _c, children: _ch, href: _h, ...rest } = props as ButtonProps
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}
