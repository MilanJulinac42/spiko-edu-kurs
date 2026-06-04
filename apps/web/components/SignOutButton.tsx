'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function SignOutButton() {
  const router = useRouter()
  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut()
        router.replace('/login')
        router.refresh()
      }}
      style={{
        background: 'transparent',
        border: '1px solid #2a323d',
        color: '#f3f4f6',
        padding: '0.4rem 0.8rem',
        borderRadius: 6,
        cursor: 'pointer',
      }}
    >
      Odjava
    </button>
  )
}
