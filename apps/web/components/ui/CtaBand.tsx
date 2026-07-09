import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'

type CtaButton = {
  label: string
  href: string
}

/**
 * Reusable CTA banner — tamna kartica sa naslovom, opisom i 1-2 dugmeta.
 * Opciono ima pozadinsku sliku sa istim overlay tretmanom kao PageHeader.
 *
 * Next/image lazy-load default (ne priority) jer je CTA ispod fold-a.
 */
export function CtaBand({
  eyebrow,
  title,
  description,
  primary,
  secondary,
  note,
  image,
  bgClass = 'bg-white',
}: {
  eyebrow?: string
  title: string
  description?: string
  primary: CtaButton
  secondary?: CtaButton
  /** Sitan tekst ispod dugmadi (npr. „🔒 Otkaži bilo kad · Bez skrivenih troškova"). */
  note?: string
  image?: string
  /** Boja sekcije koja drži karticu — bitno za vizuelni prelaz. */
  bgClass?: string
}) {
  return (
    <Section className={`${bgClass} py-20 sm:py-28`}>
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-ink p-10 text-center shadow-card sm:p-16">
          {image && (
            <>
              <Image
                src={image}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-secondary/25 mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-b from-ink/90 via-ink/85 to-ink/95" />
            </>
          )}

          <div className="pointer-events-none absolute -left-20 -top-10 h-60 w-60 rounded-full bg-primary/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 top-20 h-72 w-72 rounded-full bg-secondary/25 blur-3xl" />

          <div className="relative z-10">
            {eyebrow && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-light">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {eyebrow}
              </span>
            )}
            <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              {title}
            </h2>
            {description && (
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">{description}</p>
            )}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href={primary.href} variant="primary" size="lg">
                {primary.label}
              </Button>
              {secondary && (
                <Button
                  href={secondary.href}
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:border-primary hover:text-primary-light"
                >
                  {secondary.label}
                </Button>
              )}
            </div>
            {note && <p className="mt-6 text-xs text-white/40">{note}</p>}
          </div>
        </div>
      </Container>
    </Section>
  )
}
