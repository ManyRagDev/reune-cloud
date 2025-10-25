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
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-3 rounded-full">
              <User className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">Complete seu perfil!</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            Agora ficou mais fácil atualizar seus dados de perfil. Quer completar suas informações? É rapidinho 🙂
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start space-x-2 py-4">
          <Checkbox
            id="dont-ask-again"
            checked={dontAskAgain}
            onCheckedChange={(checked) => setDontAskAgain(checked as boolean)}
          />
          <Label
            htmlFor="dont-ask-again"
            className="text-sm font-normal leading-relaxed cursor-pointer"
          >
            Não perguntar novamente
          </Label>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDismiss}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Agora não
          </Button>
          <Button
            type="button"
            onClick={handleGoToProfile}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? "Salvando..." : "Cadastrar perfil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
