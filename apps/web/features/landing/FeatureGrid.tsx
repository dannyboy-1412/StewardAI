import {
  Download,
  History,
  MousePointerClick,
  Quote,
  Sigma,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SectionHeading } from './SectionHeading'

type Feature = {
  icon: LucideIcon
  title: string
  body: string
}

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: 'AI that edits the document',
    body: 'No copy-pasting from a chat window. The AI writes, restructures, and formats right inside your doc.',
  },
  {
    icon: MousePointerClick,
    title: 'Prompt any selection',
    body: 'Highlight a sentence or section and ask to rewrite, shorten, change tone, or expand it.',
  },
  {
    icon: Quote,
    title: 'Citations & references',
    body: 'Inline citations stay linked to your sources so your bibliography is always in sync.',
  },
  {
    icon: Sigma,
    title: 'Tables, equations & images',
    body: 'Comparison tables, LaTeX equations, resizable images, and auto-generated tables of contents.',
  },
  {
    icon: Users,
    title: 'Real-time collaboration',
    body: 'Write together with classmates or teammates and see every change as it happens.',
  },
  {
    icon: History,
    title: 'Version history & undo',
    body: 'Every AI edit can be undone, and earlier versions are always one click away.',
  },
  {
    icon: Upload,
    title: 'Import your files',
    body: 'Bring in existing documents and notes, then let AI build on top of them.',
  },
  {
    icon: Download,
    title: 'Export anywhere',
    body: 'Download as Word (.docx), Markdown, HTML, or plain text with formatting intact.',
  },
]

export function FeatureGrid() {
  return (
    <section id="product" className="scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Product"
          title="A real document editor, with AI built in"
          description="Everything you expect from a word processor — page setup, fonts, find & replace, page breaks — plus an AI that can operate it for you."
        />
        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="bg-[#f6f9f5] p-7 transition hover:bg-white">
              <feature.icon className="h-5 w-5 text-leaf" />
              <h3 className="mt-5 font-semibold text-forest">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{feature.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
