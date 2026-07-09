/**
 * Seed: kompletan A1 nemački kurs sa modulima, lekcijama i interaktivnim vežbama.
 *
 * Pokretanje: bun run src/seed/german-a1.ts
 *
 * Idempotentno: ako kurs sa slug-om 'nemacki-a1' već postoji, briše ga
 * pre nego što ga ponovo zasadi (uključujući kaskadno modula, lekcija, vežbi).
 */
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { courses, exercises, lessons, modules } from '../db/schema'

const SLUG = 'nemacki-a1'

type ExType = 'multiple_choice' | 'fill_blank' | 'matching' | 'ordering'
type ExercisePayload =
  | { type: 'multiple_choice'; data: { question: string; options: Array<{ id: string; text: string }>; correctOptionId: string; explanation?: string } }
  | { type: 'fill_blank'; data: { template: string; answers: Array<{ accepted: string[]; caseSensitive?: boolean }>; explanation?: string } }
  | { type: 'matching'; data: { question?: string; left: Array<{ id: string; text: string }>; right: Array<{ id: string; text: string }>; pairs: Record<string, string> } }
  | { type: 'ordering'; data: { question?: string; items: Array<{ id: string; text: string }> } }

type LessonSeed = {
  title: string
  contentHtml: string
  exercises: Array<{ title: string; type: ExType; payload: ExercisePayload }>
}

type ModuleSeed = {
  title: string
  lessons: LessonSeed[]
}

function id(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

/* ════════════════════════════════════════════════════════════════════
   SADRŽAJ KURSA
════════════════════════════════════════════════════════════════════ */

const COURSE_DESCRIPTION = `Kompletan A1 kurs nemačkog jezika za potpune početnike. Kroz 5 modula
naučićeš da se predstaviš, postavljaš osnovna pitanja, govoriš o sebi i
porodici, snalaziš se u gradu i restoranu. Svaka lekcija ima objašnjenje,
primere i interaktivne vežbe sa instant feedbackom.`

const MODULES: ModuleSeed[] = [
  /* ═══════════════════════════ MODUL 1 ═══════════════════════════ */
  {
    title: 'Pozdravi i predstavljanje',
    lessons: [
      {
        title: 'Hallo! Pozdravi u svakodnevici',
        contentHtml: `
          <h2>Prva reč koju naučiš u svakom jeziku — pozdrav</h2>
          <p>Kad se sretneš sa nekim u Nemačkoj, prva i najsigurnija reč je
          <strong>Hallo</strong> <em>(zdravo)</em>. Koristi se u svakoj situaciji,
          formalnoj i neformalnoj, u bilo koje doba dana.</p>

          <h3>Pozdravi po dobu dana</h3>
          <p>Nemci vole da preciziraju doba dana. Evo standardnih pozdrava:</p>
          <ul>
            <li><strong>Guten Morgen</strong> <em>(dobro jutro)</em> — od buđenja do oko 10h</li>
            <li><strong>Guten Tag</strong> <em>(dobar dan)</em> — od 10h do oko 18h</li>
            <li><strong>Guten Abend</strong> <em>(dobro veče)</em> — posle 18h</li>
            <li><strong>Gute Nacht</strong> <em>(laku noć)</em> — pred spavanje</li>
          </ul>

          <h3>Regionalne varijante</h3>
          <p>U Bavarskoj i Austriji čućeš <strong>Servus</strong> ili
          <strong>Grüß Gott</strong>. Na severu (Hamburg, Hannover) je popularno
          <strong>Moin</strong> — koje funkcioniše u bilo koje doba dana.</p>

          <h3>Kako se rastati</h3>
          <ul>
            <li><strong>Tschüss</strong> <em>(ćao)</em> — neformalno</li>
            <li><strong>Auf Wiedersehen</strong> <em>(doviđenja)</em> — formalno</li>
            <li><strong>Bis bald</strong> <em>(vidimo se uskoro)</em></li>
            <li><strong>Bis morgen</strong> <em>(do sutra)</em></li>
          </ul>

          <blockquote>
          <strong>Trik za pamćenje:</strong> "Guten" znači "dobar/dobro", a posle ide
          doba dana. Morgen=jutro, Tag=dan, Abend=veče, Nacht=noć. Mala razlika —
          "Gute Nacht" (bez "n") jer je <em>Nacht</em> ženskog roda.
          </blockquote>
        `,
        exercises: [
          {
            title: 'Pozdrav po dobu dana',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Kako pozdraviš nekoga u 8h ujutru?',
                options: [
                  { id: 'a', text: 'Guten Abend' },
                  { id: 'b', text: 'Guten Morgen' },
                  { id: 'c', text: 'Gute Nacht' },
                  { id: 'd', text: 'Auf Wiedersehen' },
                ],
                correctOptionId: 'b',
                explanation: 'Guten Morgen koristi se od buđenja do oko 10h ujutru.',
              },
            },
          },
          {
            title: 'Uparivanje pozdrava sa značenjima',
            type: 'matching',
            payload: {
              type: 'matching',
              data: {
                question: 'Spoji nemački pozdrav sa srpskim prevodom',
                left: [
                  { id: 'l1', text: 'Hallo' },
                  { id: 'l2', text: 'Tschüss' },
                  { id: 'l3', text: 'Gute Nacht' },
                  { id: 'l4', text: 'Auf Wiedersehen' },
                ],
                right: [
                  { id: 'r1', text: 'zdravo' },
                  { id: 'r2', text: 'ćao (rastanak)' },
                  { id: 'r3', text: 'laku noć' },
                  { id: 'r4', text: 'doviđenja' },
                ],
                pairs: { l1: 'r1', l2: 'r2', l3: 'r3', l4: 'r4' },
              },
            },
          },
          {
            title: 'Popuni pozdrav',
            type: 'fill_blank',
            payload: {
              type: 'fill_blank',
              data: {
                template: 'Pre podne u Berlinu kažeš: "___ Morgen!" U 22h: "___ Abend!"',
                answers: [
                  { accepted: ['Guten'] },
                  { accepted: ['Guten'] },
                ],
                explanation: 'Pre Morgen, Tag i Abend (muški rod) ide "Guten". Samo "Gute" pre "Nacht" (ženski rod).',
              },
            },
          },
        ],
      },
      {
        title: 'Predstavljanje — Wie heißt du?',
        contentHtml: `
          <h2>Kako se zoveš?</h2>
          <p>Posle pozdrava sledi najčešće pitanje: <strong>Wie heißt du?</strong>
          <em>(Kako se zoveš?)</em> — u neformalnom razgovoru. U formalnom razgovoru
          se kaže <strong>Wie heißen Sie?</strong></p>

          <h3>Glagol "heißen" (zvati se)</h3>
          <p>Ovo je glagol koji se obavezno koristi pri predstavljanju:</p>
          <ul>
            <li><strong>ich heiße</strong> <em>(ja se zovem)</em></li>
            <li><strong>du heißt</strong> <em>(ti se zoveš)</em></li>
            <li><strong>er/sie heißt</strong> <em>(on/ona se zove)</em></li>
            <li><strong>wir heißen</strong> <em>(mi se zovemo)</em></li>
            <li><strong>ihr heißt</strong> <em>(vi se zovete)</em></li>
            <li><strong>sie/Sie heißen</strong> <em>(oni se zovu / Vi se zovete)</em></li>
          </ul>

          <h3>Alternative</h3>
          <p>Možeš da kažeš i:</p>
          <ul>
            <li><strong>Mein Name ist Ana.</strong> <em>(Moje ime je Ana.)</em></li>
            <li><strong>Ich bin Ana.</strong> <em>(Ja sam Ana.)</em> — najopuštenije</li>
          </ul>

          <h3>Tipičan dijalog</h3>
          <blockquote>
          — Hallo! Wie heißt du? <em>(Zdravo! Kako se zoveš?)</em><br>
          — Ich heiße Marko. Und du? <em>(Zovem se Marko. A ti?)</em><br>
          — Ich bin Lena. Schön, dich kennenzulernen! <em>(Ja sam Lena. Drago mi je da te upoznam!)</em>
          </blockquote>

          <p><strong>Schön, dich kennenzulernen</strong> je dugačko ali bitno —
          drago mi je da te upoznam. Formalno: <em>Schön, Sie kennenzulernen.</em></p>
        `,
        exercises: [
          {
            title: 'Konjugacija "heißen"',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Koji oblik ide uz "ich"?',
                options: [
                  { id: 'a', text: 'ich heißt' },
                  { id: 'b', text: 'ich heißen' },
                  { id: 'c', text: 'ich heiße' },
                  { id: 'd', text: 'ich heiß' },
                ],
                correctOptionId: 'c',
                explanation: 'U prvom licu jednine glagoli na -en gube -n: heißen → ich heiße.',
              },
            },
          },
          {
            title: 'Dovrši dijalog',
            type: 'fill_blank',
            payload: {
              type: 'fill_blank',
              data: {
                template: '— Hallo! Wie ___ du?\n— Ich ___ Petar.',
                answers: [
                  { accepted: ['heißt', 'heisst'] },
                  { accepted: ['heiße', 'heisse', 'bin'] },
                ],
                explanation: 'Du heißt (drugo lice) i ich heiße (prvo lice). "Ich bin Petar" je takođe ispravno.',
              },
            },
          },
          {
            title: 'Redosled u upoznavanju',
            type: 'ordering',
            payload: {
              type: 'ordering',
              data: {
                question: 'Poređaj rečenice u prirodnom redosledu razgovora',
                items: [
                  { id: 'a', text: 'Hallo!' },
                  { id: 'b', text: 'Wie heißt du?' },
                  { id: 'c', text: 'Ich heiße Lena.' },
                  { id: 'd', text: 'Schön, dich kennenzulernen!' },
                ],
              },
            },
          },
        ],
      },
      {
        title: 'Woher kommst du? — odakle si',
        contentHtml: `
          <h2>Odakle dolaziš?</h2>
          <p>Sledeće pitanje pri upoznavanju: <strong>Woher kommst du?</strong>
          <em>(Odakle si?)</em>. Odgovor počinje sa <strong>Ich komme aus...</strong>
          <em>(Dolazim iz...)</em>.</p>

          <h3>Glagol "kommen" (dolaziti)</h3>
          <ul>
            <li><strong>ich komme</strong></li>
            <li><strong>du kommst</strong></li>
            <li><strong>er/sie kommt</strong></li>
            <li><strong>wir kommen</strong></li>
            <li><strong>ihr kommt</strong></li>
            <li><strong>sie/Sie kommen</strong></li>
          </ul>

          <h3>Države (Länder)</h3>
          <p>Većina zemalja u nemačkom ide <strong>bez člana</strong>:</p>
          <ul>
            <li><strong>Deutschland</strong> <em>(Nemačka)</em></li>
            <li><strong>Serbien</strong> <em>(Srbija)</em></li>
            <li><strong>Österreich</strong> <em>(Austrija)</em></li>
            <li><strong>Kroatien</strong> <em>(Hrvatska)</em></li>
            <li><strong>Italien</strong> <em>(Italija)</em></li>
            <li><strong>Spanien</strong> <em>(Španija)</em></li>
          </ul>

          <p>Neke ipak idu sa članom — bitno za napredak: <strong>die Schweiz</strong>
          <em>(Švajcarska)</em>, <strong>die Türkei</strong> <em>(Turska)</em>,
          <strong>die USA</strong>.</p>

          <h3>Nacionalnost</h3>
          <p>Za muškarca dodaješ <strong>-er</strong>, za ženu <strong>-erin</strong>:</p>
          <ul>
            <li>Serbe / Serbin <em>(Srbin / Srpkinja)</em></li>
            <li>Deutscher / Deutsche</li>
            <li>Italiener / Italienerin</li>
          </ul>

          <blockquote>
          <strong>Primer:</strong> "Ich komme aus Serbien. Ich bin Serbe / Serbin."
          </blockquote>
        `,
        exercises: [
          {
            title: 'Spoji zemlje',
            type: 'matching',
            payload: {
              type: 'matching',
              data: {
                question: 'Spoji nemačko ime države sa srpskim',
                left: [
                  { id: 'l1', text: 'Deutschland' },
                  { id: 'l2', text: 'Serbien' },
                  { id: 'l3', text: 'Österreich' },
                  { id: 'l4', text: 'die Schweiz' },
                ],
                right: [
                  { id: 'r1', text: 'Nemačka' },
                  { id: 'r2', text: 'Srbija' },
                  { id: 'r3', text: 'Austrija' },
                  { id: 'r4', text: 'Švajcarska' },
                ],
                pairs: { l1: 'r1', l2: 'r2', l3: 'r3', l4: 'r4' },
              },
            },
          },
          {
            title: 'Predlog "aus"',
            type: 'fill_blank',
            payload: {
              type: 'fill_blank',
              data: {
                template: 'Ich komme ___ Berlin. Sie kommt ___ Wien.',
                answers: [
                  { accepted: ['aus'] },
                  { accepted: ['aus'] },
                ],
                explanation: '"Aus" znači "iz" — uvek ide pre imena grada ili države (bez člana).',
              },
            },
          },
          {
            title: 'Odakle?',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Šta znači rečenica "Ich komme aus Kroatien"?',
                options: [
                  { id: 'a', text: 'Idem u Hrvatsku.' },
                  { id: 'b', text: 'Dolazim iz Hrvatske.' },
                  { id: 'c', text: 'Volim Hrvatsku.' },
                  { id: 'd', text: 'Hrvatska je daleko.' },
                ],
                correctOptionId: 'b',
                explanation: '"Ich komme aus..." = "Dolazim iz..." Za "idem u" bi bilo "Ich fahre nach Kroatien".',
              },
            },
          },
        ],
      },
      {
        title: 'Alfabet i izgovor — ä, ö, ü, ß',
        contentHtml: `
          <h2>Nemački alfabet</h2>
          <p>Nemački koristi latinicu sa 4 dodatna karaktera: <strong>ä, ö, ü, ß</strong>.
          Ovi karakteri menjaju izgovor i značenje reči — moraš ih savladati.</p>

          <h3>Specijalni vokali (Umlaute)</h3>
          <ul>
            <li><strong>ä</strong> — izgovara se kao "e" u "med". Primer: <strong>Mädchen</strong>
            <em>(devojčica)</em></li>
            <li><strong>ö</strong> — između "o" i "e". Zaokruži usne kao da pišeš "o",
            ali pokušaj da kažeš "e". Primer: <strong>schön</strong> <em>(lepo)</em></li>
            <li><strong>ü</strong> — između "u" i "i". Zaokruži usne za "u", reci "i".
            Primer: <strong>für</strong> <em>(za)</em></li>
          </ul>

          <h3>"Eszett" — ß</h3>
          <p><strong>ß</strong> (zove se <em>Eszett</em> ili <em>scharfes S</em>) je
          dugačko, oštro "s". Postoji samo kao malo slovo (veliko se piše SS).</p>
          <ul>
            <li><strong>heißen</strong> <em>(zvati se)</em></li>
            <li><strong>Straße</strong> <em>(ulica)</em></li>
            <li><strong>weiß</strong> <em>(beli)</em></li>
          </ul>

          <h3>Bonus: kako pisati bez "ä, ö, ü, ß"</h3>
          <p>Ako nemaš nemačku tastaturu, koristi ovaj zamenski standard:</p>
          <ul>
            <li>ä → <strong>ae</strong>: Mädchen → Maedchen</li>
            <li>ö → <strong>oe</strong>: schön → schoen</li>
            <li>ü → <strong>ue</strong>: für → fuer</li>
            <li>ß → <strong>ss</strong>: Straße → Strasse</li>
          </ul>

          <p>U Švajcarskoj se uvek piše "ss" umesto "ß" — to nije greška.</p>
        `,
        exercises: [
          {
            title: 'Šta je "Umlaut"?',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Koji od ovih karaktera NIJE umlaut?',
                options: [
                  { id: 'a', text: 'ä' },
                  { id: 'b', text: 'ß' },
                  { id: 'c', text: 'ö' },
                  { id: 'd', text: 'ü' },
                ],
                correctOptionId: 'b',
                explanation: 'ß je "Eszett" (oštro s), ne umlaut. Umlauti su samo ä, ö, ü.',
              },
            },
          },
          {
            title: 'Zameni ä/ö/ü/ß',
            type: 'fill_blank',
            payload: {
              type: 'fill_blank',
              data: {
                template: 'Bez nemačke tastature: schön → sch___n, Straße → Stra___e',
                answers: [
                  { accepted: ['oe', 'OE'] },
                  { accepted: ['ss', 'SS'] },
                ],
                explanation: 'ö → oe, ß → ss. ä → ae, ü → ue.',
              },
            },
          },
        ],
      },
    ],
  },

  /* ═══════════════════════════ MODUL 2 ═══════════════════════════ */
  {
    title: 'Brojevi, vreme i datumi',
    lessons: [
      {
        title: 'Brojevi od 0 do 20',
        contentHtml: `
          <h2>Brojanje na nemačkom</h2>
          <p>Brojevi su osnova svakodnevice — telefon, cena, godine, vreme. Krećemo od
          najmanjih:</p>

          <h3>0 — 12 (učenje napamet)</h3>
          <table>
          <tr><td><strong>0 — null</strong></td><td><strong>4 — vier</strong></td><td><strong>8 — acht</strong></td></tr>
          <tr><td><strong>1 — eins</strong></td><td><strong>5 — fünf</strong></td><td><strong>9 — neun</strong></td></tr>
          <tr><td><strong>2 — zwei</strong></td><td><strong>6 — sechs</strong></td><td><strong>10 — zehn</strong></td></tr>
          <tr><td><strong>3 — drei</strong></td><td><strong>7 — sieben</strong></td><td><strong>11 — elf</strong></td></tr>
          </table>
          <p>I jedan zaseban: <strong>12 — zwölf</strong></p>

          <h3>13 — 19 (pravilo: broj + "zehn")</h3>
          <ul>
            <li><strong>13 — dreizehn</strong> <em>(drei + zehn)</em></li>
            <li><strong>14 — vierzehn</strong></li>
            <li><strong>15 — fünfzehn</strong></li>
            <li><strong>16 — sechzehn</strong> <em>(pažljivo: bez "s" na kraju)</em></li>
            <li><strong>17 — siebzehn</strong> <em>(siebzehn, ne siebenzehn!)</em></li>
            <li><strong>18 — achtzehn</strong></li>
            <li><strong>19 — neunzehn</strong></li>
          </ul>

          <h3>20 — zwanzig</h3>
          <p>Sa 20 počinje serija: <strong>zwanzig, dreißig, vierzig...</strong></p>

          <blockquote>
          <strong>Trik za pamćenje:</strong> "Sechzehn" i "siebzehn" ne prate pravilo
          potpuno — sech (ne sechs) i sieb (ne sieben). Zato Nemci često kažu da su ovo
          dva "trik broja". Vežbaj ih posebno.
          </blockquote>
        `,
        exercises: [
          {
            title: 'Broj na nemačkom',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Kako se kaže broj 7?',
                options: [
                  { id: 'a', text: 'sechs' },
                  { id: 'b', text: 'sieben' },
                  { id: 'c', text: 'sieb' },
                  { id: 'd', text: 'siben' },
                ],
                correctOptionId: 'b',
                explanation: 'Sieben = 7. Pažnja: u broju 17 ide skraćeno "siebzehn".',
              },
            },
          },
          {
            title: 'Spoji broj sa rečju',
            type: 'matching',
            payload: {
              type: 'matching',
              data: {
                question: 'Spoji nemačku reč sa brojem',
                left: [
                  { id: 'l1', text: 'zehn' },
                  { id: 'l2', text: 'sechzehn' },
                  { id: 'l3', text: 'zwölf' },
                  { id: 'l4', text: 'achtzehn' },
                  { id: 'l5', text: 'zwanzig' },
                ],
                right: [
                  { id: 'r1', text: '10' },
                  { id: 'r2', text: '16' },
                  { id: 'r3', text: '12' },
                  { id: 'r4', text: '18' },
                  { id: 'r5', text: '20' },
                ],
                pairs: { l1: 'r1', l2: 'r2', l3: 'r3', l4: 'r4', l5: 'r5' },
              },
            },
          },
          {
            title: 'Brojevi po redu',
            type: 'ordering',
            payload: {
              type: 'ordering',
              data: {
                question: 'Poređaj brojeve od najmanjeg do najvećeg',
                items: [
                  { id: 'a', text: 'drei' },
                  { id: 'b', text: 'sieben' },
                  { id: 'c', text: 'elf' },
                  { id: 'd', text: 'fünfzehn' },
                  { id: 'e', text: 'neunzehn' },
                ],
              },
            },
          },
        ],
      },
      {
        title: 'Brojevi 20-100 i kako čitati cene',
        contentHtml: `
          <h2>Brojevi iznad 20</h2>
          <p>Nemački je ovde nezgodan — broj se čita "naopako". Najpre <strong>jedinice</strong>,
          pa <strong>desetice</strong>, povezano sa "und".</p>

          <h3>Desetice</h3>
          <ul>
            <li>20 — zwanzig</li>
            <li>30 — dreißig <em>(pažljivo: -ßig, ne -zig)</em></li>
            <li>40 — vierzig</li>
            <li>50 — fünfzig</li>
            <li>60 — sechzig</li>
            <li>70 — siebzig</li>
            <li>80 — achtzig</li>
            <li>90 — neunzig</li>
            <li>100 — (ein)hundert</li>
          </ul>

          <h3>Kompleksni brojevi — pravilo "und"</h3>
          <p><strong>21 = eins + und + zwanzig → einundzwanzig</strong>
          (jedan-i-dvadeset)</p>
          <p>Sve se piše zajedno, jedna reč:</p>
          <ul>
            <li>21 — einundzwanzig</li>
            <li>34 — vierunddreißig</li>
            <li>47 — siebenundvierzig</li>
            <li>89 — neunundachtzig</li>
            <li>99 — neunundneunzig</li>
          </ul>

          <blockquote>
          <strong>Trik:</strong> Misliš "u srpskom kažeš 'dvadeset jedan'", a Nemac
          kaže "jedan-i-dvadeset" (einundzwanzig). Razmisli o broju kao da je napisan
          unazad: 21 → 1-i-20.
          </blockquote>

          <h3>Cene u Evropi</h3>
          <p>U Nemačkoj se cena kaže ovako:</p>
          <ul>
            <li><strong>2,50 €</strong> = <em>zwei Euro fünfzig</em></li>
            <li><strong>15,99 €</strong> = <em>fünfzehn Euro neunundneunzig</em></li>
            <li><strong>100 €</strong> = <em>hundert Euro</em></li>
          </ul>
          <p>U Nemačkoj se za decimalu koristi <strong>zarez (,)</strong>, ne tačka.</p>
        `,
        exercises: [
          {
            title: 'Pročitaj broj',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Kako se kaže broj 36?',
                options: [
                  { id: 'a', text: 'dreißigsechs' },
                  { id: 'b', text: 'sechsunddreißig' },
                  { id: 'c', text: 'dreiunddreißig' },
                  { id: 'd', text: 'dreißig und sechs' },
                ],
                correctOptionId: 'b',
                explanation: 'Prvo jedinice (sechs), pa "und", pa desetice (dreißig). Sve zajedno.',
              },
            },
          },
          {
            title: 'Popuni broj',
            type: 'fill_blank',
            payload: {
              type: 'fill_blank',
              data: {
                template: 'Broj 42 se kaže "zweiund___" — popuni desetice.',
                answers: [{ accepted: ['vierzig'] }],
                explanation: '42 = zwei (2) + und + vierzig (40) → zweiundvierzig.',
              },
            },
          },
          {
            title: 'Cena u prodavnici',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Cena je 7,80 €. Kako ćeš je pročitati?',
                options: [
                  { id: 'a', text: 'sieben Komma achtzig Euro' },
                  { id: 'b', text: 'sieben Euro achtzig' },
                  { id: 'c', text: 'achtzig sieben Euro' },
                  { id: 'd', text: 'sieben Punkt acht Euro' },
                ],
                correctOptionId: 'b',
                explanation: 'Standardni način je: "X Euro Y" — bez reči "Komma" ili "und".',
              },
            },
          },
        ],
      },
      {
        title: 'Wie spät ist es? — koliko je sati',
        contentHtml: `
          <h2>Pitanje za vreme</h2>
          <p>Da pitaš koliko je sati:</p>
          <ul>
            <li><strong>Wie spät ist es?</strong> <em>(Koliko je sati?)</em></li>
            <li><strong>Wie viel Uhr ist es?</strong> <em>(Koje je vreme?)</em></li>
          </ul>

          <h3>Pun sat</h3>
          <p>Najlakše: <strong>Es ist [broj] Uhr.</strong></p>
          <ul>
            <li><strong>Es ist drei Uhr.</strong> <em>(Tri sata.)</em></li>
            <li><strong>Es ist acht Uhr.</strong> <em>(Osam sati.)</em></li>
          </ul>

          <h3>Pola sata</h3>
          <p>U nemačkom <em>"pola"</em> ide ka <strong>sledećem</strong> satu, ne nazad!</p>
          <ul>
            <li><strong>halb drei</strong> = 2:30 <em>(pola TREĆEG)</em></li>
            <li><strong>halb acht</strong> = 7:30 <em>(pola OSMOG)</em></li>
          </ul>

          <blockquote>
          <strong>Pažnja!</strong> Ovo je razlika u odnosu na srpski. "Pola tri" kod nas
          može biti 2:30 ili 14:30 — uvek se odnosi na prethodni sat. U nemačkom
          "halb drei" je 2:30 jer je "pola puta DO tri".
          </blockquote>

          <h3>Četvrt</h3>
          <ul>
            <li><strong>Viertel nach drei</strong> = 3:15 <em>(četvrt posle tri)</em></li>
            <li><strong>Viertel vor vier</strong> = 3:45 <em>(četvrt do četiri)</em></li>
          </ul>

          <h3>24h vs 12h</h3>
          <p>Formalno (radio, televizija, rasporedi) koristi 24h sistem:</p>
          <ul>
            <li><strong>14:30</strong> — vierzehn Uhr dreißig</li>
            <li><strong>21:15</strong> — einundzwanzig Uhr fünfzehn</li>
          </ul>
          <p>U razgovoru se koristi 12h: <em>halb drei am Nachmittag</em>
          <em>(pola tri popodne)</em>.</p>
        `,
        exercises: [
          {
            title: 'Pola sata',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Šta znači "halb sieben"?',
                options: [
                  { id: 'a', text: '7:30' },
                  { id: 'b', text: '6:30' },
                  { id: 'c', text: '7:00' },
                  { id: 'd', text: '6:00' },
                ],
                correctOptionId: 'b',
                explanation: 'U nemačkom "halb sieben" znači "pola puta DO sedam" → 6:30.',
              },
            },
          },
          {
            title: 'Koliko je sati?',
            type: 'matching',
            payload: {
              type: 'matching',
              data: {
                question: 'Spoji nemački izraz sa vremenom',
                left: [
                  { id: 'l1', text: 'halb neun' },
                  { id: 'l2', text: 'Viertel nach zwei' },
                  { id: 'l3', text: 'Viertel vor sechs' },
                  { id: 'l4', text: 'zehn Uhr' },
                ],
                right: [
                  { id: 'r1', text: '8:30' },
                  { id: 'r2', text: '2:15' },
                  { id: 'r3', text: '5:45' },
                  { id: 'r4', text: '10:00' },
                ],
                pairs: { l1: 'r1', l2: 'r2', l3: 'r3', l4: 'r4' },
              },
            },
          },
        ],
      },
      {
        title: 'Dani u nedelji i meseci',
        contentHtml: `
          <h2>Wochentage — dani u nedelji</h2>
          <p>Nemački počinje nedelju ponedeljkom (kao i mi). Svi dani su <strong>muški rod</strong> —
          ide <em>der</em>:</p>
          <ul>
            <li><strong>Montag</strong> <em>(ponedeljak)</em></li>
            <li><strong>Dienstag</strong> <em>(utorak)</em></li>
            <li><strong>Mittwoch</strong> <em>(sreda — bukvalno "sredina nedelje")</em></li>
            <li><strong>Donnerstag</strong> <em>(četvrtak)</em></li>
            <li><strong>Freitag</strong> <em>(petak)</em></li>
            <li><strong>Samstag</strong> <em>(subota — u Bavarskoj: Sonnabend)</em></li>
            <li><strong>Sonntag</strong> <em>(nedelja)</em></li>
          </ul>

          <h3>Predlog "am"</h3>
          <p>Za "U ponedeljak / utorak / itd." koristi se <strong>am</strong>:</p>
          <ul>
            <li><strong>am Montag</strong> <em>(u ponedeljak)</em></li>
            <li><strong>am Wochenende</strong> <em>(za vikend)</em></li>
          </ul>

          <h3>Monate — meseci</h3>
          <p>Vrlo slični engleskim:</p>
          <ul>
            <li>Januar, Februar, März</li>
            <li>April, Mai, Juni</li>
            <li>Juli, August, September</li>
            <li>Oktober, November, Dezember</li>
          </ul>

          <h3>Predlog "im"</h3>
          <p>Za "u [mesec]" koristi se <strong>im</strong>:</p>
          <ul>
            <li><strong>im Januar</strong> <em>(u januaru)</em></li>
            <li><strong>im Sommer</strong> <em>(leti)</em></li>
          </ul>

          <h3>Godišnja doba</h3>
          <ul>
            <li><strong>der Frühling</strong> <em>(proleće)</em></li>
            <li><strong>der Sommer</strong> <em>(leto)</em></li>
            <li><strong>der Herbst</strong> <em>(jesen)</em></li>
            <li><strong>der Winter</strong> <em>(zima)</em></li>
          </ul>
        `,
        exercises: [
          {
            title: 'Dani po redu',
            type: 'ordering',
            payload: {
              type: 'ordering',
              data: {
                question: 'Poređaj dane od ponedeljka do petka',
                items: [
                  { id: 'a', text: 'Montag' },
                  { id: 'b', text: 'Dienstag' },
                  { id: 'c', text: 'Mittwoch' },
                  { id: 'd', text: 'Donnerstag' },
                  { id: 'e', text: 'Freitag' },
                ],
              },
            },
          },
          {
            title: 'Predlog za dane',
            type: 'fill_blank',
            payload: {
              type: 'fill_blank',
              data: {
                template: '"U petak imam časove." → "Ich habe Unterricht ___ Freitag."',
                answers: [{ accepted: ['am'] }],
                explanation: '"Am" je skraćenica od "an dem" — koristi se uz dane i datume.',
              },
            },
          },
          {
            title: 'Meseci',
            type: 'matching',
            payload: {
              type: 'matching',
              data: {
                question: 'Spoji mesec sa godišnjim dobom',
                left: [
                  { id: 'l1', text: 'Juli' },
                  { id: 'l2', text: 'Januar' },
                  { id: 'l3', text: 'April' },
                  { id: 'l4', text: 'Oktober' },
                ],
                right: [
                  { id: 'r1', text: 'Sommer' },
                  { id: 'r2', text: 'Winter' },
                  { id: 'r3', text: 'Frühling' },
                  { id: 'r4', text: 'Herbst' },
                ],
                pairs: { l1: 'r1', l2: 'r2', l3: 'r3', l4: 'r4' },
              },
            },
          },
        ],
      },
    ],
  },

  /* ═══════════════════════════ MODUL 3 ═══════════════════════════ */
  {
    title: 'Porodica i ljudi',
    lessons: [
      {
        title: 'Meine Familie — moja porodica',
        contentHtml: `
          <h2>Članovi porodice</h2>
          <p>Kad pričaš o sebi, brzo dolazi do porodice. Evo osnovnih reči:</p>

          <h3>Roditelji i deca</h3>
          <ul>
            <li><strong>die Mutter</strong> <em>(mama)</em></li>
            <li><strong>der Vater</strong> <em>(tata)</em></li>
            <li><strong>die Eltern</strong> <em>(roditelji)</em></li>
            <li><strong>der Sohn</strong> <em>(sin)</em></li>
            <li><strong>die Tochter</strong> <em>(ćerka)</em></li>
            <li><strong>die Kinder</strong> <em>(deca)</em></li>
          </ul>

          <h3>Braća i sestre</h3>
          <ul>
            <li><strong>der Bruder</strong> <em>(brat)</em> · množina: <em>die Brüder</em></li>
            <li><strong>die Schwester</strong> <em>(sestra)</em> · množina: <em>die Schwestern</em></li>
            <li><strong>die Geschwister</strong> <em>(braća i sestre, zajednički)</em></li>
          </ul>

          <h3>Šire</h3>
          <ul>
            <li><strong>die Großmutter / Oma</strong> <em>(baka)</em></li>
            <li><strong>der Großvater / Opa</strong> <em>(deka)</em></li>
            <li><strong>die Tante</strong> <em>(tetka)</em></li>
            <li><strong>der Onkel</strong> <em>(ujak / stric)</em></li>
            <li><strong>der Cousin / die Cousine</strong> <em>(rođak / rođaka)</em></li>
          </ul>

          <h3>Partneri</h3>
          <ul>
            <li><strong>der Mann / die Frau</strong> <em>(suprug / supruga)</em></li>
            <li><strong>der Freund / die Freundin</strong> <em>(dečko / devojka, takođe "prijatelj")</em></li>
          </ul>

          <blockquote>
          <strong>Bitno:</strong> "die Frau" znači i "žena" i "supruga". Kontekst pokazuje
          šta se misli. "Meine Frau" = moja supruga.
          </blockquote>
        `,
        exercises: [
          {
            title: 'Brat ili sestra?',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Šta znači "die Schwester"?',
                options: [
                  { id: 'a', text: 'brat' },
                  { id: 'b', text: 'sestra' },
                  { id: 'c', text: 'baka' },
                  { id: 'd', text: 'tetka' },
                ],
                correctOptionId: 'b',
                explanation: 'Schwester = sestra. Brat je "Bruder".',
              },
            },
          },
          {
            title: 'Spoji parove',
            type: 'matching',
            payload: {
              type: 'matching',
              data: {
                question: 'Spoji muški i ženski rod',
                left: [
                  { id: 'l1', text: 'der Vater' },
                  { id: 'l2', text: 'der Bruder' },
                  { id: 'l3', text: 'der Großvater' },
                  { id: 'l4', text: 'der Onkel' },
                ],
                right: [
                  { id: 'r1', text: 'die Mutter' },
                  { id: 'r2', text: 'die Schwester' },
                  { id: 'r3', text: 'die Großmutter' },
                  { id: 'r4', text: 'die Tante' },
                ],
                pairs: { l1: 'r1', l2: 'r2', l3: 'r3', l4: 'r4' },
              },
            },
          },
          {
            title: 'Popuni opis porodice',
            type: 'fill_blank',
            payload: {
              type: 'fill_blank',
              data: {
                template: 'Meine Familie ist klein. Ich habe einen ___ und eine ___. Meine ___ kommt aus Berlin.',
                answers: [
                  { accepted: ['Bruder'] },
                  { accepted: ['Schwester'] },
                  { accepted: ['Mutter', 'Mama'] },
                ],
                explanation: 'einen + Bruder (muški akuzativ), eine + Schwester (ženski akuzativ), Mutter (subjekat = nominativ).',
              },
            },
          },
        ],
      },
      {
        title: 'Posesivni član — mein, dein, sein',
        contentHtml: `
          <h2>Čije je to?</h2>
          <p>U srpskom kažemo "moj brat, moja sestra". U nemačkom je slično, ali se
          oblik <strong>menja po rodu</strong> i broju imenice koju opisuje.</p>

          <h3>Tabela posesivnih</h3>
          <table>
          <tr><td></td><td><strong>m./s.</strong></td><td><strong>ž.</strong></td><td><strong>množina</strong></td></tr>
          <tr><td>moj</td><td>mein</td><td>meine</td><td>meine</td></tr>
          <tr><td>tvoj</td><td>dein</td><td>deine</td><td>deine</td></tr>
          <tr><td>njegov</td><td>sein</td><td>seine</td><td>seine</td></tr>
          <tr><td>njen</td><td>ihr</td><td>ihre</td><td>ihre</td></tr>
          <tr><td>naš</td><td>unser</td><td>unsere</td><td>unsere</td></tr>
          <tr><td>vaš</td><td>euer</td><td>eure</td><td>eure</td></tr>
          </table>

          <h3>Pravilo</h3>
          <p>Posesivni dobija <strong>nastavak -e</strong> ispred ženskih reči i množine:</p>
          <ul>
            <li><strong>mein Vater</strong> <em>(moj otac — muški)</em></li>
            <li><strong>meine Mutter</strong> <em>(moja majka — ženski)</em></li>
            <li><strong>mein Kind</strong> <em>(moje dete — srednji)</em></li>
            <li><strong>meine Eltern</strong> <em>(moji roditelji — množina)</em></li>
          </ul>

          <blockquote>
          <strong>Trik:</strong> Pogledaj koji član ide uz imenicu — <em>der/das</em> →
          mein (bez -e), <em>die</em> ili množina → meine (sa -e).
          </blockquote>

          <h3>Primer rečenice</h3>
          <p>"Mein Bruder heißt Marko. Meine Schwester heißt Ana. Unsere Eltern wohnen
          in Belgrad."</p>
          <p><em>"Moj brat se zove Marko. Moja sestra se zove Ana. Naši roditelji žive
          u Beogradu."</em></p>
        `,
        exercises: [
          {
            title: 'mein ili meine?',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Koji oblik posesivnog ide uz "Schwester" (ženski rod)?',
                options: [
                  { id: 'a', text: 'mein' },
                  { id: 'b', text: 'meine' },
                  { id: 'c', text: 'meiner' },
                  { id: 'd', text: 'meins' },
                ],
                correctOptionId: 'b',
                explanation: 'die Schwester je ženski rod → meine Schwester.',
              },
            },
          },
          {
            title: 'Popuni posesivne',
            type: 'fill_blank',
            payload: {
              type: 'fill_blank',
              data: {
                template: '___ Vater (m) heißt Stefan. ___ Mutter (f) heißt Ana. ___ Eltern (mn) wohnen in Novi Sad.',
                answers: [
                  { accepted: ['Mein', 'Sein', 'Ihr', 'Unser'] },
                  { accepted: ['Meine', 'Seine', 'Ihre', 'Unsere'] },
                  { accepted: ['Meine', 'Seine', 'Ihre', 'Unsere'] },
                ],
                explanation: 'Mein (m, n) → bez -e. Meine (f, mn) → sa -e. Isto i za sein/ihr/unser.',
              },
            },
          },
        ],
      },
      {
        title: 'Glagol "haben" — imati',
        contentHtml: `
          <h2>Imam, imaš, ima — haben</h2>
          <p>Glagol <strong>haben</strong> <em>(imati)</em> je jedan od dva najvažnija
          glagola u nemačkom (drugi je <em>sein</em>, biti). Bez ovog glagola ne možeš
          da kažeš "imam brata", "imam 25 godina", "imam mačku".</p>

          <h3>Konjugacija</h3>
          <ul>
            <li><strong>ich habe</strong> <em>(ja imam)</em></li>
            <li><strong>du hast</strong> <em>(ti imaš)</em></li>
            <li><strong>er / sie / es hat</strong> <em>(on / ona / ono ima)</em></li>
            <li><strong>wir haben</strong> <em>(mi imamo)</em></li>
            <li><strong>ihr habt</strong> <em>(vi imate)</em></li>
            <li><strong>sie / Sie haben</strong> <em>(oni imaju / Vi imate)</em></li>
          </ul>

          <blockquote>
          <strong>Pažnja!</strong> "Haben" je nepravilan u 2. i 3. licu jednine —
          gubi "b": ich <strong>habe</strong>, du <strong>hast</strong>, er <strong>hat</strong>.
          </blockquote>

          <h3>Šta sve "haben" gradi</h3>

          <p><strong>Posedovanje:</strong></p>
          <ul>
            <li>Ich habe einen Bruder. <em>(Imam brata.)</em></li>
            <li>Wir haben ein Auto. <em>(Imamo auto.)</em></li>
          </ul>

          <p><strong>Godine:</strong></p>
          <ul>
            <li>Ich bin... NE. Ich <strong>habe</strong> 25 Jahre. NE. <br>
              Tačno: <strong>Ich bin 25 (Jahre alt).</strong> <em>(Imam 25 godina —
              koristi se SEIN, ne HABEN!)</em></li>
          </ul>

          <p><strong>Stanja:</strong></p>
          <ul>
            <li>Ich habe Hunger. <em>(Gladan sam — bukvalno "imam glad")</em></li>
            <li>Ich habe Durst. <em>(Žedan sam.)</em></li>
            <li>Ich habe Zeit. <em>(Imam vremena.)</em></li>
            <li>Ich habe Lust. <em>(Imam volje / hoću.)</em></li>
          </ul>

          <p><strong>Sastav perfekta</strong> (prošlo vreme):</p>
          <ul>
            <li>Ich <strong>habe</strong> gegessen. <em>(Jeo sam.)</em></li>
          </ul>
        `,
        exercises: [
          {
            title: 'Konjugacija "haben"',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Koji oblik ide uz "du"?',
                options: [
                  { id: 'a', text: 'du habe' },
                  { id: 'b', text: 'du habt' },
                  { id: 'c', text: 'du hast' },
                  { id: 'd', text: 'du haben' },
                ],
                correctOptionId: 'c',
                explanation: '"Haben" je nepravilan: du hast, ne du habt.',
              },
            },
          },
          {
            title: 'Konjugacija po licima',
            type: 'matching',
            payload: {
              type: 'matching',
              data: {
                question: 'Spoji lice sa oblikom glagola "haben"',
                left: [
                  { id: 'l1', text: 'ich' },
                  { id: 'l2', text: 'er' },
                  { id: 'l3', text: 'wir' },
                  { id: 'l4', text: 'ihr' },
                ],
                right: [
                  { id: 'r1', text: 'habe' },
                  { id: 'r2', text: 'hat' },
                  { id: 'r3', text: 'haben' },
                  { id: 'r4', text: 'habt' },
                ],
                pairs: { l1: 'r1', l2: 'r2', l3: 'r3', l4: 'r4' },
              },
            },
          },
          {
            title: 'Sastavi rečenicu',
            type: 'fill_blank',
            payload: {
              type: 'fill_blank',
              data: {
                template: 'Wir ___ einen Hund. Meine Schwester ___ eine Katze.',
                answers: [
                  { accepted: ['haben'] },
                  { accepted: ['hat'] },
                ],
                explanation: 'Wir → haben, sie (= meine Schwester) → hat.',
              },
            },
          },
        ],
      },
    ],
  },

  /* ═══════════════════════════ MODUL 4 ═══════════════════════════ */
  {
    title: 'Svakodnevica i hobiji',
    lessons: [
      {
        title: 'Glagoli u prezentu — kako se konjugira',
        contentHtml: `
          <h2>Pravilo: koren + nastavak</h2>
          <p>Najveći deo nemačkih glagola se konjugira po jednostavnom pravilu. Glagol
          u infinitivu se završava na <strong>-en</strong>:</p>
          <ul>
            <li><strong>lernen</strong> <em>(učiti)</em></li>
            <li><strong>arbeiten</strong> <em>(raditi)</em></li>
            <li><strong>spielen</strong> <em>(igrati / svirati)</em></li>
          </ul>

          <h3>Skidamo "-en", dobijamo koren</h3>
          <p>lern<strong>en</strong> → koren: <strong>lern</strong></p>

          <h3>Dodajemo nastavak za svako lice</h3>
          <table>
          <tr><td><strong>ich</strong></td><td>-e</td><td>ich lerne</td></tr>
          <tr><td><strong>du</strong></td><td>-st</td><td>du lernst</td></tr>
          <tr><td><strong>er/sie/es</strong></td><td>-t</td><td>er lernt</td></tr>
          <tr><td><strong>wir</strong></td><td>-en</td><td>wir lernen</td></tr>
          <tr><td><strong>ihr</strong></td><td>-t</td><td>ihr lernt</td></tr>
          <tr><td><strong>sie/Sie</strong></td><td>-en</td><td>sie lernen</td></tr>
          </table>

          <h3>Korisni glagoli</h3>
          <ul>
            <li><strong>lernen</strong> — učiti</li>
            <li><strong>wohnen</strong> — stanovati</li>
            <li><strong>arbeiten</strong> — raditi</li>
            <li><strong>spielen</strong> — igrati / svirati</li>
            <li><strong>kochen</strong> — kuvati</li>
            <li><strong>lesen</strong> — čitati <em>(nepravilan!)</em></li>
            <li><strong>sehen</strong> — videti <em>(nepravilan!)</em></li>
          </ul>

          <blockquote>
          <strong>Pažnja:</strong> Glagoli sa "lesen, sehen, fahren" su nepravilni —
          u 2. i 3. licu menjaju samoglasnik u korenu. To ide u sledećoj lekciji.
          </blockquote>

          <h3>Primer</h3>
          <p>"Ich <strong>lerne</strong> Deutsch. Du <strong>lernst</strong> Englisch.
          Mein Bruder <strong>lernt</strong> Spanisch. Wir <strong>lernen</strong>
          zusammen."</p>
        `,
        exercises: [
          {
            title: 'Nastavak za "ich"',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Koji nastavak dobija glagol uz "ich"?',
                options: [
                  { id: 'a', text: '-en' },
                  { id: 'b', text: '-st' },
                  { id: 'c', text: '-e' },
                  { id: 'd', text: '-t' },
                ],
                correctOptionId: 'c',
                explanation: 'ich lerne, ich spiele, ich wohne — nastavak je -e.',
              },
            },
          },
          {
            title: 'Konjugiraj "wohnen"',
            type: 'fill_blank',
            payload: {
              type: 'fill_blank',
              data: {
                template: 'Wo ___ du? — Ich ___ in Belgrad. Meine Eltern ___ in Novi Sad.',
                answers: [
                  { accepted: ['wohnst'] },
                  { accepted: ['wohne'] },
                  { accepted: ['wohnen'] },
                ],
                explanation: 'du → -st, ich → -e, sie (množina) → -en.',
              },
            },
          },
          {
            title: 'Slaganje subjekta i glagola',
            type: 'matching',
            payload: {
              type: 'matching',
              data: {
                question: 'Spoji subjekat sa odgovarajućim oblikom "spielen"',
                left: [
                  { id: 'l1', text: 'Ich' },
                  { id: 'l2', text: 'Du' },
                  { id: 'l3', text: 'Wir' },
                  { id: 'l4', text: 'Ihr' },
                ],
                right: [
                  { id: 'r1', text: 'spiele' },
                  { id: 'r2', text: 'spielst' },
                  { id: 'r3', text: 'spielen' },
                  { id: 'r4', text: 'spielt' },
                ],
                pairs: { l1: 'r1', l2: 'r2', l3: 'r3', l4: 'r4' },
              },
            },
          },
        ],
      },
      {
        title: 'Tagesablauf — moja dnevna rutina',
        contentHtml: `
          <h2>Šta radim u toku dana?</h2>
          <p>Kad pričaš o sebi, "rutina" je najlakša tema — koristiš poznate glagole
          u prezentu. Evo bogata lista korisnih izraza.</p>

          <h3>Jutro</h3>
          <ul>
            <li><strong>Ich stehe um 7 Uhr auf.</strong> <em>(Ustajem u 7h.)</em></li>
            <li><strong>Ich dusche.</strong> <em>(Tuširam se.)</em></li>
            <li><strong>Ich frühstücke.</strong> <em>(Doručkujem.)</em></li>
            <li><strong>Ich trinke Kaffee.</strong> <em>(Pijem kafu.)</em></li>
          </ul>

          <h3>Posao / fakultet</h3>
          <ul>
            <li><strong>Ich gehe zur Arbeit.</strong> <em>(Idem na posao.)</em></li>
            <li><strong>Ich arbeite acht Stunden.</strong> <em>(Radim 8 sati.)</em></li>
            <li><strong>Ich studiere an der Universität.</strong> <em>(Studiram na univerzitetu.)</em></li>
          </ul>

          <h3>Veče</h3>
          <ul>
            <li><strong>Ich komme nach Hause.</strong> <em>(Dolazim kući.)</em></li>
            <li><strong>Ich koche das Abendessen.</strong> <em>(Kuvam večeru.)</em></li>
            <li><strong>Ich sehe fern.</strong> <em>(Gledam TV.)</em></li>
            <li><strong>Ich lese ein Buch.</strong> <em>(Čitam knjigu.)</em></li>
            <li><strong>Ich gehe um 23 Uhr ins Bett.</strong> <em>(Ležem u 23h.)</em></li>
          </ul>

          <h3>Vremenski izrazi</h3>
          <ul>
            <li><strong>am Morgen / morgens</strong> — ujutru</li>
            <li><strong>am Mittag / mittags</strong> — u podne</li>
            <li><strong>am Nachmittag</strong> — popodne</li>
            <li><strong>am Abend / abends</strong> — uveče</li>
            <li><strong>in der Nacht / nachts</strong> — noću</li>
          </ul>

          <h3>Frekvencija</h3>
          <ul>
            <li><strong>immer</strong> — uvek</li>
            <li><strong>oft</strong> — često</li>
            <li><strong>manchmal</strong> — ponekad</li>
            <li><strong>selten</strong> — retko</li>
            <li><strong>nie</strong> — nikad</li>
          </ul>

          <blockquote>
          Primer celog dana: <em>"Morgens stehe ich um 7 Uhr auf. Ich trinke Kaffee
          und gehe zur Arbeit. Mittags esse ich in der Kantine. Abends koche ich
          und sehe fern. Um 23 Uhr gehe ich ins Bett."</em>
          </blockquote>
        `,
        exercises: [
          {
            title: 'Vreme i aktivnost',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Šta najbolje opisuje "Ich frühstücke um 8 Uhr"?',
                options: [
                  { id: 'a', text: 'Ležem u 8h.' },
                  { id: 'b', text: 'Doručkujem u 8h.' },
                  { id: 'c', text: 'Idem na posao u 8h.' },
                  { id: 'd', text: 'Ručam u 8h.' },
                ],
                correctOptionId: 'b',
                explanation: '"Frühstücken" znači doručkovati. Frühstück = doručak.',
              },
            },
          },
          {
            title: 'Frekvencija',
            type: 'matching',
            payload: {
              type: 'matching',
              data: {
                question: 'Spoji prilog sa značenjem',
                left: [
                  { id: 'l1', text: 'immer' },
                  { id: 'l2', text: 'oft' },
                  { id: 'l3', text: 'manchmal' },
                  { id: 'l4', text: 'nie' },
                ],
                right: [
                  { id: 'r1', text: 'uvek' },
                  { id: 'r2', text: 'često' },
                  { id: 'r3', text: 'ponekad' },
                  { id: 'r4', text: 'nikad' },
                ],
                pairs: { l1: 'r1', l2: 'r2', l3: 'r3', l4: 'r4' },
              },
            },
          },
          {
            title: 'Redosled dana',
            type: 'ordering',
            payload: {
              type: 'ordering',
              data: {
                question: 'Poređaj radnje po prirodnom redosledu dana',
                items: [
                  { id: 'a', text: 'Ich stehe auf.' },
                  { id: 'b', text: 'Ich frühstücke.' },
                  { id: 'c', text: 'Ich gehe zur Arbeit.' },
                  { id: 'd', text: 'Ich komme nach Hause.' },
                  { id: 'e', text: 'Ich gehe ins Bett.' },
                ],
              },
            },
          },
        ],
      },
      {
        title: 'Modalni glagoli — können, müssen, wollen',
        contentHtml: `
          <h2>Glagoli koji menjaju značenje rečenice</h2>
          <p>Modalni glagoli su poseban set — dodaju glagolu nijansu mogućnosti,
          obaveze ili želje. Idu PRE infinitiva drugog glagola u rečenici, a infinitiv
          ide na <strong>kraj rečenice</strong>.</p>

          <h3>Tri najbitnija</h3>
          <ul>
            <li><strong>können</strong> <em>(moći, znati / umeti)</em></li>
            <li><strong>müssen</strong> <em>(morati)</em></li>
            <li><strong>wollen</strong> <em>(hteti)</em></li>
          </ul>

          <h3>Konjugacija "können"</h3>
          <ul>
            <li>ich kann · du kannst · er kann</li>
            <li>wir können · ihr könnt · sie können</li>
          </ul>

          <h3>Konjugacija "müssen"</h3>
          <ul>
            <li>ich muss · du musst · er muss</li>
            <li>wir müssen · ihr müsst · sie müssen</li>
          </ul>

          <h3>Konjugacija "wollen"</h3>
          <ul>
            <li>ich will · du willst · er will</li>
            <li>wir wollen · ihr wollt · sie wollen</li>
          </ul>

          <blockquote>
          <strong>Pažnja!</strong> Modalni glagoli su nepravilni — u 1. i 3. licu jednine
          (ich, er) imaju ISTI oblik: ich kann = er kann.
          </blockquote>

          <h3>Pravilo položaja u rečenici</h3>
          <p>Modalni glagol ide na 2. mesto, infinitiv DRUGOG glagola ide NA KRAJ:</p>
          <p><strong>Ich kann Deutsch sprechen.</strong>
          <em>(Mogu da pričam nemački.)</em></p>
          <p><strong>Wir müssen heute arbeiten.</strong>
          <em>(Moramo danas da radimo.)</em></p>
          <p><strong>Sie will Kaffee trinken.</strong>
          <em>(Ona hoće da pije kafu.)</em></p>

          <h3>Negacija</h3>
          <p>Za "ne moram" → <strong>nicht müssen</strong> ili još bolje <strong>nicht brauchen
          + zu</strong>:</p>
          <ul>
            <li>Ich muss nicht arbeiten. <em>(Ne moram da radim.)</em></li>
            <li>Ich kann nicht schwimmen. <em>(Ne znam da plivam.)</em></li>
          </ul>
        `,
        exercises: [
          {
            title: 'Konjugacija "können"',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Koji oblik ide uz "ich"?',
                options: [
                  { id: 'a', text: 'ich könne' },
                  { id: 'b', text: 'ich kann' },
                  { id: 'c', text: 'ich können' },
                  { id: 'd', text: 'ich könnt' },
                ],
                correctOptionId: 'b',
                explanation: 'Modalni glagoli u 1. i 3. licu jednine ne dobijaju -e/-t: ich kann, er kann.',
              },
            },
          },
          {
            title: 'Redosled u rečenici',
            type: 'ordering',
            payload: {
              type: 'ordering',
              data: {
                question: 'Sastavi rečenicu — gde ide modalni, gde infinitiv?',
                items: [
                  { id: 'a', text: 'Ich' },
                  { id: 'b', text: 'kann' },
                  { id: 'c', text: 'gut' },
                  { id: 'd', text: 'Deutsch' },
                  { id: 'e', text: 'sprechen' },
                ],
              },
            },
          },
          {
            title: 'Modalni glagol u kontekstu',
            type: 'fill_blank',
            payload: {
              type: 'fill_blank',
              data: {
                template: 'Heute ist Sonntag. Ich ___ nicht arbeiten. Ich ___ heute schlafen.',
                answers: [
                  { accepted: ['muss', 'darf'] },
                  { accepted: ['will', 'möchte', 'kann'] },
                ],
                explanation: 'Prvi je "ne moram" → muss nicht. Drugi je "hoću / mogu da spavam".',
              },
            },
          },
        ],
      },
    ],
  },

  /* ═══════════════════════════ MODUL 5 ═══════════════════════════ */
  {
    title: 'U gradu — orijentacija i kupovina',
    lessons: [
      {
        title: 'Wo ist...? — pitanje za put',
        contentHtml: `
          <h2>Kako da pitaš za pravac</h2>
          <p>U Nemačkoj se snalaženje pita ljubazno i jasno. Najsigurnija formula:</p>
          <p><strong>Entschuldigung, wo ist...?</strong> <em>(Izvinite, gde je...?)</em></p>

          <h3>Tipovi mesta</h3>
          <ul>
            <li><strong>der Bahnhof</strong> <em>(železnička stanica)</em></li>
            <li><strong>die Apotheke</strong> <em>(apoteka)</em></li>
            <li><strong>das Krankenhaus</strong> <em>(bolnica)</em></li>
            <li><strong>das Hotel</strong></li>
            <li><strong>die Bank</strong></li>
            <li><strong>das Restaurant</strong></li>
            <li><strong>die Toilette</strong> <em>(toalet — ne zaboravi!)</em></li>
          </ul>

          <h3>Smerovi</h3>
          <ul>
            <li><strong>rechts</strong> — desno</li>
            <li><strong>links</strong> — levo</li>
            <li><strong>geradeaus</strong> — pravo</li>
            <li><strong>vorn / vorne</strong> — napred</li>
            <li><strong>hinten</strong> — pozadi</li>
          </ul>

          <h3>Tipičan odgovor</h3>
          <blockquote>
          <em>"Gehen Sie geradeaus, dann links. Der Bahnhof ist rechts."</em><br>
          <em>(Idite pravo, pa levo. Stanica je desno.)</em>
          </blockquote>

          <h3>"In der Nähe" — u blizini</h3>
          <ul>
            <li><strong>Ist eine Apotheke in der Nähe?</strong>
            <em>(Da li je apoteka u blizini?)</em></li>
            <li><strong>Es ist hier in der Nähe.</strong>
            <em>(Tu je u blizini.)</em></li>
          </ul>

          <h3>Predlozi za mesto</h3>
          <ul>
            <li><strong>neben</strong> — pored</li>
            <li><strong>zwischen</strong> — između</li>
            <li><strong>vor</strong> — ispred</li>
            <li><strong>hinter</strong> — iza</li>
            <li><strong>gegenüber</strong> — preko puta</li>
          </ul>
        `,
        exercises: [
          {
            title: 'Šta znači "geradeaus"?',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Kako prevodiš "geradeaus"?',
                options: [
                  { id: 'a', text: 'desno' },
                  { id: 'b', text: 'levo' },
                  { id: 'c', text: 'pravo' },
                  { id: 'd', text: 'pozadi' },
                ],
                correctOptionId: 'c',
                explanation: 'Geradeaus = pravo, nastavi u istom pravcu.',
              },
            },
          },
          {
            title: 'Spoji smer',
            type: 'matching',
            payload: {
              type: 'matching',
              data: {
                question: 'Spoji nemački smer sa srpskim',
                left: [
                  { id: 'l1', text: 'rechts' },
                  { id: 'l2', text: 'links' },
                  { id: 'l3', text: 'geradeaus' },
                  { id: 'l4', text: 'gegenüber' },
                ],
                right: [
                  { id: 'r1', text: 'desno' },
                  { id: 'r2', text: 'levo' },
                  { id: 'r3', text: 'pravo' },
                  { id: 'r4', text: 'preko puta' },
                ],
                pairs: { l1: 'r1', l2: 'r2', l3: 'r3', l4: 'r4' },
              },
            },
          },
          {
            title: 'Sastavi pitanje',
            type: 'ordering',
            payload: {
              type: 'ordering',
              data: {
                question: 'Sastavi učtivo pitanje za put',
                items: [
                  { id: 'a', text: 'Entschuldigung,' },
                  { id: 'b', text: 'wo' },
                  { id: 'c', text: 'ist' },
                  { id: 'd', text: 'der Bahnhof?' },
                ],
              },
            },
          },
        ],
      },
      {
        title: 'U restoranu — naručivanje i plaćanje',
        contentHtml: `
          <h2>Restoran u Nemačkoj</h2>
          <p>Restoran je odlično mesto za vežbanje jezika — formule su standardne.
          Krećemo od ulaska.</p>

          <h3>Ulaz i sto</h3>
          <ul>
            <li>Konobar: <em>"Guten Tag! Haben Sie reserviert?"</em>
            <em>(Da li ste rezervisali?)</em></li>
            <li>Ti: <strong>"Nein, wir sind zu zweit."</strong>
            <em>(Ne, dvoje smo.)</em></li>
          </ul>

          <h3>Naručivanje pića</h3>
          <p>Konobar dolazi sa menijem (<strong>die Karte</strong>):</p>
          <ul>
            <li><strong>"Möchten Sie etwas trinken?"</strong>
            <em>(Hoćete li nešto da popijete?)</em></li>
            <li>Ti: <strong>"Ich nehme ein Wasser, bitte."</strong>
            <em>(Uzeću vodu, molim.)</em></li>
            <li>Ili: <strong>"Einen Kaffee, bitte."</strong>
            <em>(Kafu, molim.)</em></li>
          </ul>

          <h3>Korisni izrazi</h3>
          <ul>
            <li><strong>Ich hätte gern...</strong> <em>(Voleo bih...)</em> — najučtivije</li>
            <li><strong>Ich nehme...</strong> <em>(Uzeću...)</em> — opušteno</li>
            <li><strong>Was empfehlen Sie?</strong> <em>(Šta preporučujete?)</em></li>
            <li><strong>Ich bin Vegetarier(in).</strong> <em>(Vegetarijanac/ka sam.)</em></li>
          </ul>

          <h3>Plaćanje</h3>
          <p>U Nemačkoj se često traži račun:</p>
          <ul>
            <li><strong>"Die Rechnung, bitte!"</strong>
            <em>(Račun, molim!)</em></li>
            <li><strong>"Kann ich mit Karte zahlen?"</strong>
            <em>(Mogu li karticom?)</em></li>
            <li><strong>"Zusammen oder getrennt?"</strong>
            <em>(Zajedno ili odvojeno?)</em> — pita konobar</li>
            <li><strong>"Stimmt so."</strong>
            <em>(U redu je tako.)</em> — kad ostavljaš bakšiš</li>
          </ul>

          <blockquote>
          <strong>Kulturna napomena:</strong> Bakšiš (Trinkgeld) je oko 10%. Kažeš
          konobaru iznos pre nego što plati ("13 Euro, bitte" iako je račun 11,50€) ili
          ostaviš na stolu. <em>"Stimmt so"</em> znači "Sve ti ostaje" kao bakšiš.
          </blockquote>

          <h3>Hrana — osnovne reči</h3>
          <ul>
            <li><strong>das Brot</strong> — hleb</li>
            <li><strong>der Käse</strong> — sir</li>
            <li><strong>das Fleisch</strong> — meso</li>
            <li><strong>der Fisch</strong> — riba</li>
            <li><strong>der Salat</strong> — salata</li>
            <li><strong>die Suppe</strong> — supa</li>
            <li><strong>das Wasser</strong> — voda</li>
            <li><strong>der Saft</strong> — sok</li>
            <li><strong>das Bier</strong> — pivo</li>
          </ul>
        `,
        exercises: [
          {
            title: 'Naručivanje',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Najljubazniji način da naručiš kafu:',
                options: [
                  { id: 'a', text: 'Kaffee!' },
                  { id: 'b', text: 'Ich will Kaffee.' },
                  { id: 'c', text: 'Ich hätte gern einen Kaffee, bitte.' },
                  { id: 'd', text: 'Bringen Sie mir Kaffee!' },
                ],
                correctOptionId: 'c',
                explanation: '"Ich hätte gern..." (voleo bih) je najučtivije. Završi sa "bitte" za double politeness.',
              },
            },
          },
          {
            title: 'Hrana — uparivanje',
            type: 'matching',
            payload: {
              type: 'matching',
              data: {
                question: 'Spoji nemačko sa srpskim',
                left: [
                  { id: 'l1', text: 'das Brot' },
                  { id: 'l2', text: 'der Käse' },
                  { id: 'l3', text: 'der Fisch' },
                  { id: 'l4', text: 'die Suppe' },
                  { id: 'l5', text: 'der Saft' },
                ],
                right: [
                  { id: 'r1', text: 'hleb' },
                  { id: 'r2', text: 'sir' },
                  { id: 'r3', text: 'riba' },
                  { id: 'r4', text: 'supa' },
                  { id: 'r5', text: 'sok' },
                ],
                pairs: { l1: 'r1', l2: 'r2', l3: 'r3', l4: 'r4', l5: 'r5' },
              },
            },
          },
          {
            title: 'Plaćanje računa',
            type: 'fill_blank',
            payload: {
              type: 'fill_blank',
              data: {
                template: 'Posle obroka tražiš: "Die ___, bitte!" Konobar pita: "___ oder getrennt?"',
                answers: [
                  { accepted: ['Rechnung'] },
                  { accepted: ['Zusammen'] },
                ],
                explanation: '"Die Rechnung, bitte" = račun, molim. "Zusammen oder getrennt" = zajedno ili odvojeno.',
              },
            },
          },
        ],
      },
      {
        title: 'U prodavnici — kupovina osnovnih stvari',
        contentHtml: `
          <h2>Kupovina u Nemačkoj</h2>
          <p>U svakodnevnom životu, prodavnica je drugo mesto gde ćeš pričati. Evo
          osnovnih izraza.</p>

          <h3>Tipovi prodavnica</h3>
          <ul>
            <li><strong>der Supermarkt</strong> <em>(supermarket — npr. Rewe, Edeka)</em></li>
            <li><strong>die Bäckerei</strong> <em>(pekara)</em></li>
            <li><strong>die Metzgerei</strong> <em>(mesara)</em></li>
            <li><strong>die Drogerie</strong> <em>(drogerija — DM, Rossmann)</em></li>
            <li><strong>die Apotheke</strong> <em>(apoteka, samo za lekove)</em></li>
          </ul>

          <h3>Pitanja prodavcu</h3>
          <ul>
            <li><strong>"Was kostet das?"</strong> <em>(Koliko košta?)</em></li>
            <li><strong>"Haben Sie...?"</strong> <em>(Da li imate...?)</em></li>
            <li><strong>"Wo finde ich...?"</strong> <em>(Gde mogu da nađem...?)</em></li>
          </ul>

          <h3>Količine</h3>
          <ul>
            <li><strong>ein Kilo Äpfel</strong> <em>(kilo jabuka)</em></li>
            <li><strong>ein halbes Kilo</strong> <em>(pola kile)</em></li>
            <li><strong>ein Liter Milch</strong> <em>(litar mleka)</em></li>
            <li><strong>eine Flasche Wein</strong> <em>(flaša vina)</em></li>
            <li><strong>eine Packung Kekse</strong> <em>(paket keksa)</em></li>
            <li><strong>ein Stück Kuchen</strong> <em>(parče kolača)</em></li>
          </ul>

          <h3>Boje (jer pitaš za odeću)</h3>
          <ul>
            <li><strong>rot</strong> — crvena</li>
            <li><strong>blau</strong> — plava</li>
            <li><strong>grün</strong> — zelena</li>
            <li><strong>gelb</strong> — žuta</li>
            <li><strong>schwarz</strong> — crna</li>
            <li><strong>weiß</strong> — bela</li>
            <li><strong>grau</strong> — siva</li>
          </ul>

          <h3>Plaćanje</h3>
          <ul>
            <li><strong>"Zahlen Sie bar oder mit Karte?"</strong> <em>(Plaćate gotovinom ili karticom?)</em></li>
            <li><strong>"Ich zahle mit Karte."</strong> <em>(Plaćam karticom.)</em></li>
            <li><strong>"Bar, bitte."</strong> <em>(Gotovinom, molim.)</em></li>
          </ul>

          <blockquote>
          <strong>Kultura:</strong> U Nemačkoj su mnoge prodavnice <strong>zatvorene
          nedeljom</strong>. Otvorene su uglavnom pekare i benzinske pumpe. Subota je
          poslednji dan da napuniš frižider!
          </blockquote>
        `,
        exercises: [
          {
            title: 'Koliko košta?',
            type: 'multiple_choice',
            payload: {
              type: 'multiple_choice',
              data: {
                question: 'Kako pitaš "Koliko košta?"',
                options: [
                  { id: 'a', text: 'Wie viel ist?' },
                  { id: 'b', text: 'Was kostet das?' },
                  { id: 'c', text: 'Wie teuer?' },
                  { id: 'd', text: 'Wo ist die Karte?' },
                ],
                correctOptionId: 'b',
                explanation: '"Was kostet das?" = "Šta to košta?" — standardno pitanje za cenu.',
              },
            },
          },
          {
            title: 'Boje',
            type: 'matching',
            payload: {
              type: 'matching',
              data: {
                question: 'Spoji nemačku boju sa srpskim imenom',
                left: [
                  { id: 'l1', text: 'rot' },
                  { id: 'l2', text: 'blau' },
                  { id: 'l3', text: 'grün' },
                  { id: 'l4', text: 'schwarz' },
                  { id: 'l5', text: 'weiß' },
                ],
                right: [
                  { id: 'r1', text: 'crvena' },
                  { id: 'r2', text: 'plava' },
                  { id: 'r3', text: 'zelena' },
                  { id: 'r4', text: 'crna' },
                  { id: 'r5', text: 'bela' },
                ],
                pairs: { l1: 'r1', l2: 'r2', l3: 'r3', l4: 'r4', l5: 'r5' },
              },
            },
          },
          {
            title: 'Količine',
            type: 'fill_blank',
            payload: {
              type: 'fill_blank',
              data: {
                template: 'U pekari naručim: "Ich hätte gern ein ___ Brot und ein ___ Kuchen, bitte."',
                answers: [
                  { accepted: ['Stück', 'Stueck'] },
                  { accepted: ['Stück', 'Stueck'] },
                ],
                explanation: 'Ein Stück = jedan komad / parče. Koristi se za hleb i kolač.',
              },
            },
          },
        ],
      },
    ],
  },
]

/* ════════════════════════════════════════════════════════════════════
   SEED EXECUTION
════════════════════════════════════════════════════════════════════ */

async function seed() {
  console.log(`[seed] German A1 — start`)

  // Brisanje postojećeg kursa (cascade obriše modules → lessons → exercises)
  const [existing] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.slug, SLUG))
    .limit(1)
  if (existing) {
    console.log(`[seed] briše postojeći kurs ${existing.id}`)
    await db.delete(courses).where(eq(courses.id, existing.id))
  }

  // 1. Course
  const [course] = await db
    .insert(courses)
    .values({
      title: 'Nemački A1 — Probudi nemački u sebi',
      slug: SLUG,
      description: COURSE_DESCRIPTION.replace(/\s+/g, ' ').trim(),
      level: 'A1',
      language: 'de',
      status: 'published',
      position: 0,
    })
    .returning()
  console.log(`[seed] kurs: ${course.title} (${course.id})`)

  // 2. Modules + lessons + exercises
  let totalLessons = 0
  let totalExercises = 0

  for (let mIdx = 0; mIdx < MODULES.length; mIdx++) {
    const m = MODULES[mIdx]
    const [mod] = await db
      .insert(modules)
      .values({ courseId: course.id, title: m.title, position: mIdx })
      .returning()
    console.log(`  └ modul ${mIdx + 1}: ${mod.title}`)

    for (let lIdx = 0; lIdx < m.lessons.length; lIdx++) {
      const l = m.lessons[lIdx]
      const [lesson] = await db
        .insert(lessons)
        .values({
          moduleId: mod.id,
          title: l.title,
          type: 'text', // primarni tip — ima i vežbe, korisnik može da doda video
          status: 'published',
          position: lIdx,
          content: { body: l.contentHtml.replace(/^\s+|\s+$/gm, '').trim() },
        })
        .returning()
      totalLessons++
      console.log(`     • lekcija ${lIdx + 1}: ${lesson.title}`)

      for (let eIdx = 0; eIdx < l.exercises.length; eIdx++) {
        const e = l.exercises[eIdx]
        await db.insert(exercises).values({
          lessonId: lesson.id,
          title: e.title,
          type: e.type,
          payload: e.payload,
          status: 'published',
          position: eIdx,
        })
        totalExercises++
      }
    }
  }

  console.log(`[seed] ✓ kurs setapovan`)
  console.log(`       moduli:  ${MODULES.length}`)
  console.log(`       lekcije: ${totalLessons}`)
  console.log(`       vežbe:   ${totalExercises}`)
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('[seed] ✗ greška:', e)
    process.exit(1)
  })

void id // unused placeholder
