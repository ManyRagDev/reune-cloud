import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  Share2,
  Copy,
  Flame,
  Wine,
  UtensilsCrossed,
  ArrowRight,
  Bell,
  Play,
  Pause,
  RotateCcw,
  Check,
  PartyPopper,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from "lucide-react";

/**
 * Cena de Alta Fidelidade para Vídeo Demonstrativo do ReUNE (1920x1080)
 * Mostra fluxo completo:
 * 1. Interface Web: Criação rápida com IA da Une.AI
 * 2. Cálculo automático dos itens e orçamento
 * 3. Confirmação instantânea do evento
 * 4. Smartphone recebendo a notificação push de convite
 * 5. Convidado confirmando presença com 1 toque
 * 6. Atualização em tempo real do evento
 */

export default function LandingVideoScene() {
  const isRecordMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("record") === "1";

  // Step timeline: 0 to 8
  // 0: Digitação da mensagem
  // 1: Envio & IA calculando
  // 2: Itens calculados revelados
  // 3: Cursor clica em "Confirmar Evento"
  // 4: Evento criado! Link gerado.
  // 5: Celular recebe notificação push
  // 6: Toque na notificação -> abre convite no celular
  // 7: Convidado clica "Confirmar Presença" -> Sucesso
  // 8: Fechamento com Branding ReUNE
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [typedText, setTypedText] = useState("");
  const fullText = "Churrasco com a galera, sábado às 14h, 20 pessoas";

  // Typing effect for step 0
  useEffect(() => {
    if (!isPlaying) return;

    if (step === 0) {
      setTypedText("");
      let i = 0;
      const interval = setInterval(() => {
        if (i <= fullText.length) {
          setTypedText(fullText.slice(0, i));
          i++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            if (isPlaying) setStep(1);
          }, 800);
        }
      }, 55);
      return () => clearInterval(interval);
    }
  }, [step, isPlaying]);

  // Step transitions
  useEffect(() => {
    if (!isPlaying) return;

    let timer: NodeJS.Timeout;
    if (step === 1) {
      // IA "pensando" e gerando itens
      timer = setTimeout(() => setStep(2), 1600);
    } else if (step === 2) {
      // Itens na tela, mouse vai até o botão
      timer = setTimeout(() => setStep(3), 2600);
    } else if (step === 3) {
      // Clique no botão -> confirmação
      timer = setTimeout(() => setStep(4), 1400);
    } else if (step === 4) {
      // Mostra evento criado, prepara push no celular
      timer = setTimeout(() => setStep(5), 2200);
    } else if (step === 5) {
      // Notificação toca e aguarda o toque
      timer = setTimeout(() => setStep(6), 2800);
    } else if (step === 6) {
      // Convite abre na tela do celular
      timer = setTimeout(() => setStep(7), 2400);
    } else if (step === 7) {
      // Convidado confirma -> sincronia
      timer = setTimeout(() => setStep(8), 3500);
    } else if (step === 8) {
      if (typeof window !== "undefined") {
        (window as any).__VIDEO_FINISHED__ = true;
      }
      // Outro -> loop após 4s se não for gravação
      timer = setTimeout(() => {
        if (!isRecordMode) {
          setStep(0);
        }
      }, 4500);
    }

    return () => clearTimeout(timer);
  }, [step, isPlaying]);

  const handleRestart = () => {
    setStep(0);
    setTypedText("");
    setIsPlaying(true);
  };

  return (
    <div className="relative w-screen h-screen bg-[#121110] flex items-center justify-center overflow-hidden font-sans select-none">
      {/* Background Studio Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1E1B18] via-[#121110] to-[#0A0A09]" />
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(#FF6B35 1.5px, transparent 1.5px)`,
          backgroundSize: '36px 36px'
        }}
      />
      {/* Subtle Glows */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#FF6B35]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#FFD93D]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* 16:9 Canvas Frame (1920x1080 reference scaled) */}
      <div className={`relative w-[1920px] h-[1080px] max-w-full max-h-full aspect-video flex items-center justify-center px-12 py-8 ${isRecordMode ? 'scale-100' : 'scale-[0.62] 2xl:scale-[0.88]'} origin-center`}>
        
        {/* Top Header Badge */}
        <div className="absolute top-6 left-12 flex items-center gap-3 z-30">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B35] flex items-center justify-center text-white font-black text-2xl shadow-[0_4px_16px_rgba(255,107,53,0.4)]">
            R
          </div>
          <div>
            <span className="text-white font-black text-2xl tracking-tight">ReUNE</span>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFD93D] text-[#1A1A1A] border-2 border-[#1A1A1A]">
              DEMO OFICIAL
            </span>
          </div>
        </div>

        {/* Step Progression Pills */}
        <div className="absolute top-6 right-12 flex items-center gap-2 z-30 bg-[#1E1B18]/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          {[
            { id: 0, label: "1. Ideia" },
            { id: 2, label: "2. Cálculo IA" },
            { id: 4, label: "3. Confirmação" },
            { id: 5, label: "4. Notificação" },
            { id: 7, label: "5. Presença Confirmada" },
          ].map((item, idx) => {
            const active = (item.id === 0 && step <= 1) ||
                           (item.id === 2 && (step === 2 || step === 3)) ||
                           (item.id === 4 && step === 4) ||
                           (item.id === 5 && (step === 5 || step === 6)) ||
                           (item.id === 7 && step >= 7);
            return (
              <div 
                key={idx}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all duration-300 ${
                  active 
                    ? "bg-[#FF6B35] text-white shadow-[0_2px_8px_rgba(255,107,53,0.5)]" 
                    : "text-zinc-400 bg-white/5"
                }`}
              >
                {item.label}
              </div>
            );
          })}
        </div>

        {/* MAIN STAGE: Split Layout (Desktop Web App on Left + Smartphone on Right) */}
        <div className="relative w-full h-[900px] flex items-center justify-between gap-10">
          
          {/* ========================================================
              LEFT COLUMN: DESKTOP BROWSER MOCKUP (ReUNE Web App)
             ======================================================== */}
          <motion.div 
            className="relative flex-1 h-[820px] bg-[#FFFDF7] rounded-3xl border-[4px] border-[#1A1A1A] shadow-[12px_12px_0px_#1A1A1A] overflow-hidden flex flex-col transition-all duration-500"
            animate={{
              scale: step >= 5 && step <= 7 ? 0.96 : 1,
              opacity: step >= 5 && step <= 7 ? 0.85 : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            {/* Browser Window Header */}
            <div className="h-14 bg-[#FFF8E1] border-b-[3px] border-[#1A1A1A] px-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-[#FF4444] border-2 border-[#1A1A1A]" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#FFD93D] border-2 border-[#1A1A1A]" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#22CC88] border-2 border-[#1A1A1A]" />
              </div>
              <div className="flex items-center gap-2 bg-white px-5 py-1.5 rounded-xl border-2 border-[#1A1A1A] text-xs font-bold text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
                <ShieldCheck className="w-4 h-4 text-[#22CC88]" />
                <span>app.reune.com.br/novo-evento</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22CC88] animate-pulse" />
                <span className="text-xs font-bold text-[#1A1A1A]">Une.AI Online</span>
              </div>
            </div>

            {/* App Nav Inside Browser */}
            <div className="h-16 border-b-[3px] border-[#1A1A1A] px-8 flex items-center justify-between bg-[#FFFDF7]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF6B35] flex items-center justify-center text-white font-black text-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
                  R
                </div>
                <div>
                  <h1 className="font-black text-xl text-[#1A1A1A] tracking-tight">ReUNE</h1>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Criador Inteligente</p>
                </div>
              </div>

              {/* Live Guests Badge (Updates at step 7) */}
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border-2 border-[#1A1A1A] font-black text-xs transition-all duration-300 ${
                  step >= 7 ? "bg-[#B8F3D0] shadow-[3px_3px_0px_#1A1A1A] text-[#1A1A1A]" : "bg-white text-zinc-500"
                }`}>
                  <Users className="w-4 h-4" />
                  <span>{step >= 7 ? "1 Convidado Confirmado" : "0 Confirmados"}</span>
                  {step >= 7 && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                    </span>
                  )}
                </div>

                <div className="w-9 h-9 rounded-full bg-[#FFD93D] border-2 border-[#1A1A1A] flex items-center justify-center font-black text-xs shadow-[2px_2px_0px_#1A1A1A]">
                  EM
                </div>
              </div>
            </div>

            {/* App Workspace Body */}
            <div className="flex-1 p-8 bg-[#FFF8E1]/40 flex flex-col justify-between overflow-hidden relative">
              
              {/* CHAT / INTERACTION FEED */}
              <div className="space-y-6 flex-1 overflow-hidden">
                
                {/* Assistant Welcome Bubble */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF6B35] border-[3px] border-[#1A1A1A] flex items-center justify-center text-white shadow-[3px_3px_0px_#1A1A1A] flex-shrink-0">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="bg-[#FFFDF7] p-5 rounded-2xl border-[3px] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] max-w-xl">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-black text-sm text-[#FF6B35]">Une.AI</span>
                      <span className="text-[11px] font-bold text-zinc-400">Assistente de Eventos</span>
                    </div>
                    <p className="text-[#1A1A1A] font-medium text-base leading-relaxed">
                      Olá! Me diga qual evento você quer fazer, para quantas pessoas e a data. Eu calculo tudo automaticamente! 👇
                    </p>
                  </div>
                </div>

                {/* User Message Bubble */}
                <AnimatePresence>
                  {(step >= 1 || typedText.length > 0) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="flex items-start justify-end gap-3"
                    >
                      <div className="bg-[#FF6B35] text-white p-5 rounded-2xl border-[3px] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] max-w-lg">
                        <p className="font-bold text-base leading-snug">
                          {typedText || fullText}
                        </p>
                        <div className="flex items-center justify-end gap-1.5 mt-2 text-white/80 text-[11px] font-semibold">
                          <span>14:00</span>
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="w-11 h-11 rounded-2xl bg-[#FFD93D] border-[3px] border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] font-black shadow-[3px_3px_0px_#1A1A1A]">
                        EU
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AI Calculation & Generated Items Card (Step >= 2) */}
                <AnimatePresence>
                  {step >= 2 && step <= 3 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="bg-white p-6 rounded-2xl border-[3px] border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] max-w-2xl"
                    >
                      <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-100 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🥩</span>
                          <h3 className="font-black text-lg text-[#1A1A1A]">Churrasco Calculado para 20 Pessoas</h3>
                        </div>
                        <span className="bg-[#B8F3D0] text-[#1A1A1A] px-3 py-1 rounded-full text-xs font-black border-2 border-[#1A1A1A]">
                          R$ 24,00 / pessoa
                        </span>
                      </div>

                      {/* Items Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-[#FFF8E1] p-3 rounded-xl border-2 border-[#1A1A1A] flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">🥩</span>
                            <div>
                              <p className="font-bold text-xs text-[#1A1A1A]">Carnes Variadas</p>
                              <p className="text-[11px] text-zinc-600 font-medium">Picanha, Fraldinha, Linguiça</p>
                            </div>
                          </div>
                          <span className="font-black text-xs text-[#FF6B35]">8.0 kg</span>
                        </div>

                        <div className="bg-[#FFF8E1] p-3 rounded-xl border-2 border-[#1A1A1A] flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">🍺</span>
                            <div>
                              <p className="font-bold text-xs text-[#1A1A1A]">Cerveja & Refri</p>
                              <p className="text-[11px] text-zinc-600 font-medium">48 latas + 8L Refri/Água</p>
                            </div>
                          </div>
                          <span className="font-black text-xs text-[#0066CC]">56 un</span>
                        </div>

                        <div className="bg-[#FFF8E1] p-3 rounded-xl border-2 border-[#1A1A1A] flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">🍞</span>
                            <div>
                              <p className="font-bold text-xs text-[#1A1A1A]">Pão de Alho & Farofa</p>
                              <p className="text-[11px] text-zinc-600 font-medium">Acompanhamentos</p>
                            </div>
                          </div>
                          <span className="font-black text-xs text-[#1A1A1A]">3.0 kg</span>
                        </div>

                        <div className="bg-[#FFF8E1] p-3 rounded-xl border-2 border-[#1A1A1A] flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">🔥</span>
                            <div>
                              <p className="font-bold text-xs text-[#1A1A1A]">Carvão & Gelo</p>
                              <p className="text-[11px] text-zinc-600 font-medium">2 sacos carvão + 3 gelo</p>
                            </div>
                          </div>
                          <span className="font-black text-xs text-[#FF4800]">5 sacos</span>
                        </div>
                      </div>

                      {/* Action CTA Button */}
                      <div className="relative">
                        <button 
                          className={`w-full py-4 rounded-xl border-[3px] border-[#1A1A1A] font-black text-base flex items-center justify-center gap-3 transition-all duration-200 ${
                            step === 3 
                              ? "bg-[#22CC88] text-white shadow-[2px_2px_0px_#1A1A1A] translate-x-[2px] translate-y-[2px]" 
                              : "bg-[#22CC88] text-white shadow-[5px_5px_0px_#1A1A1A] hover:bg-[#1eb77a]"
                          }`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Confirmar & Gerar Convite Oficial</span>
                          <ArrowRight className="w-5 h-5 ml-1" />
                        </button>

                        {/* Simulated Mouse Cursor in Step 2-3 */}
                        {step >= 2 && step <= 3 && (
                          <motion.div 
                            initial={{ x: 280, y: 120, opacity: 0 }}
                            animate={{ 
                              x: step === 3 ? 320 : 310, 
                              y: step === 3 ? 24 : 20, 
                              opacity: 1,
                              scale: step === 3 ? 0.9 : 1
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute pointer-events-none z-30 flex items-center gap-2"
                          >
                            <svg className="w-7 h-7 drop-shadow-md text-[#1A1A1A]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M4 2l16 12-7 1 4 7-3 1.5-4-7-5 4V2z" stroke="#FFF" strokeWidth="1.5" />
                            </svg>
                            {step === 3 && (
                              <span className="bg-[#1A1A1A] text-white text-[10px] font-black px-2 py-0.5 rounded shadow">
                                CLIQUE!
                              </span>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Confirmed Event Success Dashboard Card (Step >= 4) */}
                <AnimatePresence>
                  {step >= 4 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-7 rounded-2xl border-[3px] border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] max-w-2xl"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#B8F3D0] border-[3px] border-[#1A1A1A] flex items-center justify-center text-2xl shadow-[3px_3px_0px_#1A1A1A]">
                          🎉
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#22CC88] text-white">
                              EVENTO PUBLICADO
                            </span>
                            <span className="text-xs font-bold text-zinc-500">ID: #RE-8429</span>
                          </div>
                          <h2 className="text-2xl font-black text-[#1A1A1A] mt-1">Churrasco da Galera</h2>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="bg-[#FFF8E1] p-3 rounded-xl border-2 border-[#1A1A1A]">
                          <p className="text-[11px] font-bold text-zinc-500">DATA & HORA</p>
                          <p className="font-black text-sm text-[#1A1A1A] mt-0.5">Sábado, 14:00</p>
                        </div>
                        <div className="bg-[#FFF8E1] p-3 rounded-xl border-2 border-[#1A1A1A]">
                          <p className="text-[11px] font-bold text-zinc-500">CONVIDADOS</p>
                          <p className="font-black text-sm text-[#1A1A1A] mt-0.5">20 vagas (1 conf.)</p>
                        </div>
                        <div className="bg-[#FFF8E1] p-3 rounded-xl border-2 border-[#1A1A1A]">
                          <p className="text-[11px] font-bold text-zinc-500">RATEIO ESTIMADO</p>
                          <p className="font-black text-sm text-[#22CC88] mt-0.5">R$ 24 / pessoa</p>
                        </div>
                      </div>

                      {/* Invite Link Box */}
                      <div className="bg-[#F5F0E8] p-4 rounded-xl border-2 border-[#1A1A1A] flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2 truncate">
                          <Share2 className="w-4 h-4 text-[#FF6B35] flex-shrink-0" />
                          <span className="text-xs font-black text-[#1A1A1A] truncate">
                            https://reune.com.br/c/churrasco-galera
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[11px] font-black text-[#22CC88] bg-white px-2.5 py-1 rounded-lg border border-[#1A1A1A]">
                            Link Ativo
                          </span>
                        </div>
                      </div>

                      {/* Live RSVP notification toast on desktop at step 7 */}
                      {step >= 7 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-[#B8F3D0] p-3 rounded-xl border-2 border-[#1A1A1A] flex items-center gap-3"
                        >
                          <UserCheck className="w-5 h-5 text-emerald-800" />
                          <span className="text-xs font-black text-emerald-950">
                            Matheus Silva acabou de confirmar presença pelo WhatsApp!
                          </span>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* Input Bar (Bottom) */}
              <div className="mt-4 pt-4 border-t-2 border-zinc-200">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={step === 0 ? typedText : (step === 1 ? fullText : "")}
                    placeholder="Ex: Almoço de domingo com 12 amigos..."
                    className="w-full h-14 pl-5 pr-28 rounded-2xl bg-white border-[3px] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold text-base text-[#1A1A1A] focus:outline-none"
                  />
                  <div className="absolute right-3 flex items-center gap-2">
                    <button 
                      className={`h-9 px-4 rounded-xl border-2 border-[#1A1A1A] font-black text-xs flex items-center gap-1.5 transition-all ${
                        step === 1 
                          ? "bg-[#FF6B35] text-white shadow-[1px_1px_0px_#1A1A1A]" 
                          : "bg-[#FF6B35] text-white shadow-[2px_2px_0px_#1A1A1A]"
                      }`}
                    >
                      <span>Gerar</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>


          {/* ========================================================
              RIGHT COLUMN: SMARTPHONE MOCKUP (Guest Receiving Invite)
             ======================================================== */}
          <div className="relative w-[380px] h-[820px] flex-shrink-0 flex items-center justify-center">
            
            {/* Phone Outer Shell (iPhone Style) */}
            <motion.div 
              className="relative w-[370px] h-[780px] bg-[#1E1B18] rounded-[52px] border-[5px] border-[#38332E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),_8px_8px_0px_#1A1A1A] p-3.5 flex flex-col overflow-hidden"
              animate={{
                scale: step >= 5 && step <= 7 ? 1.05 : 1,
                rotate: step === 5 ? [0, -2, 2, -2, 2, 0] : 0,
              }}
              transition={{ duration: 0.4 }}
            >
              {/* Phone Inner Screen */}
              <div className="relative w-full h-full bg-[#FFFDF7] rounded-[40px] overflow-hidden flex flex-col border-[2px] border-[#1A1A1A]">
                
                {/* Dynamic Island / Notch */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-between px-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-950/60 border border-blue-900" />
                </div>

                {/* Phone Status Bar */}
                <div className="h-10 px-7 flex items-center justify-between text-xs font-black text-[#1A1A1A] z-30 pt-1">
                  <span>14:02</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">5G</span>
                    <div className="w-5 h-2.5 border border-[#1A1A1A] rounded-sm p-0.5 flex items-center">
                      <div className="w-full h-full bg-[#1A1A1A] rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* PHONE CONTENT: Lockscreen / Wallpaper (Steps 0 - 5) */}
                <div className="relative flex-1 flex flex-col justify-between overflow-hidden">
                  
                  {/* Lockscreen clock and notification area */}
                  {step < 6 ? (
                    <div className="relative flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-[#FFF8E1] via-[#FFFDF7] to-[#F5F0E8]">
                      
                      {/* Clock Display */}
                      <div className="text-center mt-8">
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Sábado, 15 de Nov</p>
                        <h2 className="text-6xl font-black text-[#1A1A1A] tracking-tighter mt-1">14:02</h2>
                      </div>

                      {/* PUSH NOTIFICATION (Slides down on Step 5) */}
                      <div className="my-auto">
                        <AnimatePresence>
                          {step >= 5 && (
                            <motion.div
                              initial={{ opacity: 0, y: -40, scale: 0.85 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ type: "spring", damping: 15 }}
                              className="relative bg-white/95 backdrop-blur-xl p-4 rounded-3xl border-[3px] border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A]"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-[#FF6B35] flex items-center justify-center text-white font-black text-xs border border-[#1A1A1A]">
                                    R
                                  </div>
                                  <span className="font-black text-xs text-[#1A1A1A]">ReUNE Convites</span>
                                </div>
                                <span className="text-[10px] font-bold text-zinc-500">Agora</span>
                              </div>

                              <h4 className="font-black text-sm text-[#1A1A1A] leading-tight">
                                🎉 Novo Convite: Churrasco da Galera!
                              </h4>
                              <p className="text-xs text-zinc-600 font-medium mt-1 leading-snug">
                                Lucas te convidou para o churrasco no sábado às 14h. Toque para confirmar sua presença!
                              </p>

                              <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-100">
                                <span className="text-[11px] font-bold text-[#FF6B35]">Ver detalhes do evento</span>
                                <ChevronRight className="w-4 h-4 text-[#FF6B35]" />
                              </div>

                              {/* Finger Tap Indicator in Step 5 */}
                              {step === 5 && (
                                <motion.div 
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: [1, 1.4, 1], opacity: 1 }}
                                  transition={{ repeat: Infinity, duration: 1.2 }}
                                  className="absolute bottom-3 right-6 w-9 h-9 rounded-full bg-[#FF6B35]/40 border-2 border-[#FF6B35] flex items-center justify-center pointer-events-none"
                                >
                                  <div className="w-4 h-4 rounded-full bg-[#FF6B35]" />
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Lockscreen Bottom Shortcuts */}
                      <div className="flex items-center justify-between px-4 pb-4">
                        <div className="w-12 h-12 rounded-full bg-white border-2 border-[#1A1A1A] flex items-center justify-center shadow-[2px_2px_0px_#1A1A1A]">
                          <Flame className="w-5 h-5 text-[#1A1A1A]" />
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white border-2 border-[#1A1A1A] flex items-center justify-center shadow-[2px_2px_0px_#1A1A1A]">
                          <Bell className="w-5 h-5 text-[#1A1A1A]" />
                        </div>
                      </div>

                    </div>
                  ) : (
                    
                    /* GUEST INVITE & RSVP SCREEN (Steps 6, 7, 8) */
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex-1 flex flex-col justify-between p-5 bg-[#FFFDF7]"
                    >
                      <div>
                        {/* Event Card in Guest Phone */}
                        <div className="rounded-2xl border-[3px] border-[#1A1A1A] bg-[#FFF8E1] p-4 shadow-[4px_4px_0px_#1A1A1A] mb-4">
                          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#FFD93D] border border-[#1A1A1A] text-[#1A1A1A]">
                            CONVITE VIP
                          </span>
                          <h3 className="text-xl font-black text-[#1A1A1A] mt-2 leading-tight">
                            Churrasco da Galera 🥩
                          </h3>
                          <div className="space-y-1.5 mt-3 text-xs font-bold text-zinc-700">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-[#FF6B35]" />
                              <span>Sábado, 15 de Nov às 14:00</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-[#FF6B35]" />
                              <span>Espaço Gourmet • Clube</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-[#FF6B35]" />
                              <span>Organizado por Lucas</span>
                            </div>
                          </div>
                        </div>

                        {/* Guest Decision Box */}
                        <div className="bg-white rounded-2xl border-[3px] border-[#1A1A1A] p-4 shadow-[4px_4px_0px_#1A1A1A]">
                          <p className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">
                            Sua Resposta
                          </p>

                          {step < 7 ? (
                            <div className="space-y-2.5">
                              <button 
                                className="w-full py-3.5 rounded-xl border-[3px] border-[#1A1A1A] bg-[#22CC88] text-white font-black text-sm flex items-center justify-center gap-2 shadow-[4px_4px_0px_#1A1A1A] active:translate-x-1 active:translate-y-1"
                              >
                                <CheckCircle2 className="w-5 h-5" />
                                <span>Sim, vou com certeza!</span>
                              </button>
                              <button 
                                className="w-full py-2.5 rounded-xl border-2 border-zinc-200 bg-zinc-50 text-zinc-500 font-bold text-xs"
                              >
                                Não posso ir
                              </button>
                            </div>
                          ) : (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="bg-[#B8F3D0] p-4 rounded-xl border-2 border-[#1A1A1A] text-center"
                            >
                              <div className="w-10 h-10 rounded-full bg-[#22CC88] text-white flex items-center justify-center mx-auto mb-2 border-2 border-[#1A1A1A]">
                                <Check className="w-6 h-6 stroke-[3]" />
                              </div>
                              <h4 className="font-black text-base text-[#1A1A1A]">Presença Confirmada!</h4>
                              <p className="text-xs text-zinc-700 font-medium mt-1">
                                O organizador já recebeu sua confirmação.
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Phone Bottom Home Bar */}
                      <div className="w-32 h-1 bg-[#1A1A1A] rounded-full mx-auto mt-4" />
                    </motion.div>
                  )}

                </div>
              </div>
            </motion.div>

          </div>

        </div>

        {/* ========================================================
            OUTRO OVERLAY: BRANDING REUNE (Step 8)
           ======================================================== */}
        <AnimatePresence>
          {step === 8 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#FFFDF7]/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center text-center p-12"
            >
              <div className="w-24 h-24 rounded-3xl bg-[#FF6B35] border-[4px] border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] flex items-center justify-center text-white font-black text-5xl mb-6">
                R
              </div>
              <h2 className="text-6xl font-black text-[#1A1A1A] tracking-tight mb-4">
                ReUNE
              </h2>
              <p className="text-2xl font-bold text-zinc-700 max-w-xl mb-8 leading-snug">
                Crie, organize e confirme eventos em 30 segundos. Sem planilhas, sem dor de cabeça.
              </p>
              <div className="flex items-center gap-4">
                <span className="px-6 py-3 rounded-2xl bg-[#FFD93D] border-[3px] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-black text-lg text-[#1A1A1A]">
                  100% Gratuito
                </span>
                <span className="px-6 py-3 rounded-2xl bg-[#22CC88] border-[3px] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-black text-lg text-white">
                  app.reune.com.br
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================
            BOTTOM CONTROL BAR (Play, Pause, Restart, Step)
           ======================================================== */}
        {!isRecordMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#1E1B18]/90 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 z-40 text-white">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
              title={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 text-[#22CC88]" />}
            </button>
            
            <button 
              onClick={handleRestart}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
              title="Reiniciar"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <div className="h-4 w-px bg-white/20" />

            {/* Direct Step Jump Buttons */}
            <div className="flex items-center gap-1.5">
              {[0, 2, 4, 5, 7, 8].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStep(s);
                    if (s === 0) setTypedText("");
                  }}
                  className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                    step === s 
                      ? "bg-[#FF6B35] text-white" 
                      : "bg-white/10 text-zinc-400 hover:bg-white/20"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <span className="text-xs font-mono text-zinc-400 ml-2">
              Etapa {step + 1}/9
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
