import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MERCHANT } from '@/lib/merchant'

export const metadata = {
  title: 'Politika privatnosti — Spiko Edu',
}

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      <Container className="py-16 sm:py-24">
        <Link href="/" className="text-sm font-medium text-muted hover:text-primary-dark">
          ← Početna
        </Link>

        <article className="prose-spiko mt-6 max-w-3xl">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Politika privatnosti
          </h1>
          <p className="mt-3 text-sm text-muted">Poslednji put ažurirano: jul 2026.</p>

          <p className="mt-8 leading-relaxed text-ink/85">
            {MERCHANT.brandName} poštuje tvoju privatnost. Ova politika objašnjava
            koje podatke o ličnosti prikupljamo, zašto, kako ih čuvamo i koja su
            tvoja prava — u skladu sa <strong>Zakonom o zaštiti podataka o ličnosti
            Republike Srbije</strong> (i Opštom uredbom o zaštiti podataka — GDPR,
            gde je primenjivo).
          </p>

          <Section title="1. Rukovalac podacima">
            <p>Rukovalac podacima o ličnosti je:</p>
            <ul>
              <li><strong>{MERCHANT.legalName}</strong></li>
              <li>PIB: {MERCHANT.pib} · Matični broj: {MERCHANT.registrationNumber}</li>
              <li>{MERCHANT.address}, {MERCHANT.city}</li>
              <li>Email: <a href={`mailto:${MERCHANT.email}`}>{MERCHANT.email}</a></li>
            </ul>
          </Section>

          <Section title="2. Koje podatke prikupljamo">
            <ul>
              <li><strong>Podaci naloga</strong> — email, ime, lozinka (čuvana u hešovanom obliku, nikad u čitljivom).</li>
              <li><strong>Profilni podaci</strong> — maternji jezik, ciljni CEFR nivo, lični cilj.</li>
              <li><strong>Podaci o korišćenju</strong> — koje lekcije gledaš, vežbe rešavaš, vreme učenja, niz dana.</li>
              <li><strong>Komunikacija</strong> — komentari, ocene kurseva, lične beleške, bookmarkovane reči.</li>
              <li><strong>Podaci o plaćanju</strong> — iznos, datum i status transakcije. <strong>Brojeve platnih kartica ne prikupljamo niti čuvamo</strong> — njih obrađuje isključivo banka (vidi tačku 4).</li>
              <li><strong>Tehnički podaci</strong> — IP adresa, tip uređaja, brauzer, log fajlovi.</li>
            </ul>
          </Section>

          <Section title="3. Pravni osnov i svrha obrade">
            <ul>
              <li><strong>Izvršenje ugovora</strong> — da ti pružimo pretplaćenu uslugu, personalizovan kurs i pratimo napredak.</li>
              <li><strong>Legitimni interes</strong> — sigurnost naloga, sprečavanje zloupotrebe, poboljšanje usluge.</li>
              <li><strong>Zakonska obaveza</strong> — čuvanje podataka o transakcijama za potrebe računovodstva i poreza.</li>
              <li><strong>Pristanak</strong> — za sve što nije pokriveno gornjim (npr. opciona obaveštenja), gde tražimo tvoj izričit pristanak.</li>
            </ul>
          </Section>

          <Section title="4. S kim delimo podatke (obrađivači)">
            <p>Ne prodajemo tvoje podatke. Delimo ih samo sa servisima neophodnim za rad platforme:</p>
            <ul>
              <li><strong>{MERCHANT.bank}</strong> — obrada plaćanja platnim karticama. Podaci o kartici unose se direktno na stranicama banke; nama nisu dostupni.</li>
              <li><strong>Supabase</strong> — autentifikacija i baza podataka (hosting u EU).</li>
              <li><strong>Bunny.net</strong> — distribucija video i audio sadržaja preko CDN-a.</li>
              <li><strong>Anthropic (Claude)</strong> i <strong>OpenAI</strong> — AI asistent i prevod reči. Sadržaj tvojih poruka i odabrane reči šaljemo radi generisanja odgovora; ne koriste se za treniranje modela.</li>
            </ul>
          </Section>

          <Section title="5. Koliko dugo čuvamo podatke">
            <p>
              Podatke o nalogu i napretku čuvamo dok je nalog aktivan. Kad obrišeš
              nalog (Profil → Opasna zona), trajno brišemo profil i sav vezan sadržaj
              — komentare, beleške, bookmarka, napredak. Podatke o transakcijama
              čuvamo onoliko koliko nalažu poreski i računovodstveni propisi.
            </p>
          </Section>

          <Section title="6. Tvoja prava">
            <ul>
              <li>Pravo na pristup svojim podacima.</li>
              <li>Pravo na ispravku (kroz Profil stranicu).</li>
              <li>Pravo na brisanje naloga (potpuno, trajno).</li>
              <li>Pravo na prenosivost podataka (izvoz — kontaktiraj nas).</li>
              <li>Pravo na prigovor Povereniku za informacije od javnog značaja i zaštitu podataka o ličnosti.</li>
            </ul>
            <p>
              Za ostvarivanje bilo kog prava piši nam na{' '}
              <a href={`mailto:${MERCHANT.email}`}>{MERCHANT.email}</a>.
            </p>
          </Section>

          <Section title="7. Kolačići">
            <p>
              Koristimo isključivo nužne kolačiće za autentifikaciju i sesiju. Ne
              koristimo kolačiće za reklamiranje ni za praćenje preko drugih sajtova.
            </p>
          </Section>

          <Section title="8. Sigurnost">
            <p>
              Podatke štitimo tehničkim i organizacionim merama: šifrovan prenos
              (SSL/TLS), heširanje lozinki, kontrola pristupa. Ni jedan sistem nije
              apsolutno bezbedan, ali se trudimo da rizik svedemo na minimum.
            </p>
          </Section>

          <Section title="9. Kontakt">
            <p>
              Pitanja o privatnosti? Piši nam na{' '}
              <a href={`mailto:${MERCHANT.email}`}>{MERCHANT.email}</a> ili preko{' '}
              <Link href="/kontakt">kontakt forme</Link>.
            </p>
          </Section>
        </article>

        <Style />
      </Container>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
      <div className="mt-3 text-ink/85">{children}</div>
    </section>
  )
}

function Style() {
  return (
    <style>{`
      .prose-spiko ul { list-style: disc; padding-left: 1.6rem; margin: 0.6rem 0; }
      .prose-spiko li { margin: 0.3rem 0; line-height: 1.6; }
      .prose-spiko p { line-height: 1.7; }
      .prose-spiko a { color: #3e8fd0; text-decoration: underline; }
      .prose-spiko strong { font-weight: 700; color: #0e1622; }
    `}</style>
  )
}
