import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type LucideIcon, ArrowLeft, AlertTriangle, MapPinned, Home, Sparkles, Calendar as CalendarIcon, Clock, Flame, UtensilsCrossed, Cake, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { EventInviteSelector, Invitee } from '@/components/events/EventInviteSelector';
import { AddressSelector } from '@/components/events/AddressSelector';
import { Address } from '@/hooks/useAddresses';
import { EventTemplate, templates } from '@/data/templates';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CreateEventProps {
  onBack: () => void;
  onCreate: () => void;
  initialData?: EventTemplate | null;
}

const templateIcons: Record<string, LucideIcon> = {
  churrasco: Flame,
  jantar: UtensilsCrossed,
  aniversario: Cake,
  reuniao: Briefcase,
};

const CreateEvent = ({ onBack, onCreate, initialData }: CreateEventProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(initialData || null);
  const [title, setTitle] = useState(initialData?.title || '');
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>('');
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

    if (!date) {
      toast({
        title: "Data obrigatória",
        description: "Por favor, selecione uma data para o evento.",
        variant: "destructive",
      });
      return;
    }

    // Validar se a data não é no passado
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
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
      const formattedDate = format(date, 'yyyy-MM-dd');

      const { data: eventData, error } = await supabase
        .from('table_reune')
        .insert({
          title,
          event_date: formattedDate,
          event_time: time,
          location,
          description: eventDescription,
          user_id: user.id,
          is_public: isPublic,
          status: 'published',
          created_by_ai: false,
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
          prioridade: 'B',
        }));

        const { error: itemsError } = await supabase
          .from('event_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error("Erro ao inserir itens do template:", itemsError);
        }
      }

      // Se há convidados selecionados, criar convites
      if (selectedInvitees.length > 0 && eventData) {
        for (const invitee of selectedInvitees) {
          try {
            const { data: inviteData, error: inviteError } = await supabase.rpc(
              "process_invitation",
              {
                _event_id: eventData.id,
                _invitee_email: invitee.email || null,
                _invitee_name: invitee.name,
                _is_organizer: false,
                _invitee_user_id: invitee.user_id || null,
              }
            );

            if (inviteError) {
              console.error("Erro ao enviar convite para", invitee.email || invitee.name, ":", inviteError);
              continue;
            }

            const result = inviteData as any;

            if (!result?.user_exists && result?.invitation_token && invitee.email) {
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
                console.error("Erro ao enviar email para", invitee.email || invitee.name, ":", emailError);
              }
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
          successMessage = `${pendingCount} convite(s) pendente(s) criado(s).`;
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="fixed top-0 left-0 w-[600px] h-[600px] bg-green-500/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
      />

      {/* Floating Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4"
      >
        <div className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl px-6 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mr-4 hover:bg-background/80"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
                Criar Novo Evento
              </h1>
              <p className="text-muted-foreground text-sm">Preencha as informações do seu evento</p>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-32 pb-20">
        {/* Template Selector */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Label className="mb-3 block text-base font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Comece com um modelo (opcional)
          </Label>
          <div className="flex flex-wrap gap-2">
            {templates.map((template, index) => {
              const Icon = templateIcons[template.slug] ?? Sparkles;
              const isSelected = selectedTemplate?.slug === template.slug;

              return (
                <motion.button
                  key={template.slug}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.08 }}
                  whileHover={{ y: -2 }}
                  onClick={() => handleTemplateSelect(template)}
                  aria-pressed={isSelected}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isSelected
                      ? "border-primary/60 bg-primary/10 text-primary shadow-sm"
                      : "border-border/60 bg-card/60 text-foreground/80 hover:border-primary/40 hover:bg-card/80"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full",
                      isSelected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span>{template.title}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/50 to-blue-500/50 rounded-3xl blur opacity-20"></div>

            <Card className="relative border-2 border-border/50 bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-green-500 to-blue-500" />

              <CardHeader className="pt-8">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6 text-primary" />
                  Informações do Evento
                </CardTitle>
                <CardDescription className="text-base">
                  Adicione os detalhes principais do seu evento
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Event Title */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Label htmlFor="title" className="text-sm font-semibold">Nome do Evento</Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Ex: Churrasco de Domingo"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="h-12 mt-2 rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm transition-all focus:border-green-500 focus:shadow-lg focus:shadow-green-500/20"
                    />
                  </motion.div>

                  {/* Date and Time */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div>
                      <Label htmlFor="date" className="text-sm font-semibold flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Data
                      </Label>
                      <div className="mt-2">
                        <DatePicker
                          value={date}
                          onChange={setDate}
                          placeholder="Escolha a data do evento"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="time" className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Horário
                      </Label>
                      <div className="mt-2">
                        <TimePicker
                          value={time}
                          onChange={setTime}
                          placeholder="Escolha o horário"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Location */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <Label htmlFor="location" className="text-sm font-semibold flex items-center gap-2">
                      <MapPinned className="w-4 h-4" />
                      Endereço
                    </Label>
                    <div className="space-y-3 mt-2">
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
                            className="h-12 rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm transition-all focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20"
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
                          className="w-full h-12 border-2"
                        >
                          <MapPinned className="h-4 w-4 mr-2" />
                          Digitar endereço manualmente
                        </Button>
                      )}
                    </div>

                    {showLocationWarning && (
                      <Alert className="mt-3 border-2 border-amber-500/50 bg-amber-500/10">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <AlertDescription className="text-sm">
                          <strong>Atenção:</strong> Você está adicionando um endereço residencial em um evento público.
                          Por segurança, apenas a região será exibida para não-convidados.
                          O endereço completo ficará visível apenas para você e seus convidados.
                        </AlertDescription>
                      </Alert>
                    )}
                  </motion.div>

                  {/* Description */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <Label htmlFor="description" className="text-sm font-semibold">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Adicione detalhes sobre o evento..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="mt-2 rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm transition-all focus:border-primary focus:shadow-lg focus:shadow-primary/20"
                    />
                  </motion.div>

                  {/* Event Invite Selector */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >
                    <EventInviteSelector
                      selectedInvitees={selectedInvitees}
                      onInviteesChange={setSelectedInvitees}
                    />
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-14 text-base font-semibold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all"
                      disabled={loading || !title || !date || !time || !location}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Criando evento...
                        </div>
                      ) : (
                        'Criar Evento'
                      )}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default CreateEvent;
