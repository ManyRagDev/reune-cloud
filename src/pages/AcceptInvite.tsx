import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Sparkles, UserPlus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
        {/* Animated Background Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-3xl blur opacity-25"></div>

            <Card className="relative border-2 border-border/50 bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-purple-500" />

              <CardHeader className="pt-8 pb-6 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mx-auto mb-4"
                >
                  <Loader2 className="h-16 w-16 text-blue-500" />
                </motion.div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Processando convite...
                </CardTitle>
                <CardDescription className="mt-2">
                  Aguarde enquanto validamos seu convite
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </motion.div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
        {/* Animated Background Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-red-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-3xl"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/50 to-orange-500/50 rounded-3xl blur opacity-25"></div>

            <Card className="relative border-2 border-border/50 bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-red-500 to-orange-500" />

              <CardHeader className="pt-8 pb-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="mx-auto mb-4"
                >
                  <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                    <XCircle className="h-10 w-10 text-red-500" />
                  </div>
                </motion.div>
                <CardTitle className="text-2xl font-bold text-destructive">
                  Erro ao aceitar convite
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  {error}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <Button
                  onClick={() => navigate("/")}
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                >
                  Voltar ao início
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    );
  }

  // Requires Signup State
  if (requiresSignup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
        {/* Animated Background Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-green-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-3xl"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/50 to-emerald-500/50 rounded-3xl blur opacity-25"></div>

            <Card className="relative border-2 border-border/50 bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-green-500 to-emerald-500" />

              <CardHeader className="pt-8 pb-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="mx-auto mb-4"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                    <div className="relative w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-10 w-10 text-green-500" />
                    </div>
                  </div>
                </motion.div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                  Convite aceito!
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  Você aceitou o convite para:{" "}
                  <strong className="text-foreground">{eventData?.title}</strong>
                </CardDescription>

                <Badge className="mt-4 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-600 dark:text-green-400">
                  <UserPlus className="w-4 h-4 mr-2 inline" />
                  Cadastro Necessário
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4 pb-8">
                <p className="text-sm text-muted-foreground text-center">
                  Faça seu cadastro com o mesmo e-mail que recebeu o convite para acessar o evento.
                </p>
                <Button
                  onClick={() => navigate("/app")}
                  className="w-full h-14 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg group"
                >
                  Fazer cadastro
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success State
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Animated Background Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/50 to-cyan-500/50 rounded-3xl blur opacity-25"></div>

          <Card className="relative border-2 border-border/50 bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-cyan-500" />

            <CardHeader className="pt-8 pb-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="mx-auto mb-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                  <div className="relative w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-blue-500" />
                  </div>
                </div>
              </motion.div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Convite aceito com sucesso!
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Você foi adicionado ao evento:{" "}
                <strong className="text-foreground">{eventData?.title}</strong>
              </CardDescription>

              <Badge className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                Bem-vindo ao Evento!
              </Badge>
            </CardHeader>

            <CardContent className="space-y-3 pb-8">
              <Button
                onClick={() => navigate(`/events/${eventData?.id}`)}
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg group"
              >
                Ver detalhes do evento
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => navigate("/app")}
                variant="outline"
                className="w-full h-12 border-2"
              >
                Ir para Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
