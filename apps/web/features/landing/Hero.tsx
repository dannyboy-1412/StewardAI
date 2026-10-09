import Link from 'next/link'
import { Check, Play, Sparkles } from 'lucide-react'
import { Logo } from '@/components/Logo'

const HIGHLIGHTS = ['AI-powered writing', 'Citations & references', 'Beautiful doc templates']

const COMPARISON_ROWS = [
  { source: 'Solar', cost: 'Low', growth: '+24%' },
  { source: 'Wind', cost: 'Low', growth: '+13%' },
  { source: 'Hydro', cost: 'Medium', growth: '+2%' },
]

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-24 pt-12 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
      <div>
        <p className="mb-4 text-sm italic text-leaf">AI-first document editor</p>
        <h1 className="serif text-5xl leading-[1.05] tracking-tight text-forest md:text-6xl">
          Turn your ideas
          <br />
          into polished documents
        </h1>
        <p className="mt-6 max-w-md text-[17px] leading-7 text-muted">
          Create, edit and refine essays, reports, and projects with AI. Describe what you need
          and get a well-structured document in seconds — then fine-tune it like a regular doc.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white transition hover:bg-forest-2"
          >
            Get started for free
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-5 py-2.5 text-sm transition hover:bg-white"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full border border-forest/20">
              <Play className="h-2.5 w-2.5 fill-current" />
            </span>
            Watch demo
          </a>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-forest-2">
          {HIGHLIGHTS.map((highlight) => (
            <li key={highlight} className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-leaf" />
              {highlight}
            </li>
          ))}
        </ul>
      </div>

      <HeroDocumentPreview />
    </section>
  )
}

function HeroDocumentPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-sage via-transparent to-[#cfe0cf] blur-2xl"
      />
      <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white p-4 shadow-[0_30px_80px_rgba(20,50,40,0.12)]">
        <div className="mb-3 flex items-center justify-between px-2">
          <Logo className="text-sm" />
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#c7dcc6] text-[10px] font-semibold text-forest">
                AL
              </span>
              <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#f1dcc3] text-[10px] font-semibold text-forest">
                MK
              </span>
            </div>
            <span className="rounded-full bg-forest px-3 py-1 text-xs text-white">Share</span>
          </div>
        </div>
        <p className="rounded-2xl bg-mist px-4 py-3 text-sm text-forest-2">
          Create a 2,000-word report from these files on renewable energy. Include an
          introduction, key findings, a comparison table, and proper citations.
        </p>
        <div className="mt-4 px-2 pb-2">
          <h2 className="serif text-2xl text-forest">
            Renewable Energy and Its Impact on Sustainable Development
          </h2>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
            1. Introduction
          </p>
          <p className="mt-2 text-sm leading-6 text-forest-2">
            Renewable energy plays a critical role in addressing climate change and ensuring
            long-term sustainable development
            <span className="ml-0.5 text-xs font-semibold text-leaf">[1]</span>. This report
            explores the current state of renewable energy...
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
            2. Comparison of sources
          </p>
          <table className="mt-2 w-full border-collapse text-left text-xs text-forest-2">
            <thead>
              <tr className="bg-mist">
                <th className="border border-line px-2.5 py-1.5 font-semibold">Source</th>
                <th className="border border-line px-2.5 py-1.5 font-semibold">Cost</th>
                <th className="border border-line px-2.5 py-1.5 font-semibold">Growth</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.source}>
                  <td className="border border-line px-2.5 py-1.5">{row.source}</td>
                  <td className="border border-line px-2.5 py-1.5">{row.cost}</td>
                  <td className="border border-line px-2.5 py-1.5">{row.growth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-4 hidden items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5 text-xs text-forest-2 shadow-lg sm:flex">
        <Sparkles className="h-4 w-4 text-leaf" />
        AI added a comparison table and 4 citations
      </div>
    </div>
  )
}
