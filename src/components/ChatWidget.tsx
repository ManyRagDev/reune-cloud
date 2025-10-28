import { useEffect, useMemo, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { orchestrate } from '@/core/orchestrator/chatOrchestrator';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ConversationState } from '@/types/domain';
import { runToolCall } from '@/api/llm/toolsRouter';
import aiChatIcon from '@/assets/ai-chat-icon.png';
import { ConversationMessagesRepository } from '@/db/repositories/conversationMessages';

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
  const [convState, setConvState] = useState<ConversationState | undefined>(undefined);
  const [lastState, setLastState] = useState<string | undefined>(undefined);
  const [stagnationCount, setStagnationCount] = useState(0);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const hasLoadedHistory = useRef(false);

  const canShow = !!user && !loading;
  const idempotencyBase = useMemo(() => `${Date.now()}`, []);
  const endRef = useRef<HTMLDivElement | null>(null);

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

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || !user?.id) return;
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    try {
      // Chamar orquestrador (ele carrega o histórico internamente agora)
      const res = await orchestrate(
        text,
        user.id,
        eventoId,
        stagnationCount >= 2
        // histórico não é mais necessário - gerenciado internamente
      );

      // Lógica anti-loop
      if (res.estado === lastState) {
        setStagnationCount((prev) => prev + 1);
      } else {
        setStagnationCount(0);
        setLastState(res.estado);
      }

      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: res.mensagem,
        suggestedReplies: res.suggestedReplies,
        items: res.showItems && res.snapshot?.itens ? res.snapshot.itens : undefined
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Atualizar evento_id no estado se retornado
      if (res.evento_id) setEventoId(res.evento_id);

      // Executar chamadas de ferramenta retornadas, se existirem
      if (Array.isArray(res.toolCalls) && res.toolCalls.length > 0) {
        for (const tc of res.toolCalls) {
          try {
            const args = { ...(tc.arguments || {}), evento_id: res.evento_id || eventoId };
            await runToolCall(user?.id || 'dev', { name: tc.name, arguments: args });
          } catch (err) {
            console.warn('[ChatWidget] Falha ao executar tool call', tc?.name, err);
          }
        }
      }

      // Atualizar estado de conversa (histórico agora é persistido automaticamente)
      setConvState({
        conversationId: convState?.conversationId || `chat-${user.id}`,
        context: {
          eventoId: res.evento_id || eventoId,
          tipo_evento: res.tipo_evento,
          qtd_pessoas: res.qtd_pessoas,
        },
        history: [], // Não precisa mais duplicar, está no banco
        lastUpdated: Date.now(),
      });
    } catch (e) {
      console.error('[ChatWidget] Erro ao enviar mensagem:', e);
      let errorMessage = 'Ocorreu um erro ao processar sua solicitação. Tente novamente.';
      if (e instanceof Error) {
        console.error('[ChatWidget] Detalhes do erro:', e.message, e.stack);
        if (e.message.toLowerCase().includes('failed to fetch')) {
          errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.';
        } else {
          errorMessage = `Erro: ${e.message}`;
        }
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setSending(false);
    }
  };

  if (!canShow) return null;

  return (
    <>
      {/* Botão flutuante fixo no canto inferior direito */}
      {/* NOTA: Botão oculto visualmente, mas mantendo toda funcionalidade intacta */}
      <div className="fixed bottom-6 right-6 z-50 hidden">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setOpen(true)}
          aria-label="Abrir chat"
          className="rounded-full p-0 w-16 h-16 overflow-hidden bg-transparent hover:bg-transparent border-0 shadow-none"
        >
          <img src={aiChatIcon} alt="Chat IA" className="w-full h-full object-cover" />
        </Button>
      </div>

      {/* Painel lateral com histórico e input */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex flex-col h-full w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Assistente UNE.AI</SheetTitle>
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
                                setTimeout(() => sendMessage(), 100);
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
                  sendMessage();
                }
              }}
              disabled={sending}
            />
            <Button onClick={sendMessage} disabled={sending} aria-label="Enviar">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}