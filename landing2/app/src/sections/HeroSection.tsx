import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Phase data
const phases = [
  {
    id: 'morning',
    emoji: '🌅',
    title: 'Café da manhã com quem importa',
    subtitle: 'Comece o dia reunindo pessoas. Organize desde o café até o happy hour',
    overlay: 'rgba(255, 200, 120, 0.25)',
    image: '/images/morning.png',
  },
  {
    id: 'afternoon',
    emoji: '☀️',
    title: 'Churrasco que se organiza sozinho',
    subtitle: 'Cada momento merece celebração. Da lista de compras aos convidados',
    overlay: 'rgba(255, 140, 60, 0.3)',
    image: '/images/afternoon.png',
  },
  {
    id: 'sunset',
    emoji: '🌇',
    title: 'Final de tarde sem estresse',
    subtitle: 'Do planejamento à execução. Organize tudo sem planilha',
    overlay: 'rgba(140, 80, 120, 0.35)',
    image: '/images/sunset.png',
  },
];

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const overlaysRef = useRef<(HTMLDivElement | null)[]>([]);
  const contentsRef = useRef<(HTMLDivElement | null)[]>([]);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;

    const ctx = gsap.context(() => {
      // Create main timeline for the pinned section
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          pin: sticky,
          pinSpacing: false,
          onUpdate: (self) => {
            // Hide scroll indicator as user starts scrolling
            if (scrollIndicatorRef.current) {
              const progress = self.progress;
              gsap.to(scrollIndicatorRef.current, {
                opacity: progress > 0.05 ? 0 : 1,
                duration: 0.3,
              });
            }
          },
        },
      });

      // Phase 1: Morning (0% - 33%)
      // Morning image starts visible, stays until 33%
      tl.fromTo(
        imagesRef.current[0],
        { opacity: 1, scale: 1 },
        { opacity: 1, scale: 1.05, ease: 'none' },
        0
      );
      tl.to(
        imagesRef.current[0],
        { opacity: 0, ease: 'power2.inOut' },
        0.28
      );

      // Morning overlay
      tl.fromTo(
        overlaysRef.current[0],
        { opacity: 1 },
        { opacity: 1, ease: 'none' },
        0
      );
      tl.to(
        overlaysRef.current[0],
        { opacity: 0, ease: 'power2.inOut' },
        0.28
      );

      // Morning content
      tl.fromTo(
        contentsRef.current[0],
        { opacity: 1, y: 0 },
        { opacity: 1, y: 0, ease: 'none' },
        0
      );
      tl.to(
        contentsRef.current[0],
        { opacity: 0, y: -30, ease: 'power2.inOut' },
        0.22
      );

      // Phase 2: Afternoon (33% - 66%)
      // Afternoon image fades in at 25%, stays until 66%
      tl.fromTo(
        imagesRef.current[1],
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1, ease: 'power2.inOut' },
        0.25
      );
      tl.to(
        imagesRef.current[1],
        { opacity: 0, ease: 'power2.inOut' },
        0.61
      );

      // Afternoon overlay
      tl.fromTo(
        overlaysRef.current[1],
        { opacity: 0 },
        { opacity: 1, ease: 'power2.inOut' },
        0.28
      );
      tl.to(
        overlaysRef.current[1],
        { opacity: 0, ease: 'power2.inOut' },
        0.61
      );

      // Afternoon content
      tl.fromTo(
        contentsRef.current[1],
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, ease: 'power2.out' },
        0.32
      );
      tl.to(
        contentsRef.current[1],
        { opacity: 0, y: -30, ease: 'power2.inOut' },
        0.55
      );

      // Phase 3: Sunset (66% - 100%)
      // Sunset image fades in at 58%, stays until end
      tl.fromTo(
        imagesRef.current[2],
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1, ease: 'power2.inOut' },
        0.58
      );
      tl.to(
        imagesRef.current[2],
        { opacity: 1, scale: 1.02, ease: 'none' },
        1
      );

      // Sunset overlay
      tl.fromTo(
        overlaysRef.current[2],
        { opacity: 0 },
        { opacity: 1, ease: 'power2.inOut' },
        0.61
      );
      tl.to(
        overlaysRef.current[2],
        { opacity: 1, ease: 'none' },
        1
      );

      // Sunset content
      tl.fromTo(
        contentsRef.current[2],
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, ease: 'power2.out' },
        0.65
      );
      tl.to(
        contentsRef.current[2],
        { opacity: 1, y: 0, ease: 'none' },
        1
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="hero-pinned relative">
      <div ref={stickyRef} className="hero-sticky">
        {/* Background Images */}
        {phases.map((phase, index) => (
          <img
            key={phase.id}
            ref={(el) => { imagesRef.current[index] = el; }}
            src={phase.image}
            alt={phase.title}
            className="bg-image"
            style={{ opacity: index === 0 ? 1 : 0 }}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ))}

        {/* Color Overlays */}
        {phases.map((phase, index) => (
          <div
            key={`overlay-${phase.id}`}
            ref={(el) => { overlaysRef.current[index] = el; }}
            className="overlay-layer"
            style={{
              backgroundColor: phase.overlay,
              opacity: index === 0 ? 1 : 0,
            }}
          />
        ))}

        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

        {/* Phase Contents */}
        {phases.map((phase, index) => (
          <div
            key={`content-${phase.id}`}
            ref={(el) => { contentsRef.current[index] = el; }}
            className="phase-content"
            style={{ opacity: index === 0 ? 1 : 0 }}
          >
            <div className="max-w-4xl mx-auto">
              {/* Emoji */}
              <div className="text-6xl md:text-8xl mb-6 animate-pulse">
                {phase.emoji}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-shadow mb-6 leading-tight">
                {phase.title}
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-2xl text-white/90 text-shadow max-w-2xl mx-auto leading-relaxed">
                {phase.subtitle}
              </p>

              {/* CTA Buttons - Only on first phase */}
              {index === 0 && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                  <button className="btn-primary text-lg">
                    Bora criar meu primeiro rolê
                  </button>
                  <button className="btn-secondary text-lg">
                    Ver como funciona
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Scroll Indicator */}
        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/80 scroll-indicator"
        >
          <span className="text-sm font-medium mb-2">Role para explorar</span>
          <ChevronDown className="w-6 h-6" />
        </div>

        {/* Navigation dots */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10 hidden md:flex">
          {phases.map((phase, index) => (
            <div
              key={`dot-${phase.id}`}
              className="w-2 h-2 rounded-full bg-white/50 transition-all duration-300"
              style={{
                backgroundColor: index === 0 ? 'white' : 'rgba(255,255,255,0.5)',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
