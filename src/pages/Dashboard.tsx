import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, MapPin, Users, LogOut, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
}

interface DashboardProps {
  userEmail: string;
  onCreateEvent: () => void;
  onViewEvent: (eventId: string) => void;
  onLogout: () => void;
}

const Dashboard = ({ userEmail, onCreateEvent, onViewEvent, onLogout }: DashboardProps) => {
  const { user, devModeActive, disableDevMode } = useAuth();
  const { toast } = useToast();
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      if (devModeActive) {
        // Modo dev: apenas desativa o modo dev
        disableDevMode();
        toast({
          title: "Modo DEV desativado!",
          description: "Voltando ao login",
        });
      } else {
        // Modo normal: faz logout real do Supabase
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        toast({
          title: "Logout realizado com sucesso!",
          description: "Até logo!",
        });
      }
      
      onLogout();
    } catch (error: any) {
      toast({
        title: "Erro no logout",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const fetchEvents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('table_reune')
        .select('*')
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order('event_date', { ascending: true });

      if (error) throw error;

      const eventsWithOwnership = data.map(event => ({
        ...event,
        isOwner: event.user_id === user.id
      }));

      setEvents(eventsWithOwnership);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar eventos",
        description: error.message || "Não foi possível carregar os eventos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

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
      {(isDevMode && devModeActive) && (
        <div className="fixed top-4 right-4 bg-secondary/90 text-secondary-foreground px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium z-50">
          <AlertTriangle className="w-4 h-4" />
          LOGADO COMO DEV
        </div>
      )}
      <header className="bg-card/50 backdrop-blur-sm border-b border-border/50 px-6 py-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-primary tracking-tight">ReUNE</h1>
            <p className="text-muted-foreground font-medium">Olá, {userEmail}!</p>
          </div>
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
      </header>

      <main className="max-w-6xl mx-auto p-6 animate-fade-in">
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Meus Eventos</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.filter(event => event.isOwner).length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">Você ainda não criou nenhum evento.</p>
                <Button onClick={onCreateEvent} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Evento
                </Button>
              </div>
            ) : (
              events.filter(event => event.isOwner).map((event, index) => (
                <Card 
                  key={event.id} 
                  className={cn(
                    "cursor-pointer group animate-scale-in",
                    getCardColor(index)
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
                      <Badge variant="secondary" className="bg-white/80 text-foreground text-xs px-3 py-1">
                        Organizador
                      </Badge>
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
            {events.filter(event => !event.isOwner).length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum evento pendente.</p>
            ) : (
              events.filter(event => !event.isOwner).map((event, index) => (
                <div
                  key={event.id}
                  onClick={() => onViewEvent(event.id.toString())}
                  className={cn(
                    "px-6 py-4 rounded-xl cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
                    "border-2 flex items-center gap-3 animate-scale-in",
                    getCardColor(index + 3)
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
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Pendente
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <Button
        onClick={onCreateEvent}
        variant="floating"
        size="lg"
        className="fixed bottom-8 right-8 rounded-full w-16 h-16 text-lg animate-scale-in"
        style={{ animationDelay: '600ms' }}
      >
        <Plus className="w-7 h-7" />
      </Button>
    </div>
  );
};

export default Dashboard;