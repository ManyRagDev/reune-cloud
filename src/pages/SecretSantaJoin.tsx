import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Gift, 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Loader2, 
  Eye, 
  EyeOff, 
  PartyPopper,
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { rpc } from '@/api/rpc';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Helmet } from 'react-helmet';
import { CelebrationConfetti } from '@/components/ui/CelebrationConfetti';
import { motion } from 'framer-motion';

export default function SecretSantaJoin() {
  const { id: eventIdParam, token: tokenParam } = useParams<{ id?: string; token?: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Formulário do Convidado
  const [displayName, setDisplayName] = useState('');
  const [wishlist, setWishlist] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Estado de Sucesso / Já Confirmado
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedParticipantId, setConfirmedParticipantId] = useState<string | null>(null);

  // Revelação de Amigo Secreto (se o sorteio já ocorreu)
  const [revealPin, setRevealPin] = useState('');
  const [revealing, setRevealing] = useState(false);
  const [revealedResult, setRevealedResult] = useState<{
    target_name: string;
    target_wishlist?: string;
    target_link?: string;
  } | null>(null);
  const [showResultCard, setShowResultCard] = useState(false);

  useEffect(() => {
    loadInviteData();
  }, [eventIdParam, tokenParam]);

  const loadInviteData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let data: any = null;

      if (tokenParam) {
        data = await rpc.get_secret_santa_invite_by_token(tokenParam);
      } else if (eventIdParam) {
        data = await rpc.get_secret_santa_invite_info(Number(eventIdParam));
      } else {
        throw new Error('Link de convite inválido.');
      }

      if (!data || data.error) {
        throw new Error(data?.error || 'Amigo Secreto não encontrado.');
      }

      setEventData(data);

      // Se for convite individual, preencher nome e dados existentes
      if (data.participant) {
        if (data.participant.display_name) {
          setDisplayName(data.participant.display_name);
        }
        if (data.participant.wishlist_text) {
          setWishlist(data.participant.wishlist_text);
        }
        if (data.participant.status === 'confirmed' && data.participant.has_pin) {
          setConfirmed(true);
          setConfirmedParticipantId(data.participant.id);
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar convite:', err);
      setErrorMsg(err.message || 'Não foi possível carregar os dados deste Amigo Secreto.');
    } finally {
      setLoading(false);
    }
  };

  const formatFriendlyDate = (dateStr?: string | null) => {
    if (!dateStr) return 'A definir';
    try {
      const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const [year, month, day] = datePart.split('-').map(Number);
      const d = new Date(year, month - 1, day, 12, 0, 0);
      return format(d, "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const valorFormatado = () => {
    if (!eventData) return '';
    const min = eventData.min_value;
    const max = eventData.max_value;
    if (min && max) return `R$ ${min} a R$ ${max}`;
    if (min) return `A partir de R$ ${min}`;
    if (max) return `Até R$ ${max}`;
    return 'Livre / A combinar';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode || pinCode.trim().length < 4) {
      toast.error('Crie um PIN de pelo menos 4 dígitos para proteger seu resultado!');
      return;
    }

    setSubmitting(true);
    try {
      if (tokenParam) {
        // Confirmação no modo individual
        const res = await rpc.confirm_secret_santa_individual({
          token: tokenParam,
          pinCode: pinCode.trim(),
          wishlist: wishlist.trim() || undefined,
          whatsapp: whatsapp.trim() || undefined,
        });
        setConfirmed(true);
        setConfirmedParticipantId(res.participant_id);
        setShowConfetti(true);
        toast.success('🎉 Presença confirmada no Amigo Secreto!');
      } else if (eventIdParam) {
        // Ingresso no modo aberto
        if (!displayName.trim()) {
          toast.error('Digite seu nome para que os outros saibam quem você é!');
          setSubmitting(false);
          return;
        }

        const res = await rpc.join_secret_santa_open({
          eventId: Number(eventIdParam),
          displayName: displayName.trim(),
          pinCode: pinCode.trim(),
          wishlist: wishlist.trim() || undefined,
          whatsapp: whatsapp.trim() || undefined,
        });
        setConfirmed(true);
        setConfirmedParticipantId(res.participant_id);
        setShowConfetti(true);
        toast.success('🎉 Você entrou no Amigo Secreto com sucesso!');
      }
    } catch (err: any) {
      console.error('Erro ao confirmar:', err);
      toast.error(err.message || 'Erro ao confirmar participação.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevealTarget = async () => {
    if (!confirmedParticipantId || !revealPin || revealPin.trim().length < 4) {
      toast.error('Digite o PIN de 4 dígitos que você cadastrou.');
      return;
    }

    setRevealing(true);
    try {
      const res = await rpc.reveal_secret_santa_target({
        participantId: confirmedParticipantId,
        pinCode: revealPin.trim(),
      });

      if (!res.drawn) {
        toast.info(res.message || 'O sorteio ainda não foi realizado pelo organizador.');
        return;
      }

      setRevealedResult(res);
      setShowResultCard(true);
      toast.success('Amigo secreto revelado!');
    } catch (err: any) {
      console.error('Erro ao revelar:', err);
      toast.error(err.message || 'PIN incorreto. Tente novamente.');
    } finally {
      setRevealing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF0] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl border-[3px] border-black bg-[#FFD93D] flex items-center justify-center shadow-[4px_4px_0px_0px_#000000] mb-4">
          <Loader2 className="w-8 h-8 text-black animate-spin" />
        </div>
        <p className="font-black text-base text-black">Carregando convite do Amigo Secreto...</p>
      </div>
    );
  }

  if (errorMsg || !eventData) {
    return (
      <div className="min-h-screen bg-[#FFFDF0] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-3xl border-[3px] border-black bg-white shadow-[6px_6px_0px_0px_#000000] text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl border-[3px] border-black bg-[#FF69B4] flex items-center justify-center text-2xl shadow-[3px_3px_0px_0px_#000000]">
            ⚠️
          </div>
          <h2 className="text-2xl font-black text-black">Convite Não Encontrado</h2>
          <p className="text-sm font-semibold text-gray-700">
            {errorMsg || 'Este link pode ter expirado ou o Amigo Secreto não existe mais.'}
          </p>
          <Button
            onClick={() => navigate('/')}
            className="w-full h-11 bg-[#FFD93D] hover:bg-[#FFE169] text-black font-black border-[2px] border-black rounded-xl shadow-[3px_3px_0px_0px_#000000]"
          >
            Ir para a Página Inicial
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF0] text-black py-6 px-4 pb-safe flex flex-col items-center justify-center">
      <CelebrationConfetti active={showConfetti} />

      <Helmet>
        <title>{`Convite: ${eventData.title} | ReUNE`}</title>
      </Helmet>

      <div className="max-w-lg w-full space-y-6">
        {/* Card Principal do Evento */}
        <div className="p-6 md:p-8 rounded-3xl border-[3px] border-black bg-white shadow-[8px_8px_0px_0px_#000000] relative">
          {/* Badge superior */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-[2px] border-black bg-[#FFD93D] font-black text-xs uppercase mb-4 shadow-[2px_2px_0px_0px_#000000]">
            <Gift className="w-3.5 h-3.5" />
            Amigo Secreto ReUNE
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-black leading-tight mb-2">
            {eventData.title}
          </h1>

          {eventData.description && (
            <p className="text-xs font-semibold text-gray-600 mb-4">
              {eventData.description}
            </p>
          )}

          {/* Destaques do Amigo Secreto em Pílulas */}
          <div className="grid grid-cols-2 gap-2.5 my-5">
            <div className="p-3 rounded-2xl border-[2px] border-black bg-[#FFF4D4]">
              <span className="text-xs font-black text-gray-700 uppercase block">💰 Valor Presente</span>
              <span className="text-sm font-black text-black">{valorFormatado()}</span>
            </div>

            <div className="p-3 rounded-2xl border-[2px] border-black bg-[#E2F7EB]">
              <span className="text-xs font-black text-gray-700 uppercase block">🎲 Data do Sorteio</span>
              <span className="text-sm font-black text-black">{formatFriendlyDate(eventData.draw_date)}</span>
            </div>

            <div className="p-3 rounded-2xl border-[2px] border-black bg-[#FDE2EC]">
              <span className="text-xs font-black text-gray-700 uppercase block">🎉 Revelação</span>
              <span className="text-sm font-black text-black">
                {formatFriendlyDate(eventData.event_date)}
                {eventData.event_time ? ` às ${eventData.event_time}` : ''}
              </span>
            </div>

            <div className="p-3 rounded-2xl border-[2px] border-black bg-[#E5F2FF]">
              <span className="text-xs font-black text-gray-700 uppercase block">📍 Local</span>
              <span className="text-sm font-black text-black truncate block">
                {eventData.location || eventData.address || 'A combinar'}
              </span>
            </div>
          </div>

          {/* ESTADO 1: JÁ CONFIRMADO */}
          {confirmed ? (
            <div className="space-y-5 pt-2">
              <div className="p-5 rounded-2xl border-[3px] border-black bg-[#B8F3D0] shadow-[4px_4px_0px_0px_#000000] text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full border-[2px] border-black bg-white flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-xl font-black text-black">Presença Confirmada! 🎉</h3>
                <p className="text-xs font-bold text-gray-800">
                  Você está dentro do Amigo Secreto de <strong>{eventData.title}</strong>.
                </p>
                <div className="inline-block px-3 py-1 rounded-lg border-[2px] border-black bg-white font-mono text-xs font-bold mt-2">
                  🔒 Seu PIN foi gravado com segurança
                </div>
              </div>

              {/* Se o sorteio já ocorreu: Botão e Input para Revelar */}
              {eventData.has_drawn ? (
                <div className="p-5 rounded-2xl border-[3px] border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000000] space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-black" />
                    <h4 className="font-black text-base text-black uppercase">
                      O Sorteio Já Aconteceu! 🎁
                    </h4>
                  </div>
                  <p className="text-xs font-semibold text-gray-800">
                    Digite o PIN de 4 dígitos que você cadastrou para ver seu amigo secreto:
                  </p>

                  <div className="flex gap-2">
                    <Input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={8}
                      placeholder="Seu PIN de 4 dígitos"
                      value={revealPin}
                      onChange={e => setRevealPin(e.target.value)}
                      className="h-12 border-[2px] border-black rounded-xl font-black text-center text-lg bg-white"
                    />
                    <Button
                      onClick={handleRevealTarget}
                      disabled={revealing}
                      className="h-12 px-5 bg-black hover:bg-gray-800 text-white font-black text-xs md:text-sm border-[2px] border-black rounded-xl shadow-[2px_2px_0px_0px_#000000] touch-press shrink-0"
                    >
                      {revealing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'REVELAR ➔'}
                    </Button>
                  </div>

                  {/* Card do Amigo Sorteado Revelado */}
                  {showResultCard && revealedResult && (
                    <div className="p-4 rounded-xl border-[3px] border-black bg-white mt-4 space-y-3 shadow-[4px_4px_0px_0px_#000000]">
                      <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                        Seu Amigo Secreto é:
                      </span>
                      <h3 className="text-2xl font-black text-[#FF6B35]">
                        {revealedResult.target_name} 🤫
                      </h3>

                      {revealedResult.target_wishlist ? (
                        <div className="p-3 rounded-lg border-[2px] border-black bg-yellow-50 text-xs">
                          <strong className="block font-black mb-1">🎁 O que ele(a) gostaria de ganhar:</strong>
                          <p className="font-medium whitespace-pre-line text-gray-800">
                            {revealedResult.target_wishlist}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-gray-500 italic">
                          Esse amigo ainda não cadastrou a lista de desejos.
                        </p>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowResultCard(false)}
                        className="w-full text-xs font-bold border-[2px] border-black rounded-lg"
                      >
                        Ocultar Resultado (Evitar Olhos Curiosos 👀)
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl border-[2px] border-black bg-white text-center space-y-1">
                  <p className="text-xs font-black uppercase text-gray-500">
                    Aguardando o Sorteio
                  </p>
                  <p className="text-xs font-semibold text-gray-700">
                    Assim que o organizador realizar o sorteio em <strong>{formatFriendlyDate(eventData.draw_date)}</strong>, volte nesta mesma página para ver quem você tirou com o seu PIN!
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* ESTADO 2: FORMULÁRIO DE INGRESSO / CONFIRMAÇÃO */
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="p-3.5 rounded-2xl border-[2px] border-black bg-[#FFF7D6] flex items-center gap-2.5">
                <PartyPopper className="w-5 h-5 text-amber-700 flex-shrink-0" />
                <p className="text-xs font-bold text-amber-950">
                  {tokenParam 
                    ? `Olá, ${displayName || 'Convidado'}! Confirme sua presença e diga o que quer ganhar.`
                    : 'Entre com seu nome e crie seu PIN para poder ver quem você tirou no sorteio!'}
                </p>
              </div>

              {/* Nome (apenas se modo aberto ou se não veio pré-definido) */}
              {!tokenParam && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-gray-800">
                    Seu Nome Completo ou Apelido *
                  </Label>
                  <Input
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Ex: Mariana Costa"
                    className="h-11 border-[2px] border-black rounded-xl font-bold text-sm shadow-[2px_2px_0px_0px_#000000]"
                  />
                </div>
              )}

              {/* Lista de Desejos / O que quer ganhar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase text-gray-800 flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-[#FF6B35]" />
                    O que você gostaria de ganhar?
                  </Label>
                  <span className="text-[11px] font-bold text-gray-500">Ajuda o seu amigo!</span>
                </div>
                <Textarea
                  rows={3}
                  value={wishlist}
                  onChange={e => setWishlist(e.target.value)}
                  placeholder="Ex: Livro de ficção científica, camiseta tamanho M, chocolate artesanal, caneca divertida..."
                  className="border-[2px] border-black rounded-xl font-medium text-xs shadow-[2px_2px_0px_0px_#000000]"
                />
              </div>

              {/* PIN de Segurança de 4 dígitos */}
              <div className="space-y-1.5 p-3.5 rounded-2xl border-[2px] border-black bg-[#F0F8FF]">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <Label className="text-xs font-black uppercase text-gray-900">
                    Crie seu PIN Secreto (4 Dígitos) *
                  </Label>
                </div>
                <p className="text-[11px] font-semibold text-gray-600 leading-snug">
                  Guarde esse número! Ele será sua chave para abrir e ver seu amigo secreto sem que ninguém espione no sorteio.
                </p>
                <Input
                  required
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  value={pinCode}
                  onChange={e => setPinCode(e.target.value)}
                  placeholder="Ex: 2468"
                  className="h-12 border-[2px] border-black rounded-xl font-black text-center text-xl tracking-widest bg-white shadow-[2px_2px_0px_0px_#000000]"
                />
              </div>

              {/* WhatsApp Opcional */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">
                  Seu WhatsApp (opcional, para avisos do sorteio)
                </Label>
                <Input
                  type="tel"
                  inputMode="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="h-11 border-[2px] border-black rounded-xl font-bold text-sm"
                />
              </div>

              {/* Botão de Enviar */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-14 py-3 bg-[#FFD93D] hover:bg-[#FFE169] text-black font-black text-base border-[3px] border-black rounded-2xl shadow-[5px_5px_0px_0px_#000000] touch-press active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000000] transition-all flex items-center justify-center gap-2 mt-4"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Confirmando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {tokenParam ? 'CONFIRMAR MINHA PRESENÇA ➔' : 'ENTRAR NO AMIGO SECRETO ➔'}
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Rodapé institucional */}
        <div className="text-center text-xs font-bold text-gray-500">
          ReUNE • O organizador inteligente de eventos e amigos secretos 🚀
        </div>
      </div>
    </div>
  );
}
