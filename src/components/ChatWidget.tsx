import { useEffect, useMemo, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Send, Minus, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import aiChatIcon from '@/assets/ai-chat-icon.png';
import { ContextManager } from '@/core/orchestrator/contextManager';
// ðŸ”¥ NOVO: Usando orquestrador simplificado com Groq
import { simpleOrchestrate } from '@/core/orchestrator/simpleOrchestrator';
// ðŸ”„ Para voltar ao orquestrador antigo, descomente a linha abaixo e comente a linha acima:
// import { orchestrate } from '@/core/orchestrator/chatOrchestrator';
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
};

export default function ChatWidget() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [eventoId, setEventoId] = useState<string | undefined>(undefined);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [wasMinimized, setWasMinimized] = useState(false); // ðŸ”¥ NOVO: distinguir minimizar vs fechar

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const hasLoadedHistory = useRef(false);

  const contextManager = useMemo(() => new ContextManager(), []);

  // ðŸ”¥ NOVA FUNÃ‡ÃƒO: Reset completo do chat
  const resetEverything = async () => {
    if (!user?.id) return;

    // console.log('[ChatWidget] ðŸ§¹ RESET EVERYTHING - Starting complete reset...');

    try {
      // Limpar contexto no backend
      await contextManager.clearUserContext(user.id);
      // console.log('[ChatWidget] âœ… Backend context reset');

      // Limpar estado local
      setEventoId(undefined);
      setMessages([{
        role: 'assistant',
        content: 'OlÃ¡! Sou o UNE.AI e vou ajudar a organizar seus eventos. Diga o tipo de evento e quantas pessoas.'
      }]);
      setHasGreeted(true);
      setWasMinimized(false);
      hasLoadedHistory.current = false;

      // console.log('[ChatWidget] âœ… Local state reset completed');
    } catch (error) {
      // console.error('[ChatWidget] âŒ Error during reset:', error);
      // Mesmo com erro, garantir estado limpo localmente
      setEventoId(undefined);
      setMessages([{
        role: 'assistant',
        content: 'OlÃ¡! Sou o UNE.AI e vou ajudar a organizar seus eventos. Diga o tipo de evento e quantas pessoas.'
      }]);
      setHasGreeted(true);
      setWasMinimized(false);
      hasLoadedHistory.current = false;
    }
  };

  // ðŸ”¥ MODIFICADO: Load history com validaÃ§Ã£o de estado idle
  useEffect(() => {
    async function loadHistoryAndContext() {
      if (!open || !user?.id || hasLoadedHistory.current) return;

      // console.log('[ChatWidget] Opening chat, loading history...');
      setIsLoadingHistory(true);
      hasLoadedHistory.current = true;

      try {
        const { history, context } = await contextManager.loadUserContext(user.id);
        // console.log('[ChatWidget] Context loaded:', {
        //   state: context.state,
        //   historyLength: context.historyLength,
        //   evento_id: context.evento_id,
        //   wasMinimized
        // });

        // ðŸ”¥ PATCH 1: Detectar se deve comeÃ§ar do zero
        const shouldReset =
          context.state === 'idle' &&
          context.historyLength === 0 &&
          !wasMinimized;

        if (shouldReset) {
          // console.log('[ChatWidget] ðŸŽ¯ RESET CONDITION MET - Starting fresh conversation');
          await resetEverything();
          setIsLoadingHistory(false);
          return;
        }

        // ðŸ”¥ PATCH 2: SÃ³ restaurar eventId se houver histÃ³rico OU estava minimizado
        if (context.evento_id && (context.historyLength > 0 || wasMinimized)) {
          // console.log('[ChatWidget] â™»ï¸ Restoring event ID:', context.evento_id);
          setEventoId(String(context.evento_id));
        } else if (context.evento_id) {
          // console.log('[ChatWidget] âš ï¸ Ignoring stale event ID (no history, not minimized)');
        }

        // Restaurar histÃ³rico se existir
        if (history && history.length > 0) {
          // console.log('[ChatWidget] â™»ï¸ Restoring history:', history.length, 'messages');
          const formattedMessages: ChatMessage[] = history.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }));
          setMessages(formattedMessages);
          // console.log('[ChatWidget] Restored messages content:', formattedMessages);
        } else if (!hasGreeted) {
          // console.log('[ChatWidget] No history, showing greeting');
          setMessages([{
            role: 'assistant',
            content: 'OlÃ¡! Sou o UNE.AI e vou ajudar a organizar seus eventos. Diga o tipo de evento e quantas pessoas.'
          }]);
          setHasGreeted(true);
        }
      } catch (err) {
        // console.error('[ChatWidget] Error loading context:', err);
        if (!hasGreeted) {
          setMessages([{
            role: 'assistant',
            content: 'OlÃ¡! Sou o UNE.AI e vou ajudar a organizar seus eventos. Diga o tipo de evento e quantas pessoas.'
          }]);
          setHasGreeted(true);
        }
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadHistoryAndContext();
  }, [open, user?.id, contextManager, hasGreeted, wasMinimized]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, isTyping]);

  async function sendMessage(text: string) {
    if (!user?.id || !text.trim() || isLoading) return;

    console.log('[ChatWidget] sendMessage', {
      userId: user.id,
      eventoId,
      text,
    });

    // console.log('[ChatWidget] Sending message:', text);
    setIsLoading(true);
    setIsTyping(true);

    // Optimistic update
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    // console.log('[ChatWidget] User message added to state:', { role: 'user', content: text });
    setInput('');

    try {
      // console.log('[ChatWidget] Calling orchestrator...');
      // ðŸ”¥ NOVO: Usando orquestrador simplificado
      const response = await simpleOrchestrate(
        text,
        user.id as UUID,
        eventoId as UUID | undefined
      );
      console.log('[ChatWidget] orchestrator response', {
        eventoId: response.evento_id,
        estado: response.estado,
        closeChat: response.closeChat,
        showItems: response.showItems,
        suggestedReplies: response.suggestedReplies,
      });
      // console.log('[ChatWidget] Orchestrator response:', response);

      // Update event ID if changed
      if (response.evento_id) {
        const newId = String(response.evento_id);
        if (newId !== eventoId) {
          // console.log('[ChatWidget] Updating event ID to:', newId);
          setEventoId(newId);
        }
      }

      // Extract items if available
      let items: ChatMessage['items'] = undefined;
      if (response.showItems && response.snapshot?.itens) {
        // console.log('[ChatWidget] Showing items from snapshot');
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

      // ðŸ”¥ PATCH 3: IntegraÃ§Ã£o com closeChat do backend
      if (response.closeChat) {
        // console.log('[ChatWidget] ðŸŽ¯ Backend requested chat close');
        setTimeout(async () => {
          await handleClose();
          toast({
            title: response.toast || "Evento criado com sucesso!",
            description: "Atualizando dashboard...",
          });

          // ðŸ”¥ Auto-refresh para atualizar dashboard
          setTimeout(() => {
            // console.log('[ChatWidget] ðŸ”„ Recarregando pÃ¡gina para atualizar dashboard');
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
          content: `âŒ ${errorMessage}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSuggestedReply(text: string) {
    console.log('[ChatWidget] suggested reply clicked', { text });
    sendMessage(text);
  }

  // ðŸ”¥ MODIFICADO: handleClose agora usa resetEverything
  const handleClose = async () => {
    if (!user?.id) return;
    // console.log('[ChatWidget] ðŸšª CLOSING CHAT - Triggering full reset...');

    // Fechar o widget visualmente
    setOpen(false);
    setWasMinimized(false); // ðŸ”¥ Marcar como fechado (nÃ£o minimizado)

    // Reset completo
    await resetEverything();
  };

  // ðŸ”¥ NOVO: handleMinimize - apenas fecha visualmente, mantÃ©m contexto
  const handleMinimize = () => {
    // console.log('[ChatWidget] ðŸ“¦ MINIMIZING CHAT - Keeping context...');
    setOpen(false);
    setWasMinimized(true); // ðŸ”¥ Marcar como minimizado
  };

  if (!user && !loading) return null;

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => {
            // console.log('[ChatWidget] ðŸ”“ Opening chat, wasMinimized:', wasMinimized);
            setOpen(true);
          }}
          aria-label="Abrir chat"
          className="rounded-full p-0 w-16 h-16 overflow-hidden bg-transparent hover:bg-transparent border-0 shadow-none hover:scale-110 transition-transform"
        >
          <img src={aiChatIcon} alt="Chat IA" className="w-full h-full object-cover" />
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[400px] flex flex-col border-l sm:max-w-sm p-0 gap-0">
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
                  title="Minimizar (mantÃ©m conversa)"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleClose}
                  title="Fechar e Limpar"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <SheetDescription>
              Planeje seu evento com inteligÃªncia artificial.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4">
              {messages.map((msg, index) => (
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

              {isTyping && (
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
                disabled={isLoading}
              />
              <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}>
                <Send size={18} />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}




