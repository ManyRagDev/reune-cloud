import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface LoginProps {
  onLogin: (email: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-turquoise-light/30 to-mint-light/30 flex items-center justify-center p-6">
      <Card className="w-full max-w-md animate-scale-in shadow-floating border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
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
            className="w-full h-12 text-base font-semibold" 
            onClick={handleSubmit}
            disabled={!email || !password}
            variant="floating"
          >
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </Button>
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