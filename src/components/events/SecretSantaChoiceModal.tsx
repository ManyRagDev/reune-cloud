import { motion, AnimatePresence } from "framer-motion";
import { Zap, Gift, Check, ArrowRight, X, Sparkles, MapPin, ShieldCheck, Link2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NBLight, NBDark, NBPalette, nb } from "@/lib/neobrutalism";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

interface SecretSantaChoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSelectQuick: () => void;
  onSelectFull: () => void;
  groupTitle?: string;
  isDark?: boolean;
}

export const SecretSantaChoiceModal = ({
  open,
  onClose,
  onSelectQuick,
  onSelectFull,
  groupTitle,
  isDark = false,
}: SecretSantaChoiceModalProps) => {
  const C: NBPalette = isDark ? NBDark : NBLight;

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto pb-safe">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Dialog (Bottom-Sheet no Mobile, Modal Centralizado no Desktop) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className={`relative w-full max-w-4xl max-h-[94vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border-t-[3px] sm:border-[3px] border-black shadow-[0px_-4px_0px_#000] sm:shadow-[8px_8px_0px_#1A1A1A] p-5 sm:p-8 z-10`}
          style={{ backgroundColor: C.cardBg, color: C.text }}
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-xl ${nb.border} ${nb.shadowSm} ${nb.hover} transition-transform`}
            style={{ backgroundColor: C.pink, color: "#fff" }}
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center max-w-xl mx-auto mb-7">
            <span
              className={`inline-block px-3 py-1 rounded-full border-[2px] border-black text-xs font-black uppercase mb-3 shadow-[2px_2px_0px_#1A1A1A]`}
              style={{ backgroundColor: C.yellow, color: C.black }}
            >
              🎉 Amigo Secreto ReUNE
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight">
              Como você prefere organizar{groupTitle ? ` o "${groupTitle}"` : " seu amigo secreto"}?
            </h2>
            <p className="mt-2 text-xs sm:text-sm font-medium opacity-80" style={{ color: C.textMuted }}>
              Escolha entre o fluxo automático com <strong className="underline">1 link no grupo</strong> ou o sorteador instantâneo <strong className="underline">chega e faz</strong>.
            </p>
          </div>

          {/* Grid de Opções */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ═══ OPÇÃO 1 (PROTAGONISTA): LINK ÚNICO DE GRUPO (SUÍTE COMPLETA) ═══ */}
            <div
              className={`flex flex-col justify-between p-6 rounded-2xl border-[3px] border-black shadow-[6px_6px_0px_#1A1A1A] relative hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#1A1A1A] transition-all`}
              style={{ backgroundColor: isDark ? "#2A231C" : "#FFFBEB" }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl border-[2px] border-black flex items-center justify-center shadow-[3px_3px_0px_#1A1A1A]"
                    style={{ backgroundColor: C.yellow }}
                  >
                    <Link2 className="w-6 h-6 text-black" />
                  </div>
                  <span
                    className="px-3 py-1 rounded-full border-[2px] border-black text-[11px] font-black uppercase shadow-[2px_2px_0px_#1A1A1A]"
                    style={{ backgroundColor: C.yellow, color: C.black }}
                  >
                    ⭐ Mais Usado em Grupos
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black mb-1">Link Único para o Grupo</h3>
                <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-4">
                  🔗 Cole 1 link no WhatsApp e a galera entra sozinha
                </p>

                {/* Passo a Passo Visual */}
                <div className="p-3.5 rounded-xl border-[2px] border-black bg-white/70 dark:bg-black/20 mb-4 space-y-2 text-xs sm:text-sm font-bold">
                  <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                    Como funciona:
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] flex items-center justify-center shrink-0 font-black mt-0.5">1</span>
                    <span>Você cria o evento em 1 min (data, valor e local)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] flex items-center justify-center shrink-0 font-black mt-0.5">2</span>
                    <span>Manda <strong>1 único link</strong> no grupo do WhatsApp</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] flex items-center justify-center shrink-0 font-black mt-0.5">3</span>
                    <span>Amigos entram, escolhem presentes e criam seu PIN</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center shrink-0 font-black mt-0.5">🎲</span>
                    <span className="text-emerald-800 dark:text-emerald-300">Você aperta "Sortear" quando todos entrarem!</span>
                  </div>
                </div>

                {/* Benefícios ReUNE (É mais que um sorteador) */}
                <ul className="space-y-2 text-xs sm:text-sm font-semibold mb-6">
                  <li className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>Lista de presentes</strong> (o que cada amigo quer ganhar)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Festa da revelação com mapa e rota <strong>Uber/Waze</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Painel para acompanhar quem já confirmou</span>
                  </li>
                </ul>
              </div>

              <div>
                <Button
                  size="lg"
                  onClick={onSelectFull}
                  className={`w-full h-13 rounded-xl font-black text-sm border-[3px] border-black shadow-[4px_4px_0px_#1A1A1A] touch-press hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1A1A1A] transition-all`}
                  style={{ backgroundColor: C.orange, color: "#fff" }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Criar e Gerar Link do Grupo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-[11px] font-medium text-center mt-2 opacity-75">
                  Leva só 1 minuto • Convidados não precisam de conta
                </p>
              </div>
            </div>

            {/* ═══ OPÇÃO 2: SORTEADOR RELÂMPAGO (CHEGA E FAZ / SEM CADASTRO) ═══ */}
            <div
              className={`flex flex-col justify-between p-6 rounded-2xl border-[3px] border-black shadow-[5px_5px_0px_#1A1A1A] relative hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#1A1A1A] transition-all`}
              style={{ backgroundColor: isDark ? "#24201C" : "#F4FDF9" }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl border-[2px] border-black flex items-center justify-center shadow-[3px_3px_0px_#1A1A1A]"
                    style={{ backgroundColor: C.mint }}
                  >
                    <Zap className="w-6 h-6 text-black fill-current" />
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full border-[2px] border-black text-[11px] font-black uppercase shadow-[1px_1px_0px_#1A1A1A]"
                    style={{ backgroundColor: C.mint, color: C.black }}
                  >
                    ⚡ Chega e Faz • Sem Cadastro
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black mb-1">Sorteador Relâmpago</h3>
                <p className="text-xs sm:text-sm font-semibold text-teal-700 dark:text-teal-400 mb-4">
                  ✉️ Para quem já tem a lista de nomes e quer sortear agora
                </p>

                {/* Passo a Passo Visual */}
                <div className="p-3.5 rounded-xl border-[2px] border-black bg-white/70 dark:bg-black/20 mb-4 space-y-2 text-xs sm:text-sm font-bold">
                  <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                    Como funciona:
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] flex items-center justify-center shrink-0 font-black mt-0.5">1</span>
                    <span>Você digita a lista de nomes dos amigos agora</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] flex items-center justify-center shrink-0 font-black mt-0.5">2</span>
                    <span>O sorteio acontece na hora (na tela do seu celular)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] flex items-center justify-center shrink-0 font-black mt-0.5">3</span>
                    <span>Você envia o envelope de cada amigo no <strong>privado</strong></span>
                  </div>
                </div>

                {/* Benefícios */}
                <ul className="space-y-2 text-xs sm:text-sm font-semibold mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                    <span>Zero cadastro para você e amigos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                    <span>Envelopes digitais com <strong>lacre de cera anti-espião</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <WhatsAppIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Botão direto para despachar no WhatsApp</span>
                  </li>
                </ul>
              </div>

              <div>
                <Button
                  size="lg"
                  onClick={onSelectQuick}
                  className={`w-full h-13 rounded-xl font-black text-sm border-[3px] border-black shadow-[4px_4px_0px_#1A1A1A] touch-press hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1A1A1A] transition-all`}
                  style={{ backgroundColor: C.mint, color: C.black }}
                >
                  <Zap className="w-4 h-4 mr-2 fill-current" />
                  Digitar Nomes e Sortear na Hora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-[11px] font-medium text-center mt-2 opacity-75">
                  Envelopes individuais enviados no privado
                </p>
              </div>
            </div>
          </div>

          {/* Micro-footer explicativo */}
          <div className="mt-6 text-center text-xs font-semibold opacity-75">
            🔒 100% Gratuito em ambas as opções • Sem anúncios invasivos • Sorteio criptografado e secreto
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
