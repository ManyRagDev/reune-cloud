import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import reUneLogo from '@/assets/reune-logo.png';

interface LoginProps {
  onLogin: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  const devCredentials = {
    email: 'dev@reune.com',
    password: 'dev123456'
  };

  useEffect(() => {
    if (isDevMode) {
      setEmail(devCredentials.email);
      setPassword(devCredentials.password);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDevMode]);

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
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta!",
        });
        
        onLogin();
      } else {
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar a conta.",
        });
      }
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro na autenticação",
        description: err?.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDevModeLogin = () => {
    // Primeiro ativa o modo dev
    const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
    if (isDevMode) {
      localStorage.setItem('devModeActive', 'true');
    }
    
    toast({
      title: "Modo DEV ativado!",
      description: "Entrando como desenvolvedor",
    });
    
    // Força a navegação
    setTimeout(() => {
      onLogin();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-turquoise-light/30 to-mint-light/30 flex items-center justify-center p-6">
      {isDevMode && (
        <div className="fixed top-4 right-4 bg-yellow-500/90 text-yellow-900 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          MODO DESENVOLVIMENTO
        </div>
      )}
      <Card className="w-full max-w-md animate-scale-in shadow-floating border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <img src={reUneLogo} alt="ReUNE Logo" className="h-20 w-auto" />
          </div>
          <CardTitle className="text-4xl font-bold text-primary mb-2 tracking-tight">ReUNE</CardTitle>
          <CardDescription className="text-lg font-medium">
            {isLogin ? 'Faça login na sua conta' : 'Crie sua conta'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm transition-all focus:bg-background focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm transition-all focus:bg-background focus:border-primary"
            />
          </div>
          <Button 
            type="submit"
            className="w-full h-12 text-base font-semibold" 
            onClick={handleSubmit}
            disabled={!email || !password || loading}
            variant="floating"
          >
            {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </Button>
          
          {isDevMode && (
            <Button 
              type="button"
              className="w-full h-12 text-base font-semibold" 
              onClick={handleDevModeLogin}
              disabled={loading}
              variant="secondary"
            >
              🚀 Entrar como DEV (Bypass Auth)
            </Button>
          )}
          
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;