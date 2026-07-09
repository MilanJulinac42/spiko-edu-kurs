'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

type Message = {
  id?: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}

type Conversation = {
  id: string
  lessonId: string | null
  createdAt: string | Date
}

type Props = {
  /** Ako je postavljen, chat ima kontekst lekcije i kreira/koristi per-lesson konverzaciju. */
  lessonId?: string
  /** Početne prompt sugestije (render-uju se kad nema poruka). */
  suggestions?: string[]
  /** Visina (default flex-1). Postavi na string ako želiš fiksno. */
  className?: string
  /** Da li prikazuje istoriju konverzacija (sidebar). Default true kad nema lessonId. */
  showHistory?: boolean
}

const GENERAL_SUGGESTIONS = [
  'Kako se konjugira glagol "haben" u prezentu?',
  'Šta znači "Wie geht\'s?" i kako da odgovorim?',
  'Daj mi 5 osnovnih nemačkih reči za jelo.',
  'Objasni razliku između "der", "die", "das".',
]

const LESSON_SUGGESTIONS = [
  'Objasni mi gramatiku iz ove lekcije.',
  'Daj mi još primera sa rečima iz lekcije.',
  'Šta znači ova reč u kontekstu lekcije?',
  'Pomozi mi sa vežbom — gde grešim?',
]

export function AiChat({ lessonId, suggestions, className, showHistory }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const showHist = showHistory ?? !lessonId
  const sugg = suggestions ?? (lessonId ? LESSON_SUGGESTIONS : GENERAL_SUGGESTIONS)

  const loadConversations = useCallback(async () => {
    const scope = lessonId ? undefined : 'general'
    const { data } = await api.ai.conversations.get({
      query: { scope, lessonId },
    })
    if (Array.isArray(data)) setConversations(data as Conversation[])
  }, [lessonId])

  useEffect(() => {
    if (showHist) loadConversations()
  }, [showHist, loadConversations])

  // Auto-scroll na novu poruku
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function openConversation(id: string) {
    const { data } = await api.ai.conversations({ id }).get()
    const r = data as { messages: Message[] } | null
    if (!r) return
    setConversationId(id)
    setMessages(r.messages)
  }

  function newChat() {
    setConversationId(null)
    setMessages([])
    setDraft('')
    setError(null)
  }

  async function send(text: string) {
    if (!text.trim() || loading) return
    setError(null)
    setLoading(true)

    const userMsg: Message = { role: 'user', content: text }
    const placeholder: Message = { role: 'assistant', content: '…', pending: true }
    setMessages((prev) => [...prev, userMsg, placeholder])
    setDraft('')

    try {
      const { data, error: apiError } = await api.ai.message.post({
        message: text,
        conversationId: conversationId ?? undefined,
        lessonId,
      })
      if (apiError) throw new Error(String(apiError.value ?? apiError.status))
      const r = data as { conversationId: string; reply: string }
      setConversationId(r.conversationId)
      setMessages((prev) => {
        const next = [...prev]
        // zameni placeholder pravim odgovorom
        const lastIdx = next.length - 1
        if (next[lastIdx]?.pending) {
          next[lastIdx] = { role: 'assistant', content: r.reply }
        }
        return next
      })
      // refresh history za sidebar
      if (showHist) loadConversations()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška')
      // ukloni placeholder
      setMessages((prev) => prev.filter((m) => !m.pending))
    } finally {
      setLoading(false)
    }
  }

  async function deleteConversation(id: string) {
    if (!confirm('Obrisati razgovor?')) return
    await api.ai.conversations({ id }).delete()
    if (conversationId === id) newChat()
    await loadConversations()
  }

  const isEmpty = messages.length === 0

  return (
    <div className={`flex h-full flex-col gap-4 lg:flex-row ${className ?? ''}`}>
      {/* Sidebar — istorija konverzacija */}
      {showHist && (
        <aside className="rounded-2xl border border-ink/5 bg-white p-3 shadow-soft lg:w-64 lg:shrink-0">
          <button
            onClick={newChat}
            className="w-full rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-ink shadow-soft transition-colors hover:bg-primary-dark hover:text-white"
          >
            + Novi razgovor
          </button>

          <div className="mt-3 max-h-48 overflow-y-auto lg:max-h-[60vh]">
            {conversations.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted">Još nema razgovora.</p>
            ) : (
              <ul className="space-y-1">
                {conversations.map((c) => {
                  const isActive = conversationId === c.id
                  return (
                    <li key={c.id} className="group flex items-center gap-1">
                      <button
                        onClick={() => openConversation(c.id)}
                        className={`flex-1 truncate rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                          isActive
                            ? 'bg-primary/10 font-semibold text-primary-dark'
                            : 'text-ink/70 hover:bg-surface'
                        }`}
                      >
                        💬 {formatDate(c.createdAt)}
                      </button>
                      <button
                        onClick={() => deleteConversation(c.id)}
                        className="px-1 text-xs text-muted opacity-0 group-hover:opacity-100 hover:text-red-500"
                        aria-label="Obriši razgovor"
                      >
                        ×
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>
      )}

      {/* Main chat */}
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-ink/5 bg-white shadow-soft">
        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ minHeight: 360 }}>
          {isEmpty ? (
            <div className="grid h-full place-items-center">
              <div className="text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-primary to-secondary text-3xl shadow-card">
                  ✨
                </div>
                <h2 className="mt-5 font-display text-xl font-bold text-ink sm:text-2xl">
                  {lessonId ? 'AI tutor — ova lekcija' : 'AI tutor'}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                  {lessonId
                    ? 'Pitaj sve oko ove lekcije — gramatika, vokabular, vežbe.'
                    : 'Tvoj lični tutor jezika. Prevodi, gramatika, primeri — sve u jednoj poruci.'}
                </p>

                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {sugg.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-xl border border-ink/10 bg-white px-4 py-3 text-left text-sm text-ink/85 transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, idx) => (
                <MessageRow key={m.id ?? idx} message={m} />
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(draft)
          }}
          className="border-t border-ink/5 p-3 sm:p-4"
        >
          {error && (
            <div className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(draft)
                }
              }}
              placeholder="Pitaj me bilo šta o jeziku…"
              rows={1}
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !draft.trim()}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-ink shadow-soft transition-all hover:bg-primary-dark hover:text-white disabled:opacity-50"
              aria-label="Pošalji"
            >
              {loading ? (
                <span className="block h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[0.7rem] text-muted">
            Enter pošalje · Shift+Enter za novi red
          </p>
        </form>
      </div>
    </div>
  )
}

function MessageRow({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
          isUser
            ? 'bg-secondary/15 text-secondary-dark'
            : 'bg-gradient-to-br from-primary to-secondary text-white'
        }`}
      >
        {isUser ? 'TI' : '✨'}
      </span>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
          isUser
            ? 'rounded-tr-sm bg-primary/10 text-ink/85'
            : 'rounded-tl-sm bg-surface text-ink/85'
        } ${message.pending ? 'animate-pulse' : ''}`}
      >
        {message.pending ? (
          <span className="inline-flex gap-1 align-middle">
            <span className="h-2 w-2 animate-pulse rounded-full bg-ink/40" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-ink/40" style={{ animationDelay: '0.2s' }} />
            <span className="h-2 w-2 animate-pulse rounded-full bg-ink/40" style={{ animationDelay: '0.4s' }} />
          </span>
        ) : (
          <FormattedContent text={message.content} />
        )}
      </div>
    </div>
  )
}

/**
 * Lagani markdown renderer za tutorske odgovore. Podržava:
 * naslove (#/##/###), GFM tabele, liste (- • ✅), numerisane liste,
 * horizontalnu liniju (---) i inline **bold** / *italic* / `code`.
 */
function FormattedContent({ text }: { text: string }) {
  return <div className="space-y-2">{renderBlocks(text)}</div>
}

const HR_RE = /^\s*([-*_])\1{2,}\s*$/
const HEADING_RE = /^(#{1,6})\s+(.*)$/
const BULLET_RE = /^\s*(?:[-*]|•|✅|❌|✔️?|☑️?)\s+(.*)$/u
const NUM_RE = /^\s*\d+[.)]\s+(.*)$/
const TABLE_SEP_RE = /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/

function isTableRow(line: string): boolean {
  return line.includes('|') && line.trim().length > 0
}

function splitCells(row: string): string[] {
  let s = row.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  return s.split('|').map((c) => c.trim())
}

function renderBlocks(text: string): React.ReactNode[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const out: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Prazan red — preskoči (razmak dolazi iz space-y-2)
    if (line.trim() === '') {
      i++
      continue
    }

    // Horizontalna linija
    if (HR_RE.test(line)) {
      out.push(<hr key={key++} className="my-1 border-ink/10" />)
      i++
      continue
    }

    // Naslov
    const h = line.match(HEADING_RE)
    if (h) {
      const level = h[1].length
      const cls =
        level <= 2
          ? 'font-display text-[0.95rem] font-bold text-ink'
          : 'font-display text-sm font-semibold text-ink/90'
      out.push(
        <p key={key++} className={`${cls} ${level <= 2 ? 'mt-1' : ''}`}>
          {renderInline(h[2], key)}
        </p>,
      )
      i++
      continue
    }

    // Tabela: red sa | praćen separatorom |---|---|
    if (isTableRow(line) && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1])) {
      const header = splitCells(line)
      const rows: string[][] = []
      i += 2
      while (i < lines.length && isTableRow(lines[i]) && lines[i].trim() !== '') {
        rows.push(splitCells(lines[i]))
        i++
      }
      out.push(
        <div key={key++} className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {header.map((c, ci) => (
                  <th
                    key={ci}
                    className="border border-ink/10 bg-surface px-2 py-1.5 text-left font-semibold text-ink"
                  >
                    {renderInline(c, key + ci)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} className="border border-ink/10 px-2 py-1.5 align-top text-ink/80">
                      {renderInline(c, key + ri * 100 + ci)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    // Numerisana lista
    if (NUM_RE.test(line)) {
      const items: string[] = []
      while (i < lines.length && NUM_RE.test(lines[i])) {
        items.push(lines[i].match(NUM_RE)![1])
        i++
      }
      out.push(
        <ol key={key++} className="ml-1 list-decimal space-y-1 pl-4 marker:text-muted">
          {items.map((it, ii) => (
            <li key={ii}>{renderInline(it, key + ii)}</li>
          ))}
        </ol>,
      )
      continue
    }

    // Lista sa tačkama (-, •, ✅…)
    if (BULLET_RE.test(line)) {
      const items: string[] = []
      while (i < lines.length && BULLET_RE.test(lines[i])) {
        items.push(lines[i].match(BULLET_RE)![1])
        i++
      }
      out.push(
        <ul key={key++} className="ml-1 list-disc space-y-1 pl-4 marker:text-primary">
          {items.map((it, ii) => (
            <li key={ii}>{renderInline(it, key + ii)}</li>
          ))}
        </ul>,
      )
      continue
    }

    // Paragraf — spoji uzastopne obične redove
    const para: string[] = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !HR_RE.test(lines[i]) &&
      !HEADING_RE.test(lines[i]) &&
      !BULLET_RE.test(lines[i]) &&
      !NUM_RE.test(lines[i]) &&
      !(isTableRow(lines[i]) && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1]))
    ) {
      para.push(lines[i])
      i++
    }
    out.push(
      <p key={key++} className="leading-relaxed">
        {para.map((pl, pi) => (
          <span key={pi}>
            {renderInline(pl, key * 1000 + pi)}
            {pi < para.length - 1 && <br />}
          </span>
        ))}
      </p>,
    )
  }

  return out
}

function renderInline(line: string, lineIdx: number): React.ReactNode[] {
  // Regex za **bold**, *italic*, `code`
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  const segments = line.split(pattern).filter((s) => s !== '')
  return segments.map((seg, i) => {
    const key = `${lineIdx}-${i}`
    if (seg.startsWith('**') && seg.endsWith('**')) {
      return (
        <strong key={key} className="font-semibold text-primary-dark">
          {seg.slice(2, -2)}
        </strong>
      )
    }
    if (seg.startsWith('*') && seg.endsWith('*')) {
      return (
        <em key={key} className="italic text-ink/70">
          {seg.slice(1, -1)}
        </em>
      )
    }
    if (seg.startsWith('`') && seg.endsWith('`')) {
      return (
        <code key={key} className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-xs text-secondary-dark">
          {seg.slice(1, -1)}
        </code>
      )
    }
    return <span key={key}>{seg}</span>
  })
}

function formatDate(iso: string | Date) {
  const d = new Date(iso)
  const now = Date.now()
  const diff = (now - d.getTime()) / 1000
  if (diff < 60) return 'sada'
  if (diff < 3600) return `pre ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `pre ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `pre ${Math.floor(diff / 86400)} d`
  return d.toLocaleDateString('sr-RS')
}
