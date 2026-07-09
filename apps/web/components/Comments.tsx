'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

type Comment = {
  id: string
  body: string
  parentId: string | null
  userId: string
  authorName: string | null
  authorAvatar: string | null
  createdAt: string | Date
}

export function Comments({ lessonId }: { lessonId?: string }) {
  const { session } = useAuth()
  const [list, setList] = useState<Comment[]>([])
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    if (!lessonId) return
    const { data } = await api.comments.get({ query: { lessonId } })
    if (Array.isArray(data)) setList(data as Comment[])
  }

  useEffect(() => { load() }, [lessonId])

  async function post(body: string, parentId?: string) {
    if (!body.trim()) return
    setLoading(true)
    await api.comments.post({ body, lessonId, parentId })
    setLoading(false)
    if (parentId) {
      setReplyDraft('')
      setReplyTo(null)
    } else {
      setDraft('')
    }
    await load()
  }

  async function remove(id: string) {
    if (!confirm('Obrisati komentar?')) return
    await api.comments({ id }).delete()
    await load()
  }

  const topLevel = list.filter((c) => !c.parentId)
  const repliesFor = (id: string) => list.filter((c) => c.parentId === id)
  const currentUserId = session?.user.id

  return (
    <div>
      <h3 className="font-display text-xl font-bold text-ink">Komentari ({list.length})</h3>

      {session ? (
        <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Šta misliš o lekciji? Pitanje? Dodatni resurs?"
            className="w-full rounded-xl border border-ink/10 bg-white p-3 text-sm text-ink outline-none focus:border-primary"
          />
          <div className="mt-3 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => post(draft)}
              disabled={loading || !draft.trim()}
            >
              {loading ? 'Šaljem…' : 'Objavi'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-ink/10 bg-surface px-4 py-3 text-sm text-muted">
          Prijavi se da ostaviš komentar.
        </div>
      )}

      <div className="mt-6 space-y-5">
        {topLevel.length === 0 && (
          <p className="text-sm text-muted">Još nema komentara. Budi prva!</p>
        )}
        {topLevel.map((c) => (
          <div key={c.id}>
            <CommentItem
              c={c}
              isOwn={currentUserId === c.userId}
              onReply={() => {
                setReplyTo(replyTo === c.id ? null : c.id)
                setReplyDraft('')
              }}
              onDelete={() => remove(c.id)}
            />
            {replyTo === c.id && session && (
              <div className="ml-6 sm:ml-12 mt-2 rounded-2xl border border-ink/10 bg-white p-3">
                <textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  rows={2}
                  placeholder={`Odgovori ${c.authorName ?? 'korisniku'}…`}
                  className="w-full rounded-lg border border-ink/10 bg-white p-2.5 text-sm text-ink outline-none focus:border-primary"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setReplyTo(null)}>Otkaži</Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => post(replyDraft, c.id)}
                    disabled={loading || !replyDraft.trim()}
                  >
                    Odgovori
                  </Button>
                </div>
              </div>
            )}
            {repliesFor(c.id).length > 0 && (
              <div className="ml-6 sm:ml-12 mt-3 space-y-3">
                {repliesFor(c.id).map((r) => (
                  <CommentItem
                    key={r.id}
                    c={r}
                    isOwn={currentUserId === r.userId}
                    onDelete={() => remove(r.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CommentItem({
  c,
  isOwn,
  onReply,
  onDelete,
}: {
  c: Comment
  isOwn: boolean
  onReply?: () => void
  onDelete: () => void
}) {
  const initials = (c.authorName ?? '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <article className="flex gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
        {initials || '?'}
      </span>
      <div className="flex-1 rounded-2xl bg-white border border-ink/5 p-4 shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <div>
            <strong className="text-sm text-ink">{c.authorName ?? 'Korisnik'}</strong>
            <span className="ml-2 text-xs text-muted">{formatDate(c.createdAt)}</span>
          </div>
          {isOwn && (
            <button className="text-xs text-muted hover:text-red-500" onClick={onDelete}>
              Obriši
            </button>
          )}
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/85">{c.body}</p>
        {onReply && (
          <button className="mt-2 text-xs font-semibold text-primary-dark hover:underline" onClick={onReply}>
            ↩ Odgovori
          </button>
        )}
      </div>
    </article>
  )
}

function formatDate(iso: string | Date) {
  const d = new Date(iso)
  const now = Date.now()
  const diff = (now - d.getTime()) / 1000
  if (diff < 60) return 'pre par sekundi'
  if (diff < 3600) return `pre ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `pre ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `pre ${Math.floor(diff / 86400)} dana`
  return d.toLocaleDateString('sr-RS')
}
