import Link from 'next/link'
import { Logo } from '@/components/Logo'

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '#product', label: 'Features' },
      { href: '#templates', label: 'Templates' },
      { href: '#pricing', label: 'Pricing' },
    ],
  },
  {
    title: 'Use cases',
    links: [
      { href: '#students', label: 'For Students' },
      { href: '/app/templates', label: 'Research reports' },
      { href: '/app/templates', label: 'Essays' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '#how-it-works', label: 'How it works' },
      { href: '#faq', label: 'FAQ' },
      { href: '/app', label: 'Sign in' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <Logo className="text-[17px]" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
            The AI-first document editor for essays, reports, and projects.
          </p>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold text-forest">{column.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-forest">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted">
          © {new Date().getFullYear()} PenPal AI. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
