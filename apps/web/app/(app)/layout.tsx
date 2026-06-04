import Link from 'next/link'
import { SignOutButton } from '@/components/SignOutButton'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #1f2630',
        }}
      >
        <Link href="/dashboard" style={{ fontWeight: 700, textDecoration: 'none' }}>
          Spiko Edu
        </Link>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/onboarding">Profil</Link>
          <SignOutButton />
        </nav>
      </header>
      {children}
    </>
  )
}
