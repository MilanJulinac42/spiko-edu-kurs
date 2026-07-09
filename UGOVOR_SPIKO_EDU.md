# UGOVOR O IZRADI SOFTVERA

Zaključen u Bačkoj Palanci, dana **____________ 2026. godine**, između:

## 1. UGOVORNE STRANE

**1.1. Izvođač:**
**MILAN JULINAC PR RAČUNARSKO PROGRAMIRANJE JM-IT BAČKA PALANKA**
- Skraćeno poslovno ime: **JM-IT**
- Pravna forma: Preduzetnik
- Matični broj: **68245036**
- PIB: **____________________**
- Sedište: ____________________, Bačka Palanka
- Tekući račun: **____________________**, otvoren kod **____________________ banke**
- Kontakt: milanjulinac996@gmail.com
- Zastupa: Milan Julinac, osnivač i preduzetnik

(u daljem tekstu: **„Izvođač"**)

**1.2. Naručilac:**
**SPIKO EDU** *(puno poslovno ime: _____________________________)*
- Pravna forma: ____________________
- Matični broj: ____________________
- PIB: ____________________
- Sedište: _____________________________
- Tekući račun: ____________________
- Zastupa: ____________________ *(funkcija i ime)*

(u daljem tekstu: **„Naručilac"**)

Zajednički: **„Ugovorne strane"**.

---

## 2. PREDMET UGOVORA

**Član 1.**
Predmet ovog Ugovora je izrada softverske platforme za onlajn učenje stranih jezika pod komercijalnim nazivom **„Spiko Edu"** (u daljem tekstu: **„Softver"**), namenjene tržištu Republike Srbije.

**Član 2. — Obim isporuke**
Softver obuhvata sledeće komponente, koje je Izvođač razvio i predao Naručiocu:

### 2.1. Studentska web aplikacija (`apps/web`)
- Marketing prezentaciona stranica (landing page) sa svim sekcijama: hero, kako radi, demo, cenovnik, FAQ, kontakt;
- Registracija i prijava (email + lozinka, reset lozinke);
- Studentska kontrolna tabla (dashboard) sa pregledom upisanih kurseva i napretka;
- Pregled kursa sa modulima i lekcijama;
- Plejer lekcije sa video sadržajem (Bunny Stream), tekstualnim sadržajem i interaktivnim vežbama;
- 4 tipa interaktivnih vežbi: multiple choice, popunjavanje praznine (fill-in-the-blank), uparivanje (matching), uređenje redosleda (ordering);
- Automatsko ocenjivanje vežbi i praćenje napretka;
- AI tutor (Anthropic Claude) sa kontekstom konkretne lekcije;
- AI inline pretraga reči — selekcijom reči u lekciji dobija se prevod i objašnjenje;
- AI objašnjenje pogrešnih odgovora u vežbama;
- Sistem beleški po lekciji;
- Sistem bookmark-a reči (vokabular);
- Sistem ponavljanja reči po lekciji (spaced repetition);
- Pretraga (Cmd+K) kroz lekcije, vežbe i sačuvane reči;
- Stranica napretka sa nedeljnim pregledom, streak-om, mesečnom mrežom aktivnosti, listom dostignuća i statistikom po tipu vežbe;
- Komentari i ocene na nivou lekcije i kursa;
- Floating mini-plejer za video pri skrolovanju (Picture-in-Picture);
- Konfeti i zvučna animacija na završetku lekcije;
- Stranica sa preglednim pregledom sledeće lekcije nakon završetka trenutne.

### 2.2. Administratorski panel (`apps/admin`)
- Pregled (dashboard) sa ključnim brojkama o sadržaju i korisnicima;
- Upravljanje kursevima (kreiranje, izmena, brisanje, objavljivanje);
- Vizuelni builder kursa sa moduli/lekcije strukturom, drag-and-drop preuređivanjem;
- Editor lekcije sa video upload-om (Bunny TUS protokol), rich text editorom (TipTap) i panel za vežbe;
- Biblioteka vežbi (templates) sa 4 tipa vežbi, dupliciranjem i ubacivanjem u lekcije;
- Stranica medija — pregled svih video fajlova iz Bunny biblioteke, sa identifikacijom „siročadi" (videa koji nisu vezani ni za jednu lekciju) i bulk čišćenjem istih;
- Upravljanje korisnicima (pregled, dodela uloga: student / nastavnik / admin);
- Brendirani sistem dialog prozora (umesto generičkih browser prompt/confirm);
- Brendirani sistem notifikacija (toast) za sve akcije čuvanja, brisanja i izmena;
- Skeleton učitavanje na svim stranama;
- Indikator napretka pri promeni rute.

### 2.3. Backend API (`apps/api`)
- REST API zasnovan na Bun runtime-u i Elysia framework-u;
- Autentikacija preko Supabase Auth (JWT);
- Pristup bazi preko Drizzle ORM-a;
- Integracija sa Bunny Stream API-jem (kreiranje, sinhronizacija, brisanje videa, TUS upload autorizacija, potpisani playback URL-ovi);
- Integracija sa Anthropic Claude API-jem (chat, brza pretraga reči, objašnjenje pogrešnih odgovora);
- Rate limiting za AI pozive;
- Endpoint-i za sve gore navedene funkcionalnosti;
- HTTP keš strategija (cache-control header-i) za optimizaciju;
- Sistem migracija baze (Drizzle Kit).

### 2.4. Deljeni paket (`packages/shared`)
- Tip definicije za vežbe i deljene konstante (CEFR nivoi, validacije).

### 2.5. Baza podataka
- PostgreSQL šema (Supabase) sa svim potrebnim tabelama: kursevi, moduli, lekcije, vežbe, korisnički profili, napredak, pokušaji, AI konverzacije, ocene, komentari, beleške, vokabular bookmarks, pretplate, rezervacije;
- Indeksi za performanse;
- Migracioni fajlovi.

### 2.6. Inicijalni sadržaj
- Seed podaci za kompletan kurs „Nemački A1" sa modulima, lekcijama, video lekcijama i interaktivnim vežbama.

---

## 3. CENA I NAČIN PLAĆANJA

**Član 3.**
Ukupna naknada za izradu i predaju Softvera iznosi **180.000,00 RSD (slovima: stoosamdesethiljada dinara)**.

Iznos se isplaćuje u **6 (šest) jednakih mesečnih rata od po 30.000,00 RSD (slovima: tridesethiljada dinara)**.

> *Napomena za informaciju Ugovornih strana: ugovoreni iznos ekvivalentan je približno 1.500 EUR po srednjem kursu Narodne banke Srbije važećem na dan zaključenja ovog Ugovora. Naknadne fluktuacije kursa ne utiču na ugovoreni iznos.*

**Član 4. — Dinamika plaćanja**
- **1. rata:** plaća se u roku od **7 (sedam) dana** od potpisivanja ovog Ugovora;
- **2. — 6. rata:** plaća se svakog narednog meseca, na isti datum kao prva rata, u roku do **5 (pet) radnih dana** od dospeća.

**Član 5. — Način plaćanja**
Naručilac vrši plaćanje **u dinarima (RSD)** uplatom na tekući račun Izvođača broj **____________________** otvoren kod **____________________ banke**, sa pozivom na broj fakture koju Izvođač izda za svaku ratu.

Izvođač izdaje pojedinačnu fakturu za svaku ratu u roku od **3 (tri) radna dana** pre dospeća rate.

**Član 6. — Poreski tretman**
Izvođač je upisan u registar **paušalno oporezivih preduzetnika** za delatnost računarskog programiranja i kao takav nije obveznik PDV-a. Faktura za svaku ratu izdaje se **bez PDV-a**, sa naznakom: *„PDV nije obračunat u skladu sa članom 33. Zakona o porezu na dodatu vrednost — paušalno oporezivanje."*

Sve poreske i druge javne obaveze koje proizilaze iz isplata naknade po ovom Ugovoru snosi Izvođač kroz redovan obračun paušalnog poreza i doprinosa.

**Član 7. — Posledice docnje**
U slučaju kašnjenja Naručioca sa isplatom bilo koje rate duže od **15 (petnaest) dana** od dospeća, Izvođač zadržava pravo da:
- privremeno obustavi pružanje usluga podrške do izmirenja dospelih obaveza;
- obračuna zakonsku zateznu kamatu na neizmireni iznos, počev od dana dospeća do dana plaćanja, u skladu sa Zakonom o zateznoj kamati.

---

## 4. PREDAJA, GARANCIJA I ODRŽAVANJE

**Član 8. — Predaja**
Softver se smatra predatim danom potpisivanja ovog Ugovora i pristupanjem Naručioca svim relevantnim resursima:
- Pristup izvornom kodu kroz Git repository;
- Pristup Supabase konzoli (vlasništvo nad projektom);
- Pristup Bunny Stream konzoli (vlasništvo nad nalogom);
- Pristup Anthropic API ključu (vlasništvo nad nalogom);
- Sva potrebna dokumentacija za pokretanje i deploy.

**Član 9. — Garantni rok**
Izvođač garantuje ispravno funkcionisanje Softvera u trajanju od **30 (trideset) dana** od dana predaje. U tom roku, Izvođač je dužan da **bez naknade** otkloni sve **bagove** (greške u kodu) koje Naručilac uoči, a koje sprečavaju normalno korišćenje Softvera u skladu sa namenom.

Garancija **NE obuhvata**:
- Greške nastale izmenama izvornog koda od strane trećih lica;
- Funkcionalnosti koje nisu eksplicitno navedene u Članu 2. ovog Ugovora („nove" funkcije, „dorade", proširenja);
- Probleme uzrokovane infrastrukturom van Izvođačeve kontrole (Supabase, Bunny, Anthropic, hosting);
- Izmene zbog promene API-ja trećih strana (Bunny, Supabase, Anthropic) nastale posle dana predaje.

**Član 10. — Troškovi infrastrukture i održavanja**
**Sve troškove infrastrukture, hostinga, eksternih servisa i tekućeg održavanja Softvera snosi isključivo Naručilac.** Ovo obuhvata, ali se ne ograničava na:
- Supabase pretplatu (baza, autentikacija, storage);
- Bunny Stream pretplatu i potrošnju (storage, bandwidth, encoding);
- Anthropic API potrošnju (Claude pozivi);
- Hosting (Railway, Cloudflare, ili drugi);
- Domenska imena i SSL sertifikate;
- Email servise (Resend ili drugi);
- Bilo koje treće strane integracije koje Naručilac u budućnosti uvede.

**Član 11. — Podrška posle garancije**
Po isteku garantnog roka iz Člana 9, Izvođač nema obavezu pružanja podrške, ispravki ili nadogradnji. Eventualna buduća saradnja (nove funkcije, integracije, redizajn) reguliše se posebnim aneksima ili novim ugovorima, prema važećoj satnici Izvođača ili dogovorenoj fiksnoj ceni.

---

## 5. INTELEKTUALNA SVOJINA I VLASNIŠTVO

**Član 12.**
Konačnom isplatom šeste rate, sva imovinska autorska prava nad isporučenim izvornim kodom Softvera u celosti prelaze na Naručioca. Do tog momenta, Naručilac dobija **isključivu licencu za korišćenje** Softvera u svom poslovanju, ali ne sme da ga prodaje, sublicencira ili distribuira trećim licima.

**Član 13. — Moralna prava**
Izvođač zadržava moralna autorska prava u skladu sa Zakonom o autorskom i srodnim pravima Republike Srbije, uključujući pravo da Softver navede u svom portfoliu, sa naznakom Naručioca kao klijenta (osim ako Naručilac to izričito ne zabrani u pisanoj formi).

**Član 14. — Treće strane**
Softver koristi **otvorene biblioteke (open source)** i komercijalne servise trećih strana. Naručilac prihvata uslove korišćenja tih servisa direktno sa njihovim pružaocima:
- Bunny Stream (video CDN);
- Supabase (baza i autentikacija);
- Anthropic Claude (AI);
- Open source biblioteke navedene u `package.json` fajlovima projekta.

---

## 6. POVERLJIVOST

**Član 15.**
Obe Ugovorne strane se obavezuju da će sve informacije razmenjene tokom pripreme i izrade Softvera čuvati kao poslovnu tajnu i da iste neće saopštavati trećim licima bez prethodne pisane saglasnosti druge strane.

Ova obaveza ne prestaje prestankom ovog Ugovora i traje **2 (dve) godine** od dana predaje Softvera.

---

## 7. OGRANIČENJE ODGOVORNOSTI

**Član 16.**
Izvođač nije odgovoran za:
- Bilo kakvu indirektnu, slučajnu, posledičnu štetu nastalu korišćenjem Softvera (izgubljena dobit, gubitak podataka itd.);
- Štetu nastalu nepravilnim korišćenjem Softvera od strane Naručioca ili krajnjih korisnika;
- Štetu nastalu izmenama koje su izvršila treća lica nakon predaje;
- Štetu nastalu prekidima usluga trećih strana (Bunny, Supabase, Anthropic).

Maksimalna odgovornost Izvođača po ovom Ugovoru ograničena je na visinu već isplaćene naknade.

---

## 8. RAZVOJ SARADNJE I PROŠIRENJA

**Član 17.**
Ugovorne strane mogu u budućnosti aneksima ovog Ugovora ili posebnim ugovorima dogovoriti dodatne funkcionalnosti, koje nisu predviđene Članom 2. Te dodatne funkcionalnosti se posebno cene i naručuju u pisanoj formi.

Funkcije koje su tokom razvoja **pomenute ali nisu uključene u predaju** (i nisu predmet ovog Ugovora) obuhvataju, ali se ne ograničavaju na:
- Integraciju sa Raiffeisen Bank platnim sistemom za naplatu pretplata;
- Booking sistem sa Google Calendar i Google Meet integracijom za konverzacije sa nastavnikom;
- Generisanje PDF sertifikata na završetku kursa;
- Onboarding placement test za novokorisnika;
- Email obaveštenja (welcome, podsetnici, potvrde) preko transakcionog email servisa;
- Google OAuth prijavljivanje;
- Streak freeze, weekly goal i achievement toast notifikacije;
- SEO meta tagove i Open Graph slike;
- Cookie consent banner za GDPR usaglašenost;
- Deploy na produkciju (Railway / Cloudflare) i konfigurisanje domena.

Sve gore navedene stavke su u potpunosti **van obima ovog Ugovora** i ne smatraju se delom predaje.

---

## 9. RAZREŠENJE SPOROVA

**Član 18.**
Ugovorne strane će sve eventualne sporove pokušati da reše mirnim putem, kroz neposredne pregovore.

U slučaju nemogućnosti mirnog rešavanja, za rešavanje spora nadležan je **stvarno i mesno nadležan sud u Novom Sadu**.

---

## 10. ZAVRŠNE ODREDBE

**Član 19.**
Ovaj Ugovor stupa na snagu danom potpisivanja od strane obe Ugovorne strane.

**Član 20.**
Sve izmene i dopune ovog Ugovora moraju biti u pisanoj formi i potpisane od obe Ugovorne strane.

**Član 21.**
Na sve što nije regulisano ovim Ugovorom, primenjuju se odredbe **Zakona o obligacionim odnosima**, **Zakona o autorskom i srodnim pravima** i ostali važeći propisi Republike Srbije.

**Član 22.**
Ovaj Ugovor je sačinjen u **2 (dva) istovetna primerka**, po jedan za svaku Ugovornu stranu.

---

## POTPISI UGOVORNIH STRANA

U Bačkoj Palanci, dana **____________ 2026.**

| **IZVOĐAČ** | **NARUČILAC** |
|---|---|
| | |
| _________________________ | _________________________ |
| Milan Julinac | *(ime i prezime ovlašćenog lica)* |
| JM-IT preduzetnik | Spiko Edu |
| (pečat) | (pečat) |

---

### NAPOMENE PRE POTPISIVANJA

> **Ovo je nacrt ugovora — pre potpisivanja preporučljivo je:**
>
> 1. **Popuniti PIB JM-IT preduzetnika** — vidi se u APR-u ili na poreskoj prijavi (uobičajeno se navodi pored MB-a). Ako ti nije pri ruci, naći ćeš ga na bilo kojoj već izdatoj fakturi ili u poreskim aplikacijama (eporezi.rs).
> 2. **Popuniti broj tekućeg računa JM-IT-a** i naziv banke — uobičajeno tekući račun otvoren za preduzetničku delatnost.
> 3. **Proveriti pune podatke Spiko Edu kod APR-a** (apr.gov.rs) — puno poslovno ime, MB, PIB, sedište, zastupnik. Bez tih podataka faktura kasnije nije validna.
> 4. **Konsultovati knjigovođu** oko klauzule "PDV nije obračunat" — formulacija iz Člana 6. je standardna ali knjigovođa može da preporuči preciznu formulaciju (npr. „član 33. Zakona o PDV-u" — proveri broj člana sa važećim zakonom).
> 5. **Backup obavezu** — preporuka da Naručilac kupi i čuva snapshot izvornog koda neposredno po prijemu, da se izbegne zavisnost od jednog Git provajdera. Možeš ti to da uradiš za njih kao bonus i mejlom prosledis ZIP.
> 6. **Fakturisanje** — izdaj 6 faktura, jedna mesečno, sa pozivom na ovaj Ugovor (npr. „Po Ugovoru od ___ 2026, rata 1/6"). Sve fakture čuvaj u svojoj evidenciji 10 godina.
