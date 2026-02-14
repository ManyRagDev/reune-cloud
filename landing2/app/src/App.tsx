import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroSection from './sections/HeroSection';
import HowItWorks from './sections/HowItWorks';
import CTASection from './sections/CTASection';
import Footer from './sections/Footer';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize ScrollTrigger
    ScrollTrigger.refresh();
    
    return () => {
      // Cleanup all ScrollTriggers on unmount
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div ref={mainRef} className="relative">
      {/* Hero Section with 3-phase scroll animation */}
      <HeroSection />
      
      {/* How It Works Section */}
      <HowItWorks />
      
      {/* CTA Section */}
      <CTASection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
