import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Calendar, Users, ShoppingCart, PartyPopper } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: Calendar,
    title: 'Crie seu evento',
    description: 'Escolha a data, horário e tipo de rolê. Café da manhã, churrasco ou happy hour - você decide!',
    color: 'from-amber-400 to-orange-500',
  },
  {
    icon: Users,
    title: 'Chame a galera',
    description: 'Convide seus amigos com um link simples. Eles confirmam presença e você vê tudo em tempo real.',
    color: 'from-orange-400 to-red-500',
  },
  {
    icon: ShoppingCart,
    title: 'Divida as tarefas',
    description: 'Lista de compras automática, divisão de custos e quem leva o quê. Ninguém fica sobrecarregado.',
    color: 'from-red-400 to-pink-500',
  },
  {
    icon: PartyPopper,
    title: 'Aproveite o momento',
    description: 'Chega de estresse na hora do evento. Com tudo organizado, é só curtir com quem importa.',
    color: 'from-pink-400 to-purple-500',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Cards stagger animation
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: index * 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 bg-gradient-to-b from-white to-orange-50/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={titleRef} className="text-center mb-16 md:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-orange-100 text-orange-600 text-sm font-semibold mb-4">
            Simples assim
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            Como funciona o <span className="gradient-text">ReUNE</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Em 4 passos você organiza qualquer evento sem dor de cabeça. 
            Sem planilha, sem grupo de WhatsApp com 500 mensagens.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {steps.map((step, index) => (
            <div
              key={step.title}
              ref={(el) => { cardsRef.current[index] = el; }}
              className="feature-card group relative overflow-hidden"
            >
              {/* Step number */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
              
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>

              {/* Step indicator */}
              <div className="mt-6 flex items-center gap-2">
                <span className="text-sm font-semibold text-orange-500">
                  Passo {index + 1}
                </span>
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${step.color} rounded-full`}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 mb-4">
            Pronto para organizar seu próximo rolê?
          </p>
          <button className="btn-primary inline-flex items-center gap-2">
            <PartyPopper className="w-5 h-5" />
            Começar agora - é grátis
          </button>
        </div>
      </div>
    </section>
  );
}
