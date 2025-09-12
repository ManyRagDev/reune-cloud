import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, MapPin, Users } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b px-4 py-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">ReUNE</h1>
            <p className="text-muted-foreground">Olá, {userEmail}!</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Meus Eventos</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.filter(event => event.isOwner).map((event) => (
              <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onViewEvent(event.id)}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <Badge variant="secondary">Organizador</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      {event.time}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      {event.attendees} convidados
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Convites Recebidos</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.filter(event => !event.isOwner).map((event) => (
              <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onViewEvent(event.id)}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <Badge variant={event.status === 'confirmed' ? 'default' : event.status === 'pending' ? 'secondary' : 'destructive'}>
                      {event.status === 'confirmed' ? 'Confirmado' : event.status === 'pending' ? 'Pendente' : 'Recusado'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      {event.time}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
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
        size="lg"
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default Dashboard;