/**
 * AccountDialog V2 - Estilo divertido e colorido
 * Inspirado na LandingV3 com cards tortos e elementos jogados
 */

import { useState } from 'react';
import { User, MapPin, Shield, X, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileForm } from './profile/ProfileForm';
import { AddressList } from './profile/AddressList';
import { motion } from 'framer-motion';

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
  userEmail: string;
}

// Cores divertidas para as abas
const tabColors = {
  profile: { bg: '#FFD93D', icon: User },
  addresses: { bg: '#A8D8FF', icon: MapPin },
  security: { bg: '#B8F3D0', icon: Shield },
};

export function AccountDialog({ open, onOpenChange, userName, userEmail }: AccountDialogProps) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_#000000] rounded-2xl">
        {/* Header divertido */}
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar/Icon colorido */}
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                className="w-14 h-14 rounded-xl border-[3px] border-black bg-[#FFD93D] shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center transform -rotate-3"
              >
                <User className="w-7 h-7 text-black" />
              </motion.div>
              
              <div>
                <DialogTitle className="text-2xl font-black text-black">
                  Minha Conta
                </DialogTitle>
                <p className="text-sm text-gray-600 font-medium">{userEmail}</p>
              </div>
            </div>
            
            {/* Sticker decorativo */}
            <motion.div
              initial={{ rotate: 12, scale: 0 }}
              animate={{ rotate: 12, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="hidden sm:flex px-3 py-1.5 rounded-lg border-[2px] border-black bg-[#FF69B4] text-white font-bold text-xs shadow-[2px_2px_0px_0px_#000000] transform rotate-12"
            >
              <Sparkles className="w-3 h-3 mr-1 inline" />
              VOCÊ!
            </motion.div>
          </div>
        </DialogHeader>

        {/* Tabs coloridos e divertidos */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-6">
          <TabsList className="grid w-full grid-cols-3 gap-2 bg-transparent p-0 h-auto mt-4">
            {[
              { value: 'profile', label: 'Perfil', color: '#FFD93D', icon: User },
              { value: 'addresses', label: 'Endereços', color: '#A8D8FF', icon: MapPin },
              { value: 'security', label: 'Segurança', color: '#B8F3D0', icon: Shield },
            ].map((tab, index) => {
              const isActive = activeTab === tab.value;
              const Icon = tab.icon;
              const rotation = index === 0 ? -1 : index === 2 ? 1 : 0;
              
              return (
                <motion.button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-xl border-[3px] border-black font-bold text-sm
                    shadow-[4px_4px_0px_0px_#000000] transition-all duration-150
                    ${isActive 
                      ? 'translate-x-[3px] translate-y-[3px] shadow-[1px_1px_0px_0px_#000000]' 
                      : 'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000]'
                    }
                  `}
                  style={{ 
                    backgroundColor: isActive ? tab.color : 'white',
                    transform: `rotate(${rotation}deg)`
                  }}
                >
                  <div 
                    className={`
                      w-10 h-10 rounded-lg border-[2px] border-black flex items-center justify-center
                      ${isActive ? 'bg-white' : 'bg-gray-100'}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="hidden sm:inline">{tab.label}</span>
                </motion.button>
              );
            })}
          </TabsList>

          {/* Conteúdo: Perfil */}
          <TabsContent value="profile" className="mt-6 pb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border-[3px] border-black bg-[#FFFDF7] shadow-[4px_4px_0px_0px_#000000] p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg border-[2px] border-black bg-[#FFD93D] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-black text-lg">Seus Dados</h3>
              </div>
              <ProfileForm />
            </motion.div>
          </TabsContent>

          {/* Conteúdo: Endereços */}
          <TabsContent value="addresses" className="mt-6 pb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border-[3px] border-black bg-[#F0F9FF] shadow-[4px_4px_0px_0px_#000000] p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg border-[2px] border-black bg-[#A8D8FF] flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="font-black text-lg">Seus Endereços</h3>
              </div>
              <AddressList />
            </motion.div>
          </TabsContent>

          {/* Conteúdo: Segurança */}
          <TabsContent value="security" className="mt-6 pb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border-[3px] border-black bg-[#F0FDF4] shadow-[4px_4px_0px_0px_#000000] p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg border-[2px] border-black bg-[#B8F3D0] flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="font-black text-lg">Segurança</h3>
              </div>
              <div className="bg-white rounded-xl border-[2px] border-black p-4 shadow-[2px_2px_0px_0px_#000000]">
                <p className="text-sm text-gray-600 font-medium">
                  As configurações de segurança, incluindo alteração de senha, estão disponíveis na aba "Perfil".
                </p>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Elementos decorativos */}
        <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-[#FF69B4] border-[3px] border-black" />
        <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-[#FFD93D] border-[3px] border-black" />
      </DialogContent>
    </Dialog>
  );
}

export default AccountDialog;
