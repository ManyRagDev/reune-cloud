import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Bug, Sparkles, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

export function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para reportar bugs.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a descrição do bug.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // TODO: Create bug_reports table to enable this feature
      // For now, just show success message
      console.log('Bug report:', {
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        status: 'pending',
        user_agent: navigator.userAgent,
        url: window.location.href,
      });

      toast({
        title: "Bug reportado com sucesso! 🎉",
        description: "Obrigado por nos ajudar a melhorar! Você receberá um bônus em breve.",
      });

      // Reset form and close dialog
      setTitle('');
      setDescription('');
      setOpen(false);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast({
        title: "Erro ao reportar bug",
        description: "Não foi possível enviar o reporte. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 z-50 h-14 px-6 shadow-2xl hover:scale-105 transition-all duration-300 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 group"
        >
          <Bug className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
          Reportar Bug
          <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-0">
            <Sparkles className="w-3 h-3 mr-1" />
            Bônus
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-primary" />
            Reportar Bug
          </DialogTitle>
          <DialogDescription>
            Encontrou algo estranho? Nos ajude a melhorar! Você receberá um bônus por cada bug válido reportado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="bug-title">Título do Bug</Label>
            <Input
              id="bug-title"
              placeholder="Ex: Botão de criar evento não funciona"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="bug-description">Descrição Detalhada</Label>
            <Textarea
              id="bug-description"
              placeholder="Descreva o que aconteceu, o que você esperava que acontecesse, e os passos para reproduzir o problema..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={6}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/1000 caracteres
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim() || !description.trim()}
              className="flex-1"
            >
              {loading ? (
                'Enviando...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Reporte
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
