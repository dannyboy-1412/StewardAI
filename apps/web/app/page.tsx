import { FaqSection } from '@/features/landing/FaqSection'
import { FeatureGrid } from '@/features/landing/FeatureGrid'
import { FinalCta } from '@/features/landing/FinalCta'
import { Hero } from '@/features/landing/Hero'
import { HowItWorks } from '@/features/landing/HowItWorks'
import { PricingSection } from '@/features/landing/PricingSection'
import { SiteFooter } from '@/features/landing/SiteFooter'
import { SiteHeader } from '@/features/landing/SiteHeader'
import { StudentsSection } from '@/features/landing/StudentsSection'
import { TemplatesSection } from '@/features/landing/TemplatesSection'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#e8efe6] text-ink">
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <FeatureGrid />
        <StudentsSection />
        <TemplatesSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  )
}
