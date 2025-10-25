import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertTriangle, MapPinned, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { EventInviteSelector, Invitee } from '@/components/events/EventInviteSelector';
import { AddressSelector } from '@/components/events/AddressSelector';
import { Address } from '@/hooks/useAddresses';
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
  const [selectedInvitees, setSelectedInvitees] = useState<Invitee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useManualLocation, setUseManualLocation] = useState(false);

  // Detectar se localização parece residencial
  const checkResidentialLocation = (loc: string) => {
    const residentialPatterns = /(casa|residência|apt|apartamento|rua|avenida|av\.|r\.)/i;
    return residentialPatterns.test(loc);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    setShowLocationWarning(isPublic && checkResidentialLocation(value));
    // Se o usuário digitar manualmente, limpar o endereço selecionado
    if (selectedAddressId) {
      setSelectedAddressId(null);
    }
  };

  const handleAddressSelect = (address: Address) => {
    const formattedAddress = `${address.nickname} — ${address.street}, ${address.number}${address.complement ? ', ' + address.complement : ''}, ${address.city}/${address.state}`;
    setLocation(formattedAddress);
    setSelectedAddressId(address.id);
    setUseManualLocation(false);
    setShowLocationWarning(isPublic && checkResidentialLocation(formattedAddress));
    
    toast({
      title: "Endereço aplicado",
      description: `Usando "${address.nickname}" como local do evento.`,
    });
  };

  const handleToggleManualLocation = () => {
    if (!useManualLocation) {
      setLocation('');
      setSelectedAddressId(null);
    }
    setUseManualLocation(!useManualLocation);
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
      const eventDescription = description || null;
      const { data: eventData, error } = await supabase
        .from('table_reune')
        .insert({
          title,
          event_date: date,
          event_time: time,
          location,
          description: eventDescription,
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

      // Se há convidados selecionados, criar convites
      if (selectedInvitees.length > 0 && eventData) {
        // Processar convites com o RPC
        for (const invitee of selectedInvitees) {
          try {
            const { data: inviteData, error: inviteError } = await supabase.rpc(
              "process_invitation",
              {
                _event_id: eventData.id,
                _invitee_email: invitee.email,
                _invitee_name: invitee.name,
                _is_organizer: false,
              }
            );

            if (inviteError) {
              console.error("Erro ao enviar convite:", inviteError);
              continue;
            }

            // Se o usuário existe, criar notificação
            if (inviteData && (inviteData as any).user_exists) {
              await supabase.from("notifications").insert({
                user_id: invitee.id,
                event_id: eventData.id,
                type: "event_invite",
                title: `Convite: ${title}`,
                message: `Você foi convidado(a) para ${title}`,
                metadata: {
                  event_id: eventData.id,
                  event_date: date,
                  event_time: time,
                  invite_status: invitee.status,
                },
              });
            }
          } catch (err) {
            console.error("Erro ao processar convite individual:", err);
          }
        }
      }

      const pendingCount = selectedInvitees.filter(
        (inv) => inv.status === "pendente"
      ).length;
      const confirmedCount = selectedInvitees.filter(
        (inv) => inv.status === "convidado"
      ).length;

      let successMessage = "Seu evento foi publicado e já está disponível.";
      if (selectedInvitees.length > 0) {
        if (pendingCount > 0 && confirmedCount > 0) {
          successMessage = `${confirmedCount} amigo(s) convidado(s) e ${pendingCount} convite(s) pendente(s) criado(s).`;
        } else if (pendingCount > 0) {
          successMessage = `${pendingCount} convite(s) pendente(s) criado(s). Serão ativados quando a amizade for aceita.`;
        } else {
          successMessage = `${confirmedCount} amigo(s) foram convidados.`;
        }
      }

      toast({
        title: "Evento criado com sucesso!",
        description: successMessage,
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
                <div className="space-y-3">
                  {!useManualLocation && (
                    <AddressSelector 
                      onAddressSelect={handleAddressSelect}
                      disabled={loading}
                    />
                  )}
                  
                  {useManualLocation ? (
                    <div className="space-y-2">
                      <Input
                        id="location"
                        type="text"
                        placeholder="Ex: Rua das Flores, 123 - Centro"
                        value={location}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleManualLocation}
                        className="text-xs"
                      >
                        <Home className="h-3 w-3 mr-1" />
                        Voltar para endereços salvos
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleToggleManualLocation}
                      disabled={loading}
                      className="w-full"
                    >
                      <MapPinned className="h-4 w-4 mr-2" />
                      Digitar endereço manualmente
                    </Button>
                  )}
                </div>
                
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
                <EventInviteSelector
                  selectedInvitees={selectedInvitees}
                  onInviteesChange={setSelectedInvitees}
                />
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