import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  Users,
  Calendar,
  DollarSign,
  MessageSquare,
  Shield,
  Smartphone,
  ChevronRight,
  Star,
  Menu // Added Menu icon
} from "lucide-react";
import { ThemeToggle } from "@/components/landing/ThemeToggle";
import { Footer } from "@/components/landing/Footer";
import reuneLogo from "@/assets/reune-logo.png";
import videoAtual from "@/assets/video_atual.mp4";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Added Sheet imports

export default function Index2() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const handlePricingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.success("Aproveite os recursos gratuitamente até 01/02/2026", {
      description: "Sem pegadinhas. Acesso liberado para você testar.",
      duration: 5000,
    });
  };

  const features = [
    {
      icon: Sparkles,
      title: "IA que Entende Você",
      description: "Descreva seu evento em linguagem natural e deixe a UNE.AI criar tudo: listas, quantidades e convidados.",
      gradient: "from-orange-500 to-amber-500"
    },
    {
      icon: Users,
      title: "Gestão de Convidados",
      description: "RSVP automático, lembretes inteligentes e acompanhamento de confirmações em tempo real.",
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      icon: DollarSign,
      title: "Divisão Inteligente",
      description: "Calcule custos por pessoa instantaneamente e compartilhe despesas de forma justa.",
      gradient: "from-green-500 to-teal-500"
    },
    {
      icon: Calendar,
      title: "Templates Prontos",
      description: "Churrasco, jantar, aniversário... Modelos pré-configurados para começar em segundos.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: MessageSquare,
      title: "Comunicação Fácil",
      description: "Envio automático de e-mail para notificar seus convidados.",
      gradient: "from-indigo-500 to-violet-500"
    },
    {
      icon: Smartphone,
      title: "Acesse de Qualquer Lugar",
      description: "PWA instalável funciona perfeitamente em qualquer dispositivo, online ou offline.",
      gradient: "from-rose-500 to-red-500"
    }
  ];

  const benefits = [
    "Planejamento em minutos, não horas",
    "Acompanhamento de confirmações em tempo real",
    "Divisão de custos sem complicação (em breve)",
    "Templates prontos para cada ocasião",
    "Funciona em qualquer celular ou computador",
  ];

  const stats = [
    { value: "< 30s", label: "Para Criar Evento" },
    { value: "100%", label: "Grátis até 2026" },
    { value: "24/7", label: "IA Disponível" },
    { value: "Zero", label: "Complexidade" }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden px-4 md:px-0">
      <ThemeToggle className="fixed top-4 right-4 z-50" />

      {/* Floating Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto z-40 px-6 py-3 rounded-full bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl flex items-center justify-between md:justify-start"
      >
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            ReUNE
          </span>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="hover:text-primary transition-colors">Recursos</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">Como Funciona</a>
            <a href="#pricing" onClick={handlePricingClick} className="hover:text-primary transition-colors cursor-pointer">Preços</a>
          </div>

          <Button size="sm" onClick={() => navigate("/app")} className="ml-4 hidden md:flex">
            Entrar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-6 mt-8">
                <a href="#features" className="text-lg font-medium hover:text-primary transition-colors">Recursos</a>
                <a href="#how-it-works" className="text-lg font-medium hover:text-primary transition-colors">Como Funciona</a>
                <a href="#pricing" onClick={handlePricingClick} className="text-lg font-medium hover:text-primary transition-colors cursor-pointer">Preços</a>
                <Button onClick={() => navigate("/app")} className="w-full mt-4">
                  Entrar no App
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.nav>

      {/* Hero Section - Ultra Modern */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-background to-cyan-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.1)_0%,transparent_50%)]" />

        {/* Floating Orbs - HIDDEN ON MOBILE */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="hidden md:block absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="hidden md:block absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        />

        <motion.div
          style={{ opacity, scale }}
          className="relative z-10 max-w-7xl mx-auto text-center space-y-8 px-4"
        >
          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-3"
          >
            <Badge className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Powered by UNE.AI - Inteligência Artificial
            </Badge>

            {/* Free Access Banner */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative w-full md:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 blur-xl opacity-30 animate-pulse" />
              <Badge className="relative px-6 py-3 text-sm md:text-base font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg whitespace-normal text-center h-auto">
                <Zap className="w-5 h-5 mr-2 inline animate-pulse shrink-0" />
                GRÁTIS até 01/02/2026 - Todos os Recursos!
              </Badge>
            </motion.div>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold tracking-tight break-words">
              Organize eventos{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent">
                  sem esforço
                </span>
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-orange-500/20 to-amber-500/20 -z-10 rounded-full blur-sm"
                  animate={{ scaleX: [0, 1] }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A primeira IA que planeja, convida e organiza seus eventos do zero.
              <span className="block mt-2 text-primary font-medium">
                Churrasco, jantar, festa — tudo em minutos.
              </span>
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto"
          >
            <Button
              size="lg"
              className="group h-14 w-full sm:w-auto px-8 text-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              onClick={() => navigate("/app")}
            >
              Comece agora
              <span className="hidden sm:inline ml-1">- Sem cartão</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 w-full sm:w-auto px-8 text-lg border-2"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver Demonstração
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 md:gap-8 pt-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center w-1/3 md:w-auto">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block" // Hide on mobile for better space
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-primary rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Demo Video Section */}
      <section id="demo" className="py-16 md:py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <Badge className="mb-4">
              <Zap className="w-4 h-4 mr-2" />
              Veja em Ação
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Do caos à organização{" "}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent block md:inline">
                em 30 segundos
              </span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-border/50 bg-gradient-to-br from-orange-500/10 to-cyan-500/10 p-2 max-w-3xl mx-auto"
          >
            <video
              src={videoAtual}
              className="w-full h-full object-cover rounded-2xl"
              controls
              poster="/placeholder.svg"
            >
              Seu navegador não suporta o elemento de vídeo.
            </video>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 md:py-32 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-20"
          >
            <Badge className="mb-4">
              <Star className="w-4 h-4 mr-2 fill-current" />
              Recursos Completos
            </Badge>
            <h2 className="text-3xl md:text-6xl font-bold mb-6">
              Tudo que você precisa.{" "}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent block mt-2">
                Nada que não precise.
              </span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Ferramentas poderosas que tornam a organização de eventos simples, rápida e eficiente.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative p-4 md:p-8 rounded-3xl bg-card border border-border/50 hover:border-border transition-all duration-300 hover:shadow-2xl"
              >
                {/* Icon with Gradient */}
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-6`}>
                  <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center">
                    <feature.icon className={`w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`} />
                  </div>
                </div>

                <h3 className="text-xl md:text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Effect */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10`} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Modern Timeline */}
      <section id="how-it-works" className="py-16 md:py-32 px-4 relative bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-20"
          >
            <Badge className="mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Simples e Rápido
            </Badge>
            <h2 className="text-3xl md:text-6xl font-bold mb-6">
              3 passos para seu{" "}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent block mt-2">
                evento perfeito
              </span>
            </h2>
          </motion.div>

          <div className="space-y-8 md:space-y-12">
            {[
              {
                step: "01",
                title: "Descreva em linguagem natural",
                description: "Diga 'Churrasco para 20 pessoas sábado às 14h' e a IA entende tudo: tipo de evento, quantidade, data e horário.",
                color: "from-orange-500 to-amber-500"
              },
              {
                step: "02",
                title: "IA cria tudo automaticamente",
                description: "Lista de compras, quantidades ideais, sugestões de cardápio e até divisão de tarefas — tudo gerado em segundos.",
                color: "from-cyan-500 to-blue-500"
              },
              {
                step: "03",
                title: "Convide e gerencie com um clique",
                description: "Envie convites para seus amigos, acompanhe confirmações em tempo real e divida custos automaticamente.",
                color: "from-green-500 to-teal-500"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8"
              >
                {/* Step Number */}
                <div className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl md:text-3xl font-bold text-white shadow-xl`}>
                  {item.step}
                </div>

                {/* Content */}
                <div className="flex-1 p-6 md:p-8 rounded-2xl bg-background border border-border/50 hover:border-border transition-all duration-300 hover:shadow-xl w-full">
                  <h3 className="text-xl md:text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>

                {/* Connecting Line - Desktop Only */}
                {index < 2 && (
                  <div className={`hidden md:block absolute left-10 top-24 w-0.5 h-12 bg-gradient-to-b ${item.color}`} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Checklist */}
      <section className="py-16 md:py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4">
                <Shield className="w-4 h-4 mr-2" />
                Benefícios Garantidos
              </Badge>
              <h2 className="text-3xl md:text-6xl font-bold mb-6">
                Menos estresse.{" "}
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent block mt-2">
                  Mais diversão.
                </span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Pare de perder tempo com planilhas e anotações. Deixe a IA fazer o trabalho pesado.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-base md:text-lg font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative mt-8 lg:mt-0"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-orange-500/20 to-cyan-500/20 p-4 md:p-8 backdrop-blur-xl border border-border/50">
                <div className="w-full h-full rounded-2xl bg-background/50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-4">
                      Minutos
                    </div>
                    <p className="text-xl md:text-2xl font-semibold mb-2">Não Horas</p>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Nossa promessa para você
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-background to-cyan-500/10" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          <h2 className="text-4xl md:text-7xl font-bold mb-8">
            Pronto para{" "}
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent block md:inline">
              revolucionar
            </span>
            <span className="block mt-2">seus eventos?</span>
          </h2>

          <p className="text-lg md:text-2xl text-muted-foreground mb-8 text-balance">
            Seja um dos primeiros a experimentar o futuro da organização de eventos.
          </p>

          {/* Free Access Highlight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-8 w-full md:w-auto"
          >
            <div className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/30">
              <p className="text-sm md:text-lg font-semibold text-green-600 dark:text-green-400">
                <Zap className="w-5 h-5 inline mr-2" />
                Acesso gratuito ilimitado até 01/01/2026
              </p>
            </div>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center w-full md:w-auto">
            <Button
              size="lg"
              className="h-16 w-full sm:w-auto px-12 text-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-2xl group"
              onClick={() => navigate("/app")}
            >
              Começar Gratuitamente
              <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            Sem cartão de crédito. Sem instalação. Comece agora
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
