import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MERCHANT, SUPPORTED_CARDS } from '@/lib/merchant'

export const metadata = {
  title: 'Uslovi kupovine i plaćanja — Spiko Edu',
  description:
    'Kako funkcioniše plaćanje karticom na Spiko Edu — zaštita kartičnih podataka, konverzija valute i podržane kartice preko Raiffeisen banke.',
}

export default function PaymentPage() {
  return (
    <div className="bg-white">
      <Container className="py-16 sm:py-24">
        <Link href="/" className="text-sm font-medium text-muted hover:text-primary-dark">
          ← Početna
        </Link>

        <article className="prose-spiko mt-6 max-w-3xl">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Uslovi kupovine i plaćanja
          </h1>
          <p className="mt-3 text-sm text-muted">Poslednji put ažurirano: jul 2026.</p>

          <p className="mt-8 leading-relaxed text-ink/85">
            Ova stranica objašnjava kako se plaća pretplata na Spiko Edu, koje
            kartice su podržane i kako su zaštićeni tvoji podaci. Plaćanje karticom
            obrađuje <strong>{MERCHANT.bank}</strong> preko sigurnog servisa za
            elektronsku trgovinu.
          </p>

          <Section title="1. Kako se plaća">
            <ul>
              <li>Izabereš plan na stranici <Link href="/cenovnik">Cenovnik</Link> i pokreneš plaćanje.</li>
              <li>Preusmeravamo te na sigurnu stranicu {MERCHANT.bank} gde unosiš podatke o kartici.</li>
              <li>Posle uspešne transakcije, pristup sadržaju aktivira se automatski i odmah.</li>
              <li>Potvrdu o uplati dobijaš na email.</li>
            </ul>
          </Section>

          <Section title="2. Podržane platne kartice">
            <p>Prihvatamo sledeće kartice:</p>
            <div className="not-prose mt-3 flex flex-wrap gap-2">
              {SUPPORTED_CARDS.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center rounded-lg border border-ink/10 bg-surface px-3 py-1.5 text-sm font-semibold text-ink"
                >
                  {c}
                </span>
              ))}
            </div>
          </Section>

          <Section title="3. Izjava o konverziji valute">
            <p>
              Sva plaćanja biće izvršena u lokalnoj valuti Republike Srbije —
              dinar ({MERCHANT.currency}). Za informativni prikaz cena u drugim
              valutama koristi se srednji kurs Narodne banke Srbije. Iznos za koji
              će biti zadužena tvoja platna kartica biće izražen u tvojoj lokalnoj
              valuti kroz konverziju u istu, po kursu koji koriste kartičarske
              organizacije, a koji nam u trenutku transakcije ne može biti poznat.
              Kao rezultat te konverzije postoji mogućnost neznatne razlike od
              originalne cene navedene na našem sajtu.
            </p>
          </Section>

          <Section title="4. Zaštita poverljivih podataka o transakciji">
            <p>
              Prilikom unošenja podataka o platnoj kartici, poverljive informacije
              prenose se putem javne mreže u zaštićenoj (kriptovanoj) formi
              upotrebom <strong>SSL protokola</strong>, kao trenutno najsavremenije
              tehnologije.
            </p>
            <p>
              Sigurnost podataka prilikom kupovine garantuje procesor platnih
              kartica — {MERCHANT.bank} — pa se kompletan proces naplate obavlja na
              stranicama banke. Niti jednog trenutka podaci o platnoj kartici nisu
              dostupni našem sistemu — <strong>{MERCHANT.brandName} ne čuva brojeve
              kartica, datume isteka ni sigurnosne kodove</strong>.
            </p>
          </Section>

          <Section title="5. 3D Secure zaštita">
            <p>
              Plaćanje je dodatno zaštićeno standardom <strong>3D Secure</strong>{' '}
              (Verified by Visa, Mastercard Identity Check). Prilikom transakcije
              banka može zatražiti dodatnu potvrdu identiteta (npr. jednokratni kod
              iz mobilne aplikacije ili SMS-a) da bi se sprečila zloupotreba kartice.
            </p>
          </Section>

          <Section title="6. Povraćaj sredstava">
            <p>
              U slučaju povraćaja (refund), sredstva se vraćaju isključivo na istu
              karticu kojom je plaćeno, u skladu sa pravilima kartičarskih
              organizacija i {MERCHANT.bank}. Uslovi povraćaja opisani su u{' '}
              <Link href="/uslovi">Uslovima korišćenja</Link>.
            </p>
          </Section>

          <Section title="7. Podaci o trgovcu">
            <ul>
              <li><strong>{MERCHANT.legalName}</strong></li>
              <li>PIB: {MERCHANT.pib} · Matični broj: {MERCHANT.registrationNumber}</li>
              <li>{MERCHANT.address}, {MERCHANT.city}</li>
              <li>Email: <a href={`mailto:${MERCHANT.email}`}>{MERCHANT.email}</a> · Telefon: <a href={`tel:${MERCHANT.phone.replace(/\s/g, '')}`}>{MERCHANT.phone}</a></li>
            </ul>
          </Section>

          <Section title="8. Kontakt za pitanja o plaćanju">
            <p>
              Ako imaš pitanje o uplati, računu ili povraćaju, piši nam na{' '}
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
      .prose-spiko p { line-height: 1.7; margin: 0.5rem 0; }
      .prose-spiko a { color: #3e8fd0; text-decoration: underline; }
      .prose-spiko strong { font-weight: 700; color: #0e1622; }
    `}</style>
  )
}
