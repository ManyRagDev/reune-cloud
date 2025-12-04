import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertTriangle, MapPinned, Home, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { EventInviteSelector, Invitee } from '@/components/events/EventInviteSelector';
import { AddressSelector } from '@/components/events/AddressSelector';
import { Address } from '@/hooks/useAddresses';
import { EventTemplate, templates } from '@/data/templates';
import { Badge } from '@/components/ui/badge';

interface CreateEventProps {
  onBack: () => void;
  onCreate: () => void;
  initialData?: EventTemplate | null;
}

const CreateEvent = ({ onBack, onCreate, initialData }: CreateEventProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(initialData || null);
  const [title, setTitle] = useState(initialData?.title || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedInvitees, setSelectedInvitees] = useState<Invitee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useManualLocation, setUseManualLocation] = useState(false);

  useEffect(() => {
    if (initialData) {
      setSelectedTemplate(initialData);
      setTitle(initialData.title);
      setDescription(initialData.description);
    }
  }, [initialData]);

  const handleTemplateSelect = (template: EventTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.title);
    setDescription(template.description);
    toast({
      title: "Modelo aplicado",
      description: `O modelo "${template.title}" foi selecionado.`,
    });
  };

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

    // Validar se a data não é no passado
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast({
        title: "Data inválida",
        description: "Não é possível criar eventos em datas passadas. Escolha uma data futura.",
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

      // Inserir itens do template, se houver
      if (selectedTemplate?.defaultItems && eventData) {
        const itemsToInsert = selectedTemplate.defaultItems.map(item => ({
          event_id: eventData.id,
          nome_item: item.name,
          quantidade: item.quantity,
          unidade: item.unit,
          categoria: item.category,
          prioridade: 'B', // Prioridade padrão
        }));

        const { error: itemsError } = await supabase
          .from('event_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error("Erro ao inserir itens do template:", itemsError);
          // Não interrompe o fluxo, apenas loga o erro
        }
      }

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
              console.error("Erro ao enviar convite para", invitee.email, ":", inviteError);
              continue;
            }

            const result = inviteData as any;

            // Se usuário não existe, enviar email
            if (!result?.user_exists && result?.invitation_token) {
              const { error: emailError } = await supabase.functions.invoke("send-invitation-email", {
                body: {
                  invitee_email: invitee.email,
                  invitee_name: invitee.name,
                  event_title: title,
                  event_date: date,
                  event_time: time,
                  is_organizer: false,
                  invitation_token: result.invitation_token,
                },
              });

              if (emailError) {
                console.error("Erro ao enviar email para", invitee.email, ":", emailError);
              }
            }
            // Se usuário existe, a notificação já foi criada pelo RPC process_invitation
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
        duration: 5000,
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

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Template Selector */}
        <section>
          <Label className="mb-3 block text-muted-foreground">Comece com um modelo (opcional)</Label>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {templates.map((template) => (
              <div
                key={template.slug}
                onClick={() => handleTemplateSelect(template)}
                className={`
                  flex-shrink-0 w-48 p-4 rounded-xl border cursor-pointer transition-all hover:scale-105
                  ${selectedTemplate?.slug === template.slug
                    ? 'bg-primary/5 border-primary ring-1 ring-primary'
                    : 'bg-card border-border hover:border-primary/50'}
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <Sparkles className={`w-5 h-5 ${selectedTemplate?.slug === template.slug ? 'text-primary' : 'text-muted-foreground'}`} />
                  {selectedTemplate?.slug === template.slug && (
                    <Badge variant="secondary" className="text-[10px] h-5">Selecionado</Badge>
                  )}
                </div>
                <h3 className="font-medium text-sm mb-1">{template.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
              </div>
            ))}
          </div>
        </section>

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