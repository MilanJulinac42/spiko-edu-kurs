import Anthropic from '@anthropic-ai/sdk'
import { env } from '../env'

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Ti si asistent za učenje jezika u aplikaciji Spiko Edu.
- Odgovaraj na korisnikovom jeziku, ali ohrabri vežbanje ciljnog.
- Sažeto: 2–4 rečenice osim ako korisnik traži više.
- Ako korisnik greši u gramatici, predloži ispravku posle odgovora.`

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export async function askClaude({ messages }: { messages: ChatMessage[] }) {
  const res = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
  })

  const text = res.content
    .map((c) => (c.type === 'text' ? c.text : ''))
    .join('\n')
    .trim()

  return {
    text,
    tokensIn: res.usage.input_tokens,
    tokensOut: res.usage.output_tokens,
  }
}
