import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Calendar, MessageSquare, Users, BarChart3, HelpCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MarketingScreenshots = () => {
  const [activeTab, setActiveTab] = useState("tutorial");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ReUNE - Screenshots Marketing
            </h1>
            <Button variant="outline" size="sm" asChild>
              <a href="/app">Voltar ao App</a>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="tutorial">
              <HelpCircle className="w-4 h-4 mr-2" />
              Tutorial
            </TabsTrigger>
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

          <TabsContent value="tutorial" className="space-y-4">
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>Como capturar screenshots profissionais</AlertTitle>
              <AlertDescription>
                Use as ferramentas do seu navegador para capturar estas telas
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>📸 Passo a Passo Rápido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Use DevTools do Chrome</h4>
                      <p className="text-sm text-muted-foreground">
                        Pressione F12 → Ctrl+Shift+M (modo responsivo) → Configure a dimensão desejada
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Configure Dimensões</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Instagram Feed: 1080 x 1350</li>
                        <li>• Instagram Story: 1080 x 1920</li>
                        <li>• LinkedIn: 1200 x 627</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Capture a Tela</h4>
                      <p className="text-sm text-muted-foreground">
                        Pressione Ctrl+Shift+P → Digite "Capture screenshot" → Enter
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Navegue pelas Abas</h4>
                      <p className="text-sm text-muted-foreground">
                        Use as abas acima para ver diferentes telas do app com dados de exemplo
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💡 Dicas para Screenshots Profissionais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p><strong>Zoom 100%:</strong> Mantenha o zoom do navegador em 100%</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p><strong>Tela cheia:</strong> Maximize a janela do navegador</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p><strong>Múltiplas capturas:</strong> Tire várias versões de cada tela</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p><strong>Tutorial completo:</strong> Veja TUTORIAL_SCREENSHOTS.md no projeto</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Eventos</p>
                      <p className="text-3xl font-bold mt-1">12</p>
                    </div>
                    <Calendar className="w-10 h-10 text-primary opacity-20" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Conversas Ativas</p>
                      <p className="text-3xl font-bold mt-1">8</p>
                    </div>
                    <MessageSquare className="w-10 h-10 text-primary opacity-20" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Itens Organizados</p>
                      <p className="text-3xl font-bold mt-1">156</p>
                    </div>
                    <BarChart3 className="w-10 h-10 text-primary opacity-20" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Convidados</p>
                      <p className="text-3xl font-bold mt-1">48</p>
                    </div>
                    <Users className="w-10 h-10 text-primary opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Próximos Eventos</h3>
              <div className="grid gap-4">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold mb-2">Churrasco de Final de Ano</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>📅 15/12/2024 às 18:00</p>
                          <p>📍 Sítio do João Silva</p>
                          <p>👥 24/30 confirmados</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                        Confirmado
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold mb-2">Noite de Pizza</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>📅 22/12/2024 às 20:00</p>
                          <p>📍 Apartamento 501</p>
                          <p>👥 12/15 confirmados</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
                        Pendente
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-2xl font-bold mb-2">Churrasco de Final de Ano</h4>
                  <p className="text-muted-foreground">Celebração de fim de ano com amigos e família</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data e Hora</p>
                    <p className="font-medium">15/12/2024 às 18:00</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Local</p>
                    <p className="font-medium">Sítio do João Silva</p>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3">Lista de Compras</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">🥩 Carne (12kg)</p>
                        <p className="text-sm text-muted-foreground">400g por pessoa</p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        João Silva
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">🍺 Cerveja (5 caixas)</p>
                        <p className="text-sm text-muted-foreground">72 latas</p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Maria Santos
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">🥤 Refrigerante (3 caixas)</p>
                        <p className="text-sm text-muted-foreground">36 latas</p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Pedro Costa
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">🍞 Pão (60 unidades)</p>
                        <p className="text-sm text-muted-foreground">2 por pessoa</p>
                      </div>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        Não atribuído
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Conversa com IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="max-w-[80%] p-4 rounded-lg bg-primary text-primary-foreground">
                      <p>Preciso organizar um churrasco para 30 pessoas</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-4 rounded-lg bg-muted">
                      <p>Ótimo! Vou te ajudar a organizar. Quando será o evento?</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="max-w-[80%] p-4 rounded-lg bg-primary text-primary-foreground">
                      <p>Sábado, dia 15 de dezembro às 18h</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-4 rounded-lg bg-muted">
                      <p className="mb-2">Perfeito! Para 30 pessoas em um churrasco, sugiro:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>12kg de carne (400g por pessoa)</li>
                        <li>60 pães (2 por pessoa)</li>
                        <li>3kg de sal grosso</li>
                        <li>90 bebidas entre cervejas e refrigerantes</li>
                      </ul>
                      <p className="mt-2">Quer que eu adicione esses itens à lista do evento?</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="max-w-[80%] p-4 rounded-lg bg-primary text-primary-foreground">
                      <p>Sim, por favor! E adiciona também carvão</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-4 rounded-lg bg-muted">
                      <p>✅ Itens adicionados à lista do evento! Também adicionei 10kg de carvão. Quer distribuir esses itens entre os convidados?</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guests">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Convidados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { name: "João Silva", items: 3, status: "confirmed" },
                    { name: "Maria Santos", items: 2, status: "confirmed" },
                    { name: "Pedro Costa", items: 1, status: "confirmed" },
                    { name: "Ana Paula", items: 0, status: "pending" },
                    { name: "Carlos Eduardo", items: 1, status: "confirmed" },
                    { name: "Fernanda Lima", items: 2, status: "confirmed" },
                  ].map((guest, i) => (
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MarketingScreenshots;
