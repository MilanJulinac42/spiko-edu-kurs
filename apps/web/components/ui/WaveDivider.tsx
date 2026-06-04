import { cn } from '@/lib/utils'

type WaveVariant = 'wave' | 'wave-soft' | 'tilt' | 'curve'

const paths: Record<WaveVariant, string> = {
  wave: 'M0,64 C240,128 480,0 720,48 C960,96 1200,32 1440,80 L1440,160 L0,160 Z',
  'wave-soft':
    'M0,96 C360,40 720,120 1080,72 C1260,48 1380,72 1440,88 L1440,160 L0,160 Z',
  tilt: 'M0,160 L1440,32 L1440,160 Z',
  curve: 'M0,160 C480,0 960,0 1440,160 L1440,160 L0,160 Z',
}

export function WaveDivider({
  variant = 'wave',
  position = 'bottom',
  className,
  fillClassName = 'fill-white',
}: {
  variant?: WaveVariant
  position?: 'top' | 'bottom'
  className?: string
  fillClassName?: string
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 z-10 leading-[0]',
        position === 'bottom' ? '-bottom-px' : '-top-px',
        className,
      )}
    >
      <svg
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        className={cn(
          'block h-[61px] w-full sm:h-[91px]',
          position === 'top' && 'rotate-180',
          fillClassName,
        )}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={paths[variant]} />
      </svg>
    </div>
  )
}
