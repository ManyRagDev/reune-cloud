import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Gift, Users, Link2, Shuffle, TreePine, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";
import { toast } from "sonner";

export default function SecretSantaLanding() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

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
      // Redirect to app (login is handled there)
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
      // 1. Create the event
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

      // 2. Create the event dynamic entry
      const { error: dynamicError } = await supabase.from("event_dynamics").insert({
        event_id: eventData.id,
        type: "secret_santa",
      });

      if (dynamicError) throw dynamicError;

      // 3. Create the secret santa configuration
      const { error: secretSantaError } = await supabase.from("event_secret_santa").insert({
        event_id: eventData.id,
        min_value: min,
        max_value: max,
        draw_date: "2025-12-20",
        has_drawn: false,
      });

      if (secretSantaError) throw secretSantaError;

      toast.success("Amigo Secreto criado! Agora adicione os participantes.");

      // Redirect to participants page
      navigate(`/event/${eventData.id}/secret-santa/participants`);
    } catch (error) {
      console.error("Erro ao criar Amigo Secreto:", error);
      toast.error("Erro ao criar o Amigo Secreto. Tente novamente.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-red-500/30 overflow-x-hidden">
      <Helmet>
        <title>Amigo Secreto Online Grátis | ReUNE</title>
        <meta
          name="description"
          content="Organize seu amigo secreto online em 30 segundos. Sorteio automático, lista de desejos e compartilhamento fácil. Grátis!"
        />
        <meta name="keywords" content="amigo secreto, sorteio online, amigo oculto, natal 2025, amigo secreto gratis" />
      </Helmet>

      {/* Festive Gradient Background */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.15),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(22,163,74,0.1),transparent_50%)]" />

      {/* Subtle snow/sparkle effect */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMyIvPjwvc3ZnPg==')]" />

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <a
            href="/"
            className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-red-500"
          >
            ReUNE
          </a>
          <div className="flex items-center gap-2 text-sm text-gray-400 font-medium border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
            <TreePine className="w-4 h-4 text-green-500" />
            <span>Amigo Secreto 2025</span>
          </div>
        </header>

        {/* Hero Content */}
        <main className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
              <Gift className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-300">Sorteio Automático e Gratuito</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">
              Organize seu Amigo Secreto
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-amber-400">
                em 30 segundos
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Sorteio aleatório e justo, lista de desejos integrada e convites por e-mail.
              <span className="block mt-2 text-green-400">Sem complicação. Sem cadastros desgastantes.</span>
            </p>
          </motion.div>

          {/* Countdown to Christmas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-12"
          >
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">Contagem para o Natal</p>
            <div className="grid grid-cols-4 gap-3 md:gap-6">
              {[
                { label: "Dias", value: timeLeft.days },
                { label: "Horas", value: timeLeft.hours },
                { label: "Min", value: timeLeft.minutes },
                { label: "Seg", value: timeLeft.seconds },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center p-3 md:p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                >
                  <div className="text-2xl md:text-4xl font-mono font-bold text-white">
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 mt-1">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA or Wizard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-md mx-auto"
          >
            {!showWizard ? (
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-amber-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <Button
                  onClick={handleStartClick}
                  disabled={authLoading}
                  className="relative w-full h-14 text-lg font-semibold bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white rounded-xl shadow-lg transition-all"
                >
                  <Gift className="w-5 h-5 mr-2" />
                  Criar Meu Amigo Secreto
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600/50 to-green-600/50 rounded-2xl blur opacity-25"></div>
                <form
                  onSubmit={handleCreateSecretSanta}
                  className="relative p-6 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl space-y-4"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Configuração Rápida
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="groupName" className="text-gray-300 text-sm">
                      Nome do Grupo
                    </Label>
                    <Input
                      id="groupName"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Ex: Família Silva, Amigos do Trabalho"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-11"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="minValue" className="text-gray-300 text-sm">
                        Valor Mínimo (R$)
                      </Label>
                      <Input
                        id="minValue"
                        type="number"
                        value={minValue}
                        onChange={(e) => setMinValue(e.target.value)}
                        placeholder="50"
                        min="0"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxValue" className="text-gray-300 text-sm">
                        Valor Máximo (R$)
                      </Label>
                      <Input
                        id="maxValue"
                        type="number"
                        value={maxValue}
                        onChange={(e) => setMaxValue(e.target.value)}
                        placeholder="100"
                        min="0"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-11"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={creating}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white rounded-xl mt-4"
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
                    className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors mt-2"
                  >
                    Cancelar
                  </button>
                </form>
              </motion.div>
            )}

            <p className="mt-4 text-xs text-gray-600">100% gratuito • Sem anúncios • Seus dados protegidos</p>
          </motion.div>
        </main>

        {/* Features */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 grid md:grid-cols-3 gap-4 max-w-4xl mx-auto w-full"
        >
          {[
            {
              icon: Shuffle,
              title: "Sorteio Justo",
              desc: "Algoritmo garante que ninguém tire a si mesmo.",
              color: "text-red-400",
            },
            {
              icon: Gift,
              title: "Lista de Desejos",
              desc: "Cada participante adiciona sugestões de presente.",
              color: "text-amber-400",
            },
            {
              icon: Link2,
              title: "Convite por Link",
              desc: "Compartilhe no WhatsApp em 1 clique.",
              color: "text-green-400",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors group cursor-default"
            >
              <feature.icon className={`w-7 h-7 ${feature.color} mb-3 group-hover:scale-110 transition-transform`} />
              <h3 className="text-base font-semibold text-white mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </motion.footer>

        {/* Bottom link */}
        <div className="mt-12 text-center">
          <a
            href="/"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors inline-flex items-center gap-1"
          >
            Conheça o ReUNE completo
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
