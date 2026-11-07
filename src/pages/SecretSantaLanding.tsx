import { useState, useEffect, useRef } from "react";
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
  Lock, 
  Unlock,
  MapPin, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  CheckCircle2, 
  Clock, 
  Heart,
  Smile,
  AlertTriangle,
  Layers,
  Check
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

  /* ── 1. Hero Mockup Toggle (Grupo com PIN vs Relâmpago com Envelopes) ── */
  const [heroMockupTab, setHeroMockupTab] = useState<'group' | 'quick'>('group');

  /* ── 2. Card Deck Swipe State (O Grande Diferencial) ─────────────────── */
  const [cardDeckIndex, setCardDeckIndex] = useState(0);

  /* ── 3. Como Funciona (Mobile Carousel State) ────────────────────────── */
  const [howStepIndex, setHowStepIndex] = useState(0);
  const howCarouselRef = useRef<HTMLDivElement>(null);

  // Redirecionamento automático caso venha do login com ?action=wizard
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

  /* ── Cards da Pilha (O Grande Diferencial) ── */
  const differentialCards = [
    {
      id: "grupo",
      tag: "👑 Com Cadastro • Mais Popular",
      tagBg: C.mint,
      icon: "🚀",
      iconBg: C.yellow,
      title: "Link Aberto do Grupo",
      subtitle: "Cole 1 link no WhatsApp e a galera entra sozinha",
      description: "Crie o evento em 1 minuto e mande o link no grupo. Cada amigo entra, cadastra seus presentes e cria seu PIN.",
      benefits: [
        "1 link no WhatsApp da galera (zero trabalho manual)",
        "Lista de desejos para acertar no presente",
        "Revelação protegida por PIN de 4 dígitos"
      ],
      buttonLabel: "USAR MODO GRUPO ➔",
      action: handleStartClick,
      cardBg: C.cardBg,
      accentColor: C.mint
    },
    {
      id: "antipenetras",
      tag: "🔒 Com Cadastro • Blindado",
      tagBg: C.sky,
      icon: "🛡️",
      iconBg: C.sky,
      title: "Convites Anti-Penetras",
      subtitle: "Links exclusivos e individuais por participante",
      description: "Cadastre os amigos autorizados. O ReUNE gera um link exclusivo com token criptografado para cada um.",
      benefits: [
        "Link individual e token intransferível",
        "Zero risco de penetras ou pessoas duplicadas",
        "Botão direto para enviar no WhatsApp de cada um"
      ],
      buttonLabel: "USAR MODO ANTI-PENETRAS ➔",
      action: handleStartClick,
      cardBg: C.cardBg,
      accentColor: C.sky
    },
    {
      id: "relampago",
      tag: "⚡ Sem Cadastro • Só Praticidade",
      tagBg: C.yellow,
      icon: "⚡",
      iconBg: C.orange,
      title: "Sorteador Relâmpago",
      subtitle: "Sorteio instantâneo com Envelopes Lacrados",
      description: "Para quem quer resolver na hora sem criar conta. Digite os nomes, sorteie e mande os envelopes lacrados.",
      benefits: [
        "Zero cadastro, sem conta e sem senhas",
        "Envelopes digitais com selo de cera lacrado",
        "Alerta anti-spoilers se alguém abrir antes"
      ],
      buttonLabel: "IR PARA SORTEADOR RELÂMPAGO ➔",
      action: () => navigate('/amigo-secreto/rapido'),
      cardBg: C.cardBg,
      accentColor: C.yellow
    }
  ];

  const nextDeckCard = () => {
    setCardDeckIndex((prev) => (prev + 1) % differentialCards.length);
  };

  const prevDeckCard = () => {
    setCardDeckIndex((prev) => (prev - 1 + differentialCards.length) % differentialCards.length);
  };

  /* ── Passos do Como Funciona ── */
  const steps = [
    {
      step: "01",
      title: "Defina as Regras",
      desc: "Escolha o nome da turma, a faixa de valor dos presentes e a data do sorteio em 1 minuto.",
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
      desc: "Com um clique o sorteio acontece. Cada um digita o seu PIN e descobre quem tirou sem spoilers!",
      emoji: "🎉",
      bg: C.mint
    }
  ];

  const scrollHowCarouselTo = (index: number) => {
    setHowStepIndex(index);
    if (howCarouselRef.current) {
      const cardWidth = howCarouselRef.current.clientWidth * 0.85;
      howCarouselRef.current.scrollTo({
        left: index * cardWidth,
        behavior: "smooth"
      });
    }
  };

  /* ── 4 Marcos da Trilha em 'S' ── */
  const pathMilestones = [
    {
      number: "1",
      icon: Shuffle,
      title: "Sem Marmelada & Spoilers",
      desc: "Algoritmo certificado: ninguém tira a si mesmo e ninguém tira duas vezes a mesma pessoa. Sorteio matematicamente justo.",
      color: C.orange,
      badge: "Algoritmo Justo"
    },
    {
      number: "2",
      icon: Gift,
      title: "Lista de Desejos de Presentes",
      desc: "Cada amigo lista 3 coisas que realmente gostaria de ganhar. Acabou o constrangimento de receber presente sem uso!",
      color: C.yellow,
      badge: "Acerte no Presente"
    },
    {
      number: "3",
      icon: MapPin,
      title: "A Festa Conectada",
      desc: "Local da revelação com mapa interativo e rotas diretas de 1 clique para Uber, Waze e Google Maps.",
      color: C.mint,
      badge: "Chegue Fácil"
    },
    {
      number: "4",
      icon: Lock,
      title: "Segredo Absoluto até a Revelação",
      desc: "Nem o criador do grupo sabe quem tirou quem. Protegido por PIN pessoal de 4 dígitos ou Lacre de Cera digital.",
      color: C.sky,
      badge: "Zero Bisbilhotice"
    }
  ];

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
      q: "Qual a diferença entre o Modo Aberto e o Sorteador Relâmpago?",
      a: "O Modo Aberto (Com Cadastro) gera 1 link único para colar no grupo do WhatsApp, com lista de desejos de presentes, local da festa no mapa e PIN de revelação. O Sorteador Relâmpago (Sem Cadastro) é instantâneo: você digita os nomes e despacha envelopes lacrados individuais pelo WhatsApp em 1 minuto sem precisar de conta."
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
      <section className="relative px-4 py-12 md:py-18 max-w-6xl mx-auto">
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
              className={`min-h-[58px] py-4 px-6 text-base sm:text-lg md:text-xl rounded-2xl ${nb.button} w-full shadow-[6px_6px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_#1A1A1A] touch-press leading-tight whitespace-normal text-center`}
              style={{ backgroundColor: C.orange, color: "#fff" }}
            >
              <Gift className="w-6 h-6 mr-2.5 flex-shrink-0" />
              <span>CRIAR MEU AMIGO SECRETO</span>
              <ArrowRight className="w-5 h-5 ml-2.5 flex-shrink-0" />
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

          {/* ═══ TOGGLE INTERATIVO DE MOCKUPS DO HERO (ITEM 1) ═══ */}
          <div className="w-full max-w-4xl pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mb-5">
              <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Veja como seus amigos verão:
              </span>
              <div className="inline-flex p-1 rounded-2xl border-[2px] border-black bg-white dark:bg-zinc-900 shadow-[3px_3px_0px_#1A1A1A]">
                <button
                  type="button"
                  onClick={() => setHeroMockupTab('group')}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                    heroMockupTab === 'group'
                      ? 'bg-[#FFD93D] text-black border-[2px] border-black shadow-[2px_2px_0px_#000]'
                      : 'text-gray-600 dark:text-gray-300 hover:text-black border-[2px] border-transparent'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Modo Grupo (Link Único + PIN)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeroMockupTab('quick')}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                    heroMockupTab === 'quick'
                      ? 'bg-[#FFD93D] text-black border-[2px] border-black shadow-[2px_2px_0px_#000]'
                      : 'text-gray-600 dark:text-gray-300 hover:text-black border-[2px] border-transparent'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                  <span>Modo Relâmpago (Envelopes Lacrados)</span>
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {heroMockupTab === 'group' ? (
                /* ── MOCKUPS DO MODO GRUPO (Com Cadastro) ── */
                <motion.div
                  key="mockup-group"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left"
                >
                  {/* Card 1: Mensagem do WhatsApp no Grupo */}
                  <div 
                    className={`p-6 rounded-3xl ${nb.border} shadow-[8px_8px_0px_#1A1A1A] relative transform md:-rotate-1`}
                    style={{ backgroundColor: C.cardBg }}
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-dashed border-gray-300 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center">
                          <WhatsAppIcon className="w-4 h-4 text-white fill-current" />
                        </div>
                        <span className="font-black text-xs uppercase">No Grupo do WhatsApp</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                        1 Link Para Todos
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border-[2px] border-black bg-[#E7F8EE] font-mono text-xs text-gray-800 space-y-2 leading-relaxed">
                      <p className="font-bold text-black">🎁 *AMIGO SECRETO DA FIRMA 2026* 🎁</p>
                      <p>💰 *Valor:* R$ 50 a R$ 100<br />🎲 *Sorteio:* 18 de Dezembro<br />🎉 *Festa:* 22 de Dezembro às 19h30</p>
                      <p className="text-emerald-700 font-bold">👉 Entre pelo link, cadastre seus presentes e crie seu PIN de 4 dígitos:</p>
                      <p className="underline text-blue-600 break-all font-semibold">reuneapp.com.br/amigo/32/entrar</p>
                    </div>
                  </div>

                  {/* Card 2: Tela Real do Convidado com PIN (SecretSantaJoin.tsx) */}
                  <div 
                    className={`p-6 rounded-3xl ${nb.border} shadow-[8px_8px_0px_#1A1A1A] relative transform md:rotate-1`}
                    style={{ backgroundColor: C.cardBg }}
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-dashed border-gray-300 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#FFD93D] border-[2px] border-black flex items-center justify-center text-xs">
                          🔒
                        </div>
                        <span className="font-black text-xs uppercase">Tela Real do Convidado</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-200 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-300 border border-yellow-300">
                        PIN de 4 Dígitos
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border-[2px] border-black bg-white dark:bg-zinc-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-gray-500">Seu Amigo Sorteado é:</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Sorteio Concluído</span>
                      </div>
                      <h4 className="text-2xl font-black text-[#FF6B35]">Mariana Costa 🤫</h4>
                      <div className="p-2.5 rounded-lg border-[2px] border-black bg-[#FFF8E1] dark:bg-zinc-800 text-xs">
                        <p className="font-bold text-black dark:text-white">🎁 O que ela quer ganhar:</p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">"Livro de ficção científica ou café especial moído"</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* ── MOCKUPS DO MODO RELÂMPAGO (Sem Cadastro) ── */
                <motion.div
                  key="mockup-quick"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left"
                >
                  {/* Card 1: Mensagem Individual no WhatsApp */}
                  <div 
                    className={`p-6 rounded-3xl ${nb.border} shadow-[8px_8px_0px_#1A1A1A] relative transform md:-rotate-1`}
                    style={{ backgroundColor: C.cardBg }}
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-dashed border-gray-300 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center">
                          <WhatsAppIcon className="w-4 h-4 text-white fill-current" />
                        </div>
                        <span className="font-black text-xs uppercase">No WhatsApp de Cada Amigo</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                        Envelope Individual
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border-[2px] border-black bg-[#E7F8EE] font-mono text-xs text-gray-800 space-y-2 leading-relaxed">
                      <p className="font-bold text-black">🎁 *Amigo Secreto: Turma do Churrasco*</p>
                      <p>Olá <strong>Mariana</strong>! Seu envelope secreto do sorteio está pronto e lacrado.</p>
                      <p className="text-emerald-700 font-bold">👉 Toque no seu link exclusivo para romper o lacre e ver quem você tirou:</p>
                      <p className="underline text-blue-600 break-all font-semibold">reuneapp.com.br/envelope/env_8f2a</p>
                      <p className="text-[11px] text-gray-600 italic">🔒 Nem o organizador sabe quem você tirou!</p>
                    </div>
                  </div>

                  {/* Card 2: Tela Real do Envelope Lacrado com Cera (QuickSecretSantaEnvelope.tsx) */}
                  <div 
                    className={`p-6 rounded-3xl ${nb.border} shadow-[8px_8px_0px_#1A1A1A] relative transform md:rotate-1`}
                    style={{ backgroundColor: C.cardBg }}
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-dashed border-gray-300 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#FF4444] border-[2px] border-black flex items-center justify-center text-xs text-white">
                          ✉️
                        </div>
                        <span className="font-black text-xs uppercase">Tela Real do Envelope</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300">
                        Selo de Cera Digital
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border-[2px] border-black bg-white dark:bg-zinc-900 space-y-3 text-center">
                      <div className="inline-block relative">
                        <div className="w-16 h-16 rounded-2xl border-[2px] border-black bg-[#FFF7D6] flex items-center justify-center text-3xl shadow-[3px_3px_0px_#000]">
                          ✉️
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-[2px] border-black bg-[#FF4444] text-white flex items-center justify-center shadow-[1px_1px_0px_#000]">
                          <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-gray-500 block">ENVELOPE LACRADO PARA:</span>
                        <h4 className="text-xl font-black text-black dark:text-white">Mariana</h4>
                      </div>
                      <div className="p-2 rounded-lg border-[2px] border-black bg-[#E2F7EB] text-[11px] text-emerald-950 text-left font-semibold">
                        🛡️ Lacre de Segurança Ativo: detecta violação se alguém xeretar antes!
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ═══ OS DIFERENCIAIS: PILHA DE CARTAS INTERATIVA (ITEM 2) ═══ */}
      <section className="py-12 md:py-20 px-4 relative border-y-[3px] border-black" style={{ backgroundColor: C.sectionBg }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div 
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full ${nb.border} shadow-[3px_3px_0px_#1A1A1A] mb-3 font-black text-xs uppercase`}
              style={{ backgroundColor: C.pink, color: C.black }}
            >
              <Layers className="w-4 h-4" />
              <span>O Grande Diferencial</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-3">
              Formatos pensados para a sua realidade.
            </h2>
            <p className="text-sm md:text-base font-bold" style={{ color: C.textMuted }}>
              Deslize a carta para os lados para explorar as opções e escolher a melhor para o seu grupo.
            </p>
          </div>

          {/* PILHA DE CARTAS NEOBRUTALISTA COM FRAMER MOTION */}
          <div className="relative w-full max-w-lg mx-auto min-h-[430px] sm:min-h-[400px] flex items-center justify-center">
            {differentialCards.map((card, idx) => {
              // Cálculo da posição no deck empilhado
              const offset = (idx - cardDeckIndex + differentialCards.length) % differentialCards.length;
              const isTop = offset === 0;
              const isSecond = offset === 1;
              const isThird = offset === 2;

              if (offset > 2) return null;

              return (
                <motion.div
                  key={card.id}
                  drag={isTop ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.65}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -70) {
                      nextDeckCard();
                    } else if (info.offset.x > 70) {
                      prevDeckCard();
                    }
                  }}
                  animate={{
                    scale: isTop ? 1 : isSecond ? 0.94 : 0.88,
                    y: isTop ? 0 : isSecond ? 14 : 26,
                    rotate: isTop ? 0 : isSecond ? 2.5 : -2.5,
                    zIndex: isTop ? 30 : isSecond ? 20 : 10,
                    opacity: isTop ? 1 : isSecond ? 0.85 : 0.5,
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={`absolute inset-x-0 top-0 p-5 sm:p-7 rounded-3xl ${nb.border} shadow-[8px_8px_0px_#1A1A1A] flex flex-col justify-between select-none ${
                    isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
                  }`}
                  style={{ backgroundColor: card.cardBg }}
                >
                  <div className="space-y-3 sm:space-y-4">
                    {/* Header do Card */}
                    <div className="flex items-center justify-between">
                      <div 
                        className={`w-12 h-12 rounded-2xl ${nb.border} flex items-center justify-center text-2xl shadow-[3px_3px_0px_#1A1A1A]`}
                        style={{ backgroundColor: card.iconBg }}
                      >
                        {card.icon}
                      </div>
                      <span 
                        className="px-2.5 py-1 rounded-full border-[2px] border-black font-black text-[11px] sm:text-xs uppercase shadow-[2px_2px_0px_#000]"
                        style={{ backgroundColor: card.tagBg, color: C.black }}
                      >
                        {card.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl sm:text-2xl font-black">{card.title}</h3>
                      <p className="text-xs font-bold text-[#FF6B35] mt-0.5">{card.subtitle}</p>
                    </div>

                    <p className="font-medium text-xs sm:text-sm leading-relaxed" style={{ color: C.textMuted }}>
                      {card.description}
                    </p>

                    <ul className="space-y-1.5 text-xs font-bold pt-1">
                      {card.benefits.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-5">
                    <Button
                      onClick={card.action}
                      className={`w-full h-12 rounded-xl ${nb.button} font-black text-xs shadow-[3px_3px_0px_#000]`}
                      style={{ backgroundColor: card.accentColor, color: C.black }}
                    >
                      {card.buttonLabel}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Controles da Pilha de Cartas */}
          <div className="flex flex-col items-center justify-center gap-3 mt-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={prevDeckCard}
                className={`w-11 h-11 rounded-xl ${nb.border} shadow-[3px_3px_0px_#1A1A1A] flex items-center justify-center font-black transition-all hover:translate-x-[1px] hover:translate-y-[1px]`}
                style={{ backgroundColor: C.yellow, color: C.black }}
                title="Carta Anterior"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Indicadores de bolinha */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border-[2px] border-black bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_#000]">
                {differentialCards.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCardDeckIndex(i)}
                    className={`h-2.5 rounded-full transition-all ${
                      cardDeckIndex === i ? "w-7 bg-black dark:bg-white" : "w-2.5 bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={nextDeckCard}
                className={`w-11 h-11 rounded-xl ${nb.border} shadow-[3px_3px_0px_#1A1A1A] flex items-center justify-center font-black transition-all hover:translate-x-[1px] hover:translate-y-[1px]`}
                style={{ backgroundColor: C.yellow, color: C.black }}
                title="Próxima Carta"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <p className="text-[11px] font-black uppercase text-gray-500 tracking-wider">
              👉 Deslize a carta para os lados ou use as setas
            </p>
          </div>
        </div>
      </section>

      {/* ═══ COMO FUNCIONA: HORIZONTALIDADE & ECONOMIA DE SCROLL (ITEM 3) ═══ */}
      <section className="py-16 md:py-24 px-4 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div 
            className={`inline-flex items-center px-4 py-1.5 rounded-full ${nb.border} shadow-[3px_3px_0px_#1A1A1A] mb-3 font-black text-xs uppercase`}
            style={{ backgroundColor: C.yellow, color: C.black }}
          >
            Simples Demais
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-3">
            Como funciona em 3 passos
          </h2>
          <p className="text-sm md:text-base font-bold" style={{ color: C.textMuted }}>
            Você cria o evento em minutos e a plataforma cuida de todo o resto.
          </p>
        </div>

        {/* ── VERSÃO DESKTOP: 3 Cards Horizontais com Setas Conectoras ── */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {steps.map((item, idx) => (
            <div key={idx} className="flex-1 flex items-center gap-3">
              <div
                className={`flex-1 p-6 lg:p-7 rounded-3xl ${nb.border} shadow-[6px_6px_0px_#1A1A1A] relative flex flex-col justify-between min-h-[260px]`}
                style={{ backgroundColor: C.cardBg }}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div 
                      className={`w-12 h-12 rounded-2xl ${nb.border} flex items-center justify-center text-2xl shadow-[2px_2px_0px_#1A1A1A]`}
                      style={{ backgroundColor: item.bg }}
                    >
                      {item.emoji}
                    </div>
                    <span className="font-black text-3xl opacity-25">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-black mb-2">{item.title}</h3>
                  <p className="text-xs font-medium leading-relaxed" style={{ color: C.textMuted }}>
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Seta conectora entre os cards (exceto no último) */}
              {idx < steps.length - 1 && (
                <div className="w-9 h-9 rounded-full border-[2px] border-black bg-[#FFD93D] flex items-center justify-center shadow-[2px_2px_0px_#000] flex-shrink-0 transform rotate-0">
                  <ArrowRight className="w-5 h-5 text-black stroke-[3]" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── VERSÃO MOBILE: Carrossel Snap Horizontal (Economiza 450px de Scroll Vertical) ── */}
        <div className="block md:hidden">
          <div 
            ref={howCarouselRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 px-2 scrollbar-none"
            onScroll={(e) => {
              const el = e.currentTarget;
              const cardW = el.clientWidth * 0.82;
              const idx = Math.round(el.scrollLeft / cardW);
              if (idx >= 0 && idx < steps.length && idx !== howStepIndex) {
                setHowStepIndex(idx);
              }
            }}
          >
            {steps.map((item, idx) => (
              <div
                key={idx}
                className={`w-[82vw] max-w-[320px] shrink-0 snap-center p-6 rounded-3xl ${nb.border} shadow-[6px_6px_0px_#1A1A1A] flex flex-col justify-between min-h-[240px]`}
                style={{ backgroundColor: C.cardBg }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className={`w-12 h-12 rounded-2xl ${nb.border} flex items-center justify-center text-2xl shadow-[2px_2px_0px_#1A1A1A]`}
                      style={{ backgroundColor: item.bg }}
                    >
                      {item.emoji}
                    </div>
                    <span className="font-black text-3xl opacity-30">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-black mb-1.5">{item.title}</h3>
                  <p className="text-xs font-medium leading-relaxed" style={{ color: C.textMuted }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Indicador de Bolinhas do Carrossel Mobile */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollHowCarouselTo(i)}
                className={`h-2.5 rounded-full transition-all ${
                  howStepIndex === i ? "w-6 bg-black dark:bg-white" : "w-2.5 bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>
          <p className="text-center text-[10px] font-black uppercase text-gray-500 tracking-wider mt-2">
            👉 Deslize horizontalmente para ver os 3 passos
          </p>
        </div>
      </section>

      {/* ═══ POR QUE ABANDONAR O PAPELZINHO: TRILHA SINUOSA EM 'S' (ITEM 4) ═══ */}
      <section className="py-16 md:py-24 px-4 border-t-[3px] border-black" style={{ backgroundColor: C.sectionBg }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-5xl font-black mb-3">
              Por que abandonar o papelzinho?
            </h2>
            <p className="text-sm md:text-base font-bold" style={{ color: C.textMuted }}>
              Siga a jornada e veja os problemas clássicos que o ReUNE resolve de uma vez por todas.
            </p>
          </div>

          {/* ── TRILHA EM 'S' NO DESKTOP (Alternada com Linha Central) ── */}
          <div className="hidden md:block relative py-4">
            {/* Linha Vertical Tracejada no Centro */}
            <div className="absolute top-8 bottom-8 left-1/2 -translate-x-1/2 w-1 border-r-[3px] border-dashed border-black/40 dark:border-white/40 pointer-events-none" />

            <div className="space-y-12 relative">
              {pathMilestones.map((m, idx) => {
                const isLeft = idx % 2 === 0;

                return (
                  <div key={idx} className="flex items-center justify-between gap-8 relative">
                    {/* Lado Esquerdo */}
                    <div className="w-1/2 flex justify-end">
                      {isLeft && (
                        <div 
                          className={`w-full max-w-sm p-6 rounded-3xl ${nb.border} shadow-[6px_6px_0px_#1A1A1A] space-y-2`}
                          style={{ backgroundColor: C.cardBg }}
                        >
                          <span 
                            className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-black inline-block shadow-[1px_1px_0px_#000]"
                            style={{ backgroundColor: m.color, color: C.black }}
                          >
                            {m.badge}
                          </span>
                          <h3 className="text-lg font-black">{m.title}</h3>
                          <p className="text-xs font-semibold leading-relaxed" style={{ color: C.textMuted }}>
                            {m.desc}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Nó Central Numerado com Linha Conectora */}
                    <div 
                      className={`w-14 h-14 rounded-full ${nb.border} flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_#1A1A1A] z-10 flex-shrink-0 transition-transform hover:scale-110`}
                      style={{ backgroundColor: m.color, color: C.black }}
                    >
                      <m.icon className="w-6 h-6 stroke-[2.5]" />
                    </div>

                    {/* Lado Direito */}
                    <div className="w-1/2 flex justify-start">
                      {!isLeft && (
                        <div 
                          className={`w-full max-w-sm p-6 rounded-3xl ${nb.border} shadow-[6px_6px_0px_#1A1A1A] space-y-2`}
                          style={{ backgroundColor: C.cardBg }}
                        >
                          <span 
                            className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-black inline-block shadow-[1px_1px_0px_#000]"
                            style={{ backgroundColor: m.color, color: C.black }}
                          >
                            {m.badge}
                          </span>
                          <h3 className="text-lg font-black">{m.title}</h3>
                          <p className="text-xs font-semibold leading-relaxed" style={{ color: C.textMuted }}>
                            {m.desc}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── TRILHA EM 'S' NO MOBILE (Timeline com Linha Lateral e Nós Coloridos) ── */}
          <div className="block md:hidden relative pl-6">
            {/* Linha Lateral Tracejada */}
            <div className="absolute top-4 bottom-4 left-6 w-1 border-r-[3px] border-dashed border-black/40 dark:border-white/40 pointer-events-none" />

            <div className="space-y-6 relative">
              {pathMilestones.map((m, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  {/* Nó Numerado Lateral */}
                  <div 
                    className={`w-11 h-11 rounded-2xl ${nb.border} flex items-center justify-center font-black text-base shadow-[3px_3px_0px_#1A1A1A] z-10 flex-shrink-0 mt-2`}
                    style={{ backgroundColor: m.color, color: C.black }}
                  >
                    <m.icon className="w-5 h-5 stroke-[2.5]" />
                  </div>

                  {/* Card do Marco */}
                  <div 
                    className={`flex-1 p-5 rounded-2xl ${nb.border} shadow-[4px_4px_0px_#1A1A1A] space-y-1.5`}
                    style={{ backgroundColor: C.cardBg }}
                  >
                    <span 
                      className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-black inline-block"
                      style={{ backgroundColor: m.color, color: C.black }}
                    >
                      {m.badge}
                    </span>
                    <h3 className="text-base font-black">{m.title}</h3>
                    <p className="text-xs font-medium leading-relaxed" style={{ color: C.textMuted }}>
                      {m.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CASOS DE USO & CÍRCULOS MODERNOS ═══ */}
      <section className="py-16 md:py-24 px-4 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div 
            className={`inline-flex items-center px-4 py-1.5 rounded-full ${nb.border} shadow-[3px_3px_0px_#1A1A1A] mb-3 font-black text-xs uppercase`}
            style={{ backgroundColor: C.lavender, color: C.black }}
          >
            Seu Grupo, Suas Regras
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-3">
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
      <section className="py-16 md:py-24 px-4 border-t-[3px] border-black" style={{ backgroundColor: C.sectionBg }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
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

      {/* ═══ CTA FINAL: CORREÇÃO DE DIAGRAMAÇÃO E BOTÃO SEM TRUNCAMENTO (ITEM 5) ═══ */}
      <section className="py-16 md:py-24 px-4 text-center max-w-4xl mx-auto mb-16 md:mb-0">
        <div 
          className={`p-6 sm:p-10 md:p-14 rounded-3xl ${nb.border} shadow-[10px_10px_0px_#1A1A1A] space-y-6`}
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

          <div className="pt-2 flex flex-col items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={handleStartClick}
              disabled={authLoading}
              className={`min-h-[58px] py-4 px-4 sm:px-8 text-sm sm:text-base md:text-xl rounded-2xl ${nb.button} bg-black hover:bg-gray-800 text-white shadow-[6px_6px_0px_#FFF] w-full max-w-md mx-auto whitespace-normal leading-snug flex items-center justify-center gap-2.5 touch-press`}
            >
              <Sparkles className="w-5 h-5 text-[#FFD93D] flex-shrink-0" />
              <span className="font-black text-center">CRIAR MEU AMIGO SECRETO GRÁTIS</span>
            </Button>

            <button
              type="button"
              onClick={() => navigate('/amigo-secreto/rapido')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black underline text-black hover:text-gray-800 transition-colors pt-1"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>Quer praticidade imediata? Sorteie sem cadastro em 1 minuto ➔</span>
            </button>
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
