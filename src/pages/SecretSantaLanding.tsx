import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, useScroll, useTransform } from "framer-motion";
import { Gift, Users, Link2, Shuffle, TreePine, Sparkles, ArrowRight, Loader2, Zap, Sun, Moon } from "lucide-react";
import { Helmet } from "react-helmet";
import { toast } from "sonner";
import { Footer } from "@/components/landing/Footer";
import { NBLight, NBDark, NBPalette, nb } from "@/lib/neobrutalism";

export default function SecretSantaLanding() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  /* ── Dark mode state ──────────────────────── */
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("reune-v3-theme");
      if (saved) return saved === "dark";
    }
    return false; // default: light
  });

  useEffect(() => {
    localStorage.setItem("reune-v3-theme", isDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const C: NBPalette = isDark ? NBDark : NBLight;

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showWizard, setShowWizard] = useState(false);
  const [creating, setCreating] = useState(false);

  // Wizard state
  const currentYear = new Date().getFullYear();
  const [groupName, setGroupName] = useState(`Amigo Secreto ${currentYear}`);
  const [minValue, setMinValue] = useState("50");
  const [maxValue, setMaxValue] = useState("100");

  // Countdown to Christmas
  const christmasDate = new Date(`${currentYear}-12-25T00:00:00`).getTime();

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
      toast.error("Valores inválidos.", {
        description: "O valor mínimo deve ser menor que o máximo.",
        style: { borderRadius: "0px", border: "3px solid #000", boxShadow: "4px 4px 0px #000", background: C.red }
      });
      return;
    }

    setCreating(true);

    try {
      const { data: eventData, error: eventError } = await supabase
        .from("table_reune")
        .insert({
          title: groupName.trim() || `Amigo Secreto ${currentYear}`,
          description: "Evento de Amigo Secreto criado pelo ReUNE",
          user_id: user.id,
          event_date: `${currentYear}-12-25`,
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
        draw_date: `${currentYear}-12-20`,
        has_drawn: false,
      });

      if (secretSantaError) throw secretSantaError;

      toast.success("Amigo Secreto criado!", {
        description: "Agora adicione os participantes.",
        style: { borderRadius: "0px", border: "3px solid #000", boxShadow: "4px 4px 0px #000", background: C.mint, color: C.black }
      });
      navigate(`/event/${eventData.id}/secret-santa/participants`);
    } catch (error) {
      console.error("Erro ao criar Amigo Secreto:", error);
      toast.error("Erro ao criar.", {
        description: "Tente novamente.",
        style: { borderRadius: "0px", border: "3px solid #000", boxShadow: "4px 4px 0px #000", background: C.red }
      });
    } finally {
      setCreating(false);
    }
  };

  const features = [
    {
      icon: Shuffle,
      title: "Sorteio Justo",
      description: "Algoritmo garante que ninguém tire a si mesmo. Sem marmelada.",
      bg: C.red
    },
    {
      icon: Gift,
      title: "Lista de Desejos",
      description: "Cada participante diz o que quer. Acabou o presente ruim.",
      bg: C.green
    },
    {
      icon: Link2,
      title: "Convite por Link",
      description: "Manda no Zap e pronto. Todo mundo entra direto.",
      bg: C.yellow
    }
  ];

  return (
    <div
      className="min-h-screen overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: C.bg, color: C.text }}
    >
      <Helmet>
        <title>Amigo Secreto Online Grátis | ReUNE</title>
        <meta
          name="description"
          content="Organize seu amigo secreto online em 30 segundos. Sorteio automático, lista de desejos e compartilhamento fácil. Grátis!"
        />
        <meta name="keywords" content="amigo secreto, sorteio online, amigo oculto, natal 2025, amigo secreto gratis" />
      </Helmet>

      {/* Theme Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className={`fixed top-4 right-4 z-50 p-3 rounded-lg ${nb.border} ${nb.shadow} ${nb.hover} transition-colors`}
        style={{ backgroundColor: isDark ? C.yellow : C.lavender, color: C.black }}
      >
        {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>


      {/* Floating Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-xl ${nb.border} ${nb.shadow}`}
        style={{ backgroundColor: C.sectionBg }}
      >
        <div className="flex items-center gap-6">
          <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-green-600">
            ReUNE
          </span>
          <div className="hidden md:flex items-center gap-2 text-sm font-bold pl-6 border-l-2 border-black/10">
            <TreePine className="w-4 h-4 text-green-600" />
            <span style={{ color: C.textMuted }}>Amigo Secreto {currentYear}</span>
          </div>
          <button onClick={() => navigate("/")} className="ml-4 flex items-center gap-2 text-sm font-bold hover:underline">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Voltar
          </button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-12 overflow-hidden">

        {/* Floating Shapes */}
        <motion.div
          animate={{ rotate: [0, 10, 0], y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className={`absolute top-1/4 left-1/4 w-32 h-32 rounded-full ${nb.border} opacity-20`}
          style={{ backgroundColor: C.red }}
        />
        <motion.div
          animate={{ rotate: [0, -10, 0], y: [0, 20, 0] }}
          transition={{ duration: 7, repeat: Infinity, delay: 1 }}
          className={`absolute bottom-1/4 right-1/4 w-40 h-40 ${nb.border} opacity-20`}
          style={{ backgroundColor: C.green }}
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
            <div
              className={`px-4 py-2 rounded-lg ${nb.border} ${nb.shadow} text-sm font-bold flex items-center gap-2`}
              style={{ backgroundColor: C.pink, color: C.black }}
            >
              <Gift className="w-4 h-4" />
              Sorteio Automático
            </div>

            {/* Free Access Banner */}
            <div
              className={`relative px-6 py-3 text-base font-black rounded-xl ${nb.border} ${nb.shadowLg} flex items-center gap-2 -rotate-2 hover:rotate-0 transition-transform`}
              style={{ backgroundColor: C.green, color: "#fff" }}
            >
              <Zap className="w-5 h-5" />
              GRÁTIS — Sem limite de participantes!
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tight leading-[0.9]">
              Amigo
              <br />
              <span className="relative inline-block">
                <span className="relative z-10" style={{ color: C.red }}>Secreto</span>
                <div
                  className="absolute -bottom-2 md:-bottom-4 left-0 right-0 h-6 md:h-8 -z-10 -rotate-1"
                  style={{ backgroundColor: C.yellow }}
                />
              </span>
            </h1>

            <p className="text-xl md:text-2xl font-bold max-w-3xl mx-auto leading-relaxed" style={{ color: C.textMuted }}>
              Organize o sorteio da família ou da firma em segundos.
              <span className="block mt-2 font-black" style={{ color: C.orange }}>
                Sem complicação. Tudo Justo.
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
            <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: C.textMuted }}>Contagem Regressiva</p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-3xl mx-auto">
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
                  className="flex flex-col items-center"
                >
                  <div
                    className={`relative w-24 md:w-32 h-24 md:h-32 flex items-center justify-center rounded-2xl ${nb.border} ${nb.shadow}`}
                    style={{ backgroundColor: idx % 2 === 0 ? C.red : C.green, color: "#fff" }}
                  >
                    <span className="text-4xl md:text-6xl font-black">{String(item.value).padStart(2, "0")}</span>
                  </div>
                  <div className="mt-2 text-xs font-black uppercase tracking-widest" style={{ color: C.textMuted }}>
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
            className="flex flex-col items-center gap-6 pt-12"
          >
            {!showWizard ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
                <Button
                  size="lg"
                  onClick={handleStartClick}
                  disabled={authLoading}
                  className={`h-16 px-10 text-xl md:text-2xl rounded-xl ${nb.button} w-full shadow-[6px_6px_0px_#1A1A1A] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_#1A1A1A]`}
                  style={{ backgroundColor: C.yellow, color: C.black }}
                >
                  <Gift className="w-6 h-6 mr-3" />
                  Criar Sorteio Agora
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
              >
                <div
                  className={`relative p-8 rounded-2xl ${nb.border} ${nb.shadowXl}`}
                  style={{ backgroundColor: C.cardBg }}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <div className={`p-2 rounded-lg ${nb.border}`} style={{ backgroundColor: C.mint }}>
                      <Sparkles className="w-5 h-5 text-black" />
                    </div>
                    <h3 className="text-xl font-black">Configuração Rápida</h3>
                  </div>

                  <form onSubmit={handleCreateSecretSanta} className="space-y-5">
                    <div className="space-y-2 text-left">
                      <Label htmlFor="groupName" className="font-bold">Nome do Grupo</Label>
                      <input
                        id="groupName"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Ex: Família Silva"
                        className={`w-full p-3 rounded-lg ${nb.input} font-medium`}
                        style={{ backgroundColor: C.inputBg, color: C.text }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="space-y-2">
                        <Label htmlFor="minValue" className="font-bold">Mínimo (R$)</Label>
                        <input
                          id="minValue"
                          type="number"
                          value={minValue}
                          onChange={(e) => setMinValue(e.target.value)}
                          placeholder="50"
                          min="0"
                          className={`w-full p-3 rounded-lg ${nb.input} font-medium`}
                          style={{ backgroundColor: C.inputBg, color: C.text }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxValue" className="font-bold">Máximo (R$)</Label>
                        <input
                          id="maxValue"
                          type="number"
                          value={maxValue}
                          onChange={(e) => setMaxValue(e.target.value)}
                          placeholder="100"
                          min="0"
                          className={`w-full p-3 rounded-lg ${nb.input} font-medium`}
                          style={{ backgroundColor: C.inputBg, color: C.text }}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={creating}
                      className={`w-full h-14 text-lg rounded-xl ${nb.button}`}
                      style={{ backgroundColor: C.green, color: "#fff" }}
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Shuffle className="w-5 h-5 mr-2" />
                          Criar e Adicionar Pessoas
                        </>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setShowWizard(false)}
                      className="w-full text-sm font-bold hover:underline"
                      style={{ color: C.textMuted }}
                    >
                      Cancelar
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            <p className="text-xs font-bold" style={{ color: C.textMuted }}>
              100% gratuito • Sem anúncios • Seguro
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div
              className={`inline-flex items-center px-4 py-2 rounded-lg ${nb.border} ${nb.shadow} mb-4 font-bold`}
              style={{ backgroundColor: C.yellow, color: C.black }}
            >
              <TreePine className="w-4 h-4 mr-2" />
              Como Funciona
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              Simples.
              <span className="text-transparent bg-clip-text" style={{ WebkitTextStroke: `2px ${C.text}`, color: "transparent" }}>
                Rápido.
              </span>
              <span style={{ color: C.orange }}>Divertido.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40, rotate: index % 2 === 0 ? 1 : -1 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02, rotate: 0 }}
                className={`group relative p-8 rounded-2xl ${nb.border} ${nb.shadowLg} hover:shadow-xl transition-all duration-300`}
                style={{ backgroundColor: C.cardBg }}
              >
                <div
                  className={`w-16 h-16 rounded-xl ${nb.border} flex items-center justify-center mb-6`}
                  style={{ backgroundColor: feature.bg }}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-black mb-4">
                  {feature.title}
                </h3>
                <p className="font-medium leading-relaxed" style={{ color: C.textMuted }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer palette={C} />
    </div>
  );
}
