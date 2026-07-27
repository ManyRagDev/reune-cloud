/**
 * Dashboard V3 - Feed de Eventos com estilo divertido e colorido
 * Inspirado na LandingV3 - cards tortos, cores vibrantes, vibe descontraída
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus, Calendar, Clock, MapPin, Users, LogOut, Trash2, CheckCircle, UserCheck, Sparkles, Flame, Pizza, PartyPopper, Briefcase, Cake, ArrowRight, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { FriendsDialog } from '@/components/friends/FriendsDialog';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { AccountDialog } from '@/components/AccountDialog';
import { ProfilePromptDialog } from '@/components/ProfilePromptDialog';
import { BugReportButton } from '@/components/BugReportButton';
import { motion } from 'framer-motion';
import { FounderBadge } from '@/components/FounderBadge';
import { BrutalistButton } from '@/components/v2/BrutalistButton';

interface Event {
  id: number;
  title: string;
  event_date: string;
  event_time: string;
  location: string | null;
  description: string | null;
  user_id: string | null;
  is_public: boolean | null;
  status: string | null;
  created_at: string;
  isOwner: boolean;
  isConfirmed: boolean;
}

interface DashboardProps {
  userEmail: string;
  onCreateEvent: () => void;
  onViewEvent: (eventId: string) => void;
  onLogout: () => void;
}

// Cores divertidas para os cards (estilo LandingV3)
const cardColors = [
  { bg: '#FFD93D', accent: '#FF6B35' },      // Amarelo/Laranja
  { bg: '#A8D8FF', accent: '#0066CC' },      // Azul claro
  { bg: '#FF69B4', accent: '#C71585' },      // Rosa
  { bg: '#B8F3D0', accent: '#22CC88' },      // Verde menta
  { bg: '#D4BBFF', accent: '#8B5CF6' },      // Lavanda
  { bg: '#FFC107', accent: '#FF8F00' },      // Âmbar
];

// Rotações leves para cada card (efeito "jogado")
const rotations = [-2, 1.5, -1, 2, -1.5, 1];

const Dashboard = ({ userEmail, onCreateEvent, onViewEvent, onLogout }: DashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [profilePromptOpen, setProfilePromptOpen] = useState(false);
  const [founderData, setFounderData] = useState<{
    is_founder: boolean;
    founder_since?: string;
    premium_until?: string;
    storage_multiplier?: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'owner' | 'confirmed' | 'pending'>('all');
  const userId = user?.id;

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({ title: "Logout realizado com sucesso!", description: "Até logo!" });
      onLogout();
    } catch (error) {
      const err = error as { message?: string };
      toast({ title: "Erro no logout", description: err?.message || "Ocorreu um erro. Tente novamente.", variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (eventId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja deletar este evento? Esta ação não pode ser desfeita.')) return;
    try {
      const { error } = await supabase.from('table_reune').delete().eq('id', eventId);
      if (error) throw error;
      toast({ title: "Evento deletado!", description: "O evento foi removido com sucesso." });
      fetchEvents();
    } catch (error) {
      const err = error as { message?: string };
      toast({ title: "Erro ao deletar evento", description: err?.message || "Não foi possível deletar o evento.", variant: "destructive" });
    }
  };

  const fetchFounderData = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase.from('profiles').select('is_founder, founder_since, premium_until, storage_multiplier').eq('id', userId).single();
      if (error) { console.error('Erro ao buscar dados de founder:', error); return; }
      if (data?.is_founder) setFounderData(data);
    } catch (error) { console.error('Erro ao buscar dados de founder:', error); }
  }, [userId]);

  const fetchEvents = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const { data: ownEvents, error: ownError } = await supabase.from('table_reune').select('*').eq('user_id', userId);
      if (ownError) throw ownError;

      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications').select('event_id, metadata').eq('user_id', userId).in('type', ['event_invite', 'organizer_invite']);
      if (notificationsError) throw notificationsError;

      let invitedEvents: any[] = [];
      if (notifications && notifications.length > 0) {
        const invitedEventIds = [...new Set(notifications.map(n => n.event_id).filter(Boolean))];
        if (invitedEventIds.length > 0) {
          const invitedDetails = await Promise.all(
            invitedEventIds.map(async (eventId) => {
              const { data, error } = await supabase.rpc('get_event_details_safe', { _event_id: eventId });
              if (error) { console.error('Erro ao buscar detalhes do evento convidado:', error); return null; }
              const row = Array.isArray(data) ? data[0] : data;
              return row || null;
            })
          );
          invitedEvents = invitedDetails.filter(Boolean);
        }
      }

      const allEvents = [...(ownEvents || [])];
      invitedEvents.forEach(event => { if (!allEvents.find(e => e.id === event.id)) allEvents.push(event); });
      allEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

      const { data: confirmationsData, error: confirmationsError } = await supabase
        .from('event_confirmations').select('event_id, presence_confirmed').eq('user_id', userId);
      if (confirmationsError) throw confirmationsError;

      const confirmationsMap = new Map(confirmationsData?.map(c => [c.event_id, c.presence_confirmed]) || []);
      const eventsWithStatus = allEvents.map(event => ({ ...event, isOwner: event.user_id === userId, isConfirmed: confirmationsMap.get(event.id) === true }));
      setEvents(eventsWithStatus);
    } catch (error) {
      const err = error as { message?: string };
      toast({ title: "Erro ao carregar eventos", description: err?.message || "Não foi possível carregar os eventos.", variant: "destructive" });
    } finally { setLoading(false); }
  }, [userId, toast, user?.email]);

  useEffect(() => { fetchEvents(); fetchFounderData(); }, [fetchEvents, fetchFounderData]);

  useEffect(() => {
    const checkProfilePrompt = async () => {
      if (!userId) return;
      try {
        const { data: profile, error } = await supabase.from('profiles').select('hide_profile_prompt').eq('id', userId).single();
        if (error) throw error;
        if (!profile?.hide_profile_prompt) { setTimeout(() => setProfilePromptOpen(true), 1000); }
      } catch (error) { console.error('Erro ao verificar preferência de perfil:', error); }
    };
    checkProfilePrompt();
  }, [userId]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return { day: '--', month: '---' };
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
    };
  };

  const getEventStatus = (event: Event) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(event.event_date);
    eventDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { label: 'É HOJE!', color: 'bg-red-500', textColor: 'text-white' };
    if (diffDays === 1) return { label: 'AMANHÃ!', color: 'bg-green-500', textColor: 'text-white' };
    if (diffDays > 1 && diffDays <= 7) return { label: `${diffDays} DIAS`, color: 'bg-blue-500', textColor: 'text-white' };
    return { label: 'EM BREVE', color: 'bg-gray-200', textColor: 'text-gray-700' };
  };

  const getEventIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('churrasc')) return <Flame className="w-6 h-6" />;
    if (lower.includes('pizza')) return <Pizza className="w-6 h-6" />;
    if (lower.includes('festa')) return <PartyPopper className="w-6 h-6" />;
    if (lower.includes('anivers')) return <Cake className="w-6 h-6" />;
    if (lower.includes('reuni') || lower.includes('trabalho')) return <Briefcase className="w-6 h-6" />;
    return <Sparkles className="w-6 h-6" />;
  };

  const filterEvents = (tab: typeof activeTab) => {
    switch (tab) {
      case 'owner': return events.filter(e => e.isOwner);
      case 'confirmed': return events.filter(e => !e.isOwner && e.isConfirmed);
      case 'pending': return events.filter(e => !e.isOwner && !e.isConfirmed);
      default: return events;
    }
  };

  const tabCounts = {
    all: events.length,
    owner: events.filter(e => e.isOwner).length,
    confirmed: events.filter(e => !e.isOwner && e.isConfirmed).length,
    pending: events.filter(e => !e.isOwner && !e.isConfirmed).length,
  };

  const filteredEvents = filterEvents(activeTab);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-2xl border-[3px] border-black shadow-[6px_6px_0px_0px_#000000] mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: '#FFD93D' }}
          >
            <Sparkles className="w-12 h-12 text-black" />
          </motion.div>
          <p className="font-black text-2xl">Carregando seus rolês...</p>
          <p className="text-gray-500 mt-2">Só um instante! 🎉</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header divertido */}
      <nav className="sticky top-0 z-50 px-4 md:px-8 py-4 border-b-[3px] border-black bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="relative"
            whileHover={{ rotate: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 py-2.5 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] font-black text-2xl bg-[#FF6B35] text-white transform -rotate-1">
              ReUNE
            </div>
            {/* Sticker decorativo */}
            <div className="absolute -top-2 -right-3 w-6 h-6 bg-[#FFD93D] rounded-full border-[2px] border-black" />
          </motion.div>

          {/* Ações */}
          <div className="flex items-center gap-3">
            <FriendsDialog />
            <NotificationBell />
            <button 
              onClick={() => setAccountDialogOpen(true)}
              className="w-11 h-11 rounded-xl border-[3px] border-black bg-[#A8D8FF] shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#000000] transition-all flex items-center justify-center font-bold text-lg"
            >
              {userEmail?.charAt(0).toUpperCase() || 'U'}
            </button>
            {founderData?.is_founder && (
              <div className="absolute top-3 right-3 w-3 h-3 bg-[#FF69B4] rounded-full border-[2px] border-black" />
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 md:px-8 py-8 md:py-12 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-[3px] border-black bg-[#FFD93D] shadow-[3px_3px_0px_0px_#000000] font-bold text-sm mb-4"
            >
              <Zap className="w-4 h-4" />
              {events.length === 0 ? 'Bora começar?' : `${events.length} rolê${events.length !== 1 ? 's' : ''} pra curtir`}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black leading-tight"
            >
              O que tá{' '}
              <span className="text-[#FF6B35]">rolando?</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 mt-2 font-medium"
            >
              Seus eventos organizados num só lugar. Simples assim.
            </motion.p>
          </div>

          {/* Sticker card */}
          <motion.div
            initial={{ opacity: 0, rotate: 6, scale: 0.9 }}
            animate={{ opacity: 1, rotate: 2, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="hidden md:block relative"
          >
            <div className="px-6 py-4 rounded-2xl border-[3px] border-black bg-[#B8F3D0] shadow-[5px_5px_0px_0px_#000000] transform rotate-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl border-[3px] border-black bg-white flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#FF6B35]" />
                </div>
                <div>
                  <p className="font-black text-lg">Crie em segundos</p>
                  <p className="text-sm text-gray-600">Sem complicação! 🎉</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs coloridos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3 mt-8 overflow-x-auto pb-2 scrollbar-hide"
        >
          {[
            { key: 'all', label: 'TODOS', count: tabCounts.all, color: '#FFD93D' },
            { key: 'owner', label: 'MEUS', count: tabCounts.owner, color: '#A8D8FF' },
            { key: 'confirmed', label: 'VOU!', count: tabCounts.confirmed, color: '#B8F3D0' },
            { key: 'pending', label: 'PENDENTES', count: tabCounts.pending, color: '#FF69B4' },
          ].map((tab, index) => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`
                px-5 py-3 rounded-xl border-[3px] border-black font-black text-sm whitespace-nowrap
                shadow-[4px_4px_0px_0px_#000000] transition-all duration-150
                ${activeTab === tab.key 
                  ? 'translate-x-[3px] translate-y-[3px] shadow-[1px_1px_0px_0px_#000000]' 
                  : 'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000]'
                }
              `}
              style={{ 
                backgroundColor: activeTab === tab.key ? tab.color : 'white',
                transform: `rotate(${index % 2 === 0 ? -1 : 1}deg)`
              }}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 rounded-full bg-black/10 text-xs">
                {tab.count}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </section>

      {/* Events Grid - Cards tortos e coloridos */}
      <section className="px-4 md:px-8 pb-32 max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredEvents.length === 0 ? (
            <div className="col-span-full py-16">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md mx-auto text-center"
              >
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 rounded-3xl border-[3px] border-black bg-[#FFD93D] shadow-[6px_6px_0px_0px_#000000] flex items-center justify-center transform -rotate-3">
                    <Calendar className="w-16 h-16 text-black" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-[#FF69B4] border-[3px] border-black" />
                </div>
                <h3 className="text-3xl font-black mb-3">NADA AQUI AINDA</h3>
                <p className="text-gray-600 mb-6 font-medium">
                  {activeTab === 'all' 
                    ? 'Bora criar o primeiro rolê? É rapidinho!' 
                    : 'Nenhum evento nessa categoria ainda.'}
                </p>
                {activeTab === 'all' && (
                  <BrutalistButton 
                    onClick={onCreateEvent} 
                    leftIcon={<Plus className="w-5 h-5" />}
                    className="transform rotate-1"
                  >
                    CRIAR ROLÊ
                  </BrutalistButton>
                )}
              </motion.div>
            </div>
          ) : (
            filteredEvents.map((event, index) => {
              const date = formatDate(event.event_date);
              const status = getEventStatus(event);
              const colors = cardColors[index % cardColors.length];
              const rotation = rotations[index % rotations.length];
              
              return (
                <motion.article
                  key={event.id}
                  initial={{ opacity: 0, y: 30, rotate: rotation * 2 }}
                  animate={{ opacity: 1, y: 0, rotate: rotation }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  whileHover={{ rotate: 0, y: -8, scale: 1.02 }}
                  className="group cursor-pointer"
                  onClick={() => onViewEvent(event.id.toString())}
                >
                  {/* Card Container */}
                  <div 
                    className="relative rounded-2xl border-[3px] border-black p-5 shadow-[6px_6px_0px_0px_#000000] transition-all duration-200"
                    style={{ backgroundColor: colors.bg }}
                  >
                    {/* Status Badge */}
                    <div className="absolute -top-3 -right-3">
                      <div className={`px-3 py-1.5 rounded-full border-[3px] border-black font-black text-xs shadow-[2px_2px_0px_0px_#000000] ${status.textColor} ${status.color}`}>
                        {status.label}
                      </div>
                    </div>

                    {/* Header: Date & Icon */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_#000000] flex flex-col items-center justify-center">
                          <span className="font-black text-lg leading-none">{date.day}</span>
                          <span className="font-bold text-xs uppercase">{date.month}</span>
                        </div>
                        <div 
                          className="w-12 h-12 rounded-xl border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center"
                          style={{ color: colors.accent }}
                        >
                          {getEventIcon(event.title)}
                        </div>
                      </div>
                      
                      {event.isOwner && (
                        <button
                          onClick={(e) => handleDeleteEvent(event.id, e)}
                          className="p-2 rounded-lg border-[2px] border-black bg-white/80 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-black mb-3 leading-tight text-black">
                      {event.title}
                    </h3>

                    {/* Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 opacity-60" />
                        <span className="font-medium">{event.event_time || 'Horário a definir'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 opacity-60" />
                        <span className="font-medium truncate">{event.location || 'Local a definir'}</span>
                      </div>
                    </div>

                    {/* Footer: Role badge */}
                    <div className="flex items-center justify-between pt-3 border-t-2 border-black/10">
                      <div className="flex items-center gap-2">
                        {event.isOwner ? (
                          <span className="px-3 py-1 rounded-lg border-[2px] border-black bg-[#FF69B4] text-white font-bold text-xs shadow-[2px_2px_0px_0px_#000000]">
                            👑 ADM
                          </span>
                        ) : event.isConfirmed ? (
                          <span className="px-3 py-1 rounded-lg border-[2px] border-black bg-[#B8F3D0] text-black font-bold text-xs shadow-[2px_2px_0px_0px_#000000]">
                            ✅ VOU!
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-lg border-[2px] border-black bg-gray-200 text-black font-bold text-xs shadow-[2px_2px_0px_0px_#000000]">
                            ⏳ PENDENTE
                          </span>
                        )}
                      </div>
                      
                      <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </motion.article>
              );
            })
          )}
        </motion.div>

        {/* Fim da lista - Elemento decorativo */}
        {filteredEvents.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="py-12 flex flex-col items-center justify-center"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-[3px] bg-black/20" />
              <div className="w-12 h-12 rounded-full border-[3px] border-black bg-[#FFD93D] flex items-center justify-center transform rotate-12">
                <span className="text-xl">🎉</span>
              </div>
              <div className="w-16 h-[3px] bg-black/20" />
            </div>
            <p className="font-bold text-gray-400 mt-3">FIM DA BAGUNÇA</p>
          </motion.div>
        )}
      </section>

      {/* FAB - Sticker style */}
      <motion.div 
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.5, type: "spring" }}
      >
        <motion.button 
          onClick={onCreateEvent}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-16 h-16 rounded-2xl border-[3px] border-black bg-[#FF6B35] shadow-[5px_5px_0px_0px_#000000] flex items-center justify-center group"
        >
          <Plus className="w-8 h-8 text-white group-hover:rotate-90 transition-transform duration-300" />
          
          {/* Sticker decorativo */}
          <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-[#FFD93D] border-[2px] border-black" />
        </motion.button>
        
        {/* Tooltip */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="absolute right-20 top-4 px-4 py-2 rounded-xl border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_#000000] whitespace-nowrap font-bold text-sm transform -rotate-2"
        >
          Novo Rolê! 🎉
        </motion.div>
      </motion.div>

      {/* Dialogs */}
      <AccountDialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen} userEmail={userEmail} />
      <ProfilePromptDialog open={profilePromptOpen} onOpenChange={setProfilePromptOpen} onNavigateToProfile={() => setAccountDialogOpen(true)} />
      <BugReportButton />
    </div>
  );
};

export default Dashboard;
