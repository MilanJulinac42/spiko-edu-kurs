'use client'

/**
 * Brendiran audio plejer za student stranicu.
 * Tanak, čist, koristi native HTML5 <audio> + custom styling.
 *
 * Za sada koristimo native controls (jer su accessible + dobro radi mobile),
 * samo wrap-ujemo u brand kartu.
 */
export function AudioPlayer({
  src,
  label,
  compact = false,
}: {
  src: string
  label?: string
  compact?: boolean
}) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 shadow-soft">
        <span className="text-secondary-dark" aria-hidden>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" />
          </svg>
        </span>
        <audio src={src} controls preload="metadata" style={{ height: 28 }} />
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-secondary-light/20 via-white to-primary-light/20 p-4 shadow-soft">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-white" aria-hidden>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" />
          </svg>
        </span>
        <p className="text-xs font-bold uppercase tracking-wider text-secondary-dark">
          {label ?? 'Audio'}
        </p>
      </div>
      <audio
        src={src}
        controls
        preload="metadata"
        className="w-full"
        style={{ height: 40 }}
      />
    </div>
  )
}
