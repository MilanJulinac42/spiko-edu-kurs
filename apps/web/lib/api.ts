import { treaty } from '@elysiajs/eden'
import type { App } from '@spiko/shared'
import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

export const api = treaty<App>(API_URL, {
  async headers() {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return token ? { authorization: `Bearer ${token}` } : {}
  },
})
