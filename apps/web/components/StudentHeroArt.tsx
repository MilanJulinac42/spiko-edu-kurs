function Globe() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <defs>
        <radialGradient id="ocean-student" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#6fb0e3" />
          <stop offset="55%" stopColor="#3E8FD0" />
          <stop offset="100%" stopColor="#2f6fa6" />
        </radialGradient>
        <clipPath id="globe-clip-student">
          <circle cx="100" cy="100" r="92" />
        </clipPath>
      </defs>
      <circle cx="100" cy="100" r="92" fill="url(#ocean-student)" />
      <g clipPath="url(#globe-clip-student)">
        <g fill="#86C440">
          <path d="M44 58c12-10 30-12 40-4s4 22-6 28-10 18-24 16-22-12-20-26 2-8 10-14Z" />
          <path d="M120 40c14-4 30 2 32 14s-10 18-6 30-8 22-20 18-14-16-10-28-10-8-12-20 6-10 16-14Z" />
          <path d="M70 118c10-6 26-4 32 6s-2 22-12 28-8 18-22 14-16-18-10-32 4-10 12-16Z" />
          <path d="M132 120c10-2 22 4 22 14s-10 14-8 24-12 12-20 6-6-16-4-26-2-16 10-22Z" />
        </g>
        <g fill="#5E9E2E" opacity="0.5">
          <path d="M48 64c10-6 22-6 28 0s0 14-8 18-8 12-18 10-14-10-12-20 2-4 10-8Z" />
          <path d="M76 122c8-4 18-2 22 4s-2 14-10 18-6 12-16 8-10-12-6-22 2-4 6-6Z" />
        </g>
        <g fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.2">
          <line x1="8" y1="100" x2="192" y2="100" />
          <line x1="100" y1="8" x2="100" y2="192" />
          <ellipse cx="100" cy="100" rx="46" ry="92" />
          <ellipse cx="100" cy="100" rx="80" ry="92" />
          <ellipse cx="100" cy="100" rx="92" ry="46" />
          <ellipse cx="100" cy="100" rx="92" ry="80" />
        </g>
      </g>
      <circle cx="100" cy="100" r="92" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" />
      <ellipse cx="74" cy="64" rx="26" ry="16" fill="#ffffff" opacity="0.12" />
    </svg>
  )
}

function Chip({
  children,
  className = '',
  delay = '0s',
}: {
  children: React.ReactNode
  className?: string
  delay?: string
}) {
  return (
    <div
      className={`absolute flex animate-float items-center gap-2 rounded-2xl bg-white px-3.5 py-2 text-sm font-semibold text-ink shadow-card ring-1 ring-black/5 ${className}`}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  )
}

export function StudentHeroArt({
  percent,
  totalLessons,
  completedLessons,
  level,
  streak,
}: {
  percent: number
  totalLessons: number
  completedLessons: number
  level?: string | null
  streak: number
}) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      {/* glow */}
      <div className="absolute left-1/4 top-1/4 h-1/2 w-1/2 rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-1/2 w-1/2 rounded-full bg-secondary/30 blur-3xl" />

      {/* orbitalni prstenovi */}
      <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-dashed border-white/15" />
      <div className="absolute inset-[9%] animate-spin-slow-reverse rounded-full border border-dashed border-white/10" />

      {/* tackice na orbiti */}
      <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_12px] shadow-primary/60" />
      <span className="absolute bottom-[8%] right-[14%] h-2.5 w-2.5 rounded-full bg-secondary shadow-[0_0_12px] shadow-secondary/60" />

      {/* globus */}
      <div className="absolute inset-[16%] animate-float drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
        <Globe />
      </div>

      {/* Plivajući chip-ovi sa kontekstom kursa */}
      <Chip className="-left-4 top-[10%]" delay="0.2s">
        <span className="text-base">🔥</span>
        <span>{streak} {streak === 1 ? 'dan' : 'dana'}</span>
      </Chip>

      <Chip className="-right-3 top-[26%] bg-primary text-ink" delay="1.4s">
        {percent}%
        <span className="text-xs font-bold uppercase tracking-wider opacity-70">napretka</span>
      </Chip>

      <Chip className="-left-2 bottom-[24%]" delay="0.8s">
        <span className="text-base">📘</span>
        <span>{completedLessons}/{totalLessons}</span>
      </Chip>

      {level && (
        <Chip className="-right-4 bottom-[10%]" delay="2s">
          <span className="rounded-md bg-secondary/10 px-1.5 py-0.5 text-xs font-bold text-secondary-dark">
            {level}
          </span>
          <span>tvoj nivo</span>
        </Chip>
      )}
    </div>
  )
}
