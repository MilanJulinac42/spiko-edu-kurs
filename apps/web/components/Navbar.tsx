'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const authedLinks = [
  { href: '/dashboard', label: 'Moj kurs' },
  { href: '/ai', label: 'AI asistent' },
]

const publicLinks = [
  { href: '#kako-radi', label: 'Kako radi' },
  { href: '#demo', label: 'Demo' },
  { href: '#pricing', label: 'Pretplata' },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { session } = useAuth()
  const [open, setOpen] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-white/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between py-3">
        <Logo />

        <nav className="hidden items-center gap-8 lg:flex">
          {(session ? authedLinks : publicLinks).map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm font-medium transition-colors',
                session && pathname.startsWith(l.href)
                  ? 'text-primary-dark'
                  : 'text-ink/70 hover:text-primary-dark',
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {session ? (
            <Button onClick={signOut} variant="outline" size="md">
              Odjava
            </Button>
          ) : (
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
            {(session ? authedLinks : publicLinks).map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-medium text-ink/80 hover:bg-surface hover:text-primary-dark"
              >
                {l.label}
              </a>
            ))}
            {session ? (
              <Button onClick={signOut} variant="outline" size="lg" className="mt-2">
                Odjava
              </Button>
            ) : (
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
