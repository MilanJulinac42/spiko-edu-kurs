'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type LessonLite = {
  id: string
  title: string
  completed: boolean
}
type ModuleLite = { id: string; title: string; lessons: LessonLite[] }

type Props = {
  modules: ModuleLite[]
  slug: string
  currentLessonId: string
}

const LS_PANEL_KEY = 'spiko_lesson_panel_collapsed'
const LS_MODULES_KEY = 'spiko_lesson_modules_collapsed'

/**
 * "Sadržaj kursa" — desktop sticky panel + mobile slide-over.
 * Podržava: collapse celog panela + collapse svakog modula nezavisno.
 */
export function LessonContentDrawer({ modules, slug, currentLessonId }: Props) {
  const [open, setOpen] = useState(false)
  const [panelCollapsed, setPanelCollapsed] = useState(false)

  // Modul ID koji sadrži trenutnu lekciju — uvek expanded by default
  const currentModuleId = useMemo(() => {
    for (const m of modules) {
      if (m.lessons.some((l) => l.id === currentLessonId)) return m.id
    }
    return null
  }, [modules, currentLessonId])

  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set())

  // Učitaj iz localStorage
  useEffect(() => {
    try {
      const p = localStorage.getItem(LS_PANEL_KEY)
      if (p === '1') setPanelCollapsed(true)
      const m = localStorage.getItem(LS_MODULES_KEY)
      if (m) setCollapsedModules(new Set(JSON.parse(m) as string[]))
    } catch {
      // ignore
    }
  }, [])

  // Save panel state
  useEffect(() => {
    try {
      localStorage.setItem(LS_PANEL_KEY, panelCollapsed ? '1' : '0')
    } catch {
      // ignore
    }
  }, [panelCollapsed])

  // Save module state
  useEffect(() => {
    try {
      localStorage.setItem(LS_MODULES_KEY, JSON.stringify([...collapsedModules]))
    } catch {
      // ignore
    }
  }, [collapsedModules])

  // Body scroll lock (mobile drawer)
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Zatvori drawer kad se promeni lekcija
  useEffect(() => {
    setOpen(false)
  }, [currentLessonId])

  function toggleModule(moduleId: string) {
    setCollapsedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  function isModuleCollapsed(moduleId: string): boolean {
    // Modul koji sadrži current lekciju je uvek otvoren osim ako korisnik nije
    // eksplicitno kolapsovao
    return collapsedModules.has(moduleId)
  }

  return (
    <>
      {/* Mobile FAB / button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-bold text-white shadow-card lg:hidden"
        aria-label="Otvori sadržaj kursa"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Sadržaj
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm lg:hidden"
          aria-hidden
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-[88vw] max-w-sm transform overflow-y-auto bg-white shadow-card transition-transform lg:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <DrawerHeader title="Sadržaj kursa" onClose={() => setOpen(false)} />
        <Content
          modules={modules}
          slug={slug}
          currentLessonId={currentLessonId}
          collapsed={collapsedModules}
          onToggleModule={toggleModule}
          currentModuleId={currentModuleId}
          isModuleCollapsed={isModuleCollapsed}
        />
      </aside>

      {/* Desktop panel — sticky wrap se primenjuje na parent aside u lesson page */}
      <div className="hidden lg:block">
        <div className="rounded-3xl bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-ink/5 px-5 py-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted">
              Sadržaj kursa
            </h3>
            <button
              onClick={() => setPanelCollapsed((v) => !v)}
              className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
              aria-label={panelCollapsed ? 'Proširi' : 'Skupi'}
              title={panelCollapsed ? 'Proširi' : 'Skupi'}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path
                  d={panelCollapsed ? 'M6 9l6 6 6-6' : 'M18 15l-6-6-6 6'}
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          {!panelCollapsed && (
            <div className="px-2 py-3">
              <Content
                modules={modules}
                slug={slug}
                currentLessonId={currentLessonId}
                collapsed={collapsedModules}
                onToggleModule={toggleModule}
                currentModuleId={currentModuleId}
                isModuleCollapsed={isModuleCollapsed}
              />
            </div>
          )}
          {panelCollapsed && (
            <div className="px-5 py-3 text-xs text-muted">
              {modules.reduce(
                (acc, m) => ({
                  total: acc.total + m.lessons.length,
                  done: acc.done + m.lessons.filter((l) => l.completed).length,
                }),
                { total: 0, done: 0 },
              ).done}{' '}
              /{' '}
              {modules.reduce((s, m) => s + m.lessons.length, 0)} lekcija završeno
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function DrawerHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/5 bg-white px-5 py-4">
      <h3 className="font-display text-base font-bold text-ink">{title}</h3>
      <button
        type="button"
        onClick={onClose}
        className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-surface"
        aria-label="Zatvori"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
          <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

function Content({
  modules,
  slug,
  currentLessonId,
  onToggleModule,
  currentModuleId,
  isModuleCollapsed,
}: {
  modules: ModuleLite[]
  slug: string
  currentLessonId: string
  collapsed: Set<string>
  onToggleModule: (id: string) => void
  currentModuleId: string | null
  isModuleCollapsed: (id: string) => boolean
}) {
  return (
    <div className="px-2 py-3">
      {modules.map((m, mIdx) => {
        const collapsed = isModuleCollapsed(m.id)
        const done = m.lessons.filter((l) => l.completed).length
        const total = m.lessons.length
        const isCurrent = currentModuleId === m.id

        return (
          <div key={m.id} className="mb-4 last:mb-0">
            <button
              type="button"
              onClick={() => onToggleModule(m.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold uppercase tracking-wider transition-colors ${
                isCurrent ? 'text-primary-dark' : 'text-muted hover:text-ink'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-3 w-3 shrink-0 transition-transform ${collapsed ? '' : 'rotate-90'}`}
                fill="none"
              >
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="flex-1 truncate">
                {mIdx + 1}. {m.title}
              </span>
              <span className="text-[0.65rem] font-semibold text-muted">
                {done}/{total}
              </span>
            </button>
            {!collapsed && (
              <ul className="mt-1 space-y-0.5">
                {m.lessons.map((l) => {
                  const isCurrentLesson = l.id === currentLessonId
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/courses/${slug}/lessons/${l.id}`}
                        className={`flex items-start gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors ${
                          isCurrentLesson
                            ? 'bg-primary/10 font-semibold text-primary-dark'
                            : 'text-ink/75 hover:bg-surface'
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[0.6rem] ${
                            l.completed
                              ? 'bg-primary text-white'
                              : isCurrentLesson
                                ? 'border border-primary text-primary-dark'
                                : 'border border-ink/15 text-muted'
                          }`}
                        >
                          {l.completed ? <CheckIcon /> : ''}
                        </span>
                        <span className="flex-1 leading-snug">{l.title}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
