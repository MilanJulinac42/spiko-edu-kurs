import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../env'
import * as schema from './schema'

/**
 * Postgres pool — tunovan za Supabase pooler i Bun --hot reload.
 *
 * Problem: Supabase free tier pooler ima `pool_size: 15` u session mode-u
 * (port 5432). Svaki Bun --hot reload pravi novu `postgres()` instancu, a
 * stare konekcije ostaju otvorene dok ih Supabase ne prekine (~10 min).
 * Posle nekoliko save-ova → 15/15 zauzeto → EMAXCONNSESSION.
 *
 * Rešenja:
 *  - max: 3 (umesto 10) — manje konekcija po instanci, više prostora za HMR overlap
 *  - idle_timeout: 20s — vraća idle konekcije pool-u brzo
 *  - max_lifetime: 60s — periodično rotira konekcije
 *  - connect_timeout: 10s — ne visi kad je Supabase degradiran
 *
 * Pravi fix: DATABASE_URL na port 6543 (transaction mode) — pgbouncer
 * multipleksira konekcije po transakciji, bez session sticky-ja.
 */
const queryClient = postgres(env.DATABASE_URL, {
  max: 3,
  prepare: false,
  idle_timeout: 20,
  max_lifetime: 60,
  connect_timeout: 10,
})

export const db = drizzle(queryClient, { schema })
export type DB = typeof db
