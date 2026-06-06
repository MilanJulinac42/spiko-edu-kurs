import { Container } from '@/components/ui/Container'
import { Logo } from '@/components/Logo'

const cols = [
  {
    title: 'Kurs',
    links: [
      { href: '#kako-radi', label: 'Kako funkcioniše' },
      { href: '#demo', label: 'Demo lekcija' },
      { href: '#pricing', label: 'Pretplata' },
      { href: '/register', label: 'Probaj besplatno' },
    ],
  },
  {
    title: 'Škola',
    links: [
      { href: '#', label: 'O nama' },
      { href: '#', label: 'Nastavnici' },
      { href: '#', label: 'Utisci polaznika' },
      { href: '#', label: 'Blog' },
    ],
  },
  {
    title: 'Pomoć',
    links: [
      { href: '#', label: 'Česta pitanja' },
      { href: '#', label: 'Kontakt' },
      { href: '#', label: 'Uslovi korišćenja' },
      { href: '#', label: 'Privatnost' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-ink text-white">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo invert href="/" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Škola jezika za nemački i engleski. Učimo te da govoriš
              samopouzdano — kroz lekcije, vežbe i AI tutora.
            </p>
            <div className="mt-5 flex gap-3">
              {['IG', 'FB', 'YT', 'TT'].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-xs font-bold text-white/70 transition-colors hover:border-primary hover:text-primary"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {cols.map((col) => (
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

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/50 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Spiko Edu. Sva prava zadržana.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary">
              Politika privatnosti
            </a>
            <a href="#" className="hover:text-primary">
              Uslovi korišćenja
            </a>
            <a href="#" className="hover:text-primary">
              Kontakt
            </a>
          </div>
        </div>
      </Container>
    </footer>
  )
}
