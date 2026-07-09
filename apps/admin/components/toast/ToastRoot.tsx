'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  type Toast,
  dismissToast,
  getToasts,
  subscribeToasts,
} from './toast-store'

export function ToastRoot() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, () => [] as Toast[])

  return (
    <div
      role="region"
      aria-label="Notifikacije"
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        width: 'min(380px, calc(100vw - 2rem))',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  )
}

function ToastCard({ toast }: { toast: Toast }) {
  const [exiting, setExiting] = useState(false)
  const [paused, setPaused] = useState(false)

  // Auto-dismiss timer sa pause-on-hover. Računam preostalo vreme od `createdAt`.
  useEffect(() => {
    if (!Number.isFinite(toast.duration) || paused) return
    const elapsed = Date.now() - toast.createdAt
    const remaining = Math.max(0, toast.duration - elapsed)
    const id = setTimeout(() => {
      setExiting(true)
      setTimeout(() => dismissToast(toast.id), 180)
    }, remaining)
    return () => clearTimeout(id)
  }, [toast.id, toast.duration, toast.createdAt, paused])

  function handleDismiss() {
    setExiting(true)
    setTimeout(() => dismissToast(toast.id), 180)
  }

  const style = STYLES[toast.kind]

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        pointerEvents: 'auto',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        boxShadow: 'var(--shadow-lift)',
        padding: '0.85rem 1rem 0.85rem 1.1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.7rem',
        position: 'relative',
        borderLeft: `4px solid ${style.rail}`,
        animation: exiting
          ? 'toastOut 0.18s ease-in forwards'
          : 'toastIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <div
        aria-hidden
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          marginTop: 1,
          color: style.iconColor,
        }}
      >
        {style.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            color: 'var(--ink)',
            fontSize: '0.88rem',
            lineHeight: 1.35,
          }}
        >
          {toast.title}
        </div>
        {toast.description && (
          <div
            style={{
              marginTop: 2,
              fontSize: '0.8rem',
              color: 'var(--ink-soft)',
              lineHeight: 1.45,
            }}
          >
            {toast.description}
          </div>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick()
              handleDismiss()
            }}
            style={{
              marginTop: 6,
              background: 'transparent',
              border: 0,
              padding: 0,
              color: style.iconColor,
              fontSize: '0.82rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            {toast.action.label} →
          </button>
        )}
      </div>
      {toast.kind !== 'loading' && (
        <button
          onClick={handleDismiss}
          aria-label="Zatvori"
          style={{
            flexShrink: 0,
            width: 22,
            height: 22,
            marginTop: 1,
            border: 0,
            background: 'transparent',
            color: 'var(--muted)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            borderRadius: 4,
          }}
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
            <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px) scale(0.96); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(20px); }
        }
        @keyframes toastSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const STYLES: Record<
  Toast['kind'],
  { rail: string; iconColor: string; icon: React.ReactNode }
> = {
  success: {
    rail: 'var(--primary)',
    iconColor: 'var(--primary-dark)',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9.5" />
        <path d="m8 12.5 2.5 2.5L16 9" />
      </svg>
    ),
  },
  error: {
    rail: 'var(--danger)',
    iconColor: 'var(--danger)',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 8v5" />
        <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  info: {
    rail: 'var(--accent)',
    iconColor: 'var(--accent-dark)',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 11v5.5" />
        <circle cx="12" cy="7.8" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  loading: {
    rail: 'var(--ink-soft)',
    iconColor: 'var(--ink-soft)',
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        style={{ animation: 'toastSpin 0.9s linear infinite' }}
      >
        <path d="M12 3a9 9 0 1 0 9 9" opacity="0.85" />
        <path d="M12 3a9 9 0 0 1 9 9" opacity="0.25" />
      </svg>
    ),
  },
}
