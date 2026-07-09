# Deploy Spiko Edu Kurs

Kompletan vodič + tracker za produkciju: **Vercel** (web + admin) · **Railway** (api) · **Supabase** (baza/auth) · **Bunny** (video/audio) · **Loopia** (DNS).

Domeni:
- `kurs.spikoedu.rs` → student app + marketing (`apps/web`)
- `admin.spikoedu.rs` → admin panel (`apps/admin`)
- `api.spikoedu.rs` → backend (`apps/api`)

> `spikoedu.rs` (`@` zapis) = postojeći landing → **ne diramo**.

---

## 📊 Progress tracker

Čekiraj kako napredujemo. Redosled je bitan — svaki korak zavisi od prethodnog.

- [x] **0. Priprema** — kod na GitHub-u, `.env` ignorisani, Supabase/Bunny live
- [ ] **1. Railway** — API backend live na `api.spikoedu.rs`
- [ ] **2. Vercel web** — `kurs.spikoedu.rs`
- [ ] **3. Vercel admin** — `admin.spikoedu.rs`
- [ ] **4. Loopia DNS** — 3 CNAME zapisa + propagacija
- [ ] **5. HTTPS** — Let's Encrypt sertifikati izdati (auto)
- [ ] **6. Supabase Auth** — Site URL + Redirect URLs → produkcija
- [ ] **7. Bunny webhook** — produkcioni URL
- [ ] **8. Smoke test** — registracija, login, admin izmena, `/health`
- [ ] **9. Ema demo** — admin nalog + uživo izmena lekcije

---

## 🗺️ Strategija ukratko

**Redosled i zašto:** API **mora prvi** (web/admin mu se obraćaju preko `NEXT_PUBLIC_API_URL`) → pa Vercel projekti → pa DNS (daju ti CNAME target tek kad postoje) → pa HTTPS (auto po propagaciji) → pa Auth/Webhook prevezivanje → pa test.

**Fazni rollout:**
- **Faza A — interni test:** deploy sva 3 servisa, testiraš sam na produkcionim URL-ovima.
- **Faza B — Ema demo:** admin nalog za Emu, ona uživo doda/izmeni lekciju.
- **Faza C — javno:** objaviš kurseve, podeliš `kurs.spikoedu.rs`.

**Baza:** dev i prod dele **isti Supabase projekat** (mali obim, demo faza) — sve migracije (`audio_title`, vokabular…) i seed kurs su **već u produkciji**. Kad krene naplata → odvojiti `staging`.

**Rollback:** Vercel/Railway čuvaju prethodne deploy-e → „Redeploy" stare verzije = instant rollback. Baza ima samo `ADD COLUMN` migracije (nedestruktivno), pa rollback koda ne kvari šemu.

---

## 0. Pre nego što počneš

- [x] GitHub repo push-ovan (`origin/main` = live) — **urađeno**
- [x] `.env` fajlovi u `.gitignore`, samo `.env.example` u repo-u — **potvrđeno**
- [ ] Supabase projekat live (Restore ako je auto-pauziran posle 7 dana)
- [ ] Bunny Stream + Storage zone aktivni
- [ ] ⚠️ **OpenAI ključ rotiran** (stari je bio izložen u chatu — koristi NOVI u Railway env-u)

---

## 1. Railway — API backend

### 1.1 Setup
1. [railway.app](https://railway.app) → sign in sa GitHub-om
2. **New Project → Deploy from GitHub repo** → `spiko-edu-kurs`

### 1.2 Service settings (**Settings**)
- **Root Directory**: `apps/api`
- **Build Command**: `bun install`
- **Start Command**: `bun run src/index.ts`
- **Watch Paths**: `apps/api/**` (ne re-deploy-uje na izmene u web/admin)
- **Region**: **Europe (Amsterdam)** — manja latencija ka Srbiji (Settings → General → Region)

### 1.3 Env vars (**Variables** tab)

Prekopiraj iz `apps/api/.env.example` i popuni pravim vrednostima:

```
PORT=4000
FRONTEND_ORIGIN=https://kurs.spikoedu.rs,https://admin.spikoedu.rs

# Baza (Supabase pooler — OBAVEZNO port 6543 / transaction mode za serverless)
DATABASE_URL=postgresql://postgres.xxx:xxx@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# Supabase Auth
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_JWKS_URL=https://xxx.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_SERVICE_KEY=...

# Bunny Stream (video)
BUNNY_API_KEY=...
BUNNY_LIBRARY_ID=...
BUNNY_CDN_HOSTNAME=vz-xxxxx.b-cdn.net
BUNNY_TOKEN_AUTH_KEY=...

# Bunny Storage (audio + slike)
BUNNY_STORAGE_ZONE_NAME=spiko-edu
BUNNY_STORAGE_PASSWORD=...
BUNNY_STORAGE_CDN_HOSTNAME=spiko-edu.b-cdn.net
BUNNY_STORAGE_REGION=de

# AI — Anthropic (dva modela)
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-haiku-4-5-20251001    # AI tutor chat (jeftin/brz)
ANTHROPIC_MODEL_SMART=claude-sonnet-5         # objašnjenje greške + generisanje kursa (tačniji)

# AI — OpenAI (word lookup prevod; ROTIRAN ključ!)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

**Napomene:**
- `GOOGLE_CLIENT_ID/SECRET`, `EMAIL_API_KEY/FROM` — nemaju default, ali app **ne pukne** (samo `console.warn`). Ostavi prazno (buduće faze).
- Bez `OPENAI_API_KEY` word lookup **radi** ali pada nazad na Claude (sporije/skuplje).
- `ANTHROPIC_MODEL_SMART` i `OPENAI_MODEL` imaju default u kodu, ali ih navedi eksplicitno radi jasnoće.

### 1.4 Custom domain
**Settings → Networking → Custom Domain** → `api.spikoedu.rs`. Railway daje CNAME target (npr. `xyz.up.railway.app`) — zapamti za DNS.

### 1.5 Deploy + smoke test
Railway auto-deploy na push. Kad prođe:
```bash
curl https://api.spikoedu.rs/health
# → {"ok":true}
```

- [ ] Railway service live
- [ ] Env vars unete (uklj. rotiran OpenAI)
- [ ] Region = Amsterdam
- [ ] `/health` vraća `{"ok":true}`

---

## 2. Vercel — Web (`kurs.spikoedu.rs`)

### 2.1 Setup
1. [vercel.com](https://vercel.com) → sign in sa GitHub-om
2. **Add New → Project** → `spiko-edu-kurs`
3. **Configure:**
   - **Project Name**: `spiko-edu-kurs-web`
   - **Framework Preset**: Next.js (auto)
   - **Root Directory**: `apps/web`
   - **Build Command**: default (`next build`)
   - **Install Command**: `npm install --legacy-peer-deps` *(monorepo workspace)*

### 2.2 Env vars
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=https://api.spikoedu.rs
```

### 2.3 Deploy + domain
**Deploy** → **Settings → Domains → Add** → `kurs.spikoedu.rs` (Vercel daje CNAME).

- [ ] Web deployed
- [ ] Env vars unete
- [ ] Domain dodat

---

## 3. Vercel — Admin (`admin.spikoedu.rs`)

Isti koraci kao Web, ali:
- **Project Name**: `spiko-edu-kurs-admin`
- **Root Directory**: `apps/admin`
- **Env vars**:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  NEXT_PUBLIC_API_URL=https://api.spikoedu.rs
  NEXT_PUBLIC_BUNNY_LIBRARY_ID=...
  ```
- **Custom domain**: `admin.spikoedu.rs`

- [ ] Admin deployed
- [ ] Env vars unete (uklj. `NEXT_PUBLIC_BUNNY_LIBRARY_ID`)
- [ ] Domain dodat

---

## 4. Loopia DNS

Loopia → **Domains** → `spikoedu.rs` → **DNS Editor**. Dodaj 3 zapisa:

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `api` | `<railway-cname-target>` | 3600 |
| CNAME | `kurs` | `cname.vercel-dns.com` | 3600 |
| CNAME | `admin` | `cname.vercel-dns.com` | 3600 |

**`@` A zapis za landing ostaje netaknut.**

Propagacija ~15 min (do 24h). Provera:
```bash
nslookup api.spikoedu.rs
nslookup kurs.spikoedu.rs
nslookup admin.spikoedu.rs
```

- [ ] 3 CNAME dodata
- [ ] `@` landing zapis netaknut
- [ ] Sva 3 poddomena razrešavaju (`nslookup`)

---

## 5. HTTPS (auto)

Kad DNS propagira, Vercel i Railway **automatski** izdaju Let's Encrypt sertifikate.

- [ ] `https://api.spikoedu.rs` ✓
- [ ] `https://kurs.spikoedu.rs` ✓
- [ ] `https://admin.spikoedu.rs` ✓

---

## 6. Supabase Auth — produkcioni URL-ovi

Supabase dashboard → **Authentication → URL Configuration**:
- **Site URL**: `https://kurs.spikoedu.rs`
- **Redirect URLs** (dodaj sve): `https://kurs.spikoedu.rs/**`, `https://admin.spikoedu.rs/**`

- [ ] Site URL postavljen
- [ ] Redirect URLs dodati

---

## 7. Bunny webhook

Bunny dashboard → **Stream library → Settings → Webhook URL**:
```
https://api.spikoedu.rs/webhooks/bunny
```
**Send test webhook** da potvrdiš. Posle: upload videa → toast za ~30s–2min.

- [ ] Webhook URL postavljen
- [ ] Test webhook prošao

---

## 8. Smoke test (incognito / drugi uređaj)

- [ ] `https://kurs.spikoedu.rs` → landing pun
- [ ] `/register` → nova registracija
- [ ] Login → dashboard, kursevi vidljivi
- [ ] `https://admin.spikoedu.rs` → login admin nalogom
- [ ] Otvori kurs → sitna izmena → save → toast „Sačuvano"
- [ ] `curl https://api.spikoedu.rs/health` → `{"ok":true}`
- [ ] Otvori lekciju sa videom → video igra (Bunny token/CDN ok)
- [ ] Highlight nemačke reči → prevod (OpenAI/Claude ok)

---

## 9. Ema demo (Faza B)

- [ ] Admin nalog za Emu kreiran (registruje se → `profiles.role='admin'` ručno u Supabase tabeli)
- [ ] Ema uđe u `admin.spikoedu.rs`
- [ ] Doda/izmeni lekciju uživo → sačuva
- [ ] Provera na student strani

---

## 🔧 Troubleshooting

**„Failed to fetch" u web/admin-u**
→ `NEXT_PUBLIC_API_URL` pogrešan, ili CORS. `FRONTEND_ORIGIN` (Railway) mora imati **oba** domena, comma-separated.

**Vercel „Invalid Configuration" (sertifikat)**
→ DNS još nije propagiran ili pogrešan CNAME. Sačekaj 30 min / proveri `nslookup`.

**Railway: „Cannot find module @spiko/shared"**
→ Workspace nije instaliran. **Install Command**: `cd ../.. && bun install`.

**Vercel build pada na peer deps**
→ **Install Command**: `npm install --legacy-peer-deps`.

**Supabase konekcije se troše / timeout**
→ `DATABASE_URL` mora biti port **6543** (transaction mode), ne 5432.

**Video ne igra u produkciji**
→ Proveri `BUNNY_CDN_HOSTNAME` i `BUNNY_TOKEN_AUTH_KEY`; token potpisivanje zavisi od tačnog hostname-a.

---

## 📌 Roadmap posle deploy-a (buduće faze / aneksi)

| Prioritet | Stavka | Detalj |
|---|---|---|
| **Uskoro** (pre javnog lansiranja) | **Email — Resend** | Brendiran transakcioni mejl (`spikoedu.rs`). Auth već radi preko Supabase, ali free limit ~3–4/sat → Resend pre pravih registracija. `EMAIL_*` env. |
| **Aneks** | **Zakazivanje časova** | Google Calendar (Emin) + Zoom link. Booking termina → sync → Zoom poziv. |
| **Kasnije** | **Raiffeisen naplata** | `https://api.spikoedu.rs/payments/callback` (HMAC). NIKAD Stripe. |
| **Kasnije** | **Whisper transkript** | OpenAI ključ već postoji. |
| **Faza „ko zna koja"** | **Google OAuth login** | `GOOGLE_*` env. |
| **Kad krene naplata** | **Staging Supabase** | Odvojiti dev od prod baze. |
