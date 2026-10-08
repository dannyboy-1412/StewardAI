'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  FileText,
  FolderOpen,
  Home,
  LayoutTemplate,
  Plus,
  Clock,
  Users,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { api, type DocumentRecord } from '@/lib/api'

const nav = [
  { href: '/app', label: 'Home', icon: Home },
  { href: '/app/recent', label: 'Recent', icon: Clock },
  { href: '/app/shared', label: 'Shared with me', icon: Users },
  { href: '/app/templates', label: 'Templates', icon: LayoutTemplate },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [docs, setDocs] = useState<DocumentRecord[]>([])

  useEffect(() => {
    api.listDocuments().then(setDocs).catch(() => setDocs([]))
  }, [pathname])

  async function createBlank() {
    try {
      const doc = await api.createDocument({ templateId: 'blank' })
      router.push(`/d/${doc.id}`)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not create document')
    }
  }

  return (
    <div className="flex min-h-screen bg-[#eef4ec]">
      <aside className="flex w-64 flex-col border-r border-line bg-white">
        <div className="flex items-center justify-between px-4 py-4">
          <Logo />
        </div>
        <div className="px-3">
          <button
            onClick={createBlank}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-4 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> New document
          </button>
        </div>
        <nav className="mt-4 space-y-0.5 px-2">
          {nav.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  active ? 'bg-sage text-forest' : 'text-forest-2 hover:bg-mist'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-6 px-4 text-xs font-semibold uppercase tracking-wide text-muted">
          My documents
        </div>
        <div className="mt-2 flex-1 space-y-0.5 overflow-auto px-2">
          {docs.map((doc) => (
            <Link
              key={doc.id}
              href={`/d/${doc.id}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-forest-2 hover:bg-mist"
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">{doc.title}</span>
            </Link>
          ))}
        </div>
        <div className="m-3 rounded-2xl bg-mist p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-forest">
            <FolderOpen className="h-4 w-4" /> Upgrade to Pro
          </div>
          <p className="mt-1 text-xs text-muted">
            Get unlimited AI generations, advanced templates and more.
          </p>
          <button className="mt-3 w-full rounded-full bg-forest px-3 py-1.5 text-xs text-white">
            Upgrade
          </button>
        </div>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  )
}
