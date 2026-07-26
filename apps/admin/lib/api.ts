import { treaty } from '@elysiajs/eden'
import type { App } from '@spiko/shared'
import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

let handlingRevoked = false

export const api = treaty<App>(API_URL, {
  async headers() {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return token ? { authorization: `Bearer ${token}` } : {}
  },
  onResponse: [
    // Anti password-sharing: sesija izbačena na drugom uređaju → odjavi + poruka
    async (response) => {
      if (response.status !== 401 || handlingRevoked || typeof window === 'undefined') return
      try {
        const body = await response.clone().json()
        if (body?.error === 'session_revoked') {
          handlingRevoked = true
          await supabase.auth.signOut()
          window.location.href = '/login?reason=drugi-uredjaj'
        }
      } catch {
        /* nije JSON */
      }
    },
  ],
})
