import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, MapPin, Users, LogOut, AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import reUneLogo from '@/assets/reune-logo.png';
import { FriendsDialog } from '@/components/friends/FriendsDialog';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { AccountDialog } from '@/components/AccountDialog';
// Refresh TS types

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
  const userId = user?.id;

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

      // Busca eventos onde o usuário foi convidado
      const { data: invitations, error: invitationsError } = await supabase
        .from('event_invitations')
        .select('event_id, status')
        .eq('participant_email', user?.email || '');

      if (invitationsError) throw invitationsError;

      // Se há convites, buscar os eventos correspondentes
      let invitedEvents: any[] = [];
      if (invitations && invitations.length > 0) {
        const invitedEventIds = invitations.map(inv => inv.event_id);
        const { data: invitedEventsData, error: invitedError } = await supabase
          .from('table_reune')
          .select('*')
          .in('id', invitedEventIds)
          .order('event_date', { ascending: true });

        if (invitedError) throw invitedError;
        invitedEvents = invitedEventsData || [];
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
  }, [userId, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  const cardColors = [
    'bg-orange-light border-orange/20',
    'bg-gold-light border-gold/20',
    'bg-teal-light border-teal/20',
    'bg-cyan-light border-cyan/20',
    'bg-orange-light border-orange/30',
    'bg-cyan-light border-cyan/30'
  ];

  const getCardColor = (index: number) => {
    return cardColors[index % cardColors.length];
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/50 backdrop-blur-sm border-b border-border/50 px-6 py-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 animate-fade-in">
            <img src={reUneLogo} alt="ReUNE Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-3xl font-bold text-primary tracking-tight">ReUNE</h1>
              <p className="text-muted-foreground font-medium">Olá, {userEmail}!</p>
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => setAccountDialogOpen(true)}
                className="text-sm text-primary hover:text-primary/80 p-0 h-auto font-medium"
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
      </header>

      <main className="max-w-6xl mx-auto p-6 animate-fade-in">
        <div className="mb-12">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-foreground">Meus Eventos</h2>
            <div className="flex gap-2">
              <FriendsDialog />
              <Button onClick={onCreateEvent} size="default">
                <Plus className="w-4 h-4 mr-2" />
                Criar Novo Evento
              </Button>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.filter(event => event.isOwner || event.isConfirmed).length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">Você ainda não tem eventos confirmados.</p>
                <Button onClick={onCreateEvent} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Evento
                </Button>
              </div>
            ) : (
              events.filter(event => event.isOwner || event.isConfirmed).map((event, index) => (
                <Card 
                  key={event.id} 
                  className={cn(
                    "cursor-pointer group animate-scale-in relative",
                    getCardColor(index),
                    "dark:shadow-card"
                  )}
                  onClick={() => onViewEvent(event.id.toString())}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Eventos</p>
                        <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {event.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-white/80 text-foreground text-xs px-3 py-1 dark:bg-[#E0E0E0] dark:text-[#1A1B20]">
                          {event.isOwner ? 'Organizador' : 'Confirmado'}
                        </Badge>
                        {event.isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => handleDeleteEvent(event.id, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm font-medium text-foreground/80">
                        <Calendar className="w-4 h-4 mr-3 text-primary" />
                        {formatDate(event.event_date)} • {event.event_time}
                      </div>
                      <div className="flex items-center text-sm text-foreground/70">
                        <MapPin className="w-4 h-4 mr-3 text-primary" />
                        {event.location || 'Local não informado'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Eventos Pendentes</h2>
          <p className="text-sm text-muted-foreground mb-4">Eventos aguardando sua confirmação</p>
          <div className="flex flex-wrap gap-3">
            {events.filter(event => !event.isOwner && !event.isConfirmed).length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum evento pendente.</p>
            ) : (
              events.filter(event => !event.isOwner && !event.isConfirmed).map((event, index) => (
                <div
                  key={event.id}
                  onClick={() => onViewEvent(event.id.toString())}
                  className={cn(
                    "px-6 py-4 rounded-xl cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
                    "border-2 flex items-center gap-3 animate-scale-in",
                    getCardColor(index + 3),
                    "dark:shadow-card"
                  )}
                  style={{ animationDelay: `${(index + 3) * 100}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.event_date)} • {event.event_time}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2 text-xs dark:bg-[#E0E0E0] dark:text-[#1A1B20]">
                    Pendente
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Modal Minha Conta */}
      <AccountDialog 
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        userEmail={userEmail}
      />
    </div>
  );
};

export default Dashboard;