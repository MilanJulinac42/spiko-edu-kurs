import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Section, SectionHeading } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { WaveDivider } from '@/components/ui/WaveDivider'
import { StudentHeroArt } from '@/components/StudentHeroArt'
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

            {/* Social proof bar */}
            <div className="mt-8 flex flex-col items-center gap-4 lg:items-start">
              <div className="flex items-center gap-3">
                <Stars />
                <span className="text-sm font-semibold text-white">
                  4.9 / 5
                  <span className="ml-1.5 font-normal text-white/60">· 340 ocena</span>
                </span>
              </div>
              <AvatarsRow />
            </div>
          </div>

          <div className="hidden lg:block lg:w-[420px]">
            <StudentHeroArt percent={68} totalLessons={30} completedLessons={20} level="B1" streak={7} />
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

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              icon="🎙"
              title="Konverzacije"
              desc="1-na-1 sa sertifikovanim nastavnikom preko Google Meet-a. Zakažeš u par klikova."
              tag="Live"
            />
          </div>
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
            eyebrow="3 koraka do tečnog"
            title="Tvoj put kroz kurs"
            description="Bez sumnjanja i preskakanja — sve je linearno i jasno."
            light
          />

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <StepCard
              num={1}
              title="Napravi nalog"
              desc="30 sekundi. Email, lozinka i prvi modul ti je već otključan."
            />
            <StepCard
              num={2}
              title="Odredi nivo i cilj"
              desc="Kratak test ili izaberi A1–C1. Postavi cilj (putovanje, ispit, posao)."
            />
            <StepCard
              num={3}
              title="Uči redom"
              desc="Video → vežba → AI tutor ako zatreba. Putanja te vodi do cilja."
            />
          </div>
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
                <Bullet>Pauza i nastavi tamo gde si stao na bilo kom uređaju</Bullet>
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
              desc="Nikad nisi učila ili imaš samo par reči? Polazimo od pozdrava, alfabeta i prvih rečenica. Bez stresa, sa transkriptom i sporijim tempom."
              accent="primary"
            />
            <PersonaCard
              emoji="🚀"
              level="A2 → B2"
              title="Imam osnove iz škole"
              desc="Bila si na časovima ali ne pričaš slobodno? Brzo te vodimo do tečnog razgovora — gramatika, vokabular i vežbe pričanja."
              accent="secondary"
            />
            <PersonaCard
              emoji="🎯"
              level="B1 → C1"
              title="Pripremam ispit"
              desc="Goethe, ÖSD, Cambridge, IELTS — mock testovi, ispitni format i savetnik koji te vodi kroz svaki deo."
              accent="primary"
            />
          </div>
        </Container>
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          7. TESTIMONIALS
      ════════════════════════════════════════════════════════════════ */}
      <Section className="bg-white py-24">
        <Container>
          <SectionHeading
            eyebrow="Utisci polaznika"
            title="Šta kažu oni koji su prošli put"
            description="Nije naša priča — njihova. Pravi rezultati za par meseci učenja."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <TestimonialCard
              name="Marija K."
              level="A1 → B2, 4 meseca"
              quote="Konačno sam progovorila bez straha. AI asistent mi je promenio igru — pitam ga sve usred lekcije."
              initials="MK"
              accent="primary"
            />
            <TestimonialCard
              name="Petar S."
              level="Položio Goethe B2"
              quote="Spiko je posebno dobar za pripremu ispita. Mock testovi su me spasli — prvi put položio iz prve."
              initials="PS"
              accent="secondary"
            />
            <TestimonialCard
              name="Ana D."
              level="A1 → A2, 6 nedelja"
              quote="Najgore mi je išla gramatika. Video sa pauzom i pažljiv tempo su mi otvorili vrata."
              initials="AD"
              accent="primary"
            />
            <TestimonialCard
              name="Stefan M."
              level="Poslovni engleski, 3 meseca"
              quote="Trebao mi je engleski za promociju. Konverzacije sa nastavnikom su pravi deal — bez njih ne bih uspeo."
              initials="SM"
              accent="secondary"
            />
          </div>
        </Container>
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          8. REZULTATI
      ════════════════════════════════════════════════════════════════ */}
      <Section className="bg-surface py-24">
        <Container>
          <SectionHeading
            eyebrow="Brojevi"
            title="Rezultati koji se mere"
            description="Više od 1.200 polaznika je prošlo kroz program — evo prosečnih brojki."
          />

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ResultCard value="1.200+" label="polaznika" hint="prošlo kroz program" icon="👥" />
            <ResultCard value="98%" label="položi ispit" hint="iz prvog pokušaja" icon="🎓" />
            <ResultCard value="4.9 / 5" label="prosečna ocena" hint="iz 340 ocena" icon="⭐" />
            <ResultCard value="23" label="dana niz" hint="prosek aktivnog polaznika" icon="🔥" />
          </div>
        </Container>
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          9. NASTAVNICI
      ════════════════════════════════════════════════════════════════ */}
      <Section className="bg-white py-24">
        <Container>
          <SectionHeading
            eyebrow="Tim"
            title="Tvoji nastavnici"
            description="Sertifikovani, sa iskustvom od najmanje 5 godina. Voze konverzacione časove uživo."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <TeacherCard
              name="Ana Marić"
              role="Nemački · C2"
              cert="Goethe sertifikovana"
              years={9}
              initials="AM"
              gradient="from-primary to-secondary"
            />
            <TeacherCard
              name="Marko Tešić"
              role="Engleski · C2"
              cert="IELTS examiner"
              years={7}
              initials="MT"
              gradient="from-secondary to-primary"
            />
            <TeacherCard
              name="Iva Rajković"
              role="Nemački · Native"
              cert="Iz Berlina, ÖSD trainer"
              years={11}
              initials="IR"
              gradient="from-primary-dark to-primary"
            />
            <TeacherCard
              name="Stefan Pavlović"
              role="Engleski · C2"
              cert="Cambridge CELTA"
              years={6}
              initials="SP"
              gradient="from-secondary-dark to-secondary"
            />
          </div>
        </Container>
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          10. PRICING
      ════════════════════════════════════════════════════════════════ */}
      <Section id="pricing" className="overflow-hidden bg-ink py-24">
        <WaveDivider variant="wave-soft" position="top" fillClassName="fill-white" />
        <div className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-32 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" />

        <Container className="relative z-10">
          <SectionHeading
            eyebrow="Pretplata"
            title="Jasna cena, bez skrivenih troškova"
            description="Svaki plan otključava ceo kurs, AI asistenta i neograničene vežbe. Otkaži bilo kad."
            light
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <PricingCard
              name="Mesečno"
              price="19"
              period="/mes"
              features={[
                'Ceo kurs (svi moduli)',
                'AI asistent — neograničeno',
                'Vežbe sa instant feedbackom',
                'Praćenje napretka',
                'Email podrška',
              ]}
              cta="Probaj 14 dana besplatno"
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
                '2 konverzacije sa nastavnikom mesečno',
                'Mock ispitni testovi',
                'Prioritetna podrška',
                'Sertifikat na kraju kursa',
              ]}
              cta="Probaj 14 dana besplatno"
            />
            <PricingCard
              name="Lifetime"
              price="399"
              period="jednom"
              features={[
                'Sve iz Godišnjeg plana',
                'Doživotan pristup svim updatovima',
                '4 konverzacije mesečno',
                'Privatni Slack kanal sa nastavnicima',
                'Bez ponovnog plaćanja, ikada',
              ]}
              cta="Uzmi Lifetime"
            />
          </div>

          {/* Guarantee strip */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/70">
            <span className="inline-flex items-center gap-2">
              <Check /> 14 dana refund bez pitanja
            </span>
            <span className="inline-flex items-center gap-2">
              <Check /> Otkaži bilo kad
            </span>
            <span className="inline-flex items-center gap-2">
              <Check /> SSL plaćanje
            </span>
            <span className="inline-flex items-center gap-2">
              <Check /> Bez papirologije
            </span>
          </div>
        </Container>

        <WaveDivider variant="wave" position="bottom" fillClassName="fill-surface" />
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          11. FAQ
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
                  a: 'Duolingo je gamifikacija sa kratkim vežbama. Mi imamo strukturisan kurs sa video lekcijama, transkriptom, AI tutorom koji zna kontekst, i konverzacije sa pravim nastavnikom. Drugi tier proizvoda.',
                },
                {
                  q: 'Mogu li uvek da otkažem?',
                  a: 'Da. Iz svog profila, jednim klikom. Bez papirologije, bez razgovora sa podrškom. U prvih 14 dana ti vraćamo i pun iznos.',
                },
                {
                  q: 'Kada počinjem konverzacije sa nastavnikom?',
                  a: 'Već posle 2–3 lekcije možeš da zakažeš prvi termin. Godišnji plan ima 2 termina mesečno, Lifetime 4. Termine biraš sam preko Google Meet integracije.',
                },
                {
                  q: 'Da li dobijam sertifikat na kraju?',
                  a: 'Da, ali samo na Godišnjem i Lifetime planu. Sertifikat sadrži tvoj nivo (CEFR) i broj časova — odgovara školskom standardu, ali nije zamena za Goethe/IELTS koje radiš odvojeno.',
                },
                {
                  q: 'Šta ako prekinem na par nedelja?',
                  a: 'Pretplata ide dok je ne otkažeš. Niz dana se resetuje, ali napredak ostaje sačuvan — vratiš se tačno gde si stao. Bez izgubljenog progresa, nikad.',
                },
              ]}
            />
          </div>
        </Container>
      </Section>

      {/* ════════════════════════════════════════════════════════════════
          12. FINAL CTA
      ════════════════════════════════════════════════════════════════ */}
      <Section className="bg-white py-24">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-ink p-10 text-center shadow-card sm:p-16">
            <div className="pointer-events-none absolute -left-20 -top-10 h-60 w-60 rounded-full bg-primary/25 blur-3xl" />
            <div className="pointer-events-none absolute -right-10 top-20 h-72 w-72 rounded-full bg-secondary/25 blur-3xl" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-light">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Krećeš odmah
              </span>
              <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight text-white sm:text-5xl">
                Spreman da progovoriš?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
                Prva lekcija već čeka. Napravi nalog za 30 sekundi — bez kartice, bez obaveza.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href="/register" variant="primary" size="lg">
                  Probaj besplatno
                </Button>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-white/70 transition-colors hover:text-primary-light"
                >
                  Već imam nalog →
                </Link>
              </div>
              <p className="mt-6 text-xs text-white/40">
                🔒 14 dana refund bez pitanja · Otkaži bilo kad · Nema skrivenih troškova
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  )
}

/* ═════════════════════════════════════════════════════════════════════
   COMPONENTS
═════════════════════════════════════════════════════════════════════ */

function Stars() {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-4 w-4 fill-primary">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

function AvatarsRow() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {['MK', 'PS', 'AD', 'SM', 'IR'].map((s, i) => (
          <span
            key={i}
            className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white"
          >
            {s}
          </span>
        ))}
      </div>
      <span className="text-sm text-white/60">
        Pridruži se <strong className="text-white">1.200+ polaznika</strong>
      </span>
    </div>
  )
}

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
}: {
  emoji: string
  level: string
  title: string
  desc: string
  accent: 'primary' | 'secondary'
}) {
  const accentCls =
    accent === 'primary' ? 'bg-primary/10 text-primary-dark' : 'bg-secondary/10 text-secondary-dark'
  return (
    <article className="group relative overflow-hidden rounded-3xl bg-white p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
      <div className="text-5xl">{emoji}</div>
      <span className={`mt-5 inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider ${accentCls}`}>
        {level}
      </span>
      <h3 className="mt-3 font-display text-xl font-bold text-ink">{title}</h3>
      <p className="mt-3 leading-relaxed text-muted">{desc}</p>
    </article>
  )
}

function TestimonialCard({
  name,
  level,
  quote,
  initials,
  accent,
}: {
  name: string
  level: string
  quote: string
  initials: string
  accent: 'primary' | 'secondary'
}) {
  const ringCls = accent === 'primary' ? 'from-primary to-primary-light' : 'from-secondary to-secondary-light'
  return (
    <article className="flex h-full flex-col rounded-3xl border border-ink/5 bg-white p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
      <div className="flex items-center gap-0.5 text-primary">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      <p className="mt-4 flex-1 text-ink/85">&ldquo;{quote}&rdquo;</p>
      <div className="mt-6 flex items-center gap-3 border-t border-ink/5 pt-5">
        <span className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br ${ringCls} text-sm font-bold text-white`}>
          {initials}
        </span>
        <div>
          <p className="text-sm font-bold text-ink">{name}</p>
          <p className="text-xs text-muted">{level}</p>
        </div>
      </div>
    </article>
  )
}

function ResultCard({ value, label, hint, icon }: { value: string; label: string; hint: string; icon: string }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-ink/5 bg-white p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/20 opacity-30 blur-2xl transition-opacity group-hover:opacity-60" />
      <div className="relative">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-surface text-2xl shadow-soft ring-1 ring-ink/5">
          {icon}
        </div>
        <p className="mt-4 font-display text-4xl font-extrabold text-ink">{value}</p>
        <p className="mt-1 text-sm font-semibold text-ink/80">{label}</p>
        <p className="mt-1 text-xs text-muted">{hint}</p>
      </div>
    </div>
  )
}

function TeacherCard({
  name,
  role,
  cert,
  years,
  initials,
  gradient,
}: {
  name: string
  role: string
  cert: string
  years: number
  initials: string
  gradient: string
}) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-ink/5 bg-white shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
      <div className={`relative aspect-square bg-gradient-to-br ${gradient}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.25),_transparent_60%)]" />
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-display text-5xl font-extrabold text-white drop-shadow-lg">{initials}</span>
        </div>
        <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-ink shadow-soft">
          {years}+ god
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-bold text-ink">{name}</h3>
        <p className="mt-1 text-sm text-primary-dark">{role}</p>
        <p className="mt-2 text-xs text-muted">{cert}</p>
      </div>
    </article>
  )
}

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
          ? 'bg-gradient-to-br from-primary to-primary-light text-ink shadow-card scale-[1.02]'
          : 'border border-white/10 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10'
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-primary shadow-card">
          ★ {badge}
        </span>
      )}

      <div>
        <h3 className={`font-display text-xl font-bold ${featured ? 'text-ink' : 'text-white'}`}>{name}</h3>
        <div className="mt-4 flex items-baseline gap-1">
          <span className={`text-sm font-bold ${featured ? 'text-ink/60' : 'text-white/60'}`}>€</span>
          <span className={`font-display text-5xl font-extrabold ${featured ? 'text-ink' : 'text-white'}`}>
            {price}
          </span>
          <span className={`ml-1 text-sm ${featured ? 'text-ink/60' : 'text-white/60'}`}>{period}</span>
        </div>
        {saving && (
          <p className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${featured ? 'bg-ink/10 text-ink' : 'bg-primary/20 text-primary-light'}`}>
            🎁 {saving}
          </p>
        )}
      </div>

      <ul className="mt-7 flex-1 space-y-3 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${featured ? 'bg-ink text-primary' : 'bg-primary text-ink'}`}>
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className={featured ? 'text-ink/85' : 'text-white/80'}>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Button
          href="/register"
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
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
