/**
 * NotificationBell V2 - Estilo divertido e colorido
 */

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata: any;
}

// Cores por tipo de notificação
const notificationColors: Record<string, { bg: string; icon: string }> = {
  friend_request: { bg: '#A8D8FF', icon: '👋' },
  event_invite: { bg: '#FFD93D', icon: '🎉' },
  organizer_invite: { bg: '#FF69B4', icon: '👑' },
  event_update: { bg: '#B8F3D0', icon: '📝' },
  default: { bg: '#E5E7EB', icon: '🔔' },
};

export function NotificationBell() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.read).length || 0);
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    setOpen(false);

    switch (notification.type) {
      case 'friend_request':
        toast({ title: "Ver solicitações de amizade", description: "Abra o diálogo de amigos para ver." });
        break;
      case 'event_invite':
      case 'organizer_invite':
        if (notification.metadata?.event_id) {
          navigate(`/app?event=${notification.metadata.event_id}`);
        }
        break;
      default:
        break;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05, rotate: -5 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-11 h-11 rounded-xl border-[3px] border-black bg-[#FFD93D] shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#000000] transition-all"
        >
          <Bell className="w-5 h-5 text-black" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#FF69B4] border-[2px] border-black text-white text-xs font-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0 bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000000] rounded-2xl overflow-visible"
      >
        {/* Header colorido */}
        <div className="p-4 bg-gradient-to-r from-[#FFD93D] to-[#A8D8FF] border-b-[3px] border-black rounded-t-xl">
          <div className="flex items-center justify-between">
            <DropdownMenuLabel className="font-black text-lg text-black p-0">
              Notificações
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <span className="px-2 py-1 rounded-full bg-[#FF69B4] text-white text-xs font-black border-[2px] border-black shadow-[2px_2px_0px_0px_#000000]">
                {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Lista de notificações */}
        <div className="max-h-[300px] overflow-y-auto py-2">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-xl border-[3px] border-black bg-[#F8F9FA] shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center mx-auto mb-3 transform -rotate-3">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map((notification, index) => {
              const colors = notificationColors[notification.type] || notificationColors.default;
              const rotation = index % 2 === 0 ? -0.5 : 0.5;
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <DropdownMenuItem
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      px-4 py-3 cursor-pointer focus:bg-gray-50 mx-2 rounded-xl border-[2px] mb-2
                      ${notification.read ? 'border-transparent' : 'border-black bg-[#FFFDF7] shadow-[2px_2px_0px_0px_#000000]'}
                    `}
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    <div className="flex items-start gap-3 w-full">
                      {/* Icon colorido */}
                      <div 
                        className="w-10 h-10 rounded-lg border-[2px] border-black flex items-center justify-center text-lg flex-shrink-0 shadow-[2px_2px_0px_0px_#000000]"
                        style={{ backgroundColor: colors.bg }}
                      >
                        {colors.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-black truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 font-medium">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>

                      {!notification.read && (
                        <div className="w-3 h-3 rounded-full bg-[#FF6B35] border-[2px] border-black flex-shrink-0" />
                      )}
                    </div>
                  </DropdownMenuItem>
                </motion.div>
              );
            })
          )}
        </div>

        <DropdownMenuSeparator className="bg-black/10" />

        {/* Footer */}
        <div className="p-3">
          <button
            onClick={() => setOpen(false)}
            className="w-full py-2 text-sm font-bold text-gray-600 hover:text-black transition-colors"
          >
            Fechar
          </button>
        </div>

        {/* Elementos decorativos */}
        <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-[#FF69B4] border-[2px] border-black" />
        <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-[#FFD93D] border-[2px] border-black" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;
