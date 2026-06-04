import { t } from 'elysia'

const EnvSchema = t.Object({
  PORT: t.String({ default: '4000' }),
  FRONTEND_ORIGIN: t.String(),

  DATABASE_URL: t.String(),

  SUPABASE_URL: t.String(),
  SUPABASE_JWKS_URL: t.String(),
  SUPABASE_JWT_AUDIENCE: t.String({ default: 'authenticated' }),

  BUNNY_API_KEY: t.String(),
  BUNNY_LIBRARY_ID: t.String(),
  BUNNY_CDN_HOSTNAME: t.String(),
  BUNNY_TOKEN_AUTH_KEY: t.String(),

  GOOGLE_CLIENT_ID: t.String(),
  GOOGLE_CLIENT_SECRET: t.String(),
  GOOGLE_REDIRECT_URI: t.String(),

  ANTHROPIC_API_KEY: t.String(),
  ANTHROPIC_MODEL: t.String({ default: 'claude-haiku-4-5-20251001' }),

  EMAIL_API_KEY: t.String(),
  EMAIL_FROM: t.String(),
})

function parse() {
  const raw = process.env as Record<string, string | undefined>
  const missing: string[] = []
  const out: Record<string, string> = {}
  for (const key of Object.keys(EnvSchema.properties)) {
    const v = raw[key]
    const prop = (EnvSchema.properties as Record<string, { default?: string }>)[key]
    if (v === undefined || v === '') {
      if (prop?.default !== undefined) out[key] = prop.default
      else missing.push(key)
    } else {
      out[key] = v
    }
  }
  if (missing.length) {
    console.warn(`[env] missing: ${missing.join(', ')}`)
  }
  return out as Record<keyof typeof EnvSchema.properties, string>
}

export const env = parse()
export const PORT = Number(env.PORT ?? 4000)
