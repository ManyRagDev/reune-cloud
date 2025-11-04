import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Plus, Package, Check, X, UserPlus, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEvent } from "@/hooks/useEvent";
import { useAuth } from "@/hooks/useAuth";
import { OrganizerInviteDialog } from "@/components/events/OrganizerInviteDialog";
import { supabase } from "@/integrations/supabase/client";
import { rpc } from "@/api/rpc";
// Force TypeScript to reload types

interface Attendee {
  id: number;
  name: string;
  email?: string;
  status: "pendente" | "confirmado" | "recusado";
}

interface Supply {
  id: number;
  name: string;
  quantidade: number;
  unidade: string;
  categoria: string;
  prioridade: string;
  assignments: ItemAssignment[];
}

interface ItemAssignment {
  id: string;
  participant_id: number;
  participant_name: string;
  quantidade_atribuida: number;
  confirmado: boolean;
}

interface EventDetailsProps {
  eventId: string;
  onBack: () => void;
}

interface EventConfirmation {
  date: "confirmed" | "rejected" | "pending";
  time: "confirmed" | "rejected" | "pending";
  location: "confirmed" | "rejected" | "pending";
}

const EventDetails = ({ eventId, onBack }: EventDetailsProps) => {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { event, organizers, loading, error, isOrganizer, addOrganizer, removeOrganizer } = useEvent(eventId);

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [newSupply, setNewSupply] = useState("");
  const [friends, setFriends] = useState<{ friend_id: string }[]>([]);
  const [currentParticipantId, setCurrentParticipantId] = useState<number | null>(null);
  const [isInvitedGuest, setIsInvitedGuest] = useState(false);

  // Estados para confirmação flexível
  const [confirmation, setConfirmation] = useState<EventConfirmation>({
    date: "pending",
    time: "pending",
    location: "pending",
  });

  // Estados para alternativas propostas
  const [alternativeDate, setAlternativeDate] = useState<Date | undefined>();
  const [alternativeTime, setAlternativeTime] = useState("");
  const [alternativeLocation, setAlternativeLocation] = useState("");

  // Estados para controlar popovers
  const [showDatePopover, setShowDatePopover] = useState(false);
  const [showTimePopover, setShowTimePopover] = useState(false);
  const [showLocationPopover, setShowLocationPopover] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carregar amigos
  useEffect(() => {
    if (!user) return;

    const loadFriends = async () => {
      try {
        const { data, error } = await supabase.rpc("get_friends", { _search: null });
        if (error) throw error;
        if (data) {
          setFriends(data.map((f: any) => ({ friend_id: f.friend_id })));
        }
      } catch (err) {
        console.error("Erro ao carregar amigos:", err);
      }
    };

    loadFriends();
  }, [user]);

  // Verificar se usuário é convidado confirmado
  useEffect(() => {
    if (!event || !user) return;

    const checkInvitationStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('event_invitations')
          .select('status')
          .eq('event_id', Number(eventId))
          .eq('participant_email', user.email)
          .single();

        if (data && data.status === 'accepted') {
          setIsInvitedGuest(true);
        }
      } catch (err) {
        console.error('Erro ao verificar status de convite:', err);
      }
    };

    checkInvitationStatus();
  }, [event, user, eventId]);

  // Carregar participantes e itens do banco de dados
  useEffect(() => {
    if (!event || !user) return;

    const loadEventData = async () => {
      try {
        const eventIdNum = Number(eventId);

        // Carregar participantes
        const { data: participantsData, error: participantsError } = await supabase
          .from("event_participants")
          .select("*")
          .eq("event_id", eventIdNum);

        if (participantsError) throw participantsError;

        if (participantsData) {
          const mappedAttendees: Attendee[] = participantsData.map((p: any) => ({
            id: p.id,
            name: p.nome_participante,
            email: p.contato || undefined,
            status: p.status_convite,
          }));
          setAttendees(mappedAttendees);
          
          // Encontrar o participant_id do usuário atual
          const myParticipant = participantsData.find((p: any) => p.contato === user.email);
          if (myParticipant) {
            setCurrentParticipantId(myParticipant.id);
          }
        }

        // Carregar itens com suas atribuições
        const { data: itemsData, error: itemsError } = await supabase
          .from("event_items")
          .select("*")
          .eq("event_id", eventIdNum);

        if (itemsError) throw itemsError;

        // Carregar atribuições
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from("item_assignments")
          .select(`
            id,
            item_id,
            participant_id,
            quantidade_atribuida,
            confirmado
          `)
          .eq("event_id", eventIdNum);

        if (assignmentsError) throw assignmentsError;

        if (itemsData) {
          const mappedSupplies: Supply[] = itemsData.map((item: any) => {
            const itemAssignments = (assignmentsData || [])
              .filter((a: any) => a.item_id === item.id)
              .map((a: any) => {
                const participant = participantsData?.find((p: any) => p.id === a.participant_id);
                return {
                  id: a.id,
                  participant_id: a.participant_id,
                  participant_name: participant?.nome_participante || "Desconhecido",
                  quantidade_atribuida: a.quantidade_atribuida,
                  confirmado: a.confirmado,
                };
              });

            return {
              id: item.id,
              name: item.nome_item,
              quantidade: item.quantidade,
              unidade: item.unidade,
              categoria: item.categoria,
              prioridade: item.prioridade,
              assignments: itemAssignments,
            };
          });
          setSupplies(mappedSupplies);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do evento:", err);
      }
    };

    loadEventData();

    // Configurar realtime
    const eventIdNum = Number(eventId);
    
    const participantsChannel = supabase
      .channel(`participants_${eventIdNum}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants',
          filter: `event_id=eq.${eventIdNum}`
        },
        () => {
          loadEventData();
        }
      )
      .subscribe();

    const itemsChannel = supabase
      .channel(`items_${eventIdNum}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_items',
          filter: `event_id=eq.${eventIdNum}`
        },
        () => {
          loadEventData();
        }
      )
      .subscribe();

    const assignmentsChannel = supabase
      .channel(`assignments_${eventIdNum}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_assignments',
          filter: `event_id=eq.${eventIdNum}`
        },
        () => {
          loadEventData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(itemsChannel);
      supabase.removeChannel(assignmentsChannel);
    };
  }, [event, eventId, user]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Função para verificar se pode confirmar presença
  const canConfirmPresence = () => {
    return (
      confirmation.date === "confirmed" && confirmation.time === "confirmed" && confirmation.location === "confirmed"
    );
  };

  const handleConfirmDate = () => {
    setConfirmation((prev) => ({ ...prev, date: "confirmed" }));
  };

  const handleRejectDate = () => {
    setConfirmation((prev) => ({ ...prev, date: "rejected" }));
    setShowDatePopover(true);
  };

  const handleConfirmTime = () => {
    setConfirmation((prev) => ({ ...prev, time: "confirmed" }));
  };

  const handleRejectTime = () => {
    setConfirmation((prev) => ({ ...prev, time: "rejected" }));
    setShowTimePopover(true);
  };

  const handleConfirmLocation = () => {
    setConfirmation((prev) => ({ ...prev, location: "confirmed" }));
  };

  const handleRejectLocation = () => {
    setConfirmation((prev) => ({ ...prev, location: "rejected" }));
    setShowLocationPopover(true);
  };

  // Funções para salvar alternativas
  const saveAlternativeDate = () => {
    if (alternativeDate) {
      toast({
        title: "Alternativa de data enviada!",
        description: `Você sugeriu: ${format(alternativeDate, "dd/MM/yyyy", { locale: ptBR })}`,
      });
      setShowDatePopover(false);
    }
  };

  const saveAlternativeTime = () => {
    if (alternativeTime) {
      toast({
        title: "Alternativa de horário enviada!",
        description: `Você sugeriu: ${alternativeTime}`,
      });
      setShowTimePopover(false);
    }
  };

  const saveAlternativeLocation = () => {
    if (alternativeLocation.trim()) {
      toast({
        title: "Alternativa de local enviada!",
        description: `Você sugeriu: ${alternativeLocation}`,
      });
      setShowLocationPopover(false);
      setAlternativeLocation("");
    }
  };

  const handleSaveConfirmation = async () => {
    if (!user || !session) {
      toast({
        title: "Autenticação necessária",
        description: "Você precisa estar logado para salvar as configurações.",
      });
      return;
    }
    if (!event) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("event_confirmations").upsert({
        event_id: Number(event.id),
        user_id: session.user.id,
        date_confirmed: confirmation.date === "confirmed",
        time_confirmed: confirmation.time === "confirmed",
        location_confirmed: confirmation.location === "confirmed",
        presence_confirmed: false,
        alternative_date:
          confirmation.date === "rejected" && alternativeDate ? alternativeDate.toISOString().split("T")[0] : null,
        alternative_time: confirmation.time === "rejected" ? alternativeTime : null,
        alternative_location: confirmation.location === "rejected" ? alternativeLocation : null,
      });
      if (error) throw error;
      toast({ title: "Configurações salvas!", description: "Suas preferências foram registradas." });
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      toast({
        title: "Erro ao salvar",
        description: err?.message || "Não foi possível salvar suas preferências. Verifique sua autenticação.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmPresence = async () => {
    if (!user || !session) {
      toast({
        title: "Autenticação necessária",
        description: "Você precisa estar logado para confirmar presença.",
      });
      return;
    }
    if (!event) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("event_confirmations").upsert({
        event_id: Number(event.id),
        user_id: session.user.id,
        date_confirmed: true,
        time_confirmed: true,
        location_confirmed: true,
        presence_confirmed: true,
      });
      if (error) throw error;
      toast({ title: "Presença confirmada!", description: "Sua confirmação foi registrada com sucesso." });
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err: any) {
      console.error("Erro ao confirmar presença:", err);
      toast({
        title: "Erro ao confirmar",
        description: err?.message || "Não foi possível confirmar sua presença. Verifique sua autenticação.",
      });
      setSaving(false);
    }
  };

  const handleInvite = async (
    userId: string,
    email: string,
    name: string,
    shouldBeOrganizer: boolean
  ) => {
    if (!event) return { error: "Evento não encontrado" };
    if (!session) return { error: "Autenticação necessária" };
    
    try {
      const { data, error } = await supabase.rpc("process_invitation" as any, {
        _event_id: Number(event.id),
        _invitee_email: email,
        _invitee_name: name,
        _is_organizer: shouldBeOrganizer,
      });
      
      if (error) throw error;
      
      const result = data as {
        user_exists?: boolean;
        message?: string;
        invitation_token?: string;
        invitation_id?: string;
        event_data?: { title: string; date: string; time: string };
      };
      
      // Se usuário não existe, enviar email
      if (!result?.user_exists && result?.invitation_token) {
        const { error: emailError } = await supabase.functions.invoke("send-invitation-email", {
          body: {
            invitee_email: email,
            invitee_name: name,
            event_title: result.event_data?.title || event.title,
            event_date: result.event_data?.date || event.event_date,
            event_time: result.event_data?.time || event.event_time,
            is_organizer: shouldBeOrganizer,
            invitation_token: result.invitation_token,
          },
        });
        
        if (emailError) {
          console.error("Erro ao enviar email:", emailError);
          toast({
            title: "Aviso",
            description: "Convite registrado, mas houve erro ao enviar o email",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Convite enviado por email",
            description: `Um email foi enviado para ${email}`,
          });
        }
      } else if (result?.user_exists) {
        // Usuário existe - notificação já foi criada pelo RPC
        toast({
          title: "Convite enviado!",
          description: `${name} recebeu uma notificação sobre o convite.`,
        });
      }
      
      return { error: null };
    } catch (err: any) {
      console.error("Erro ao processar convite:", err);
      return { error: err?.message || "Erro ao enviar convite" };
    }
  };


  const addSupply = () => {
    if (newSupply.trim()) {
      setSupplies([
        ...supplies,
        {
          id: Date.now(),
          name: newSupply,
          quantidade: 1,
          unidade: 'un',
          categoria: 'geral',
          prioridade: 'B',
          assignments: [],
        },
      ]);
      setNewSupply("");
    }
  };

  const toggleSupplyAssignment = async (supplyId: number) => {
    if (!currentParticipantId) {
      toast({
        title: "Erro",
        description: "Você precisa estar confirmado como participante para se responsabilizar por itens.",
        variant: "destructive",
      });
      return;
    }

    try {
      const supply = supplies.find(s => s.id === supplyId);
      if (!supply) return;

      const myAssignment = supply.assignments.find(a => a.participant_id === currentParticipantId);

      if (myAssignment) {
        // Remover atribuição
        const { error } = await supabase
          .from('item_assignments')
          .delete()
          .eq('id', myAssignment.id);

        if (error) throw error;

        toast({
          title: "Responsabilidade removida",
          description: "Você não é mais responsável por este item.",
        });
      } else {
        // Adicionar atribuição
        const { error } = await supabase
          .from('item_assignments')
          .insert({
            event_id: Number(eventId),
            item_id: supplyId,
            participant_id: currentParticipantId,
            quantidade_atribuida: supply.quantidade,
            confirmado: false,
          });

        if (error) throw error;

        toast({
          title: "Responsabilidade assumida",
          description: "Você agora é responsável por este item!",
        });
      }
    } catch (err: any) {
      console.error('Erro ao alterar atribuição:', err);
      toast({
        title: "Erro",
        description: err.message || "Não foi possível alterar a atribuição.",
        variant: "destructive",
      });
    }
  };

  const getSupplyStatus = (supply: Supply) => {
    if (!supply.assignments.length) return 'available';
    const myAssignment = supply.assignments.find(a => a.participant_id === currentParticipantId);
    if (myAssignment) return 'mine';
    return 'taken';
  };

  const getSupplyStatusText = (supply: Supply) => {
    const status = getSupplyStatus(supply);
    if (status === 'available') return 'Disponível';
    if (status === 'mine') return 'Você se responsabilizou';
    return `Responsável: ${supply.assignments.map(a => a.participant_name).join(', ')}`;
  };

  const getSupplyStatusVariant = (supply: Supply): "default" | "secondary" | "outline" => {
    const status = getSupplyStatus(supply);
    if (status === 'available') return 'outline';
    if (status === 'mine') return 'default';
    return 'secondary';
  };

  const handleScheduleDelivery = () => {
    toast({
      title: "Funcionalidade em desenvolvimento!",
      description: "Funcionalidade de agendamento de entrega em desenvolvimento!",
    });
  };

  // Salvar convidados e lista de insumos (organizador)
  const handleSaveLists = async () => {
    if (!event) return;
    setSaving(true);
    try {
      const eventoIdStr = String(Number(eventId));
      const eventoIdNum = Number(eventId);
      const isAIEvent = Boolean((event as any)?.created_by_ai);

      // Se evento manual, tentar fallback com upsert direto nas tabelas
      if (!isAIEvent) {
        // Participantes (fallback manual)
        const participantsRows = attendees.map((a) => ({
          id: isNaN(Number(a.id)) ? undefined : Number(a.id),
          event_id: eventoIdNum,
          nome_participante: a.name,
          contato: a.email || null,
          status_convite: a.status === "confirmado" ? "confirmado" : a.status === "recusado" ? "recusado" : "pendente",
        }));
        const { error: partErr } = await supabase
          .from("event_participants")
          .upsert(participantsRows, { onConflict: "id" });
        if (partErr) throw partErr;

        // Itens (fallback manual)
        const itemsRows = supplies.map((s) => ({
          id: isNaN(Number(s.id)) ? undefined : Number(s.id),
          event_id: eventoIdNum,
          nome_item: s.name,
          quantidade: s.quantidade,
          unidade: s.unidade,
          categoria: s.categoria,
          prioridade: s.prioridade,
        }));
        const { error: itemsErr } = await supabase.from("event_items").upsert(itemsRows, { onConflict: "id" });
        if (itemsErr) throw itemsErr;

        toast({
          title: "Alterações salvas (modo manual)!",
          description: "",
        });
        return;
      }

      // Montar payload de participantes (evento criado pela IA)
      const participantsPayload = attendees.map((a) => ({
        id: a.id,
        evento_id: eventoIdStr,
        nome_participante: a.name,
        contato: a.email || null,
        status_convite: a.status,
        preferencias: null,
        valor_responsavel: null,
      })) as any;

      await rpc.participants_bulk_upsert(eventoIdStr, participantsPayload);

      // Montar payload de itens
      const itemsPayload = supplies.map((s) => ({
        id: s.id,
        evento_id: eventoIdStr,
        nome_item: s.name,
        quantidade: s.quantidade,
        unidade: s.unidade,
        valor_estimado: 0,
        categoria: s.categoria,
        prioridade: s.prioridade,
      })) as any;

      await rpc.items_replace_for_event(eventoIdStr, itemsPayload);

      toast({ title: "Alterações salvas!", description: "" });
    } catch (err: any) {
      console.error("Erro ao salvar listas:", err);
      toast({ title: "Falha ao salvar", description: err.message || "Não foi possível salvar as alterações." });
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando evento...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Evento não encontrado"}</p>
          <Button onClick={onBack}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b px-4 py-6">
        <div className="max-w-4xl mx-auto flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-4">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{event.title}</h1>
            {isOrganizer && (
              <Badge variant="secondary" className="mt-1">
                Organizador
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Event Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Evento</CardTitle>
            {!isOrganizer && <CardDescription>Confirme ou sugira alternativas para cada item</CardDescription>}
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Data */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="w-5 h-5 mr-3" />
                  <div>
                    <span className="font-medium text-foreground">Data:</span>
                    <p>{formatDate(event.event_date)}</p>
                  </div>
                </div>
                {!isOrganizer && (
                  <div className="flex gap-2">
                    <Button
                      variant={confirmation.date === "confirmed" ? "default" : "outline"}
                      size="sm"
                      onClick={handleConfirmDate}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Confirmar
                    </Button>
                    <Popover open={showDatePopover} onOpenChange={setShowDatePopover}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={confirmation.date === "rejected" ? "destructive" : "outline"}
                          size="sm"
                          onClick={handleRejectDate}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Não posso
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4">
                        <div className="space-y-4">
                          <h4 className="font-medium">Sugira uma data alternativa:</h4>
                          <CalendarComponent
                            mode="single"
                            selected={alternativeDate}
                            onSelect={setAlternativeDate}
                            className="pointer-events-auto"
                          />
                          <Button onClick={saveAlternativeDate} className="w-full">
                            Confirmar Alternativa
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Horário */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center text-muted-foreground">
                  <Clock className="w-5 h-5 mr-3" />
                  <div>
                    <span className="font-medium text-foreground">Horário:</span>
                    <p>{event.event_time}</p>
                  </div>
                </div>
                {!isOrganizer && (
                  <div className="flex gap-2">
                    <Button
                      variant={confirmation.time === "confirmed" ? "default" : "outline"}
                      size="sm"
                      onClick={handleConfirmTime}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Confirmar
                    </Button>
                    <Popover open={showTimePopover} onOpenChange={setShowTimePopover}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={confirmation.time === "rejected" ? "destructive" : "outline"}
                          size="sm"
                          onClick={handleRejectTime}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Não posso
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4">
                        <div className="space-y-4">
                          <h4 className="font-medium">Sugira um horário alternativo:</h4>
                          <Select value={alternativeTime} onValueChange={setAlternativeTime}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um horário" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                                  {`${i.toString().padStart(2, "0")}:00`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button onClick={saveAlternativeTime} className="w-full">
                            Confirmar Alternativa
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Local */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-5 h-5 mr-3" />
                  <div>
                    <span className="font-medium text-foreground">Local:</span>
                    <p>{event.location}</p>
                  </div>
                </div>
                {!isOrganizer && (
                  <div className="flex gap-2">
                    <Button
                      variant={confirmation.location === "confirmed" ? "default" : "outline"}
                      size="sm"
                      onClick={handleConfirmLocation}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Confirmar
                    </Button>
                    <Popover open={showLocationPopover} onOpenChange={setShowLocationPopover}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={confirmation.location === "rejected" ? "destructive" : "outline"}
                          size="sm"
                          onClick={handleRejectLocation}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Não posso
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4">
                        <div className="space-y-4">
                          <h4 className="font-medium">Sugira um local alternativo:</h4>
                          <Textarea
                            placeholder="Digite sua sugestão de local..."
                            value={alternativeLocation}
                            onChange={(e) => setAlternativeLocation(e.target.value)}
                          />
                          <Button onClick={saveAlternativeLocation} className="w-full">
                            Confirmar Alternativa
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {event.description && (
                <div className="pt-4 border-t">
                  <p className="text-muted-foreground">{event.description}</p>
                </div>
              )}

              {/* Botão de confirmar presença - dentro do card */}
              {!isOrganizer && canConfirmPresence() && (
                <div className="pt-6 border-t mt-6">
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={saving}
                    onClick={handleConfirmPresence}
                    variant="default"
                  >
                    {saving ? "Confirmando..." : "✓ Confirmar Presença no Evento"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Confirme sua presença após validar data, hora e local
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Organizers - apenas organizadores podem ver e editar */}
        {isOrganizer && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Organizadores ({1 + organizers.length})
                </CardTitle>
                <OrganizerInviteDialog
                  onInvite={handleInvite}
                  excludeUserIds={[event.user_id, ...organizers.map((o) => o.user_id)]}
                  friends={friends}
                  isOrganizer={true}
                  triggerLabel="Adicionar Organizador"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Criador do evento */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Criador do evento</p>
                    <p className="text-sm text-muted-foreground">ID: {event.user_id}</p>
                  </div>
                  <Badge variant="default">Organizador Principal</Badge>
                </div>

                {/* Co-organizadores */}
                {organizers.map((organizer) => (
                  <div key={organizer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Co-organizador</p>
                      <p className="text-sm text-muted-foreground">ID: {organizer.user_id}</p>
                      <p className="text-xs text-muted-foreground">
                        Adicionado em {new Date(organizer.added_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => removeOrganizer(organizer.id)}>
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendees - Visível para organizadores e convidados confirmados */}
        {(isOrganizer || isInvitedGuest) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Participantes ({attendees.length})
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Lista de pessoas convidadas para o evento
                  </CardDescription>
                </div>
                {isOrganizer && (
                  <OrganizerInviteDialog
                    onInvite={handleInvite}
                    excludeUserIds={[]}
                    friends={friends}
                    isOrganizer={false}
                    triggerLabel="Convidar Participante"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendees.map((attendee) => (
                  <div key={attendee.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{attendee.name}</p>
                      {isOrganizer && attendee.email && (
                        <p className="text-sm text-muted-foreground truncate">{attendee.email}</p>
                      )}
                    </div>
                    <Badge
                      variant={
                        attendee.status === "confirmado"
                          ? "default"
                          : attendee.status === "pendente"
                            ? "secondary"
                            : "destructive"
                      }
                      className="shrink-0 ml-2"
                    >
                      {attendee.status === "confirmado"
                        ? "Confirmado"
                        : attendee.status === "pendente"
                          ? "Pendente"
                          : "Recusado"}
                    </Badge>
                  </div>
                ))}
                {attendees.length === 0 && (
                  <p className="text-center text-muted-foreground py-6">
                    Nenhum participante convidado ainda
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Supplies List - Visível para organizadores e convidados confirmados */}
        {(isOrganizer || isInvitedGuest) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Lista de Insumos ({supplies.length})
                </CardTitle>
              </div>
              <CardDescription className="mt-1">
                {isInvitedGuest && !isOrganizer
                  ? "Escolha os itens que você pode levar"
                  : "Gerencie os itens necessários para o evento"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supplies.map((supply) => (
                  <div
                    key={supply.id}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      getSupplyStatus(supply) === 'mine'
                        ? 'border-primary bg-primary/5'
                        : getSupplyStatus(supply) === 'taken'
                          ? 'border-muted bg-muted/30'
                          : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{supply.name}</h4>
                          <Badge variant={getSupplyStatusVariant(supply)} className="text-xs">
                            {getSupplyStatusText(supply)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {supply.quantidade} {supply.unidade}
                        </p>
                      </div>
                    </div>

                    {(isInvitedGuest || isOrganizer) && currentParticipantId && (
                      <div className="flex items-center space-x-2 pt-2 border-t">
                        <Checkbox
                          id={`supply-${supply.id}`}
                          checked={getSupplyStatus(supply) === 'mine'}
                          onCheckedChange={() => toggleSupplyAssignment(supply.id)}
                          disabled={getSupplyStatus(supply) === 'taken'}
                        />
                        <label
                          htmlFor={`supply-${supply.id}`}
                          className={`text-sm font-medium leading-none ${
                            getSupplyStatus(supply) === 'taken'
                              ? 'cursor-not-allowed opacity-70'
                              : 'cursor-pointer'
                          }`}
                        >
                          {getSupplyStatus(supply) === 'mine'
                            ? 'Desistir deste item'
                            : getSupplyStatus(supply) === 'taken'
                              ? 'Item já foi escolhido'
                              : 'Me responsabilizar por este item'}
                        </label>
                      </div>
                    )}
                  </div>
                ))}

                {supplies.length === 0 && (
                  <p className="text-center text-muted-foreground py-6">
                    Nenhum item adicionado ainda
                  </p>
                )}

                {isOrganizer && (
                  <div className="flex gap-2 mt-4">
                    <Input
                      placeholder="Adicionar item..."
                      value={newSupply}
                      onChange={(e) => setNewSupply(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addSupply()}
                    />
                    <Button onClick={addSupply}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão de Salvar (organizador) */}
        {isOrganizer && (
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <Button className="w-full" size="lg" disabled={saving} onClick={handleSaveLists}>
                {saving ? "Salvando..." : "💾 Salvar Alterações"}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Salva convidados e lista de insumos do evento
              </p>
            </CardContent>
          </Card>
        )}

        {/* Botão de Salvar - apenas para convidados, no final da página */}
        {!isOrganizer &&
          (confirmation.date !== "pending" ||
            confirmation.time !== "pending" ||
            confirmation.location !== "pending") && (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <Button
                  variant="floating"
                  className="w-full"
                  size="lg"
                  disabled={saving}
                  onClick={handleSaveConfirmation}
                >
                  {saving ? "Salvando..." : "💾 Salvar Minhas Preferências"}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Salve suas confirmações e sugestões de alternativas antes de sair
                </p>
              </CardContent>
            </Card>
          )}
      </main>
    </div>
  );
};

export default EventDetails;
