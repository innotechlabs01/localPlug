import Header from '@/app/components/layout/header'
import HeroSection from '@/app/components/hero/hero-section'
import StatsBar from '@/app/components/stats/stats-bar'
import AboutSection from '@/app/components/about/about-section'
import ExperiencesSection from '@/app/components/experiences/experiences-section'
import FeriaSection from '@/app/components/feria/feria-section'
import HowItWorksSection from '@/app/components/how-it-works/how-it-works-section'
import TestimonialsSection from '@/app/components/testimonials/testimonials-section'
import PricingSection from '@/app/components/pricing/pricing-section'
import CtaSection from '@/app/components/cta/cta-section'
import Footer from '@/app/components/layout/footer'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <StatsBar />
        <AboutSection />
        <ExperiencesSection />
        <FeriaSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
