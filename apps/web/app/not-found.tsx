import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'

export const metadata: Metadata = {
  title: 'Stranica nije pronađena — Spiko Edu',
  description: 'Adresa ne postoji ili je premeštena.',
}

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-ink px-6 py-16">
      {/* Brend blobovi — isti jezik kao hero na početnoj */}
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-16 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />

      <Container className="relative z-10 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Veliki 404 sa brend podvlakom */}
        <div className="relative mt-12 inline-block">
          <h1 className="font-display text-[6rem] font-extrabold leading-none tracking-tight text-white sm:text-[9rem]">
            4
            <span className="relative inline-block text-primary">
              0
              <svg
                className="absolute -bottom-3 left-0 w-full text-primary/40"
                viewBox="0 0 200 12"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2 9C40 3 160 3 198 9"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            4
          </h1>
        </div>

        <p className="mt-8 font-display text-2xl font-bold text-white sm:text-3xl">
          Stranica nije pronađena
        </p>

        {/* Mali jezički šmek — aplikacija za jezike */}
        <p className="mt-3 text-sm font-medium uppercase tracking-[0.2em] text-white/40">
          Nicht gefunden · Not found · Nije pronađeno
        </p>

        <p className="mx-auto mt-5 max-w-md leading-relaxed text-white/70">
          Ova adresa ne postoji ili je premeštena. Dešava se i najboljima —
          vratimo se na sigurno tlo.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href="/" variant="primary" size="lg">
            Nazad na početnu
          </Button>
          <Button
            href="/dashboard"
            variant="outline"
            size="lg"
            className="border-white/20 text-white hover:border-primary hover:text-primary-light"
          >
            Moji kursevi
          </Button>
        </div>
      </Container>
    </main>
  )
}
