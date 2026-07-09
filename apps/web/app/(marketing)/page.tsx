import { Container } from '@/components/ui/Container'
import { Section, SectionHeading } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { WaveDivider } from '@/components/ui/WaveDivider'
import { Reveal } from '@/components/ui/Reveal'
import { TiltCard } from '@/components/ui/TiltCard'
import { CtaBand } from '@/components/ui/CtaBand'
import { MarketingHeroArt } from '@/components/MarketingHeroArt'
import { DemoLessonPreview } from '@/components/DemoLessonPreview'
import { FaqAccordion } from '@/components/FaqAccordion'

export default function LandingPage() {
  return (
    <div>
      {/* ════════════════════════════════════════════════════════════════
          1. HERO
      ════════════════════════════════════════════════════════════════ */}
      <Section className="overflow-hidden bg-ink pb-32 pt-12 sm:pt-16">
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />

        <Container className="relative z-20 grid items-center gap-12 lg:grid-cols-[1fr_auto]">
          <div className="animate-fade-up text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-primary-light">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Nemački & Engleski · A1 do C1
            </span>

            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Progovori{' '}
              <span className="relative inline-block text-primary">
                samopouzdano
                <svg
                  className="absolute -bottom-2 left-0 w-full text-primary/40"
                  viewBox="0 0 200 12"
                  fill="none"
                  aria-hidden
                >
                  <path d="M2 9C40 3 160 3 198 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>{' '}
              za 90 dana
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70 lg:mx-0">
              Video lekcije, interaktivne vežbe i AI asistent koji te uvek
              vodi kroz lekciju. Bez sramote — svojim tempom, na bilo kom uređaju.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start lg:justify-start">
              <Button href="/register" variant="primary" size="lg">
                Probaj besplatno
              </Button>
              <Button
                href="#demo"
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:border-primary hover:text-primary-light"
              >
                ▶ Pogledaj demo
              </Button>
            </div>

          </div>

          <div className="hidden lg:block lg:w-[420px]">
            <MarketingHeroArt />
          </div>
        </Container>

        <WaveDivider variant="wave" position="bottom" fillClassName="fill-white" />
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          2. TRUST BAR — priprema za međunarodne ispite
      ════════════════════════════════════════════════════════════════ */}
      <Section className="border-b border-ink/5 bg-white py-10">
        <Container>
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted">
            Priprema za međunarodne sertifikate
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {['Goethe', 'ÖSD', 'Cambridge', 'IELTS', 'TELC', 'TestDaF'].map((logo) => (
              <span key={logo} className="font-display text-xl font-bold text-ink/40 sm:text-2xl">
                {logo}
              </span>
            ))}
          </div>
        </Container>
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          3. FEATURES — šta dobijaš
      ════════════════════════════════════════════════════════════════ */}
      <Section id="kako-radi" className="bg-white py-24">
        <Container>
          <SectionHeading
            eyebrow="Šta dobijaš"
            title="Sve što ti treba, na jednom mestu"
            description="Spojili smo video, vežbu, AI tutora i konverzaciju u jedan tok — od prve reči do tečnog razgovora."
          />

          <Reveal stagger className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon="📺"
              title="Video lekcije"
              desc="Native speaker objašnjava temu, sa transkriptom, pauzom i regulisanjem brzine."
              tag="HD video"
            />
            <FeatureCard
              icon="✎"
              title="Interaktivne vežbe"
              desc="Multiple choice, popuni prazninu, uparivanje, redosled — instant feedback."
              tag="4 tipa pitanja"
            />
            <FeatureCard
              icon="🤖"
              title="AI asistent"
              desc="Pita ga sve što ti je nejasno — zna kontekst lekcije i ispravlja gramatiku."
              tag="24/7"
            />
            <FeatureCard
              icon="🎧"
              title="Audio materijal"
              desc="Slušaj izgovor pravog govornika — svaka nova reč i rečenica imaju prateći audio."
              tag="Native"
            />
          </Reveal>
        </Container>
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          4. KAKO FUNKCIONIŠE — 3 koraka
      ════════════════════════════════════════════════════════════════ */}
      <Section className="overflow-hidden bg-ink py-24">
        <WaveDivider variant="wave-soft" position="top" fillClassName="fill-white" />
        <div className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-32 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" />

        <Container className="relative z-10">
          <SectionHeading
            eyebrow="3 koraka"
            title="Kako počinješ"
            description="Bez upitnika, bez testova. Otvoriš nalog i kreneš."
            light
          />

          <Reveal stagger className="mt-14 grid gap-5 md:grid-cols-3">
            <StepCard
              num={1}
              title="Napravi nalog"
              desc="30 sekundi, bez kartice. Demo lekcije su odmah dostupne — vidiš kako sve radi."
            />
            <StepCard
              num={2}
              title="Pretplati se"
              desc="Otključavaš ceo kurs — sve nivoe od A1 do C1, AI tutora i sav budući sadržaj."
            />
            <StepCard
              num={3}
              title="Uči svojim tempom"
              desc="Video, vežbe, AI tutor — sve uvek tu. Bez rasporeda, na bilo kom uređaju."
            />
          </Reveal>
        </Container>

        <WaveDivider variant="wave" position="bottom" fillClassName="fill-white" />
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          5. DEMO PREVIEW
      ════════════════════════════════════════════════════════════════ */}
      <Section id="demo" className="bg-white py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <SectionHeading
                eyebrow="Pogledaj iznutra"
                title="Ovako izgleda jedna lekcija"
                description="Video + transkript + vežba sa instant ocenom. Sve usko povezano — bez prebacivanja između alata."
                align="left"
              />
              <ul className="mt-8 space-y-4">
                <Bullet>Transkript klizi sinhronizovano sa videom</Bullet>
                <Bullet>Klikni reč → AI ti je odmah objasni</Bullet>
                <Bullet>Posle videa — vežba sa proverom</Bullet>
                <Bullet>Pauza i nastavak tačno na istom mestu, na bilo kom uređaju</Bullet>
              </ul>
              <div className="mt-8">
                <Button href="/register" variant="primary" size="lg">
                  Otvori prvu lekciju
                </Button>
              </div>
            </div>

            <div className="relative">
              <DemoLessonPreview />
            </div>
          </div>
        </Container>
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          6. ZA KOGA — persone
      ════════════════════════════════════════════════════════════════ */}
      <Section className="bg-surface py-24">
        <Container>
          <SectionHeading
            eyebrow="Za koga je Spiko"
            title="Bez obzira gde startuješ"
            description="Putanja kursa se prilagođava tvom nivou i cilju. Postoje tri tipična profila."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <PersonaCard
              emoji="🌱"
              level="A1 — početnik"
              title="Krećem od nule"
              desc="Bez predznanja? Polazimo od pozdrava, alfabeta i prvih rečenica. Bez stresa, sa transkriptom i sporijim tempom."
              accent="primary"
              index={0}
            />
            <PersonaCard
              emoji="🚀"
              level="A2 → B2"
              title="Imam osnove iz škole"
              desc="Časovi iza tebe ali pričanje zapinje? Brzo te vodimo do tečnog razgovora — gramatika, vokabular i vežbe pričanja."
              accent="secondary"
              index={1}
            />
            <PersonaCard
              emoji="🎯"
              level="B1 → C1"
              title="Pripremam ispit"
              desc="Goethe, ÖSD, Cambridge, IELTS — mock testovi, ispitni format i savetnik koji vodi kroz svaki deo."
              accent="primary"
              index={2}
            />
          </div>
        </Container>
      </Section>


      {/* ════════════════════════════════════════════════════════════════
          9. FAQ
      ════════════════════════════════════════════════════════════════ */}
      <Section className="bg-surface py-24">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="Česta pitanja"
            title="Šta polaznici najčešće pitaju"
            description="Ako tvoje pitanje nije ovde — piši nam na kontakt."
          />

          <div className="mt-12">
            <FaqAccordion
              items={[
                {
                  q: 'Koliko vremena dnevno mi treba?',
                  a: '15–30 minuta je dovoljno za solidan napredak. Naši najuspešniji polaznici prosečno uče 23 dana zaredom po 25 minuta — to su realne brojke.',
                },
                {
                  q: 'Treba li mi predznanje da krenem?',
                  a: 'Ne. Kurs počinje od A1 (nula znanja). Ako već imaš osnove, na onboardingu izabereš nivo (A2, B1, B2…) i kreneš od odgovarajuće tačke.',
                },
                {
                  q: 'Kako se Spiko razlikuje od Duolingo i Babbel?',
                  a: 'Duolingo je gamifikacija sa kratkim vežbama. Spiko ima strukturisan kurs sa video lekcijama, transkriptom i AI tutorom koji zna kontekst lekcije. Drugi tier proizvoda.',
                },
                {
                  q: 'Mogu li uvek da otkažem pretplatu?',
                  a: 'Da. Iz svog profila, jednim klikom. Bez papirologije, bez razgovora sa podrškom. Pristup ostaje do kraja perioda koji je plaćen.',
                },
                {
                  q: 'Šta ako prekinem na par nedelja?',
                  a: 'Pretplata ide dok se ne otkaže. Niz dana se resetuje, ali napredak ostaje sačuvan — nastavak je tačno na istom mestu. Bez izgubljenog progresa.',
                },
              ]}
            />
          </div>
        </Container>
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          12. FINAL CTA
      ════════════════════════════════════════════════════════════════ */}
      <CtaBand
        eyebrow="Krećeš odmah"
        title="Vreme je da progovoriš"
        description="Prva lekcija već čeka. Napravi nalog za 30 sekundi — bez kartice, bez obaveza."
        primary={{ label: 'Probaj besplatno', href: '/register' }}
        secondary={{ label: 'Već imam nalog', href: '/login' }}
        note="🔒 Otkaži bilo kad · Bez skrivenih troškova · Demo lekcije besplatno"
        image="/cities/berlin.jpg"
      />
    </div>
  )
}

/* ═════════════════════════════════════════════════════════════════════
   COMPONENTS
═════════════════════════════════════════════════════════════════════ */

function FeatureCard({ icon, title, desc, tag }: { icon: string; title: string; desc: string; tag: string }) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-ink/5 bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/15 opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-3xl shadow-soft ring-1 ring-ink/5">
            {icon}
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-primary-dark">
            {tag}
          </span>
        </div>
        <h3 className="mt-5 font-display text-lg font-bold text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
      </div>
    </article>
  )
}

function StepCard({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm transition-all hover:-translate-y-1 hover:bg-white/10">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary font-display text-2xl font-extrabold text-ink shadow-card">
        {num}
      </div>
      <h3 className="mt-5 font-display text-xl font-bold text-white">{title}</h3>
      <p className="mt-3 leading-relaxed text-white/70">{desc}</p>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-ink">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-ink/85">{children}</span>
    </li>
  )
}

function PersonaCard({
  emoji,
  level,
  title,
  desc,
  accent,
  index = 0,
}: {
  emoji: string
  level: string
  title: string
  desc: string
  accent: 'primary' | 'secondary'
  index?: number
}) {
  const accentCls =
    accent === 'primary' ? 'bg-primary/10 text-primary-dark' : 'bg-secondary/10 text-secondary-dark'
  return (
    <TiltCard index={index} className="relative overflow-hidden rounded-3xl border border-ink/5 bg-white p-7 shadow-soft hover:shadow-card">
      <div className="text-5xl">{emoji}</div>
      <span className={`mt-5 inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider ${accentCls}`}>
        {level}
      </span>
      <h3 className="mt-3 font-display text-xl font-bold text-ink">{title}</h3>
      <p className="mt-3 leading-relaxed text-muted">{desc}</p>
    </TiltCard>
  )
}

