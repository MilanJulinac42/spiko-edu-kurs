import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
