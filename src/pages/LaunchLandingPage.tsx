import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Wallet, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import landingBg from '@/assets/landing-bg.png';
import { Helmet } from 'react-helmet';

export default function LaunchLandingPage() {
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
            // Silently handle error or report to monitoring service
            setStatus('error');
            setErrorMessage('Ocorreu um erro. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
            <Helmet>
                <title>ReUNE - O Futuro da Organização de Eventos | Acesso Antecipado</title>
                <meta name="description" content="Cadastre-se para o lançamento do ReUNE. A primeira IA que organiza seus eventos do zero. Acesso exclusivo e benefícios para early adopters." />
                <meta name="keywords" content="organização de eventos, IA para eventos, app de festas, ReUNE launch" />
            </Helmet>

            {/* Background Overlay */}
            <div
                className="fixed inset-0 z-0 opacity-40 pointer-events-none"
                style={{
                    backgroundImage: `url(${landingBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            />

            {/* Gradient Mesh Overlay */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(76,29,149,0.1),rgba(0,0,0,0.8))]" />

            <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
                {/* Header */}
                <header className="flex justify-between items-center mb-16">
                    <div className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        ReUNE
                    </div>
                    <div className="text-sm text-gray-400 font-medium border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                        Lançamento 05.12.2025
                    </div>
                </header>

                {/* Hero Content */}
                <main className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-gray-300">A Revolução dos Eventos</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">
                            Chega de caos.<br />
                            Organize com IA.
                        </h1>

                        <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                            O ReUNE é a primeira inteligência artificial que planeja, convida e organiza seus eventos do zero.
                            <span className="block mt-2 text-purple-400">Garanta seu acesso antecipado e benefícios vitalícios.</span>
                        </p>
                    </motion.div>

                    {/* Countdown */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="grid grid-cols-4 gap-4 md:gap-8 mb-16"
                    >
                        {[
                            { label: 'Dias', value: timeLeft.days },
                            { label: 'Horas', value: timeLeft.hours },
                            { label: 'Min', value: timeLeft.minutes },
                            { label: 'Seg', value: timeLeft.seconds }
                        ].map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                                <div className="text-3xl md:text-5xl font-mono font-bold text-white mb-2">
                                    {String(item.value).padStart(2, '0')}
                                </div>
                                <div className="text-xs uppercase tracking-widest text-gray-500">{item.label}</div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Email Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="w-full max-w-md mx-auto relative"
                    >
                        {status === 'success' ? (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center backdrop-blur-md">
                                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                <h3 className="text-xl font-semibold text-white mb-1">Você está na lista!</h3>
                                <p className="text-gray-400">Fique de olho no seu e-mail para novidades exclusivas.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                <div className="relative flex p-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl">
                                    <Input
                                        type="email"
                                        placeholder="Seu melhor e-mail"
                                        className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-gray-500 h-12"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-white text-black hover:bg-gray-200 rounded-xl px-6 h-12 font-semibold transition-all"
                                    >
                                        {loading ? 'Enviando...' : 'Entrar na Lista VIP'}
                                    </Button>
                                </div>
                                {status === 'error' && (
                                    <div className="absolute -bottom-8 left-0 right-0 text-center text-red-400 text-sm flex items-center justify-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {errorMessage}
                                    </div>
                                )}
                            </form>
                        )}
                        <p className="mt-4 text-xs text-gray-600">
                            Junte-se a +2.000 organizadores esperando pelo lançamento.
                        </p>
                    </motion.div>
                </main>

                {/* Features Teaser */}
                <motion.footer
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-20 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full"
                >
                    {[
                        { icon: Sparkles, title: "Planejamento IA", desc: "Listas de compras e quantidades calculadas na hora." },
                        { icon: Calendar, title: "Convites Digitais", desc: "Crie e compartilhe convites personalizados em um clique." },
                        { icon: Wallet, title: "Controle de Custos", desc: "Orçamento estimado e sugestão de divisão de despesas." }
                    ].map((feature, idx) => (
                        <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors group cursor-default">
                            <feature.icon className="w-8 h-8 text-gray-400 group-hover:text-purple-400 transition-colors mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                            <p className="text-sm text-gray-400">{feature.desc}</p>
                        </div>
                    ))}
                </motion.footer>
            </div>
        </div>
    );
}
