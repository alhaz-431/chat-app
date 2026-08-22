import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { AppPreview } from '@/components/landing/AppPreview';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { TechStackSection } from '@/components/landing/TechStackSection';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 selection:bg-emerald-500 selection:text-white">
      <Navbar />
      <main>
        <HeroSection />
        <AppPreview />
        <FeaturesSection />
        <TechStackSection />
      </main>
      <Footer />
    </div>
  );
}