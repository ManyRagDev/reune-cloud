import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
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
    Menu,
    Moon,
    Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/landing/Footer";
import videoAtual from "@/assets/video_atual.mp4";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NBLight, NBDark, NBPalette, nb } from "@/lib/neobrutalism";
import { MarqueeStrip } from "@/components/landing/MarqueeStrip";

export default function LandingV3() {
    const navigate = useNavigate();

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
    }, [isDark]);

    /** Active palette — all color refs use this */
    const C: NBPalette = isDark ? NBDark : NBLight;

    const handlePricingClick = (e: React.MouseEvent) => {
        e.preventDefault();
        toast.success("Comece de graça, sem compromisso.", {
            description: "Teste o ReUNE com tudo liberado. Sem cartão.",
            duration: 5000,
        });
    };

    const features = [
        {
            icon: Sparkles,
            title: "IA que Entende Você",
            description:
                "Fala o que precisa em linguagem normal e a UNE.AI monta tudo: lista, quantidade, convidados.",
            bg: C.yellow,
        },
        {
            icon: Users,
            title: "Controle de Convidados",
            description:
                "Confirmações automáticas, lembretes e acompanhamento em tempo real. Sem ficar cobrando ninguém.",
            bg: C.sky,
        },
        {
            icon: DollarSign,
            title: "Racha a Conta",
            description:
                "Calcula quanto cada um paga e divide tudo certinho. Sem dor de cabeça.",
            bg: C.mint,
        },
        {
            icon: Calendar,
            title: "Templates Prontos",
            description:
                "Churrasco, jantar, aniversário... Modelos prontos pra começar em segundos.",
            bg: C.pink,
        },
        {
            icon: MessageSquare,
            title: "Avisa Todo Mundo",
            description:
                "E-mail automático pros convidados. Você não precisa ficar mandando mensagem.",
            bg: C.lavender,
        },
        {
            icon: Smartphone,
            title: "Funciona em Tudo",
            description:
                "Celular, tablet, PC — funciona em qualquer lugar, a qualquer hora.",
            bg: C.orange,
        },
    ];

    const benefits = [
        "Planejamento em minutos, não horas",
        "Sabe quem confirmou sem precisar perguntar",
        "Divide a conta sem constrangimento",
        "Templates pra cada tipo de evento",
        "Funciona no celular, tablet ou PC",
    ];

    /** Icon color on colored backgrounds — ensure readability */
    const iconColor = isDark ? "#F5F0E8" : "#1A1A1A";

    return (
        <div
            className="min-h-screen overflow-hidden transition-colors duration-300"
            style={{ backgroundColor: C.bg, color: C.text }}
        >
            {/* ═══════════════════════════════════════════
          NAVBAR — Full-width, colada ao topo
      ═══════════════════════════════════════════ */}
            <nav
                className={`sticky top-0 z-50 px-4 md:px-8 py-3 ${nb.border} border-t-0 border-x-0 flex items-center justify-between transition-colors duration-300`}
                style={{ backgroundColor: C.bg }}
            >
                {/* Logo block */}
                <div className="flex items-center gap-4">
                    <div
                        className={`px-4 py-2 rounded-lg ${nb.border} ${nb.shadow} font-black text-xl transition-colors duration-300`}
                        style={{ backgroundColor: C.orange, color: "#FFFDF7" }}
                    >
                        ReUNE
                    </div>
                </div>

                {/* Desktop nav — tag-style items */}
                <div className="hidden md:flex items-center gap-3">
                    {[
                        { label: "Recursos", href: "#features" },
                        { label: "Como Funciona", href: "#how-it-works" },
                        { label: "Preços", href: "#pricing", onClick: handlePricingClick },
                    ].map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            onClick={item.onClick}
                            className={`px-4 py-2 rounded-lg ${nb.border} ${nb.shadow} ${nb.hover} font-bold text-sm cursor-pointer transition-colors duration-300`}
                            style={{ backgroundColor: C.sectionBg, color: C.text }}
                        >
                            {item.label}
                        </a>
                    ))}

                    {/* Theme toggle — integrated in navbar */}
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className={`p-2 rounded-lg ${nb.border} ${nb.shadow} ${nb.hover} transition-colors duration-300`}
                        style={{ backgroundColor: isDark ? C.yellow : C.lavender, color: C.black }}
                        aria-label="Alternar tema"
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={() => navigate("/app")}
                        className={`px-5 py-2 rounded-lg ${nb.border} ${nb.shadow} ${nb.hover} font-black text-sm flex items-center gap-2 transition-colors duration-300`}
                        style={{ backgroundColor: C.yellow, color: C.black }}
                    >
                        Entrar <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Mobile menu */}
                <div className="flex md:hidden items-center gap-2">
                    {/* Mobile theme toggle */}
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className={`p-2 rounded-lg ${nb.border} ${nb.shadow} ${nb.hover} transition-colors duration-300`}
                        style={{ backgroundColor: isDark ? C.yellow : C.lavender, color: C.black }}
                        aria-label="Alternar tema"
                    >
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <div className="flex flex-col gap-4 mt-8">
                                <a href="#features" className="text-lg font-bold hover:underline">
                                    Recursos
                                </a>
                                <a href="#how-it-works" className="text-lg font-bold hover:underline">
                                    Como Funciona
                                </a>
                                <a
                                    href="#pricing"
                                    onClick={handlePricingClick}
                                    className="text-lg font-bold hover:underline cursor-pointer"
                                >
                                    Preços
                                </a>
                                <button
                                    onClick={() => navigate("/app")}
                                    className={`w-full mt-4 py-3 rounded-lg ${nb.border} ${nb.shadow} font-black flex items-center justify-center gap-2`}
                                    style={{ backgroundColor: C.orange, color: "#FFFDF7" }}
                                >
                                    Entrar no App <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </nav>

            {/* ═══════════════════════════════════════════
          HERO — Asymmetric layout
      ═══════════════════════════════════════════ */}
            <section className="relative px-4 md:px-8 pt-12 md:pt-20 pb-8 md:pb-16 overflow-hidden">
                {/* Decorative floating shapes */}
                <motion.div
                    animate={{ rotate: [0, 10, 0], y: [0, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className={`hidden md:block absolute top-16 right-[15%] w-20 h-20 rounded-full ${nb.border}`}
                    style={{ backgroundColor: C.pink }}
                />
                <motion.div
                    animate={{ rotate: [0, -8, 0], y: [0, 8, 0] }}
                    transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                    className={`hidden md:block absolute bottom-24 right-[10%] w-14 h-14 ${nb.border}`}
                    style={{ backgroundColor: C.sky }}
                />
                <motion.div
                    animate={{ rotate: [12, -5, 12] }}
                    transition={{ duration: 7, repeat: Infinity }}
                    className={`hidden md:block absolute top-40 right-[8%] w-10 h-10 rounded-full ${nb.border}`}
                    style={{ backgroundColor: C.yellow }}
                />

                <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-8 md:gap-12 items-center">
                    {/* Left — Text content (3 cols) */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="md:col-span-3 space-y-6"
                    >
                        {/* AI Badge */}
                        <div
                            className={`inline-flex items-center px-4 py-2 rounded-lg ${nb.border} ${nb.shadow} text-sm font-bold transition-colors duration-300`}
                            style={{ backgroundColor: C.sectionBg, color: C.text }}
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Powered by UNE.AI
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-8xl font-black leading-[0.95] tracking-tight">
                            Evento bom
                            <br />
                            é evento que{" "}
                            <span className="relative inline-block">
                                <span style={{ color: C.orange }}>não dá</span>
                                <div
                                    className="absolute -bottom-1 left-0 right-0 h-4 -z-10"
                                    style={{ backgroundColor: C.yellow }}
                                />
                            </span>
                            <br />
                            <span style={{ color: C.orange }}>trabalho.</span>
                        </h1>

                        <p
                            className="text-lg md:text-xl max-w-xl leading-relaxed font-medium"
                            style={{ color: C.textMuted, opacity: 0.85 }}
                        >
                            Fala o que precisa, a IA organiza tudo. Churrasco, jantar,
                            festa — do zero ao pronto em minutos.
                        </p>

                        {/* CTAs — stacked left */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={() => navigate("/app")}
                                className={`group h-14 px-8 text-lg font-black rounded-xl ${nb.border} ${nb.shadowLg} ${nb.hover} flex items-center justify-center gap-2 transition-colors duration-300`}
                                style={{ backgroundColor: C.orange, color: "#FFFDF7" }}
                            >
                                Testar grátis
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() =>
                                    document
                                        .getElementById("demo")
                                        ?.scrollIntoView({ behavior: "smooth" })
                                }
                                className={`h-14 px-8 text-lg font-bold rounded-xl ${nb.border} ${nb.shadow} ${nb.hover} flex items-center justify-center gap-2 transition-colors duration-300`}
                                style={{ backgroundColor: C.cardBg, color: C.text }}
                            >
                                Ver demo ↓
                            </button>
                        </div>
                    </motion.div>

                    {/* Right — Sticker card (2 cols) */}
                    <motion.div
                        initial={{ opacity: 0, rotate: 6, scale: 0.9 }}
                        animate={{ opacity: 1, rotate: 3, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="md:col-span-2 flex justify-center"
                    >
                        <div
                            className={`relative w-full max-w-sm p-6 md:p-8 rounded-2xl ${nb.border} ${nb.shadowXl} rotate-2 transition-colors duration-300`}
                            style={{ backgroundColor: C.yellow }}
                        >
                            {/* Sticker overlapping */}
                            <motion.div
                                initial={{ rotate: -12, scale: 0 }}
                                animate={{ rotate: -12, scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.6, type: "spring" }}
                                className={`absolute -top-5 -right-5 px-4 py-2 rounded-lg ${nb.border} ${nb.shadow} font-black text-sm z-10`}
                                style={{ backgroundColor: C.mint, color: C.black }}
                            >
                                <Zap className="w-4 h-4 inline mr-1" />
                                TESTE GRÁTIS
                            </motion.div>

                            <div className="space-y-4">
                                {[
                                    { v: "< 30s", l: "Pra criar um evento", emoji: "⚡" },
                                    { v: "24/7", l: "IA sempre disponível", emoji: "🤖" },
                                    { v: "Zero", l: "Complicação", emoji: "✨" },
                                    { v: "Grátis", l: "Pra testar agora", emoji: "🎉" },
                                ].map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.1 }}
                                        className={`flex items-center gap-4 p-3 rounded-xl ${nb.border} ${nb.shadow} transition-colors duration-300`}
                                        style={{ backgroundColor: C.cardBg }}
                                    >
                                        <span className="text-2xl">{stat.emoji}</span>
                                        <div>
                                            <div className="font-black text-xl" style={{ color: C.orange }}>
                                                {stat.v}
                                            </div>
                                            <div className="text-sm font-bold" style={{ color: C.textMuted, opacity: 0.7 }}>
                                                {stat.l}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
          MARQUEE STRIP #1
      ═══════════════════════════════════════════ */}
            <MarqueeStrip
                texts={[
                    "SEM TRABALHO",
                    "IA INTELIGENTE",
                    "CHURRASCO",
                    "FESTA",
                    "ANIVERSÁRIO",
                    "SEM PLANILHA",
                    "SEM ESTRESSE",
                ]}
                bg={C.yellow}
                textColor={C.black}
            />

            {/* ═══════════════════════════════════════════
          DEMO VIDEO — Rotated container
      ═══════════════════════════════════════════ */}
            <section id="demo" className="py-16 md:py-24 px-4 md:px-8 relative">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-8 md:mb-12"
                    >
                        <h2 className="text-3xl md:text-5xl font-black">
                            Do caos ao "tá pronto"{" "}
                            <span style={{ color: C.orange }}>em 30 segundos</span>
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, rotate: -3 }}
                        whileInView={{ opacity: 1, rotate: -1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative max-w-3xl mx-auto"
                    >
                        {/* Sticker label */}
                        <div
                            className={`absolute -top-4 -left-3 md:-left-6 z-10 px-4 py-2 rounded-lg ${nb.border} ${nb.shadow} font-black text-sm rotate-[-6deg]`}
                            style={{ backgroundColor: C.pink, color: "#FFFDF7" }}
                        >
                            ▶ Veja em Ação
                        </div>

                        <div
                            className={`rounded-xl overflow-hidden ${nb.border} ${nb.shadowLg} p-3 transition-colors duration-300`}
                            style={{ backgroundColor: C.sectionBg }}
                        >
                            <video
                                ref={(el) => {
                                    if (el) {
                                        el.load();
                                        el.pause();
                                    }
                                }}
                                src={videoAtual}
                                className="w-full h-full object-cover rounded-lg"
                                controls
                                preload="auto"
                                muted
                            >
                                Seu navegador não suporta o elemento de vídeo.
                            </video>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
          FEATURES — Bento Grid
      ═══════════════════════════════════════════ */}
            <section
                id="features"
                className="py-16 md:py-24 px-4 md:px-8 transition-colors duration-300"
                style={{ backgroundColor: C.sectionBg }}
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-12 md:mb-16"
                    >
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div>
                                <div
                                    className={`inline-flex items-center px-4 py-2 rounded-lg ${nb.border} ${nb.shadow} text-sm font-bold mb-4`}
                                    style={{ backgroundColor: C.yellow, color: C.black }}
                                >
                                    ✦ Recursos Completos
                                </div>
                                <h2 className="text-3xl md:text-6xl font-black leading-tight">
                                    Tudo que você
                                    <br />
                                    <span style={{ color: C.orange }}>precisa.</span>
                                </h2>
                            </div>
                            <p className="text-lg font-medium max-w-md" style={{ color: C.textMuted, opacity: 0.7 }}>
                                Ferramentas que fazem o trabalho pesado pra você.
                                Simples, rápido e sem frescura.
                            </p>
                        </div>
                    </motion.div>

                    {/* Bento Grid: first card big, rest smaller */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-5">
                        {features.map((feature, index) => {
                            const isFirst = index === 0;
                            const rotations = [0, 1, -1, 0.5, -0.5, 1];
                            const rot = rotations[index] || 0;

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30, rotate: rot * 2 }}
                                    whileInView={{ opacity: 1, y: 0, rotate: rot }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.08 }}
                                    whileHover={{ rotate: 0, scale: 1.02 }}
                                    className={`relative p-6 md:p-8 rounded-2xl ${nb.border} ${nb.shadowLg} ${nb.hover} cursor-default transition-colors duration-300 ${isFirst
                                        ? "md:col-span-4 md:row-span-2"
                                        : index < 3
                                            ? "md:col-span-2"
                                            : "md:col-span-2"
                                        }`}
                                    style={{ backgroundColor: C.cardBg }}
                                >
                                    {/* Icon */}
                                    <div
                                        className={`${isFirst ? "w-20 h-20 mb-6" : "w-14 h-14 mb-4"
                                            } rounded-xl ${nb.border} flex items-center justify-center`}
                                        style={{ backgroundColor: feature.bg }}
                                    >
                                        <feature.icon
                                            className={isFirst ? "w-10 h-10" : "w-7 h-7"}
                                            color={iconColor}
                                        />
                                    </div>

                                    <h3
                                        className={`${isFirst
                                            ? "text-2xl md:text-4xl"
                                            : "text-xl md:text-2xl"
                                            } font-black mb-3`}
                                    >
                                        {feature.title}
                                    </h3>
                                    <p
                                        className={`${isFirst ? "text-base md:text-lg" : "text-sm md:text-base"
                                            } leading-relaxed font-medium`}
                                        style={{ color: C.textMuted, opacity: 0.75 }}
                                    >
                                        {feature.description}
                                    </p>

                                    {/* Decorative corner shape on first card */}
                                    {isFirst && (
                                        <div
                                            className={`hidden md:block absolute bottom-6 right-6 w-24 h-24 rounded-full ${nb.border} opacity-20`}
                                            style={{ backgroundColor: feature.bg }}
                                        />
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
          MARQUEE STRIP #2
      ═══════════════════════════════════════════ */}
            <MarqueeStrip
                texts={[
                    "SIMPLES",
                    "RÁPIDO",
                    "INTELIGENTE",
                    "PODEROSO",
                    "PRÁTICO",
                    "MODERNO",
                ]}
                bg={C.orange}
                textColor="#FFFDF7"
                speed={15}
            />

            {/* ═══════════════════════════════════════════
          HOW IT WORKS — Horizontal cards with giant numbers
      ═══════════════════════════════════════════ */}
            <section id="how-it-works" className="py-16 md:py-28 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12 md:mb-20"
                    >
                        <div
                            className={`inline-flex items-center px-4 py-2 rounded-lg ${nb.border} ${nb.shadow} text-sm font-bold mb-6`}
                            style={{ backgroundColor: C.pink, color: "#FFFDF7" }}
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Simples e Rápido
                        </div>
                        <h2 className="text-3xl md:text-6xl font-black">
                            3 passos pro seu{" "}
                            <span style={{ color: C.orange }}>evento sair do papel</span>
                        </h2>
                    </motion.div>

                    {/* Horizontal steps with giant bg numbers */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            {
                                num: "01",
                                title: "Conta pra IA",
                                desc: "Diga 'Churrasco pra 20 pessoas sábado às 14h' e a IA entende tudo.",
                                bg: C.yellow,
                                rot: -1,
                            },
                            {
                                num: "02",
                                title: "Ela monta tudo",
                                desc: "Lista de compras, quantidades, cardápio, divisão de tarefas — tudo em segundos.",
                                bg: C.sky,
                                rot: 1,
                            },
                            {
                                num: "03",
                                title: "Convida e curte",
                                desc: "Manda os convites, acompanha quem confirmou e racha a conta — tudo no automático.",
                                bg: C.mint,
                                rot: -0.5,
                            },
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 40, rotate: step.rot * 2 }}
                                whileInView={{ opacity: 1, y: 0, rotate: step.rot }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.15 }}
                                whileHover={{ rotate: 0, y: -4 }}
                                className={`relative overflow-hidden p-6 md:p-8 rounded-2xl ${nb.border} ${nb.shadowLg}`}
                                style={{ backgroundColor: step.bg }}
                            >
                                {/* Giant background number */}
                                <div
                                    className="absolute -top-6 -right-4 text-[8rem] md:text-[10rem] font-black leading-none opacity-15 select-none pointer-events-none"
                                    style={{ color: C.black }}
                                >
                                    {step.num}
                                </div>

                                <div className="relative z-10">
                                    <div
                                        className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${nb.border} ${nb.shadow} font-black text-lg mb-4`}
                                        style={{ backgroundColor: C.cardBg, color: C.text }}
                                    >
                                        {step.num}
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-black mb-3" style={{ color: C.black }}>
                                        {step.title}
                                    </h3>
                                    <p className="text-base font-medium leading-relaxed" style={{ color: C.black, opacity: 0.8 }}>
                                        {step.desc}
                                    </p>
                                </div>

                                {/* Arrow connector on desktop */}
                                {i < 2 && (
                                    <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20">
                                        <div
                                            className={`w-8 h-8 rounded-full ${nb.border} flex items-center justify-center`}
                                            style={{ backgroundColor: C.cardBg }}
                                        >
                                            <ArrowRight className="w-4 h-4" style={{ color: C.text }} />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
          BENEFITS — Stacked stickers + overlap card
      ═══════════════════════════════════════════ */}
            <section
                className="py-16 md:py-28 px-4 md:px-8 transition-colors duration-300"
                style={{ backgroundColor: C.sectionBg }}
            >
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-5 gap-8 md:gap-12 items-center">
                        {/* Left (3 cols) — Content + sticker checklist */}
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="lg:col-span-3"
                        >
                            <div
                                className={`inline-flex items-center px-4 py-2 rounded-lg ${nb.border} ${nb.shadow} text-sm font-bold mb-6`}
                                style={{ backgroundColor: C.mint, color: C.black }}
                            >
                                <Shield className="w-4 h-4 mr-2" />
                                Por que usar
                            </div>
                            <h2 className="text-3xl md:text-6xl font-black mb-4">
                                Menos estresse.
                                <br />
                                <span style={{ color: C.orange }}>Mais festa.</span>
                            </h2>
                            <p className="text-lg font-medium mb-8 max-w-lg" style={{ color: C.textMuted, opacity: 0.7 }}>
                                Chega de planilha, grupo no WhatsApp e anotação em
                                guardanapo. A IA cuida da parte chata.
                            </p>

                            {/* Sticker-style checklist with micro-rotations */}
                            <div className="space-y-3">
                                {benefits.map((benefit, index) => {
                                    const rotations = [-0.5, 0.3, -0.4, 0.6, -0.2];
                                    return (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -30, rotate: rotations[index] * 3 }}
                                            whileInView={{
                                                opacity: 1,
                                                x: 0,
                                                rotate: rotations[index],
                                            }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.08 }}
                                            whileHover={{ rotate: 0, x: 4 }}
                                            className={`flex items-center gap-4 p-4 rounded-xl ${nb.border} ${nb.shadow} cursor-default transition-colors duration-300`}
                                            style={{ backgroundColor: C.cardBg }}
                                        >
                                            <div
                                                className={`flex-shrink-0 w-8 h-8 rounded-lg ${nb.border} flex items-center justify-center`}
                                                style={{ backgroundColor: C.mint }}
                                            >
                                                <Check className="w-5 h-5" strokeWidth={3} color={C.black} />
                                            </div>
                                            <span className="text-base md:text-lg font-bold">
                                                {benefit}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Right (2 cols) — Overlapping visual */}
                        <motion.div
                            initial={{ opacity: 0, x: 40, rotate: 3 }}
                            whileInView={{ opacity: 1, x: 0, rotate: 2 }}
                            viewport={{ once: true }}
                            className="lg:col-span-2 relative"
                        >
                            {/* Main card */}
                            <div
                                className={`relative p-8 md:p-12 rounded-2xl ${nb.border} ${nb.shadowXl}`}
                                style={{ backgroundColor: C.yellow }}
                            >
                                <div className="text-center">
                                    <div className="text-6xl md:text-8xl font-black mb-2" style={{ color: C.black }}>
                                        Minutos
                                    </div>
                                    <div
                                        className={`inline-block px-6 py-3 rounded-xl ${nb.border} ${nb.shadow} mb-4 transition-colors duration-300`}
                                        style={{ backgroundColor: C.cardBg }}
                                    >
                                        <p className="text-xl md:text-2xl font-black">Não Horas</p>
                                    </div>
                                    <p className="text-sm font-bold mt-2" style={{ color: C.black, opacity: 0.6 }}>
                                        Nossa promessa pra você
                                    </p>
                                </div>

                                {/* Overlapping sticker */}
                                <motion.div
                                    initial={{ rotate: 12, scale: 0 }}
                                    whileInView={{ rotate: 12, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3, type: "spring" }}
                                    className={`absolute -bottom-5 -right-5 px-5 py-3 rounded-xl ${nb.border} ${nb.shadow} font-black`}
                                    style={{ backgroundColor: C.pink, color: "#FFFDF7" }}
                                >
                                    🚀 Sem complicação!
                                </motion.div>
                            </div>

                            {/* Background decorative card */}
                            <div
                                className={`absolute -z-10 inset-2 md:inset-4 rounded-2xl ${nb.border}`}
                                style={{ backgroundColor: C.orange, opacity: 0.3 }}
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
          MARQUEE STRIP #3
      ═══════════════════════════════════════════ */}
            <MarqueeStrip
                texts={[
                    "COMECE AGORA",
                    "TESTE GRÁTIS",
                    "SEM CARTÃO",
                    "SEM INSTALAÇÃO",
                    "IA PODEROSA",
                ]}
                bg={C.mint}
                textColor={C.black}
                speed={12}
            />

            {/* ═══════════════════════════════════════════
          FINAL CTA — Full-width bold block
      ═══════════════════════════════════════════ */}
            <section
                id="pricing"
                className="relative py-20 md:py-32 px-4 md:px-8 overflow-hidden"
                style={{ backgroundColor: C.orange }}
            >
                {/* Decorative shapes */}
                <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className={`hidden md:block absolute top-12 left-16 w-24 h-24 rounded-lg ${nb.border}`}
                    style={{ backgroundColor: C.yellow }}
                />
                <motion.div
                    animate={{ rotate: [360, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className={`hidden md:block absolute bottom-16 right-20 w-16 h-16 rounded-full ${nb.border}`}
                    style={{ backgroundColor: C.pink }}
                />
                <div
                    className={`hidden md:block absolute top-1/2 right-[12%] w-12 h-12 ${nb.border}`}
                    style={{ backgroundColor: C.mint }}
                />

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto text-center relative z-10"
                >
                    <h2
                        className="text-4xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.95]"
                        style={{ color: "#FFFDF7" }}
                    >
                        Bora
                        <br />
                        <motion.span
                            initial={{ rotate: -3 }}
                            whileInView={{ rotate: [-3, 0, -3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="inline-block"
                            style={{ color: C.yellow }}
                        >
                            testar?
                        </motion.span>
                    </h2>

                    <p
                        className="text-lg md:text-2xl mb-8 font-medium opacity-90"
                        style={{ color: "#FFFDF7" }}
                    >
                        Cria seu primeiro evento em menos de 1 minuto.
                        Sem cadastro complicado.
                    </p>

                    {/* Free badge */}
                    <div
                        className={`inline-flex items-center px-6 py-3 rounded-xl ${nb.border} ${nb.shadow} font-black text-base md:text-lg mb-10`}
                        style={{ backgroundColor: C.mint, color: C.black }}
                    >
                        <Zap className="w-5 h-5 mr-2" />
                        Teste grátis — sem cartão de crédito
                    </div>

                    <div className="flex justify-center">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate("/app")}
                            className={`group h-16 md:h-20 px-10 md:px-16 text-xl md:text-2xl font-black rounded-2xl ${nb.border} ${nb.shadowXl} ${nb.hover} flex items-center justify-center gap-3`}
                            style={{ backgroundColor: C.yellow, color: C.black }}
                        >
                            Criar meu primeiro evento
                            <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
                        </motion.button>
                    </div>

                    <p
                        className="text-sm font-bold mt-8 opacity-70"
                        style={{ color: "#FFFDF7" }}
                    >
                        Sem cartão • Sem instalação • Leva menos de 1 minuto
                    </p>
                </motion.div>
            </section>

            {/* ── FOOTER ────────────────────────────────── */}
            <Footer />
        </div>
    );
}
