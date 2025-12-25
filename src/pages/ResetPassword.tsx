import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock } from "lucide-react";
import { motion } from "framer-motion";

const ResetPassword = () => {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const hash = window.location.hash.replace(/^#/, "");
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          // Remove tokens from the URL
          window.history.replaceState(null, "", window.location.pathname);
        }

        const { data } = await supabase.auth.getSession();
        setHasSession(!!data.session);
      } catch (error) {
        setHasSession(false);
      } finally {
        setReady(true);
      }
    };

    void init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) return;
    if (password !== confirmPassword) {
      toast({
        title: "Senhas nao conferem",
        description: "Digite a mesma senha nos dois campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({
        title: "Senha atualizada",
        description: "Voce ja pode entrar com sua nova senha.",
      });

      window.location.href = "/app";
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro ao atualizar senha",
        description: err?.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = "/")}
            className="gap-2 hover:bg-background/80 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/50 to-cyan-500/50 rounded-3xl blur opacity-25"></div>
          <Card className="relative border-2 border-border/50 bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-orange-500 to-cyan-500" />
            <CardHeader className="text-center pt-8 pb-6 px-8">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                Redefinir senha
              </CardTitle>
              <CardDescription className="text-base">
                Defina uma nova senha para sua conta
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-8 pb-8">
              {!ready ? (
                <div className="text-center text-sm text-muted-foreground">
                  Verificando link...
                </div>
              ) : !hasSession ? (
                <div className="text-center text-sm text-muted-foreground">
                  Link invalido ou expirado. Solicite um novo.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Nova senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm transition-all focus:bg-background focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/20 pl-4"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Confirmar senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm transition-all focus:bg-background focus:border-cyan-500 focus:shadow-lg focus:shadow-cyan-500/20 pl-4"
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 text-base font-semibold bg-gradient-to-r from-orange-500 to-cyan-500 hover:from-orange-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all"
                    disabled={!password || !confirmPassword || loading}
                  >
                    {loading ? "Aguarde..." : "Atualizar senha"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
