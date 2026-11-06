import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, Copy, Check, ExternalLink, ShieldCheck, Share2, Sparkles, Gift } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface SecretSantaShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  eventTitle: string;
  inviteMode: 'open' | 'individual';
  secretSantaData: {
    minValue?: number | null;
    maxValue?: number | null;
    drawDate?: string | null;
    eventDate?: string;
    eventTime?: string;
    location?: string;
    address?: string;
  };
  individualParticipants?: Array<{
    id: string;
    display_name: string;
    invitation_token: string;
  }>;
  onNavigateToPanel?: () => void;
}

export const SecretSantaShareModal: React.FC<SecretSantaShareModalProps> = ({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  inviteMode,
  secretSantaData,
  individualParticipants = [],
  onNavigateToPanel,
}) => {
  const [copiedGroup, setCopiedGroup] = useState(false);
  const [copiedTokens, setCopiedTokens] = useState<Record<string, boolean>>({});

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://reuneapp.com.br';
  const openInviteUrl = `${origin}/amigo/${eventId}/entrar`;

  // Formatar datas para exibição amigável
  const formatFriendlyDate = (dateStr?: string | null) => {
    if (!dateStr) return 'A definir';
    try {
      // Se vier apenas YYYY-MM-DD
      const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const [year, month, day] = datePart.split('-').map(Number);
      const d = new Date(year, month - 1, day, 12, 0, 0);
      return format(d, "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const valorFormatado = () => {
    const min = secretSantaData.minValue;
    const max = secretSantaData.maxValue;
    if (min && max) return `R$ ${min} a R$ ${max}`;
    if (min) return `A partir de R$ ${min}`;
    if (max) return `Até R$ ${max}`;
    return 'Livre / A combinar';
  };

  // Mensagem do grupo (modo aberto)
  const groupMessage = `🎁 *AMIGO SECRETO: ${eventTitle}* 🎁

Fala galera! Nosso Amigo Secreto já está valendo e você foi convidado! 🎄

💰 *Valor sugerido:* ${valorFormatado()}
🎲 *Data do sorteio:* ${formatFriendlyDate(secretSantaData.drawDate)}
🎉 *Festa da revelação:* ${formatFriendlyDate(secretSantaData.eventDate)}${secretSantaData.eventTime ? ` às ${secretSantaData.eventTime}` : ''}
📍 *Local:* ${secretSantaData.location || secretSantaData.address || 'A definir'}

👉 *Clique no link para entrar, dizer o que quer ganhar e criar seu PIN secreto:*
${openInviteUrl}

_Organizado com carinho pelo ReUNE_ 🚀`;

  const handleCopyGroupMessage = () => {
    navigator.clipboard.writeText(groupMessage);
    setCopiedGroup(true);
    toast.success('Mensagem copiada para a área de transferência!');
    setTimeout(() => setCopiedGroup(false), 2000);
  };

  const handleCopyLinkOnly = () => {
    navigator.clipboard.writeText(openInviteUrl);
    toast.success('Link de convite copiado!');
  };

  const handleShareWhatsAppGroup = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(groupMessage)}`;
    window.open(url, '_blank');
  };

  const handleShareWhatsAppIndividual = (p: { display_name: string; invitation_token: string }) => {
    const tokenUrl = `${origin}/amigo/entrar/${p.invitation_token}`;
    const personalMsg = `Fala, *${p.display_name}*! 🎁 

Você foi convidado(a) para o nosso Amigo Secreto: *${eventTitle}*!

💰 *Valor do presente:* ${valorFormatado()}
🎲 *Data do sorteio:* ${formatFriendlyDate(secretSantaData.drawDate)}
🎉 *Festa da revelação:* ${formatFriendlyDate(secretSantaData.eventDate)}

Este é o seu *link exclusivo e seguro* para confirmar presença e cadastrar o que você quer ganhar:
👉 ${tokenUrl}

_Guarde esse link só pra você!_ 🤫`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(personalMsg)}`;
    window.open(url, '_blank');
  };

  const handleCopyIndividualLink = (p: { id: string; invitation_token: string }) => {
    const tokenUrl = `${origin}/amigo/entrar/${p.invitation_token}`;
    navigator.clipboard.writeText(tokenUrl);
    setCopiedTokens(prev => ({ ...prev, [p.id]: true }));
    toast.success('Link exclusivo copiado!');
    setTimeout(() => {
      setCopiedTokens(prev => ({ ...prev, [p.id]: false }));
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6 border-[3px] border-black rounded-3xl bg-[#FFFDF0] shadow-[8px_8px_0px_0px_#000000]">
        <DialogHeader className="space-y-2 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-[2px] border-black bg-[#B8F3D0] text-black font-black text-xs uppercase tracking-wider w-fit shadow-[2px_2px_0px_0px_#000000]">
            <Sparkles className="w-3.5 h-3.5 text-black" />
            Amigo Secreto Criado com Sucesso!
          </div>
          <DialogTitle className="text-2xl md:text-3xl font-black text-black">
            Bora convidar a galera no WhatsApp? 🚀
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold text-gray-700">
            {inviteMode === 'open' 
              ? 'Envie o link do grupo direto no WhatsApp. Cada amigo entra, escolhe o que quer ganhar e define seu PIN.'
              : 'Seu amigo secreto está blindado contra penetras 🛡️. Abaixo estão os links exclusivos de cada pessoa cadastrada.'}
          </DialogDescription>
        </DialogHeader>

        {inviteMode === 'open' ? (
          /* MODO ABERTO - LINK GERAL */
          <div className="space-y-5 my-2">
            {/* Box Preview da Mensagem */}
            <div className="relative p-4 rounded-2xl border-[3px] border-black bg-white shadow-[4px_4px_0px_0px_#000000]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-dashed border-gray-200">
                <span className="text-xs font-black uppercase text-gray-500">
                  Preview da Mensagem do WhatsApp
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Pronto pra envio
                </span>
              </div>
              <p className="text-xs font-mono whitespace-pre-line text-gray-800 leading-relaxed max-h-44 overflow-y-auto pr-1">
                {groupMessage}
              </p>
            </div>

            {/* Ações Rápidas */}
            <div className="space-y-2.5">
              <Button
                onClick={handleShareWhatsAppGroup}
                className="w-full h-14 bg-[#25D366] hover:bg-[#1EBE5D] text-black font-black text-sm md:text-base border-[3px] border-black rounded-2xl shadow-[5px_5px_0px_0px_#000000] touch-press transition-all flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="w-5 h-5 text-black" />
                COMPARTILHAR NO GRUPO DO WHATSAPP
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleCopyGroupMessage}
                  className="h-11 bg-white hover:bg-gray-100 text-black font-bold text-xs border-[2px] border-black rounded-xl shadow-[3px_3px_0px_0px_#000000] touch-press flex items-center justify-center gap-1.5"
                >
                  {copiedGroup ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copiedGroup ? 'Copiado!' : 'Copiar Mensagem'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyLinkOnly}
                  className="h-11 bg-white hover:bg-gray-100 text-black font-bold text-xs border-[2px] border-black rounded-xl shadow-[3px_3px_0px_0px_#000000] touch-press flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  Copiar Só o Link
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* MODO INDIVIDUAL - LINKS ANTI-PENETRA */
          <div className="space-y-4 my-2">
            <div className="p-3.5 rounded-2xl border-[2px] border-black bg-[#E2F7EB] flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <p className="text-xs font-bold text-emerald-950">
                Cada convidado tem um link exclusivo. Clique no botão de cada um para abrir o WhatsApp já com a mensagem pronta.
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {individualParticipants.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl border-[2px] border-black bg-white flex items-center justify-between gap-3 shadow-[2px_2px_0px_0px_#000000]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full border-[2px] border-black bg-[#FFD93D] flex items-center justify-center font-black text-xs flex-shrink-0">
                      {p.display_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-black text-sm truncate text-black">
                      {p.display_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleCopyIndividualLink(p)}
                      variant="outline"
                      className="h-8 px-2.5 border-[2px] border-black bg-white text-xs font-bold rounded-lg shadow-[2px_2px_0px_0px_#000000]"
                    >
                      {copiedTokens[p.id] ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleShareWhatsAppIndividual(p)}
                      className="h-8 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-black font-black text-xs border-[2px] border-black rounded-lg shadow-[2px_2px_0px_0px_#000000] flex items-center gap-1.5"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rodapé com atalho para o painel */}
        <div className="pt-4 border-t-2 border-black/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold text-gray-600 hover:text-black w-full sm:w-auto"
          >
            Fechar janela
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              if (onNavigateToPanel) {
                onNavigateToPanel();
              }
            }}
            className="w-full sm:w-auto h-11 px-5 bg-[#FFD93D] hover:bg-[#FFE169] text-black font-black text-xs md:text-sm border-[2px] border-black rounded-xl shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center gap-2"
          >
            <Gift className="w-4 h-4" />
            GERENCIAR AMIGO SECRETO ➔
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
