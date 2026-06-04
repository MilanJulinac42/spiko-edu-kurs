import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth'
import './globals.css'

export const metadata: Metadata = {
  title: 'Spiko Edu',
  description: 'Učenje jezika kroz video lekcije, vežbe i konverzacije.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
