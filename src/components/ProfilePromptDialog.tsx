/**
 * ProfilePromptDialog V2 - Estilo divertido e colorido
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { User, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface ProfilePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToProfile: () => void;
}

export const ProfilePromptDialog = ({
  open,
  onOpenChange,
  onNavigateToProfile,
}: ProfilePromptDialogProps) => {
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleDismiss = async () => {
    if (dontAskAgain) {
      await savePreference();
    }
    onOpenChange(false);
  };

  const handleGoToProfile = async () => {
    if (dontAskAgain) {
      await savePreference();
    }
    onOpenChange(false);
    onNavigateToProfile();
  };

  const savePreference = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { error } = await supabase
        .from("profiles")
        .update({ hide_profile_prompt: true })
        .eq("id", user.id);

      if (error) throw error;
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro ao salvar preferência",
        description: err?.message || "Não foi possível salvar sua preferência.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_#000000] rounded-2xl overflow-visible">
        {/* Header colorido */}
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              className="w-16 h-16 rounded-xl border-[3px] border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000000] flex items-center justify-center transform -rotate-3"
            >
              <User className="w-8 h-8 text-black" />
            </motion.div>
            <div>
              <DialogTitle className="text-2xl font-black text-black">
                Complete seu perfil!
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-base pt-4 text-gray-700 font-medium">
            Agora ficou mais fácil atualizar seus dados. Quer completar suas informações? É rapidinho! 
            <span className="inline-block ml-1">🙂</span>
          </DialogDescription>
        </DialogHeader>

        {/* Conteúdo */}
        <div className="px-6 py-2">
          <div className="flex items-start space-x-3 p-4 rounded-xl border-[3px] border-black bg-[#F8F9FA] shadow-[3px_3px_0px_0px_#000000]">
            <Checkbox
              id="dont-ask-again"
              checked={dontAskAgain}
              onCheckedChange={(checked) => setDontAskAgain(checked as boolean)}
              className="mt-1 border-[2px] border-black data-[state=checked]:bg-[#FF6B35] data-[state=checked]:border-[#FF6B35]"
            />
            <Label
              htmlFor="dont-ask-again"
              className="text-sm font-bold leading-relaxed cursor-pointer text-gray-700"
            >
              Não perguntar novamente
            </Label>
          </div>
        </div>

        {/* Footer com botões estilizados */}
        <DialogFooter className="p-6 pt-4 flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleDismiss}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border-[3px] border-black bg-white shadow-[4px_4px_0px_0px_#000000] font-bold hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
          >
            Agora não
          </Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
            <Button
              onClick={handleGoToProfile}
              disabled={saving}
              className="w-full px-6 py-3 rounded-xl border-[3px] border-black bg-[#FF6B35] shadow-[4px_4px_0px_0px_#000000] font-bold text-white hover:bg-[#ff5a1f] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Completar Perfil
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </DialogFooter>

        {/* Elementos decorativos */}
        <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-[#FF69B4] border-[3px] border-black" />
        <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-[#A8D8FF] border-[3px] border-black" />
        <div className="absolute top-1/2 -right-4 w-4 h-4 rounded-full bg-[#FFD93D] border-[2px] border-black" />
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePromptDialog;
