import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { AuthProvider } from '@/lib/auth'
import { NavigationProgress } from '@/components/NavigationProgress'
import './globals.css'

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Spiko Edu — moj kurs',
  description: 'Tvoj kurs jezika — video lekcije, vežbe i AI tutor uz svaku lekciju.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0e1622',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" className={`${poppins.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-ink">
        <NavigationProgress />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
