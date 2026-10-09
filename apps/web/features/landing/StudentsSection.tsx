import Link from 'next/link'
import { ArrowRight, Check, GraduationCap, Sparkles } from 'lucide-react'
import { SectionHeading } from './SectionHeading'

const STUDENT_BENEFITS = [
  'Outline an essay from the assignment brief in seconds',
  'Turn lecture notes and readings into a structured report',
  'Keep citations and references consistent automatically',
  'Hand in a clean .docx your lecturer can open anywhere',
]

export function StudentsSection() {
  return (
    <section id="students" className="scroll-mt-20 bg-forest py-24 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[#cfe9c8]">
            <GraduationCap className="h-3.5 w-3.5" />
            For Students
          </span>
          <h2 className="serif mt-5 text-4xl leading-tight tracking-tight md:text-[44px]">
            Spend less time formatting, more time thinking
          </h2>
          <p className="mt-4 max-w-lg text-[17px] leading-7 text-white/70">
            PenPal handles the structure, layout, and references so you can focus on your
            argument. You stay in control of every word.
          </p>
          <ul className="mt-8 space-y-3">
            {STUDENT_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-[15px] text-white/90">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#cfe9c8] text-forest">
                  <Check className="h-3 w-3" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-forest transition hover:bg-mist"
          >
            Start your first essay
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <SelectionPromptPreview />
      </div>
    </section>
  )
}

function SelectionPromptPreview() {
  return (
    <div className="rounded-[28px] bg-white p-7 text-ink shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Essay · Draft 2</p>
      <h3 className="serif mt-2 text-2xl text-forest">The Ethics of Artificial Intelligence</h3>
      <p className="mt-4 text-sm leading-6 text-forest-2">
        As machine learning systems become embedded in everyday decisions,{' '}
        <mark className="rounded bg-[#cfe9c8] px-0.5 text-forest">
          questions about accountability and transparency become harder to ignore
        </mark>
        . Who is responsible when an automated system makes a harmful choice?
      </p>
      <div className="mt-5 rounded-2xl border border-line bg-mist p-3">
        <div className="flex items-center gap-2 text-sm text-forest-2">
          <Sparkles className="h-4 w-4 shrink-0 text-leaf" />
          Make this more academic and add a supporting citation
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {['Rewrite', 'Expand', 'Simplify', 'Add citation'].map((action) => (
            <span
              key={action}
              className="rounded-full border border-line bg-white px-3 py-1 text-xs text-forest-2"
            >
              {action}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-5 text-sm leading-6 text-forest-2">
        The increasing opacity of algorithmic decision-making poses significant challenges for
        establishing accountability
        <span className="ml-0.5 text-xs font-semibold text-leaf">[2]</span>.
      </p>
    </div>
  )
}
