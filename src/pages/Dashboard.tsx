import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Clock, MapPin, Users, LogOut, Trash2, LayoutGrid, CheckCircle, UserCheck, Sparkles, Moon, Sun } from 'lucide-react';
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
import { NBLight, NBDark, NBPalette, nb } from '@/lib/neobrutalism';

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
  const userId = user?.id;

  /* ── Dark mode ──────────────────────── */
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("reune-v3-theme");
      if (saved) return saved === "dark";
    }
    return false;
  });
  useEffect(() => {
    localStorage.setItem("reune-v3-theme", isDark ? "dark" : "light");
  }, [isDark]);
  const C: NBPalette = isDark ? NBDark : NBLight;

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
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };

  /* ── Loading state ──────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.bg }}>
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className={`w-20 h-20 rounded-xl ${nb.border} mx-auto mb-6 flex items-center justify-center`}
            style={{ backgroundColor: C.orange }}
          >
            <Sparkles className="w-10 h-10" style={{ color: "#FFFDF7" }} />
          </motion.div>
          <p className="font-black text-xl" style={{ color: C.text }}>Carregando eventos...</p>
        </div>
      </div>
    );
  }

  /* ── Tab filter helper ──────────────────────── */
  const filterEvents = (tab: string) => {
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

  const renderEventGrid = (filteredEvents: Event[], emptyIcon: React.ReactNode, emptyTitle: string, emptyDesc: string, showCta = true) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
    >
      {filteredEvents.length === 0 ? (
        <div className="col-span-full text-center py-16">
          <div className="max-w-sm mx-auto">
            <div
              className={`w-24 h-24 rounded-2xl ${nb.border} ${nb.shadow} flex items-center justify-center mx-auto mb-6`}
              style={{ backgroundColor: C.yellow }}
            >
              {emptyIcon}
            </div>
            <h3 className="text-2xl font-black mb-2" style={{ color: C.text }}>{emptyTitle}</h3>
            <p className="font-medium mb-6" style={{ color: C.textMuted, opacity: 0.7 }}>{emptyDesc}</p>
            {showCta && (
              <button
                onClick={onCreateEvent}
                className={`px-6 py-3 rounded-xl ${nb.border} ${nb.shadow} ${nb.hover} font-black flex items-center gap-2 mx-auto`}
                style={{ backgroundColor: C.orange, color: "#FFFDF7" }}
              >
                <Plus className="w-5 h-5" /> Criar Primeiro Evento
              </button>
            )}
          </div>
        </div>
      ) : (
        filteredEvents.map((event, index) => (
          <EventCard
            key={event.id}
            event={event}
            index={index}
            onViewEvent={onViewEvent}
            onDeleteEvent={handleDeleteEvent}
            formatDate={formatDate}
            palette={C}
          />
        ))
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: C.bg, color: C.text }}>
      {/* ═══ NAVBAR — Solid Neubrutalist top bar ═══ */}
      <nav
        className={`sticky top-0 z-50 px-4 md:px-8 py-3 ${nb.border} border-t-0 border-x-0 flex items-center justify-between transition-colors duration-300`}
        style={{ backgroundColor: C.bg }}
      >
        {/* Left side — Logo + user info */}
        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-2 rounded-lg ${nb.border} ${nb.shadow} font-black text-xl transition-colors duration-300`}
            style={{ backgroundColor: C.orange, color: "#FFFDF7" }}
          >
            ReUNE
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold truncate max-w-[180px]" style={{ color: C.textMuted }}>{userEmail}</p>
              {founderData?.is_founder && (
                <FounderBadge variant="compact" founderSince={founderData.founder_since} premiumUntil={founderData.premium_until} storageMultiplier={founderData.storage_multiplier} />
              )}
            </div>
            <button onClick={() => setAccountDialogOpen(true)} className="text-xs font-bold underline" style={{ color: C.orange }}>
              Minha Conta →
            </button>
          </div>
        </div>

        {/* Right side — Actions */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-lg ${nb.border} ${nb.shadow} ${nb.hover} transition-colors duration-300`}
            style={{ backgroundColor: isDark ? C.yellow : C.lavender, color: C.black }}
            aria-label="Alternar tema"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={handleLogout}
            className={`p-2 rounded-lg ${nb.border} ${nb.shadow} ${nb.hover} transition-colors duration-300`}
            style={{ backgroundColor: C.sectionBg, color: C.text }}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Title section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end mb-8">
            <div>
              <div
                className={`inline-flex items-center px-4 py-2 rounded-lg ${nb.border} ${nb.shadow} text-sm font-bold mb-4`}
                style={{ backgroundColor: C.yellow, color: C.black }}
              >
                <Sparkles className="w-4 h-4 mr-2" /> Seus Eventos
              </div>
              <h2 className="text-4xl md:text-5xl font-black leading-tight">
                O que tá{" "}
                <span style={{ color: C.orange }}>rolando?</span>
              </h2>
              <p className="font-medium mt-2" style={{ color: C.textMuted, opacity: 0.7 }}>
                Seus eventos organizados num só lugar. Simples assim.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <FriendsDialog />
              <button
                onClick={onCreateEvent}
                className={`px-6 py-3 rounded-xl ${nb.border} ${nb.shadow} ${nb.hover} font-black flex items-center gap-2`}
                style={{ backgroundColor: C.orange, color: "#FFFDF7" }}
              >
                <Plus className="w-5 h-5" /> Novo Evento
              </button>
            </div>
          </div>

          {/* ═══ TABS — Sticker-style ═══ */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className={`inline-flex gap-2 p-2 rounded-xl ${nb.border} ${nb.shadow} mb-8 h-auto flex-wrap`} style={{ backgroundColor: C.sectionBg }}>
              {[
                { value: 'all', label: 'Todos', icon: LayoutGrid, count: tabCounts.all, bg: C.yellow },
                { value: 'owner', label: 'Criados', icon: Users, count: tabCounts.owner, bg: C.sky },
                { value: 'confirmed', label: 'Confirmados', icon: CheckCircle, count: tabCounts.confirmed, bg: C.mint },
                { value: 'pending', label: 'Pendentes', icon: UserCheck, count: tabCounts.pending, bg: C.pink },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`rounded-lg px-4 py-2 font-black text-sm data-[state=active]:shadow-[3px_3px_0px_#1A1A1A] data-[state=active]:border-[2px] data-[state=active]:border-[#1A1A1A] transition-all`}
                  style={{ color: C.black }}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label} ({tab.count})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {renderEventGrid(filterEvents('all'), <Calendar className="w-12 h-12" style={{ color: C.black }} />, "Nenhum evento ainda", "Bora criar o primeiro? É rapidinho! ⚡")}
            </TabsContent>
            <TabsContent value="owner" className="mt-0">
              {renderEventGrid(filterEvents('owner'), <Users className="w-12 h-12" style={{ color: C.black }} />, "Nenhum evento criado", "Crie eventos e chame a galera! 🎉")}
            </TabsContent>
            <TabsContent value="confirmed" className="mt-0">
              {renderEventGrid(filterEvents('confirmed'), <CheckCircle className="w-12 h-12" style={{ color: C.black }} />, "Nenhum evento confirmado", "Confirme presença nos eventos pendentes!", false)}
            </TabsContent>
            <TabsContent value="pending" className="mt-0">
              {renderEventGrid(filterEvents('pending'), <UserCheck className="w-12 h-12" style={{ color: C.black }} />, "Nenhum evento pendente", "Você tá em dia! Tudo confirmado 👏", false)}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Dialogs */}
      <AccountDialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen} userEmail={userEmail} />
      <ProfilePromptDialog open={profilePromptOpen} onOpenChange={setProfilePromptOpen} onNavigateToProfile={() => setAccountDialogOpen(true)} />
      <BugReportButton />
    </div>
  );
};

/* ═══════════════════════════════════════════
   EVENT CARD — Post-it style with Neubrutalism
   ═══════════════════════════════════════════ */
interface EventCardProps {
  event: Event;
  index: number;
  onViewEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: number, e: React.MouseEvent) => Promise<void>;
  formatDate: (dateStr: string) => string;
  palette: NBPalette;
}

const EventCard = ({ event, index, onViewEvent, onDeleteEvent, formatDate, palette: C }: EventCardProps) => {
  // Rotating colors for each card
  const cardColors = [C.yellow, C.sky, C.pink, C.mint, C.lavender, C.orange];
  const cardBg = cardColors[index % cardColors.length];

  // Micro-rotations for post-it feel
  const rotations = [-1.5, 1, -0.8, 1.2, -0.5, 0.8];
  const rotation = rotations[index % rotations.length];

  // Emoji stickers for event type
  const statusEmoji = event.isOwner ? '👑' : event.isConfirmed ? '✅' : '⏳';
  const statusLabel = event.isOwner ? 'Organizador' : event.isConfirmed ? 'Confirmado' : 'Pendente';

  // Background decorative emoji
  const bgEmojis = ['🎉', '🍖', '🎂', '🍕', '🎪', '🥂'];
  const bgEmoji = bgEmojis[index % bgEmojis.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: rotation * 2 }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ rotate: 0, y: -6, scale: 1.03 }}
      className="group cursor-pointer"
      onClick={() => onViewEvent(event.id.toString())}
    >
      <div
        className={`relative p-5 rounded-2xl ${nb.border} ${nb.shadowLg} ${nb.hover} overflow-hidden transition-colors duration-300`}
        style={{ backgroundColor: cardBg }}
      >
        {/* Background decorative emoji */}
        <div className="absolute -bottom-3 -right-2 text-7xl opacity-10 select-none pointer-events-none rotate-12">
          {bgEmoji}
        </div>

        {/* Status sticker */}
        <div className="flex items-center justify-between mb-3">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${nb.border} text-xs font-black`}
            style={{ backgroundColor: C.cardBg, color: C.black }}
          >
            <span>{statusEmoji}</span>
            {statusLabel}
          </div>

          {event.isOwner && (
            <button
              onClick={(e) => onDeleteEvent(event.id, e)}
              className={`p-1.5 rounded-lg ${nb.border} hover:bg-red-100 transition-colors`}
              style={{ backgroundColor: C.cardBg }}
            >
              <Trash2 className="w-3.5 h-3.5" style={{ color: C.black }} />
            </button>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-black mb-3 leading-tight relative z-10" style={{ color: C.black }}>
          {event.title}
        </h3>

        {/* Info rows */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg ${nb.border} flex items-center justify-center flex-shrink-0`}
              style={{ backgroundColor: C.cardBg }}
            >
              <Calendar className="w-3.5 h-3.5" style={{ color: C.black }} />
            </div>
            <div>
              <span className="text-sm font-bold" style={{ color: C.black }}>{formatDate(event.event_date)}</span>
              {event.event_time && (
                <span className="text-xs font-medium ml-2" style={{ color: C.black, opacity: 0.6 }}>
                  às {event.event_time}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg ${nb.border} flex items-center justify-center flex-shrink-0`}
              style={{ backgroundColor: C.cardBg }}
            >
              <MapPin className="w-3.5 h-3.5" style={{ color: C.black }} />
            </div>
            <span className="text-sm font-bold truncate" style={{ color: C.black, opacity: 0.8 }}>
              {event.location || 'Local a definir'}
            </span>
          </div>
        </div>

        {/* Bottom hover indicator */}
        <div className="mt-4 flex justify-end">
          <div
            className={`px-3 py-1 rounded-lg ${nb.border} text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity`}
            style={{ backgroundColor: C.cardBg, color: C.black }}
          >
            Ver detalhes →
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
