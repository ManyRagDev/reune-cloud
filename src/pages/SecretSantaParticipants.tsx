import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, Users, Shuffle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Participant {
  id: string;
  user_id: string;
  status: "pending" | "confirmed";
  display_name?: string;
  avatar_url?: string;
  email?: string;
}

interface EventInvitation {
  participant_email: string;
  participant_name: string;
  status: string;
}

export default function SecretSantaParticipants() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [secretSantaId, setSecretSantaId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [eventInvitations, setEventInvitations] = useState<EventInvitation[]>([]);
  const [newParticipantEmail, setNewParticipantEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [allConfirmed, setAllConfirmed] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    loadData();
  }, [eventId]);

  useEffect(() => {
    // Verificar se todos os participantes foram confirmados
    const allParticipantsConfirmed = participants.length > 0 && 
      participants.every(p => p.status === "confirmed");
    setAllConfirmed(allParticipantsConfirmed);
  }, [participants]);

  const loadData = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
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

      // Buscar participantes já adicionados ao Amigo Secreto
      const { data: participantsData, error: participantsError } = await supabase
        .from("event_secret_santa_participants")
        .select(`
          id,
          user_id,
          status
        `)
        .eq("secret_santa_id", secretSantaData.id);

      if (participantsError) throw participantsError;

      // Buscar informações dos perfis
      if (participantsData && participantsData.length > 0) {
        const userIds = participantsData.map(p => p.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds);

        const { data: usersData } = await supabase
          .from("profiles")
          .select("id")
          .in("id", userIds);

        const participantsWithInfo = participantsData.map(p => {
          const profile = profilesData?.find(prof => prof.id === p.user_id);
          return {
            ...p,
            status: p.status as "pending" | "confirmed",
            display_name: profile?.display_name,
            avatar_url: profile?.avatar_url,
          };
        });

        setParticipants(participantsWithInfo);
      }

      // Buscar convidados do evento
      const { data: invitationsData, error: invitationsError } = await supabase
        .from("event_invitations")
        .select("participant_email, participant_name, status")
        .eq("event_id", Number(eventId))
        .eq("status", "accepted");

      if (invitationsError) throw invitationsError;
      setEventInvitations(invitationsData || []);

    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
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
    if (!secretSantaId) return;
    
    try {
      // Buscar usuário pelo email usando a função RPC
      const { data: userData, error: userError } = await supabase
        .rpc("search_user_by_identifier", {
          _identifier: email
        });

      if (userError || !userData || userData.length === 0) {
        toast({
          title: "Usuário não encontrado",
          description: "O email fornecido não corresponde a nenhum usuário cadastrado.",
          variant: "destructive",
        });
        return;
      }

      const userId = userData[0].id;

      // Adicionar participante
      const { error: insertError } = await supabase
        .from("event_secret_santa_participants")
        .insert({
          secret_santa_id: secretSantaId,
          user_id: userId,
          status: "pending",
        });

      if (insertError) {
        if (insertError.code === "23505") { // Unique violation
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

      toast({
        title: "Participante adicionado!",
        description: "O participante foi adicionado com sucesso.",
      });

      setNewParticipantEmail("");
      loadData();
    } catch (err: any) {
      console.error("Erro ao adicionar participante:", err);
      toast({
        title: "Erro ao adicionar",
        description: err.message || "Não foi possível adicionar o participante.",
        variant: "destructive",
      });
    }
  };

  const handleAddEventInvitations = async () => {
    if (!secretSantaId || !eventInvitations.length) return;
    
    setConfirming(true);
    try {
      // Buscar user_ids dos emails dos convidados
      const emails = eventInvitations.map(inv => inv.participant_email);
      
      // Para cada email, tentar buscar o user_id
      for (const invitation of eventInvitations) {
        try {
          const { data } = await supabase.rpc("search_user_by_identifier", {
            _identifier: invitation.participant_email
          });

          if (data && data.length > 0) {
            const userId = data[0].id;
            
            // Adicionar participante (ignorar se já existir)
            await supabase
              .from("event_secret_santa_participants")
              .insert({
                secret_santa_id: secretSantaId,
                user_id: userId,
                status: "pending",
              })
              .select();
          }
        } catch (err) {
          console.error(`Erro ao adicionar ${invitation.participant_email}:`, err);
        }
      }

      toast({
        title: "Participantes confirmados!",
        description: "Os convidados do evento foram adicionados ao Amigo Secreto.",
      });

      loadData();
    } catch (err: any) {
      console.error("Erro ao confirmar participantes:", err);
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
    if (!secretSantaId || participants.length < 3) {
      toast({
        title: "Participantes insuficientes",
        description: "É necessário pelo menos 3 participantes para realizar o sorteio.",
        variant: "destructive",
      });
      return;
    }

    setDrawing(true);
    try {
      // Algoritmo simples de sorteio
      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      const pairs = shuffled.map((giver, index) => ({
        secret_santa_id: secretSantaId,
        giver_id: giver.user_id,
        receiver_id: shuffled[(index + 1) % shuffled.length].user_id,
      }));

      // Inserir pares
      const { error: pairsError } = await supabase
        .from("event_secret_santa_pairs")
        .insert(pairs);

      if (pairsError) throw pairsError;

      // Marcar como sorteado
      const { error: updateError } = await supabase
        .from("event_secret_santa")
        .update({ has_drawn: true })
        .eq("id", secretSantaId);

      if (updateError) throw updateError;

      toast({
        title: "Sorteio realizado!",
        description: "Os pares foram sorteados com sucesso. Cada participante pode ver seu par.",
      });

      navigate(`/app?event=${eventId}`);
    } catch (err: any) {
      console.error("Erro ao realizar sorteio:", err);
      toast({
        title: "Erro ao sortear",
        description: err.message || "Não foi possível realizar o sorteio.",
        variant: "destructive",
      });
    } finally {
      setDrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
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
                  if (e.key === "Enter" && newParticipantEmail.trim()) {
                    handleAddParticipant(newParticipantEmail.trim());
                  }
                }}
              />
              <Button
                onClick={() => handleAddParticipant(newParticipantEmail.trim())}
                disabled={!newParticipantEmail.trim()}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {/* Botão para adicionar todos os convidados do evento */}
            {eventInvitations.length > 0 && (
              <Button
                onClick={handleAddEventInvitations}
                disabled={confirming}
                variant="outline"
                className="w-full"
              >
                {confirming ? "Adicionando..." : `Adicionar todos os ${eventInvitations.length} convidados do evento`}
              </Button>
            )}

            {/* Lista de participantes */}
            <div className="space-y-3">
              <h3 className="font-semibold">Participantes ({participants.length})</h3>
              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum participante adicionado ainda.
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
                          <AvatarImage src={participant.avatar_url} />
                          <AvatarFallback>
                            {participant.display_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {participant.display_name || "Usuário"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {participant.email}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={participant.status === "confirmed" ? "default" : "secondary"}
                      >
                        {participant.status === "confirmed" ? "Confirmado" : "Pendente"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3">
              {allConfirmed && (
                <Button
                  onClick={handleDrawPairs}
                  disabled={drawing || participants.length < 3}
                  className="flex-1"
                  size="lg"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  {drawing ? "Sorteando..." : "Realizar Sorteio"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
