import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles, ArrowLeft } from "lucide-react";

export default function SecretSantaResults() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar automaticamente para a página de resultado individual
    const timer = setTimeout(() => {
      navigate(`/event/${eventId}/secret-santa/my-result`);
    }, 2000);

    return () => clearTimeout(timer);
  }, [eventId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/app?event=${eventId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para o evento
        </Button>

        <Card className="border-2 border-primary/30 shadow-xl text-center">
          <CardHeader>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Gift className="w-12 h-12 text-primary animate-bounce" />
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-3xl">Sorteio Realizado!</CardTitle>
            <CardDescription className="text-base mt-2">
              O Amigo Secreto foi sorteado com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">
                Redirecionando para ver seu resultado...
              </p>
              <div className="mt-4 flex justify-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            </div>

            <Button
              onClick={() => navigate(`/event/${eventId}/secret-santa/my-result`)}
              className="w-full"
              size="lg"
            >
              Ver Meu Resultado Agora
            </Button>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>🎁 Cada participante pode ver apenas seu próprio par</p>
              <p>🤫 Mantenha o segredo!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
