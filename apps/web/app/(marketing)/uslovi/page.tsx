import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MERCHANT } from '@/lib/merchant'

export const metadata = {
  title: 'Uslovi korišćenja — Spiko Edu',
}

export default function TermsPage() {
  return (
    <div className="bg-white">
      <Container className="py-16 sm:py-24">
        <Link href="/" className="text-sm font-medium text-muted hover:text-primary-dark">
          ← Početna
        </Link>

        <article className="prose-spiko mt-6 max-w-3xl">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Uslovi korišćenja
          </h1>
          <p className="mt-3 text-sm text-muted">Poslednji put ažurirano: jul 2026.</p>

          <p className="mt-8 leading-relaxed text-ink/85">
            Otvaranjem naloga ili plaćanjem pretplate na Spiko Edu prihvataš ove
            uslove korišćenja. Molimo te da ih pažljivo pročitaš. Za detalje o
            plaćanju karticom pogledaj i{' '}
            <Link href="/placanje">Uslove kupovine i plaćanja</Link> i{' '}
            <Link href="/privatnost">Politiku privatnosti</Link>.
          </p>

          <Section title="1. Podaci o pružaocu usluge">
            <p>Uslugu Spiko Edu pruža:</p>
            <ul>
              <li><strong>{MERCHANT.legalName}</strong></li>
              <li>PIB: {MERCHANT.pib}</li>
              <li>Matični broj: {MERCHANT.registrationNumber}</li>
              <li>Sedište: {MERCHANT.address}, {MERCHANT.city}</li>
              <li>Email: <a href={`mailto:${MERCHANT.email}`}>{MERCHANT.email}</a></li>
              <li>Telefon: <a href={`tel:${MERCHANT.phone.replace(/\s/g, '')}`}>{MERCHANT.phone}</a></li>
            </ul>
          </Section>

          <Section title="2. Opis usluge">
            <p>
              Spiko Edu je onlajn platforma za učenje stranih jezika (nemački i
              engleski). Pretplata otključava pristup video lekcijama, interaktivnim
              vežbama, audio materijalu i AI asistentu. Usluga je digitalna i
              isporučuje se elektronski — nema fizičke isporuke.
            </p>
          </Section>

          <Section title="3. Pretplata i cene">
            <ul>
              <li>Pretplata se naplaćuje mesečno, godišnje ili kao jednokratan Lifetime plan, zavisno od izabranog plana.</li>
              <li>
                Cene su iskazane na stranici{' '}
                <Link href="/cenovnik">Cenovnik</Link>
                {MERCHANT.vatRegistered === false
                  ? '. Trgovac nije u sistemu PDV-a (član 33. Zakona o PDV), pa cene ne sadrže PDV.'
                  : MERCHANT.vatRegistered === true
                    ? '. Cene uključuju PDV.'
                    : '. Iznos poreza (ako je primenjiv) biće jasno iskazan pri plaćanju.'}
              </li>
              <li>Plaćanje se vrši platnim karticama preko sigurnog servisa {MERCHANT.bank}. Detalji su u <Link href="/placanje">Uslovima kupovine i plaćanja</Link>.</li>
              <li>Pretplatu možeš da otkažeš u bilo kom trenutku iz svog profila; pristup ostaje aktivan do isteka plaćenog perioda.</li>
            </ul>
          </Section>

          <Section title="4. Isporuka usluge">
            <p>
              Pristup plaćenom sadržaju aktivira se <strong>automatski, odmah</strong>{' '}
              po uspešno realizovanoj uplati. Sadržaju pristupaš prijavom na svoj
              nalog na ovoj platformi, sa bilo kog uređaja sa internet vezom.
            </p>
          </Section>

          <Section title="5. Pravo na odustanak i povraćaj">
            <p>
              Po Zakonu o zaštiti potrošača, potrošač ima pravo da odustane od
              ugovora zaključenog na daljinu u roku od 14 dana. Za{' '}
              <strong>digitalni sadržaj</strong> koji se isporučuje elektronski,
              ovo pravo prestaje kada isporuka počne — <strong>uz tvoju izričitu
              saglasnost</strong> datu pri kupovini da si upoznat/a da time gubiš
              pravo na odustanak.
            </p>
            <p>
              U praksi: ako još nisi počeo/la da koristiš plaćeni sadržaj, javi nam
              se na <a href={`mailto:${MERCHANT.email}`}>{MERCHANT.email}</a> u roku od
              14 dana i vraćamo pun iznos. Povraćaj se vrši istom karticom kojom je
              plaćeno, preko {MERCHANT.bank}.
            </p>
          </Section>

          <Section title="6. Reklamacije">
            <p>
              Prigovor na uslugu možeš da podneseš na{' '}
              <a href={`mailto:${MERCHANT.email}`}>{MERCHANT.email}</a> ili preko{' '}
              <Link href="/kontakt">kontakt forme</Link>. Odgovaramo u zakonskom roku
              od 8 dana od prijema reklamacije, a rešenje predlažemo u roku od 15
              dana. Ako nismo u mogućnosti da rešimo spor mirno, potrošač može da se
              obrati telu za vansudsko rešavanje potrošačkih sporova.
            </p>
          </Section>

          <Section title="7. Pristup i korišćenje sadržaja">
            <ul>
              <li>Sadržaj (video lekcije, vežbe, materijali) je u vlasništvu {MERCHANT.brandName} i licenciran ti je za ličnu, nekomercijalnu upotrebu.</li>
              <li>Ne smeš da preuzimaš, kopiraš, deliš ili distribuiraš sadržaj drugima.</li>
              <li>Nalog je vezan za tebe lično; ako neko drugi koristi tvoje pristupne podatke, odgovoran/na si za nastalu štetu.</li>
            </ul>
          </Section>

          <Section title="8. AI asistent">
            <p>
              AI asistent (zasnovan na Anthropic Claude) pomaže oko jezičkih pitanja.
              Odgovori mogu povremeno biti netačni — proveri kritičnu informaciju kod
              nastavnika. Postoji dnevni limit poruka po korisniku radi kontrole
              troškova.
            </p>
          </Section>

          <Section title="9. Sadržaj korisnika">
            <p>
              Komentari, beleške i bookmarka koje ostavljaš ostaju tvoji, ali nam
              daješ pravo da prikažemo komentare ostalim polaznicima. Nije dozvoljeno
              postavljati uvredljiv, mržnjivi ili preteći sadržaj, spam, niti sadržaj
              koji krši autorska prava. Zadržavamo pravo da uklonimo neprimeren
              sadržaj i suspendujemo nalog.
            </p>
          </Section>

          <Section title="10. Suspendovanje ili gašenje naloga">
            <p>
              Možemo suspendovati ili obrisati nalog u slučaju kršenja ovih uslova,
              prevare u plaćanju ili zloupotrebe sistema.
            </p>
          </Section>

          <Section title="11. Odgovornost">
            <p>
              Uslugu pružamo &quot;kao što jeste&quot;. Trudimo se da platforma radi
              besprekorno, ali ne garantujemo nesmetan rad u svakom trenutku. Naša
              ukupna odgovornost ograničena je na iznos koji si platio/la u poslednjih
              12 meseci.
            </p>
          </Section>

          <Section title="12. Izmene uslova">
            <p>
              Ove uslove možemo izmeniti. Bitne izmene objavljujemo na ovoj stranici
              i, gde je moguće, obaveštavamo te unapred. Dalje korišćenje platforme
              znači prihvatanje izmenjenih uslova.
            </p>
          </Section>

          <Section title="13. Primenljivo pravo">
            <p>
              Ovi uslovi tumače se po pravu Republike Srbije. Sporove pokušavamo da
              rešimo mirno; ako ne uspemo, nadležan je stvarno nadležni sud prema
              sedištu trgovca.
            </p>
          </Section>

          <Section title="14. Kontakt">
            <p>
              Pitanja oko uslova? Piši nam na{' '}
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
