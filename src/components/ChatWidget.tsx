import { useEffect, useMemo, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Send, Minus, RotateCcw, Sparkles, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import aiChatIcon from '@/assets/ai-chat-icon.png';
import { ContextManager } from '@/core/orchestrator/contextManager';
import { simpleOrchestrate } from '@/core/orchestrator/simpleOrchestrator';
import { UUID } from '@/types/domain';
import { useToast } from '@/components/ui/use-toast';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  suggestedReplies?: string[];
  items?: Array<{
    nome_item: string;
    quantidade: number;
    unidade: string;
    valor_estimado: number;
    categoria: string;
  }>;
  eventSelect?: Array<{
    id: number;
    title: string;
    date: string;
    status: string;
  }>;
};

const SESSION_TIMEOUT_MS = 60 * 60 * 1000;

export default function ChatWidget() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [eventoId, setEventoId] = useState<number | undefined>(undefined);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [wasMinimized, setWasMinimized] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const hasLoadedHistory = useRef(false);

  const contextManager = useMemo(() => new ContextManager(), []);

  const handleCreateNewEvent = async () => {
    if (!user?.id) return;

    await contextManager.clearUserContext(user.id);
    await new Promise(resolve => setTimeout(resolve, 200));

    setEventoId(undefined);
    setMessages([]);
    setHasGreeted(false);
    setWasMinimized(false);
    hasLoadedHistory.current = false;
    setShowOnboarding(false);

    setMessages([{
      role: 'assistant',
      content: 'Olá! Vou te ajudar a criar um novo evento. Me conte o que você está planejando (tipo de festa, quantidade de pessoas, data, etc.)'
    }]);
    setHasGreeted(true);
  };

  const formatDateDisplay = (dateString?: string): string => {
    if (!dateString) return 'Data não definida';
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const handleListEvents = async () => {
    console.log('[ChatWidget] Listar eventos clicado');

    try {
      const result = await simpleOrchestrate('', user.id as UUID, undefined, 'list_events');

      if (result.success && result.events && result.events.length > 0) {
        const eventMessages: ChatMessage[] = [{
          role: 'assistant',
          content: `Você tem ${result.events.length} eventos em aberto. Qual deles você gostaria de editar?`,
          eventSelect: result.events.map((event: any) => ({
            id: Number(event.id),
            title: event.title,
            date: event.event_date,
            status: event.status
          }))
        }];

        setMessages(eventMessages);
        setShowOnboarding(false);

        toast({
          title: 'Eventos carregados',
          description: `Selecione um evento para continuar.`,
        });
      } else if (result.success && (!result.events || result.events.length === 0)) {
        setMessages([{
          role: 'assistant',
          content: 'Você não tem eventos pendentes para editar no momento. Que tal criar um novo?',
          suggestedReplies: ['Criar novo evento']
        }]);
        setShowOnboarding(false);

        toast({
          title: 'Nenhum evento',
          description: 'Você não tem eventos pendentes.',
        });
      }
    } catch (error) {
      console.error('[ChatWidget] Erro ao listar eventos:', error);
      toast({
        title: 'Erro ao carregar eventos',
        description: 'Não foi possível carregar seus eventos.',
        variant: 'destructive'
      });
    }
  };

  const handleEditEvent = async (event: any) => {
    if (!user?.id) return;

    console.log('[ChatWidget] Editar evento:', event);

    setEventoId(event.id);
    setShowOnboarding(false);

    setMessages([{
      role: 'assistant',
      content: `Vou ajudar você a editar o evento "${event.title}". O que você gostaria de modificar?`
    }]);
    setHasGreeted(true);

    await contextManager.updateContext(
      user.id as UUID,
      'draft',
      {},
      [],
      0.5,
      undefined,
      event.id,
      undefined
    );
  };

  const resetEverything = async () => {
    if (!user?.id) return;

    try {
      await contextManager.clearUserContext(user.id);
      localStorage.removeItem(`reune_last_chat_${String(user.id)}`);

      setEventoId(undefined);
      setMessages([]);
      setHasGreeted(false);
      setShowOnboarding(true);
      setWasMinimized(false);
      hasLoadedHistory.current = false;
    } catch (error) {
      console.error('[ChatWidget] Error during reset:', error);
      setEventoId(undefined);
      setMessages([]);
      setHasGreeted(false);
      setShowOnboarding(true);
      setWasMinimized(false);
      hasLoadedHistory.current = false;
    }
  };

  useEffect(() => {
    async function loadHistoryAndContext() {
      if (!open || !user?.id || hasLoadedHistory.current) return;

      setIsLoadingHistory(true);
      hasLoadedHistory.current = true;

      try {
        const { history, context } = await contextManager.loadUserContext(user.id);

        const lastChatTime = localStorage.getItem(`reune_last_chat_${String(user.id)}`);
        const isTimeout = lastChatTime ? (Date.now() - Number(lastChatTime) > SESSION_TIMEOUT_MS) : false;

        const isFinishedEvent = ['finalized', 'cancelled'].includes(context.state || '');

        const shouldReset =
          (context.state === 'idle' && context.historyLength === 0 && !wasMinimized) ||
          isTimeout ||
          isFinishedEvent;

        if (shouldReset) {
          await resetEverything();
          setIsLoadingHistory(false);
          return;
        }

        if (context.evento_id && (context.historyLength > 0 || wasMinimized)) {
          setEventoId(Number(context.evento_id));
        }

        if (history && history.length > 0) {
          const formattedMessages = history.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }));
          setMessages(formattedMessages);
          setShowOnboarding(false);
        } else if (!hasGreeted) {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error('[ChatWidget] Error loading context:', err);
        setShowOnboarding(true);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadHistoryAndContext();
  }, [open, user?.id, contextManager, hasGreeted, wasMinimized]);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, isTyping]);

  async function sendMessage(text: string) {
    if (!user?.id || !text.trim() || isLoading) return;

    setIsLoading(true);
    setIsTyping(true);

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');

    localStorage.setItem(`reune_last_chat_${String(user.id)}`, Date.now().toString());

    try {
      const response = await simpleOrchestrate(
        text,
        user.id as UUID,
        eventoId ? String(eventoId) : undefined
      );

      if (response.evento_id) {
        const newId = Number(response.evento_id);
        setEventoId(newId);
      }

      let items = undefined;
      if (response.showItems && response.snapshot?.itens) {
        items = response.snapshot.itens.map((item: any) => ({
          nome_item: item.nome_item,
          quantidade: item.quantidade,
          unidade: item.unidade,
          valor_estimado: item.valor_estimado,
          categoria: item.categoria
        }));
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.mensagem,
        suggestedReplies: response.suggestedReplies,
        items: items
      };

      setIsTyping(false);
      setMessages(prev => [...prev, assistantMessage]);

      if (response.closeChat) {
        setTimeout(async () => {
          await resetEverything();
          toast({
            title: response.toast || 'Evento criado com sucesso!',
            description: 'Atualizando dashboard...',
          });

          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }, 1500);
      }

    } catch (error: any) {
      console.error('[ChatWidget] Error processing message:', error);
      setIsTyping(false);

      let errorMessage = 'Algo deu errado.';
      if (error.message) {
        errorMessage = error.message;
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ ${errorMessage}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSuggestedReply(text: string) {
    sendMessage(text);
  }

  const handleMinimize = () => {
    setOpen(false);
    setWasMinimized(true);
  };

  if (!user && !loading) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => {
            setOpen(true);
          }}
          aria-label="Abrir chat"
          className="rounded-full p-0 w-16 h-16 overflow-hidden bg-transparent hover:bg-transparent border-0 shadow-none hover:scale-110 transition-transform"
        >
          <img src={aiChatIcon} alt="Chat IA" className="w-full h-full object-cover" />
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[400px] flex flex-col border-l sm:max-w-sm p-0 gap-0" hideCloseButton={true}>
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <img src={aiChatIcon} alt="AI" className="w-6 h-6" />
                Assistente UNE.AI
              </SheetTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleMinimize}
                  title="Minimizar (mantém conversa)"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={async () => {
                    await resetEverything();
                  }}
                  title="Voltar ao menu inicial"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <SheetDescription>
              Planeje seu evento com inteligência artificial.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4">
              {showOnboarding && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-lg font-semibold">O que você gostaria de fazer hoje?</h2>
                    <p className="text-sm text-muted-foreground">
                      Escolha uma opção abaixo para começar
                    </p>
                  </div>

                  <Button
                    onClick={handleCreateNewEvent}
                    className="w-full h-auto py-4 gap-3 justify-start"
                    variant="outline"
                  >
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Criar Novo Evento</div>
                      <div className="text-xs text-muted-foreground">
                        Começar do zero com um novo evento
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={handleListEvents}
                    className="w-full h-auto py-4 gap-3 justify-start"
                    variant="outline"
                  >
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Editar Eventos</div>
                      <div className="text-xs text-muted-foreground">
                        Ver seus eventos em aberto para editar
                      </div>
                    </div>
                  </Button>
                </div>
              )}

              {!showOnboarding && messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`p-3 rounded-xl max-w-[85%] ${msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent text-accent-foreground'
                      }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {msg.items && msg.items.length > 0 && (
                      <div className="mt-3 space-y-2 text-sm bg-background/10 p-2 rounded">
                        {msg.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between border-b border-white/10 last:border-0 py-1">
                            <div>
                              <span>{item.nome_item}</span>
                              <div className="text-xs opacity-70">{item.categoria}</div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono block">
                                {item.quantidade} {item.unidade}
                              </span>
                              <span className="text-xs opacity-70">
                                R$ {item.valor_estimado?.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 font-bold text-right border-t border-white/10">
                          Total: R$ {msg.items.reduce((sum, item) => sum + (item.valor_estimado || 0), 0).toFixed(2)}
                        </div>
                      </div>
                    )}

                    {msg.eventSelect && msg.eventSelect.length > 0 && (
                      <div className="mt-3 grid gap-2">
                        {msg.eventSelect.map((event) => (
                          <Button
                            key={event.id}
                            variant="outline"
                            className="justify-between h-auto py-3 px-4 bg-background/50 hover:bg-background border-white/10"
                            onClick={() => handleEditEvent(event)}
                          >
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="font-semibold">{event.title}</span>
                              <span className="text-xs opacity-70">{event.date}</span>
                            </div>
                            <div className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                              Editar
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.suggestedReplies && msg.suggestedReplies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.suggestedReplies.map((reply, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestedReply(reply)}
                          className="text-xs"
                        >
                          {reply}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && !showOnboarding && (
                <div className="flex items-center gap-1 ml-2">
                  <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-background">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                disabled={isLoading || showOnboarding}
              />
              <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim() || showOnboarding}>
                <Send size={18} />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}