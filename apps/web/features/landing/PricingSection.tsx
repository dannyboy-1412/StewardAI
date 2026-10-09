import Link from 'next/link'
import { Check } from 'lucide-react'
import { SectionHeading } from './SectionHeading'

type Plan = {
  name: string
  price: string
  cadence: string
  summary: string
  features: string[]
  cta: string
  isHighlighted: boolean
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    summary: 'For trying PenPal on your next assignment.',
    features: ['Unlimited documents', '20 AI requests per day', 'All templates', 'Export to .docx'],
    cta: 'Get started',
    isHighlighted: false,
  },
  {
    name: 'Pro',
    price: '$8',
    cadence: 'per month',
    summary: 'For students and writers who draft every week.',
    features: [
      'Everything in Free',
      'Unlimited AI requests',
      'Citations from uploaded sources',
      'Full version history',
    ],
    cta: 'Start free trial',
    isHighlighted: true,
  },
  {
    name: 'Teams',
    price: 'Custom',
    cadence: 'for groups',
    summary: 'For classes, labs, and teams writing together.',
    features: [
      'Everything in Pro',
      'Real-time collaboration',
      'Shared templates',
      'Priority support',
    ],
    cta: 'Contact us',
    isHighlighted: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-white/60 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple plans that grow with you"
          description="Start free. Upgrade when PenPal becomes part of how you write."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  const cardTone = plan.isHighlighted
    ? 'border-forest bg-forest text-white shadow-[0_30px_80px_rgba(20,50,40,0.25)]'
    : 'border-line bg-white text-ink'
  const mutedTone = plan.isHighlighted ? 'text-white/70' : 'text-muted'
  const buttonTone = plan.isHighlighted
    ? 'bg-white text-forest hover:bg-mist'
    : 'bg-forest text-white hover:bg-forest-2'

  return (
    <article className={`relative flex flex-col rounded-3xl border p-8 ${cardTone}`}>
      {plan.isHighlighted ? (
        <span className="absolute -top-3 left-8 rounded-full bg-[#cfe9c8] px-3 py-1 text-xs font-semibold text-forest">
          Most popular
        </span>
      ) : null}
      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <p className={`mt-1 min-h-10 text-sm ${mutedTone}`}>{plan.summary}</p>
      <p className="mt-6 flex items-baseline gap-2">
        <span className="serif text-5xl tracking-tight">{plan.price}</span>
        <span className={`text-sm ${mutedTone}`}>{plan.cadence}</span>
      </p>
      <ul className="mt-8 flex-1 space-y-3 text-[15px]">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check
              className={`mt-0.5 h-4 w-4 shrink-0 ${plan.isHighlighted ? 'text-[#cfe9c8]' : 'text-leaf'}`}
            />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href="/signup"
        className={`mt-10 rounded-full px-5 py-2.5 text-center text-sm font-medium transition ${buttonTone}`}
      >
        {plan.cta}
      </Link>
    </article>
  )
}
