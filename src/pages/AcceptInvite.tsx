import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<{ title: string; id: number } | null>(null);
  const [requiresSignup, setRequiresSignup] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token de convite não encontrado");
      setLoading(false);
      return;
    }

    handleAcceptInvite();
  }, [token]);

  const handleAcceptInvite = async () => {
    try {
      setLoading(true);
      
      // Verificar se usuário está logado
      const { data: { user } } = await supabase.auth.getUser();

      // Chamar função para aceitar convite
      const { data, error: rpcError } = await supabase.rpc('accept_event_invitation', {
        _invitation_token: token,
        _user_id: user?.id || null
      });

      if (rpcError) throw rpcError;

      const result = data as { success: boolean; event_id: number; event_title: string; requires_signup: boolean };

      setEventData({
        id: result.event_id,
        title: result.event_title
      });

      // Captura discreta de email para early adopters (quando não está logado)
      if (result.requires_signup) {
        // Buscar email do convite para adicionar à waitlist de early adopters
        const { data: invitationData } = await supabase
          .from('event_invitations')
          .select('participant_email')
          .eq('invitation_token', token)
          .single();

        if (invitationData?.participant_email) {
          // Enviar para API de waitlist com tracking
          try {
            await fetch('/functions/v1/waitlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: invitationData.participant_email,
                source_url: window.location.href
              })
            });
            console.log('Email capturado para benefícios futuros:', invitationData.participant_email);
          } catch (error) {
            console.error('Erro ao capturar email:', error);
          }
        }

        setRequiresSignup(true);
        toast.success("Convite aceito! Faça seu cadastro para continuar.");
      } else {
        toast.success("Convite aceito com sucesso!");
      }

      setLoading(false);
    } catch (err: any) {
      console.error("Erro ao aceitar convite:", err);
      setError(err.message || "Erro ao aceitar convite");
      setLoading(false);
      toast.error("Erro ao aceitar convite");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processando convite...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Erro ao aceitar convite
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requiresSignup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Convite aceito!
            </CardTitle>
            <CardDescription>
              Você aceitou o convite para: <strong>{eventData?.title}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Faça seu cadastro com o mesmo e-mail que recebeu o convite para acessar o evento.
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Fazer cadastro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Convite aceito com sucesso!
          </CardTitle>
          <CardDescription>
            Você foi adicionado ao evento: <strong>{eventData?.title}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => navigate(`/events/${eventData?.id}`)} 
            className="w-full"
          >
            Ver detalhes do evento
          </Button>
          <Button 
            onClick={() => navigate("/dashboard")} 
            variant="outline" 
            className="w-full"
          >
            Ir para Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
