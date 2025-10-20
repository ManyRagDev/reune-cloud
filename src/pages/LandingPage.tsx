import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Benefits } from "@/components/landing/Benefits";
import { Demo } from "@/components/landing/Demo";
import { Templates } from "@/components/landing/Templates";
import { Testimonials } from "@/components/landing/Testimonials";
import { Integrations } from "@/components/landing/Integrations";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { ThemeToggle } from "@/components/landing/ThemeToggle";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <Hero />
      <HowItWorks />
      <Benefits />
      <Demo />
      <Templates />
      <Testimonials />
      <Integrations />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
