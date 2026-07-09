import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { WaveDivider } from '@/components/ui/WaveDivider'

/**
 * Tamni hero za podstranice (kontakt, o-nama, cenovnik, privatnost, uslovi).
 * Završava se talasom koji se vezuje za sledeću sekciju (default fill-white).
 *
 * `image` (opciono) — pozadinska slika full-bleed. Next/image automatski:
 *  - servira AVIF/WebP po Accept header-u
 *  - responsive resize preko `sizes="100vw"`
 *  - lazy load isključen (priority) jer je hero above-the-fold
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  image,
  waveFill = 'fill-white',
}: {
  eyebrow?: string
  title: string
  description?: string
  image?: string
  waveFill?: string
}) {
  return (
    <Section className="relative overflow-hidden bg-ink pb-24 pt-36 sm:pt-40">
      {image && (
        <>
          <Image
            src={image}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-secondary/25 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/90 via-ink/85 to-ink/95" />
        </>
      )}

      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-24 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />

      <Container className="relative z-20 text-center">
        {eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-light">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {eyebrow}
          </span>
        )}
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/70">
            {description}
          </p>
        )}
      </Container>

      <WaveDivider variant="wave" position="bottom" fillClassName={waveFill} />
    </Section>
  )
}
