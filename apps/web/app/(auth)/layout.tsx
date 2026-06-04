import { Logo } from '@/components/Logo'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />

      <div className="relative z-10 px-5 pt-8 sm:px-8">
        <Link href="/" className="inline-block">
          <Logo invert href="/" />
        </Link>
      </div>

      <main className="relative z-10 grid min-h-[calc(100vh-5rem)] place-items-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-card sm:p-10">
          {children}
        </div>
      </main>
    </div>
  )
}
