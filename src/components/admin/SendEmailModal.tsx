import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmailTemplate } from "@/types/admin";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SendEmailModalProps {
  open: boolean;
  onClose: () => void;
  templates: EmailTemplate[];
  leadIds: string[];
  leadCount: number;
  password: string;
}

export default function SendEmailModal({
  open,
  onClose,
  templates,
  leadIds,
  leadCount,
  password
}: SendEmailModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const template = templates.find(t => t.name === selectedTemplate);
  const templateVariables = template?.variables || [];

  const handleSend = async () => {
    if (!selectedTemplate) {
      toast.error("Selecione um template");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-admin-email', {
        body: {
          lead_ids: leadIds,
          template_name: selectedTemplate,
          variables,
          password
        }
      });

      if (error || !data.success) {
        throw new Error(error?.message || data.error || 'Erro ao enviar e-mails');
      }

      toast.success(data.message || `E-mails enviados com sucesso!`);
      onClose();

      // Recarregar dados após 1 segundo
      setTimeout(() => window.location.reload(), 1000);

    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.message || 'Erro ao enviar e-mails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-amber-500 to-purple-500 bg-clip-text text-transparent">
            Enviar E-mail
          </DialogTitle>
          <DialogDescription>
            Enviar e-mail para {leadCount} lead(s) selecionado(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Selector */}
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {templates.filter(t => t.is_active).map((template) => (
                  <SelectItem key={template.id} value={template.name}>
                    <div>
                      <div className="font-medium">{template.subject}</div>
                      {template.description && (
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Variables */}
          {template && templateVariables.length > 0 && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
              <Label className="text-sm font-medium">Variáveis do Template</Label>
              <p className="text-xs text-muted-foreground">
                As variáveis {'{'}nome{'}'} e {'{'}email{'}'} são preenchidas automaticamente.
              </p>

              {templateVariables
                .filter(v => v !== 'nome' && v !== 'email')
                .map((variable) => (
                  <div key={variable} className="space-y-1">
                    <Label className="text-xs">{variable}</Label>
                    <Input
                      placeholder={`Valor para {${variable}}`}
                      value={variables[variable] || ''}
                      onChange={(e) => setVariables({ ...variables, [variable]: e.target.value })}
                      className="h-10"
                    />
                  </div>
                ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedTemplate || loading}
            className="bg-gradient-to-r from-amber-500 to-purple-500 hover:from-amber-600 hover:to-purple-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Enviar {leadCount > 1 ? `(${leadCount})` : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
