import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Mail, Lock, ArrowRight, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { NBLight, NBDark, NBPalette, nb } from "@/lib/neobrutalism";

interface LoginProps {
  onLogin: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /* ── Dark mode state ──────────────────────── */
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("reune-v3-theme");
      if (saved) return saved === "dark";
    }
    return false; // default: light
  });

  useEffect(() => {
    localStorage.setItem("reune-v3-theme", isDark ? "dark" : "light");
    // Optional: Update html class if using tailwind dark mode class strategy elsewhere
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const C: NBPalette = isDark ? NBDark : NBLight;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta ao ReUNE.",
          style: {
            border: "3px solid #1A1A1A",
            boxShadow: "4px 4px 0px #1A1A1A",
            backgroundColor: C.mint,
            color: C.black,
            borderRadius: "0px",
          }
        });

        onLogin();
      } else {
        const redirectUrl = `${window.location.origin}/`;

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) throw error;

        toast({
          title: "Conta criada!",
          description: "Checa seu email pra confirmar.",
          style: {
            border: "3px solid #1A1A1A",
            boxShadow: "4px 4px 0px #1A1A1A",
            backgroundColor: C.yellow,
            color: C.black,
            borderRadius: "0px",
          }
        });
      }
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Deu ruim",
        description: err?.message || "Tente novamente.",
        variant: "destructive",
        style: {
          border: "3px solid #1A1A1A",
          boxShadow: "4px 4px 0px #1A1A1A",
          backgroundColor: C.orange,
          color: "#FFFDF7",
          borderRadius: "0px",
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: "Qual seu email?",
        description: "Digita aí em cima pra gente enviar o link.",
        variant: "destructive",
        style: {
          border: "3px solid #1A1A1A",
          boxShadow: "4px 4px 0px #1A1A1A",
          backgroundColor: C.pink,
          color: "#FFFDF7",
          borderRadius: "0px",
        }
      });
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast({
        title: "Link enviado!",
        description: "Confira seu email pra redefinir a senha.",
        style: {
          border: "3px solid #1A1A1A",
          boxShadow: "4px 4px 0px #1A1A1A",
          backgroundColor: C.mint,
          color: C.black,
          borderRadius: "0px",
        }
      });
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro ao enviar",
        description: err?.message || "Tente novamente.",
        variant: "destructive",
        style: {
          border: "3px solid #1A1A1A",
          boxShadow: "4px 4px 0px #1A1A1A",
          backgroundColor: C.orange,
          color: "#FFFDF7",
          borderRadius: "0px",
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: C.bg }}
    >
      {/* Theme Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className={`absolute top-4 right-4 p-3 rounded-lg ${nb.border} ${nb.shadow} ${nb.hover} transition-colors z-50`}
        style={{ backgroundColor: isDark ? C.yellow : C.lavender, color: C.black }}
      >
        {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>

      {/* Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={`absolute top-[-100px] left-[-100px] w-[300px] h-[300px] rounded-full ${nb.border} opacity-20`}
          style={{ backgroundColor: C.yellow }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className={`absolute bottom-[-50px] right-[-50px] w-[200px] h-[200px] ${nb.border} opacity-20`}
          style={{ backgroundColor: C.pink }}
        />
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`w-full max-w-md relative z-10 p-8 rounded-xl ${nb.border} ${nb.shadowXl}`}
        style={{ backgroundColor: C.cardBg }}
      >
        {/* Back Button */}
        <button
          onClick={() => window.location.href = '/'}
          className={`mb-6 flex items-center gap-2 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity`}
          style={{ color: C.text }}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar pra home
        </button>

        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl ${nb.border} ${nb.shadow}`} style={{ backgroundColor: C.orange }}>
            <Sparkles className="w-8 h-8 text-[#FFFDF7]" />
          </div>
          <h1 className="text-3xl font-black mb-2" style={{ color: C.text }}>
            {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
          </h1>
          <p className="font-medium opacity-70" style={{ color: C.textMuted }}>
            {isLogin ? "Bora organizar uns eventos?" : "Comece grátis em segundos"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-bold flex items-center gap-2" style={{ color: C.text }}>
              <Mail className="w-4 h-4" /> Email
            </Label>
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-3 rounded-lg ${nb.input} font-medium`}
                style={{ backgroundColor: C.inputBg || C.bg, color: C.text, borderColor: C.black }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-bold flex items-center gap-2" style={{ color: C.text }}>
              <Lock className="w-4 h-4" /> Senha
            </Label>
            <div className="relative">
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-3 rounded-lg ${nb.input} font-medium`}
                style={{ backgroundColor: C.inputBg || C.bg, color: C.text, borderColor: C.black }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!email || !password || loading}
            className={`w-full py-4 rounded-xl text-lg flex items-center justify-center gap-2 ${nb.button} ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:translate-x-1 hover:translate-y-1 hover:shadow-none'}`}
            style={{ backgroundColor: C.mint, color: C.black }}
          >
            {loading ? (
              "Carregando..."
            ) : (
              <>
                {isLogin ? "Entrar" : "Criar Conta"} <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-4 text-center">
          {isLogin && (
            <button
              type="button"
              onClick={handlePasswordReset}
              className="text-sm font-bold hover:underline"
              style={{ color: C.textMuted }}
            >
              Esqueci minha senha
            </button>
          )}

          <div className={`h-1 w-full ${nb.border} border-x-0 border-b-0 opacity-20`} />

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-black hover:underline"
            style={{ color: C.orange }}
          >
            {isLogin ? "Não tem conta? Crie grátis" : "Já tem conta? Faça login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
