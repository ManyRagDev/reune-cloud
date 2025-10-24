import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { FriendSelector } from '@/components/friends/FriendSelector';
// TS type refresh

interface CreateEventProps {
  onBack: () => void;
  onCreate: () => void;
}

const CreateEvent = ({ onBack, onCreate }: CreateEventProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  // Detectar se localização parece residencial
  const checkResidentialLocation = (loc: string) => {
    const residentialPatterns = /(casa|residência|apt|apartamento|rua|avenida|av\.|r\.)/i;
    return residentialPatterns.test(loc);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    setShowLocationWarning(isPublic && checkResidentialLocation(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar um evento.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data: eventData, error } = await supabase
        .from('table_reune')
        .insert({
          title,
          event_date: date,
          event_time: time,
          location,
          description,
          user_id: user.id,
          is_public: isPublic,
          status: 'published',
          created_by_ai: false, // Evento criado manualmente pelo usuário
          public_location: isPublic && checkResidentialLocation(location) 
            ? 'Local a confirmar com organizador' 
            : null
        })
        .select()
        .single();

      if (error) throw error;

      // Se amigos foram selecionados, convidá-los
      if (selectedFriends.length > 0 && eventData) {
        const { error: inviteError } = await supabase
          .from('event_participants')
          .insert(
            selectedFriends.map(friendId => ({
              event_id: eventData.id,
              nome_participante: friendId, // Será resolvido depois
              status_convite: 'pendente'
            }))
          );

        if (inviteError) {
          console.error('Erro ao convidar amigos:', inviteError);
        }

        // Criar notificações para os amigos
        for (const friendId of selectedFriends) {
          await supabase.from('notifications').insert({
            user_id: friendId,
            event_id: eventData.id,
            type: 'event_invite',
            title: `Convite: ${title}`,
            message: `Você foi convidado para ${title}`,
            metadata: {
              event_id: eventData.id,
              event_date: date,
              event_time: time
            }
          });
        }
      }

      toast({
        title: "Evento criado com sucesso!",
        description: selectedFriends.length > 0 
          ? `Seu evento foi publicado e ${selectedFriends.length} amigo(s) foram convidados.`
          : "Seu evento foi publicado e já está disponível.",
      });

      onCreate();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocorreu um erro. Tente novamente.";
      toast({
        title: "Erro ao criar evento",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b px-4 py-6">
        <div className="max-w-2xl mx-auto flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-4">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Criar Novo Evento</h1>
            <p className="text-muted-foreground text-sm">Preencha as informações do seu evento</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Evento</CardTitle>
            <CardDescription>
              Adicione os detalhes principais do seu evento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Nome do Evento</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Ex: Churrasco de Domingo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Horário</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Endereço</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Ex: Rua das Flores, 123 - Centro"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  required
                />
                {showLocationWarning && (
                  <Alert className="mt-2 border-warning bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-sm text-warning-foreground">
                      <strong>Atenção:</strong> Você está adicionando um endereço residencial em um evento público. 
                      Por segurança, apenas a região será exibida para não-convidados. 
                      O endereço completo ficará visível apenas para você e seus convidados.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Adicione detalhes sobre o evento..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label>Convidar Amigos (opcional)</Label>
                <FriendSelector 
                  selectedFriends={selectedFriends}
                  onSelectionChange={setSelectedFriends}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Seus amigos receberão uma notificação do convite
                </p>
              </div>

              <Button
                type="submit" 
                className="w-full"
                disabled={loading || !title || !date || !time || !location}
              >
                {loading ? 'Criando...' : 'Criar Evento'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateEvent;