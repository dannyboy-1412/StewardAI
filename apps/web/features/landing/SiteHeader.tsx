import Link from 'next/link'
import { Logo } from '@/components/Logo'

const NAV_LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#students', label: 'For Students' },
  { href: '#templates', label: 'Templates' },
  { href: '#pricing', label: 'Pricing' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-transparent bg-[#e8efe6]/85 backdrop-blur supports-[backdrop-filter]:bg-[#e8efe6]/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="PenPal AI home">
          <Logo className="text-[17px]" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-forest-2 md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-forest">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-forest-2 hover:text-forest">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-forest px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-forest-2"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}
