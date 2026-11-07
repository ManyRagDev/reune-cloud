import { motion, AnimatePresence } from "framer-motion";
import { Zap, Gift, ArrowRight, X, Sparkles, MapPin, ShieldCheck, Users, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NBLight, NBDark, NBPalette, nb } from "@/lib/neobrutalism";
import { analytics } from "@/lib/analytics";

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden pb-safe">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Dialog (Compacto, Cabe 100% no Viewport Mobile sem Rolar) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-2xl rounded-3xl border-[3px] border-black shadow-[6px_6px_0px_#1A1A1A] p-4 sm:p-7 z-10 select-none overflow-hidden`}
          style={{ backgroundColor: C.cardBg, color: C.text }}
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-3.5 right-3.5 w-8 h-8 rounded-xl border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-[1px] hover:translate-y-[1px] transition-all`}
            style={{ backgroundColor: C.pink, color: "#000" }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Modal Header Enxuto */}
          <div className="text-center max-w-lg mx-auto mb-3.5 sm:mb-5 pr-8 pl-2">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full border-[2px] border-black text-[10px] font-black uppercase mb-1 shadow-[1.5px_1.5px_0px_#1A1A1A]`}
              style={{ backgroundColor: C.yellow, color: C.black }}
            >
              🎉 Amigo Secreto ReUNE
            </span>
            <h2 className="text-lg sm:text-2xl font-black leading-tight tracking-tight">
              Como você prefere organizar{groupTitle ? ` o "${groupTitle}"` : " seu sorteio"}?
            </h2>
            <p className="text-[11px] sm:text-xs font-semibold opacity-75 mt-0.5" style={{ color: C.textMuted }}>
              Escolha a melhor opção para o seu grupo (leva 2 segundos):
            </p>
          </div>

          {/* Grid de Opções Compactas (100% visíveis sem rolar) */}
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2.5 sm:gap-4">
            {/* ═══ OPÇÃO 1: COM CADASTRO (EXPERIÊNCIA COMPLETA & MAIS RECURSOS) ═══ */}
            <div
              className={`p-3.5 sm:p-5 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_#1A1A1A] relative flex flex-col justify-between transition-all`}
              style={{ backgroundColor: isDark ? "#2A231C" : "#FFFBEB" }}
            >
              <div>
                {/* Header do Card */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span
                    className="px-2 py-0.5 rounded-full border-[2px] border-black text-[9px] sm:text-[10px] font-black uppercase shadow-[1px_1px_0px_#000]"
                    style={{ backgroundColor: C.yellow, color: C.black }}
                  >
                    👑 Com Cadastro
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-black bg-white dark:bg-black/30">
                    Mais Recursos
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black leading-tight mb-1">
                  Experiência Completa
                </h3>

                <p className="text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 leading-snug mb-3">
                  🔗 <strong>1 link no WhatsApp</strong> do grupo. Amigos entram sozinhos com <strong>lista de presentes</strong> e local no mapa.
                </p>
              </div>

              <div>
                <Button
                  size="sm"
                  onClick={() => {
                    analytics.secretSanta.selectMode("full");
                    onSelectFull();
                  }}
                  className={`w-full min-h-[44px] py-2 px-3 rounded-xl font-black text-xs border-[2px] border-black shadow-[3px_3px_0px_#1A1A1A] touch-press hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center gap-1.5`}
                  style={{ backgroundColor: C.orange, color: "#fff" }}
                >
                  <UserCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Criar com Conta (1 min)</span>
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                </Button>
                <p className="text-[10px] font-medium text-center mt-1 text-gray-500 dark:text-gray-400">
                  Convidados não precisam de login
                </p>
              </div>
            </div>

            {/* ═══ OPÇÃO 2: SEM CADASTRO (PRATICIDADE MÁXIMA & SORTEIO PURO) ═══ */}
            <div
              className={`p-3.5 sm:p-5 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_#1A1A1A] relative flex flex-col justify-between transition-all`}
              style={{ backgroundColor: isDark ? "#24201C" : "#F4FDF9" }}
            >
              <div>
                {/* Header do Card */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span
                    className="px-2 py-0.5 rounded-full border-[2px] border-black text-[9px] sm:text-[10px] font-black uppercase shadow-[1px_1px_0px_#000]"
                    style={{ backgroundColor: C.mint, color: C.black }}
                  >
                    ⚡ Sem Cadastro
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-black bg-white dark:bg-black/30">
                    Só Praticidade
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black leading-tight mb-1">
                  Sorteador Relâmpago
                </h3>

                <p className="text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 leading-snug mb-3">
                  🚀 <strong>Digite os nomes</strong> agora, sorteie na tela e mande <strong>envelopes com lacre de cera</strong> no WhatsApp.
                </p>
              </div>

              <div>
                <Button
                  size="sm"
                  onClick={() => {
                    analytics.secretSanta.selectMode("quick");
                    onSelectQuick();
                  }}
                  className={`w-full min-h-[44px] py-2 px-3 rounded-xl font-black text-xs border-[2px] border-black shadow-[3px_3px_0px_#1A1A1A] touch-press hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center gap-1.5`}
                  style={{ backgroundColor: C.mint, color: C.black }}
                >
                  <Zap className="w-4 h-4 fill-current flex-shrink-0" />
                  <span>Sortear Sem Cadastro</span>
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                </Button>
                <p className="text-[10px] font-medium text-center mt-1 text-gray-500 dark:text-gray-400">
                  Zero login • Sorteio instantâneo
                </p>
              </div>
            </div>
          </div>

          {/* Micro-footer explicativo */}
          <div className="mt-3 text-center text-[10px] sm:text-xs font-semibold opacity-70">
            🔒 100% Gratuito em ambos os modos • Sem anúncios invasivos • Sorteio criptografado
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
