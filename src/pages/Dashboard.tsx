import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  isOwner: boolean;
  attendees: number;
  status?: 'confirmed' | 'pending' | 'declined';
}

interface DashboardProps {
  userEmail: string;
  onCreateEvent: () => void;
  onViewEvent: (eventId: string) => void;
}

const Dashboard = ({ userEmail, onCreateEvent, onViewEvent }: DashboardProps) => {
  const [events] = useState<Event[]>([
    {
      id: '1',
      title: 'Churrasco de Domingo',
      date: '2024-01-20',
      time: '15:00',
      location: 'Casa do João',
      isOwner: true,
      attendees: 8
    },
    {
      id: '2',
      title: 'Happy Hour da Empresa',
      date: '2024-01-25',
      time: '18:30',
      location: 'Bar do Centro',
      isOwner: false,
      attendees: 12,
      status: 'confirmed'
    },
    {
      id: '3',
      title: 'Aniversário da Maria',
      date: '2024-02-01',
      time: '20:00',
      location: 'Salão de Festas',
      isOwner: false,
      attendees: 25,
      status: 'pending'
    }
  ]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const cardColors = [
    'bg-turquoise-light border-turquoise/20',
    'bg-coral-light border-coral/20',
    'bg-yellow-light border-yellow/20',
    'bg-lavender-light border-lavender/20',
    'bg-mint-light border-mint/20',
    'bg-peach-light border-peach/20'
  ];

  const getCardColor = (index: number) => {
    return cardColors[index % cardColors.length];
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/50 backdrop-blur-sm border-b border-border/50 px-6 py-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-primary tracking-tight">ReUNE</h1>
            <p className="text-muted-foreground font-medium">Olá, {userEmail}!</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 animate-fade-in">
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Meus Eventos</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.filter(event => event.isOwner).map((event, index) => (
              <Card 
                key={event.id} 
                className={cn(
                  "cursor-pointer group animate-scale-in",
                  getCardColor(index)
                )}
                onClick={() => onViewEvent(event.id)}
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
                      {formatDate(event.date)} • {event.time}
                    </div>
                    <div className="flex items-center text-sm text-foreground/70">
                      <MapPin className="w-4 h-4 mr-3 text-primary" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-sm text-foreground/70">
                      <Users className="w-4 h-4 mr-3 text-primary" />
                      {event.attendees} convidados
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Convites Recebidos</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.filter(event => !event.isOwner).map((event, index) => (
              <Card 
                key={event.id} 
                className={cn(
                  "cursor-pointer group animate-scale-in",
                  getCardColor(index + 3)
                )}
                onClick={() => onViewEvent(event.id)}
                style={{ animationDelay: `${(index + 3) * 100}ms` }}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Eventos</p>
                      <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {event.title}
                      </CardTitle>
                    </div>
                    <Badge 
                      variant={event.status === 'confirmed' ? 'default' : event.status === 'pending' ? 'secondary' : 'destructive'}
                      className="text-xs px-3 py-1"
                    >
                      {event.status === 'confirmed' ? 'Confirmado' : event.status === 'pending' ? 'Pendente' : 'Recusado'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm font-medium text-foreground/80">
                      <Calendar className="w-4 h-4 mr-3 text-primary" />
                      {formatDate(event.date)} • {event.time}
                    </div>
                    <div className="flex items-center text-sm text-foreground/70">
                      <MapPin className="w-4 h-4 mr-3 text-primary" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-sm text-foreground/70">
                      <Users className="w-4 h-4 mr-3 text-primary" />
                      {event.attendees} convidados
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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