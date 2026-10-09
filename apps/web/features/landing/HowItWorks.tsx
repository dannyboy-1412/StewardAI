import { MessageSquareText, PenLine, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SectionHeading } from './SectionHeading'

type Step = {
  icon: LucideIcon
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    icon: MessageSquareText,
    title: 'Describe what you need',
    body: 'Tell PenPal the topic, length, and structure — or drop in your notes and source files.',
  },
  {
    icon: Sparkles,
    title: 'Get a structured draft',
    body: 'The AI writes directly into your document: headings, sections, tables, and citations included.',
  },
  {
    icon: PenLine,
    title: 'Refine it like a regular doc',
    body: 'Edit by hand, or highlight any passage and ask AI to rewrite, expand, or simplify it.',
  },
]

const DOCUMENT_TYPES = [
  'Essays',
  'Research reports',
  'Project proposals',
  'Case studies',
  'Lab reports',
  'Literature reviews',
  'Business plans',
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-white/60 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="How it works"
          title="From a blank page to a finished draft in three steps"
        />
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-3xl border border-line bg-white p-7 shadow-[0_10px_30px_rgba(20,50,40,0.05)]"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mist text-leaf">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="serif text-4xl text-sage">{index + 1}</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-forest">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-6 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted">
          <span className="font-medium text-forest-2">Made for</span>
          {DOCUMENT_TYPES.map((type) => (
            <span key={type} className="serif text-base italic text-forest-2/80">
              {type}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
