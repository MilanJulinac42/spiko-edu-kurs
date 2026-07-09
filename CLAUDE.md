# CLAUDE.md — Spiko Edu codebase context

Lightweight context fajl koji svaka AI sesija učita pri pokretanju u root-u repo-a.

## Project

**Spiko Edu** je SaaS za onlajn učenje stranih jezika (početno: nemački, engleski). Tržište je Srbija — UI je **na srpskom**. Tehnička dokumentacija u kodu i komentari mogu biti na srpskom ili engleskom.

## Arhitektura (monorepo)

- `apps/web` — studentska web aplikacija + marketing landing (Next.js 15 App Router)
- `apps/admin` — administratorski panel (Next.js 15)
- `apps/api` — backend (Bun + Elysia + Drizzle ORM)
- `packages/shared` — deljeni TS tipovi (exercise payload, CEFR konstante)

## Stack

- **Frontend:** Next.js 15 (App Router), Tailwind v4, SWR, dnd-kit, TipTap
- **Backend:** Bun runtime, Elysia framework, Eden type-safe klijent
- **Baza:** Supabase Postgres preko Drizzle ORM
- **Auth:** Supabase Auth (JWT)
- **Video:** Bunny Stream (TUS upload, HLS playback)
- **AI:** Anthropic Claude Haiku 4.5 za tutor / quick lookup / explain wrong

## ⚠️ Critical conventions

### Rodno-neutralno pisanje (srpski UI)
**Ne znamo pol korisnika i ne tražimo ga.** Sav UI copy mora biti rodno-neutralan.

| ❌ LOŠE | ✅ DOBRO |
|---|---|
| Završila si lekciju | Lekcija završena |
| Pogodio si! | Tačno! |
| Dobrodošla nazad | Pozdrav opet 👋 |
| Spreman da progovoriš? | Vreme je da progovoriš |
| Otključala si X značaka | Otključano: X značaka |
| Zaboravila si lozinku? | Zaboravljena lozinka? |
| Setila si se? | Lozinka je tu? |
| Nastavi gde si stao | Nastavi učenje |

**Pravila:**
- **Akcije → imperativ:** Pokreni, Sačuvaj, Pošalji, Probaj
- **Status → pasiv / impersonal:** Sačuvano, Tačno, Lekcija završena, Otključano
- **Naslovi → glagolska imenica:** Nastavak učenja, Završetak kursa, Snimanje napretka
- **Vokativ je OK:** "Milane, …" je gender-neutral u srpskom
- **NIKAD ne koristi:** "Završio/Završila", "Pogodio/Pogodila", "Mogao bi/Mogla bi", "Bio/Bila", "Sjajan si/Sjajna si"
- **AI tutor** (Claude system prompt) ima eksplicitno gender-neutral pravilo

### Payment processor — RAIFFEISEN, NIKAD Stripe
Sav budući kod za naplatu ide preko **Raiffeisen Bank payment gateway-a** (form-redirect ka banci + HMAC callback). Stripe se NE pominje, NE planira, NE predlaže.

### Authorship
Milan Julinac (JM-IT preduzetnik) je **jedini autor**. U commit porukama **NIKAD** ne dodaj `Co-Authored-By` tag ili sličan.

### .env fajlovi se NIKAD ne commituju
Svi tajni ključevi (Supabase service key, Bunny API key, Anthropic API key, JWT secret) ostaju samo lokalno.

## Brand

- **Primary:** zelena `#86c440` (i tamno-zelena `#5e9e2e`)
- **Secondary:** plava `#3e8fd0`
- **Ink:** `#1a2738` (umesto crne)
- **Fontovi:** Plus Jakarta Sans (body) + Sora (display)
- **Admin tema:** topla biskvit-bela pozadina (`#f7f8f5`)

## Pokretanje (lokalno)

```bash
# API (Bun + Elysia, port 4000)
cd apps/api && bun run dev

# Student web (Next.js, port 3000)
cd apps/web && npm run dev

# Admin (Next.js, port 3001)
cd apps/admin && npm run dev
```

Supabase free tier auto-pauzira posle 7 dana — `Restore project` u dashboard-u pre rada.

## Out of scope (eksplicitno nije deo isporuke)

Ako se pomenu:
- Raiffeisen payment integration
- Bookings + Google Calendar
- Sertifikat PDF — **NEĆE biti izdavanja sertifikata** (eksplicitna odluka)
- Email obaveštenja (Resend)
- Google OAuth
- Deploy (Railway, Cloudflare)

→ to su **buduće faze**, posebni aneksi ugovora.
