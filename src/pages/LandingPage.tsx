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

      {/* Main content with improved spacing and visual hierarchy */}
      <Hero />

      {/* Subtle divider for visual breathing */}
      <div className="container max-w-7xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-8" />
      </div>

      <HowItWorks />

      <div className="container max-w-7xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-8" />
      </div>

      <Benefits />

      {/* Demo section - strategic placement after benefits */}
      <div className="py-8" />
      <Demo />

      <div className="container max-w-7xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-8" />
      </div>

      <Templates />
      {/* <Testimonials /> */}

      <div className="py-8" />
      <Integrations />
      {/* <FAQ /> */}

      {/* Final CTA gets extra spacing for emphasis */}
      <div className="py-12" />
      <FinalCTA />

      <Footer />
    </div>
  );
};

export default LandingPage;
