import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Plus, Package, Check, X, UserPlus, UserMinus, Trash2, Edit2, Save, Gift, DollarSign, Pencil, Moon, Sun, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEvent } from "@/hooks/useEvent";
import { useAuth } from "@/hooks/useAuth";
import { OrganizerInviteDialog } from "@/components/events/OrganizerInviteDialog";
import { supabase } from "@/integrations/supabase/client";
import { rpc } from "@/api/rpc";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { NBLight, NBDark, NBPalette, nb } from "@/lib/neobrutalism";

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
  valor_estimado: number | null;
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
  const navigate = useNavigate();

  /* ── Dark mode ──────────────────────── */
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("reune-v3-theme");
      if (saved) return saved === "dark";
    }
    return false;
  });
  useEffect(() => { localStorage.setItem("reune-v3-theme", isDark ? "dark" : "light"); }, [isDark]);
  const C: NBPalette = isDark ? NBDark : NBLight;

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [newSupply, setNewSupply] = useState("");
  const [newSupplyQuantity, setNewSupplyQuantity] = useState(1);
  const [newSupplyUnit, setNewSupplyUnit] = useState("un");
  const [friends, setFriends] = useState<{ friend_id: string }[]>([]);
  const [currentParticipantId, setCurrentParticipantId] = useState<number | null>(null);
  const [isConfirmedGuest, setIsConfirmedGuest] = useState(false);

  // Variáveis de permissão consolidadas para restaurar funcionalidade
  const isEventCreator = event?.user_id === user?.id;
  const canViewFullDetails = isOrganizer || isEventCreator || isConfirmedGuest;
  // Permissão de edição: apenas criador ou organizador podem editar
  const canEdit = isOrganizer || isEventCreator;

  console.log('[EventDetails] Debug Permissions:', {
    userId: user?.id,
    eventUserId: event?.user_id,
    isEventCreator,
    isOrganizer,
    canEdit,
    canViewFullDetails,
    eventData: event
  });

  // Estados para edição das informações básicas do evento
  const [isEditingEventInfo, setIsEditingEventInfo] = useState(false);
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editEventDate, setEditEventDate] = useState<Date | undefined>();
  const [editEventTime, setEditEventTime] = useState('');
  const [editEventLocation, setEditEventLocation] = useState('');
  const [editEventDescription, setEditEventDescription] = useState('');

  const [editingSupplyId, setEditingSupplyId] = useState<number | null>(null);
  const [editingSupplyData, setEditingSupplyData] = useState<{ name: string; quantidade: number; unidade: string; valor_estimado: number | null }>({ name: '', quantidade: 1, unidade: 'un', valor_estimado: null });
  const [organizerInfo, setOrganizerInfo] = useState<{ username: string | null; email: string | null }>({
    username: null,
    email: null
  });
  const [coOrganizersInfo, setCoOrganizersInfo] = useState<Record<string, { username: string | null; email: string | null }>>({});

  // Estados para dinâmicas do evento
  const [hasSecretSanta, setHasSecretSanta] = useState(false);
  const [secretSantaData, setSecretSantaData] = useState<any>(null);

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
          .maybeSingle();

        if (error) {
          setIsConfirmedGuest(false);
          return;
        }
        if (!data) {
          setIsConfirmedGuest(false);
          return;
        }
        if (data.status === 'accepted') {
          setIsConfirmedGuest(true);
        } else {
          setIsConfirmedGuest(false);
        }
      } catch (err) {
        console.error('Erro ao verificar status de convite:', err);
      }
    };

    checkInvitationStatus();
  }, [event, user, eventId]);

  // Buscar informações do organizador
  useEffect(() => {
    if (!event) return;

    const fetchOrganizerInfo = async () => {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', event.user_id)
          .maybeSingle();

        // Se o usuário logado é o organizador, usar seu próprio email
        const organizerEmail = user?.id === event.user_id ? user.email : null;

        setOrganizerInfo({
          username: profileData?.username || null,
          email: organizerEmail || null,
        });
      } catch (err) {
        console.error('Erro ao buscar informações do organizador:', err);
      }
    };

    fetchOrganizerInfo();
  }, [event, user]);

  // Buscar informações dos co-organizadores
  useEffect(() => {
    if (!organizers.length) return;

    const fetchCoOrganizersInfo = async () => {
      try {
        const userIds = organizers.map(o => o.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        if (profilesData) {
          const infoMap: Record<string, { username: string | null; email: string | null }> = {};
          profilesData.forEach((profile: any) => {
            infoMap[profile.id] = {
              username: profile.username || null,
              email: null,
            };
          });
          setCoOrganizersInfo(infoMap);
        }
      } catch (err) {
        console.error('Erro ao buscar informações dos co-organizadores:', err);
      }
    };

    fetchCoOrganizersInfo();
  }, [organizers]);

  // Carregar dinâmicas do evento
  useEffect(() => {
    if (!event) return;

    const loadDynamics = async () => {
      try {
        const { data: dynamicsData, error: dynamicsError } = await supabase
          .from("event_dynamics")
          .select("*")
          .eq("event_id", Number(eventId))
          .eq("type", "secret_santa")
          .maybeSingle();

        if (dynamicsError && dynamicsError.code !== 'PGRST116') throw dynamicsError;

        if (dynamicsData) {
          setHasSecretSanta(true);

          // Carregar dados do Amigo Secreto
          const { data: secretSantaData, error: secretSantaError } = await supabase
            .from("event_secret_santa")
            .select("*")
            .eq("event_id", Number(eventId))
            .maybeSingle();

          if (secretSantaError && secretSantaError.code !== 'PGRST116') throw secretSantaError;

          if (secretSantaData) {
            setSecretSantaData(secretSantaData);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dinâmicas:", err);
      }
    };

    loadDynamics();
  }, [event, eventId]);

  // Carregar participantes e itens do banco de dados
  useEffect(() => {
    // Carregar dados para qualquer usuário autenticado com acesso ao evento
    if (!event || !user) return;

    const loadEventData = async () => {
      try {
        const eventIdNum = Number(eventId);

        // Carregar participantes a partir de event_invitations
        const { data: invitationsData, error: invitationsError } = await supabase
          .from("event_invitations")
          .select("id, participant_email, participant_name, status")
          .eq("event_id", eventIdNum);

        if (invitationsError) throw invitationsError;

        if (invitationsData) {
          const mappedAttendees: Attendee[] = invitationsData.map((inv: any) => ({
            id: inv.id,
            name: inv.participant_name,
            email: inv.participant_email,
            status: inv.status === 'accepted' ? 'confirmado' : inv.status === 'declined' ? 'recusado' : 'pendente',
          }));
          setAttendees(mappedAttendees);

          // Encontrar o ID da invitation do usuário atual
          const myInvitation = invitationsData.find((inv: any) => inv.participant_email === user.email);
          if (myInvitation) {
            // Buscar o participant_id na tabela event_participants baseado no email
            const { data: participantData } = await supabase
              .from("event_participants")
              .select("id")
              .eq("event_id", eventIdNum)
              .eq("contato", user.email)
              .maybeSingle();

            if (participantData) {
              setCurrentParticipantId(participantData.id);
            }
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
              .map((a: any) => ({
                id: a.id,
                participant_id: a.participant_id,
                participant_name: "Participante",
                quantidade_atribuida: a.quantidade_atribuida,
                confirmado: a.confirmado,
              }));

            return {
              id: item.id,
              name: item.nome_item,
              quantidade: item.quantidade,
              unidade: item.unidade,
              categoria: item.categoria,
              prioridade: item.prioridade,
              valor_estimado: item.valor_estimado,
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

    const invitationsChannel = supabase
      .channel(`invitations_${eventIdNum}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_invitations',
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
      supabase.removeChannel(invitationsChannel);
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

  // Funções para edição das informações do evento
  const startEditingEventInfo = () => {
    if (!event) return;
    setEditEventTitle(event.title);
    setEditEventDate(new Date(event.event_date + 'T12:00:00'));
    setEditEventTime(event.event_time);
    setEditEventLocation(event.location || '');
    setEditEventDescription(event.description || '');
    setIsEditingEventInfo(true);
  };

  // Auto-start edit mode for creators/organizers
  const hasInitializedEditMode = useState(false); // Using state to track initialization
  useEffect(() => {
    if (event && canEdit && !isEditingEventInfo && !hasInitializedEditMode[0]) {
      startEditingEventInfo();
      hasInitializedEditMode[1](true);
    }
  }, [event, canEdit]);

  const cancelEditingEventInfo = () => {
    setIsEditingEventInfo(false);
    setEditEventTitle('');
    setEditEventDate(undefined);
    setEditEventTime('');
    setEditEventLocation('');
    setEditEventDescription('');
  };

  const saveEventInfo = async () => {
    if (!event || !editEventDate) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('table_reune')
        .update({
          title: editEventTitle,
          event_date: format(editEventDate, 'yyyy-MM-dd'),
          event_time: editEventTime,
          location: editEventLocation,
          description: editEventDescription || null,
        })
        .eq('id', Number(eventId));

      if (error) throw error;

      toast({
        title: "Evento atualizado",
        description: "As informações do evento foram salvas com sucesso.",
      });

      setIsEditingEventInfo(false);
      // Força refetch do evento
      window.location.reload();
    } catch (err: any) {
      console.error("Erro ao salvar evento:", err);
      toast({
        title: "Erro ao salvar",
        description: err.message || "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!event) return;
    try {
      const { error } = await supabase
        .from('table_reune')
        .update({ status: newStatus })
        .eq('id', Number(eventId));

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `O evento foi marcado como ${newStatus === 'finalized' ? 'finalizado' : newStatus === 'cancelled' ? 'cancelado' : newStatus}.`,
        variant: newStatus === 'finalized' ? 'default' : newStatus === 'cancelled' ? 'destructive' : 'default',
      });

      window.location.reload();
    } catch (err: any) {
      console.error("Erro ao atualizar status:", err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
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
      setIsConfirmedGuest(true);
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
    userId: string | null,
    email: string | null,
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
        _invitee_user_id: userId,
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
      if (!result?.user_exists && result?.invitation_token && email) {
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


  const addSupply = async () => {
    if (!newSupply.trim()) return;

    try {
      // Adicionar ao estado local imediatamente
      const newItem = {
        id: Date.now(),
        name: newSupply,
        quantidade: newSupplyQuantity,
        unidade: newSupplyUnit,
        categoria: 'geral',
        prioridade: 'B',
        valor_estimado: null,
        assignments: [],
      };

      setSupplies([...supplies, newItem]);
      setNewSupply("");
      setNewSupplyQuantity(1);
      setNewSupplyUnit("un");

      // Se for convidado confirmado ou organizador, salvar diretamente no banco
      if ((isConfirmedGuest || isOrganizer) && event) {
        const { error } = await supabase
          .from('event_items')
          .insert({
            event_id: Number(eventId),
            nome_item: newSupply.trim(),
            quantidade: newSupplyQuantity,
            unidade: newSupplyUnit,
            categoria: 'geral',
            prioridade: 'B',
            valor_estimado: null,
          });

        if (error) {
          throw error;
        }

        toast({
          title: "Item adicionado",
          description: "O item foi adicionado à lista automaticamente.",
        });

        // Refetch para garantir que os IDs e assignments estão corretos
        const { data: itemsData, error: itemsError } = await supabase
          .from('event_items')
          .select('*')
          .eq('event_id', Number(eventId))
          .order('updated_at', { ascending: false });

        if (!itemsError && itemsData) {
          const { data: assignmentsData } = await supabase
            .from('item_assignments')
            .select('*, event_participants(nome_participante)')
            .eq('event_id', Number(eventId));

          if (assignmentsData) {
            const suppliesWithAssignments = itemsData.map((item) => ({
              id: item.id,
              name: item.nome_item,
              quantidade: item.quantidade,
              unidade: item.unidade,
              categoria: item.categoria,
              prioridade: item.prioridade,
              valor_estimado: item.valor_estimado,
              assignments: assignmentsData
                .filter((a) => a.item_id === item.id)
                .map((a) => ({
                  id: a.id,
                  participant_id: a.participant_id,
                  participant_name: (a.event_participants as any)?.nome_participante || 'Participante',
                  quantidade_atribuida: a.quantidade_atribuida,
                  confirmado: a.confirmado,
                })),
            }));

            setSupplies(suppliesWithAssignments);
          }
        }
      }
    } catch (err: any) {
      console.error('Erro ao adicionar item:', err);
      toast({
        title: "Erro",
        description: err.message || "Não foi possível adicionar o item.",
        variant: "destructive",
      });
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
      // Como os itens já são salvos automaticamente ao adicionar/editar,
      // apenas confirmamos que tudo está salvo
      await new Promise(resolve => setTimeout(resolve, 500)); // Pequeno delay para feedback visual

      toast({
        title: "Listas salvas",
        description: "Todas as alterações foram registradas.",
      });
    } catch (err: any) {
      console.error("Erro ao salvar listas:", err);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItemPrice = async (itemId: number, price: number | null) => {
    try {
      const { error } = await supabase
        .from('event_items')
        .update({ valor_estimado: price })
        .eq('id', itemId);

      if (error) throw error;

      setSupplies(prev => prev.map(item =>
        item.id === itemId ? { ...item, valor_estimado: price } : item
      ));

      toast({
        title: "Valor atualizado",
        description: "O valor estimado do item foi salvo.",
      });
    } catch (err) {
      console.error("Erro ao atualizar preço:", err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o valor.",
        variant: "destructive",
      });
    }
  };

  // Cost Calculation Logic
  const calculateCosts = () => {
    // 🔥 CORREÇÃO: valor_estimado já é o valor TOTAL, não multiplicar por quantidade
    const totalCost = supplies.reduce((acc, item) => {
      return acc + (item.valor_estimado || 0);
    }, 0);

    // Count confirmed guests + organizer (1)
    const confirmedGuestsCount = attendees.filter(a => a.status === 'confirmado').length;
    const totalPeople = confirmedGuestsCount + 1; // +1 for organizer

    const costPerPerson = totalPeople > 0 ? totalCost / totalPeople : 0;

    return { totalCost, costPerPerson, totalPeople };
  };

  const { totalCost, costPerPerson, totalPeople } = calculateCosts();
  const hasAnyPrice = supplies.some(s => s.valor_estimado !== null && s.valor_estimado > 0);

  // Deletar item
  const deleteSupply = async (supplyId: number) => {
    try {
      const { error } = await supabase
        .from('event_items')
        .delete()
        .eq('id', supplyId);

      if (error) throw error;

      setSupplies(supplies.filter(s => s.id !== supplyId));

      toast({
        title: "Item removido",
        description: "O item foi removido da lista.",
      });
    } catch (err: any) {
      console.error('Erro ao deletar item:', err);
      toast({
        title: "Erro",
        description: err.message || "Não foi possível remover o item.",
        variant: "destructive",
      });
    }
  };

  // Editar item
  const updateSupply = async (supplyId: number, updates: { nome_item?: string; quantidade?: number; unidade?: string }) => {
    try {
      const { error } = await supabase
        .from('event_items')
        .update(updates)
        .eq('id', supplyId);

      if (error) throw error;

      setSupplies(supplies.map(s =>
        s.id === supplyId
          ? { ...s, name: updates.nome_item || s.name, quantidade: updates.quantidade || s.quantidade, unidade: updates.unidade || s.unidade }
          : s
      ));

      toast({
        title: "Item atualizado",
        description: "As alterações foram salvas.",
      });
    } catch (err: any) {
      console.error('Erro ao atualizar item:', err);
      toast({
        title: "Erro",
        description: err.message || "Não foi possível atualizar o item.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.bg }}>
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className={`w-20 h-20 rounded-xl ${nb.border} mx-auto mb-6 flex items-center justify-center`}
            style={{ backgroundColor: C.orange }}
          >
            <Sparkles className="w-10 h-10" style={{ color: "#FFFDF7" }} />
          </motion.div>
          <p className="font-black text-xl" style={{ color: C.text }}>Carregando evento...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.bg }}>
        <div className="text-center">
          <div className={`w-20 h-20 rounded-xl ${nb.border} ${nb.shadow} flex items-center justify-center mx-auto mb-6`} style={{ backgroundColor: C.pink }}>
            <X className="w-10 h-10" style={{ color: C.black }} />
          </div>
          <p className="font-black text-lg mb-4" style={{ color: C.text }}>{error || "Evento não encontrado"}</p>
          <button onClick={onBack} className={`px-6 py-3 rounded-xl ${nb.border} ${nb.shadow} ${nb.hover} font-black`} style={{ backgroundColor: C.orange, color: "#FFFDF7" }}>Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: C.bg, color: C.text }}>
      {/* ═══ NAVBAR — Solid Neubrutalist top bar ═══ */}
      <nav
        className={`sticky top-0 z-50 px-4 md:px-8 py-3 ${nb.border} border-t-0 border-x-0 flex items-center justify-between transition-colors duration-300`}
        style={{ backgroundColor: C.bg }}
      >
        <div className="flex items-center gap-3">
          <button onClick={onBack} className={`p-2 rounded-lg ${nb.border} ${nb.shadow} ${nb.hover}`} style={{ backgroundColor: C.sectionBg, color: C.text }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate" style={{ color: C.orange }}>{event.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {isOrganizer && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg ${nb.border} text-xs font-black`} style={{ backgroundColor: C.yellow, color: C.black }}>👑 Organizador</span>
              )}
              {canEdit ? (
                <div className="inline-block" onClick={(e) => e.stopPropagation()}>
                  <Select defaultValue={event.status || 'draft'} onValueChange={handleStatusChange}>
                    <SelectTrigger className={`h-7 w-[130px] text-xs font-bold rounded-lg ${nb.border}`} style={{ backgroundColor: C.inputBg, color: C.text }}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">📝 Rascunho</SelectItem>
                      <SelectItem value="created">✨ Criado</SelectItem>
                      <SelectItem value="finalized">✅ Finalizado</SelectItem>
                      <SelectItem value="cancelled">🚫 Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg ${nb.border} text-xs font-black`} style={{ backgroundColor: C.sectionBg, color: C.text }}>
                  {event.status === 'finalized' ? 'Finalizado' : event.status === 'cancelled' ? 'Cancelado' : event.status}
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-lg ${nb.border} ${nb.shadow} ${nb.hover}`} style={{ backgroundColor: isDark ? C.yellow : C.lavender, color: C.black }}>
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* ═══ Event Info Card ═══ */}
        <div className={`rounded-2xl ${nb.border} ${nb.shadowLg} overflow-hidden transition-colors duration-300`} style={{ backgroundColor: C.cardBg }}>
          <div className="h-3 w-full" style={{ backgroundColor: C.sky }} />
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black flex items-center gap-2" style={{ color: C.text }}>📋 Informações do Evento</h2>
                {!canEdit && <p className="text-sm font-medium mt-1" style={{ color: C.textMuted, opacity: 0.6 }}>Confirme ou sugira alternativas</p>}
                {canEdit && isEditingEventInfo && <p className="text-sm font-bold mt-1" style={{ color: C.orange }}>Modo de edição ativo ✏️</p>}
              </div>
              {canEdit && !isEditingEventInfo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditingEventInfo}
                  className="gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </Button>
              )}
              {canEdit && isEditingEventInfo && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEditingEventInfo}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveEventInfo}
                    disabled={saving || !editEventTitle || !editEventDate || !editEventTime}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              )}
            </div>

            {/* Modo de Edição para Organizadores */}
            {isEditingEventInfo && canEdit ? (
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="editTitle" className="text-sm font-black" style={{ color: C.text }}>Nome do Evento</Label>
                  <Input
                    id="editTitle"
                    value={editEventTitle}
                    onChange={(e) => setEditEventTitle(e.target.value)}
                    className={`mt-1 h-12 rounded-xl ${nb.input} font-bold`}
                    style={{ backgroundColor: C.inputBg, color: C.text, borderColor: C.border }}
                    placeholder="Digite o título do evento"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data
                    </Label>
                    <div className="mt-1">
                      <DatePicker
                        value={editEventDate}
                        onChange={setEditEventDate}
                        placeholder="Escolha a data"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Horário
                    </Label>
                    <div className="mt-1">
                      <TimePicker
                        value={editEventTime}
                        onChange={setEditEventTime}
                        placeholder="Escolha o horário"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="editLocation" className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Local
                  </Label>
                  <Input
                    id="editLocation"
                    value={editEventLocation}
                    onChange={(e) => setEditEventLocation(e.target.value)}
                    className="mt-1"
                    placeholder="Digite o local do evento"
                  />
                </div>

                <div>
                  <Label htmlFor="editDescription" className="text-sm font-semibold">Descrição</Label>
                  <Textarea
                    id="editDescription"
                    value={editEventDescription}
                    onChange={(e) => setEditEventDescription(e.target.value)}
                    className="mt-1"
                    placeholder="Descrição do evento (opcional)"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              /* Modo de Visualização */
              <div className="space-y-6">
                {/* Título - visível para todos */}
                <div className="flex items-center p-4 border rounded-lg bg-muted/30">
                  <div>
                    <span className="font-medium text-foreground">Título:</span>
                    <p className="text-lg font-semibold">{event.title}</p>
                  </div>
                </div>

                {/* Data */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-5 h-5 mr-3" />
                    <div>
                      <span className="font-medium text-foreground">Data:</span>
                      <p>{formatDate(event.event_date)}</p>
                    </div>
                  </div>
                  {!canEdit && (
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
                  {!canEdit && (
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
                  {!canEdit && (
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
                    <span className="font-medium text-foreground text-sm">Descrição:</span>
                    <p className="text-muted-foreground mt-1">{event.description}</p>
                  </div>
                )}

                {/* Botão de confirmar presença - apenas para convidados */}
                {!canEdit && canConfirmPresence() && (
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
            )}
          </div>
        </div>

        {/* ═══ Organizers ═══ */}
        {isOrganizer && (
          <div className={`rounded-2xl ${nb.border} ${nb.shadowLg} overflow-hidden transition-colors duration-300`} style={{ backgroundColor: C.cardBg }}>
            <div className="h-3 w-full" style={{ backgroundColor: C.lavender }} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black flex items-center gap-2" style={{ color: C.text }}>
                  👥 Organizadores ({1 + organizers.length})
                </h2>
                <OrganizerInviteDialog
                  onInvite={handleInvite}
                  excludeUserIds={[event.user_id, ...organizers.map((o) => o.user_id)]}
                  friends={friends}
                  isOrganizer={true}
                  triggerLabel={
                    <>
                      <span className="hidden sm:inline">Adicionar Organizador</span>
                      <span className="sm:hidden">Adicionar</span>
                    </>
                  }
                />
              </div>
              <div className="space-y-3">
                {/* Criador do evento */}
                <div className={`flex items-center gap-4 p-3 sm:p-4 rounded-xl ${nb.border}`} style={{ backgroundColor: C.yellow }}>
                  <div className={`w-12 h-12 rounded-xl ${nb.border} flex items-center justify-center font-black text-lg`} style={{ backgroundColor: C.cardBg, color: C.black }}>
                    {(organizerInfo.username || organizerInfo.email || '?').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-base truncate" style={{ color: C.black }}>
                        {organizerInfo.username || organizerInfo.email || 'Criador do evento'}
                      </p>
                      {user?.id === event.user_id && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg ${nb.border} text-[10px] font-bold`} style={{ backgroundColor: C.cardBg, color: C.black }}>Você</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg ${nb.border} text-[10px] font-bold`} style={{ backgroundColor: C.orange, color: '#FFFDF7' }}>Organizador Principal</span>
                    </div>
                  </div>
                </div>

                {/* Co-organizadores */}
                {organizers.map((organizer) => {
                  const info = coOrganizersInfo[organizer.user_id];
                  const displayName = info?.username || info?.email || 'Co-organizador';
                  const isCurrentUser = user?.id === organizer.user_id;
                  return (
                    <div key={organizer.id} className={`flex items-center gap-4 p-3 sm:p-4 rounded-xl ${nb.border} transition-colors`} style={{ backgroundColor: C.sectionBg }}>
                      <div className={`w-10 h-10 rounded-xl ${nb.border} flex items-center justify-center font-bold`} style={{ backgroundColor: C.mint, color: C.black }}>
                        {displayName?.substring(0, 2).toUpperCase() || "OR"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold truncate" style={{ color: C.text }}>{displayName}</p>
                          {isCurrentUser && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg ${nb.border} text-[10px] font-bold`} style={{ backgroundColor: C.sky, color: C.black }}>Você</span>
                          )}
                        </div>
                        <p className="text-xs font-medium mt-0.5" style={{ color: C.textMuted, opacity: 0.6 }}>
                          Incluso em {new Date(organizer.added_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <button
                        className={`p-1.5 rounded-lg ${nb.border} hover:bg-red-100 transition-colors`}
                        style={{ backgroundColor: C.cardBg }}
                        onClick={() => removeOrganizer(organizer.id)}
                        title="Remover co-organizador"
                      >
                        <UserMinus className="w-4 h-4" style={{ color: C.black }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ Attendees ═══ */}
        {event && (
          <div className={`rounded-2xl ${nb.border} ${nb.shadowLg} overflow-hidden transition-colors duration-300`} style={{ backgroundColor: C.cardBg }}>
            <div className="h-3 w-full" style={{ backgroundColor: C.mint }} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black flex items-center gap-2" style={{ color: C.text }}>
                    👥 Participantes ({attendees.length})
                  </h2>
                  <p className="text-sm font-medium mt-1" style={{ color: C.textMuted, opacity: 0.6 }}>Convidados para o evento</p>
                </div>
                {isOrganizer && (
                  <OrganizerInviteDialog
                    onInvite={handleInvite}
                    excludeUserIds={[]}
                    friends={friends}
                    isOrganizer={false}
                    triggerLabel={
                      <>
                        <span className="hidden sm:inline">Convidar Participante</span>
                        <span className="sm:hidden">Convidar</span>
                      </>
                    }
                  />
                )}
              </div>
              <div className="space-y-3">
                {/* Organizador */}
                {event && (
                  <div className={`flex items-center gap-4 p-3 sm:p-4 rounded-xl ${nb.border}`} style={{ backgroundColor: C.yellow }}>
                    <div className={`w-10 h-10 rounded-xl ${nb.border} flex items-center justify-center font-bold`} style={{ backgroundColor: C.cardBg, color: C.black }}>
                      {(organizerInfo.username || organizerInfo.email || '?').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold truncate" style={{ color: C.black }}>
                          {organizerInfo.username || organizerInfo.email || 'Organizador'}
                        </p>
                        {user?.id === event.user_id && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg ${nb.border} text-[10px] font-bold`} style={{ backgroundColor: C.cardBg, color: C.black }}>Você</span>
                        )}
                      </div>
                      <p className="text-xs font-medium" style={{ color: C.black, opacity: 0.6 }}>Organizador do Evento</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg ${nb.border} text-xs font-black shrink-0`} style={{ backgroundColor: C.orange, color: '#FFFDF7' }}>
                      Organizador
                    </span>
                  </div>
                )}

                {/* Convidados */}
                {attendees.map((attendee) => {
                  const isCurrentUser = user?.email === attendee.email;
                  const displayName = attendee.name || attendee.email || 'Participante';
                  const statusColors: Record<string, string> = { confirmado: C.mint, pendente: C.yellow, recusado: C.pink };
                  const statusBg = statusColors[attendee.status] || C.sectionBg;

                  return (
                    <div key={attendee.id} className={`flex items-center gap-4 p-3 sm:p-4 rounded-xl ${nb.border} transition-colors`} style={{ backgroundColor: C.sectionBg }}>
                      <div className={`w-10 h-10 rounded-xl ${nb.border} flex items-center justify-center font-bold`} style={{ backgroundColor: C.sky, color: C.black }}>
                        {displayName?.substring(0, 2).toUpperCase() || "PA"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold truncate" style={{ color: C.text }}>{displayName}</p>
                          {isCurrentUser && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg ${nb.border} text-[10px] font-bold`} style={{ backgroundColor: C.sky, color: C.black }}>Você</span>
                          )}
                        </div>
                        {isOrganizer && attendee.email && (
                          <p className="text-xs font-medium truncate mt-0.5" style={{ color: C.textMuted, opacity: 0.6 }}>{attendee.email}</p>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg ${nb.border} text-xs font-black shrink-0`} style={{ backgroundColor: statusBg, color: C.black }}>
                        {attendee.status === "confirmado" ? "✅ Confirmado" : attendee.status === "pendente" ? "⏳ Pendente" : "❌ Recusado"}
                      </span>
                    </div>
                  );
                })}
                {attendees.length === 0 && (
                  <p className="text-center font-bold py-6 mt-3" style={{ color: C.textMuted, opacity: 0.5 }}>
                    Nenhum participante convidado ainda
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ Supplies List ═══ */}
        {event && (
          <div className={`rounded-2xl ${nb.border} ${nb.shadowLg} overflow-hidden transition-colors duration-300`} style={{ backgroundColor: C.cardBg }}>
            <div className="h-3 w-full" style={{ backgroundColor: C.orange }} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black flex items-center gap-2" style={{ color: C.text }}>
                    📦 Lista de Insumos ({supplies.length})
                  </h2>
                  <p className="text-sm font-medium mt-1" style={{ color: C.textMuted, opacity: 0.6 }}>
                    {isConfirmedGuest && !isOrganizer && !isEventCreator
                      ? "Escolha os itens que você pode levar"
                      : "Gerencie os itens necessários para o evento"}
                  </p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => {
                      const input = document.querySelector('[placeholder="Adicionar item..."]') as HTMLInputElement;
                      if (input) {
                        input.focus();
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className={`px-4 py-2 rounded-xl ${nb.border} ${nb.shadow} ${nb.hover} font-black text-sm flex items-center gap-2`}
                    style={{ backgroundColor: C.mint, color: C.black }}
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Item
                  </button>
                )}
              </div>

              {/* Cost Summary */}
              {hasAnyPrice && (
                <div className={`mb-6 p-4 rounded-xl ${nb.border} ${nb.shadow}`} style={{ backgroundColor: C.yellow }}>
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold" style={{ color: C.black, opacity: 0.6 }}>Custo Total Estimado</p>
                      <p className="text-2xl font-black" style={{ color: C.black }}>
                        {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm font-bold" style={{ color: C.black, opacity: 0.6 }}>
                        Custo por Pessoa ({totalPeople} confirmados)
                      </p>
                      <p className="text-xl font-black" style={{ color: C.black }}>
                        {costPerPerson.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {supplies.map((supply) => {
                  const isEditing = editingSupplyId === supply.id;

                  return (
                    <div
                      key={supply.id}
                      className={`p-4 border-2 rounded-lg transition-all ${getSupplyStatus(supply) === 'mine'
                        ? 'border-primary bg-primary/5'
                        : getSupplyStatus(supply) === 'taken'
                          ? 'border-muted bg-muted/30'
                          : 'border-border hover:border-primary/50'
                        }`}
                    >
                      {isEditing ? (
                        // Modo de edição
                        <div className="space-y-3">
                          <Input
                            value={editingSupplyData.name}
                            onChange={(e) => setEditingSupplyData({ ...editingSupplyData, name: e.target.value })}
                            placeholder="Nome do item"
                            className="font-medium"
                          />
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={editingSupplyData.quantidade}
                              onChange={(e) => setEditingSupplyData({ ...editingSupplyData, quantidade: parseFloat(e.target.value) || 0 })}
                              placeholder="Quantidade"
                              className="flex-1"
                            />
                            <Select
                              value={editingSupplyData.unidade}
                              onValueChange={(value) => setEditingSupplyData({ ...editingSupplyData, unidade: value })}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border shadow-lg z-50">
                                <SelectItem value="un">Unidade(s)</SelectItem>
                                <SelectItem value="kg">Quilograma(s)</SelectItem>
                                <SelectItem value="g">Grama(s)</SelectItem>
                                <SelectItem value="l">Litro(s)</SelectItem>
                                <SelectItem value="ml">Mililitro(s)</SelectItem>
                                <SelectItem value="pacote">Pacote(s)</SelectItem>
                                <SelectItem value="caixa">Caixa(s)</SelectItem>
                                <SelectItem value="dúzia">Dúzia(s)</SelectItem>
                                <SelectItem value="fatia">Fatia(s)</SelectItem>
                                <SelectItem value="porção">Porção(ões)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editingSupplyData.valor_estimado || ''}
                              onChange={(e) => setEditingSupplyData({ ...editingSupplyData, valor_estimado: e.target.value ? parseFloat(e.target.value) : null })}
                              placeholder="Valor unitário estimado (opcional)"
                              className="flex-1"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingSupplyId(null)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                updateSupply(supply.id, {
                                  nome_item: editingSupplyData.name,
                                  quantidade: editingSupplyData.quantidade,
                                  unidade: editingSupplyData.unidade,
                                });
                                handleUpdateItemPrice(supply.id, editingSupplyData.valor_estimado);
                                setEditingSupplyId(null);
                              }}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Salvar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Modo de visualização
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{supply.name}</h4>
                                <Badge variant={getSupplyStatusVariant(supply)} className="text-xs">
                                  {getSupplyStatusText(supply)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <p>
                                  {supply.quantidade} {supply.unidade}
                                </p>
                                {supply.valor_estimado && (
                                  <p className="flex items-center text-primary">
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    {supply.valor_estimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </p>
                                )}
                              </div>
                            </div>
                            {canEdit && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingSupplyId(supply.id);
                                    setEditingSupplyData({
                                      name: supply.name,
                                      quantidade: supply.quantidade,
                                      unidade: supply.unidade,
                                      valor_estimado: supply.valor_estimado
                                    });
                                  }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja remover este item?')) {
                                      deleteSupply(supply.id);
                                    }
                                  }}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {canViewFullDetails && currentParticipantId && (
                            <div className="flex items-center space-x-2 pt-2 border-t">
                              <Checkbox
                                id={`supply-${supply.id}`}
                                checked={getSupplyStatus(supply) === 'mine'}
                                onCheckedChange={() => toggleSupplyAssignment(supply.id)}
                                disabled={getSupplyStatus(supply) === 'taken'}
                              />
                              <label
                                htmlFor={`supply-${supply.id}`}
                                className={`text-sm font-medium leading-none ${getSupplyStatus(supply) === 'taken'
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
                        </>
                      )}
                    </div>
                  );
                })}

                {supplies.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-4">
                      Nenhum item adicionado ainda
                    </p>
                    {canViewFullDetails && (
                      <p className="text-sm text-muted-foreground">
                        Use o campo abaixo para adicionar o primeiro item
                      </p>
                    )}
                  </div>
                )}

                {/* Campo de adicionar item - APENAS ORGANIZADORES/CRIADORES */}
                {canEdit && (
                  <div className="space-y-3 mt-4 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-primary/30">
                    <Input
                      placeholder="Adicionar item..."
                      value={newSupply}
                      onChange={(e) => setNewSupply(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addSupply()}
                      className="bg-background"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={newSupplyQuantity}
                        onChange={(e) => setNewSupplyQuantity(parseFloat(e.target.value) || 1)}
                        placeholder="Quantidade"
                        className="bg-background flex-1"
                      />
                      <Select
                        value={newSupplyUnit}
                        onValueChange={setNewSupplyUnit}
                      >
                        <SelectTrigger className="w-[140px] bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="un">Unidade(s)</SelectItem>
                          <SelectItem value="kg">Quilograma(s)</SelectItem>
                          <SelectItem value="g">Grama(s)</SelectItem>
                          <SelectItem value="l">Litro(s)</SelectItem>
                          <SelectItem value="ml">Mililitro(s)</SelectItem>
                          <SelectItem value="pacote">Pacote(s)</SelectItem>
                          <SelectItem value="caixa">Caixa(s)</SelectItem>
                          <SelectItem value="dúzia">Dúzia(s)</SelectItem>
                          <SelectItem value="fatia">Fatia(s)</SelectItem>
                          <SelectItem value="porção">Porção(ões)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={addSupply} disabled={!newSupply.trim()} className="shrink-0">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ Dinâmicas do Evento ═══ */}
        {canViewFullDetails && (
          <div className={`rounded-2xl ${nb.border} ${nb.shadowLg} overflow-hidden transition-colors duration-300`} style={{ backgroundColor: C.cardBg }}>
            <div className="h-3 w-full" style={{ backgroundColor: C.pink }} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black flex items-center gap-2" style={{ color: C.text }}>🎁 Dinâmicas do Evento</h2>
                  <p className="text-sm font-medium mt-1" style={{ color: C.textMuted, opacity: 0.6 }}>Atividades especiais</p>
                </div>
              </div>
              <div className="space-y-3">
                {hasSecretSanta ? (
                  <div className={`p-4 rounded-xl ${nb.border} ${nb.shadow}`} style={{ backgroundColor: C.pink }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-xl ${nb.border}`} style={{ backgroundColor: C.cardBg }}>
                          <Gift className="w-5 h-5" style={{ color: C.black }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-black mb-1" style={{ color: C.black }}>Amigo Secreto</h3>
                          {secretSantaData && (
                            <div className="space-y-1 text-sm font-bold" style={{ color: C.black, opacity: 0.7 }}>
                              {secretSantaData.min_value && secretSantaData.max_value && (
                                <p>Valor: R$ {secretSantaData.min_value} - R$ {secretSantaData.max_value}</p>
                              )}
                              {secretSantaData.draw_date && (
                                <p>Sorteio: {format(new Date(secretSantaData.draw_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                              )}
                              {secretSantaData.has_drawn && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg ${nb.border} text-xs font-black mt-2`} style={{ backgroundColor: C.mint, color: C.black }}>✅ Sorteio realizado</span>
                              )}
                              {!secretSantaData.has_drawn && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg ${nb.border} text-xs font-black mt-2`} style={{ backgroundColor: C.yellow, color: C.black }}>⏳ Aguardando sorteio</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {isOrganizer && (
                        <button className={`px-3 py-1.5 rounded-xl ${nb.border} ${nb.shadow} ${nb.hover} font-black text-sm`} style={{ backgroundColor: C.cardBg, color: C.text }} onClick={() => navigate(`/event/${eventId}/secret-santa/admin`)}>
                          Gerenciar
                        </button>
                      )}
                      {!isOrganizer && secretSantaData.has_drawn && (
                        <button className={`px-3 py-1.5 rounded-xl ${nb.border} ${nb.shadow} ${nb.hover} font-black text-sm`} style={{ backgroundColor: C.orange, color: '#FFFDF7' }} onClick={() => navigate(`/event/${eventId}/secret-santa/my-result`)}>
                          Ver Resultado
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {isOrganizer ? (
                      <div className="text-center py-8">
                        <div className={`w-16 h-16 rounded-xl ${nb.border} ${nb.shadow} flex items-center justify-center mx-auto mb-4`} style={{ backgroundColor: C.pink }}>
                          <Gift className="w-8 h-8" style={{ color: C.black }} />
                        </div>
                        <p className="font-bold mb-4" style={{ color: C.textMuted, opacity: 0.5 }}>Nenhuma dinâmica adicionada</p>
                        <button
                          onClick={() => navigate(`/event/${eventId}/secret-santa/setup`)}
                          className={`px-6 py-3 rounded-xl ${nb.border} ${nb.shadow} ${nb.hover} font-black flex items-center gap-2 mx-auto`}
                          style={{ backgroundColor: C.pink, color: C.black }}
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar Amigo Secreto
                        </button>
                      </div>
                    ) : (
                      <p className="text-center font-bold py-6" style={{ color: C.textMuted, opacity: 0.5 }}>
                        Nenhuma dinâmica configurada
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ Save Buttons ═══ */}
        {isOrganizer && (
          <div className={`rounded-2xl ${nb.border} ${nb.shadowLg} overflow-hidden`} style={{ backgroundColor: C.orange }}>
            <div className="p-6">
              <button className={`w-full py-4 rounded-xl ${nb.border} ${nb.shadow} ${nb.hover} font-black text-lg`} style={{ backgroundColor: '#FFFDF7', color: C.black }} disabled={saving} onClick={handleSaveLists}>
                {saving ? "Salvando..." : "💾 Salvar Alterações"}
              </button>
              <p className="text-xs font-bold text-center mt-3" style={{ color: '#FFFDF7', opacity: 0.8 }}>
                Salva convidados e lista de insumos do evento
              </p>
            </div>
          </div>
        )}

        {!isOrganizer &&
          (confirmation.date !== "pending" ||
            confirmation.time !== "pending" ||
            confirmation.location !== "pending") && (
            <div className={`rounded-2xl ${nb.border} ${nb.shadowLg} overflow-hidden`} style={{ backgroundColor: C.mint }}>
              <div className="p-6">
                <button className={`w-full py-4 rounded-xl ${nb.border} ${nb.shadow} ${nb.hover} font-black text-lg`} style={{ backgroundColor: '#FFFDF7', color: C.black }} disabled={saving} onClick={handleSaveConfirmation}>
                  {saving ? "Salvando..." : "💾 Salvar Minhas Preferências"}
                </button>
                <p className="text-xs font-bold text-center mt-3" style={{ color: C.black, opacity: 0.6 }}>
                  Salve suas confirmações e sugestões de alternativas
                </p>
              </div>
            </div>
          )}
      </main>
    </div>
  );
};

export default EventDetails;
