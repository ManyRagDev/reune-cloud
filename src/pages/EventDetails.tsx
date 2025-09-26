import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Plus, Package, Check, X, UserPlus, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEvent } from '@/hooks/useEvent';
import { useAuth } from '@/hooks/useAuth';
import { InviteGuestDialog } from '@/components/InviteGuestDialog';

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

interface EventConfirmation {
  date: 'confirmed' | 'rejected' | 'pending';
  time: 'confirmed' | 'rejected' | 'pending';
  location: 'confirmed' | 'rejected' | 'pending';
}

const EventDetails = ({ eventId, onBack }: EventDetailsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { event, organizers, loading, error, isOrganizer, addOrganizer, removeOrganizer } = useEvent(eventId);

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

  // Estados para confirmação flexível
  const [confirmation, setConfirmation] = useState<EventConfirmation>({
    date: 'pending',
    time: 'pending', 
    location: 'pending'
  });

  // Estados para alternativas propostas
  const [alternativeDate, setAlternativeDate] = useState<Date | undefined>();
  const [alternativeTime, setAlternativeTime] = useState('');
  const [alternativeLocation, setAlternativeLocation] = useState('');

  // Estados para controlar popovers
  const [showDatePopover, setShowDatePopover] = useState(false);
  const [showTimePopover, setShowTimePopover] = useState(false);
  const [showLocationPopover, setShowLocationPopover] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Função para verificar se pode confirmar presença
  const canConfirmPresence = () => {
    return confirmation.date === 'confirmed' && 
           confirmation.time === 'confirmed' && 
           confirmation.location === 'confirmed';
  };

  // Funções para confirmar/rejeitar cada item
  const handleConfirmDate = () => {
    setConfirmation(prev => ({ ...prev, date: 'confirmed' }));
  };

  const handleRejectDate = () => {
    setConfirmation(prev => ({ ...prev, date: 'rejected' }));
    setShowDatePopover(true);
  };

  const handleConfirmTime = () => {
    setConfirmation(prev => ({ ...prev, time: 'confirmed' }));
  };

  const handleRejectTime = () => {
    setConfirmation(prev => ({ ...prev, time: 'rejected' }));
    setShowTimePopover(true);
  };

  const handleConfirmLocation = () => {
    setConfirmation(prev => ({ ...prev, location: 'confirmed' }));
  };

  const handleRejectLocation = () => {
    setConfirmation(prev => ({ ...prev, location: 'rejected' }));
    setShowLocationPopover(true);
  };

  // Funções para salvar alternativas
  const saveAlternativeDate = () => {
    if (alternativeDate) {
      toast({
        title: "Alternativa de data enviada!",
        description: `Você sugeriu: ${format(alternativeDate, 'dd/MM/yyyy', { locale: ptBR })}`,
      });
      setShowDatePopover(false);
    }
  };

  const saveAlternativeTime = () => {
    if (alternativeTime) {
      toast({
        title: "Alternativa de horário enviada!",
        description: `Você sugeriu: ${alternativeTime}`,
      });
      setShowTimePopover(false);
    }
  };

  const saveAlternativeLocation = () => {
    if (alternativeLocation.trim()) {
      toast({
        title: "Alternativa de local enviada!",
        description: `Você sugeriu: ${alternativeLocation}`,
      });
      setShowLocationPopover(false);
      setAlternativeLocation('');
    }
  };

  // Função para convidar pessoa (organizador ou convidado comum)
  const handleInvite = async (email: string, name: string, shouldBeOrganizer: boolean) => {
    // TODO: Implementar lógica de envio de convites
    // Por enquanto, se for organizador, adiciona direto na tabela de organizadores
    if (shouldBeOrganizer) {
      // Aqui seria necessário primeiro criar/encontrar o usuário pelo email
      // Por simplicidade, vamos simular
      const mockUserId = `user-${Date.now()}`;
      return await addOrganizer(mockUserId);
    } else {
      // Lógica para convites normais seria implementada aqui
      return { error: null };
    }
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
            {isOrganizer && (
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
            {!isOrganizer && (
              <CardDescription>Confirme ou sugira alternativas para cada item</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Data */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="w-5 h-5 mr-3" />
                  <div>
                    <span className="font-medium text-foreground">Data:</span>
                    <p>{formatDate(event.event_date)}</p>
                  </div>
                </div>
                {!isOrganizer && (
                  <div className="flex gap-2">
                    <Button
                      variant={confirmation.date === 'confirmed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={handleConfirmDate}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Confirmar
                    </Button>
                    <Popover open={showDatePopover} onOpenChange={setShowDatePopover}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={confirmation.date === 'rejected' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={handleRejectDate}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Não posso
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4">
                        <div className="space-y-4">
                          <h4 className="font-medium">Sugira uma data alternativa:</h4>
                          <CalendarComponent
                            mode="single"
                            selected={alternativeDate}
                            onSelect={setAlternativeDate}
                            className="pointer-events-auto"
                          />
                          <Button onClick={saveAlternativeDate} className="w-full">
                            Confirmar Alternativa
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Horário */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center text-muted-foreground">
                  <Clock className="w-5 h-5 mr-3" />
                  <div>
                    <span className="font-medium text-foreground">Horário:</span>
                    <p>{event.event_time}</p>
                  </div>
                </div>
                {!isOrganizer && (
                  <div className="flex gap-2">
                    <Button
                      variant={confirmation.time === 'confirmed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={handleConfirmTime}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Confirmar
                    </Button>
                    <Popover open={showTimePopover} onOpenChange={setShowTimePopover}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={confirmation.time === 'rejected' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={handleRejectTime}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Não posso
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4">
                        <div className="space-y-4">
                          <h4 className="font-medium">Sugira um horário alternativo:</h4>
                          <Select value={alternativeTime} onValueChange={setAlternativeTime}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um horário" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                                  {`${i.toString().padStart(2, '0')}:00`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button onClick={saveAlternativeTime} className="w-full">
                            Confirmar Alternativa
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Local */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-5 h-5 mr-3" />
                  <div>
                    <span className="font-medium text-foreground">Local:</span>
                    <p>{event.location}</p>
                  </div>
                </div>
                {!isOrganizer && (
                  <div className="flex gap-2">
                    <Button
                      variant={confirmation.location === 'confirmed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={handleConfirmLocation}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Confirmar
                    </Button>
                    <Popover open={showLocationPopover} onOpenChange={setShowLocationPopover}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={confirmation.location === 'rejected' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={handleRejectLocation}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Não posso
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4">
                        <div className="space-y-4">
                          <h4 className="font-medium">Sugira um local alternativo:</h4>
                          <Textarea
                            placeholder="Digite sua sugestão de local..."
                            value={alternativeLocation}
                            onChange={(e) => setAlternativeLocation(e.target.value)}
                          />
                          <Button onClick={saveAlternativeLocation} className="w-full">
                            Confirmar Alternativa
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {event.description && (
                <div className="pt-4 border-t">
                  <p className="text-muted-foreground">{event.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Button - apenas para convidados */}
        {!isOrganizer && (
          <Button 
            className="w-full" 
            size="lg"
            disabled={!canConfirmPresence()}
          >
            {canConfirmPresence() 
              ? "Confirmar minha presença" 
              : "Confirme data, hora e local para continuar"
            }
          </Button>
        )}

        {/* Organizers - apenas organizadores podem ver e editar */}
        {isOrganizer && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Organizadores ({1 + organizers.length})
                </CardTitle>
                <InviteGuestDialog onInvite={handleInvite} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Criador do evento */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Criador do evento</p>
                    <p className="text-sm text-muted-foreground">ID: {event.user_id}</p>
                  </div>
                  <Badge variant="default">Organizador Principal</Badge>
                </div>
                
                {/* Co-organizadores */}
                {organizers.map((organizer) => (
                  <div key={organizer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Co-organizador</p>
                      <p className="text-sm text-muted-foreground">ID: {organizer.user_id}</p>
                      <p className="text-xs text-muted-foreground">
                        Adicionado em {new Date(organizer.added_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeOrganizer(organizer.id)}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
              {!isOrganizer && (
                <InviteGuestDialog onInvite={(email, name) => handleInvite(email, name, false)} />
              )}
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
              
              {isOrganizer && (
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
              
              {isOrganizer && (
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