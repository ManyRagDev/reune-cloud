import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gift, 
  Users, 
  Link2, 
  Shuffle, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Sun, 
  Moon, 
  ShieldCheck, 
  MessageCircle, 
  Lock, 
  MapPin, 
  HelpCircle, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  Heart,
  Smile,
  Briefcase,
  Home,
  GraduationCap
} from "lucide-react";
import { Helmet } from "react-helmet";
import { Footer } from "@/components/landing/Footer";
import { NBLight, NBDark, NBPalette, nb } from "@/lib/neobrutalism";
import { SecretSantaWizardModal } from "@/components/events/SecretSantaWizardModal";
import { SecretSantaChoiceModal } from "@/components/events/SecretSantaChoiceModal";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export default function SecretSantaLanding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  /* ── Dark mode state ──────────────────────── */
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("reune-v3-theme");
      if (saved) return saved === "dark";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("reune-v3-theme", isDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const C: NBPalette = isDark ? NBDark : NBLight;

  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [selectedCircleTitle, setSelectedCircleTitle] = useState<string | undefined>(undefined);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardInitialTitle, setWizardInitialTitle] = useState<string | undefined>(undefined);
  const [wizardInitialEmoji, setWizardInitialEmoji] = useState<string | undefined>(undefined);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Se o usuário veio redirecionado do login com ?action=wizard, abre o Wizard automaticamente
  useEffect(() => {
    if (user && searchParams.get('action') === 'wizard') {
      const groupFromUrl = searchParams.get('group');
      if (groupFromUrl) {
        setWizardInitialTitle(groupFromUrl);
      }
      setShowWizard(true);
      navigate('/amigo-secreto', { replace: true });
    }
  }, [user, searchParams, navigate]);

  const handleStartClick = () => {
    setSelectedCircleTitle(undefined);
    setWizardInitialTitle(undefined);
    setWizardInitialEmoji(undefined);
    setShowChoiceModal(true);
  };

  const handleStartWithGroup = (groupTitle: string, emoji: string) => {
    const currentYear = new Date().getFullYear();
    const fullTitle = `${groupTitle} ${currentYear}`;
    setSelectedCircleTitle(fullTitle);
    setWizardInitialTitle(fullTitle);
    setWizardInitialEmoji(emoji);
    setShowChoiceModal(true);
  };

  const handleSelectQuick = () => {
    setShowChoiceModal(false);
    if (selectedCircleTitle) {
      navigate(`/amigo-secreto/rapido?group=${encodeURIComponent(selectedCircleTitle)}`);
    } else {
      navigate('/amigo-secreto/rapido');
    }
  };

  const handleSelectFull = () => {
    setShowChoiceModal(false);
    if (user) {
      setShowWizard(true);
    } else {
      const returnTarget = selectedCircleTitle
        ? `/amigo-secreto?action=wizard&group=${encodeURIComponent(selectedCircleTitle)}`
        : `/amigo-secreto?action=wizard`;
      navigate(`/app?redirect=${encodeURIComponent(returnTarget)}`);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      q: "Precisa baixar algum aplicativo no celular?",
      a: "Não! O ReUNE funciona 100% no navegador do celular ou computador. Você manda o link no WhatsApp e os participantes entram na hora sem complicação."
    },
    {
      q: "O organizador consegue ver quem tirou quem?",
      a: "Não! O sorteio é 100% secreto e criptografado no banco de dados. Nem o criador do grupo tem acesso aos pares sorteados."
    },
    {
      q: "Como funciona a segurança do PIN de 4 dígitos?",
      a: "Ao entrar no Amigo Secreto, cada participante cria um PIN de 4 dígitos. No dia da revelação, basta digitar esse PIN para ver o amigo sorteado sem nenhum risco de spoilers na tela!"
    },
    {
      q: "Qual a diferença entre o Modo Aberto e o Anti-Penetras?",
      a: "No Modo Aberto, você manda 1 link geral no WhatsApp e qualquer amigo do grupo pode entrar. No Modo Anti-Penetras, você digita os nomes autorizados e cada um recebe um link exclusivo e intransferível."
    },
    {
      q: "É realmente 100% gratuito?",
      a: "Sim! Não cobramos nada, não há limite de participantes e não temos anúncios invasivos na tela de sorteio."
    },
    {
      q: "Dá para colocar o local e horário da festa da revelação?",
      a: "Com certeza! Você define a data, o horário e o endereço com mapa interativo e botões diretos de rotas para Uber, Waze e Google Maps."
    }
  ];

  return (
    <div 
      className="min-h-screen transition-colors duration-300 font-sans selection:bg-[#FFD93D] selection:text-black overflow-x-hidden" 
      style={{ backgroundColor: C.bg, color: C.text }}
    >
      <Helmet>
        <title>Amigo Secreto Online Grátis | ReUNE — Direto no WhatsApp e Sem Penetras</title>
        <meta name="description" content="Organize seu Amigo Secreto em 2 minutos! Sorteio 100% justo, lista de desejos de presentes e convites direto no WhatsApp com opção Anti-Penetras. Grátis e sem baixar app." />
        <meta property="og:title" content="Amigo Secreto Online no WhatsApp 🎁 | ReUNE" />
        <meta property="og:description" content="Sem papelzinho, sem penetras e com lista de presentes! Crie seu amigo secreto grátis em 2 minutos." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://reuneapp.com.br/amigo-secreto" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* ═══ NAVBAR NEOBRUTALISM ═══ */}
      <nav
        className={`sticky top-0 z-40 px-4 md:px-8 py-3.5 ${nb.border} border-t-0 border-x-0 flex items-center justify-between backdrop-blur-md transition-colors duration-300`}
        style={{ backgroundColor: isDark ? "rgba(30, 27, 24, 0.9)" : "rgba(255, 253, 247, 0.9)" }}
      >
        <div className="flex items-center gap-3">
          <div 
            onClick={() => navigate("/")} 
            className="cursor-pointer flex items-center gap-2 group"
          >
            <div className={`w-10 h-10 rounded-xl ${nb.border} flex items-center justify-center font-black text-xl shadow-[3px_3px_0px_#1A1A1A] group-hover:rotate-6 transition-transform`} style={{ backgroundColor: C.yellow, color: C.black }}>
              🎁
            </div>
            <div>
              <span className="font-black text-xl tracking-tight" style={{ color: C.orange }}>
                ReUNE
              </span>
              <span className={`ml-2 hidden sm:inline-block px-2 py-0.5 rounded-full border-[2px] border-black text-[10px] font-black uppercase shadow-[1px_1px_0px_#1A1A1A]`} style={{ backgroundColor: C.mint, color: C.black }}>
                Amigo Secreto
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/amigo-secreto/rapido')}
            className={`hidden sm:inline-flex h-11 px-4 rounded-xl font-black text-xs md:text-sm ${nb.border} ${nb.shadow} ${nb.hover} transition-all`}
            style={{ backgroundColor: C.mint, color: C.black }}
          >
            <Zap className="w-4 h-4 mr-1.5 fill-black" />
            Sorteio Relâmpago (Sem Cadastro)
          </Button>

          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2.5 rounded-xl ${nb.border} ${nb.shadow} ${nb.hover}`}
            style={{ backgroundColor: isDark ? C.yellow : C.lavender, color: C.black }}
            title={isDark ? "Modo Claro" : "Modo Escuro"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Button
            onClick={handleStartClick}
            disabled={authLoading}
            className={`h-11 px-5 rounded-xl font-black text-xs md:text-sm ${nb.border} ${nb.shadow} ${nb.hover} transition-all`}
            style={{ backgroundColor: C.yellow, color: C.black }}
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Criar Sorteio
          </Button>
        </div>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative px-4 py-12 md:py-20 max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Badge de Topo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${nb.border} shadow-[3px_3px_0px_#1A1A1A] font-black text-xs md:text-sm uppercase tracking-wide`}
            style={{ backgroundColor: C.mint, color: C.black }}
          >
            <WhatsAppIcon className="w-4 h-4 text-emerald-950 fill-current" />
            <span>SEM PAPELZINHO • DIRETO NO WHATSAPP • ANTI-PENETRAS</span>
          </motion.div>

          {/* Headline Principal */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight max-w-4xl"
          >
            Organize seu Amigo Secreto em{" "}
            <span 
              className="px-3 py-1 rounded-2xl border-[3px] border-black inline-block transform -rotate-1 shadow-[5px_5px_0px_#1A1A1A]" 
              style={{ backgroundColor: C.yellow, color: C.black }}
            >
              2 minutos.
            </span>
            <br />
            Sem confusão e direto no WhatsApp.
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-xl font-bold max-w-2xl leading-relaxed"
            style={{ color: C.textMuted }}
          >
            O ReUNE faz o sorteio 100% justo, cada amigo cadastra o que quer ganhar e você dispara os convites no WhatsApp em 1 clique. Ninguém tira a si mesmo e ninguém bisbilhota!
          </motion.p>

          {/* CTA Principal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-3 justify-center items-center w-full max-w-md pt-2"
          >
            <Button
              size="lg"
              onClick={handleStartClick}
              disabled={authLoading}
              className={`h-16 px-8 text-lg md:text-xl rounded-2xl ${nb.button} w-full shadow-[6px_6px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_#1A1A1A]`}
              style={{ backgroundColor: C.orange, color: "#fff" }}
            >
              <Gift className="w-6 h-6 mr-3" />
              CRIAR MEU AMIGO SECRETO
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>

            <button
              type="button"
              onClick={() => navigate('/amigo-secreto/rapido')}
              className="inline-flex items-center gap-1.5 text-xs md:text-sm font-black underline hover:text-[#FF6B35] transition-colors pt-1"
            >
              <Zap className="w-4 h-4 fill-current text-amber-500" />
              Quer sortear agora em 1 minuto sem cadastro? Use o Sorteador Relâmpago ➔
            </button>
          </motion.div>

          {/* Micro-prova de confiança */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-black uppercase pt-1" style={{ color: C.textMuted }}>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% Gratuito
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sem baixar aplicativo
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Revelação com PIN Seguro
            </span>
          </div>

          {/* ═══ MOCKUPS VISUAIS EM DUPLA ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl pt-8 text-left"
          >
            {/* Card 1: Mensagem do WhatsApp */}
            <div 
              className={`p-6 rounded-3xl ${nb.border} shadow-[8px_8px_0px_#1A1A1A] relative transform md:-rotate-1`}
              style={{ backgroundColor: C.cardBg }}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-dashed border-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center">
                    <WhatsAppIcon className="w-4 h-4 text-white fill-current" />
                  </div>
                  <span className="font-black text-xs uppercase">No Grupo do WhatsApp</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  1 Clique
                </span>
              </div>

              <div className="p-3.5 rounded-xl border-[2px] border-black bg-[#E7F8EE] font-mono text-xs text-gray-800 space-y-2 leading-relaxed">
                <p className="font-bold text-black">🎁 *AMIGO SECRETO DA FIRMA 2026* 🎁</p>
                <p>💰 *Valor:* R$ 50 a R$ 100<br />🎲 *Sorteio:* 18 de Dezembro<br />🎉 *Festa:* 22 de Dezembro às 19h30</p>
                <p className="text-emerald-700 font-bold">👉 Entre pelo link e cadastre seus desejos:</p>
                <p className="underline text-blue-600 break-all">reuneapp.com.br/amigo/32/entrar</p>
              </div>
            </div>

            {/* Card 2: Revelação Secreta com PIN */}
            <div 
              className={`p-6 rounded-3xl ${nb.border} shadow-[8px_8px_0px_#1A1A1A] relative transform md:rotate-1`}
              style={{ backgroundColor: C.cardBg }}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-dashed border-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#FFD93D] border-[2px] border-black flex items-center justify-center text-xs">
                    🔒
                  </div>
                  <span className="font-black text-xs uppercase">Revelação com PIN Pessoal</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-900">
                  Zero Spoilers
                </span>
              </div>

              <div className="p-4 rounded-xl border-[2px] border-black bg-white space-y-2">
                <span className="text-[10px] font-black uppercase text-gray-500">Seu Amigo Secreto é:</span>
                <h4 className="text-2xl font-black text-[#FF6B35]">Mariana Costa 🤫</h4>
                <div className="p-2.5 rounded-lg border-[2px] border-black bg-[#FFF8E1] text-xs">
                  <p className="font-bold text-black">🎁 O que ela quer ganhar:</p>
                  <p className="text-gray-700 font-medium">"Livro de ficção científica ou café especial moído"</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ OS 2 MODOS DE CONVITE: O DIFERENCIAL REUNE ═══ */}
      <section className="py-16 px-4 relative border-y-[3px] border-black" style={{ backgroundColor: C.sectionBg }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div 
              className={`inline-flex items-center px-4 py-1.5 rounded-full ${nb.border} shadow-[3px_3px_0px_#1A1A1A] mb-3 font-black text-xs uppercase`}
              style={{ backgroundColor: C.pink, color: C.black }}
            >
              O Grande Diferencial
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Dois modos pensados para a sua realidade.
            </h2>
            <p className="text-sm md:text-base font-bold" style={{ color: C.textMuted }}>
              Quer agilidade máxima no grupo ou controle absoluto contra penetras? Você escolhe.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* MODO 1: Aberto */}
            <div 
              className={`p-8 rounded-3xl ${nb.border} shadow-[8px_8px_0px_#1A1A1A] flex flex-col justify-between`}
              style={{ backgroundColor: C.cardBg }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-14 h-14 rounded-2xl ${nb.border} flex items-center justify-center text-3xl shadow-[3px_3px_0px_#1A1A1A]`} style={{ backgroundColor: C.mint }}>
                    🚀
                  </div>
                  <span className="px-3 py-1 rounded-full border-[2px] border-black font-black text-xs bg-white uppercase">
                    Mais Popular
                  </span>
                </div>

                <h3 className="text-2xl font-black">Link Aberto do Grupo</h3>
                <p className="font-medium text-sm leading-relaxed" style={{ color: C.textMuted }}>
                  Envie 1 link geral no WhatsApp da galera. Cada participante clica, digita seu nome, escolhe seus presentes e cria seu PIN secreto de 4 dígitos.
                </p>

                <ul className="space-y-2.5 text-xs font-bold pt-2">
                  <li className="flex items-center gap-2">
                    <WhatsAppIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Compartilhamento instantâneo no grupo do WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Sem complicação: o próprio amigo se cadastra</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>PIN individual para ver o resultado do sorteio</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Button
                  onClick={handleStartClick}
                  className={`w-full h-12 rounded-xl ${nb.button} font-black text-xs`}
                  style={{ backgroundColor: C.mint, color: C.black }}
                >
                  USAR MODO ABERTO ➔
                </Button>
              </div>
            </div>

            {/* MODO 2: Anti-Penetras */}
            <div 
              className={`p-8 rounded-3xl ${nb.border} shadow-[8px_8px_0px_#1A1A1A] flex flex-col justify-between`}
              style={{ backgroundColor: C.cardBg }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-14 h-14 rounded-2xl ${nb.border} flex items-center justify-center text-3xl shadow-[3px_3px_0px_#1A1A1A]`} style={{ backgroundColor: C.sky }}>
                    🛡️
                  </div>
                  <span className="px-3 py-1 rounded-full border-[2px] border-black font-black text-xs bg-white uppercase">
                    Blindado
                  </span>
                </div>

                <h3 className="text-2xl font-black">Convites Anti-Penetras</h3>
                <p className="font-medium text-sm leading-relaxed" style={{ color: C.textMuted }}>
                  Você pré-cadastra a lista de convidados autorizados. O ReUNE gera um link exclusivo para cada um. Ninguém de fora consegue se infiltrar no sorteio!
                </p>

                <ul className="space-y-2.5 text-xs font-bold pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Link e token exclusivo por pessoa (intransferível)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <WhatsAppIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Botão direto para mandar no WhatsApp de cada amigo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Perfeito para firmas, equipes e orçamentos fechados</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Button
                  onClick={handleStartClick}
                  className={`w-full h-12 rounded-xl ${nb.button} font-black text-xs`}
                  style={{ backgroundColor: C.sky, color: C.black }}
                >
                  USAR MODO ANTI-PENETRAS ➔
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COMO FUNCIONA EM 3 PASSOS ═══ */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div 
            className={`inline-flex items-center px-4 py-1.5 rounded-full ${nb.border} shadow-[3px_3px_0px_#1A1A1A] mb-3 font-black text-xs uppercase`}
            style={{ backgroundColor: C.yellow, color: C.black }}
          >
            Simples Demais
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Como funciona em 3 passos
          </h2>
          <p className="text-sm md:text-base font-bold" style={{ color: C.textMuted }}>
            Você cria o evento em minutos e a plataforma cuida de todo o resto.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Defina as Regras",
              desc: "Escolha o nome do grupo, o valor sugerido dos presentes (R$ 30, R$ 50, R$ 100...) e a data do sorteio.",
              emoji: "⚙️",
              bg: C.yellow
            },
            {
              step: "02",
              title: "Mande no WhatsApp",
              desc: "Compartilhe o convite pronto com um clique. Cada amigo entra, coloca o que quer ganhar e cria seu PIN.",
              emoji: "📲",
              bg: C.pink
            },
            {
              step: "03",
              title: "Sorteio & Revelação",
              desc: "Com um clique o sorteio acontece. Cada pessoa abre o link, digita o seu PIN e descobre quem tirou sem spoilers!",
              emoji: "🎉",
              bg: C.mint
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-3xl ${nb.border} shadow-[6px_6px_0px_#1A1A1A] relative flex flex-col justify-between`}
              style={{ backgroundColor: C.cardBg }}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${nb.border} flex items-center justify-center text-2xl shadow-[2px_2px_0px_#1A1A1A]`} style={{ backgroundColor: item.bg }}>
                    {item.emoji}
                  </div>
                  <span className="font-black text-4xl opacity-30">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-black mb-2">{item.title}</h3>
                <p className="text-xs md:text-sm font-medium leading-relaxed" style={{ color: C.textMuted }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ BENEFÍCIOS QUE MATAM OBJEÇÕES ═══ */}
      <section className="py-20 px-4 border-t-[3px] border-black" style={{ backgroundColor: C.sectionBg }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Por que abandonar o papelzinho?
            </h2>
            <p className="text-sm md:text-base font-bold" style={{ color: C.textMuted }}>
              Problemas clássicos que o ReUNE resolve de uma vez por todas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shuffle,
                title: "Sem Marmelada",
                desc: "Algoritmo certificado: ninguém tira a si mesmo e ninguém tira o mesmo amigo duas vezes.",
                color: C.orange
              },
              {
                icon: Gift,
                title: "Lista de Desejos",
                desc: "Cada participante escreve 3 coisas que adoraria ganhar. Acabou o medo de receber presente ruim.",
                color: C.yellow
              },
              {
                icon: MapPin,
                title: "A Festa Conectada",
                desc: "Local da revelação com mapa e rotas diretas para Uber, Waze e Google Maps.",
                color: C.mint
              },
              {
                icon: Lock,
                title: "Segredo Absoluto",
                desc: "Nem o organizador sabe quem tirou quem. A surpresa fica guardada a sete chaves até a festa.",
                color: C.sky
              }
            ].map((b, i) => (
              <div
                key={i}
                className={`p-6 rounded-3xl ${nb.border} shadow-[6px_6px_0px_#1A1A1A] space-y-3`}
                style={{ backgroundColor: C.cardBg }}
              >
                <div 
                  className={`w-12 h-12 rounded-2xl ${nb.border} flex items-center justify-center shadow-[3px_3px_0px_#1A1A1A]`}
                  style={{ backgroundColor: b.color }}
                >
                  <b.icon className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-lg font-black">{b.title}</h3>
                <p className="text-xs font-semibold leading-relaxed" style={{ color: C.textMuted }}>
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CASOS DE USO & CÍRCULOS MODERNOS ═══ */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div 
            className={`inline-flex items-center px-4 py-1.5 rounded-full ${nb.border} shadow-[3px_3px_0px_#1A1A1A] mb-3 font-black text-xs uppercase`}
            style={{ backgroundColor: C.lavender, color: C.black }}
          >
            Seu Grupo, Suas Regras
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Qual é a turma do seu Amigo Secreto?
          </h2>
          <p className="text-sm md:text-base font-bold" style={{ color: C.textMuted }}>
            Clique na sua galera para começar com sugestões personalizadas!
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {[
            { 
              label: "Turma do Pilates & Yoga", 
              prefix: "Amigo Secreto do Pilates", 
              emoji: "🧘‍♀️", 
              color: C.yellow,
              tag: "Em alta ✨"
            },
            { 
              label: "Galera do Crossfit", 
              prefix: "Amigo Secreto do Crossfit", 
              emoji: "🏋️‍♂️", 
              color: C.orange,
              tag: "Do Box ⚡"
            },
            { 
              label: "Amigo Secreto da Firma", 
              prefix: "Amigo Secreto da Firma", 
              emoji: "💼", 
              color: C.sky,
              tag: "Corporativo"
            },
            { 
              label: "Família Reunida", 
              prefix: "Amigo Secreto da Família", 
              emoji: "🏠", 
              color: C.pink,
              tag: "Tradição"
            },
            { 
              label: "Resenha & Futebol", 
              prefix: "Amigo Secreto dos Parças", 
              emoji: "🍻", 
              color: C.mint,
              tag: "Pelada ⚽"
            },
            { 
              label: "Clube do Livro", 
              prefix: "Amigo Secreto do Clube do Livro", 
              emoji: "📚", 
              color: C.lavender,
              tag: "Literário"
            },
            { 
              label: "Igreja & Célula", 
              prefix: "Amigo Secreto da Célula", 
              emoji: "⛪", 
              color: C.yellow,
              tag: "Comunidade"
            },
            { 
              label: "Gamers & Discord", 
              prefix: "Amigo Secreto dos Gamers", 
              emoji: "🎮", 
              color: C.sky,
              tag: "Online 👾"
            },
            { 
              label: "Amigo dos Pets", 
              prefix: "Amigo Secreto dos Pets", 
              emoji: "🐾", 
              color: C.mint,
              tag: "Dog Lovers 🐶"
            },
            { 
              label: "Turma da Faculdade", 
              prefix: "Amigo Secreto da Faculdade", 
              emoji: "🎓", 
              color: C.pink,
              tag: "Semestre 📚"
            },
          ].map((c, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStartWithGroup(c.prefix, c.emoji)}
              className={`p-4 rounded-2xl ${nb.border} shadow-[4px_4px_0px_#1A1A1A] cursor-pointer transition-all flex flex-col items-center justify-between text-center min-h-[140px] relative overflow-hidden`}
              style={{ backgroundColor: c.color }}
            >
              <div className="w-11 h-11 rounded-xl border-[2px] border-black bg-white flex items-center justify-center text-2xl shadow-[2px_2px_0px_#1A1A1A] mb-2">
                {c.emoji}
              </div>
              <div>
                <p className="font-black text-xs md:text-sm text-black leading-snug">
                  {c.label}
                </p>
                <span className="inline-block mt-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-black bg-white/70">
                  {c.tag}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ FAQ SECTION ═══ */}
      <section className="py-20 px-4 border-t-[3px] border-black" style={{ backgroundColor: C.sectionBg }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-3">
              Perguntas Frequentes
            </h2>
            <p className="text-sm font-bold" style={{ color: C.textMuted }}>
              Tudo o que você precisa saber antes de criar seu sorteio.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`rounded-2xl ${nb.border} shadow-[4px_4px_0px_#1A1A1A] overflow-hidden transition-all`}
                style={{ backgroundColor: C.cardBg }}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left font-black text-sm md:text-base flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown 
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${openFaqIndex === idx ? "rotate-180" : ""}`} 
                  />
                </button>
                <AnimatePresence>
                  {openFaqIndex === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 text-xs md:text-sm font-medium leading-relaxed border-t-2 border-black/10 pt-3"
                      style={{ color: C.textMuted }}
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="py-20 px-4 text-center max-w-4xl mx-auto">
        <div 
          className={`p-8 md:p-14 rounded-3xl ${nb.border} shadow-[10px_10px_0px_#1A1A1A] space-y-6`}
          style={{ backgroundColor: C.yellow }}
        >
          <div className="inline-block p-4 rounded-2xl border-[3px] border-black bg-white text-3xl shadow-[4px_4px_0px_#1A1A1A] transform -rotate-3">
            🎁
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-black leading-tight">
            Pronto para acabar com a bagunça do papelzinho?
          </h2>
          <p className="text-sm md:text-base font-bold text-gray-800 max-w-xl mx-auto">
            Crie seu grupo agora, mande o link no WhatsApp e garanta que o Amigo Secreto da galera seja inesquecível!
          </p>

          <div className="pt-2">
            <Button
              size="lg"
              onClick={handleStartClick}
              disabled={authLoading}
              className={`h-16 px-10 text-lg md:text-xl rounded-2xl ${nb.button} bg-black hover:bg-gray-800 text-white shadow-[6px_6px_0px_#FFF]`}
            >
              <Sparkles className="w-5 h-5 mr-3 text-[#FFD93D]" />
              CRIAR MEU AMIGO SECRETO GRÁTIS
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ STICKY BAR MOBILE DE CONVERSÃO ═══ */}
      <div 
        className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-safe z-30 md:hidden border-t-[3px] border-black backdrop-blur-md flex items-center justify-between gap-3 shadow-[0px_-4px_0px_#000]"
        style={{ backgroundColor: isDark ? "rgba(30, 27, 24, 0.95)" : "rgba(255, 253, 247, 0.95)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎁</span>
          <div className="leading-tight">
            <p className="font-black text-xs">Amigo Secreto</p>
            <p className="text-[10px] font-bold text-emerald-600">100% Gratuito</p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleStartClick}
          className={`h-11 px-5 rounded-xl font-black text-xs ${nb.button} shadow-[3px_3px_0px_#1A1A1A] touch-press`}
          style={{ backgroundColor: C.orange, color: "#fff" }}
        >
          Criar Agora ➔
        </Button>
      </div>

      {/* ═══ MODAL DE ESCOLHA (SEM CADASTRO VS SUÍTE COMPLETA) ═══ */}
      <SecretSantaChoiceModal
        open={showChoiceModal}
        onClose={() => setShowChoiceModal(false)}
        onSelectQuick={handleSelectQuick}
        onSelectFull={handleSelectFull}
        groupTitle={selectedCircleTitle}
        isDark={isDark}
      />

      {/* ═══ MODAL DEDICADO DO AMIGO SECRETO (WIZARD 3 PASSOS) ═══ */}
      <SecretSantaWizardModal
        open={showWizard}
        onOpenChange={(isOpen) => {
          setShowWizard(isOpen);
          if (!isOpen) {
            setWizardInitialTitle(undefined);
            setWizardInitialEmoji(undefined);
          }
        }}
        initialTitle={wizardInitialTitle}
        initialEmoji={wizardInitialEmoji}
      />

      {/* Footer */}
      <Footer palette={C} />
    </div>
  );
}
