import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Unlock, 
  ShieldAlert, 
  ShieldCheck, 
  Gift, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertTriangle,
  ArrowRight,
  Heart,
  PartyPopper
} from 'lucide-react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet';
import { rpc } from '@/api/rpc';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CelebrationConfetti } from '@/components/ui/CelebrationConfetti';

export default function QuickSecretSantaEnvelope() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Informações Iniciais do Envelope
  const [envelopeInfo, setEnvelopeInfo] = useState<{
    name: string;
    title: string;
    is_sealed: boolean;
    opened_at?: string | null;
  } | null>(null);

  // Resultado após abertura
  const [revealedData, setRevealedData] = useState<{
    status: 'first_opened' | 'same_device' | 'violated';
    name: string;
    target_name: string;
    title: string;
    opened_at: string;
    views_count: number;
  } | null>(null);

  const [hidden, setHidden] = useState(false);

  // Obter ou gerar um deviceId persistente no navegador
  const getDeviceToken = (): string => {
    let devId = localStorage.getItem('reune_quick_device_id');
    if (!devId) {
      devId = 'dev_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('reune_quick_device_id', devId);
    }
    return devId;
  };

  useEffect(() => {
    if (!token) {
      setErrorMsg('Link de envelope inválido.');
      setLoading(false);
      return;
    }

    loadEnvelope();
  }, [token]);

  const loadEnvelope = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const devId = getDeviceToken();
      // Se este aparelho já tinha aberto antes localmente, tenta abrir direto
      const wasOpenedHere = localStorage.getItem(`envelope_${token}_opened`);

      if (wasOpenedHere) {
        // Já abriu aqui antes: chama abertura para pegar o amigo
        const res = await rpc.open_quick_envelope({
          token,
          deviceToken: devId,
        });
        if (res.error) throw new Error(res.error);
        setRevealedData(res);
      } else {
        // Primeira checagem para ver se o lacre ainda está intacto
        const info = await rpc.get_quick_envelope_info(token);
        if (info.error) throw new Error(info.error);
        setEnvelopeInfo(info);
      }
    } catch (err: any) {
      console.error('Erro ao consultar envelope:', err);
      setErrorMsg(err.message || 'Envelope não encontrado.');
    } finally {
      setLoading(false);
    }
  };

  const handleBreakSeal = async () => {
    if (!token) return;
    setOpening(true);
    try {
      const devId = getDeviceToken();
      const res = await rpc.open_quick_envelope({
        token,
        deviceToken: devId,
      });

      if (res.error) throw new Error(res.error);

      // Marca localmente que este aparelho abriu este envelope
      localStorage.setItem(`envelope_${token}_opened`, 'true');

      setRevealedData(res);

      if (res.status === 'violated') {
        toast.error('🚨 ATENÇÃO: Lacre Violado!', {
          description: 'Este envelope já havia sido aberto anteriormente em outro aparelho!',
        });
      } else {
        setShowConfetti(true);
        toast.success('🎉 Envelope aberto com sucesso!');
      }
    } catch (err: any) {
      console.error('Erro ao romper lacre:', err);
      toast.error(err.message || 'Erro ao abrir envelope.');
    } finally {
      setOpening(false);
    }
  };

  const formatFriendlyTime = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF0] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl border-[3px] border-black bg-[#FFD93D] flex items-center justify-center shadow-[4px_4px_0px_0px_#000000] mb-4">
          <Loader2 className="w-8 h-8 text-black animate-spin" />
        </div>
        <p className="font-black text-base text-black">Verificando lacre do envelope...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#FFFDF0] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 md:p-8 rounded-3xl border-[3px] border-black bg-white shadow-[6px_6px_0px_0px_#000000] text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl border-[3px] border-black bg-[#FF69B4] flex items-center justify-center text-2xl shadow-[3px_3px_0px_0px_#000000]">
            ⚠️
          </div>
          <h2 className="text-2xl font-black text-black">Envelope Não Encontrado</h2>
          <p className="text-sm font-semibold text-gray-700">
            {errorMsg}
          </p>
          <Button
            onClick={() => navigate('/amigo-secreto')}
            className="w-full h-11 bg-[#FFD93D] hover:bg-[#FFE169] text-black font-black border-[2px] border-black rounded-xl shadow-[3px_3px_0px_0px_#000000]"
          >
            Ir para a Página Inicial
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF0] text-black py-6 px-4 pb-safe flex flex-col items-center justify-center font-sans">
      <CelebrationConfetti active={showConfetti} />

      <Helmet>
        <title>{`Envelope Secreto: ${revealedData?.name || envelopeInfo?.name || 'Amigo Secreto'} | ReUNE`}</title>
      </Helmet>

      <div className="max-w-md w-full space-y-6">
        {/* CARD DO ENVELOPE */}
        <div className="p-6 md:p-8 rounded-3xl border-[3px] border-black bg-white shadow-[8px_8px_0px_0px_#000000] text-center relative overflow-hidden">
          {/* ESTADO 1: ENVELOPE LACRADO (ANTES DE ABRIR) */}
          {!revealedData && envelopeInfo && (
            <div className="space-y-6">
              {/* Badge de Grupo */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-[2px] border-black bg-[#FFD93D] font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000000]">
                <Gift className="w-3.5 h-3.5" />
                {envelopeInfo.title}
              </div>

              {/* Ícone de Envelope com Lacre de Cera & Tremor ao Abrir */}
              <motion.div 
                animate={opening ? { rotate: [-4, 4, -5, 5, 0], scale: [1, 1.06, 0.96, 1] } : {}}
                transition={{ duration: 0.4, repeat: opening ? Infinity : 0 }}
                className="relative inline-block my-2"
              >
                <div className="w-28 h-28 rounded-3xl border-[3px] border-black bg-[#FFF7D6] flex items-center justify-center shadow-[5px_5px_0px_0px_#000000] text-5xl transform -rotate-2 select-none">
                  ✉️
                </div>
                {/* Selo de Cera: Vermelho Intacto ou Roto/Violado */}
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={!opening ? handleBreakSeal : undefined}
                  className={`absolute -bottom-2 -right-2 w-13 h-13 rounded-full border-[3px] border-black ${
                    envelopeInfo.is_sealed ? 'bg-[#FF4444]' : 'bg-black text-[#FF4444]'
                  } text-white flex items-center justify-center shadow-[3px_3px_0px_0px_#000000] transform rotate-6 cursor-pointer touch-press`}
                  title="Toque para romper o lacre"
                >
                  {envelopeInfo.is_sealed ? (
                    <Lock className="w-6 h-6 stroke-[2.5]" />
                  ) : (
                    <Unlock className="w-6 h-6 stroke-[2.5] text-[#FF4444]" />
                  )}
                </motion.div>
              </motion.div>

              <div>
                <span className="text-xs font-black uppercase text-gray-500 tracking-wider">
                  ENVELOPE {envelopeInfo.is_sealed ? 'LACRADO' : 'VIOLADO'} PARA:
                </span>
                <h1 className="text-3xl font-black text-black mt-1">
                  {envelopeInfo.name}
                </h1>
              </div>

              {/* Aviso do Lacre de Segurança: Intacto vs Já Violado */}
              {envelopeInfo.is_sealed ? (
                <div className="p-4 rounded-2xl border-[2px] border-black bg-[#E2F7EB] text-left space-y-1.5 shadow-[2px_2px_0px_0px_#000000]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span className="font-black text-xs uppercase text-emerald-950">
                      Lacre de Segurança Ativo
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-900 leading-relaxed">
                    Ao tocar no botão abaixo, o lacre digital será quebrado pela primeira vez e o resultado será revelado. Apenas <strong>{envelopeInfo.name}</strong> deve romper este lacre!
                  </p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0.9, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
                  className="p-4 rounded-2xl border-[3px] border-black bg-[#FF4444] text-white text-left space-y-1.5 shadow-[4px_4px_0px_0px_#000000]"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#FFD93D] flex-shrink-0" />
                    <span className="font-black text-xs uppercase tracking-wide">
                      🚨 ALERTA: LACRE DE SEGURANÇA VIOLADO!
                    </span>
                  </div>
                  <p className="text-xs font-bold leading-relaxed">
                    Este envelope já foi aberto em <strong>{formatFriendlyTime(envelopeInfo.opened_at)}</strong> em outro aparelho! Alguém teve acesso ao seu resultado antecipadamente.
                  </p>
                </motion.div>
              )}

              {/* Botão Romper Lacre */}
              <Button
                type="button"
                disabled={opening}
                onClick={handleBreakSeal}
                className="w-full h-14 bg-[#FF4444] hover:bg-[#E53333] text-white font-black text-base md:text-lg border-[3px] border-black rounded-2xl shadow-[5px_5px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000000] touch-press transition-all flex items-center justify-center gap-2"
              >
                {opening ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Rompendo lacre...
                  </>
                ) : (
                  <>
                    <Unlock className="w-5 h-5" /> {envelopeInfo.is_sealed ? 'ROMPER LACRE E VER AMIGO ➔' : 'VER AMIGO (LACRE VIOLADO) ➔'}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* ESTADO 2: ENVELOPE ABERTO (REVELAÇÃO COM ANIMAÇÃO) */}
          {revealedData && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="space-y-6"
            >
              {/* Badge de Status: Legítimo vs Violado */}
              {revealedData.status === 'violated' ? (
                <div className="p-4 rounded-2xl border-[3px] border-black bg-[#FF4444] text-white shadow-[4px_4px_0px_0px_#000000] text-left space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-[#FFD93D] flex-shrink-0" />
                    <h3 className="font-black text-base uppercase leading-tight">
                      🚨 ALERTA: LACRE FOI VIOLADO!
                    </h3>
                  </div>
                  <p className="text-xs font-bold leading-relaxed">
                    Este envelope já havia sido aberto anteriormente em{' '}
                    <strong>{formatFriendlyTime(revealedData.opened_at)}</strong> em outro aparelho ou navegador!
                  </p>
                  <p className="text-[11px] font-medium bg-black/20 p-2 rounded-lg">
                    Alguém xeretou o seu amigo secreto antes de você abrir o link.
                  </p>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-[2px] border-black bg-[#B8F3D0] font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000000]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Envelope Aberto com Sucesso
                </div>
              )}

              <div>
                <span className="text-xs font-black uppercase text-gray-500">
                  {revealedData.title}
                </span>
                <h2 className="text-xl font-black text-black">
                  Olá, {revealedData.name}!
                </h2>
              </div>

              {/* CARD PRINCIPAL DO AMIGO SORTEADO COM BRILHO */}
              <div className="p-6 rounded-3xl border-[3px] border-black bg-[#FFF7D6] shadow-[5px_5px_0px_0px_#000000] space-y-3 relative">
                <span className="text-[11px] font-black uppercase text-gray-600 block">
                  SEU AMIGO SECRETO É:
                </span>

                {!hidden ? (
                  <motion.h3 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="text-3xl md:text-4xl font-black text-[#FF6B35] tracking-tight"
                  >
                    {revealedData.target_name} 🤫
                  </motion.h3>
                ) : (
                  <div className="py-3 font-mono font-black text-2xl text-gray-400 tracking-widest">
                    ••••••••••••
                  </div>
                )}

                <p className="text-xs font-bold text-gray-700">
                  Guarde bem este segredo até o dia da festa!
                </p>

                {/* Botão de Ocultar / Ver */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setHidden(!hidden)}
                  className="h-10 px-4 border-[2px] border-black rounded-xl text-xs font-bold bg-white shadow-[2px_2px_0px_0px_#000000] touch-press active:translate-x-[1px] active:translate-y-[1px]"
                >
                  {hidden ? (
                    <>
                      <Eye className="w-4 h-4 mr-1.5" /> Mostrar Nome
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 mr-1.5" /> Ocultar (Olhos Curiosos 👀)
                    </>
                  )}
                </Button>
              </div>

              {/* Micro-aviso de Reabertura */}
              <p className="text-[11px] font-semibold text-gray-500">
                Lacre rompido em: {formatFriendlyTime(revealedData.opened_at)}
              </p>

              {/* BANNER REUNE ECOSSISTEMA */}
              <div className="pt-2 border-t-2 border-black/10 text-center space-y-2">
                <p className="text-xs font-bold text-gray-800">
                  Quer organizar o seu próprio Amigo Secreto ou evento de graça?
                </p>
                <Button
                  onClick={() => navigate('/amigo-secreto')}
                  className="w-full h-12 bg-[#FFD93D] hover:bg-[#FFE169] text-black font-black text-xs md:text-sm border-[2px] border-black rounded-xl shadow-[3px_3px_0px_0px_#000000] touch-press"
                >
                  Criar Meu Amigo Secreto no ReUNE ➔
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Rodapé */}
        <div className="text-center text-xs font-bold text-gray-500">
          ReUNE • O organizador inteligente de eventos 🚀
        </div>
      </div>
    </div>
  );
}
