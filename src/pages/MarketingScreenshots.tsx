import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketingMode } from "@/components/marketing/MarketingMode";
import { useMarketingMode } from "@/hooks/useMarketingMode";
import { mockExampleData } from "@/data/mockExampleData";
import { Camera, Calendar, MessageSquare, Users, BarChart3 } from "lucide-react";

const MarketingScreenshots = () => {
  const { isEnabled, toggle } = useMarketingMode();
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <MarketingMode isEnabled={isEnabled} onToggle={toggle} />

      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/reune-logo.png" alt="ReUNE" className="h-8" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-cyan bg-clip-text text-transparent">
                ReUNE
              </h1>
            </div>
            <Button onClick={toggle} variant="outline" size="sm">
              <Camera className="w-4 h-4 mr-2" />
              {isEnabled ? "Fechar" : "Modo Marketing"} (Ctrl+Shift+M)
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Screenshots de Marketing</h2>
          <p className="text-muted-foreground">
            Navegue pelas telas com dados de exemplo e capture screenshots profissionais
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="w-4 h-4 mr-2" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat IA
            </TabsTrigger>
            <TabsTrigger value="guests">
              <Users className="w-4 h-4 mr-2" />
              Convidados
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Eventos</p>
                    <p className="text-3xl font-bold mt-1">{mockExampleData.metrics.totalEvents}</p>
                  </div>
                  <Calendar className="w-10 h-10 text-primary opacity-20" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversas Ativas</p>
                    <p className="text-3xl font-bold mt-1">{mockExampleData.metrics.activeConversations}</p>
                  </div>
                  <MessageSquare className="w-10 h-10 text-primary opacity-20" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Itens Organizados</p>
                    <p className="text-3xl font-bold mt-1">{mockExampleData.metrics.itemsOrganized}</p>
                  </div>
                  <BarChart3 className="w-10 h-10 text-primary opacity-20" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Convidados</p>
                    <p className="text-3xl font-bold mt-1">{mockExampleData.metrics.guestsManaged}</p>
                  </div>
                  <Users className="w-10 h-10 text-primary opacity-20" />
                </div>
              </Card>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Próximos Eventos</h3>
              <div className="grid gap-4">
                {mockExampleData.events.map(event => (
                  <Card key={event.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold mb-2">{event.title}</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>📅 {new Date(event.date).toLocaleDateString('pt-BR')} às {event.time}</p>
                          <p>📍 {event.location}</p>
                          <p>👥 {event.confirmed_count}/{event.guests_count} confirmados</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.status === 'confirmed' 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {event.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Events */}
          <TabsContent value="events">
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Detalhes do Evento</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-2xl font-bold mb-2">{mockExampleData.events[0].title}</h4>
                    <p className="text-muted-foreground">{mockExampleData.events[0].description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Data e Hora</p>
                      <p className="font-medium">
                        {new Date(mockExampleData.events[0].date).toLocaleDateString('pt-BR')} às {mockExampleData.events[0].time}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Local</p>
                      <p className="font-medium">{mockExampleData.events[0].location}</p>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">Lista de Compras</h5>
                    <div className="space-y-2">
                      {mockExampleData.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.quantity}</p>
                          </div>
                          {item.assignedTo && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {item.assignedTo}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Chat */}
          <TabsContent value="chat">
            <Card className="p-6">
              <div className="space-y-4">
                {mockExampleData.chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Guests */}
          <TabsContent value="guests">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Lista de Convidados</h3>
              <div className="space-y-2">
                {mockExampleData.guests.map((guest, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">
                          {guest.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{guest.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {guest.items} {guest.items === 1 ? 'item' : 'itens'} atribuídos
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      guest.status === 'confirmed' 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {guest.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MarketingScreenshots;
