import type { Metadata } from 'next'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { Section, SectionHeading } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { TiltCard } from '@/components/ui/TiltCard'
import { Button } from '@/components/ui/Button'
import { WaveDivider } from '@/components/ui/WaveDivider'
import { PageHeader } from '@/components/ui/PageHeader'
import { CtaBand } from '@/components/ui/CtaBand'

export const metadata: Metadata = {
  title: 'O Spiko Edu — škola jezika kroz razgovor',
  description:
    'Upoznaj Spiko Edu i Emu Aliđukić, profesorku nemačkog jezika koja vodi platformu. Naša metodologija — govoriš od prvog časa.',
}

export default function ONamaPage() {
  return (
    <>
      <PageHeader
        eyebrow="O nama"
        title="Iza Spiko-a stoji škola sa pravim profesorom"
        description="Ovo nije samo aplikacija — sadržaj pravi neko ko predaje već godinama. Cilj je jednostavan: da progovoriš samopouzdano, ne da samo znaš pravila."
        image="/cities/onama.jpg"
        waveFill="fill-surface"
      />

      {/* ════════════════════════════════════════════════════════════════
          EMA — autorka kursa
      ════════════════════════════════════════════════════════════════ */}
      <Section id="ema" className="bg-surface py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Ko stoji iza Spiko-a"
            title="Upoznaj Emu"
            description="Profesorka nemačkog jezika i autorka celokupnog sadržaja na platformi."
          />

          <Reveal className="mt-14">
            <div className="overflow-hidden rounded-3xl bg-white shadow-card">
              <div className="grid lg:grid-cols-[1fr_1.3fr]">
                {/* Fotka */}
                <div className="relative aspect-[4/5] lg:aspect-auto">
                  <Image
                    src="/team/ema.jpg"
                    alt="Ema Aliđukić — profesorka nemačkog jezika"
                    fill
                    sizes="(max-width: 1024px) 100vw, 500px"
                    className="object-cover object-top"
                    priority
                  />
                  <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ink shadow-soft">
                    🇩🇪 Nemački jezik
                  </div>
                </div>

                {/* Bio */}
                <div className="p-8 sm:p-12">
                  <h3 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
                    Ema Aliđukić
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-primary-dark">
                    Profesorka nemačkog jezika · Autorka kursa
                  </p>

                  <blockquote className="mt-6 rounded-2xl border-l-4 border-primary bg-surface p-5 italic text-ink/80">
                    „Pričanje je na prvom mestu — uz opuštenu, prijateljsku atmosferu u kojoj slobodno propričaš."
                  </blockquote>

                  <p className="mt-6 leading-relaxed text-ink/80">
                    Predajem nemački jezik svim uzrastima i nivoima, sa velikim
                    entuzijazmom i ljubavlju. Pričanje zauzima prvo mesto, a svaka
                    lekcija je strukturisana oko njega.
                  </p>
                  <p className="mt-4 leading-relaxed text-ink/80">
                    Spiko Edu je za mene način da to iskustvo prenesem online —
                    sav sadržaj na platformi (video lekcije, vežbe, audio materijal)
                    pripremam sama, na isti način na koji vodim časove uživo.
                  </p>
                </div>
              </div>

              {/* CV — iskustvo + obrazovanje + sertifikati */}
              <div className="grid gap-8 border-t border-ink/5 bg-white p-8 sm:p-12 lg:grid-cols-3">
                <CvBlock title="Iskustvo">
                  <TimelineItem period="2025 — danas" title="Profesorka nemačkog" place={'Edukativni centar „Spiko"'} />
                  <TimelineItem period="2023 — danas" title="Profesorka nemačkog" place={'Gimnazija „20. oktobar"'} />
                  <TimelineItem period="2020 — 2023" title="Profesorka nemačkog" place={'„Germania Zentrum"'} />
                  <TimelineItem period="2018 — 2020" title="Privatni časovi" place="Bačka Palanka i okolina" />
                </CvBlock>

                <CvBlock title="Obrazovanje">
                  <TimelineItem
                    period="2025 — danas"
                    title="MAS: Nemački jezik i književnost"
                    place="Filozofski fakultet, Novi Sad"
                  />
                  <TimelineItem
                    period="2018 — 2024"
                    title="OAS: Nemački jezik i književnost"
                    place="Filozofski fakultet, Novi Sad"
                  />
                  <TimelineItem
                    period="2014 — 2018"
                    title="Englesko-nemački smer"
                    place="Karlovačka filološka gimnazija"
                  />
                </CvBlock>

                <CvBlock title="Sertifikati">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-ink/10 bg-surface px-3 py-1 text-sm font-medium text-ink/70">
                      DSD II (C1) — 2018.
                    </span>
                  </div>
                  <div className="mt-6">
                    <Button href="/kontakt" variant="primary" size="md">
                      Pošalji poruku
                    </Button>
                  </div>
                </CvBlock>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          METODOLOGIJA — kako kurs funkcioniše
      ════════════════════════════════════════════════════════════════ */}
      <Section id="metodologija" className="relative overflow-hidden bg-white py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionHeading
                align="left"
                eyebrow="Metodologija"
                title="Pristup koji te zaista nauči da govoriš"
                description="Bez bubanja. Učiš jezik onako kako se zaista koristi — kroz razgovor i stvarne situacije."
              />
              <div className="mt-8 hidden rounded-3xl bg-ink p-8 text-white shadow-card lg:block">
                <p className="font-display text-xl font-semibold leading-snug">
                  „Govoriš od prve lekcije."
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Lekcije te vode kroz stvarne situacije — naručuješ kafu, pišeš email,
                  pričaš o planovima. Gramatika dolazi prirodno, kroz upotrebu.
                </p>
              </div>
            </div>

            <ol className="relative space-y-6 border-l-2 border-dashed border-primary/25 pl-10">
              {METHOD_STEPS.map((s, i) => (
                <Reveal as="li" key={s.num} delay={`${i * 0.08}s`} className="relative">
                  <span className="absolute -left-10 top-6 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full bg-primary font-display text-base font-extrabold text-ink shadow-soft ring-4 ring-white">
                    {s.num}
                  </span>
                  <div className="rounded-2xl border border-ink/5 bg-surface p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                    <span className="font-display text-sm font-bold text-primary-dark">
                      Korak {s.num}
                    </span>
                    <h3 className="mt-1 font-display text-lg font-bold text-ink">{s.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          ZAŠTO SPIKO — diferencijatori
      ════════════════════════════════════════════════════════════════ */}
      <Section id="zasto" className="relative overflow-hidden bg-ink py-20 sm:py-28">
        <div className="pointer-events-none absolute right-0 top-1/4 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />
        <div className="pointer-events-none absolute left-0 bottom-1/4 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />

        <Container className="relative">
          <SectionHeading
            light
            eyebrow="Zašto Spiko Edu"
            title="Šta dobijaš kao polaznik"
            description="Online platforma sa pravim profesorom iza nje — najbolje iz oba sveta."
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {REASONS.map((r, i) => (
              <TiltCard
                key={r.title}
                index={i}
                className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur hover:border-primary/40 hover:bg-white/10"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-3xl">
                  {r.icon}
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-white">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{r.text}</p>
              </TiltCard>
            ))}
          </div>
        </Container>

        <WaveDivider variant="curve" position="bottom" fillClassName="fill-white" />
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          CTA BAND
      ════════════════════════════════════════════════════════════════ */}
      <CtaBand
        title="Imaš pitanje? Piši slobodno."
        description="Ema ti rado odgovara na sve što te zanima — o kursu, lekcijama ili samom učenju jezika."
        primary={{ label: 'Pošalji poruku', href: '/kontakt' }}
        secondary={{ label: 'Pogledaj cenovnik', href: '/cenovnik' }}
        image="/cities/london.jpg"
      />
    </>
  )
}

/* ═════════════════════════════════════════════════════════════════════
   Podaci + helperi
═════════════════════════════════════════════════════════════════════ */

const METHOD_STEPS = [
  {
    num: '01',
    title: 'Početak od stvarnih situacija',
    text: 'Svaka lekcija polazi od konteksta koji ćeš zaista koristiti — predstavljanje, naručivanje, putovanje, posao.',
  },
  {
    num: '02',
    title: 'Govoriš odmah, gramatika usput',
    text: 'Ne učimo prvo pravila pa onda primenu — već suprotno. Pravila objašnjavamo onda kad zatrebaš, kroz primere.',
  },
  {
    num: '03',
    title: 'Vežbaš dok ne klikne',
    text: '4 tipa interaktivnih vežbi sa instant feedback-om. Ponavljaš dok nije lako, ne dok je samo „prošlo".',
  },
  {
    num: '04',
    title: 'AI tutor kad zapne',
    text: 'Ako nešto nije jasno, AI ti objasni baš tu reč ili pravilo — sa kontekstom lekcije.',
  },
]

const REASONS = [
  {
    icon: '👩‍🏫',
    title: 'Pravi profesor iza sadržaja',
    text: 'Sve lekcije priprema Ema lično — ista kvaliteta kao na časovima uživo, samo dostupno 24/7.',
  },
  {
    icon: '🤖',
    title: 'AI tutor uz tebe',
    text: 'Pitaj šta god te zanima u toku lekcije — odgovor uvek dolazi u kontekstu onoga što učiš.',
  },
  {
    icon: '⏰',
    title: 'Tvoj tempo, tvoji termini',
    text: 'Bez fiksnog rasporeda. Učiš 10 minuta jutros, sat naveče — kako tebi paše.',
  },
  {
    icon: '📱',
    title: 'Sa bilo kog uređaja',
    text: 'Laptop, telefon, tablet — sadržaj radi svuda. Nastavak tačno tamo gde si stao.',
  },
  {
    icon: '🎯',
    title: 'Svi nivoi pod jednom pretplatom',
    text: 'A1 do C1 — biraš odakle krećeš i koliko daleko ideš. Bez doplate za napredne nivoe.',
  },
  {
    icon: '🔄',
    title: 'Sadržaj koji raste',
    text: 'Dodajemo nove lekcije, audio materijale i vežbe — sve su uvek deo iste pretplate.',
  },
]

function CvBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-primary-dark">{title}</h4>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function TimelineItem({
  period,
  title,
  place,
}: {
  period: string
  title: string
  place: string
}) {
  return (
    <div className="border-l-2 border-ink/10 py-1 pl-4 [&:not(:last-child)]:mb-3">
      <p className="text-xs font-medium text-muted">{period}</p>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-muted">{place}</p>
    </div>
  )
}
