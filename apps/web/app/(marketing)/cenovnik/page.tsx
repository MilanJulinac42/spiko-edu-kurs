import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { Section, SectionHeading } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { CtaBand } from '@/components/ui/CtaBand'
import { FaqAccordion } from '@/components/FaqAccordion'

export const metadata: Metadata = {
  title: 'Cenovnik — Spiko Edu',
  description:
    'Pretplata na Spiko Edu — mesečno, godišnje ili lifetime. Svi planovi otključavaju ceo kurs i AI tutora. Bez skrivenih troškova.',
}

export default function CenovnikPage() {
  return (
    <>
      <PageHeader
        eyebrow="Cenovnik"
        title="Jedna pretplata, ceo kurs"
        description="Svi planovi otključavaju sve nivoe od A1 do C1, AI tutora i sav budući sadržaj. Bez skrivenih troškova."
        image="/cities/study.jpg"
        waveFill="fill-surface"
      />

      {/* ════════════════════════════════════════════════════════════════
          PLANOVI
      ════════════════════════════════════════════════════════════════ */}
      <Section className="bg-surface py-20 sm:py-28">
        <Container>
          <Reveal stagger className="grid gap-6 md:grid-cols-3">
            <PricingCard
              name="Mesečno"
              price="19"
              period="/mes"
              features={[
                'Ceo kurs (svi nivoi A1–C1)',
                'AI tutor — neograničeno',
                'Vežbe sa instant feedback-om',
                'Audio materijal i transkripti',
                'Praćenje napretka',
              ]}
              cta="Pošalji upit"
            />
            <PricingCard
              featured
              badge="Najpopularnije"
              name="Godišnje"
              price="149"
              period="/god"
              saving="2 meseca gratis"
              features={[
                'Sve iz Mesečnog plana',
                'Sav budući sadržaj uključen',
                'Prioritetna podrška',
                'Mock ispitni testovi',
              ]}
              cta="Pošalji upit"
            />
            <PricingCard
              name="Lifetime"
              price="399"
              period="jednom"
              features={[
                'Sve iz Godišnjeg plana',
                'Doživotan pristup svim update-ima',
                'Bez ponovnog plaćanja, ikada',
                'Privatan kanal za podršku',
              ]}
              cta="Pošalji upit"
            />
          </Reveal>

          {/* Garantni red */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <Check /> Otkaži bilo kad
            </span>
            <span className="inline-flex items-center gap-2">
              <Check /> SSL plaćanje
            </span>
            <span className="inline-flex items-center gap-2">
              <Check /> Bez papirologije
            </span>
            <span className="inline-flex items-center gap-2">
              <Check /> Demo lekcije besplatno
            </span>
          </div>

          {/* Early-access napomena */}
          <Reveal className="mx-auto mt-12 max-w-2xl rounded-3xl border-2 border-dashed border-primary/40 bg-white p-6 text-center sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Pretpočna lista
            </span>
            <h3 className="mt-4 font-display text-xl font-bold text-ink">
              Spiko Edu još nije zvanično lansiran
            </h3>
            <p className="mt-3 leading-relaxed text-muted">
              Trenutno upisujemo prve korisnike kroz direktan kontakt. Pošalji upit
              i javljamo se sa pristupom, demo lekcijama i tačnim uslovima — bez
              automatske naplate dok god je sve dogovoreno.
            </p>
            <div className="mt-5">
              <Button href="/kontakt" variant="primary" size="md">
                Prijavi se na pretpočnu listu
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          FAQ — pitanja o naplati
      ════════════════════════════════════════════════════════════════ */}
      <Section className="bg-white py-20 sm:py-28">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="Naplata i planovi"
            title="Šta polaznici najčešće pitaju"
            description="Ako tvoje pitanje nije ovde — piši nam na kontakt."
          />

          <div className="mt-12">
            <FaqAccordion
              items={[
                {
                  q: 'Mogu li uvek da otkažem pretplatu?',
                  a: 'Da. Iz svog profila, jednim klikom. Bez papirologije, bez razgovora sa podrškom. Pristup ostaje do kraja perioda koji si platio.',
                },
                {
                  q: 'Koja je razlika između planova?',
                  a: 'Sadržaj je isti — svi planovi imaju ceo kurs, AI tutora i sve materijale. Razlika je samo u trajanju i ceni: Mesečni je najfleksibilniji, Godišnji uštedi 2 meseca, Lifetime znači jednokratno plaćanje i doživotan pristup.',
                },
                {
                  q: 'Šta ako se predomislim odmah posle plaćanja?',
                  a: 'Pošto smo trenutno u fazi pretpočne liste, pristup se aktivira manuelno tek kad oboje potvrdimo dogovor — tako da nema rizika od pogrešno započete pretplate.',
                },
                {
                  q: 'Mogu li da pređem sa Mesečnog na Godišnji?',
                  a: 'Da, bilo kad. Razliku doplaćuješ pro-rata za preostali period, ili započinješ novi godišnji ciklus.',
                },
                {
                  q: 'Da li je AI tutor uključen u sve planove?',
                  a: 'Da. AI tutor je deo svake pretplate — neograničeno korišćenje, bez doplata po pitanju.',
                },
                {
                  q: 'Kako se vrši plaćanje?',
                  a: 'Trenutno preko direktnog dogovora (uplata na žiro račun ili gotovinski). Online naplata kroz Raiffeisen payment gateway dolazi u sledećoj fazi — javljamo se čim bude live.',
                },
              ]}
            />
          </div>
        </Container>
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          CTA BAND
      ════════════════════════════════════════════════════════════════ */}
      <CtaBand
        title="Vreme je za prvu lekciju"
        description="Demo lekcije su besplatne — bez kartice, bez obaveza."
        primary={{ label: 'Pošalji upit', href: '/kontakt' }}
        secondary={{ label: 'Probaj besplatno', href: '/register' }}
        image="/cities/vienna.jpg"
        bgClass="bg-surface"
      />
    </>
  )
}

/* ═════════════════════════════════════════════════════════════════════
   PricingCard
═════════════════════════════════════════════════════════════════════ */

function PricingCard({
  name,
  price,
  period,
  features,
  cta,
  featured = false,
  badge,
  saving,
}: {
  name: string
  price: string
  period: string
  features: string[]
  cta: string
  featured?: boolean
  badge?: string
  saving?: string
}) {
  return (
    <article
      className={`relative flex flex-col rounded-3xl p-8 transition-all hover:-translate-y-1 ${
        featured
          ? 'scale-[1.02] bg-gradient-to-br from-primary to-primary-light text-ink shadow-card'
          : 'border border-ink/5 bg-white text-ink shadow-soft hover:shadow-card'
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-primary shadow-card">
          ★ {badge}
        </span>
      )}

      <div>
        <h3 className={`font-display text-xl font-bold ${featured ? 'text-ink' : 'text-ink'}`}>
          {name}
        </h3>
        <div className="mt-4 flex items-baseline gap-1">
          <span className={`text-sm font-bold ${featured ? 'text-ink/60' : 'text-muted'}`}>€</span>
          <span className={`font-display text-5xl font-extrabold ${featured ? 'text-ink' : 'text-ink'}`}>
            {price}
          </span>
          <span className={`ml-1 text-sm ${featured ? 'text-ink/60' : 'text-muted'}`}>
            {period}
          </span>
        </div>
        {saving && (
          <p
            className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
              featured ? 'bg-ink/10 text-ink' : 'bg-primary/15 text-primary-dark'
            }`}
          >
            🎁 {saving}
          </p>
        )}
      </div>

      <ul className="mt-7 flex-1 space-y-3 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                featured ? 'bg-ink text-primary' : 'bg-primary text-ink'
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className={featured ? 'text-ink/85' : 'text-ink/80'}>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Button
          href="/kontakt"
          variant={featured ? 'secondary' : 'primary'}
          size="lg"
          className="w-full"
        >
          {cta}
        </Button>
      </div>
    </article>
  )
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none text-primary" aria-hidden>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
