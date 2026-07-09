# Deploy Spiko Edu Kurs

Korak-po-korak deploy na **Vercel** (web + admin) + **Railway** (api) + **Loopia** (DNS).

Domeni:
- `kurs.spikoedu.rs` → student app + marketing (apps/web)
- `admin.spikoedu.rs` → admin panel (apps/admin)
- `api.spikoedu.rs` → backend (apps/api)

---

## 0. Pre nego što počneš

✅ GitHub repo sa code-om push-ovan
✅ `.env` fajlovi NE sme da budu u repo-u (već su u `.gitignore`)
✅ Supabase projekat live (Restore ako je pauziran)
✅ Bunny Stream + Storage zone aktivni

---

## 1. Railway — API backend

### 1.1 Setup

1. Idi na [railway.app](https://railway.app) → sign in sa GitHub-om
2. **New Project → Deploy from GitHub repo** → odaberi `spiko-edu-kurs`
3. Posle inicijalnog importa, Railway će probati da detektuje stack. **Pre prvog deploy-a podesi:**

### 1.2 Service settings

U Railway dashboard-u → odaberi service → **Settings**:

- **Root Directory**: `apps/api`
- **Build Command**: `bun install`
- **Start Command**: `bun run src/index.ts`
- **Watch Paths**: `apps/api/**` (ne re-deploy-uje na izmene u web/admin)

### 1.3 Env vars

U **Variables** tab-u, dodaj sve iz `apps/api/.env.example`:

```
PORT=4000
FRONTEND_ORIGIN=https://kurs.spikoedu.rs,https://admin.spikoedu.rs
DATABASE_URL=postgresql://postgres.xxx:xxx@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_JWKS_URL=https://xxx.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_SERVICE_KEY=...
BUNNY_API_KEY=...
BUNNY_LIBRARY_ID=...
BUNNY_CDN_HOSTNAME=vz-xxxxx.b-cdn.net
BUNNY_TOKEN_AUTH_KEY=...
BUNNY_STORAGE_ZONE_NAME=spiko-edu
BUNNY_STORAGE_PASSWORD=...
BUNNY_STORAGE_CDN_HOSTNAME=spiko-edu.b-cdn.net
BUNNY_STORAGE_REGION=de
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
```

**Bitno:** `DATABASE_URL` port stavi **6543** (transaction mode) ne 5432 — bolje multipleksira konekcije za serverless deploy.

### 1.4 Custom domain

U **Settings → Networking → Custom Domain** → unesi `api.spikoedu.rs`. Railway će ti dati CNAME target (npr. `xyz.up.railway.app`). Zapamti za DNS korak.

### 1.5 Region

Railway free/starter koristi US East default. Za **EU region** (manja latencija ka Srbiji):
- **Settings → General → Region → Europe (Amsterdam)**

### 1.6 Deploy

Push commit u GitHub → Railway auto-deploy. Pratiš log u Railway dashboard-u. **Smoke test:**

```bash
curl https://api.spikoedu.rs/health
# → {"ok":true}
```

---

## 2. Vercel — Web (kurs.spikoedu.rs)

### 2.1 Setup

1. [vercel.com](https://vercel.com) → sign in sa GitHub-om
2. **Add New → Project** → odaberi `spiko-edu-kurs` repo
3. **Configure Project:**
   - **Project Name**: `spiko-edu-kurs-web`
   - **Framework Preset**: Next.js (auto-detect)
   - **Root Directory**: `apps/web`
   - **Build Command**: ostavi default (`next build`)
   - **Install Command**: `npm install --legacy-peer-deps` *(monorepo workspace zahtev)*

### 2.2 Env vars

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=https://api.spikoedu.rs
```

### 2.3 Deploy + Custom domain

Klikni **Deploy**. Posle uspeha:
- **Settings → Domains → Add** → unesi `kurs.spikoedu.rs`
- Vercel će ti dati CNAME ili A zapis za DNS

---

## 3. Vercel — Admin (admin.spikoedu.rs)

Iste korake kao za Web, ali:

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

---

## 4. Loopia DNS

Login u Loopia → **Domains** → `spikoedu.rs` → **DNS Editor**.

Dodaj 3 zapisa:

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `api` | `<railway-cname-target>` | 3600 |
| CNAME | `kurs` | `cname.vercel-dns.com` | 3600 |
| CNAME | `admin` | `cname.vercel-dns.com` | 3600 |

**Postojeći `@` A zapis za landing ostaje netaknut** — ne diramo `spikoedu.rs` koji već koristi landing.

DNS propagacija: 5 min – 24h (obično ~15 min). Pratiš u terminalu:

```bash
nslookup api.spikoedu.rs
nslookup kurs.spikoedu.rs
nslookup admin.spikoedu.rs
```

Kad sva 3 vrate IP/CNAME → Vercel/Railway će automatski izdati Let's Encrypt sertifikate za HTTPS.

---

## 5. Bunny webhook

Bunny dashboard → **Stream library** → **Settings** → **Webhook URL**:

```
https://api.spikoedu.rs/webhooks/bunny
```

**Send test webhook** dugme da potvrdiš. Posle: kad upload-uješ video u admin-u, toast će iskočiti za ~30s–2min.

---

## 6. Smoke test posle deploy-a

Sa drugog uređaja / incognito tab-a:

1. `https://kurs.spikoedu.rs` → marketing landing pun
2. `https://kurs.spikoedu.rs/register` → registracija novog naloga
3. Login → dashboard se loada, kursevi vidljivi
4. `https://admin.spikoedu.rs` → login sa admin nalogom
5. Otvori postojeći kurs → uradi sitnu izmenu → save → toast "Sačuvano"
6. `curl https://api.spikoedu.rs/health` → `{"ok":true}`

---

## 7. Troubleshooting

### "Failed to fetch" u web/admin-u
→ API URL pogrešan u env vars, ili CORS odbacuje. Proveri:
- `NEXT_PUBLIC_API_URL` u Vercel-u
- `FRONTEND_ORIGIN` u Railway-u sadrži oba domena (web + admin), comma-separated

### Sertifikat se ne izdaje (Vercel "Invalid Configuration")
→ DNS još nije propagiran ili pogrešan CNAME target. Sačekaj 30 min ili proveri `nslookup`.

### Railway build pada na "Cannot find module @spiko/shared"
→ Workspace nije instaliran. Probaj **Install Command**: `cd ../.. && bun install`

### Vercel build pada na peer deps
→ Install Command treba: `npm install --legacy-peer-deps`

---

## 8. Posle deploy-a — checklist za ažuriranje

- [ ] Bunny webhook URL → produkcija
- [ ] Supabase Auth → **Site URL** = `https://kurs.spikoedu.rs`
- [ ] Supabase Auth → **Redirect URLs** dodaj sve 3 domena
- [ ] (Buduće) Raiffeisen payment callback URL → `https://api.spikoedu.rs/payments/callback`
- [ ] Admin nalog kreiran u produkciji (postavi `profiles.role = 'admin'` direktno u Supabase tabeli)
