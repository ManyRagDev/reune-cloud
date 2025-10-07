import { useEffect, useMemo, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send } from 'lucide-react';
import { orchestrate } from '@/core/orchestrator/chatOrchestrator';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ConversationState } from '@/types/domain';
import { runToolCall } from '@/api/llm/toolsRouter';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

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

  const canShow = !!user && !loading;
  const idempotencyBase = useMemo(() => `${Date.now()}`, []);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Saudação inicial fixa (sem LLM) ao abrir o chat
  useEffect(() => {
    if (open && !hasGreeted && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Olá! Sou o UNE.AI e vou ajudar a organizar seus eventos. Diga o tipo de evento e quantas pessoas.'
      }]);
      setHasGreeted(true);
    }
  }, [open, hasGreeted, messages.length]);

  useEffect(() => {
    if (open && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages.length]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    try {
      // Construir estado de conversa com histórico para dar contexto ao LLM
      const userMessage: ChatMessage = { role: 'user', content: text };
      const history = convState?.history ?? [];
      const state: ConversationState = {
        conversationId: convState?.conversationId || `chat-${user?.id || 'anon'}`,
        context: { ...(convState?.context || {}), eventoId },
        history,
        lastUpdated: convState?.lastUpdated || Date.now(),
      };

      const res = await orchestrate(
        text,
        user?.id || 'dev',
        eventoId,
        stagnationCount >= 2,
        messages.slice(-6)
      );

      // Lógica anti-loop
      if (res.estado === lastState) {
        setStagnationCount((prev) => prev + 1);
      } else {
        setStagnationCount(0);
        setLastState(res.estado);
      }

      const assistantMessage: ChatMessage = { role: 'assistant', content: res.mensagem };
      setMessages((prev) => [...prev, assistantMessage]);

      // Se houver toolCalls e o evento_id for retornado, manter no estado para contexto futuro
      if (res.evento_id) setEventoId(res.evento_id || undefined);

      // Executar chamadas de ferramenta retornadas, se existirem
      if (Array.isArray(res.toolCalls) && res.toolCalls.length > 0) {
        for (const tc of res.toolCalls) {
          try {
            // Garantir que o evento_id esteja presente nos argumentos
            const args = { ...(tc.arguments || {}), evento_id: res.evento_id || eventoId };
            await runToolCall(user?.id || 'dev', { name: tc.name, arguments: args });
          } catch (err) {
            console.warn('[ChatWidget] Falha ao executar tool call', tc?.name, err);
          }
        }
      }

      // Atualizar estado de conversa com a resposta
      setConvState({
        ...state,
        context: {
          eventoId: res.evento_id || eventoId,
          tipo_evento: res.tipo_evento,
          qtd_pessoas: res.qtd_pessoas,
        },
        history: [...history, userMessage, assistantMessage],
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
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          variant="floating"
          size="lg"
          onClick={() => setOpen(true)}
          aria-label="Abrir chat"
          className="rounded-full shadow-floating flex items-center gap-2"
        >
          <MessageSquare className="w-5 h-5" />
          Chat
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
                          : 'inline-block bg-accent text-accent-foreground px-3 py-2 rounded-xl'
                      }
                    >
                      {m.content}
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