import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange/5 via-background to-cyan/5" />

      <div className="container max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-light text-orange text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Powered by UNE.AI</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Organize eventos <span className="bg-gradient-warm bg-clip-text ">sem caos</span> — com ajuda de IA.
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl">
              O ReUNE distribui tarefas, confirma presenças e estima custos automaticamente.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" onClick={() => navigate("/app")} className="group">
                Entrar no ReUNE
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" onClick={scrollToDemo}>
                Ver na prática (30s)
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 justify-center lg:justify-start text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-gold text-gold" />
                <span className="font-semibold text-foreground">4.9/5</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <span>+1.200 eventos organizados</span>
              <div className="h-4 w-px bg-border" />
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-primary" />
                IA UNE.AI
              </span>
            </div>

            {/* PWA Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-xs">
              📱 Instale no celular em 2 toques
            </div>
          </div>

          {/* Visual */}
          <div className="relative animate-scale-in">
            <div className="relative rounded-3xl overflow-hidden shadow-floating">
              <div className="aspect-[9/16] bg-gradient-cool rounded-3xl flex items-center justify-center">
                <div className="text-white/20 text-6xl">📱</div>
              </div>
            </div>

            {/* Floating AI badge */}
            <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-floating animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-primary rounded-full" />
        </div>
      </div>
    </section>
  );
};
