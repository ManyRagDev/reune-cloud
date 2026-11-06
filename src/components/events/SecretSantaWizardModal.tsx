import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Gift, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  ShieldCheck, 
  Share2, 
  Users, 
  Plus, 
  X, 
  Check, 
  Loader2,
  PartyPopper,
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GoogleAddressAutocomplete, SelectedPlace } from '@/components/maps/GoogleAddressAutocomplete';
import { EventMapPreview } from '@/components/maps/EventMapPreview';
import { SecretSantaShareModal } from './SecretSantaShareModal';
import { useNavigate } from 'react-router-dom';

interface ExistingEventOption {
  id: number;
  title: string;
  event_date: string;
  event_time?: string;
  location?: string;
  address?: string;
  isOwner?: boolean;
  hasSecretSanta?: boolean;
}

export interface SecretSantaWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingEvents?: ExistingEventOption[];
  onSuccess?: (eventId: number) => void;
  initialTitle?: string;
  initialEmoji?: string;
}

const EMOJI_OPTIONS = ['🎁', '🧘‍♀️', '🏋️', '💼', '🏠', '🍻', '📚', '🎮', '🐾', '⛪', '🎓', '🍕', '🎅', '🎄'];

const QUICK_SUGGESTIONS = [
  { label: '🧘‍♀️ Do Pilates', prefix: 'Amigo Secreto do Pilates' },
  { label: '🏋️ Do Crossfit', prefix: 'Amigo Secreto do Crossfit' },
  { label: '💼 Da Firma', prefix: 'Amigo Secreto da Firma' },
  { label: '🏠 Da Família', prefix: 'Amigo Secreto da Família' },
  { label: '🍻 Da Galera', prefix: 'Amigo Secreto dos Amigos' },
  { label: '📚 Do Clube do Livro', prefix: 'Amigo Secreto do Clube do Livro' },
  { label: '⛪ Da Célula / Igreja', prefix: 'Amigo Secreto da Célula' },
  { label: '🎮 Dos Games', prefix: 'Amigo Secreto dos Gamers' },
  { label: '🐾 Dos Pets', prefix: 'Amigo Secreto dos Pets' },
  { label: '🎓 Da Faculdade', prefix: 'Amigo Secreto da Turma' },
];

export const SecretSantaWizardModal: React.FC<SecretSantaWizardModalProps> = ({
  open,
  onOpenChange,
  existingEvents = [],
  onSuccess,
  initialTitle,
  initialEmoji,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Wizard Step (1, 2, 3)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Modo de criação: 'new' ou 'link_existing'
  const [createMode, setCreateMode] = useState<'new' | 'link_existing'>('new');
  const [selectedExistingEventId, setSelectedExistingEventId] = useState<number | null>(null);

  // Passo 1: Identidade & Vibe
  const currentYear = new Date().getFullYear();
  const [title, setTitle] = useState(initialTitle || `Amigo Secreto ${currentYear}`);
  const [selectedEmoji, setSelectedEmoji] = useState(initialEmoji || '🎁');

  // Atualizar quando props mudam ao abrir
  React.useEffect(() => {
    if (open) {
      if (initialTitle) setTitle(initialTitle);
      if (initialEmoji) setSelectedEmoji(initialEmoji);
    }
  }, [open, initialTitle, initialEmoji]);

  // Passo 2: Presentes & Sorteio
  const [valuePreset, setValuePreset] = useState<'lembrancinha' | 'padrao' | 'caprichado' | 'custom'>('padrao');
  const [minValue, setMinValue] = useState<string>('50');
  const [maxValue, setMaxValue] = useState<string>('100');
  
  // Datas padrão usando timezone local (sem ISO UTC bug)
  const getTodayLocal = () => new Date().toLocaleDateString('en-CA');
  const getDefaultDrawDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString('en-CA');
  };
  const getDefaultPartyDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toLocaleDateString('en-CA');
  };

  const [drawDate, setDrawDate] = useState<string>(getDefaultDrawDate());
  const [partyDate, setPartyDate] = useState<string>(getDefaultPartyDate());
  const [partyTime, setPartyTime] = useState<string>('19:30');

  // Localização
  const [locationName, setLocationName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);

  // Passo 3: Modo de Convite & Participantes
  const [inviteMode, setInviteMode] = useState<'open' | 'individual'>('open');
  const [individualNames, setIndividualNames] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState<string>('');

  // Estado do Modal de Compartilhamento Pós-Criação
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<number | null>(null);
  const [createdShareData, setCreatedShareData] = useState<{
    eventTitle: string;
    inviteMode: 'open' | 'individual';
    secretSantaData: any;
    individualParticipants: Array<{ id: string; display_name: string; invitation_token: string }>;
  } | null>(null);

  // Aplicar presets de valor
  const handleApplyPreset = (preset: 'lembrancinha' | 'padrao' | 'caprichado' | 'custom') => {
    setValuePreset(preset);
    if (preset === 'lembrancinha') {
      setMinValue('15');
      setMaxValue('35');
    } else if (preset === 'padrao') {
      setMinValue('50');
      setMaxValue('100');
    } else if (preset === 'caprichado') {
      setMinValue('100');
      setMaxValue('200');
    }
  };

  // Se o usuário selecionar um evento existente
  const handleSelectExistingEvent = (eventIdStr: string) => {
    const id = Number(eventIdStr);
    setSelectedExistingEventId(id);
    const found = existingEvents.find(e => e.id === id);
    if (found) {
      setTitle(`${found.title} 🎁`);
      if (found.event_date) setPartyDate(found.event_date);
      if (found.event_time) setPartyTime(found.event_time);
      if (found.location) setLocationName(found.location);
      if (found.address) setAddress(found.address);
    }
  };

  // Adicionar nomes na lista individual
  const handleAddIndividualName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    // Se o usuário colou múltiplos nomes separados por vírgula ou linha
    const splitNames = trimmed
      .split(/[\n,]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0 && !individualNames.includes(n));

    if (splitNames.length === 0) {
      toast.info('Nome já adicionado ou inválido.');
      return;
    }

    setIndividualNames(prev => [...prev, ...splitNames]);
    setNameInput('');
  };

  const handleRemoveIndividualName = (indexToRemove: number) => {
    setIndividualNames(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Validações por passo
  const handleNextStep = () => {
    if (step === 1) {
      if (createMode === 'link_existing' && !selectedExistingEventId) {
        toast.error('Selecione um evento existente para vincular.');
        return;
      }
      if (!title.trim()) {
        toast.error('Dê um nome bem legal para o seu Amigo Secreto!');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const min = parseFloat(minValue) || 0;
      const max = parseFloat(maxValue) || 0;
      if (min < 0 || max < 0) {
        toast.error('Os valores de presentes devem ser positivos.');
        return;
      }
      if (max > 0 && min > max) {
        toast.error('O valor mínimo não pode ser maior que o valor máximo.');
        return;
      }
      if (!drawDate) {
        toast.error('Selecione a data limite do sorteio.');
        return;
      }
      setStep(3);
    }
  };

  // Submissão Final
  const handleFinishWizard = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para criar um Amigo Secreto.');
      return;
    }

    if (inviteMode === 'individual' && individualNames.length < 2) {
      toast.error('Para o modo Anti-Penetras, adicione pelo menos 2 participantes convidados!');
      return;
    }

    setLoading(true);

    try {
      let targetEventId: number;

      if (createMode === 'link_existing' && selectedExistingEventId) {
        targetEventId = selectedExistingEventId;
        // Atualizar status e categoria se necessário
        await supabase
          .from('table_reune')
          .update({
            categoria_evento: 'amigo_secreto',
          })
          .eq('id', targetEventId);
      } else {
        // Criar novo evento completo
        const finalTitle = `${selectedEmoji} ${title.trim()}`;
        const { data: newEvent, error: eventError } = await supabase
          .from('table_reune')
          .insert({
            title: finalTitle,
            description: `Amigo Secreto criado com o ReUNE`,
            user_id: user.id,
            event_date: partyDate,
            event_time: partyTime,
            location: locationName.trim() || address.trim() || 'A definir',
            address: address.trim() || locationName.trim() || null,
            latitude: latitude,
            longitude: longitude,
            place_id: placeId,
            tipo_evento: 'confraternizacao',
            categoria_evento: 'amigo_secreto',
            status: 'created',
            is_public: false,
          })
          .select()
          .single();

        if (eventError) throw eventError;
        targetEventId = newEvent.id;
      }

      // Garantir registro em event_dynamics
      const { data: existingDynamic } = await supabase
        .from('event_dynamics')
        .select('id')
        .eq('event_id', targetEventId)
        .eq('type', 'secret_santa')
        .maybeSingle();

      if (!existingDynamic) {
        const { error: dynamicError } = await supabase
          .from('event_dynamics')
          .insert({
            event_id: targetEventId,
            type: 'secret_santa',
          });
        if (dynamicError) throw dynamicError;
      }

      // Criar configuração em event_secret_santa
      const min = minValue ? parseFloat(minValue) : null;
      const max = maxValue ? parseFloat(maxValue) : null;

      const { data: ssConfig, error: ssError } = await supabase
        .from('event_secret_santa')
        .insert({
          event_id: targetEventId,
          min_value: min,
          max_value: max,
          draw_date: drawDate ? `${drawDate}T18:00:00` : null,
          invite_mode: inviteMode,
          has_drawn: false,
        })
        .select()
        .single();

      if (ssError) throw ssError;

      // Inserir participantes
      let insertedIndividuals: Array<{ id: string; display_name: string; invitation_token: string }> = [];

      // Sempre adicionar o organizador como participante
      const organizerName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Organizador';
      await supabase
        .from('event_secret_santa_participants')
        .insert({
          secret_santa_id: ssConfig.id,
          user_id: user.id,
          display_name: organizerName,
          email: user.email,
          status: 'confirmed',
        });

      if (inviteMode === 'individual') {
        const participantsToInsert = individualNames.map(name => ({
          secret_santa_id: ssConfig.id,
          display_name: name,
          status: 'pending',
        }));

        const { data: insertedData, error: partError } = await supabase
          .from('event_secret_santa_participants')
          .insert(participantsToInsert)
          .select('id, display_name, invitation_token');

        if (partError) throw partError;
        insertedIndividuals = insertedData || [];
      }

      toast.success('🎉 Amigo Secreto criado com sucesso!', {
        description: 'Agora compartilhe com a galera no WhatsApp!',
      });

      // Preparar dados para o modal de compartilhamento
      setCreatedEventId(targetEventId);
      setCreatedShareData({
        eventTitle: title,
        inviteMode,
        secretSantaData: {
          minValue: min,
          maxValue: max,
          drawDate,
          eventDate: partyDate,
          eventTime: partyTime,
          location: locationName,
          address,
        },
        individualParticipants: insertedIndividuals,
      });

      // Fechar wizard e abrir modal de compartilhamento
      onOpenChange(false);
      setShareModalOpen(true);

      if (onSuccess) {
        onSuccess(targetEventId);
      }
    } catch (err: any) {
      console.error('Erro ao criar Amigo Secreto:', err);
      toast.error('Erro ao criar o Amigo Secreto.', {
        description: err.message || 'Tente novamente em instantes.',
      });
    } finally {
      setLoading(false);
    }
  };

  const availableEventsToLink = existingEvents.filter(e => e.isOwner && !e.hasSecretSanta);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-8 border-[3px] border-black rounded-3xl bg-[#FFFDF0] shadow-[8px_8px_0px_0px_#000000]">
          {/* Header com Stepper Neobrutalism */}
          <DialogHeader className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-[2px] border-black bg-[#FFD93D] font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000000]">
                <Gift className="w-3.5 h-3.5" />
                Passo {step} de 3
              </div>
              <span className="text-xs font-black uppercase text-gray-500">
                {step === 1 && 'Identidade & Vibe'}
                {step === 2 && 'Presentes & Sorteio'}
                {step === 3 && 'A Festa & Convites'}
              </span>
            </div>

            {/* Barra de Progresso em Segmentos */}
            <div className="grid grid-cols-3 gap-2">
              <div className={`h-2.5 rounded-full border-[2px] border-black transition-all ${step >= 1 ? 'bg-[#FF6B35]' : 'bg-gray-200'}`} />
              <div className={`h-2.5 rounded-full border-[2px] border-black transition-all ${step >= 2 ? 'bg-[#FF69B4]' : 'bg-gray-200'}`} />
              <div className={`h-2.5 rounded-full border-[2px] border-black transition-all ${step >= 3 ? 'bg-[#B8F3D0]' : 'bg-gray-200'}`} />
            </div>

            <DialogTitle className="text-2xl md:text-3xl font-black text-black">
              {step === 1 && 'Qual é a vibe do seu Amigo Secreto? 🎁'}
              {step === 2 && 'Quanto vale o presente e quando é o sorteio? 💰'}
              {step === 3 && 'Aonde vai ser a festa e como vai convidar? 🥳'}
            </DialogTitle>
          </DialogHeader>

          {/* CONTEÚDO DO PASSO 1 */}
          {step === 1 && (
            <div className="space-y-6 my-4">
              {/* Opção de criar novo vs vincular existente */}
              {availableEventsToLink.length > 0 && (
                <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl border-[2px] border-black bg-white shadow-[3px_3px_0px_0px_#000000]">
                  <button
                    type="button"
                    onClick={() => setCreateMode('new')}
                    className={`py-2 px-3 rounded-xl font-black text-xs md:text-sm border-[2px] transition-all flex items-center justify-center gap-2 ${
                      createMode === 'new'
                        ? 'border-black bg-[#FFD93D] shadow-[2px_2px_0px_0px_#000000]'
                        : 'border-transparent text-gray-600 hover:text-black'
                    }`}
                  >
                    <Plus className="w-4 h-4" /> Criar Novo Evento
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMode('link_existing')}
                    className={`py-2 px-3 rounded-xl font-black text-xs md:text-sm border-[2px] transition-all flex items-center justify-center gap-2 ${
                      createMode === 'link_existing'
                        ? 'border-black bg-[#A8D8FF] shadow-[2px_2px_0px_0px_#000000]'
                        : 'border-transparent text-gray-600 hover:text-black'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" /> Vincular a Evento Meu
                  </button>
                </div>
              )}

              {/* Se vincular a evento existente */}
              {createMode === 'link_existing' && availableEventsToLink.length > 0 && (
                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase text-gray-700">
                    Selecione um evento da sua lista:
                  </Label>
                  <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                    {availableEventsToLink.map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => handleSelectExistingEvent(ev.id.toString())}
                        className={`p-3 rounded-xl border-[2px] border-black cursor-pointer transition-all flex items-center justify-between ${
                          selectedExistingEventId === ev.id
                            ? 'bg-[#A8D8FF] shadow-[3px_3px_0px_0px_#000000]'
                            : 'bg-white hover:bg-yellow-50'
                        }`}
                      >
                        <div>
                          <p className="font-black text-sm text-black">{ev.title}</p>
                          <p className="text-xs text-gray-600 font-bold">
                            📅 {ev.event_date} {ev.event_time ? `às ${ev.event_time}` : ''}
                          </p>
                        </div>
                        {selectedExistingEventId === ev.id && (
                          <div className="w-6 h-6 rounded-full border-[2px] border-black bg-[#B8F3D0] flex items-center justify-center">
                            <Check className="w-4 h-4 text-black" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nome do Amigo Secreto */}
              <div className="space-y-2">
                <Label className="font-black text-xs uppercase text-gray-700">
                  Nome do Grupo ou Edição
                </Label>
                <div className="flex gap-2">
                  {/* Seletor de Emoji */}
                  <div className="relative group">
                    <button
                      type="button"
                      className="w-14 h-12 rounded-xl border-[3px] border-black bg-[#FFD93D] text-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      {selectedEmoji}
                    </button>
                  </div>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ex: Amigo Secreto dos Devs 2026"
                    className="h-12 border-[3px] border-black rounded-xl text-base font-bold shadow-[3px_3px_0px_0px_#000000] focus-visible:ring-0 focus-visible:border-black"
                  />
                </div>

                {/* Seletor Rápido de Emojis */}
                <div className="flex gap-2 pt-1 flex-wrap">
                  {EMOJI_OPTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setSelectedEmoji(em)}
                      className={`w-9 h-9 rounded-lg border-[2px] text-lg flex items-center justify-center transition-transform ${
                        selectedEmoji === em
                          ? 'border-black bg-white scale-110 shadow-[2px_2px_0px_0px_#000000]'
                          : 'border-black/30 hover:border-black hover:scale-105'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sugestões Rápidas de Nome */}
              <div className="space-y-2">
                <Label className="font-black text-xs uppercase text-gray-500">
                  Ideias Rápidas (1 clique):
                </Label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SUGGESTIONS.map(sug => (
                    <button
                      key={sug.label}
                      type="button"
                      onClick={() => setTitle(`${sug.prefix} ${currentYear}`)}
                      className="px-3 py-1.5 rounded-lg border-[2px] border-black bg-white hover:bg-[#B8F3D0] text-xs font-black shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CONTEÚDO DO PASSO 2 */}
          {step === 2 && (
            <div className="space-y-6 my-4">
              {/* Presets de Valores */}
              <div className="space-y-2">
                <Label className="font-black text-xs uppercase text-gray-700">
                  Faixa de Preço do Presente:
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div
                    onClick={() => handleApplyPreset('lembrancinha')}
                    className={`p-3 rounded-2xl border-[3px] border-black cursor-pointer transition-all text-center ${
                      valuePreset === 'lembrancinha'
                        ? 'bg-[#B8F3D0] shadow-[4px_4px_0px_0px_#000000] scale-[1.02]'
                        : 'bg-white hover:bg-yellow-50'
                    }`}
                  >
                    <span className="text-xl">☕</span>
                    <p className="font-black text-xs uppercase mt-1">Lembrança</p>
                    <p className="text-xs font-bold text-gray-600">R$ 15 - 35</p>
                  </div>

                  <div
                    onClick={() => handleApplyPreset('padrao')}
                    className={`p-3 rounded-2xl border-[3px] border-black cursor-pointer transition-all text-center ${
                      valuePreset === 'padrao'
                        ? 'bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000000] scale-[1.02]'
                        : 'bg-white hover:bg-yellow-50'
                    }`}
                  >
                    <span className="text-xl">🎁</span>
                    <p className="font-black text-xs uppercase mt-1">Padrão</p>
                    <p className="text-xs font-bold text-gray-600">R$ 50 - 100</p>
                  </div>

                  <div
                    onClick={() => handleApplyPreset('caprichado')}
                    className={`p-3 rounded-2xl border-[3px] border-black cursor-pointer transition-all text-center ${
                      valuePreset === 'caprichado'
                        ? 'bg-[#FF69B4] shadow-[4px_4px_0px_0px_#000000] scale-[1.02]'
                        : 'bg-white hover:bg-yellow-50'
                    }`}
                  >
                    <span className="text-xl">⭐</span>
                    <p className="font-black text-xs uppercase mt-1">Caprichado</p>
                    <p className="text-xs font-bold text-gray-600">R$ 100 - 200</p>
                  </div>

                  <div
                    onClick={() => handleApplyPreset('custom')}
                    className={`p-3 rounded-2xl border-[3px] border-black cursor-pointer transition-all text-center ${
                      valuePreset === 'custom'
                        ? 'bg-[#A8D8FF] shadow-[4px_4px_0px_0px_#000000] scale-[1.02]'
                        : 'bg-white hover:bg-yellow-50'
                    }`}
                  >
                    <span className="text-xl">✏️</span>
                    <p className="font-black text-xs uppercase mt-1">Outro Valor</p>
                    <p className="text-xs font-bold text-gray-600">Livre</p>
                  </div>
                </div>
              </div>

              {/* Inputs de Valor Mínimo e Máximo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-gray-700">Mínimo (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={minValue}
                    onChange={e => {
                      setMinValue(e.target.value);
                      setValuePreset('custom');
                    }}
                    placeholder="Ex: 50"
                    className="h-11 border-[2px] border-black rounded-xl font-bold shadow-[2px_2px_0px_0px_#000000]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-gray-700">Máximo (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={maxValue}
                    onChange={e => {
                      setMaxValue(e.target.value);
                      setValuePreset('custom');
                    }}
                    placeholder="Ex: 100"
                    className="h-11 border-[2px] border-black rounded-xl font-bold shadow-[2px_2px_0px_0px_#000000]"
                  />
                </div>
              </div>

              {/* Data do Sorteio */}
              <div className="space-y-2 p-4 rounded-2xl border-[2px] border-black bg-white shadow-[3px_3px_0px_0px_#000000]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#FF6B35]" />
                  <Label className="font-black text-xs uppercase text-black">
                    Data Limite do Sorteio
                  </Label>
                </div>
                <p className="text-xs text-gray-600 font-medium">
                  Até que dia os amigos têm para entrar e preencher a lista de presentes antes de girar a roleta?
                </p>
                <Input
                  type="date"
                  value={drawDate}
                  onChange={e => setDrawDate(e.target.value)}
                  className="h-11 border-[2px] border-black rounded-xl font-bold mt-2"
                />
              </div>
            </div>
          )}

          {/* CONTEÚDO DO PASSO 3 */}
          {step === 3 && (
            <div className="space-y-6 my-4">
              {/* Se for Novo Evento: Local e Data da Revelação */}
              {createMode === 'new' && (
                <div className="space-y-3 p-4 rounded-2xl border-[2px] border-black bg-white shadow-[3px_3px_0px_0px_#000000]">
                  <div className="flex items-center gap-2">
                    <PartyPopper className="w-5 h-5 text-[#FF69B4]" />
                    <span className="font-black text-xs uppercase text-black">
                      A Festa da Revelação dos Presentes
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-700">Data do Evento</Label>
                      <Input
                        type="date"
                        value={partyDate}
                        onChange={e => setPartyDate(e.target.value)}
                        className="h-10 border-[2px] border-black rounded-xl font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-700">Horário</Label>
                      <Input
                        type="time"
                        value={partyTime}
                        onChange={e => setPartyTime(e.target.value)}
                        className="h-10 border-[2px] border-black rounded-xl font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <Label className="text-xs font-bold text-gray-700">Nome do Local (Ex: Casa do Lucas, Bar do Zé)</Label>
                    <Input
                      value={locationName}
                      onChange={e => setLocationName(e.target.value)}
                      placeholder="Onde vai rolar a troca de presentes?"
                      className="h-10 border-[2px] border-black rounded-xl font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-700">Endereço (com busca no mapa)</Label>
                    <GoogleAddressAutocomplete
                      value={address}
                      onChange={setAddress}
                      onPlaceSelect={(place: SelectedPlace) => {
                        setAddress(place.address);
                        setLatitude(place.latitude);
                        setLongitude(place.longitude);
                        setPlaceId(place.placeId);
                        if (place.name && !locationName) {
                          setLocationName(place.name);
                        }
                      }}
                      placeholder="Digite o endereço..."
                    />
                  </div>

                  {latitude && longitude && (
                    <div className="pt-2">
                      <EventMapPreview
                        latitude={latitude}
                        longitude={longitude}
                        address={address}
                        locationName={locationName || 'Local da Festa'}
                        height="140px"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* SELETOR DE MODO DE CONVITE: Aberto vs Individual */}
              <div className="space-y-3">
                <Label className="font-black text-xs uppercase text-gray-700">
                  Como você quer convidar a galera?
                </Label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Modo Aberto */}
                  <div
                    onClick={() => setInviteMode('open')}
                    className={`p-4 rounded-2xl border-[3px] border-black cursor-pointer transition-all flex flex-col justify-between ${
                      inviteMode === 'open'
                        ? 'bg-[#B8F3D0] shadow-[5px_5px_0px_0px_#000000] scale-[1.01]'
                        : 'bg-white hover:bg-yellow-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">🚀</span>
                        {inviteMode === 'open' && (
                          <span className="px-2 py-0.5 rounded-full border-[2px] border-black bg-white text-[10px] font-black uppercase">
                            Selecionado
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-base text-black mb-1">
                        Link Aberto do Grupo
                      </h4>
                      <p className="text-xs font-medium text-gray-700 leading-relaxed">
                        Envie 1 link geral no WhatsApp da turma. Cada um clica, digita seu nome, seus desejos e cria um PIN de 4 dígitos. Rápido e prático!
                      </p>
                    </div>
                  </div>

                  {/* Modo Individual (Anti-Penetras) */}
                  <div
                    onClick={() => setInviteMode('individual')}
                    className={`p-4 rounded-2xl border-[3px] border-black cursor-pointer transition-all flex flex-col justify-between ${
                      inviteMode === 'individual'
                        ? 'bg-[#A8D8FF] shadow-[5px_5px_0px_0px_#000000] scale-[1.01]'
                        : 'bg-white hover:bg-yellow-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">🛡️</span>
                        {inviteMode === 'individual' && (
                          <span className="px-2 py-0.5 rounded-full border-[2px] border-black bg-white text-[10px] font-black uppercase">
                            Selecionado
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-base text-black mb-1">
                        Convites Anti-Penetras
                      </h4>
                      <p className="text-xs font-medium text-gray-700 leading-relaxed">
                        Você pré-cadastra a lista de convidados. O ReUNE gera um link exclusivo para cada pessoa. Nenhum invasor consegue entrar!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Se Modo Individual: Lista de Participantes */}
              {inviteMode === 'individual' && (
                <div className="space-y-3 p-4 rounded-2xl border-[2px] border-black bg-white shadow-[3px_3px_0px_0px_#000000]">
                  <div className="flex items-center justify-between">
                    <Label className="font-black text-xs uppercase text-black flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#FF6B35]" />
                      Adicione os Participantes ({individualNames.length} adicionados):
                    </Label>
                    <span className="text-[11px] font-bold text-gray-500">Mínimo 2</span>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddIndividualName();
                        }
                      }}
                      placeholder="Digite o nome ou cole vários (Lucas, Maria, João)..."
                      className="h-10 border-[2px] border-black rounded-xl font-bold"
                    />
                    <Button
                      type="button"
                      onClick={handleAddIndividualName}
                      className="h-10 px-4 bg-[#FFD93D] hover:bg-[#FFE169] text-black font-black border-[2px] border-black rounded-xl shadow-[2px_2px_0px_0px_#000000]"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Chips de Participantes */}
                  {individualNames.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1 pr-1">
                      {individualNames.map((name, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-[2px] border-black bg-[#FFD93D] text-black text-xs font-black shadow-[2px_2px_0px_0px_#000000]"
                        >
                          <span>{name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveIndividualName(idx)}
                            className="w-4 h-4 rounded-full hover:bg-black/20 flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* RODAPÉ COM NAVEGAÇÃO DOS PASSOS (FIXO NO BOTTOM NO MOBILE) */}
          <div className="pt-4 pb-1 border-t-2 border-black/10 flex items-center justify-between gap-3 sticky bottom-0 bg-[#FFFDF0] z-10">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((step - 1) as 1 | 2)}
                className="h-11 px-4 border-[2px] border-black rounded-xl font-bold text-xs flex items-center gap-1.5 bg-white shadow-[2px_2px_0px_0px_#000000] touch-press"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="h-11 px-6 bg-[#FFD93D] hover:bg-[#FFE169] text-black font-black text-xs md:text-sm border-[2px] border-black rounded-xl shadow-[3px_3px_0px_0px_#000000] touch-press active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1.5"
              >
                Avançar <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={loading}
                onClick={handleFinishWizard}
                className="h-12 px-6 bg-[#B8F3D0] hover:bg-[#A3ECC0] text-black font-black text-sm border-[3px] border-black rounded-xl shadow-[4px_4px_0px_0px_#000000] touch-press active:translate-x-[2px] active:translate-y-[2px] flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Criando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> CRIAR E GERAR CONVITES ➔
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Compartilhamento no WhatsApp Pós-Criação */}
      {createdShareData && createdEventId && (
        <SecretSantaShareModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          eventId={createdEventId}
          eventTitle={createdShareData.eventTitle}
          inviteMode={createdShareData.inviteMode}
          secretSantaData={createdShareData.secretSantaData}
          individualParticipants={createdShareData.individualParticipants}
          onNavigateToPanel={() => {
            navigate(`/event/${createdEventId}/secret-santa/participants`);
          }}
        />
      )}
    </>
  );
};
