import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { MetricsSection } from "@/components/metrics-section";
// import { AdCarousel } from "@/components/ad-carousel"
import { FeaturesSection } from "@/components/features-section";
import { CTASection } from "@/components/cta-section";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <MetricsSection />
      {/* <AdCarousel /> */}
      <FeaturesSection />
      <CTASection />
    </main>
  );
}
