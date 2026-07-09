import { Container } from '@/components/ui/Container'
import { Logo } from '@/components/Logo'

type Variant = 'marketing' | 'app'

const marketingCols = [
  {
    title: 'Kurs',
    links: [
      { href: '/#kako-radi', label: 'Kako funkcioniše' },
      { href: '/#demo', label: 'Demo lekcija' },
      { href: '/cenovnik', label: 'Cenovnik' },
      { href: '/register', label: 'Probaj besplatno' },
    ],
  },
  {
    title: 'Škola',
    links: [
      { href: '/o-nama', label: 'O nama' },
      { href: '/kontakt', label: 'Kontakt' },
    ],
  },
  {
    title: 'Pravno',
    links: [
      { href: '/uslovi', label: 'Uslovi korišćenja' },
      { href: '/placanje', label: 'Uslovi kupovine i plaćanja' },
      { href: '/privatnost', label: 'Politika privatnosti' },
    ],
  },
]

const socialLinks = [
  { label: 'IG', href: 'https://instagram.com/' },
  { label: 'FB', href: 'https://facebook.com/' },
  { label: 'YT', href: 'https://youtube.com/' },
  { label: 'TT', href: 'https://tiktok.com/' },
]

export function Footer({ variant = 'marketing' }: { variant?: Variant }) {
  if (variant === 'app') return <AppFooter />
  return <MarketingFooter />
}

/* ────────── Marketing — pun footer sa conversion linkovima ────────── */
function MarketingFooter() {
  return (
    <footer className="bg-ink text-white">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo invert href="/" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Škola jezika za nemački i engleski. Učimo te da govoriš
              samopouzdano — kroz lekcije, vežbe i AI tutora.
            </p>
            <div className="mt-5 flex gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-xs font-bold text-white/70 transition-colors hover:border-primary hover:text-primary"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {marketingCols.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary-light">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-white/70 transition-colors hover:text-primary"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <BottomBar />
      </Container>
    </footer>
  )
}

/* ────────── App — kratak footer za logged-in stranice ────────── */
function AppFooter() {
  return (
    <footer className="border-t border-ink/5 bg-ink text-white">
      <Container className="py-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-6">
            <Logo invert href="/" />
            <div className="hidden h-6 w-px bg-white/15 sm:block" />
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              <a href="/kontakt" className="transition-colors hover:text-primary">
                Kontakt
              </a>
              <a href="/privatnost" className="transition-colors hover:text-primary">
                Privatnost
              </a>
              <a href="/uslovi" className="transition-colors hover:text-primary">
                Uslovi
              </a>
            </div>
          </div>
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Spiko Edu. Sva prava zadržana.
          </p>
        </div>
      </Container>
    </footer>
  )
}

function BottomBar() {
  return (
    <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/50 sm:flex-row sm:items-center">
      <p>© {new Date().getFullYear()} Spiko Edu. Sva prava zadržana.</p>
      <div className="flex gap-6">
        <a href="/privatnost" className="hover:text-primary">
          Privatnost
        </a>
        <a href="/uslovi" className="hover:text-primary">
          Uslovi
        </a>
        <a href="/kontakt" className="hover:text-primary">
          Kontakt
        </a>
      </div>
    </div>
  )
}
