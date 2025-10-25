import { useState } from 'react';
import { User, MapPin, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
  userEmail: string;
}

export function AccountDialog({ open, onOpenChange, userName, userEmail }: AccountDialogProps) {
  const [activeTab, setActiveTab] = useState('profile');

  // Obtém iniciais do email
  const getInitials = () => {
    if (userName) {
      const names = userName.split(' ');
      return names.length > 1 
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : userName.substring(0, 2).toUpperCase();
    }
    return userEmail.substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Minha Conta</DialogTitle>
        </DialogHeader>

        {/* Header com informações do usuário */}
        <div className="flex items-center gap-4 py-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {userName || 'Usuário'}
            </h3>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Abas de navegação */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Endereços</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
          </TabsList>

          {/* Conteúdo: Perfil */}
          <TabsContent value="profile" className="mt-6 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome</label>
                    <p className="mt-1 text-foreground">{userName || 'Não informado'}</p>
                  </div>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                    <p className="mt-1 text-foreground">{userEmail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground text-center py-4">
              Em breve você poderá editar suas informações pessoais.
            </p>
          </TabsContent>

          {/* Conteúdo: Endereços */}
          <TabsContent value="addresses" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
                  <h4 className="font-medium text-foreground mb-2">Nenhum endereço cadastrado</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Em breve você poderá gerenciar seus endereços favoritos.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conteúdo: Segurança */}
          <TabsContent value="security" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Senha</label>
                    <p className="mt-1 text-foreground">••••••••</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Em breve você poderá alterar sua senha e configurar opções de segurança.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rodapé com botão de fechar */}
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
