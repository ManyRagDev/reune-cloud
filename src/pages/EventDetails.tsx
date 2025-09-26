import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Plus, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Attendee {
  id: string;
  name: string;
  email: string;
  status: 'confirmed' | 'pending' | 'declined';
}

interface Supply {
  id: string;
  name: string;
  assignedTo: string[];
}

interface EventDetailsProps {
  eventId: string;
  onBack: () => void;
}

const EventDetails = ({ eventId, onBack }: EventDetailsProps) => {
  const { toast } = useToast();
  
  // Mock data - Em uma implementação real, viria do backend
  const [event] = useState({
    id: eventId,
    title: 'Churrasco de Domingo',
    date: '2024-01-20',
    time: '15:00',
    location: 'Casa do João - Rua das Flores, 123',
    description: 'Um churrasco para relaxar e se divertir com os amigos!',
    isOwner: eventId === '1'
  });

  const [attendees, setAttendees] = useState<Attendee[]>([
    { id: '1', name: 'Ana Silva', email: 'ana@email.com', status: 'confirmed' },
    { id: '2', name: 'Carlos Santos', email: 'carlos@email.com', status: 'pending' },
    { id: '3', name: 'Maria Oliveira', email: 'maria@email.com', status: 'confirmed' }
  ]);

  const [supplies, setSupplies] = useState<Supply[]>([
    { id: '1', name: 'Carne (3kg)', assignedTo: ['Ana Silva'] },
    { id: '2', name: 'Cerveja (2 caixas)', assignedTo: ['Carlos Santos', 'Maria Oliveira'] },
    { id: '3', name: 'Carvão', assignedTo: [] },
    { id: '4', name: 'Pão de alho', assignedTo: [] }
  ]);

  const [newGuest, setNewGuest] = useState('');
  const [newSupply, setNewSupply] = useState('');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const addGuest = () => {
    if (newGuest.trim()) {
      const newAttendee: Attendee = {
        id: Date.now().toString(),
        name: newGuest,
        email: `${newGuest.toLowerCase().replace(' ', '.')}@email.com`,
        status: 'pending'
      };
      setAttendees([...attendees, newAttendee]);
      setNewGuest('');
      toast({
        title: "Convite enviado!",
        description: `${newGuest} foi convidado(a) para o evento.`,
      });
    }
  };

  const addSupply = () => {
    if (newSupply.trim()) {
      const newItem: Supply = {
        id: Date.now().toString(),
        name: newSupply,
        assignedTo: []
      };
      setSupplies([...supplies, newItem]);
      setNewSupply('');
    }
  };

  const toggleSupplyAssignment = (supplyId: string, userName: string) => {
    setSupplies(supplies.map(supply => {
      if (supply.id === supplyId) {
        const isAssigned = supply.assignedTo.includes(userName);
        return {
          ...supply,
          assignedTo: isAssigned 
            ? supply.assignedTo.filter(name => name !== userName)
            : [...supply.assignedTo, userName]
        };
      }
      return supply;
    }));
  };

  const handleScheduleDelivery = () => {
    toast({
      title: "Funcionalidade em desenvolvimento!",
      description: "Funcionalidade de agendamento de entrega em desenvolvimento!",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b px-4 py-6">
        <div className="max-w-4xl mx-auto flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-4">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{event.title}</h1>
            {event.isOwner && (
              <Badge variant="secondary" className="mt-1">Organizador</Badge>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Event Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="w-5 h-5 mr-3" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Clock className="w-5 h-5 mr-3" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="w-5 h-5 mr-3" />
                <span>{event.location}</span>
              </div>
              {event.description && (
                <p className="text-muted-foreground mt-4">{event.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Button */}
        <Button className="w-full" size="lg">
          Confirmar minha presença
        </Button>

        {/* Attendees */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Convidados ({attendees.length})
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendees.map((attendee) => (
                <div key={attendee.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{attendee.name}</p>
                    <p className="text-sm text-muted-foreground">{attendee.email}</p>
                  </div>
                  <Badge variant={
                    attendee.status === 'confirmed' ? 'default' :
                    attendee.status === 'pending' ? 'secondary' : 'destructive'
                  }>
                    {attendee.status === 'confirmed' ? 'Confirmado' :
                     attendee.status === 'pending' ? 'Pendente' : 'Recusado'}
                  </Badge>
                </div>
              ))}
              
              {event.isOwner && (
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Nome do convidado..."
                    value={newGuest}
                    onChange={(e) => setNewGuest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addGuest()}
                  />
                  <Button onClick={addGuest}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Supplies List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Lista de Insumos
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {supplies.map((supply) => (
                <div key={supply.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{supply.name}</h4>
                      {supply.assignedTo.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Responsáveis: {supply.assignedTo.join(', ')}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleScheduleDelivery}
                      className="ml-4"
                    >
                      Agendar Entrega
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`supply-${supply.id}`}
                      checked={supply.assignedTo.includes('Você')}
                      onCheckedChange={() => toggleSupplyAssignment(supply.id, 'Você')}
                    />
                    <label 
                      htmlFor={`supply-${supply.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Me responsabilizar por este item
                    </label>
                  </div>
                </div>
              ))}
              
              {event.isOwner && (
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Adicionar item..."
                    value={newSupply}
                    onChange={(e) => setNewSupply(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSupply()}
                  />
                  <Button onClick={addSupply}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EventDetails;