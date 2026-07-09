'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'
import { SearchModal } from '@/components/SearchModal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

type Variant = 'marketing' | 'app'

const authedLinks = [
  { href: '/dashboard', label: 'Moji kursevi' },
  { href: '/progress', label: 'Napredak' },
  { href: '/ponavljanje', label: 'Ponavljanje' },
  { href: '/settings', label: 'Profil' },
]

const publicLinks = [
  { href: '/o-nama', label: 'O nama' },
  { href: '/cenovnik', label: 'Cenovnik' },
  { href: '/kontakt', label: 'Kontakt' },
]

export function Navbar({ variant = 'marketing' }: { variant?: Variant }) {
  const router = useRouter()
  const pathname = usePathname()
  const { session, loading } = useAuth()
  const [open, setOpen] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/')
    router.refresh()
  }

  // U "app" varijanti uvek pretpostavljamo da postoji sesija (middleware štiti
  // rute), pa nikad ne prikazujemo public linkove. Ovo eliminiše flash
  // "Kako radi / Demo / Pretplata" dok se AuthProvider session resolvuje.
  const isAppMode = variant === 'app'
  const showAuthed = isAppMode || !!session

  // U marketing varijanti dok session learn-uje, ne prikazujemo ni public ni authed
  // linkove — bolje prazno nego flash.
  const showPublic = !isAppMode && !loading && !session

  const navLinks = showAuthed ? authedLinks : showPublic ? publicLinks : []
  const showAuthCtas = isAppMode || !loading

  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-white/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between py-3">
        <Logo />

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm font-medium transition-colors',
                showAuthed && pathname.startsWith(l.href)
                  ? 'text-primary-dark'
                  : 'text-ink/70 hover:text-primary-dark',
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {showAuthed && <SearchModal />}
          {showAuthCtas && showAuthed && (
            <Button onClick={signOut} variant="outline" size="md">
              Odjava
            </Button>
          )}
          {showAuthCtas && !showAuthed && (
            <>
              <Button href="/login" variant="ghost" size="md">
                Prijava
              </Button>
              <Button href="/register" variant="primary" size="md">
                Probaj besplatno
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Otvori meni"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink lg:hidden"
        >
          <span className="relative block h-4 w-6">
            <span
              className={cn(
                'absolute left-0 block h-0.5 w-6 bg-current transition-all',
                open ? 'top-1.5 rotate-45' : 'top-0',
              )}
            />
            <span
              className={cn(
                'absolute left-0 top-1.5 block h-0.5 w-6 bg-current transition-all',
                open && 'opacity-0',
              )}
            />
            <span
              className={cn(
                'absolute left-0 block h-0.5 w-6 bg-current transition-all',
                open ? 'top-1.5 -rotate-45' : 'top-3',
              )}
            />
          </span>
        </button>
      </Container>

      {open && (
        <div className="border-t border-ink/5 bg-white lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-medium text-ink/80 hover:bg-surface hover:text-primary-dark"
              >
                {l.label}
              </a>
            ))}
            {showAuthCtas && showAuthed && (
              <Button onClick={signOut} variant="outline" size="lg" className="mt-2">
                Odjava
              </Button>
            )}
            {showAuthCtas && !showAuthed && (
              <>
                <Button href="/login" variant="outline" size="lg" className="mt-2">
                  Prijava
                </Button>
                <Button href="/register" variant="primary" size="lg">
                  Probaj besplatno
                </Button>
              </>
            )}
          </Container>
        </div>
      )}
    </header>
  )
}
