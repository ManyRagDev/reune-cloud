import { useState } from 'react';
import { User, MapPin, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ProfileForm } from './profile/ProfileForm';
import { AddressList } from './profile/AddressList';

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
  userEmail: string;
}

export function AccountDialog({ open, onOpenChange, userName, userEmail }: AccountDialogProps) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Minha Conta</DialogTitle>
        </DialogHeader>

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
          <TabsContent value="profile" className="mt-6">
            <ProfileForm />
          </TabsContent>

          {/* Conteúdo: Endereços */}
          <TabsContent value="addresses" className="mt-6">
            <AddressList />
          </TabsContent>

          {/* Conteúdo: Segurança */}
          <TabsContent value="security" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  As configurações de segurança, incluindo alteração de senha, estão disponíveis na aba "Perfil".
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
