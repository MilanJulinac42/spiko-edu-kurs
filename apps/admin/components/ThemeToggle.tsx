'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'spiko-admin-theme'

type Theme = 'light' | 'dark'

/**
 * Toggle za prebacivanje light ↔ dark teme admin portala.
 * - Pamti izbor u localStorage
 * - Inicijalno respektuje system preference (prefers-color-scheme)
 * - FOUC-safe inicijalizacija je u `<script>` u layout.tsx (čita storage pre prvog paint-a)
 */
export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Čitaj trenutnu temu iz <html data-theme="">
    const current = (document.documentElement.getAttribute('data-theme') as Theme) || 'light'
    setTheme(current)
    setMounted(true)
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }

  // Pre mount-a renderuj placeholder iste veličine da ne flickeruje
  if (!mounted) {
    return (
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: collapsed ? 36 : '100%',
          height: 36,
          opacity: 0,
        }}
      />
    )
  }

  const isDark = theme === 'dark'

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={isDark ? 'Prebaci na svetlu temu' : 'Prebaci na tamnu temu'}
        title={isDark ? 'Svetla tema' : 'Tamna tema'}
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 36,
          height: 36,
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 999,
          color: 'var(--ink-soft)',
          cursor: 'pointer',
          transition: 'color 0.15s, background-color 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--ink)'
          e.currentTarget.style.background = 'var(--surface-2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--ink-soft)'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Prebaci na svetlu temu' : 'Prebaci na tamnu temu'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6rem',
        width: '100%',
        padding: '0.5rem 0.85rem',
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 10,
        color: 'var(--ink-soft)',
        cursor: 'pointer',
        fontSize: '0.82rem',
        fontWeight: 600,
        fontFamily: 'inherit',
        transition: 'color 0.15s, background-color 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--ink)'
        e.currentTarget.style.background = 'var(--surface-2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--ink-soft)'
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <span style={{ display: 'inline-flex' }}>
        {isDark ? <SunIcon /> : <MoonIcon />}
      </span>
      <span style={{ flex: 1, textAlign: 'left' }}>
        {isDark ? 'Svetla tema' : 'Tamna tema'}
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          width: 28,
          height: 16,
          background: isDark ? 'var(--primary)' : 'var(--border-2)',
          borderRadius: 999,
          padding: 2,
          transition: 'background-color 0.2s',
        }}
        aria-hidden
      >
        <span
          style={{
            width: 12,
            height: 12,
            background: '#fff',
            borderRadius: 999,
            transform: isDark ? 'translateX(12px)' : 'translateX(0)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
          }}
        />
      </span>
    </button>
  )
}

/* ──── Ikone ──── */

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  )
}
