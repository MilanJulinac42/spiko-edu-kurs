'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type Tab = 'notes' | 'bookmarks'

type Bookmark = {
  id: string
  word: string
  translation: string | null
  note: string | null
  createdAt: string | Date
}

const COLLAPSE_KEY = 'spiko:lesson-sidebar-collapsed'

export function LessonSidebarPanel({ lessonId }: { lessonId: string }) {
  const [tab, setTab] = useState<Tab>('notes')
  // Pamtimo collapsed stanje između lekcija/refresh-ova
  const [collapsed, setCollapsed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_KEY)
      if (stored === '1') setCollapsed(true)
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed, hydrated])

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-ink/5 bg-white px-4 py-3 text-left shadow-soft transition-all hover:shadow-card hover:border-primary/30"
        aria-label="Otvori beleške i reči"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-light/40 text-primary-dark">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Beleške i reči</p>
            <p className="text-xs text-muted">klikni da otvoriš</p>
          </div>
        </div>
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted transition-transform group-hover:translate-y-0.5"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    )
  }

  return (
    <div className="rounded-3xl bg-white shadow-soft animate-fade-in">
      <div className="flex items-stretch border-b border-ink/5">
        <TabBtn active={tab === 'notes'} onClick={() => setTab('notes')}>
          ✎ Beleške
        </TabBtn>
        <TabBtn active={tab === 'bookmarks'} onClick={() => setTab('bookmarks')}>
          ⭐ Reči
        </TabBtn>
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Minimizuj panel"
          title="Minimizuj"
          className="grid w-11 shrink-0 place-items-center border-l border-ink/5 text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
      </div>
      <div className="p-5">
        {tab === 'notes' && <NotesTab lessonId={lessonId} />}
        {tab === 'bookmarks' && <BookmarksTab lessonId={lessonId} />}
      </div>
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
        active
          ? 'border-b-2 border-primary text-primary-dark'
          : 'border-b-2 border-transparent text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

/* ───── NOTES ───── */

function NotesTab({ lessonId }: { lessonId: string }) {
  const [body, setBody] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    api.me.notes({ lessonId }).get().then(({ data }) => {
      const r = data as { body?: string }
      setBody(r?.body ?? '')
      setLoaded(true)
    })
  }, [lessonId])

  // autosave 1s posle promene
  useEffect(() => {
    if (!loaded) return
    const t = setTimeout(async () => {
      setSaving(true)
      await api.me.notes({ lessonId }).put({ body })
      setSaving(false)
      setSavedAt(Date.now())
    }, 1000)
    return () => clearTimeout(t)
  }, [body, lessonId, loaded])

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        Tvoje lične beleške
      </p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Zapamti šta ti je važno iz lekcije — gramatika, primer, asocijacija…"
        rows={10}
        className="mt-3 w-full resize-none rounded-xl border border-ink/10 bg-white p-3 text-sm text-ink outline-none focus:border-primary"
      />
      <p className="mt-2 text-xs text-muted">
        {saving
          ? 'Snimam…'
          : savedAt
            ? '✓ Sačuvano automatski'
            : 'Snima se automatski 1 sekundu posle prestanka kucanja.'}
      </p>
    </div>
  )
}

/* ───── BOOKMARKS ───── */

function BookmarksTab({ lessonId }: { lessonId: string }) {
  const [list, setList] = useState<Bookmark[]>([])
  const [word, setWord] = useState('')
  const [translation, setTranslation] = useState('')
  const [note, setNote] = useState('')
  const [adding, setAdding] = useState(false)

  async function load() {
    const { data } = await api.me.bookmarks.get({ query: { lessonId } })
    if (Array.isArray(data)) setList(data as Bookmark[])
  }

  useEffect(() => { load() }, [lessonId])

  async function add() {
    if (!word.trim()) return
    setAdding(true)
    await api.me.bookmarks.post({
      lessonId,
      word: word.trim(),
      translation: translation.trim() || undefined,
      note: note.trim() || undefined,
    })
    setWord('')
    setTranslation('')
    setNote('')
    setAdding(false)
    await load()
  }

  async function remove(id: string) {
    await api.me.bookmarks({ id }).delete()
    await load()
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        Bookmarkovane reči ({list.length})
      </p>

      <div className="mt-3 rounded-xl bg-surface p-3">
        <div className="grid gap-2">
          <input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Reč ili fraza (npr. Hund)"
            className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            placeholder="Prevod (npr. pas)"
            className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Beleška (opciono)"
            className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={add}
            disabled={!word.trim() || adding}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-ink shadow-soft hover:bg-primary-dark hover:text-white disabled:opacity-50"
          >
            {adding ? 'Dodajem…' : '+ Dodaj reč'}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {list.length === 0 && (
          <p className="text-sm text-muted">Nema bookmarka. Dodaj prvu reč iznad.</p>
        )}
        {list.map((b) => (
          <div key={b.id} className="rounded-xl border border-ink/10 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{b.word}</p>
                {b.translation && (
                  <p className="text-sm text-primary-dark">→ {b.translation}</p>
                )}
                {b.note && (
                  <p className="mt-1 text-xs text-muted italic">{b.note}</p>
                )}
              </div>
              <button
                onClick={() => remove(b.id)}
                className="text-xs text-muted hover:text-red-500"
                title="Obriši"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
