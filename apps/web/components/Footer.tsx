import { Container } from '@/components/ui/Container'
import { Logo } from '@/components/Logo'

export function Footer() {
  return (
    <footer className="border-t border-ink/5 bg-ink text-white">
      <Container className="py-10">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Logo invert />
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} Spiko Edu. Sva prava zadržana.
          </p>
        </div>
      </Container>
    </footer>
  )
}
