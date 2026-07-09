import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { PageHeader } from '@/components/ui/PageHeader'
import { ContactForm } from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Kontakt — Spiko Edu',
  description:
    'Pošalji upit Spiko Edu školi jezika. Email, telefon i adresa u Bačkoj Palanci — javljamo se čim stignemo.',
}

const CONTACT_EMAIL = 'spikoedu@gmail.com'
const CONTACT_TEL_DISPLAY = '+381 62 9611743'
const CONTACT_TEL_RAW = '+381629611743'
const CONTACT_ADDRESS = 'Vase Stajića 2a/10, Bačka Palanka'

export default function KontaktPage() {
  return (
    <>
      <PageHeader
        eyebrow="Kontakt"
        title="Pitaj nas šta god te zanima"
        description="Imaš pitanje o kursu, pretplati ili tehničku poteškoću? Pošalji poruku — javljamo se čim stignemo."
        image="/cities/kontakt.jpg"
        waveFill="fill-surface"
      />

      <Section className="bg-surface py-20 sm:py-28">
        <Container>
          <Reveal className="overflow-hidden rounded-3xl bg-ink shadow-card">
            <div className="grid lg:grid-cols-[1fr_1.1fr]">
              {/* Levo — info + benefiti */}
              <div className="relative overflow-hidden p-8 sm:p-12">
                <div className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
                <div className="pointer-events-none absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />

                <div className="relative">
                  <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-primary-light">
                    Tu smo za pitanja
                  </span>
                  <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                    Pošalji poruku
                  </h2>
                  <p className="mt-4 max-w-md leading-relaxed text-white/70">
                    Bilo da želiš da probaš kurs, pitaš o pretplati ili imaš
                    tehnički problem — piši slobodno. Javljamo se čim stignemo.
                  </p>

                  <ul className="mt-8 space-y-4">
                    {[
                      'Demo lekcije besplatno — bez kartice',
                      'AI tutor uključen u pretplati',
                      'Otkaži pretplatu bilo kad',
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-3 text-white/90">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-ink">
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                            <path
                              d="M5 13l4 4L19 7"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        {t}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-10 space-y-4 border-t border-white/10 pt-8">
                    <ContactRow
                      icon="✉"
                      label="Email"
                      value={CONTACT_EMAIL}
                      href={`mailto:${CONTACT_EMAIL}`}
                    />
                    <ContactRow
                      icon="✆"
                      label="Telefon"
                      value={CONTACT_TEL_DISPLAY}
                      href={`tel:${CONTACT_TEL_RAW}`}
                    />
                    <ContactRow icon="📍" label="Adresa" value={CONTACT_ADDRESS} />
                    <ContactRow icon="⏰" label="Radno vreme" value="Pon–Pet 9:00–17:00" />
                  </div>
                </div>
              </div>

              {/* Desno — forma */}
              <div className="bg-white p-8 sm:p-12">
                <ContactForm targetEmail={CONTACT_EMAIL} />
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  )
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: string
  label: string
  value: string
  href?: string
}) {
  const inner = (
    <div className="flex items-start gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-lg text-primary-light">
        {icon}
      </span>
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-white/50">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  )
  if (href) {
    return (
      <a href={href} className="block transition-opacity hover:opacity-80">
        {inner}
      </a>
    )
  }
  return inner
}
