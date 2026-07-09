'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const inputClass =
  'w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'

/**
 * Kontakt forma — submituje preko `mailto:` (otvara default email klijenta sa
 * popunjenim subject-om i body-jem). Bez backend zavisnosti.
 *
 * Kasnije se može zameniti pravim API endpoint-om / Web3Forms-om — ovde je samo
 * `handleSubmit` koji treba zameniti.
 */
export function ContactForm({ targetEmail }: { targetEmail: string }) {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const ime = String(data.get('ime') || '').trim()
    const email = String(data.get('email') || '').trim()
    const telefon = String(data.get('telefon') || '').trim()
    const poruka = String(data.get('poruka') || '').trim()

    const body = [
      `Ime i prezime: ${ime}`,
      `Email: ${email}`,
      telefon && `Telefon: ${telefon}`,
      '',
      poruka && 'Poruka:',
      poruka,
    ]
      .filter(Boolean)
      .join('\n')

    const url = `mailto:${targetEmail}?subject=${encodeURIComponent(
      'Nova prijava sa sajta — Spiko Edu',
    )}&body=${encodeURIComponent(body)}`

    window.location.href = url
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-4xl">
          🎉
        </span>
        <h3 className="mt-5 font-display text-2xl font-extrabold text-ink">Hvala na prijavi!</h3>
        <p className="mt-2 max-w-xs text-muted">
          Otvoreno je email okruženje sa popunjenom porukom — samo pošalji.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 text-sm font-semibold text-primary-dark hover:underline"
        >
          Pošalji još jednu prijavu
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="ime" className="mb-1.5 block text-sm font-medium text-ink">
          Ime i prezime
        </label>
        <input
          id="ime"
          name="ime"
          required
          autoComplete="name"
          className={inputClass}
          placeholder="Tvoje ime"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            required
            type="email"
            autoComplete="email"
            className={inputClass}
            placeholder="ti@email.com"
          />
        </div>
        <div>
          <label htmlFor="telefon" className="mb-1.5 block text-sm font-medium text-ink">
            Telefon
          </label>
          <input
            id="telefon"
            name="telefon"
            type="tel"
            autoComplete="tel"
            className={inputClass}
            placeholder="06x xxx xxxx"
          />
        </div>
      </div>

      <div>
        <label htmlFor="poruka" className="mb-1.5 block text-sm font-medium text-ink">
          Poruka (opciono)
        </label>
        <textarea
          id="poruka"
          name="poruka"
          rows={3}
          className={inputClass}
          placeholder="Reci nam nešto o svojim ciljevima…"
        />
      </div>

      <Button size="lg" className="w-full">
        Pošalji prijavu
      </Button>

      <p className="text-center text-xs text-muted">
        Slanjem prihvataš našu{' '}
        <Link href="/privatnost" className="underline hover:text-primary-dark">
          politiku privatnosti
        </Link>
        .
      </p>
    </form>
  )
}
