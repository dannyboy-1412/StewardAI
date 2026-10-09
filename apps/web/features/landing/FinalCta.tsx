import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function FinalCta() {
  return (
    <section className="px-6 pb-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-forest px-8 py-16 text-center text-white md:py-20">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-leaf/40 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#cfe9c8]/20 blur-3xl"
        />
        <h2 className="serif relative mx-auto max-w-2xl text-4xl leading-tight tracking-tight md:text-5xl">
          Your next document is one sentence away
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-[17px] leading-7 text-white/70">
          Describe it, and PenPal drafts it. Free to start — no credit card required.
        </p>
        <Link
          href="/signup"
          className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-forest transition hover:bg-mist"
        >
          Create a document
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
