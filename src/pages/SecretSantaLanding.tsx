import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, useScroll, useTransform } from "framer-motion";
import { Gift, Users, Link2, Shuffle, TreePine, Sparkles, ArrowRight, Loader2, ChevronRight, Zap } from "lucide-react";
import { Helmet } from "react-helmet";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/landing/ThemeToggle";
import { Footer } from "@/components/landing/Footer";

export default function SecretSantaLanding() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showWizard, setShowWizard] = useState(false);
  const [creating, setCreating] = useState(false);

  // Wizard state
  const [groupName, setGroupName] = useState("Amigo Secreto 2025");
  const [minValue, setMinValue] = useState("50");
  const [maxValue, setMaxValue] = useState("100");

  // Countdown to Christmas
  const christmasDate = new Date("2025-12-25T00:00:00").getTime();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = christmasDate - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [christmasDate]);

  const handleStartClick = () => {
    if (!user) {
      navigate("/app");
      return;
    }
    setShowWizard(true);
  };

  const handleCreateSecretSanta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const min = parseFloat(minValue);
    const max = parseFloat(maxValue);

    if (isNaN(min) || isNaN(max) || min < 0 || max < min) {
      toast.error("Valores inválidos. O valor mínimo deve ser menor que o máximo.");
      return;
    }

    setCreating(true);

    try {
      const { data: eventData, error: eventError } = await supabase
        .from("table_reune")
        .insert({
          title: groupName.trim() || "Amigo Secreto 2025",
          description: "Evento de Amigo Secreto criado pelo ReUNE",
          user_id: user.id,
          event_date: "2025-12-25",
          event_time: "20:00",
          tipo_evento: "confraternizacao",
          categoria_evento: "amigo_secreto",
          status: "draft",
          is_public: false,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      const { error: dynamicError } = await supabase.from("event_dynamics").insert({
        event_id: eventData.id,
        type: "secret_santa",
      });

      if (dynamicError) throw dynamicError;

      const { error: secretSantaError } = await supabase.from("event_secret_santa").insert({
        event_id: eventData.id,
        min_value: min,
        max_value: max,
        draw_date: "2025-12-20",
        has_drawn: false,
      });

      if (secretSantaError) throw secretSantaError;

      toast.success("Amigo Secreto criado! Agora adicione os participantes.");
      navigate(`/event/${eventData.id}/secret-santa/participants`);
    } catch (error) {
      console.error("Erro ao criar Amigo Secreto:", error);
      toast.error("Erro ao criar o Amigo Secreto. Tente novamente.");
    } finally {
      setCreating(false);
    }
  };

  const features = [
    {
      icon: Shuffle,
      title: "Sorteio Justo",
      description: "Algoritmo garante que ninguém tire a si mesmo e todos recebam alguém para presentear.",
      gradient: "from-red-500 to-pink-500"
    },
    {
      icon: Gift,
      title: "Lista de Desejos",
      description: "Cada participante adiciona sugestões de presente para facilitar a escolha.",
      gradient: "from-amber-500 to-yellow-500"
    },
    {
      icon: Link2,
      title: "Convite por Link",
      description: "Compartilhe no WhatsApp ou e-mail em 1 clique. Simples e rápido.",
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Helmet>
        <title>Amigo Secreto Online Grátis | ReUNE</title>
        <meta
          name="description"
          content="Organize seu amigo secreto online em 30 segundos. Sorteio automático, lista de desejos e compartilhamento fácil. Grátis!"
        />
        <meta name="keywords" content="amigo secreto, sorteio online, amigo oculto, natal 2025, amigo secreto gratis" />
      </Helmet>

      <ThemeToggle className="fixed top-4 right-4 z-50" />

      {/* Floating Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-full bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl"
      >
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent">
            ReUNE
          </span>
          <div className="hidden md:flex items-center gap-2 text-sm font-medium border-l border-border/50 pl-6">
            <TreePine className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">Amigo Secreto 2025</span>
          </div>
          <Button size="sm" onClick={() => navigate("/")} variant="ghost" className="ml-4">
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Voltar
          </Button>
        </div>
      </motion.nav>

      {/* Hero Section - Ultra Modern */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-12 overflow-hidden">
        {/* Animated Background Gradient - Festive */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-background to-green-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.1)_0%,transparent_50%)]" />

        {/* Floating Orbs - Christmas Colors */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"
        />

        <motion.div
          style={{ opacity, scale }}
          className="relative z-10 max-w-7xl mx-auto text-center space-y-8"
        >
          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-3"
          >
            <Badge className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-red-500/10 to-green-500/10 border-red-500/20 text-red-600 dark:text-red-400">
              <Gift className="w-4 h-4 mr-2 inline" />
              Sorteio Automático e Gratuito
            </Badge>

            {/* Free Access Banner */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 blur-xl opacity-30 animate-pulse" />
              <Badge className="relative px-6 py-3 text-base font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg">
                <Zap className="w-5 h-5 mr-2 inline animate-pulse" />
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
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              Organize seu{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-red-500 via-amber-500 to-green-600 bg-clip-text text-transparent">
                  Amigo Secreto
                </span>
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-red-500/20 to-green-500/20 -z-10 rounded-full blur-sm"
                  animate={{ scaleX: [0, 1] }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Sorteio aleatório e justo, lista de desejos integrada e convites instantâneos.
              <span className="block mt-2 text-primary font-medium">
                Sem complicação. Tudo em 30 segundos.
              </span>
            </p>
          </motion.div>

          {/* Countdown to Christmas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="pt-8"
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Contagem para o Natal</p>
            <div className="grid grid-cols-4 gap-4 md:gap-8 max-w-2xl mx-auto">
              {[
                { label: "Dias", value: timeLeft.days },
                { label: "Horas", value: timeLeft.hours },
                { label: "Min", value: timeLeft.minutes },
                { label: "Seg", value: timeLeft.seconds },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx, duration: 0.4 }}
                  className="flex flex-col items-center group"
                >
                  <div className="relative">
                    <div className={`absolute inset-0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl ${idx % 2 === 0 ? 'bg-red-600/20' : 'bg-green-600/20'
                      }`} />

                    <motion.div
                      key={item.value}
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.3 }}
                      className={`relative text-3xl md:text-5xl font-mono font-bold mb-2 px-4 py-2 md:px-6 md:py-3 rounded-2xl bg-gradient-to-br ${idx % 2 === 0 ? 'from-red-500/10 to-red-500/5' : 'from-green-500/10 to-green-500/5'
                        } border ${idx % 2 === 0 ? 'border-red-500/20' : 'border-green-500/20'
                        } backdrop-blur-sm group-hover:border-primary/50 transition-all duration-300`}
                    >
                      {idx === 3 && (
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-green-600/10 rounded-2xl animate-pulse" />
                      )}
                      <span className="relative z-10">{String(item.value).padStart(2, "0")}</span>
                    </motion.div>
                  </div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                    {item.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center gap-6 pt-8"
          >
            {!showWizard ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
                <Button
                  size="lg"
                  onClick={handleStartClick}
                  disabled={authLoading}
                  className="group h-14 px-8 text-lg bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 w-full"
                >
                  <Gift className="w-5 h-5 mr-2" />
                  Criar Meu Amigo Secreto
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
              >
                <div className="relative p-8 bg-card border-2 border-border rounded-3xl shadow-2xl space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-semibold">Configuração Rápida</h3>
                  </div>

                  <form onSubmit={handleCreateSecretSanta} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupName">Nome do Grupo</Label>
                      <Input
                        id="groupName"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Ex: Família Silva, Amigos do Trabalho"
                        className="h-11"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="minValue">Valor Mínimo (R$)</Label>
                        <Input
                          id="minValue"
                          type="number"
                          value={minValue}
                          onChange={(e) => setMinValue(e.target.value)}
                          placeholder="50"
                          min="0"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxValue">Valor Máximo (R$)</Label>
                        <Input
                          id="maxValue"
                          type="number"
                          value={maxValue}
                          onChange={(e) => setMaxValue(e.target.value)}
                          placeholder="100"
                          min="0"
                          className="h-11"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={creating}
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Shuffle className="w-5 h-5 mr-2" />
                          Criar e Adicionar Participantes
                        </>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setShowWizard(false)}
                      className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancelar
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            <p className="text-xs text-muted-foreground">
              100% gratuito • Sem anúncios • Seus dados protegidos
            </p>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
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

      {/* Features Grid */}
      <section id="features" className="py-32 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <Badge className="mb-4">
              <TreePine className="w-4 h-4 mr-2" />
              Como Funciona
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Simples.{" "}
              <span className="bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent">
                Rápido. Divertido.
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tudo que você precisa para organizar o amigo secreto perfeito.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative p-8 rounded-3xl bg-card border border-border/50 hover:border-border transition-all duration-300 hover:shadow-2xl"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-6`}>
                  <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center">
                    <feature.icon className={`w-8 h-8 bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`} />
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10`} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
