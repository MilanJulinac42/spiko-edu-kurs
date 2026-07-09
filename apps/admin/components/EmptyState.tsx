import type { ReactNode } from 'react'

/**
 * Konzistentan empty state za sve admin liste/tabele.
 * Minimalan: krug-ikona + naslov + opis + opciono CTA.
 */
export function EmptyState({
  icon,
  title,
  description,
  cta,
}: {
  icon?: ReactNode
  title: string
  description?: string
  cta?: ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon ?? <DefaultIcon />}</div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {cta && <div className="empty-state-cta">{cta}</div>}
    </div>
  )
}

function DefaultIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M3 12h18" />
    </svg>
  )
}

/* Pre-built ikone — koristiš ih za semantičan empty state */
export function EmptyIconBook() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v14H6a2 2 0 0 0-2 2V5Z" />
      <path d="M6 19a2 2 0 0 0-2 2" />
    </svg>
  )
}

export function EmptyIconUsers() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="3.25" />
      <path d="M5 20c.7-3.5 3.5-5.5 7-5.5s6.3 2 7 5.5" />
    </svg>
  )
}

export function EmptyIconClipboard() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 4.5h6V6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4.5Z" />
    </svg>
  )
}

export function EmptyIconMedia() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m10 9 5 3-5 3V9Z" />
    </svg>
  )
}
