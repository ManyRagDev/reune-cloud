import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Clock, MapPin, Users, LogOut, AlertTriangle, Trash2, LayoutGrid, CheckCircle, UserCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import reUneLogo from '@/assets/reune-logo.png';
import { FriendsDialog } from '@/components/friends/FriendsDialog';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { AccountDialog } from '@/components/AccountDialog';
import { ProfilePromptDialog } from '@/components/ProfilePromptDialog';
import { BugReportButton } from '@/components/BugReportButton';
import { ThemeToggle } from '@/components/landing/ThemeToggle';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FounderBadge } from '@/components/FounderBadge';

interface Event {
  id: number;
  title: string;
  event_date: string;
  event_time: string;
  location: string | null;
  description: string | null;
  user_id: string;
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
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logout realizado com sucesso!",
        description: "Até logo!",
      });

      onLogout();
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro no logout",
        description: err?.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (eventId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Tem certeza que deseja deletar este evento? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('table_reune')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Evento deletado!",
        description: "O evento foi removido com sucesso.",
      });

      fetchEvents();
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro ao deletar evento",
        description: err?.message || "Não foi possível deletar o evento.",
        variant: "destructive",
      });
    }
  };

  const fetchFounderData = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_founder, founder_since, premium_until, storage_multiplier')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar dados de founder:', error);
        return;
      }

      if (data?.is_founder) {
        setFounderData(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de founder:', error);
    }
  }, [userId]);

  const fetchEvents = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Busca apenas eventos onde o usuário é criador
      const { data: ownEvents, error: ownError } = await supabase
        .from('table_reune')
        .select('*')
        .eq('user_id', userId)
        .order('event_date', { ascending: true });

      if (ownError) throw ownError;

      // Busca notificações de convites para o usuário atual
      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('event_id, metadata')
        .eq('user_id', userId)
        .in('type', ['event_invite', 'organizer_invite']);

      if (notificationsError) throw notificationsError;

      // Se há notificações de convite, buscar os eventos correspondentes
      let invitedEvents: any[] = [];
      if (notifications && notifications.length > 0) {
        const invitedEventIds = [...new Set(notifications.map(n => n.event_id).filter(Boolean))];

        if (invitedEventIds.length > 0) {
          const { data: invitedEventsData, error: invitedError } = await supabase
            .from('table_reune')
            .select('*')
            .in('id', invitedEventIds)
            .order('event_date', { ascending: true });

          if (invitedError) throw invitedError;
          invitedEvents = invitedEventsData || [];
        }
      }

      // Combinar eventos próprios e convidados (sem duplicatas)
      const allEvents = [...(ownEvents || [])];
      invitedEvents.forEach(event => {
        if (!allEvents.find(e => e.id === event.id)) {
          allEvents.push(event);
        }
      });

      // Ordenar por data
      allEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

      // Busca confirmações do usuário
      const { data: confirmationsData, error: confirmationsError } = await supabase
        .from('event_confirmations')
        .select('event_id, presence_confirmed')
        .eq('user_id', userId);

      if (confirmationsError) throw confirmationsError;

      // Cria um mapa de confirmações
      const confirmationsMap = new Map(
        confirmationsData?.map(c => [c.event_id, c.presence_confirmed]) || []
      );

      const eventsWithStatus = allEvents.map(event => ({
        ...event,
        isOwner: event.user_id === userId,
        isConfirmed: confirmationsMap.get(event.id) === true
      }));

      setEvents(eventsWithStatus);
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro ao carregar eventos",
        description: err?.message || "Não foi possível carregar os eventos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast, user?.email]);

  useEffect(() => {
    fetchEvents();
    fetchFounderData();
  }, [fetchEvents, fetchFounderData]);

  // Verificar se deve exibir o popup de perfil
  useEffect(() => {
    const checkProfilePrompt = async () => {
      if (!userId) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('hide_profile_prompt')
          .eq('id', userId)
          .single();

        if (error) throw error;

        // Mostrar popup se a preferência não estiver marcada
        if (!profile?.hide_profile_prompt) {
          // Pequeno delay para melhor UX (esperar a tela carregar)
          setTimeout(() => {
            setProfilePromptOpen(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Erro ao verificar preferência de perfil:', error);
      }
    };

    checkProfilePrompt();
  }, [userId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        />

        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Theme Toggle */}
      <ThemeToggle className="fixed top-4 right-4 z-50" />

      {/* Animated Background Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="fixed top-0 left-0 w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
      />

      {/* Floating Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-6xl px-4"
      >
        <div className="rounded-3xl bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <motion.img
                src={reUneLogo}
                alt="ReUNE Logo"
                className="h-12 w-auto"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  ReUNE
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Olá, {userEmail}!</p>
                  {founderData?.is_founder && (
                    <FounderBadge
                      variant="compact"
                      founderSince={founderData.founder_since}
                      premiumUntil={founderData.premium_until}
                      storageMultiplier={founderData.storage_multiplier}
                    />
                  )}
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setAccountDialogOpen(true)}
                  className="text-xs text-primary hover:text-primary/80 p-0 h-auto font-medium"
                >
                  Minha Conta →
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-center mb-8">
            <div>
              <Badge className="mb-3 px-3 py-1 text-sm font-medium bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                Dashboard Inteligente
              </Badge>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Meus Eventos
              </h2>
              <p className="text-muted-foreground mt-2">
                Organize e gerencie todos os seus eventos em um só lugar
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <FriendsDialog />
              <Button
                onClick={onCreateEvent}
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg group"
              >
                <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                Criar Novo Evento
              </Button>
            </div>
          </div>

          {/* Enhanced Tabs for Event Categorization */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 h-14 mb-10 bg-card/50 backdrop-blur-sm p-1.5 rounded-2xl border border-border/50 shadow-lg">
              <TabsTrigger
                value="all"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/10 data-[state=active]:to-amber-500/10 data-[state=active]:shadow-md transition-all font-medium"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Todos ({events.length})
              </TabsTrigger>
              <TabsTrigger
                value="owner"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/10 data-[state=active]:to-amber-500/10 data-[state=active]:shadow-md transition-all font-medium"
              >
                <Users className="w-4 h-4 mr-2" />
                Criados ({events.filter(e => e.isOwner).length})
              </TabsTrigger>
              <TabsTrigger
                value="confirmed"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/10 data-[state=active]:to-amber-500/10 data-[state=active]:shadow-md transition-all font-medium"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmados ({events.filter(e => !e.isOwner && e.isConfirmed).length})
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/10 data-[state=active]:to-amber-500/10 data-[state=active]:shadow-md transition-all font-medium"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Pendentes ({events.filter(e => !e.isOwner && !e.isConfirmed).length})
              </TabsTrigger>
            </TabsList>

            {/* All Events */}
            <TabsContent value="all" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {events.length === 0 ? (
                  <div className="col-span-full text-center py-20">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-10 h-10 text-orange-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">Nenhum evento ainda</h3>
                      <p className="text-muted-foreground mb-6">Comece criando seu primeiro evento incrível!</p>
                      <Button
                        onClick={onCreateEvent}
                        size="lg"
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Primeiro Evento
                      </Button>
                    </div>
                  </div>
                ) : (
                  events.map((event, index) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      index={index}
                      onViewEvent={onViewEvent}
                      onDeleteEvent={handleDeleteEvent}
                      formatDate={formatDate}
                    />
                  ))
                )}
              </motion.div>
            </TabsContent>

            {/* Owner Events */}
            <TabsContent value="owner" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {events.filter(event => event.isOwner).length === 0 ? (
                  <div className="col-span-full text-center py-20">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 flex items-center justify-center mx-auto mb-6">
                        <Users className="w-10 h-10 text-orange-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">Nenhum evento criado</h3>
                      <p className="text-muted-foreground mb-6">Crie eventos e convide seus amigos!</p>
                      <Button
                        onClick={onCreateEvent}
                        size="lg"
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Primeiro Evento
                      </Button>
                    </div>
                  </div>
                ) : (
                  events.filter(event => event.isOwner).map((event, index) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      index={index}
                      onViewEvent={onViewEvent}
                      onDeleteEvent={handleDeleteEvent}
                      formatDate={formatDate}
                    />
                  ))
                )}
              </motion.div>
            </TabsContent>

            {/* Confirmed Events */}
            <TabsContent value="confirmed" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {events.filter(event => !event.isOwner && event.isConfirmed).length === 0 ? (
                  <div className="col-span-full text-center py-20">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">Nenhum evento confirmado</h3>
                      <p className="text-muted-foreground">Confirme sua presença nos eventos pendentes!</p>
                    </div>
                  </div>
                ) : (
                  events.filter(event => !event.isOwner && event.isConfirmed).map((event, index) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      index={index}
                      onViewEvent={onViewEvent}
                      onDeleteEvent={handleDeleteEvent}
                      formatDate={formatDate}
                    />
                  ))
                )}
              </motion.div>
            </TabsContent>

            {/* Pending Events */}
            <TabsContent value="pending" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {events.filter(event => !event.isOwner && !event.isConfirmed).length === 0 ? (
                  <div className="col-span-full text-center py-20">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 flex items-center justify-center mx-auto mb-6">
                        <UserCheck className="w-10 h-10 text-amber-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">Nenhum evento pendente</h3>
                      <p className="text-muted-foreground">Você está em dia com seus eventos!</p>
                    </div>
                  </div>
                ) : (
                  events.filter(event => !event.isOwner && !event.isConfirmed).map((event, index) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      index={index}
                      onViewEvent={onViewEvent}
                      onDeleteEvent={handleDeleteEvent}
                      formatDate={formatDate}
                    />
                  ))
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Modal Minha Conta */}
      <AccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        userEmail={userEmail}
      />

      {/* Popup educacional de perfil */}
      <ProfilePromptDialog
        open={profilePromptOpen}
        onOpenChange={setProfilePromptOpen}
        onNavigateToProfile={() => setAccountDialogOpen(true)}
      />

      {/* Bug Report Button - Fixed position */}
      <BugReportButton />
    </div>
  );
};

// Event Card Component for DRY principle
interface EventCardProps {
  event: Event;
  index: number;
  onViewEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: number, e: React.MouseEvent) => Promise<void>;
  formatDate: (dateStr: string) => string;
}

const EventCard = ({ event, index, onViewEvent, onDeleteEvent, formatDate }: EventCardProps) => {
  const gradients = [
    'from-orange-500/20 to-amber-500/20',
    'from-cyan-500/20 to-blue-500/20',
    'from-purple-500/20 to-pink-500/20',
    'from-green-500/20 to-emerald-500/20',
    'from-red-500/20 to-orange-500/20',
    'from-indigo-500/20 to-purple-500/20',
  ];

  const borderGradients = [
    'from-orange-500/50 to-amber-500/50',
    'from-cyan-500/50 to-blue-500/50',
    'from-purple-500/50 to-pink-500/50',
    'from-green-500/50 to-emerald-500/50',
    'from-red-500/50 to-orange-500/50',
    'from-indigo-500/50 to-purple-500/50',
  ];

  const gradient = gradients[index % gradients.length];
  const borderGradient = borderGradients[index % borderGradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group"
    >
      <div className="relative">
        {/* Gradient Border Glow */}
        <div className={cn(
          "absolute -inset-0.5 bg-gradient-to-r rounded-3xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-300",
          borderGradient
        )} />

        <Card
          className={cn(
            "relative cursor-pointer border-2 border-border/50 rounded-3xl overflow-hidden transition-all duration-300",
            "bg-card/50 backdrop-blur-sm",
            "group-hover:border-border group-hover:shadow-2xl"
          )}
          onClick={() => onViewEvent(event.id.toString())}
        >
          {/* Top Gradient Bar */}
          <div className={cn("h-2 w-full bg-gradient-to-r", borderGradient)} />

          <CardHeader className="pb-4 pt-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Badge
                  variant="secondary"
                  className={cn(
                    "mb-3 px-3 py-1 text-xs font-semibold bg-gradient-to-r",
                    gradient,
                    "border-0"
                  )}
                >
                  {event.isOwner ? '👑 Organizador' : event.isConfirmed ? '✓ Confirmado' : '⏳ Pendente'}
                </Badge>
                <CardTitle className="text-xl font-bold text-foreground group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-amber-500 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                  {event.title}
                </CardTitle>
              </div>
              {event.isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive rounded-full"
                  onClick={(e) => onDeleteEvent(event.id, e)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center text-sm font-medium text-foreground/90">
                <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-r flex items-center justify-center mr-3", gradient)}>
                  <Calendar className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <div>{formatDate(event.event_date)}</div>
                  <div className="text-xs text-muted-foreground">{event.event_time}</div>
                </div>
              </div>

              <div className="flex items-center text-sm text-foreground/80">
                <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-r flex items-center justify-center mr-3", gradient)}>
                  <MapPin className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex-1 truncate">
                  {event.location || 'Local não informado'}
                </div>
              </div>
            </div>

            {/* Hover Effect Line */}
            <div className={cn(
              "mt-4 h-1 w-0 group-hover:w-full transition-all duration-300 rounded-full bg-gradient-to-r",
              borderGradient
            )} />
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default Dashboard;
