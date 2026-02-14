import { useEffect, useMemo, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Send, Minus, RotateCcw, Sparkles, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import aiChatIcon from '@/assets/ai-chat-icon.png';
import { ContextManager } from '@/core/orchestrator/contextManager';
import { simpleOrchestrate } from '@/core/orchestrator/simpleOrchestrator';
import { UUID } from '@/types/domain';
import { useToast } from '@/components/ui/use-toast';
import './ChatWidget.css';

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

// Ícones por categoria de item
const categoryIcons: Record<string, string> = {
  comida: '🥩',
  proteina: '🥩',
  acompanhamento: '🍞',
  bebida: '🍺',
  refrigerante: '🥤',
  combustivel: '🔥',
  suprimento: '📦',
  decoracao: '🎈',
  descartaveis: '🍽️',
  geral: '📋',
};

// Cores por categoria para itens
const categoryColors: Record<string, string> = {
  comida: '#FF6B35',
  proteina: '#FF6B35',
  bebida: '#00B8D4',
  refrigerante: '#00B8D4',
  combustivel: '#007A70',
  suprimento: '#9CA3AF',
  decoracao: '#FFC107',
  descartaveis: '#6B7280',
  geral: '#6B7280',
};

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
  const [wasMinimized, setWasMinimized] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const hasLoadedHistory = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      content: 'Olá! 👋 Sou o UNE.AI, seu assistente para planejar eventos.\n\nMe conta: que tipo de festa você quer organizar? Pode me dizer o tipo, quantidade de pessoas e data! 🎉'
    }]);
    setHasGreeted(true);
  };

  const formatDateDisplay = (dateString?: string): string => {
    if (!dateString) return 'Data não definida';
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'short',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
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
          content: `📅 Você tem ${result.events.length} evento${result.events.length > 1 ? 's' : ''} em aberto.\n\nQual deles você gostaria de editar?`,
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
          content: '📭 Você não tem eventos pendentes para editar no momento.\n\nQue tal criar um novo evento? ✨',
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
      content: `✏️ Vou ajudar você a editar o evento **"${event.title}"**.\n\nO que você gostaria de modificar? Pode ser data, quantidade de pessoas, ou qualquer outro detalhe!`
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

      setIsLoading(true);
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
          setIsLoading(false);
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
        setIsLoading(false);
      }
    }

    loadHistoryAndContext();
  }, [open, user?.id, contextManager, hasGreeted, wasMinimized]);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  async function sendMessage(text: string) {
    if (!user?.id || !text.trim() || isLoading) return;

    setIsLoading(true);
    setIsTyping(true);

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

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

      let errorMessage = 'Ops! Algo deu errado. Pode tentar de novo?';
      if (error.message) {
        errorMessage = error.message;
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `😅 ${errorMessage}`
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!user && !loading) return null;

  return (
    <>
      {/* Botão Flutuante */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setOpen(true)}
          aria-label="Abrir chat"
          className="chat-fab rounded-full p-0 w-16 h-16 overflow-hidden bg-transparent hover:bg-transparent border-0 shadow-none"
        >
          <img src={aiChatIcon} alt="Chat IA" className="w-full h-full object-cover" />
        </Button>
      </div>

      {/* Chat Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[420px] flex flex-col border-l-0 p-0 gap-0 sm:max-w-md" hideCloseButton={true}>
          
          {/* Header com Gradiente */}
          <SheetHeader className="chat-header p-4 shrink-0">
            <div className="relative flex items-center justify-between">
              <SheetTitle className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 bg-white/10 backdrop-blur-sm">
                  <img src={aiChatIcon} alt="AI" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold">UNE.AI</span>
                  <span className="text-xs font-normal text-white/80 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    Online
                  </span>
                </div>
              </SheetTitle>
              <div className="flex items-center gap-1">
                <button
                  className="header-button"
                  onClick={handleMinimize}
                  title="Minimizar (mantém conversa)"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  className="header-button danger"
                  onClick={async () => await resetEverything()}
                  title="Voltar ao menu inicial"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <SheetDescription className="text-white/90 text-sm mt-1 relative">
              Seu assistente para planejar eventos incríveis ✨
            </SheetDescription>
          </SheetHeader>

          {/* Área de Mensagens */}
          <ScrollArea className="flex-1 chat-messages" ref={scrollAreaRef}>
            <div className="flex flex-col gap-3 pb-4">
              
              {/* Onboarding */}
              {showOnboarding && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                  <div className="text-center space-y-2 mb-6">
                    <h2 className="onboarding-title-main" style={{ color: '#1a1a1a' }}>O que vamos planejar hoje? 🎉</h2>
                    <p style={{ color: '#525252', fontSize: '0.875rem' }}>
                      Escolha uma opção abaixo para começar
                    </p>
                  </div>

                  <div 
                    className="onboarding-card"
                    onClick={handleCreateNewEvent}
                  >
                    <div className="onboarding-icon">
                      <Sparkles className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="onboarding-content">
                      <div className="onboarding-title" style={{ color: '#1a1a1a' }}>Criar Novo Evento</div>
                      <div className="onboarding-description" style={{ color: '#525252' }}>
                        Começar do zero com um novo evento
                      </div>
                    </div>
                  </div>

                  <div 
                    className="onboarding-card"
                    onClick={handleListEvents}
                  >
                    <div className="onboarding-icon" style={{ background: 'linear-gradient(135deg, hsl(187 100% 95%) 0%, hsl(187 100% 90%) 100%)' }}>
                      <Calendar className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div className="onboarding-content">
                      <div className="onboarding-title" style={{ color: '#1a1a1a' }}>Editar Eventos</div>
                      <div className="onboarding-description" style={{ color: '#525252' }}>
                        Ver seus eventos em aberto para editar
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensagens */}
              {!showOnboarding && messages.map((msg, index) => (
                <div key={index} className={`message-wrapper ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="message-avatar">
                      <img src={aiChatIcon} alt="UNE.AI" />
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-1 max-w-[85%]">
                    <div className="message-bubble">
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Lista de Itens */}
                      {msg.items && msg.items.length > 0 && (
                        <div className="items-card">
                          {msg.items.map((item, idx) => (
                            <div key={idx} className="item-row">
                              <div className="item-info">
                                <div 
                                  className="item-icon"
                                  style={{ 
                                    backgroundColor: `${categoryColors[item.categoria] || '#6B7280'}20`,
                                  }}
                                >
                                  {categoryIcons[item.categoria] || '📋'}
                                </div>
                                <div className="item-details">
                                  <span className="item-name">{item.nome_item}</span>
                                  <span className="item-category" style={{ color: categoryColors[item.categoria] || '#6B7280' }}>
                                    {item.categoria.charAt(0).toUpperCase() + item.categoria.slice(1)}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="item-quantity">
                                  {item.quantidade} {item.unidade}
                                </div>
                                <div className="item-price">
                                  R$ {item.valor_estimado?.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="items-total">
                            Total: R$ {msg.items.reduce((sum, item) => sum + (item.valor_estimado || 0), 0).toFixed(2)}
                          </div>
                        </div>
                      )}

                      {/* Cards de Eventos */}
                      {msg.eventSelect && msg.eventSelect.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.eventSelect.map((event) => (
                            <div
                              key={event.id}
                              className="event-card"
                              onClick={() => handleEditEvent(event)}
                            >
                              <div className="event-info">
                                <span className="event-title">{event.title}</span>
                                <span className="event-date">{formatDateDisplay(event.date)}</span>
                              </div>
                              <span className="event-badge edit">Editar</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sugestões de Resposta */}
                    {msg.suggestedReplies && msg.suggestedReplies.length > 0 && (
                      <div className="suggestions-container">
                        {msg.suggestedReplies.map((reply, idx) => (
                          <button
                            key={idx}
                            className="suggestion-pill"
                            onClick={() => handleSuggestedReply(reply)}
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && !showOnboarding && (
                <div className="message-wrapper assistant">
                  <div className="message-avatar">
                    <img src={aiChatIcon} alt="UNE.AI" />
                  </div>
                  <div className="typing-indicator">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              )}
              
              <div ref={endRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="chat-input-container">
            <div className="chat-input-wrapper">
              <textarea
                ref={inputRef}
                placeholder="Digite sua mensagem..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading || showOnboarding}
                className="chat-input"
                rows={1}
              />
              <button 
                onClick={() => sendMessage(input)} 
                disabled={isLoading || !input.trim() || showOnboarding}
                className="chat-send-button"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
