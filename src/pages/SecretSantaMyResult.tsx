import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Gift, Eye, EyeOff, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function SecretSantaMyResult() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [receiverInfo, setReceiverInfo] = useState<{
    user_id: string;
    display_name: string;
    avatar_url?: string;
    wishlist_text?: string;
    wishlist_link?: string;
  } | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!user || !eventId) return;
    loadMyPair();
  }, [user, eventId]);

  const loadMyPair = async () => {
    if (!user || !eventId) return;

    setLoading(true);
    try {
      // Buscar configuração do Amigo Secreto
      const { data: secretSantaData, error: secretSantaError } = await supabase
        .from("event_secret_santa")
        .select("id, has_drawn")
        .eq("event_id", Number(eventId))
        .maybeSingle();

      if (secretSantaError) throw secretSantaError;

      if (!secretSantaData) {
        toast({
          title: "Amigo Secreto não encontrado",
          description: "Este evento não possui Amigo Secreto configurado.",
          variant: "destructive",
        });
        navigate(`/app?event=${eventId}`);
        return;
      }

      if (!secretSantaData.has_drawn) {
        toast({
          title: "Sorteio ainda não realizado",
          description: "O sorteio ainda não foi feito. Aguarde o organizador.",
          variant: "destructive",
        });
        navigate(`/app?event=${eventId}`);
        return;
      }

      // Buscar meu par
      const { data: pairData, error: pairError } = await supabase
        .from("event_secret_santa_pairs")
        .select("receiver_id")
        .eq("secret_santa_id", secretSantaData.id)
        .eq("giver_id", user.id)
        .maybeSingle();

      if (pairError) throw pairError;

      if (!pairData) {
        toast({
          title: "Par não encontrado",
          description: "Você não está participando deste Amigo Secreto.",
          variant: "destructive",
        });
        navigate(`/app?event=${eventId}`);
        return;
      }

      // Buscar informações do receiver
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", pairData.receiver_id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Buscar wishlist
      const { data: wishlistData } = await supabase
        .from("event_secret_santa_participants")
        .select("wishlist_text, wishlist_link")
        .eq("secret_santa_id", secretSantaData.id)
        .eq("user_id", pairData.receiver_id)
        .maybeSingle();

      setReceiverInfo({
        user_id: pairData.receiver_id,
        display_name: profileData?.display_name || "Participante",
        avatar_url: profileData?.avatar_url,
        wishlist_text: wishlistData?.wishlist_text,
        wishlist_link: wishlistData?.wishlist_link,
      });
    } catch (err: any) {
      console.error("Erro ao carregar par:", err);
      toast({
        title: "Erro ao carregar",
        description: err.message || "Não foi possível carregar seu par.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Gift className="w-12 h-12 mx-auto mb-4 text-primary animate-bounce" />
          <p className="text-muted-foreground">Carregando seu amigo secreto...</p>
        </div>
      </div>
    );
  }

  if (!receiverInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Amigo secreto não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/app?event=${eventId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para o evento
        </Button>

        {/* Aviso de segredo */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-sm">
              <EyeOff className="w-5 h-5 text-primary" />
              <p className="font-medium text-primary">
                🤫 Este resultado é secreto. Apenas você pode ver quem você tirou!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card de revelação */}
        <Card className="border-2 border-primary/30 shadow-xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-6 h-6 text-primary" />
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-2xl">Seu Amigo Secreto</CardTitle>
            <CardDescription>
              Clique no botão abaixo para revelar quem você tirou
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!revealed ? (
              <div className="text-center py-8">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                  <Button
                    onClick={() => setRevealed(true)}
                    size="lg"
                    className="relative gap-2 text-lg px-8 py-6"
                  >
                    <Eye className="w-5 h-5" />
                    Revelar Amigo Secreto
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Avatar e nome */}
                <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                  <Avatar className="w-32 h-32 border-4 border-primary/20">
                    <AvatarImage src={receiverInfo.avatar_url} />
                    <AvatarFallback className="text-3xl">
                      {receiverInfo.display_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h3 className="text-3xl font-bold mb-2">{receiverInfo.display_name}</h3>
                    <Badge variant="default" className="text-sm">
                      Seu Amigo Secreto 🎁
                    </Badge>
                  </div>
                </div>

                {/* Wishlist */}
                {(receiverInfo.wishlist_text || receiverInfo.wishlist_link) && (
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Lista de Desejos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {receiverInfo.wishlist_text && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">O que gostaria de ganhar:</p>
                          <p className="text-base">{receiverInfo.wishlist_text}</p>
                        </div>
                      )}
                      {receiverInfo.wishlist_link && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Link sugerido:</p>
                          <a
                            href={receiverInfo.wishlist_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                          >
                            {receiverInfo.wishlist_link}
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Botão para wishlist própria */}
                <Button
                  onClick={() => navigate(`/event/${eventId}/secret-santa/wishlist`)}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Editar Minha Lista de Desejos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dicas */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>💡 <strong>Dica:</strong> Mantenha o segredo! Não revele para ninguém quem você tirou.</p>
              <p>🎁 <strong>Lembre-se:</strong> Cada presente deve ser escolhido com carinho.</p>
              {receiverInfo.wishlist_text || receiverInfo.wishlist_link ? (
                <p>✨ <strong>Sugestão:</strong> Use a lista de desejos como inspiração!</p>
              ) : (
                <p>📝 <strong>Atenção:</strong> A pessoa não preencheu uma lista de desejos ainda.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
