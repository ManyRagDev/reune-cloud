import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Check, X, FileText, Eye, Shuffle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ParticipantStatus {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  status: "pending" | "confirmed";
  has_wishlist: boolean;
  has_viewed_result: boolean;
}

export default function SecretSantaAdmin() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<ParticipantStatus[]>([]);
  const [secretSantaData, setSecretSantaData] = useState<any>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [redrawing, setRedrawing] = useState(false);

  useEffect(() => {
    if (!user || !eventId) return;
    checkOrganizer();
  }, [user, eventId]);

  const checkOrganizer = async () => {
    if (!user || !eventId) return;

    try {
      // Verificar se é organizador
      const { data: eventData, error: eventError } = await supabase
        .from("table_reune")
        .select("user_id")
        .eq("id", Number(eventId))
        .maybeSingle();

      if (eventError) throw eventError;

      if (!eventData || eventData.user_id !== user.id) {
        // Verificar se é co-organizador
        const { data: coOrgData } = await supabase
          .from("event_organizers")
          .select("id")
          .eq("event_id", Number(eventId))
          .eq("user_id", user.id)
          .maybeSingle();

        if (!coOrgData) {
          toast({
            title: "Acesso negado",
            description: "Apenas organizadores podem acessar esta página.",
            variant: "destructive",
          });
          navigate(`/app?event=${eventId}`);
          return;
        }
      }

      setIsOrganizer(true);
      loadData();
    } catch (err: any) {
      console.error("Erro ao verificar permissões:", err);
      toast({
        title: "Erro",
        description: err.message || "Não foi possível verificar permissões.",
        variant: "destructive",
      });
    }
  };

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

      setSecretSantaData(secretSantaData);

      // Buscar participantes
      const { data: participantsData, error: participantsError } = await supabase
        .from("event_secret_santa_participants")
        .select("id, user_id, status, wishlist_text, wishlist_link")
        .eq("secret_santa_id", secretSantaData.id);

      if (participantsError) throw participantsError;

      // Buscar perfis
      if (participantsData && participantsData.length > 0) {
        const userIds = participantsData.map((p) => p.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds);

        const participantsStatus: ParticipantStatus[] = participantsData.map((p) => {
          const profile = profilesData?.find((prof) => prof.id === p.user_id);
          return {
            id: p.id,
            user_id: p.user_id,
            display_name: profile?.display_name || "Participante",
            avatar_url: profile?.avatar_url,
            status: p.status as "pending" | "confirmed",
            has_wishlist: !!(p.wishlist_text || p.wishlist_link),
            has_viewed_result: false, // TODO: implementar tracking de visualização
          };
        });

        setParticipants(participantsStatus);
      }
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

  const handleRedraw = async () => {
    if (!secretSantaData) return;

    setRedrawing(true);
    try {
      // Deletar pares existentes
      const { error: deleteError } = await supabase
        .from("event_secret_santa_pairs")
        .delete()
        .eq("secret_santa_id", secretSantaData.id);

      if (deleteError) throw deleteError;

      // Marcar como não sorteado
      const { error: updateError } = await supabase
        .from("event_secret_santa")
        .update({ has_drawn: false })
        .eq("id", secretSantaData.id);

      if (updateError) throw updateError;

      toast({
        title: "Sorteio resetado",
        description: "Você pode realizar um novo sorteio agora.",
      });

      navigate(`/event/${eventId}/secret-santa/participants`);
    } catch (err: any) {
      console.error("Erro ao refazer sorteio:", err);
      toast({
        title: "Erro",
        description: err.message || "Não foi possível refazer o sorteio.",
        variant: "destructive",
      });
    } finally {
      setRedrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isOrganizer) {
    return null;
  }

  const confirmedCount = participants.filter((p) => p.status === "confirmed").length;
  const wishlistCount = participants.filter((p) => p.has_wishlist).length;

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

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold">{participants.length}</p>
                <p className="text-sm text-muted-foreground">Participantes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Check className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-3xl font-bold">{confirmedCount}</p>
                <p className="text-sm text-muted-foreground">Confirmados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-3xl font-bold">{wishlistCount}</p>
                <p className="text-sm text-muted-foreground">Com Wishlist</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status do sorteio */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Status do Sorteio</CardTitle>
                <CardDescription>
                  {secretSantaData?.has_drawn
                    ? "O sorteio já foi realizado"
                    : "O sorteio ainda não foi realizado"}
                </CardDescription>
              </div>
              {secretSantaData?.has_drawn && (
                <Badge variant="default">Sorteado</Badge>
              )}
            </div>
          </CardHeader>
          {secretSantaData && !secretSantaData.has_drawn && (
            <CardContent>
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate(`/event/${eventId}/secret-santa/participants`)}
                  className="flex-1"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Realizar Sorteio
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Lista de participantes */}
        <Card>
          <CardHeader>
            <CardTitle>Participantes</CardTitle>
            <CardDescription>
              Acompanhe o status de cada participante
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {participants.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  Nenhum participante adicionado ainda
                </p>
              ) : (
                participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar>
                        <AvatarImage src={participant.avatar_url} />
                        <AvatarFallback>{participant.display_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{participant.display_name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge
                            variant={
                              participant.status === "confirmed" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {participant.status === "confirmed" ? "Confirmado" : "Pendente"}
                          </Badge>
                          {participant.has_wishlist ? (
                            <Badge variant="outline" className="text-xs gap-1">
                              <FileText className="w-3 h-3" />
                              Com Wishlist
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                              <X className="w-3 h-3" />
                              Sem Wishlist
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ações administrativas */}
        {secretSantaData?.has_drawn && (
          <Card className="border-2 border-destructive/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <CardTitle>Ações Administrativas</CardTitle>
              </div>
              <CardDescription>
                Use com cuidado - estas ações afetam o sorteio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={redrawing}>
                    <Shuffle className="w-4 h-4 mr-2" />
                    Refazer Sorteio
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá deletar todos os pares atuais e permitir um novo sorteio.
                      Os participantes precisarão ver seus novos pares novamente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRedraw}>
                      Confirmar Refazer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
