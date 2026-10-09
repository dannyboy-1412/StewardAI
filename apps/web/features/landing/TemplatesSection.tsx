import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { TEMPLATES } from '@docai/shared'
import type { TemplateId, TemplateMeta } from '@docai/shared'
import { SectionHeading } from './SectionHeading'

const SHOWCASE_TEMPLATES = TEMPLATES.filter((template) => template.id !== 'blank')

export function TemplatesSection() {
  return (
    <section id="templates" className="scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            align="left"
            eyebrow="Templates"
            title="Start from a structure that works"
            description="Pick a template, describe your topic, and let AI fill in the sections."
          />
          <Link
            href="/app/templates"
            className="inline-flex items-center gap-2 text-sm font-medium text-leaf hover:text-forest"
          >
            Browse all templates
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SHOWCASE_TEMPLATES.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TemplateCard({ template }: { template: TemplateMeta }) {
  return (
    <Link
      href="/app/templates"
      className="group block rounded-3xl border border-line bg-white p-4 transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(20,50,40,0.1)]"
    >
      <div aria-hidden className="aspect-[4/3] rounded-2xl bg-mist px-5 pt-5">
        <div className="h-full rounded-t-lg bg-white p-4 shadow-sm">
          <div className="h-2.5 w-3/4 rounded bg-forest/80" />
          <div className="mt-2 h-1.5 w-1/2 rounded bg-sage" />
          <div className="mt-4 space-y-1.5">
            <div className="h-1.5 rounded bg-line" />
            <div className="h-1.5 w-5/6 rounded bg-line" />
          </div>
          <TemplateAccent templateId={template.id} />
        </div>
      </div>
      <h3 className="mt-4 px-1 font-semibold text-forest group-hover:text-leaf">{template.name}</h3>
      <p className="mt-1 px-1 pb-1 text-sm text-muted">{template.description}</p>
    </Link>
  )
}

function TemplateAccent({ templateId }: { templateId: TemplateId }) {
  if (templateId === 'research-report') {
    return (
      <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded border border-line bg-line">
        {Array.from({ length: 6 }, (_, cell) => (
          <div key={cell} className={`h-3 ${cell < 3 ? 'bg-mist' : 'bg-white'}`} />
        ))}
      </div>
    )
  }

  if (templateId === 'case-study') {
    return (
      <div className="mt-4 flex h-10 items-end gap-1.5">
        {['h-4', 'h-7', 'h-5', 'h-10', 'h-8'].map((height, bar) => (
          <div key={bar} className={`w-full rounded-t bg-leaf/50 ${height}`} />
        ))}
      </div>
    )
  }

  if (templateId === 'project-proposal') {
    return (
      <div className="mt-4 space-y-2">
        {['w-3/4', 'w-2/3', 'w-4/5'].map((width) => (
          <div key={width} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-leaf/60" />
            <div className={`h-1.5 rounded bg-line ${width}`} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-1.5 border-l-2 border-leaf/50 pl-2">
      <div className="h-1.5 rounded bg-line" />
      <div className="h-1.5 w-4/5 rounded bg-line" />
      <div className="h-1.5 w-3/5 rounded bg-line" />
    </div>
  )
}
