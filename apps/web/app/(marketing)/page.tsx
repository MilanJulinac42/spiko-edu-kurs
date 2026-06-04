import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Section, SectionHeading } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { WaveDivider } from '@/components/ui/WaveDivider'
import { StudentHeroArt } from '@/components/StudentHeroArt'

export default function LandingPage() {
  return (
    <div>
      {/* ────────── HERO ────────── */}
      <Section className="overflow-hidden bg-ink pb-32 pt-12 sm:pt-16">
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />

        <Container className="relative z-20 grid items-center gap-12 lg:grid-cols-[1fr_auto]">
          <div className="animate-fade-up text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-primary-light">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Student portal
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
              na novom jeziku
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70 lg:mx-0">
              Video lekcije, interaktivne vežbe, AI asistent i konverzacije sa
              nastavnicima — sve na jednom mestu. Uči svojim tempom, gde god da si.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start lg:justify-start">
              <Button href="/register" variant="primary" size="lg">
                Napravi nalog
              </Button>
              <Button
                href="/login"
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:border-primary hover:text-primary-light"
              >
                Već imam nalog
              </Button>
            </div>

            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
              <HeroStat value="1200+" label="Polaznika" />
              <HeroStat value="98%" label="Položenih ispita" />
              <HeroStat value="24/7" label="AI asistent" />
            </dl>
          </div>

          <div className="hidden lg:block lg:w-[420px]">
            <StudentHeroArt percent={68} totalLessons={30} completedLessons={20} level="B1" streak={7} />
          </div>
        </Container>

        <WaveDivider variant="wave" position="bottom" fillClassName="fill-white" />
      </Section>

      {/* ────────── FEATURES ────────── */}
      <Section id="kako-radi" className="bg-white py-24">
        <Container>
          <SectionHeading
            eyebrow="Kako radi"
            title="Sve što ti treba da savladaš jezik"
            description="Spojeno u jedan glatki tok — od prve reči do tečnog razgovora."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon="📺"
              title="Video lekcije"
              desc="Native speaker objašnjava temu, sa transkriptom i pauzama za vežbu."
            />
            <FeatureCard
              icon="✎"
              title="Interaktivne vežbe"
              desc="4 tipa: multiple choice, popuni prazninu, uparivanje, redosled. Instant feedback."
            />
            <FeatureCard
              icon="🤖"
              title="AI asistent"
              desc="Pita ga sve što ti je nejasno — zna kontekst tvoje lekcije i ispravlja gramatiku."
            />
          </div>
        </Container>
      </Section>

      {/* ────────── HOW IT WORKS — STEPS ────────── */}
      <Section className="overflow-hidden bg-ink py-24">
        <WaveDivider variant="wave-soft" position="top" fillClassName="fill-white" />
        <div className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-32 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" />

        <Container className="relative z-10">
          <SectionHeading
            eyebrow="3 koraka"
            title="Tvoj put kroz kurs"
            description="Idi redom — svaki modul se nadovezuje na prethodni i gradi temelje."
            align="left"
            light
          />

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <StepCard num={1} title="Prijavi se" desc="Registruj nalog za par sekundi i pristupi svom kursu." />
            <StepCard num={2} title="Uči redom" desc="Prati putanju kursa — video, vežba, ponavljanje." />
            <StepCard num={3} title="Progovori" desc="Konverzacije sa nastavnikom i AI asistent kad zatreba." />
          </div>
        </Container>

        <WaveDivider variant="wave" position="bottom" fillClassName="fill-surface" />
      </Section>

      {/* ────────── PROGRESS / GAMIFICATION ────────── */}
      <Section className="bg-surface py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="Motivacija"
                title="Niz dana, napredak, postignuća"
                description="Praćenje napretka koje te drži u igri. Vidi kako rasteš svaki dan."
                align="left"
              />
              <ul className="mt-8 space-y-4">
                <Bullet>Streak brojač — koliko dana zaredom si učila</Bullet>
                <Bullet>Procenat kursa i lekcija završenih</Bullet>
                <Bullet>Minute provedene u učenju</Bullet>
                <Bullet>CEFR nivo i napredak ka sledećem</Bullet>
              </ul>
              <div className="mt-8">
                <Button href="/register" variant="primary" size="lg">
                  Kreni odmah →
                </Button>
              </div>
            </div>

            <div className="relative grid grid-cols-2 gap-4">
              <StatBox icon="🔥" value="7" label="dana zaredom" accent="primary" />
              <StatBox icon="✓" value="20/30" label="lekcija" accent="secondary" />
              <StatBox icon="⏱" value="142m" label="vreme učenja" accent="secondary" />
              <StatBox icon="🎯" value="B1" label="CEFR nivo" accent="primary" />
            </div>
          </div>
        </Container>
      </Section>

      {/* ────────── FINAL CTA ────────── */}
      <Section className="bg-white py-24">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-ink p-10 text-center shadow-card sm:p-16">
            <div className="pointer-events-none absolute -left-20 -top-10 h-60 w-60 rounded-full bg-primary/25 blur-3xl" />
            <div className="pointer-events-none absolute -right-10 top-20 h-72 w-72 rounded-full bg-secondary/25 blur-3xl" />

            <div className="relative z-10">
              <h2 className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                Spreman da progovoriš?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
                Napravi nalog i pristupi kursu, vežbama i AI asistentu. Prva lekcija već čeka.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href="/register" variant="primary" size="lg">
                  Napravi nalog
                </Button>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-white/70 transition-colors hover:text-primary-light"
                >
                  Već imam nalog →
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  )
}

/* ─── primitives ─── */

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center lg:text-left">
      <dt className="font-display text-2xl font-bold text-primary sm:text-3xl">{value}</dt>
      <dd className="mt-1 text-xs text-white/60 sm:text-sm">{label}</dd>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-ink/5 bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/15 blur-2xl transition-opacity group-hover:opacity-100 opacity-60" />
      <div className="relative">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-3xl shadow-soft ring-1 ring-ink/5">
          {icon}
        </div>
        <h3 className="mt-5 font-display text-xl font-bold text-ink">{title}</h3>
        <p className="mt-3 leading-relaxed text-muted">{desc}</p>
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

function StatBox({
  icon,
  value,
  label,
  accent,
}: {
  icon: string
  value: string
  label: string
  accent: 'primary' | 'secondary'
}) {
  const dotCls = accent === 'primary' ? 'bg-primary' : 'bg-secondary'
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-ink/5 bg-white p-6 shadow-soft">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-30 blur-2xl ${dotCls}`} />
      <div className="relative">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-surface text-2xl shadow-soft ring-1 ring-ink/5">
          {icon}
        </div>
        <p className="mt-4 font-display text-3xl font-extrabold text-ink">{value}</p>
        <p className="mt-1 text-sm text-muted">{label}</p>
      </div>
    </div>
  )
}
