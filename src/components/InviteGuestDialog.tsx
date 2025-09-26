import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InviteGuestDialogProps {
  onInvite: (email: string, name: string, isOrganizer: boolean) => Promise<{error: string | null}>;
}

export const InviteGuestDialog = ({ onInvite }: InviteGuestDialogProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !name.trim()) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await onInvite(email.trim(), name.trim(), isOrganizer);
    
    if (result.error) {
      toast({
        title: "Erro ao enviar convite",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Convite enviado!",
        description: `${name} foi convidado(a) ${isOrganizer ? 'como organizador(a)' : 'para o evento'}.`,
      });
      
      // Reset form
      setEmail('');
      setName('');
      setIsOrganizer(false);
      setOpen(false);
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Convidar Pessoa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Nova Pessoa</DialogTitle>
          <DialogDescription>
            Adicione o nome e email da pessoa que você deseja convidar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Nome da pessoa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="organizer" 
              checked={isOrganizer}
              onCheckedChange={(checked) => setIsOrganizer(checked as boolean)}
            />
            <Label 
              htmlFor="organizer" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Convidar como organizador (poderá adicionar e remover pessoas)
            </Label>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};