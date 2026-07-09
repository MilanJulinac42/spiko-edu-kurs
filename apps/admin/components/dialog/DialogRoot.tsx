'use client'

import { useEffect, useState, useSyncExternalStore, useRef } from 'react'
import { closeActive, getActive, subscribe } from './dialog-store'

export function DialogRoot() {
  const active = useSyncExternalStore(subscribe, getActive, () => null)

  if (!active) return null

  if (active.kind === 'prompt') {
    return (
      <PromptDialog
        opts={active.opts}
        onClose={(v) => closeActive(v)}
      />
    )
  }

  return (
    <ConfirmDialog
      opts={active.opts}
      onClose={(v) => closeActive(v)}
    />
  )
}

/* ──────── PROMPT ──────── */

function PromptDialog({
  opts,
  onClose,
}: {
  opts: import('./dialog-store').PromptOptions
  onClose: (v: string | null) => void
}) {
  const [value, setValue] = useState(opts.initialValue ?? '')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // Auto-focus + select-all kad se otvori
    const id = setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 50)
    return () => clearTimeout(id)
  }, [])

  function submit() {
    const trimmed = value.trim()
    if (opts.validate) {
      const err = opts.validate(trimmed)
      if (err) {
        setError(err)
        return
      }
    } else if (!trimmed) {
      setError('Polje ne sme biti prazno')
      return
    }
    onClose(trimmed)
  }

  return (
    <DialogShell onCancel={() => onClose(null)}>
      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{opts.title}</h3>
      {opts.label && (
        <label
          htmlFor="dlg-prompt-input"
          style={{
            display: 'block',
            marginTop: '1rem',
            marginBottom: '0.4rem',
            fontSize: '0.8rem',
            color: 'var(--ink-soft)',
            fontWeight: 600,
          }}
        >
          {opts.label}
        </label>
      )}
      <input
        id="dlg-prompt-input"
        ref={inputRef}
        className="input"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          if (error) setError(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            submit()
          }
        }}
        placeholder={opts.placeholder}
        style={{ marginTop: opts.label ? 0 : '1rem' }}
      />
      {error && (
        <p
          style={{
            margin: '0.5rem 0 0',
            fontSize: '0.78rem',
            color: 'var(--danger)',
            fontWeight: 600,
          }}
        >
          {error}
        </p>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          marginTop: '1.25rem',
        }}
      >
        <button className="btn secondary" onClick={() => onClose(null)}>
          {opts.cancelLabel ?? 'Otkaži'}
        </button>
        <button className="btn" onClick={submit}>
          {opts.okLabel ?? 'Sačuvaj'}
        </button>
      </div>
    </DialogShell>
  )
}

/* ──────── CONFIRM ──────── */

function ConfirmDialog({
  opts,
  onClose,
}: {
  opts: import('./dialog-store').ConfirmOptions
  onClose: (v: boolean) => void
}) {
  const okBtnRef = useRef<HTMLButtonElement | null>(null)
  const isDanger = opts.tone === 'danger'

  useEffect(() => {
    const id = setTimeout(() => okBtnRef.current?.focus(), 50)
    return () => clearTimeout(id)
  }, [])

  return (
    <DialogShell onCancel={() => onClose(false)}>
      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
        <div
          aria-hidden
          style={{
            flexShrink: 0,
            width: 40,
            height: 40,
            borderRadius: 999,
            display: 'grid',
            placeItems: 'center',
            background: isDanger ? 'var(--danger-soft)' : 'var(--primary-soft)',
            color: isDanger ? 'var(--danger)' : 'var(--primary-dark)',
          }}
        >
          {isDanger ? <WarningIcon /> : <QuestionIcon />}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{opts.title}</h3>
          {opts.message && (
            <p
              style={{
                margin: '0.4rem 0 0',
                color: 'var(--ink-soft)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
              }}
            >
              {opts.message}
            </p>
          )}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          marginTop: '1.25rem',
        }}
      >
        <button className="btn secondary" onClick={() => onClose(false)}>
          {opts.cancelLabel ?? 'Otkaži'}
        </button>
        <button
          ref={okBtnRef}
          className={isDanger ? 'btn danger' : 'btn'}
          onClick={() => onClose(true)}
        >
          {opts.okLabel ?? 'Potvrdi'}
        </button>
      </div>
    </DialogShell>
  )
}

/* ──────── shell (backdrop + card + ESC + scroll lock) ──────── */

function DialogShell({
  children,
  onCancel,
}: {
  children: React.ReactNode
  onCancel: () => void
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onCancel])

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // Backdrop klik zatvara (samo ako klik nije na dialogu)
        if (e.target === e.currentTarget) onCancel()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26, 39, 56, 0.35)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
        zIndex: 100,
        animation: 'dialogBackdropIn 0.18s ease-out',
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-lift)',
          animation: 'dialogCardIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {children}
      </div>
      <style>{`
        @keyframes dialogBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dialogCardIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

function QuestionIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}
