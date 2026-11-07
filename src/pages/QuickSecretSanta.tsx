import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Zap, 
  ArrowLeft, 
  Plus, 
  X, 
  Shuffle, 
  MessageCircle, 
  Copy, 
  Check, 
  Gift, 
  ShieldCheck, 
  Sparkles, 
  Loader2,
  ExternalLink,
  Lock,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet';
import { performQuickSecretSantaDraw } from '@/utils/secretSantaDraw';
import { rpc } from '@/api/rpc';
import { NBLight, nb } from '@/lib/neobrutalism';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { CelebrationConfetti } from '@/components/ui/CelebrationConfetti';
import { motion } from 'framer-motion';
import { analytics } from '@/lib/analytics';

interface QuickParticipantResult {
  name: string;
  token: string;
}

export default function QuickSecretSanta() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentYear = new Date().getFullYear();
  const groupParam = searchParams.get('group');
  const [title, setTitle] = useState(groupParam || `Amigo Secreto ${currentYear}`);
  const [nameInput, setNameInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [organizerName, setOrganizerName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Estado Pós-Sorteio
  const [drawnResult, setDrawnResult] = useState<{
    drawId: string;
    title: string;
    participants: QuickParticipantResult[];
  } | null>(null);

  const [copiedTokens, setCopiedTokens] = useState<Record<string, boolean>>({});

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://reuneapp.com.br';

  const handleAddSingleName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    if (participants.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Esse nome já foi adicionado! Use um sobrenome ou apelido.');
      return;
    }

    setParticipants(prev => [...prev, trimmed]);
    if (!organizerName) {
      setOrganizerName(trimmed); // Default: primeiro nome é o organizador
    }
    setNameInput('');
  };

  const handleAddBulkNames = () => {
    if (!bulkInput.trim()) return;

    const names = bulkInput
      .split(/[\n,]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    const newUnique: string[] = [];
    const duplicates: string[] = [];

    names.forEach(name => {
      const exists = [...participants, ...newUnique].some(
        p => p.toLowerCase() === name.toLowerCase()
      );
      if (exists) {
        duplicates.push(name);
      } else {
        newUnique.push(name);
      }
    });

    if (newUnique.length > 0) {
      setParticipants(prev => [...prev, ...newUnique]);
      if (!organizerName && newUnique.length > 0) {
        setOrganizerName(newUnique[0]);
      }
      toast.success(`${newUnique.length} participante(s) adicionado(s)!`);
    }

    if (duplicates.length > 0) {
      toast.info(`Nomes ignorados por duplicidade: ${duplicates.join(', ')}`);
    }

    setBulkInput('');
    setShowBulk(false);
  };

  const handleRemoveName = (indexToRemove: number) => {
    const removedName = participants[indexToRemove];
    setParticipants(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (organizerName === removedName) {
      setOrganizerName('');
    }
  };

  const handlePerformDraw = async () => {
    if (participants.length < 3) {
      toast.error('O Amigo Secreto precisa de pelo menos 3 participantes!');
      return;
    }

    if (!organizerName) {
      toast.error('Selecione quem é você na lista de participantes.');
      return;
    }

    setLoading(true);
    try {
      // 1. Gera os pares usando o ciclo garantido (ninguém tira a si mesmo)
      const pairs = performQuickSecretSantaDraw(participants);

      // 2. Persiste no banco Supabase de forma atômica via RPC
      const res = await rpc.create_quick_secret_santa({
        title: title.trim() || 'Amigo Secreto',
        pairs,
      });

      setDrawnResult({
        drawId: res.draw_id,
        title: res.title,
        participants: res.participants,
      });

      analytics.secretSanta.drawCompleted(participants.length);
      setShowConfetti(true);
      toast.success('🎉 Sorteio realizado com sucesso! Envelopes lacrados gerados!');
    } catch (err: any) {
      console.error('Erro no sorteio relâmpago:', err);
      toast.error(err.message || 'Erro ao realizar o sorteio relâmpago.');
    } finally {
      setLoading(false);
    }
  };

  const getEnvelopeUrl = (token: string) => `${origin}/envelope/${token}`;

  const handleShareWhatsApp = (p: QuickParticipantResult) => {
    analytics.secretSanta.shareWhatsApp("quick_individual");
    const url = getEnvelopeUrl(p.token);
    const msg = `Fala, *${p.name}*! 🎁

Nosso Amigo Secreto *${drawnResult?.title}* já foi sorteado! 🎄

Seu envelope secreto está *LACRADO* no link abaixo:
👉 ${url}

⚠️ *Aviso de Segurança:* Este envelope possui lacre digital de segurança! Se alguém abrir o link antes de você, o lacre constará como violado. Guarde em segredo! 🤫`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCopyLink = (p: QuickParticipantResult) => {
    const url = getEnvelopeUrl(p.token);
    navigator.clipboard.writeText(url);
    setCopiedTokens(prev => ({ ...prev, [p.token]: true }));
    toast.success(`Link secreto de ${p.name} copiado!`);
    setTimeout(() => {
      setCopiedTokens(prev => ({ ...prev, [p.token]: false }));
    }, 2000);
  };

  const organizerParticipant = drawnResult?.participants.find(
    p => p.name.toLowerCase() === organizerName.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-[#FFFDF0] text-black py-6 px-4 pb-safe font-sans">
      <CelebrationConfetti active={showConfetti} />

      <Helmet>
        <title>Sorteador Relâmpago de Amigo Secreto ⚡ | ReUNE</title>
        <meta 
          name="description" 
          content="Sorteador de Amigo Secreto instantâneo, 100% gratuito e sem cadastro. Dispare envelopes lacrados no WhatsApp com detecção anti-curiosos." 
        />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate('/amigo-secreto')}
          className="font-bold text-xs hover:bg-black/5 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar para Amigo Secreto
        </Button>

        {/* CARD PRINCIPAL */}
        <div className="p-6 md:p-8 rounded-3xl border-[3px] border-black bg-white shadow-[8px_8px_0px_0px_#000000] relative">
          {!drawnResult ? (
            /* ETAPA 1: CONFIGURAÇÃO E NOMES */
            <div className="space-y-6">
              {/* Badge Topo */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-[2px] border-black bg-[#FFD93D] font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000000]">
                <Zap className="w-3.5 h-3.5 fill-black" />
                Sorteador Relâmpago • Sem Cadastro
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-black text-black leading-tight">
                  Sorteie na hora e mande os envelopes no WhatsApp! ⚡
                </h1>
                <p className="text-xs md:text-sm font-bold text-gray-700 mt-1">
                  Sem login, sem enrolação. Cada amigo recebe um envelope com lacre digital anti-spoilers!
                </p>
              </div>

              {/* Título do Amigo Secreto */}
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-gray-800">
                  Nome do Grupo ou Edição
                </Label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Amigo Secreto do Pilates 2026"
                  className="h-11 border-[2px] border-black rounded-xl font-bold text-sm shadow-[2px_2px_0px_0px_#000000]"
                />
              </div>

              {/* Adicionar Participantes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase text-gray-800">
                    Participantes ({participants.length} adicionados • Mínimo 3)
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowBulk(!showBulk)}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    {showBulk ? 'Adicionar 1 por 1' : 'Colar lista de nomes'}
                  </button>
                </div>

                {!showBulk ? (
                  <div className="flex gap-2">
                    <Input
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSingleName();
                        }
                      }}
                      enterKeyHint="done"
                      autoCapitalize="words"
                      placeholder="Digite o nome (Ex: Mariana Costa)..."
                      className="h-12 border-[2px] border-black rounded-xl font-bold text-sm md:text-base shadow-[2px_2px_0px_0px_#000000]"
                    />
                    <Button
                      type="button"
                      onClick={handleAddSingleName}
                      className="h-12 px-5 bg-[#FFD93D] hover:bg-[#FFE169] text-black font-black border-[2px] border-black rounded-xl shadow-[2px_2px_0px_0px_#000000] touch-press shrink-0"
                    >
                      <Plus className="w-5 h-5 mr-1" /> Adicionar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 p-3 rounded-2xl border-[2px] border-black bg-yellow-50">
                    <Label className="text-xs font-bold text-gray-700">
                      Cole a lista de amigos (um por linha ou separados por vírgula):
                    </Label>
                    <Textarea
                      rows={4}
                      value={bulkInput}
                      onChange={e => setBulkInput(e.target.value)}
                      placeholder="Lucas&#10;Mariana&#10;Pedro&#10;Ana Paula&#10;Rodrigo"
                      className="border-[2px] border-black rounded-xl font-medium text-xs bg-white"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowBulk(false)}
                        className="border-[2px] border-black rounded-xl text-xs font-bold"
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddBulkNames}
                        className="bg-[#B8F3D0] hover:bg-[#A3ECC0] text-black font-black border-[2px] border-black rounded-xl text-xs"
                      >
                        Adicionar Todos
                      </Button>
                    </div>
                  </div>
                )}

                {/* Chips de Participantes */}
                {participants.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pt-1">
                    {participants.map((name, idx) => {
                      const isMe = organizerName.toLowerCase() === name.toLowerCase();
                      return (
                        <div
                          key={idx}
                          className={`inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full border-[2px] border-black text-xs font-black shadow-[2px_2px_0px_0px_#000000] ${
                            isMe ? 'bg-[#FF69B4] text-white' : 'bg-[#FFD93D] text-black'
                          }`}
                        >
                          <span>{name}</span>
                          {isMe && <span className="text-[10px] bg-black text-white px-1 rounded">EU</span>}
                          <button
                            type="button"
                            onClick={() => handleRemoveName(idx)}
                            className="w-6 h-6 rounded-full bg-black/10 hover:bg-black/25 flex items-center justify-center ml-1 text-black touch-press"
                            title="Remover"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Seletor "Quem é você na lista?" */}
              {participants.length >= 2 && (
                <div className="space-y-1.5 p-3.5 rounded-2xl border-[2px] border-black bg-[#E5F2FF]">
                  <Label className="text-xs font-black uppercase text-gray-800">
                    Quem é você nessa lista? (Para você ver quem tirou)
                  </Label>
                  <select
                    value={organizerName}
                    onChange={e => setOrganizerName(e.target.value)}
                    className="w-full h-11 px-3 border-[2px] border-black rounded-xl font-black text-sm bg-white shadow-[2px_2px_0px_0px_#000000] outline-none"
                  >
                    <option value="">Selecione o seu nome...</option>
                    {participants.map((name, idx) => (
                      <option key={idx} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Botão de Sortear */}
              <Button
                type="button"
                disabled={loading || participants.length < 3 || !organizerName}
                onClick={handlePerformDraw}
                className="w-full h-14 bg-[#FF6B35] hover:bg-[#E55A25] text-white font-black text-base md:text-lg border-[3px] border-black rounded-2xl shadow-[6px_6px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000000] transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Sorteando sem spoilers...
                  </>
                ) : (
                  <>
                    <Shuffle className="w-6 h-6" /> SORTEAR AGORA (SEM CADASTRO) ➔
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* ETAPA 2: DESPACHO DOS ENVELOPES LACRADOS */
            <div className="space-y-6">
              {/* Badge Sucesso */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-[2px] border-black bg-[#B8F3D0] font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000000]">
                <Sparkles className="w-3.5 h-3.5 text-black" />
                Sorteio Concluído!
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-black text-black leading-tight">
                  Envelopes Lacrados Prontos! ✉️🔒
                </h2>
                <p className="text-xs md:text-sm font-semibold text-gray-700 mt-1">
                  Envie o envelope de cada amigo no WhatsApp. Nem você sabe quem eles tiraram!
                </p>
              </div>

              {/* CARD DE DESTAQUE DO ORGANIZADOR */}
              {organizerParticipant && (
                <div className="p-4 md:p-5 rounded-2xl border-[3px] border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000000] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-black bg-white px-2 py-0.5 rounded-full border border-black inline-block mb-1">
                      SEU ENVELOPE PESSOAL
                    </span>
                    <h3 className="font-black text-lg text-black">
                      Você é: {organizerParticipant.name}
                    </h3>
                    <p className="text-xs font-bold text-gray-800">
                      Toque para abrir seu próprio envelope com segurança.
                    </p>
                  </div>
                  <Button
                    onClick={() => window.open(getEnvelopeUrl(organizerParticipant.token), '_blank')}
                    className="h-11 px-5 bg-black hover:bg-gray-800 text-white font-black text-xs md:text-sm border-[2px] border-black rounded-xl shadow-[2px_2px_0px_0px_#FFF] flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Gift className="w-4 h-4 text-[#FFD93D]" />
                    VER QUEM EU TIREI ➔
                  </Button>
                </div>
              )}

              {/* LISTA DE ENVELOPES PARA OS OUTROS AMIGOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase text-gray-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    Envelopes dos Amigos (Envie no WhatsApp):
                  </Label>
                  <span className="text-[11px] font-bold text-gray-500">
                    {drawnResult.participants.filter(p => p.token !== organizerParticipant?.token).length} envelopes
                  </span>
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {drawnResult.participants
                    .filter(p => p.token !== organizerParticipant?.token)
                    .map((p) => (
                      <div
                        key={p.token}
                        className="p-3.5 rounded-2xl border-[2px] border-black bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_0px_#000000]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full border-[2px] border-black bg-[#A8D8FF] flex items-center justify-center font-black text-sm flex-shrink-0 shadow-[1px_1px_0px_#000]">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-base text-black truncate">{p.name}</p>
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Envelope Lacrado
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyLink(p)}
                            className="h-10 px-3 border-[2px] border-black bg-white text-xs font-bold rounded-xl shadow-[2px_2px_0px_0px_#000000] touch-press shrink-0"
                            title="Copiar Link"
                          >
                            {copiedTokens[p.token] ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleShareWhatsApp(p)}
                            className="h-10 px-4 flex-1 sm:flex-initial bg-[#25D366] hover:bg-[#1EBE5D] text-black font-black text-xs md:text-sm border-[2px] border-black rounded-xl shadow-[2px_2px_0px_0px_#000000] touch-press flex items-center justify-center gap-1.5"
                          >
                            <WhatsAppIcon className="w-4 h-4 text-black" />
                            WhatsApp
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* BANNER UP-SELL: AMIGO SECRETO COMPLETO */}
              <div className="p-4 rounded-2xl border-[2px] border-black bg-[#FFF7D6] space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <h4 className="font-black text-xs uppercase text-amber-950">
                    Quer a experiência completa no próximo evento?
                  </h4>
                </div>
                <p className="text-xs font-semibold text-amber-900 leading-snug">
                  Crie uma conta grátis no ReUNE para ter <strong>Lista de Desejos de Presentes</strong>, <strong>Festa com Mapa no Uber</strong> e <strong>Modo Anti-Penetras</strong>!
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/amigo-secreto')}
                  className="text-xs font-black border-[2px] border-black bg-white rounded-xl shadow-[2px_2px_0px_0px_#000000]"
                >
                  Conhecer o Amigo Secreto Completo <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>

              {/* Botão Novo Sorteio */}
              <Button
                variant="ghost"
                onClick={() => {
                  setDrawnResult(null);
                  setParticipants([]);
                  setOrganizerName('');
                }}
                className="w-full text-xs font-bold text-gray-600 hover:text-black"
              >
                Fazer outro sorteio do zero
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
