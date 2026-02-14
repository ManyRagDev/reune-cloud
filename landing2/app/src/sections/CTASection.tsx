import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, Zap, Heart, MessageCircle } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const benefits = [
  { icon: Zap, text: 'Grátis para usar' },
  { icon: Heart, text: 'Sem anúncios chatos' },
  { icon: MessageCircle, text: 'Suporte humano' },
];

export default function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Content animation
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Decorative elements animation
      const decorElements = decorRef.current?.children;
      if (decorElements) {
        gsap.fromTo(
          decorElements,
          { opacity: 0, scale: 0.8 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: decorRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500" />
      
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-400/5 rounded-full blur-3xl" />
      </div>

      {/* Decorative floating elements */}
      <div ref={decorRef} className="absolute inset-0 pointer-events-none">
        <span className="absolute top-20 left-[10%] text-4xl animate-bounce" style={{ animationDuration: '3s' }}>🎉</span>
        <span className="absolute top-32 right-[15%] text-3xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>✨</span>
        <span className="absolute bottom-24 left-[20%] text-3xl animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }}>🍕</span>
        <span className="absolute bottom-32 right-[10%] text-4xl animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '0.3s' }}>🎈</span>
        <span className="absolute top-1/2 left-[5%] text-2xl animate-bounce" style={{ animationDuration: '5s', animationDelay: '0.8s' }}>🥂</span>
        <span className="absolute top-1/3 right-[8%] text-2xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1.2s' }}>🎵</span>
      </div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" />
          <span>Mais de 10.000 rolês organizados</span>
        </div>

        {/* Main headline */}
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Bora parar de <br className="hidden md:block" />
          <span className="relative inline-block">
            se estressar
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
              <path d="M2 10C50 4 100 4 150 6C200 8 250 4 298 2" stroke="white" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.5"/>
            </svg>
          </span>{' '}
          com evento?
        </h2>

        {/* Subheadline */}
        <p className="text-lg md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
          O ReUNE nasceu da necessidade real: organizar um churrasco 
          sem precisar de 47 planilhas e um grupo de WhatsApp que explode.
        </p>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-10">
          {benefits.map((benefit) => (
            <div
              key={benefit.text}
              className="flex items-center gap-2 text-white/90"
            >
              <benefit.icon className="w-5 h-5" />
              <span className="font-medium">{benefit.text}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-orange-600 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            Criar meu primeiro rolê
          </button>
          <button className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold text-lg border border-white/30 hover:bg-white/30 transition-all duration-300">
            Ver demonstração
          </button>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-white/70 text-sm">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-white/30 border-2 border-white/50 flex items-center justify-center text-xs font-bold"
              >
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <span>Junta-se a milhares de anfitriões felizes</span>
        </div>
      </div>
    </section>
  );
}
