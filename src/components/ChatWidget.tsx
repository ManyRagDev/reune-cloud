import { useEffect, useMemo, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Send, RotateCcw, Minus, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import aiChatIcon from '@/assets/ai-chat-icon.png';
import { ConversationMessagesRepository } from '@/db/repositories/conversationMessages';
import { ContextManager } from '@/core/orchestrator/contextManager';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  suggestedReplies?: string[]; // Quick replies clicáveis
  items?: Array<{
    nome_item: string;
    quantidade: number;
    unidade: string;
    categoria: string;
    valor_estimado: number;
  }>;
};

export default function ChatWidget() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [eventoId, setEventoId] = useState<string | undefined>(undefined);
  const [stagnationCount, setStagnationCount] = useState(0);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const hasLoadedHistory = useRef(false);

  const canShow = !!user && !loading;
  const idempotencyBase = useMemo(() => `${Date.now()}`, []);
  const endRef = useRef<HTMLDivElement | null>(null);
  const contextManager = useMemo(() => new ContextManager(), []);

  // Carregar histórico ao abrir o chat
  useEffect(() => {
    const loadHistory = async () => {
      if (!open || !user?.id || hasLoadedHistory.current) return;

      setIsLoadingHistory(true);
      hasLoadedHistory.current = true;

      try {
        const messagesRepo = new ConversationMessagesRepository();
        const savedMessages = await messagesRepo.getByUserId(user.id);

        if (savedMessages.length > 0) {
          console.log('[ChatWidget] Histórico carregado:', savedMessages.length, 'mensagens');

          const chatMessages: ChatMessage[] = savedMessages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

          setMessages(chatMessages);
        } else if (!hasGreeted) {
          // Sem histórico, mostrar greeting inicial
          setMessages([{
            role: 'assistant',
            content: 'Olá! Sou o UNE.AI e vou ajudar a organizar seus eventos. Diga o tipo de evento e quantas pessoas.'
          }]);
          setHasGreeted(true);
        }
      } catch (error) {
        console.error('[ChatWidget] Erro ao carregar histórico:', error);
        // Fallback para greeting
        if (!hasGreeted) {
          setMessages([{
            role: 'assistant',
            content: 'Olá! Sou o UNE.AI e vou ajudar a organizar seus eventos. Diga o tipo de evento e quantas pessoas.'
          }]);
          setHasGreeted(true);
        }
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [open, user, hasGreeted]);

  useEffect(() => {
    if (open && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages.length]);

  const sendMessage = async (retryCount = 0) => {
    const text = input.trim();
    if (!text || sending || !user?.id) return;
    setSending(true);
    setIsTyping(true);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');

    const maxRetries = 3;
    const timeout = 30000; // 30 segundos

    try {
      // Salvar mensagem do usuário no banco
      await contextManager.saveMessage(
        user.id,
        'user',
        text,
        eventoId ? Number(eventoId) : undefined
      );

      // Buscar API key dos secrets
      const { supabase } = await import('@/integrations/supabase/client');
      const apiKey = import.meta.env.VITE_CHAT_API_SECRET_KEY;

      console.log('[ChatWidget] Verificando API key:', apiKey ? 'Presente' : 'Ausente');

      if (!apiKey) {
        throw new Error('API key não configurada. Entre em contato com o suporte.');
      }

      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const requestUrl = '/api/chat';
      const requestBody = {
        message: text,
        userId: user.id,
        ...(eventoId && { eventId: eventoId })
      };

      console.log('[ChatWidget] Enviando requisição para:', requestUrl);
      console.log('[ChatWidget] Body:', requestBody);

      try {
        // Chamar endpoint externo com autenticação e timeout
        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        console.log('[ChatWidget] Resposta recebida. Status:', response.status);

        clearTimeout(timeoutId);

        // Tratamento específico de erros HTTP
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Autenticação falhou. Verifique suas credenciais ou entre em contato com o suporte.');
          }
          if (response.status === 429) {
            throw new Error('Muitas requisições. Aguarde um momento antes de tentar novamente.');
          }
          if (response.status >= 500) {
            // Erro do servidor - tentar retry
            if (retryCount < maxRetries) {
              const delay = Math.pow(2, retryCount) * 1000; // Backoff exponencial
              console.log(`[ChatWidget] Erro ${response.status}, tentando novamente em ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return sendMessage(retryCount + 1);
            }
            throw new Error('Serviço temporariamente indisponível. Tente novamente em alguns instantes.');
          }
          throw new Error(`Erro na comunicação com o servidor (${response.status})`);
        }

        const data = await response.json();
        console.log('[ChatWidget] Resposta do endpoint:', data);

        // Adaptar resposta do endpoint para o formato esperado
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.reply || data.message || data.mensagem || 'Desculpe, não consegui processar sua mensagem.',
          suggestedReplies: data.suggestedReplies || data.suggested_replies,
          items: data.items || data.itens
        };
        setIsTyping(false);
        setMessages((prev) => [...prev, assistantMessage]);

        // Processar evento criado/atualizado
        let newEventoId = data.eventoId || data.evento_id;

        // FALLBACK: Se o backend não retornou ID mas identificou intenção de criar evento
        if (!newEventoId && (data.intent === 'criar_evento' || data.intencao === 'criar_evento')) {
          console.log('[ChatWidget] Backend não retornou ID. Gerando ID localmente...');
          newEventoId = crypto.randomUUID();
        }

        if (newEventoId && newEventoId !== eventoId) {
          console.log('[ChatWidget] Novo evento detectado:', newEventoId);

          // Se há dados do evento retornados, criar/atualizar no Supabase
          const eventoData = data.evento || data.event || {
            title: 'Novo Evento',
            tipo_evento: data.parameters?.eventType || data.parameters?.tipo_evento,
            qtd_pessoas: data.parameters?.quantity || data.parameters?.qtd_pessoas,
          };

          if (eventoData) {
            // Verificar se evento já existe
            const { data: existingEvent } = await supabase
              .from('table_reune')
              .select('id')
              .eq('id', newEventoId)
              .single();

            if (!existingEvent) {
              // Criar novo evento
              const { error: eventError } = await supabase
                .from('table_reune')
                .insert([{
                  id: newEventoId,
                  user_id: user.id,
                  title: eventoData.title || eventoData.titulo || 'Novo Evento',
                  description: eventoData.description || eventoData.descricao,
                  event_date: eventoData.event_date || eventoData.data_evento || new Date().toISOString().split('T')[0],
                  event_time: eventoData.event_time || eventoData.hora_evento || '12:00',
                  location: eventoData.location || eventoData.localizacao,
                  tipo_evento: eventoData.tipo_evento,
                  qtd_pessoas: eventoData.qtd_pessoas,
                  categoria_evento: eventoData.categoria_evento,
                  subtipo_evento: eventoData.subtipo_evento,
                  finalidade_evento: eventoData.finalidade_evento,
                  created_by_ai: true,
                  status: 'active'
                }]);

              if (eventError) {
                console.error('[ChatWidget] Erro ao criar evento:', eventError);
              } else {
                console.log('[ChatWidget] Evento criado com sucesso:', newEventoId);
              }
            }
          }

          setEventoId(newEventoId);
        }

        // Processar itens retornados
        if (assistantMessage.items && assistantMessage.items.length > 0 && (newEventoId || eventoId)) {
          console.log('[ChatWidget] Salvando itens no banco:', assistantMessage.items.length);

          const eventIdToUse = newEventoId || eventoId;

          // Usar função RPC para substituir itens (apenas para eventos criados pela IA)
          const { error: itemsError } = await supabase.rpc('items_replace_for_event', {
            evento_id: String(eventIdToUse),
            itens: assistantMessage.items
          });

          if (itemsError) {
            console.error('[ChatWidget] Erro ao salvar itens:', itemsError);
            throw new Error('Não foi possível salvar os itens no banco de dados.');
          } else {
            console.log('[ChatWidget] Itens salvos com sucesso');
          }
        }

        // Salvar mensagem do assistente no banco
        await contextManager.saveMessage(
          user.id,
          'assistant',
          assistantMessage.content,
          (newEventoId || eventoId) ? Number(newEventoId || eventoId) : undefined
        );
      } catch (timeoutError) {
        clearTimeout(timeoutId);
        if (timeoutError instanceof Error && timeoutError.name === 'AbortError') {
          throw new Error('A requisição demorou muito tempo. Tente novamente.');
        }
        throw timeoutError;
      }

    } catch (e) {
      console.error('[ChatWidget] Erro ao enviar mensagem:', e);

      setIsTyping(false);
      // Remover mensagem do usuário em caso de erro fatal
      setMessages((prev) => prev.slice(0, -1));

      let errorMessage = 'Ocorreu um erro ao processar sua solicitação.';
      if (e instanceof Error) {
        console.error('[ChatWidget] Detalhes do erro:', e.message, e.stack);

        if (e.message.toLowerCase().includes('failed to fetch') || e.name === 'NetworkError') {
          errorMessage = 'Não foi possível conectar ao servidor de chat. O serviço pode estar temporariamente indisponível. Verifique sua conexão ou tente novamente em alguns instantes.';
        } else if (e.message.includes('API key')) {
          errorMessage = e.message; // Mensagem específica sobre API key
        } else if (e.message.includes('Autenticação')) {
          errorMessage = e.message; // Mensagem específica de autenticação
        } else if (e.message.includes('banco de dados')) {
          errorMessage = e.message + ' O evento foi processado, mas pode não estar salvo.';
        } else if (e.message.includes('demorou muito tempo')) {
          errorMessage = e.message + ' O servidor pode estar lento.';
        } else {
          errorMessage = e.message || errorMessage;
        }
      }

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `❌ ${errorMessage}\n\nPor favor, tente novamente ou entre em contato com o suporte se o problema persistir.`
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = () => sendMessage(0);

  const handleRestart = async () => {
    if (!user?.id) return;

    try {
      // Limpar contexto e histórico no banco
      await contextManager.clearUserContext(user.id);

      // Resetar estado local
      setMessages([{
        role: 'assistant',
        content: 'Olá! Sou o UNE.AI e vou ajudar a organizar seus eventos. Diga o tipo de evento e quantas pessoas.'
      }]);
      setEventoId(undefined);
      setStagnationCount(0);
      setHasGreeted(true);
      hasLoadedHistory.current = false;

      console.log('[ChatWidget] Chat reiniciado com sucesso');
    } catch (error) {
      console.error('[ChatWidget] Erro ao reiniciar chat:', error);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Ocorreu um erro ao reiniciar o chat. Tente novamente.'
      }]);
    }
  };

  const handleMinimize = () => {
    setOpen(false);
  };

  const handleClose = async () => {
    await handleRestart();
    setOpen(false);
  };

  if (!canShow) return null;

  return (
    <>
      {/* Botão flutuante fixo no canto inferior direito */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setOpen(true)}
          aria-label="Abrir chat"
          className="rounded-full p-0 w-16 h-16 overflow-hidden bg-transparent hover:bg-transparent border-0 shadow-none hover:scale-110 transition-transform"
        >
          <img src={aiChatIcon} alt="Chat IA" className="w-full h-full object-cover" />
        </Button>
      </div>

      {/* Painel lateral com histórico e input */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex flex-col h-full w-full sm:max-w-sm [&>button]:hidden">
          <SheetHeader>
            <div className="flex items-center justify-between w-full">
              <SheetTitle>Assistente UNE.AI</SheetTitle>
              <SheetDescription className="sr-only">
                Assistente virtual para ajudar na organização de eventos.
              </SheetDescription>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleMinimize}
                  aria-label="Minimizar chat"
                  title="Minimizar"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleClose}
                  disabled={sending || isLoadingHistory}
                  aria-label="Fechar e limpar histórico"
                  title="Fechar e limpar"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>
          <div className="flex-1 mt-4">
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-3">
                {messages.map((m, idx) => (
                  <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                    <div
                      className={
                        m.role === 'user'
                          ? 'inline-block bg-primary text-primary-foreground px-3 py-2 rounded-xl'
                          : 'inline-block bg-accent text-accent-foreground px-3 py-2 rounded-xl max-w-full'
                      }
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>

                      {/* Renderizar lista de itens se presente */}
                      {m.items && m.items.length > 0 && (
                        <div className="mt-3 space-y-2 text-sm">
                          {m.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex justify-between items-start gap-3 py-1 border-b border-border/30 last:border-0">
                              <div className="flex-1">
                                <div className="font-medium">{item.nome_item}</div>
                                <div className="text-xs opacity-70 capitalize">{item.categoria}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{item.quantidade} {item.unidade}</div>
                                <div className="text-xs opacity-70">R$ {item.valor_estimado.toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                          <div className="pt-2 font-bold text-right border-t border-border">
                            Total: R$ {m.items.reduce((sum, item) => sum + item.valor_estimado, 0).toFixed(2)}
                          </div>
                        </div>
                      )}

                      {/* Renderizar sugestões de resposta rápida */}
                      {m.suggestedReplies && m.suggestedReplies.length > 0 && m.role === 'assistant' && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {m.suggestedReplies.map((reply, replyIdx) => (
                            <Button
                              key={replyIdx}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setInput(reply);
                                setTimeout(() => handleSendMessage(), 100);
                              }}
                              className="text-xs"
                            >
                              {reply}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Indicador de digitação */}
                {isTyping && (
                  <div className="text-left">
                    <div className="inline-block bg-accent text-accent-foreground px-3 py-2 rounded-xl">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={endRef} />
              </div>
            </ScrollArea>
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={sending}
            />
            <Button onClick={handleSendMessage} disabled={sending} aria-label="Enviar">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}