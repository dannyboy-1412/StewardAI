import Link from 'next/link'
import { Logo } from '@/components/Logo'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#e8efe6] text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo className="text-[17px]" />
        <nav className="hidden items-center gap-8 text-sm text-forest-2 md:flex">
          <a href="#product">Product</a>
          <a href="#students">For Students</a>
          <a href="#templates">Templates</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/app" className="text-sm text-forest-2">
            Sign in
          </Link>
          <Link
            href="/app"
            className="rounded-full bg-forest px-4 py-2 text-sm font-medium text-white shadow-sm"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-8 lg:grid-cols-[1.05fr_1fr]">
        <section>
          <p className="mb-4 text-sm italic text-leaf">AI-first document editor</p>
          <h1 className="serif text-5xl leading-[1.05] tracking-tight text-forest md:text-6xl">
            Turn your ideas
            <br />
            into polished documents
          </h1>
          <p className="mt-6 max-w-md text-[17px] leading-7 text-muted">
            Create, edit and refine essays, reports, and projects with AI.
            Describe what you need and get a well-structured document in seconds
            — then fine-tune it like a regular doc.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/app"
              className="rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white"
            >
              Get started for free
            </Link>
            <a
              href="#product"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-5 py-2.5 text-sm"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full border border-forest/20">
                ▶
              </span>
              Watch demo
            </a>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-forest-2">
            <li>✓ AI-powered writing</li>
            <li>✓ Citations & references</li>
            <li>✓ Beautiful doc templates</li>
          </ul>
        </section>

        <section
          id="product"
          className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white p-4 shadow-[0_30px_80px_rgba(20,50,40,0.12)]"
        >
          <div className="mb-3 flex items-center justify-between px-2">
            <Logo className="text-sm" />
            <span className="rounded-full bg-forest px-3 py-1 text-xs text-white">Share</span>
          </div>
          <p className="rounded-2xl bg-mist px-4 py-3 text-sm text-forest-2">
            Create a 2,000-word report from these files on renewable energy.
            Include an introduction, key findings, a comparison table, and
            proper citations.
          </p>
          <div className="mt-4 px-2">
            <h2 className="serif text-2xl text-forest">
              Renewable Energy and Its Impact on Sustainable Development
            </h2>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
              1. Introduction
            </p>
            <p className="mt-2 text-sm leading-6 text-forest-2">
              Renewable energy plays a critical role in addressing climate change
              and ensuring long-term sustainable development. This report explores
              the current state of renewable energy...
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
