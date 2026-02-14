import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Users,
  Calendar,
  DollarSign,
  MessageSquare,
  Smartphone,
  ChevronDown,
  PartyPopper,
  ShoppingCart,
  Heart,
} from "lucide-react";
import { ThemeToggle } from "@/components/landing/ThemeToggle";
import { Footer } from "@/components/landing/Footer";

import event1 from "@/assets/event1.png";
import event2 from "@/assets/event2.png";
import mockupApp from "@/assets/reune-app-mockup.png";

gsap.registerPlugin(ScrollTrigger);

/* ──────────────────────────────────────────────
   HERO 3-PHASE DATA
────────────────────────────────────────────── */
const phases = [
  {
    id: "morning",
    emoji: "☀️",
    title: "Organize eventos sem esforço",
    subtitle:
      "A primeira IA que planeja, convida e organiza seus eventos do zero. Churrasco, jantar, festa — tudo em minutos.",
    overlay: "rgba(245, 158, 11, 0.25)", // amber
    image: event1,
    showCTA: true,
  },
  {
    id: "afternoon",
    emoji: "🎉",
    title: "Do caos à organização em 30 segundos",
    subtitle:
      "Lista de compras, quantidades ideais, sugestões de cardápio — tudo gerado automaticamente pela IA.",
    overlay: "rgba(236, 72, 153, 0.3)", // pink
    image: event2,
    showCTA: false,
  },
  {
    id: "sunset",
    emoji: "🚀",
    title: "Pronto para revolucionar seus eventos?",
    subtitle:
      "Seja um dos primeiros a experimentar o futuro da organização de eventos. Grátis até 01/02/2026.",
    overlay: "rgba(139, 92, 246, 0.35)", // purple
    image: mockupApp,
    showCTA: false,
  },
];

/* ──────────────────────────────────────────────
   HOW IT WORKS STEPS
────────────────────────────────────────────── */
const steps = [
  {
    icon: Calendar,
    title: "Descreva em linguagem natural",
    description:
      "Diga 'Churrasco para 20 pessoas sábado às 14h' e a IA entende tudo: tipo de evento, quantidade, data e horário.",
    color: "from-amber-400 to-orange-500",
  },
  {
    icon: Users,
    title: "IA cria tudo automaticamente",
    description:
      "Lista de compras, quantidades ideais, sugestões de cardápio e até divisão de tarefas — tudo gerado em segundos.",
    color: "from-orange-400 to-pink-500",
  },
  {
    icon: ShoppingCart,
    title: "Convide e gerencie com um clique",
    description:
      "Envie convites para seus amigos, acompanhe confirmações em tempo real e divida custos automaticamente.",
    color: "from-pink-400 to-purple-500",
  },
  {
    icon: PartyPopper,
    title: "Aproveite o momento",
    description:
      "Chega de estresse na hora do evento. Com tudo organizado, é só curtir com quem importa.",
    color: "from-purple-400 to-violet-500",
  },
];

/* ──────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────── */
export default function LandingV2() {
  const navigate = useNavigate();

  // Hero refs
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const heroStickyRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const overlaysRef = useRef<(HTMLDivElement | null)[]>([]);
  const contentsRef = useRef<(HTMLDivElement | null)[]>([]);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  // How It Works refs
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const howTitleRef = useRef<HTMLDivElement>(null);
  const stepCardsRef = useRef<(HTMLDivElement | null)[]>([]);

  // CTA refs
  const ctaSectionRef = useRef<HTMLDivElement>(null);
  const ctaContentRef = useRef<HTMLDivElement>(null);
  const ctaDecorRef = useRef<HTMLDivElement>(null);

  /* ══════════════════════════════════════════
     GSAP ANIMATIONS
  ══════════════════════════════════════════ */
  useEffect(() => {
    const ctx = gsap.context(() => {
      /* ────────────────────────────────────────
         HERO: 3-PHASE PINNED SCROLL
      ──────────────────────────────────────── */
      const section = heroSectionRef.current;
      const sticky = heroStickyRef.current;
      if (section && sticky) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.5,
            pin: sticky,
            pinSpacing: false,
            onUpdate: (self) => {
              if (scrollIndicatorRef.current) {
                gsap.to(scrollIndicatorRef.current, {
                  opacity: self.progress > 0.05 ? 0 : 1,
                  duration: 0.3,
                });
              }
            },
          },
        });

        // Phase 1: Morning (0% - 33%)
        tl.fromTo(
          imagesRef.current[0],
          { opacity: 1, scale: 1 },
          { opacity: 1, scale: 1.05, ease: "none" },
          0
        );
        tl.to(imagesRef.current[0], { opacity: 0, ease: "power2.inOut" }, 0.28);

        tl.fromTo(
          overlaysRef.current[0],
          { opacity: 1 },
          { opacity: 1, ease: "none" },
          0
        );
        tl.to(overlaysRef.current[0], { opacity: 0, ease: "power2.inOut" }, 0.28);

        tl.fromTo(
          contentsRef.current[0],
          { opacity: 1, y: 0 },
          { opacity: 1, y: 0, ease: "none" },
          0
        );
        tl.to(contentsRef.current[0], { opacity: 0, y: -30, ease: "power2.inOut" }, 0.22);

        // Phase 2: Afternoon (33% - 66%)
        tl.fromTo(
          imagesRef.current[1],
          { opacity: 0, scale: 1.05 },
          { opacity: 1, scale: 1, ease: "power2.inOut" },
          0.25
        );
        tl.to(imagesRef.current[1], { opacity: 0, ease: "power2.inOut" }, 0.61);

        tl.fromTo(
          overlaysRef.current[1],
          { opacity: 0 },
          { opacity: 1, ease: "power2.inOut" },
          0.28
        );
        tl.to(overlaysRef.current[1], { opacity: 0, ease: "power2.inOut" }, 0.61);

        tl.fromTo(
          contentsRef.current[1],
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, ease: "power2.out" },
          0.32
        );
        tl.to(contentsRef.current[1], { opacity: 0, y: -30, ease: "power2.inOut" }, 0.55);

        // Phase 3: Sunset (66% - 100%)
        tl.fromTo(
          imagesRef.current[2],
          { opacity: 0, scale: 1.05 },
          { opacity: 1, scale: 1, ease: "power2.inOut" },
          0.58
        );
        tl.to(imagesRef.current[2], { opacity: 1, scale: 1.02, ease: "none" }, 1);

        tl.fromTo(
          overlaysRef.current[2],
          { opacity: 0 },
          { opacity: 1, ease: "power2.inOut" },
          0.61
        );
        tl.to(overlaysRef.current[2], { opacity: 1, ease: "none" }, 1);

        tl.fromTo(
          contentsRef.current[2],
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, ease: "power2.out" },
          0.65
        );
        tl.to(contentsRef.current[2], { opacity: 1, y: 0, ease: "none" }, 1);
      }

      /* ────────────────────────────────────────
         HOW IT WORKS: STAGGER CARDS
      ──────────────────────────────────────── */
      if (howTitleRef.current) {
        gsap.fromTo(
          howTitleRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: howTitleRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      stepCardsRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: index * 0.15,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      /* ────────────────────────────────────────
         CTA SECTION
      ──────────────────────────────────────── */
      if (ctaContentRef.current) {
        gsap.fromTo(
          ctaContentRef.current,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ctaContentRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      if (ctaDecorRef.current) {
        const decorElements = ctaDecorRef.current.children;
        gsap.fromTo(
          decorElements,
          { opacity: 0, scale: 0.8 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: ctaDecorRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  /* ══════════════════════════════════════════
     JSX
  ══════════════════════════════════════════ */
  return (
    <div className="relative">
      <ThemeToggle className="fixed top-4 right-4 z-50" />

      {/* ═══════════════════════════════════════
          HERO: 3-PHASE PINNED SECTION
      ════════════════════════════════════════ */}
      <section
        ref={heroSectionRef}
        className="relative"
        style={{ height: "300vh" }}
      >
        <div
          ref={heroStickyRef}
          className="sticky top-0 h-screen overflow-hidden"
        >
          {/* Background Images */}
          {phases.map((phase, index) => (
            <img
              key={phase.id}
              ref={(el) => {
                imagesRef.current[index] = el;
              }}
              src={phase.image}
              alt={phase.title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: index === 0 ? 1 : 0, willChange: "opacity" }}
              loading={index === 0 ? "eager" : "lazy"}
            />
          ))}

          {/* Color Overlays */}
          {phases.map((phase, index) => (
            <div
              key={`overlay-${phase.id}`}
              ref={(el) => {
                overlaysRef.current[index] = el;
              }}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                backgroundColor: phase.overlay,
                opacity: index === 0 ? 1 : 0,
                willChange: "opacity",
              }}
            />
          ))}

          {/* Dark gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

          {/* Phase Contents */}
          {phases.map((phase, index) => (
            <div
              key={`content-${phase.id}`}
              ref={(el) => {
                contentsRef.current[index] = el;
              }}
              className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 md:px-8"
              style={{ opacity: index === 0 ? 1 : 0, willChange: "opacity, transform" }}
            >
              <div className="max-w-4xl mx-auto">
                {/* Emoji */}
                <div className="text-6xl md:text-8xl mb-6 animate-pulse">
                  {phase.emoji}
                </div>

                {/* Title */}
                <h1
                  className="text-4xl md:text-6xl lg:text-7xl font-heading font-extrabold text-white mb-6 leading-tight"
                  style={{
                    textShadow: "0 2px 20px rgba(0,0,0,0.3), 0 4px 40px rgba(0,0,0,0.2)",
                  }}
                >
                  {phase.title}
                </h1>

                {/* Subtitle */}
                <p
                  className="text-lg md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed"
                  style={{
                    textShadow: "0 2px 20px rgba(0,0,0,0.3), 0 4px 40px rgba(0,0,0,0.2)",
                  }}
                >
                  {phase.subtitle}
                </p>

                {/* CTA Buttons - Only on first phase */}
                {phase.showCTA && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                    <button
                      onClick={() => navigate("/app")}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      Comece agora - Sem cartão
                    </button>
                    <button
                      onClick={() =>
                        document
                          .getElementById("how-it-works")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="bg-white/15 backdrop-blur-md text-white px-8 py-4 rounded-full font-semibold text-lg border border-white/30 hover:bg-white/25 transition-all duration-300"
                    >
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
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/80"
            style={{ animation: "bounce 2s infinite ease-in-out" }}
          >
            <span className="text-sm font-medium mb-2">Role para explorar</span>
            <ChevronDown className="w-6 h-6" />
          </div>

          {/* Navigation dots */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10 hidden md:flex">
            {phases.map((_, index) => (
              <div
                key={`dot-${index}`}
                className="w-2 h-2 rounded-full bg-white/50 transition-all duration-300"
                style={{
                  backgroundColor: index === 0 ? "white" : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════ */}
      <section
        id="how-it-works"
        ref={howItWorksRef}
        className="relative py-24 md:py-32 bg-gradient-to-b from-white to-orange-50/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div ref={howTitleRef} className="text-center mb-16 md:mb-20">
            <Badge className="mb-4 bg-orange-100 text-orange-600 border-orange-200">
              Simples assim
            </Badge>
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-gray-900 mb-6">
              Como funciona o{" "}
              <span
                className="bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500 bg-clip-text text-transparent"
              >
                ReUNE
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Em 4 passos você organiza qualquer evento sem dor de cabeça. Sem
              planilha, sem grupo de WhatsApp com 500 mensagens.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {steps.map((step, index) => (
              <div
                key={step.title}
                ref={(el) => {
                  stepCardsRef.current[index] = el;
                }}
                className="group relative overflow-hidden bg-white rounded-3xl p-6 md:p-8 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              >
                {/* Decorative circle */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />

                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <step.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-heading font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>

                {/* Step indicator */}
                <div className="mt-6 flex items-center gap-2">
                  <span className="text-sm font-semibold text-orange-500">
                    Passo {index + 1}
                  </span>
                  <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${step.color} rounded-full`}
                      style={{ width: "100%" }}
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
            <Button
              onClick={() => navigate("/app")}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl"
            >
              <PartyPopper className="w-5 h-5 mr-2" />
              Começar agora - é grátis
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════ */}
      <section ref={ctaSectionRef} className="relative py-24 md:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-pink-500 to-purple-500" />

        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-400/5 rounded-full blur-3xl" />
        </div>

        {/* Decorative floating elements */}
        <div ref={ctaDecorRef} className="absolute inset-0 pointer-events-none">
          <span
            className="absolute top-20 left-[10%] text-4xl animate-bounce"
            style={{ animationDuration: "3s" }}
          >
            🎉
          </span>
          <span
            className="absolute top-32 right-[15%] text-3xl animate-bounce"
            style={{ animationDuration: "4s", animationDelay: "0.5s" }}
          >
            ✨
          </span>
          <span
            className="absolute bottom-24 left-[20%] text-3xl animate-bounce"
            style={{ animationDuration: "3.5s", animationDelay: "1s" }}
          >
            🍕
          </span>
          <span
            className="absolute bottom-32 right-[10%] text-4xl animate-bounce"
            style={{ animationDuration: "4.5s", animationDelay: "0.3s" }}
          >
            🎈
          </span>
          <span
            className="absolute top-1/2 left-[5%] text-2xl animate-bounce"
            style={{ animationDuration: "5s", animationDelay: "0.8s" }}
          >
            🥂
          </span>
          <span
            className="absolute top-1/3 right-[8%] text-2xl animate-bounce"
            style={{ animationDuration: "4s", animationDelay: "1.2s" }}
          >
            🎵
          </span>
        </div>

        {/* Content */}
        <div
          ref={ctaContentRef}
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          {/* Badge */}
          <Badge className="mb-8 bg-white/20 backdrop-blur-sm text-white border-white/30">
            <Sparkles className="w-4 h-4 mr-2" />
            Grátis até 01/02/2026
          </Badge>

          {/* Main headline */}
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-extrabold text-white mb-6 leading-tight">
            Bora parar de <br className="hidden md:block" />
            <span className="relative inline-block">
              se estressar
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
              >
                <path
                  d="M2 10C50 4 100 4 150 6C200 8 250 4 298 2"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeOpacity="0.5"
                />
              </svg>
            </span>{" "}
            com evento?
          </h2>

          {/* Subheadline */}
          <p className="text-lg md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            O ReUNE nasceu da necessidade real: organizar um churrasco sem
            precisar de 47 planilhas e um grupo de WhatsApp que explode.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-10">
            <div className="flex items-center gap-2 text-white/90">
              <Zap className="w-5 h-5" />
              <span className="font-medium">Grátis para usar</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Heart className="w-5 h-5" />
              <span className="font-medium">Sem anúncios chatos</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">Suporte humano</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/app")}
              className="bg-white text-orange-600 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 inline-flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Criar meu primeiro rolê
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold text-lg border border-white/30 hover:bg-white/30 transition-all duration-300"
            >
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
            <span>Junte-se a milhares de anfitriões felizes</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <Footer />
    </div>
  );
}
