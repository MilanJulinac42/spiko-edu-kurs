'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CEFR } from '@spiko/shared'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { AvatarUpload } from '@/components/AvatarUpload'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

type Me = {
  user: { userId: string; email: string | null; role: string }
  profile: {
    id: string
    fullName: string | null
    avatarUrl: string | null
    nativeLanguage: string | null
    targetLevel: string | null
    goal: string | null
    timezone: string | null
  } | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)

  useEffect(() => {
    api.me.get().then(({ data }) => setMe(data as Me))
  }, [])

  if (!me) {
    return (
      <Container className="py-16">
        <p className="text-muted">Učitavanje…</p>
      </Container>
    )
  }

  return (
    <Container className="py-12">
      <h1 className="font-display text-4xl font-extrabold text-ink">Podešavanja</h1>
      <p className="mt-2 text-muted">Upravljaj svojim profilom, lozinkom i nalogom.</p>

      <div className="mt-10 space-y-8">
        <ProfileSection me={me} onSaved={() => api.me.get().then(({ data }) => setMe(data as Me))} />
        <AccountSection email={me.user.email ?? ''} />
        <DangerZone
          onDeleted={async () => {
            await supabase.auth.signOut()
            router.replace('/login')
            router.refresh()
          }}
        />
      </div>
    </Container>
  )
}

/* ───── Profile ───── */

function ProfileSection({ me, onSaved }: { me: Me; onSaved: () => void }) {
  const [fullName, setFullName] = useState(me.profile?.fullName ?? '')
  const [avatarUrl, setAvatarUrl] = useState(me.profile?.avatarUrl ?? '')
  const [nativeLanguage, setNativeLanguage] = useState(me.profile?.nativeLanguage ?? 'sr')
  const [targetLevel, setTargetLevel] = useState(me.profile?.targetLevel ?? 'A1')
  const [goal, setGoal] = useState(me.profile?.goal ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      // avatarUrl se ne šalje ovde — AvatarUpload ima sopstvene /me/avatar
      // endpoint-e (POST za upload, DELETE za uklanjanje), trenutna vrednost
      // u state-u je samo za preview.
      const { error } = await api.me.profile.patch({
        fullName,
        nativeLanguage,
        targetLevel,
        goal,
      })
      if (error) throw new Error(String(error.value ?? error.status))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setSaving(false)
    }
  }

  const initials = (fullName || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Card title="Profil" desc="Tvoji osnovni podaci — vidiš ih ti i mi.">
      <AvatarUpload
        value={avatarUrl || null}
        initials={initials}
        onChange={(url) => {
          setAvatarUrl(url ?? '')
          onSaved()
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ime i prezime">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Field label="Maternji jezik (ISO)">
          <input
            value={nativeLanguage}
            onChange={(e) => setNativeLanguage(e.target.value)}
            placeholder="sr"
            className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Field label="Ciljni CEFR nivo">
          <select
            value={targetLevel}
            onChange={(e) => setTargetLevel(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            {CEFR.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Tvoj cilj">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={3}
          placeholder="npr. Hoću da pričam tečno za putovanje u Nemačku…"
          className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </Field>

      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm font-semibold text-primary-dark">✓ Sačuvano</span>}
        <Button variant="primary" size="md" onClick={save} disabled={saving}>
          {saving ? 'Snimam…' : 'Sačuvaj'}
        </Button>
      </div>
    </Card>
  )
}

/* ───── Account (email + password) ───── */

function AccountSection({ email }: { email: string }) {
  const [newEmail, setNewEmail] = useState(email)
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailMsg, setEmailMsg] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [savingPass, setSavingPass] = useState(false)
  const [passMsg, setPassMsg] = useState<string | null>(null)
  const [passError, setPassError] = useState<string | null>(null)

  async function updateEmail() {
    setEmailError(null)
    setEmailMsg(null)
    if (!newEmail || newEmail === email) return
    setSavingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      setEmailMsg('Potvrdi promenu klikom na link u mejlu (pošaljen je i na staru i na novu adresu).')
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setSavingEmail(false)
    }
  }

  async function updatePassword() {
    setPassError(null)
    setPassMsg(null)
    if (newPassword !== confirm) {
      setPassError('Lozinke se ne poklapaju.')
      return
    }
    if (newPassword.length < 8) {
      setPassError('Lozinka mora imati najmanje 8 karaktera.')
      return
    }
    setSavingPass(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPassMsg('Lozinka promenjena.')
      setNewPassword('')
      setConfirm('')
    } catch (e) {
      setPassError(e instanceof Error ? e.message : 'Greška')
    } finally {
      setSavingPass(false)
    }
  }

  return (
    <Card title="Nalog" desc="Promena email-a i lozinke.">
      <div className="space-y-4">
        <div>
          <Field label="Email">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </Field>
          {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
          {emailMsg && <p className="mt-1 text-xs text-primary-dark">✓ {emailMsg}</p>}
          <div className="mt-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={updateEmail} disabled={savingEmail || newEmail === email}>
              {savingEmail ? 'Šaljem…' : 'Promeni email'}
            </Button>
          </div>
        </div>

        <hr className="border-ink/5" />

        <div>
          <p className="text-sm font-bold text-ink">Promena lozinke</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Nova lozinka">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </Field>
            <Field label="Ponovi novu lozinku">
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </Field>
          </div>
          {passError && <p className="mt-1 text-xs text-red-600">{passError}</p>}
          {passMsg && <p className="mt-1 text-xs text-primary-dark">✓ {passMsg}</p>}
          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={updatePassword}
              disabled={savingPass || !newPassword || !confirm}
            >
              {savingPass ? 'Snimam…' : 'Promeni lozinku'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ───── Danger zone ───── */

function DangerZone({ onDeleted }: { onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [phrase, setPhrase] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const PHRASE = 'OBRIŠI NALOG'

  async function deleteAccount() {
    if (phrase !== PHRASE) {
      setError(`Mora tačno da napišeš: ${PHRASE}`)
      return
    }
    setDeleting(true)
    setError(null)
    try {
      const { error } = await api.me.delete()
      if (error) throw new Error(String(error.value ?? error.status))
      await onDeleted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-3xl border-2 border-red-200 bg-red-50/30 p-6 sm:p-8">
      <h2 className="font-display text-xl font-bold text-red-700">Opasna zona</h2>
      <p className="mt-2 text-sm text-muted">
        Brisanje naloga je <strong>trajno</strong> — gubiš sav napredak, komentare,
        beleške i bookmarka. Ne može da se vrati.
      </p>

      {!confirming ? (
        <div className="mt-5">
          <Button
            variant="outline"
            size="md"
            className="border-red-400 text-red-700 hover:border-red-500 hover:text-red-700"
            onClick={() => setConfirming(true)}
          >
            Obriši nalog
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-bold text-red-700">
            Napiši <code className="rounded bg-white px-2 py-0.5">{PHRASE}</code> da potvrdiš:
          </p>
          <input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder={PHRASE}
            className="w-full rounded-xl border-2 border-red-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-red-500"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-red-700 disabled:opacity-60"
              onClick={deleteAccount}
              disabled={deleting || phrase !== PHRASE}
            >
              {deleting ? 'Brišem…' : 'Trajno obriši nalog'}
            </button>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setConfirming(false)
                setPhrase('')
                setError(null)
              }}
            >
              Otkaži
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ───── primitives ───── */

function Card({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft sm:p-8">
      <header>
        <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
        {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      </header>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink/80">{label}</span>
      {children}
    </label>
  )
}
