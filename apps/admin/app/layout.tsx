import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Sora } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Spiko Admin',
  description: 'Spiko Edu — administracija sadržaja',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f7f8f5',
}

/**
 * FOUC-safe theme init — postavlja `data-theme` na html PRE prvog paint-a.
 * Bez ovoga bi se ekran prvo flash-ovao u svetloj temi pa onda prebacio na tamnu.
 * Mora biti inline script u <head> da se izvrši pre nego što ijedan CSS render-uje.
 */
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('spiko-admin-theme');
    var theme = stored;
    if (!theme) {
      theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="sr"
      className={`${jakarta.variable} ${sora.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body style={{ fontFamily: 'var(--font-body), ui-sans-serif, system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
