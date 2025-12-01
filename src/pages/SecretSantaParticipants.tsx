import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, Users, Shuffle, Mail, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Participant {
  id: string;
  user_id: string;
  status: "pending" | "confirmed";
  display_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
}

interface PendingInvitation {
  id: string;
  email: string;
  name: string;
  status: string;
}

interface EventInvitation {
  participant_email: string;
  participant_name: string;
  status: string;
}

export default function SecretSantaParticipants() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [secretSantaId, setSecretSantaId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [eventInvitations, setEventInvitations] = useState<EventInvitation[]>([]);
  const [newParticipantEmail, setNewParticipantEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [eventData, setEventData] = useState<{ title: string; event_date: string; event_time: string } | null>(null);

  useEffect(() => {
    if (!eventId) return;
    loadData();
  }, [eventId]);

  const loadData = async () => {
    if (!eventId) return;

    setLoading(true);
    try {
      // Buscar dados do evento
      const { data: event, error: eventError } = await supabase
        .from("table_reune")
        .select("title, event_date, event_time")
        .eq("id", Number(eventId))
        .single();

      if (eventError) throw eventError;
      setEventData(event);

      // Buscar configuração do Amigo Secreto
      const { data: secretSantaData, error: secretSantaError } = await supabase
        .from("event_secret_santa")
        .select("*")
        .eq("event_id", Number(eventId))
        .maybeSingle();

      if (secretSantaError) throw secretSantaError;

      if (!secretSantaData) {
        toast({
          title: "Amigo Secreto não encontrado",
          description: "Configure o Amigo Secreto primeiro.",
          variant: "destructive",
        });
        navigate(`/event/${eventId}/secret-santa/setup`);
        return;
      }

      setSecretSantaId(secretSantaData.id);

      // Buscar participantes já adicionados ao Amigo Secreto (agora com display_name e email)
      const { data: participantsData, error: participantsError } = await supabase
        .from("event_secret_santa_participants")
        .select(`
          id,
          user_id,
          status,
          display_name,
          email
        `)
        .eq("secret_santa_id", secretSantaData.id);

      if (participantsError) throw participantsError;

      if (participantsData && participantsData.length > 0) {
        const userIds = participantsData.map(p => p.user_id);

        // Buscar perfis para avatar
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds);

        const participantsWithInfo: Participant[] = participantsData.map(p => {
          const profile = profilesData?.find(prof => prof.id === p.user_id);
          return {
            ...p,
            status: p.status as "pending" | "confirmed",
            // Usar display_name do participante ou do perfil
            display_name: p.display_name || profile?.display_name,
            avatar_url: profile?.avatar_url,
            // Email já está no registro do participante
            email: p.email,
          };
        });

        setParticipants(participantsWithInfo);
      } else {
        setParticipants([]);
      }

      // Buscar convites pendentes para o amigo secreto (não-cadastrados)
      const { data: pendingData, error: pendingError } = await supabase
        .from("event_invitations")
        .select("id, participant_email, participant_name, status")
        .eq("event_id", Number(eventId))
        .eq("status", "pending_secret_santa");

      if (!pendingError && pendingData) {
        setPendingInvitations(pendingData.map(inv => ({
          id: inv.id,
          email: inv.participant_email,
          name: inv.participant_name || inv.participant_email.split("@")[0],
          status: inv.status || "pending",
        })));
      }

      // Buscar convidados aceitos do evento (para importar)
      const { data: invitationsData, error: invitationsError } = await supabase
        .from("event_invitations")
        .select("participant_email, participant_name, status")
        .eq("event_id", Number(eventId))
        .eq("status", "accepted");

      if (invitationsError) throw invitationsError;
      setEventInvitations(invitationsData || []);

    } catch (err: any) {
      // Error handling
      toast({
        title: "Erro ao carregar",
        description: err.message || "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = async (email: string) => {
    if (!secretSantaId || !eventId || !eventData) return;

    const trimmedEmail = email.trim().toLowerCase();

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      // Buscar usuário pelo email usando a função RPC (agora com LEFT JOIN)
      const { data: userData, error: userError } = await supabase
        .rpc("search_user_by_identifier", {
          _identifier: trimmedEmail
        });

      if (userError) {
        // Error handling
      }

      // Se usuário existe no sistema
      if (userData && userData.length > 0) {
        const foundUser = userData[0];
        const userId = foundUser.id;

        // Verificar se já é participante
        const existingParticipant = participants.find(p => p.user_id === userId);
        if (existingParticipant) {
          toast({
            title: "Participante já adicionado",
            description: "Este usuário já está na lista de participantes.",
            variant: "destructive",
          });
          return;
        }

        // Adicionar participante com display_name e email
        const { error: insertError } = await supabase
          .from("event_secret_santa_participants")
          .insert({
            secret_santa_id: secretSantaId,
            user_id: userId,
            status: "confirmed",
            display_name: foundUser.display_name || null,
            email: foundUser.email,
          });

        if (insertError) {
          if (insertError.code === "23505") {
            toast({
              title: "Participante já adicionado",
              description: "Este usuário já está na lista de participantes.",
              variant: "destructive",
            });
          } else {
            throw insertError;
          }
          return;
        }

        const displayText = foundUser.display_name
          ? `${foundUser.display_name} (${foundUser.email})`
          : foundUser.email;

        toast({
          title: "Participante adicionado!",
          description: `${displayText} foi adicionado ao Amigo Secreto.`,
        });

        setNewParticipantEmail("");
        loadData();
      } else {
        // Usuário NÃO existe - criar convite por email
        await handleInviteNonRegisteredUser(trimmedEmail);
      }
    } catch (err: any) {
      // Error handling
      toast({
        title: "Erro ao adicionar",
        description: err.message || "Não foi possível adicionar o participante.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleInviteNonRegisteredUser = async (email: string) => {
    if (!eventId || !eventData) return;

    // Verificar se já existe um convite pendente para este email
    const existingInvitation = pendingInvitations.find(inv => inv.email.toLowerCase() === email.toLowerCase());
    if (existingInvitation) {
      toast({
        title: "Convite já enviado",
        description: "Já existe um convite pendente para este email.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Gerar nome a partir do email
      const name = email.split("@")[0];

      // Criar registro de convite no banco
      const { data: invitation, error: inviteError } = await supabase
        .from("event_invitations")
        .insert({
          event_id: Number(eventId),
          participant_email: email,
          participant_name: name,
          status: "pending_secret_santa",
        })
        .select()
        .single();

      if (inviteError) {
        if (inviteError.code === "23505") {
          toast({
            title: "Email já convidado",
            description: "Este email já possui um convite para o evento.",
            variant: "destructive",
          });
          return;
        }
        throw inviteError;
      }

      // Enviar email de convite
      const { error: emailError } = await supabase.functions.invoke("send-invitation-email", {
        body: {
          invitee_email: email,
          invitee_name: name,
          event_title: `Amigo Secreto: ${eventData.title}`,
          event_date: eventData.event_date,
          event_time: eventData.event_time,
          is_organizer: false,
          invitation_token: invitation.invitation_token,
        },
      });

      if (emailError) {
        // Error handling
        toast({
          title: "Convite criado",
          description: "O convite foi criado mas houve um erro ao enviar o email. O participante pode ser adicionado manualmente depois.",
          variant: "default",
        });
      } else {
        toast({
          title: "Convite enviado!",
          description: `Um email foi enviado para ${email} convidando para participar do Amigo Secreto.`,
        });
      }

      setNewParticipantEmail("");
      loadData();
    } catch (err: any) {
      // Error handling
      toast({
        title: "Erro ao enviar convite",
        description: err.message || "Não foi possível enviar o convite.",
        variant: "destructive",
      });
    }
  };

  const handleAddEventInvitations = async () => {
    if (!secretSantaId || !eventInvitations.length) return;

    setConfirming(true);
    let addedCount = 0;

    try {
      for (const invitation of eventInvitations) {
        try {
          const { data } = await supabase.rpc("search_user_by_identifier", {
            _identifier: invitation.participant_email
          });

          if (data && data.length > 0) {
            const foundUser = data[0];

            // Adicionar participante com info
            const { error } = await supabase
              .from("event_secret_santa_participants")
              .insert({
                secret_santa_id: secretSantaId,
                user_id: foundUser.id,
                status: "confirmed",
                display_name: foundUser.display_name || null,
                email: foundUser.email,
              });

            if (!error) addedCount++;
          }
        } catch (err) {
          // Error handling
        }
      }

      if (addedCount > 0) {
        toast({
          title: "Participantes adicionados!",
          description: `${addedCount} participante(s) foram adicionados ao Amigo Secreto.`,
        });
      } else {
        toast({
          title: "Nenhum participante adicionado",
          description: "Os convidados podem já estar na lista ou não estão cadastrados.",
          variant: "default",
        });
      }

      loadData();
    } catch (err: any) {
      // Error handling
      toast({
        title: "Erro ao confirmar",
        description: err.message || "Não foi possível confirmar os participantes.",
        variant: "destructive",
      });
    } finally {
      setConfirming(false);
    }
  };

  const handleDrawPairs = async () => {
    if (!secretSantaId || participants.length < 2) {
      toast({
        title: "Participantes insuficientes",
        description: "É necessário pelo menos 2 participantes cadastrados para realizar o sorteio.",
        variant: "destructive",
      });
      return;
    }

    setDrawing(true);
    try {
      const { performSecretSantaDraw, validateParticipants } = await import(
        "@/utils/secretSantaDraw"
      );

      const validation = validateParticipants(participants);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const pairs = performSecretSantaDraw(participants);

      const pairsToInsert = pairs.map((pair) => ({
        secret_santa_id: secretSantaId,
        giver_id: pair.giver_id,
        receiver_id: pair.receiver_id,
      }));

      const { error: pairsError } = await supabase
        .from("event_secret_santa_pairs")
        .insert(pairsToInsert);

      if (pairsError) throw pairsError;

      const { error: updateError } = await supabase
        .from("event_secret_santa")
        .update({ has_drawn: true })
        .eq("id", secretSantaId);

      if (updateError) throw updateError;

      // Criar notificações in-app para todos os participantes
      const participantUserIds = participants.map((p) => p.user_id);
      try {
        await supabase.rpc("notify_secret_santa_draw", {
          _event_id: Number(eventId),
          _secret_santa_id: secretSantaId,
          _participant_user_ids: participantUserIds,
        });
      } catch (notifErr) {
        // Error handling
      }

      // Enviar emails para todos os participantes
      try {
        const participantsWithEmail = participants.map((p) => ({
          email: p.email || "",
          displayName: p.display_name || "Participante",
        }));

        await supabase.functions.invoke("send-secret-santa-notification", {
          body: {
            eventId: Number(eventId),
            eventTitle: eventData?.title || "Evento",
            eventDate: eventData?.event_date || new Date().toISOString(),
            secretSantaId,
            participants: participantsWithEmail,
          },
        });
        // Emails de notificação enviados
      } catch (emailErr) {
        // Error handling
        // Não bloquear o fluxo se emails falharem
      }

      toast({
        title: "Sorteio realizado!",
        description: "Os pares foram sorteados e os participantes foram notificados por email.",
      });

      navigate(`/event/${eventId}/secret-santa/results`);
    } catch (err: any) {
      // Error handling
      toast({
        title: "Erro ao sortear",
        description: err.message || "Não foi possível realizar o sorteio.",
        variant: "destructive",
      });
    } finally {
      setDrawing(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from("event_secret_santa_participants")
        .delete()
        .eq("id", participantId);

      if (error) throw error;

      toast({
        title: "Participante removido",
        description: "O participante foi removido do Amigo Secreto.",
      });

      setParticipants(prev => prev.filter(p => p.id !== participantId));
    } catch (err: any) {
      // Error handling
      toast({
        title: "Erro ao remover",
        description: err.message || "Não foi possível remover o participante.",
        variant: "destructive",
      });
    }
  };

  const handleRemovePendingInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("event_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Convite removido",
        description: "O convite pendente foi removido.",
      });

      setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (err: any) {
      // Error handling
      toast({
        title: "Erro ao remover",
        description: err.message || "Não foi possível remover o convite.",
        variant: "destructive",
      });
    }
  };

  // Função para obter o texto de exibição do participante
  const getParticipantDisplayName = (participant: Participant): string => {
    if (participant.display_name) {
      return participant.display_name;
    }
    if (participant.email) {
      return participant.email;
    }
    return "Participante";
  };

  // Função para obter as iniciais do participante
  const getParticipantInitials = (participant: Participant): string => {
    if (participant.display_name) {
      return participant.display_name[0].toUpperCase();
    }
    if (participant.email) {
      return participant.email[0].toUpperCase();
    }
    return "P";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/app?event=${eventId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para o evento
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Participantes do Amigo Secreto</CardTitle>
                  <CardDescription>
                    Gerencie os participantes do Amigo Secreto
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Adicionar novo participante */}
            <div className="flex gap-2">
              <Input
                placeholder="Digite o email do participante"
                value={newParticipantEmail}
                onChange={(e) => setNewParticipantEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newParticipantEmail.trim() && !adding) {
                    handleAddParticipant(newParticipantEmail);
                  }
                }}
                disabled={adding}
              />
              <Button
                onClick={() => handleAddParticipant(newParticipantEmail)}
                disabled={!newParticipantEmail.trim() || adding}
              >
                {adding ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {adding ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Adicione emails de participantes. Se não estiverem cadastrados, receberão um convite para se registrar no ReUNE.
            </p>

            {/* Botão para adicionar todos os convidados do evento */}
            {eventInvitations.length > 0 && (
              <Button
                onClick={handleAddEventInvitations}
                disabled={confirming}
                variant="outline"
                className="w-full"
              >
                {confirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  `Importar ${eventInvitations.length} convidado(s) confirmado(s) do evento`
                )}
              </Button>
            )}

            {/* Lista de participantes confirmados */}
            <div className="space-y-3">
              <h3 className="font-semibold">Participantes Cadastrados ({participants.length})</h3>
              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum participante cadastrado ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={participant.avatar_url || undefined} />
                          <AvatarFallback>
                            {getParticipantInitials(participant)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {getParticipantDisplayName(participant)}
                            {participant.user_id === user?.id && (
                              <span className="text-muted-foreground text-sm ml-2">(você)</span>
                            )}
                          </p>
                          {/* Mostrar email se houver display_name diferente do email */}
                          {participant.display_name && participant.email && (
                            <p className="text-sm text-muted-foreground">
                              {participant.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">
                          Confirmado
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveParticipant(participant.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de convites pendentes (não cadastrados) */}
            {pendingInvitations.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Convites Pendentes ({pendingInvitations.length})</h3>
                <p className="text-sm text-muted-foreground">
                  Estas pessoas ainda não se cadastraram no ReUNE.
                </p>
                <div className="space-y-2">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-dashed"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Mail className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">
                            {invitation.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Aguardando cadastro
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemovePendingInvitation(invitation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Aviso sobre convites pendentes */}
            {pendingInvitations.length > 0 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>Atenção:</strong> Os convites pendentes não participarão do sorteio até que se cadastrem no ReUNE.
                  Aguarde todos se registrarem ou realize o sorteio apenas com os participantes confirmados.
                </p>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-3">
              <Button
                onClick={handleDrawPairs}
                disabled={drawing || participants.length < 2}
                className="flex-1"
                size="lg"
              >
                {drawing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Shuffle className="w-4 h-4 mr-2" />
                )}
                {drawing ? "Sorteando..." : `Realizar Sorteio (${participants.length} participantes)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
