import { createClient } from '@supabase/supabase-js'
import { env } from '../env'

/**
 * Privilegovani Supabase klijent — koristi SERVICE_KEY i zaobilazi RLS.
 * Koristi se SAMO za admin operacije (brisanje korisnika, listanje preko Auth API-ja).
 * NIKAD ne sme da se eksportuje na frontend.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
