import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function SecretSantaWishlist() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [wishlistText, setWishlistText] = useState("");
  const [wishlistLink, setWishlistLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [secretSantaId, setSecretSantaId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !eventId) return;
    loadWishlist();
  }, [user, eventId]);

  const loadWishlist = async () => {
    if (!user || !eventId) return;

    setLoading(true);
    try {
      // Buscar configuração do Amigo Secreto
      const { data: secretSantaData, error: secretSantaError } = await supabase
        .from("event_secret_santa")
        .select("id")
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

      setSecretSantaId(secretSantaData.id);

      // Buscar wishlist existente
      const { data: wishlistData } = await supabase
        .from("event_secret_santa_participants")
        .select("wishlist_text, wishlist_link")
        .eq("secret_santa_id", secretSantaData.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (wishlistData) {
        setWishlistText(wishlistData.wishlist_text || "");
        setWishlistLink(wishlistData.wishlist_link || "");
      }
    } catch (err: any) {
      console.error("Erro ao carregar wishlist:", err);
      toast({
        title: "Erro ao carregar",
        description: err.message || "Não foi possível carregar sua lista de desejos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !secretSantaId) return;

    if (!wishlistText.trim() && !wishlistLink.trim()) {
      toast({
        title: "Campos vazios",
        description: "Preencha pelo menos um dos campos para salvar.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("event_secret_santa_participants")
        .upsert(
          {
            secret_santa_id: secretSantaId,
            user_id: user.id,
            wishlist_text: wishlistText.trim() || null,
            wishlist_link: wishlistLink.trim() || null,
            status: "confirmed",
          },
          {
            onConflict: "secret_santa_id,user_id",
          }
        );

      if (error) throw error;

      toast({
        title: "Lista salva!",
        description: "Sua lista de desejos foi salva com sucesso.",
      });

      navigate(`/app?event=${eventId}`);
    } catch (err: any) {
      console.error("Erro ao salvar wishlist:", err);
      toast({
        title: "Erro ao salvar",
        description: err.message || "Não foi possível salvar sua lista de desejos.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
      <div className="max-w-2xl mx-auto space-y-6">
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
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Minha Lista de Desejos</CardTitle>
                <CardDescription>
                  Conte o que você gostaria de ganhar no Amigo Secreto
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="wishlistText">O que você gostaria de ganhar?</Label>
              <Textarea
                id="wishlistText"
                value={wishlistText}
                onChange={(e) => setWishlistText(e.target.value)}
                placeholder="Ex: Livros de ficção científica, itens de cozinha, jogos de tabuleiro..."
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Seja específico para ajudar seu amigo secreto a escolher o presente perfeito!
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wishlistLink">Link de algum produto (opcional)</Label>
              <Input
                id="wishlistLink"
                type="url"
                value={wishlistLink}
                onChange={(e) => setWishlistLink(e.target.value)}
                placeholder="https://exemplo.com/produto"
              />
              <p className="text-xs text-muted-foreground">
                Cole o link de um produto específico que você gostaria de receber
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Dica:</strong> Sua lista de desejos será visível apenas para a pessoa que te tirou no sorteio.
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Lista de Desejos"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
