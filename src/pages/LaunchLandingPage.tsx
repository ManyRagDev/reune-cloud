import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, Calendar, Wallet, ArrowRight, CheckCircle2, AlertCircle, Zap, Star } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { ThemeToggle } from '@/components/landing/ThemeToggle';
import { Footer } from '@/components/landing/Footer';

export default function LaunchLandingPage() {
    const { scrollYProgress } = useScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    // Data de lançamento: 05/12/2025
    const launchDate = new Date('2025-12-05T00:00:00').getTime();

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = launchDate - now;

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
    }, [launchDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setStatus('idle');
        setErrorMessage('');

        try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/waitlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    source_url: window.location.href,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit');
            }

            setStatus('success');
            setEmail('');
        } catch (error) {
            setStatus('error');
            setErrorMessage('Ocorreu um erro. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const features = [
        {
            icon: Sparkles,
            title: "Planejamento com IA",
            description: "Listas de compras e quantidades calculadas automaticamente pela inteligência artificial.",
            gradient: "from-purple-500 to-violet-500"
        },
        {
            icon: Calendar,
            title: "Convites Digitais",
            description: "Crie e compartilhe convites personalizados em um clique via WhatsApp ou e-mail.",
            gradient: "from-pink-500 to-rose-500"
        },
        {
            icon: Wallet,
            title: "Controle de Custos",
            description: "Orçamento estimado e sugestão inteligente de divisão de despesas entre participantes.",
            gradient: "from-indigo-500 to-purple-500"
        }
    ];

    return (
        <div className="min-h-screen bg-background overflow-hidden">
            <Helmet>
                <title>ReUNE - O Futuro da Organização de Eventos | Acesso Antecipado</title>
                <meta name="description" content="Cadastre-se para o lançamento do ReUNE. A primeira IA que organiza seus eventos do zero. Acesso exclusivo e benefícios para early adopters." />
                <meta name="keywords" content="organização de eventos, IA para eventos, app de festas, ReUNE launch" />
            </Helmet>

            <ThemeToggle className="fixed top-4 right-4 z-50" />

            {/* Floating Navigation */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-full bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl"
            >
                <div className="flex items-center gap-8">
                    <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                        ReUNE
                    </span>
                    <div className="hidden md:flex items-center gap-2 text-sm font-medium border-l border-border/50 pl-6">
                        <span className="text-muted-foreground">Lançamento</span>
                        <span className="font-bold">05.12.2025</span>
                    </div>
                    <Button size="sm" onClick={() => window.location.href = '/'} variant="ghost" className="ml-4">
                        <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                        Voltar
                    </Button>
                </div>
            </motion.nav>

            {/* Hero Section - Ultra Modern */}
            <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-12 overflow-hidden">
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-background to-pink-500/5" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1)_0%,transparent_50%)]" />

                {/* Floating Orbs - Purple/Pink */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.5, 0.3, 0.5],
                    }}
                    transition={{ duration: 8, repeat: Infinity, delay: 1 }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
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
                        <Badge className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400">
                            <Sparkles className="w-4 h-4 mr-2 inline" />
                            A Revolução dos Eventos
                        </Badge>

                        {/* Early Access Banner */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-30 animate-pulse" />
                            <Badge className="relative px-6 py-3 text-base font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg">
                                <Star className="w-5 h-5 mr-2 inline animate-pulse" />
                                Acesso Exclusivo VIP - Benefícios Vitalícios
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
                            Chega de caos.{" "}
                            <span className="relative inline-block">
                                <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                                    Organize com IA.
                                </span>
                                <motion.div
                                    className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 -z-10 rounded-full blur-sm"
                                    animate={{ scaleX: [0, 1] }}
                                    transition={{ duration: 0.8, delay: 0.5 }}
                                />
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            O ReUNE é a primeira inteligência artificial que planeja, convida e organiza seus eventos do zero.
                            <span className="block mt-2 text-primary font-medium">
                                Garanta seu acesso antecipado e benefícios vitalícios.
                            </span>
                        </p>
                    </motion.div>

                    {/* Countdown */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="pt-8"
                    >
                        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Lançamento em</p>
                        <div className="grid grid-cols-4 gap-4 md:gap-8 max-w-2xl mx-auto">
                            {[
                                { label: 'Dias', value: timeLeft.days },
                                { label: 'Horas', value: timeLeft.hours },
                                { label: 'Min', value: timeLeft.minutes },
                                { label: 'Seg', value: timeLeft.seconds }
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * idx, duration: 0.4 }}
                                    className="flex flex-col items-center group"
                                >
                                    <div className="relative">
                                        <div className={`absolute inset-0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl ${
                                            idx % 2 === 0 ? 'bg-purple-600/20' : 'bg-pink-600/20'
                                        }`} />

                                        <motion.div
                                            key={item.value}
                                            initial={{ scale: 1 }}
                                            animate={{ scale: [1, 1.05, 1] }}
                                            transition={{ duration: 0.3 }}
                                            className={`relative text-3xl md:text-5xl font-mono font-bold mb-2 px-4 py-2 md:px-6 md:py-3 rounded-2xl bg-gradient-to-br ${
                                                idx % 2 === 0 ? 'from-purple-500/10 to-purple-500/5' : 'from-pink-500/10 to-pink-500/5'
                                            } border ${
                                                idx % 2 === 0 ? 'border-purple-500/20' : 'border-pink-500/20'
                                            } backdrop-blur-sm group-hover:border-primary/50 transition-all duration-300`}
                                        >
                                            {idx === 3 && (
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-2xl animate-pulse" />
                                            )}
                                            <span className="relative z-10">{String(item.value).padStart(2, '0')}</span>
                                        </motion.div>
                                    </div>
                                    <div className="text-xs uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                                        {item.label}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Email Form / Success Message */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col items-center gap-6 pt-8"
                    >
                        <div className="w-full max-w-md">
                            {status === 'success' ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-8 bg-card border-2 border-green-500/20 rounded-3xl shadow-2xl space-y-4"
                                >
                                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                                    <h3 className="text-2xl font-bold text-center">Você está na lista VIP!</h3>
                                    <p className="text-muted-foreground text-center">
                                        Fique de olho no seu e-mail para novidades exclusivas e acesso antecipado.
                                    </p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="relative">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-25"></div>
                                        <div className="relative flex gap-2 p-2 bg-card border-2 border-border rounded-3xl shadow-2xl">
                                            <Input
                                                type="email"
                                                placeholder="Seu melhor e-mail"
                                                className="flex-1 h-12 border-0 bg-transparent focus-visible:ring-0"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="h-12 px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold"
                                            >
                                                {loading ? 'Enviando...' : (
                                                    <>
                                                        Entrar na Lista VIP
                                                        <ArrowRight className="w-4 h-4 ml-2" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    {status === 'error' && (
                                        <div className="text-center text-destructive text-sm flex items-center justify-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> {errorMessage}
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Junte-se a milhares de organizadores esperando pelo lançamento • 100% gratuito
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
                            <Zap className="w-4 h-4 mr-2" />
                            O que vem por aí
                        </Badge>
                        <h2 className="text-4xl md:text-6xl font-bold mb-6">
                            Recursos que vão{" "}
                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                transformar
                            </span>
                            <br />
                            seus eventos
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            IA de última geração para automatizar tudo que você precisa.
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
