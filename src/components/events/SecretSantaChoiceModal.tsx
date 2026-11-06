import { motion, AnimatePresence } from "framer-motion";
import { Zap, Gift, Check, ArrowRight, X, Sparkles, MapPin, ShieldCheck, HeartHandshake } from "lucide-react";
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
          className={`relative w-full max-w-3xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border-t-[3px] sm:border-[3px] border-black shadow-[0px_-4px_0px_#000] sm:shadow-[8px_8px_0px_#1A1A1A] p-5 sm:p-8 z-10`}
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
          <div className="text-center max-w-xl mx-auto mb-8">
            <span
              className={`inline-block px-3 py-1 rounded-full border-[2px] border-black text-xs font-black uppercase mb-3 shadow-[2px_2px_0px_#1A1A1A]`}
              style={{ backgroundColor: C.yellow, color: C.black }}
            >
              Amigo Secreto Transparente ✨
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight">
              Como você prefere organizar{groupTitle ? ` o "${groupTitle}"` : " seu amigo secreto"}?
            </h2>
            <p className="mt-2 text-sm sm:text-base font-medium opacity-80" style={{ color: C.textMuted }}>
              Sem pegadinhas: você pode sortear <strong className="underline">instantaneamente sem cadastro</strong> ou criar sua conta em <strong className="underline">apenas 1 minuto</strong> para ter a suíte completa com presentes e festa.
            </p>
          </div>

          {/* Grid de Opções */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opção 1: Sorteador Relâmpago */}
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
                    Instantâneo ⚡
                  </span>
                </div>

                <h3 className="text-xl font-black mb-2">Sorteador Relâmpago</h3>
                <p className="text-sm font-medium opacity-80 mb-4" style={{ color: C.textMuted }}>
                  Praticidade máxima em poucos segundos. O sorteio acontece na hora e você já despacha os envelopes.
                </p>

                <ul className="space-y-2.5 text-xs sm:text-sm font-semibold mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                    <span>Zero cadastro para você e amigos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                    <span>Sorteio automático sem auto-sorteio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <WhatsAppIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Envelopes no WhatsApp com lacre violado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                    <span>Você não vê quem os outros tiraram</span>
                  </li>
                </ul>
              </div>

              <Button
                size="lg"
                onClick={onSelectQuick}
                className={`w-full h-13 rounded-xl font-black text-sm border-[3px] border-black shadow-[4px_4px_0px_#1A1A1A] touch-press hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1A1A1A] transition-all`}
                style={{ backgroundColor: C.mint, color: C.black }}
              >
                <Zap className="w-4 h-4 mr-2 fill-current" />
                Continuar Sem Cadastro
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Opção 2: Suíte Completa ReUNE */}
            <div
              className={`flex flex-col justify-between p-6 rounded-2xl border-[3px] border-black shadow-[5px_5px_0px_#1A1A1A] relative hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#1A1A1A] transition-all`}
              style={{ backgroundColor: isDark ? "#2A231C" : "#FFF9F0" }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl border-[2px] border-black flex items-center justify-center shadow-[3px_3px_0px_#1A1A1A]"
                    style={{ backgroundColor: C.yellow }}
                  >
                    <Gift className="w-6 h-6 text-black" />
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full border-[2px] border-black text-[11px] font-black uppercase shadow-[1px_1px_0px_#1A1A1A]"
                    style={{ backgroundColor: C.yellow, color: C.black }}
                  >
                    Recomendado • Só 1 min 🚀
                  </span>
                </div>

                <h3 className="text-xl font-black mb-2">Suíte Completa ReUNE</h3>
                <p className="text-sm font-medium opacity-80 mb-4" style={{ color: C.textMuted }}>
                  Criar sua conta leva só 1 minutinho e libera lista de presentes, festa com mapa e anti-penetras.
                </p>

                <ul className="space-y-2.5 text-xs sm:text-sm font-semibold mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 font-bold" />
                    <span>Lista de presentes (o que cada amigo quer ganhar)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 font-bold" />
                    <span>Festa com mapa, data, horário e rotas (Uber/Waze)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <WhatsAppIcon className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Convites no WhatsApp com Modo Anti-Penetras</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 font-bold" />
                    <span>Painel persistente para acompanhar confirmações</span>
                  </li>
                </ul>
              </div>

              <Button
                size="lg"
                onClick={onSelectFull}
                className={`w-full h-13 rounded-xl font-black text-sm border-[3px] border-black shadow-[4px_4px_0px_#1A1A1A] touch-press hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1A1A1A] transition-all`}
                style={{ backgroundColor: C.orange, color: "#fff" }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Criar com Conta (Só 1 min)
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Micro-footer explicativo */}
          <div className="mt-6 text-center text-xs font-semibold opacity-70">
            💡 Os convidados nunca são obrigados a criar conta em nenhuma das opções. Ambas são 100% gratuitas!
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
