'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

type LessonResult = {
  id: string
  title: string
  type: string
  moduleTitle: string
  courseTitle: string
  href: string | null
  snippet: string
}
type ExerciseResult = {
  id: string
  title: string
  type: string
  lessonTitle: string
  href: string | null
}
type BookmarkResult = {
  id: string
  word: string
  translation: string | null
  note: string | null
}
type SearchResp = {
  lessons: LessonResult[]
  exercises: ExerciseResult[]
  bookmarks: BookmarkResult[]
}

const MAC = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

export function SearchModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResp | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Globalni shortcut: Cmd/Ctrl+K → toggle, Esc → close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isModK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (isModK) {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Focus input pri otvaranju
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30)
    } else {
      setQ('')
      setResults(null)
      setActiveIdx(0)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!open) return
    if (q.trim().length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const { data } = await api.search.get({ query: { q } })
        if (data) setResults(data as SearchResp)
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(t)
  }, [q, open])

  const flatItems: Array<{ href: string; label: string }> = []
  if (results) {
    results.lessons.forEach((l) => l.href && flatItems.push({ href: l.href, label: l.title }))
    results.exercises.forEach((e) => e.href && flatItems.push({ href: e.href, label: e.title }))
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, Math.max(0, flatItems.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      const item = flatItems[activeIdx]
      if (item) {
        router.push(item.href)
        setOpen(false)
      }
    }
  }

  return (
    <>
      {/* Trigger u navbar-u — render-uje se gde god ti staviš */}
      <SearchTrigger onClick={() => setOpen(true)} />

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[80] bg-ink/40 backdrop-blur-sm"
        >
          <div className="grid min-h-full place-items-start py-[10vh] sm:py-[15vh]">
            <div
              onClick={(e) => e.stopPropagation()}
              className="mx-4 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-card sm:mx-auto"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-ink/5 px-5 py-4">
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-muted" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value)
                    setActiveIdx(0)
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Pretraga lekcija, vežbi, reči…"
                  className="flex-1 border-0 bg-transparent text-base text-ink outline-none placeholder:text-muted"
                />
                <kbd className="hidden rounded border border-ink/15 bg-surface px-1.5 py-0.5 text-[0.65rem] font-bold text-muted sm:block">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {q.trim().length < 2 ? (
                  <EmptyState />
                ) : loading && !results ? (
                  <div className="p-8 text-center text-sm text-muted">Tražim…</div>
                ) : !results || (results.lessons.length === 0 && results.exercises.length === 0 && results.bookmarks.length === 0) ? (
                  <div className="p-8 text-center">
                    <p className="text-3xl">🔎</p>
                    <p className="mt-3 text-sm text-muted">Ništa nije pronađeno za &quot;{q}&quot;</p>
                  </div>
                ) : (
                  <div className="p-2">
                    <ResultGroup title="Lekcije" emoji="📘">
                      {results.lessons.map((l, idx) => (
                        <LessonRow
                          key={l.id}
                          l={l}
                          active={activeIdx === idx}
                          onSelect={() => setOpen(false)}
                          onHover={() => setActiveIdx(idx)}
                        />
                      ))}
                    </ResultGroup>
                    <ResultGroup title="Vežbe" emoji="✎">
                      {results.exercises.map((e, idx) => (
                        <ExerciseRow
                          key={e.id}
                          e={e}
                          active={activeIdx === results.lessons.length + idx}
                          onSelect={() => setOpen(false)}
                          onHover={() => setActiveIdx(results.lessons.length + idx)}
                        />
                      ))}
                    </ResultGroup>
                    <ResultGroup title="Moje reči" emoji="⭐">
                      {results.bookmarks.map((b) => (
                        <BookmarkRow key={b.id} b={b} />
                      ))}
                    </ResultGroup>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-ink/5 bg-surface px-5 py-3 text-xs text-muted">
                <span className="flex items-center gap-3">
                  <Kbd>↑↓</Kbd> kreći se · <Kbd>↵</Kbd> izaberi · <Kbd>ESC</Kbd> zatvori
                </span>
                <span className="hidden sm:inline">
                  Spiko search
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ───────── trigger ───────── */

function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hidden items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs text-muted transition-colors hover:border-primary/30 hover:text-ink lg:flex"
      aria-label="Pretraga"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      Pretraga
      <Kbd>{MAC ? '⌘' : 'Ctrl'}+K</Kbd>
    </button>
  )
}

/* ───────── rows ───────── */

function ResultGroup({
  title,
  emoji,
  children,
}: {
  title: string
  emoji: string
  children: React.ReactNode
}) {
  const arr = Array.isArray(children) ? children : [children]
  const hasItems = arr.filter(Boolean).length > 0
  if (!hasItems) return null
  return (
    <div className="mb-2 last:mb-0">
      <p className="px-3 pb-1 pt-3 text-[0.65rem] font-bold uppercase tracking-wider text-muted">
        {emoji} {title}
      </p>
      <div>{children}</div>
    </div>
  )
}

function LessonRow({
  l,
  active,
  onSelect,
  onHover,
}: {
  l: LessonResult
  active: boolean
  onSelect: () => void
  onHover: () => void
}) {
  if (!l.href) return null
  return (
    <Link
      href={l.href}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        active ? 'bg-primary/10' : 'hover:bg-surface'
      }`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary/10 text-base text-secondary-dark">
        📘
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{l.title}</p>
        <p className="truncate text-xs text-muted">
          {l.moduleTitle} · {l.courseTitle}
        </p>
        {l.snippet && (
          <p className="mt-1 line-clamp-1 text-xs text-ink/65 italic">&ldquo;{l.snippet}&rdquo;</p>
        )}
      </div>
    </Link>
  )
}

function ExerciseRow({
  e,
  active,
  onSelect,
  onHover,
}: {
  e: ExerciseResult
  active: boolean
  onSelect: () => void
  onHover: () => void
}) {
  if (!e.href) return null
  return (
    <Link
      href={e.href}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        active ? 'bg-primary/10' : 'hover:bg-surface'
      }`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-base text-primary-dark">
        ✎
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{e.title}</p>
        <p className="truncate text-xs text-muted">{e.lessonTitle}</p>
      </div>
    </Link>
  )
}

function BookmarkRow({ b }: { b: BookmarkResult }) {
  return (
    <div className="flex items-start gap-3 rounded-xl px-3 py-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-yellow-100 text-base">
        ⭐
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{b.word}</p>
        {b.translation && <p className="text-xs text-primary-dark">→ {b.translation}</p>}
        {b.note && <p className="mt-0.5 text-xs italic text-muted">{b.note}</p>}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="p-8 text-center">
      <p className="text-3xl">🔍</p>
      <p className="mt-3 text-sm text-muted">
        Ukucaj 2+ slova da pretražiš lekcije, vežbe i bookmarke.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-muted">
        {['Hund', 'pozdrav', 'brojevi', 'haben'].map((sample) => (
          <span key={sample} className="rounded-full border border-ink/10 bg-surface px-3 py-1">
            npr. <strong className="text-ink/80">{sample}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-ink/15 bg-white px-1 py-0.5 text-[0.65rem] font-bold text-ink/70">
      {children}
    </kbd>
  )
}
