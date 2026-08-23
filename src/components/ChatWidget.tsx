/**
 * ChatWidget V2 - Estilo divertido e colorido
 * Inspirado na LandingV3 com cards tortos e elementos jogados
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Send, Minus, RotateCcw, Sparkles, Calendar, MessageCircle, Bot } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import aiChatIcon from '@/assets/ai-chat-icon.png';
import { ContextManager } from '@/core/orchestrator/contextManager';
import { langGraphOrchestrate, listEventsOrchestrate, resumeSession } from '@/langgraph/workflow';
import { SupabaseCheckpointer } from '@/langgraph/checkpointer';
import { UUID } from '@/types/domain';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
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

// Cores divertidas por categoria
const categoryColors: Record<string, string> = {
  comida: '#FF6B35',
  proteina: '#FF6B35',
  acompanhamento: '#FFD93D',
  bebida: '#00B8D4',
  refrigerante: '#00B8D4',
  combustivel: '#FF4800',
  suprimento: '#9CA3AF',
  decoracao: '#FF69B4',
  descartaveis: '#6B7280',
  geral: '#8B5CF6',
};

// Cores para cards do onboarding
const onboardingColors = [
  { bg: '#FFD93D', accent: '#FF6B35', iconColor: '#000' },
  { bg: '#A8D8FF', accent: '#0066CC', iconColor: '#000' },
];

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
    const checkpointer = new SupabaseCheckpointer();
    await checkpointer.deleteThread(user.id);
    await new Promise(resolve => setTimeout(resolve, 200));
    setEventoId(undefined);
    setMessages([]);
    setHasGreeted(false);
    setWasMinimized(false);
    hasLoadedHistory.current = false;
    setShowOnboarding(false);
    setMessages([{
      role: 'assistant',
      content: 'Olá! 👋 Sou o UNE.AI, seu assistente para planejar eventos.\n\nMe conta: que tipo de festa você quer organizar? 🎉'
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
      const result = await listEventsOrchestrate(user.id as UUID);
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
        toast({ title: 'Eventos carregados', description: `Selecione um evento para continuar.` });
      } else if (result.success && (!result.events || result.events.length === 0)) {
        setMessages([{
          role: 'assistant',
          content: '📭 Você não tem eventos pendentes para editar no momento.\n\nQue tal criar um novo evento? ✨',
          suggestedReplies: ['Criar novo evento']
        }]);
        setShowOnboarding(false);
        toast({ title: 'Nenhum evento', description: 'Você não tem eventos pendentes.' });
      }
    } catch (error) {
      console.error('[ChatWidget] Erro ao listar eventos:', error);
      toast({ title: 'Erro ao carregar eventos', description: 'Não foi possível carregar seus eventos.', variant: 'destructive' });
    }
  };

  const handleEditEvent = async (event: any) => {
    if (!user?.id) return;
    console.log('[ChatWidget] Editar evento:', event);
    setEventoId(event.id);
    setShowOnboarding(false);
    setMessages([{
      role: 'assistant',
      content: `✏️ Vou ajudar você a editar o evento **"${event.title}"**.\n\nO que você gostaria de modificar?`
    }]);
    setHasGreeted(true);
    await contextManager.updateContext(user.id as UUID, 'draft', {}, [], 0.5, undefined, event.id, undefined);
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
        const session = await resumeSession(user.id as UUID);
        
        if (session.evento_id) {
          setEventoId(Number(session.evento_id));
        }

        setMessages([{
          role: 'assistant',
          content: session.mensagem,
          suggestedReplies: session.suggestedReplies,
        }]);
        setShowOnboarding(false);
        setHasGreeted(true);
      } catch (err) {
        console.error('[ChatWidget] Error loading context:', err);
        setShowOnboarding(true);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistoryAndContext();
  }, [open, user?.id]);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, isTyping]);

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
      const response = await langGraphOrchestrate(text, user.id as UUID, eventoId ? String(eventoId) : undefined);
      if (response.evento_id) {
        setEventoId(Number(response.evento_id));
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
          toast({ title: response.toast || 'Evento criado com sucesso!', description: 'Atualizando dashboard...' });
          setTimeout(() => window.location.reload(), 1000);
        }, 1500);
      }
    } catch (error: any) {
      console.error('[ChatWidget] Error processing message:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: `😅 ${error.message || 'Ops! Algo deu errado. Pode tentar de novo?'}` }]);
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
      {/* Botão Flutuante - Estilo Sticker */}
      <motion.div 
        className="fixed bottom-6 left-6 z-50"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.5, type: "spring" }}
      >
        <motion.button
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-16 h-16 rounded-2xl border-[3px] border-black bg-gradient-to-br from-[#FF6B35] to-[#FFD93D] shadow-[5px_5px_0px_0px_#000000] flex items-center justify-center group overflow-hidden"
        >
          <Bot className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-300" />
          
          {/* Sticker decorativo */}
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#FF69B4] border-[2px] border-black" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-[#A8D8FF] border-[2px] border-black" />
        </motion.button>
        
        {/* Tooltip */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="absolute left-20 top-4 px-4 py-2 rounded-xl border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_#000000] whitespace-nowrap font-bold text-sm transform rotate-2"
        >
          IA UNE 🤖
        </motion.div>
      </motion.div>

      {/* Chat Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[420px] flex flex-col border-r-[3px] border-black p-0 gap-0 sm:max-w-md bg-white" hideCloseButton={true}>
          
          {/* Header Colorido e Divertido */}
          <SheetHeader className="p-4 shrink-0 bg-gradient-to-r from-[#FF6B35] via-[#FFD93D] to-[#A8D8FF] border-b-[3px] border-black">
            <div className="relative flex items-center justify-between">
              <SheetTitle className="flex items-center gap-3 text-black">
                <motion.div 
                  className="w-12 h-12 rounded-xl overflow-hidden border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center transform -rotate-3"
                  whileHover={{ rotate: 3 }}
                >
                  <Bot className="w-7 h-7 text-[#FF6B35]" />
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-lg font-black">UNE.AI</span>
                  <span className="text-xs font-bold text-black/70 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse border border-black"></span>
                    Online e animado!
                  </span>
                </div>
              </SheetTitle>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-9 h-9 rounded-lg border-[2px] border-black bg-white/80 hover:bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  onClick={handleMinimize}
                  title="Minimizar"
                >
                  <Minus className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-9 h-9 rounded-lg border-[2px] border-black bg-[#FF69B4] hover:bg-[#ff50a8] flex items-center justify-center shadow-[2px_2px_0px_0px_#000000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  onClick={async () => await resetEverything()}
                  title="Reiniciar"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            </div>
          </SheetHeader>

          {/* Área de Mensagens */}
          <ScrollArea className="flex-1 bg-[#F8F9FA]" ref={scrollAreaRef}>
            <div className="flex flex-col gap-4 p-4 pb-8">
              
              {/* Onboarding - Cards Tortos e Coloridos */}
              <AnimatePresence>
                {showOnboarding && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="text-center space-y-2 mb-6">
                      <motion.h2 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-2xl font-black text-black"
                      >
                        O que vamos planejar? 🎉
                      </motion.h2>
                      <p className="text-gray-600 font-medium text-sm">
                        Escolha uma opção para começar
                      </p>
                    </div>

                    {/* Card 1: Criar Novo Evento */}
                    <motion.div
                      initial={{ rotate: -3, x: -10 }}
                      animate={{ rotate: -2, x: 0 }}
                      whileHover={{ rotate: 0, scale: 1.02, y: -4 }}
                      className="cursor-pointer"
                      onClick={handleCreateNewEvent}
                    >
                      <div className="rounded-2xl border-[3px] border-black p-5 shadow-[5px_5px_0px_0px_#000000] transition-all hover:shadow-[2px_2px_0px_0px_#000000] bg-[#FFD93D]">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center transform rotate-3">
                            <Sparkles className="w-7 h-7 text-[#FF6B35]" />
                          </div>
                          <div>
                            <div className="font-black text-lg text-black">Criar Novo Evento</div>
                            <div className="text-sm text-black/70 font-medium">
                              Começar do zero com um novo rolê
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Card 2: Editar Eventos */}
                    <motion.div
                      initial={{ rotate: 2, x: 10 }}
                      animate={{ rotate: 1, x: 0 }}
                      whileHover={{ rotate: 0, scale: 1.02, y: -4 }}
                      className="cursor-pointer"
                      onClick={handleListEvents}
                    >
                      <div className="rounded-2xl border-[3px] border-black p-5 shadow-[5px_5px_0px_0px_#000000] transition-all hover:shadow-[2px_2px_0px_0px_#000000] bg-[#A8D8FF]">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center transform -rotate-3">
                            <Calendar className="w-7 h-7 text-[#0066CC]" />
                          </div>
                          <div>
                            <div className="font-black text-lg text-black">Editar Eventos</div>
                            <div className="text-sm text-black/70 font-medium">
                              Ver seus rolês em aberto
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Elemento decorativo */}
                    <div className="flex justify-center gap-2 mt-4">
                      <div className="w-3 h-3 rounded-full bg-[#FF69B4] border-[2px] border-black" />
                      <div className="w-3 h-3 rounded-full bg-[#FFD93D] border-[2px] border-black" />
                      <div className="w-3 h-3 rounded-full bg-[#A8D8FF] border-[2px] border-black" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mensagens */}
              {!showOnboarding && messages.map((msg, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-10 h-10 rounded-xl border-[3px] border-black bg-[#FFD93D] shadow-[2px_2px_0px_0px_#000000] flex-shrink-0 flex items-center justify-center transform -rotate-2">
                        <Bot className="w-5 h-5 text-black" />
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2">
                      {/* Bolha de mensagem */}
                      <div 
                        className={`px-4 py-3 rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_#000000] ${
                          msg.role === 'user' 
                            ? 'bg-[#FF6B35] text-white rounded-br-none' 
                            : 'bg-white text-black rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                      </div>

                      {/* Lista de Itens */}
                      {msg.items && msg.items.length > 0 && (
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="rounded-xl border-[3px] border-black bg-white shadow-[4px_4px_0px_0px_#000000] p-3 mt-2"
                        >
                          <div className="font-black text-sm mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[#FFD93D] border-[2px] border-black flex items-center justify-center text-xs">📋</span>
                            Itens do Evento
                          </div>
                          <div className="space-y-2">
                            {msg.items.map((item, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between p-2 rounded-lg border-[2px] border-black/10 bg-gray-50"
                              >
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-8 h-8 rounded-lg border-[2px] border-black flex items-center justify-center text-sm"
                                    style={{ backgroundColor: categoryColors[item.categoria] || '#6B7280' }}
                                  >
                                    {categoryIcons[item.categoria] || '📋'}
                                  </div>
                                  <div>
                                    <span className="font-bold text-sm block">{item.nome_item}</span>
                                    <span className="text-xs text-gray-500">{item.categoria}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-sm">{item.quantidade} {item.unidade}</span>
                                  {item.valor_estimado > 0 && (
                                    <span className="text-xs text-gray-500 block">R$ {item.valor_estimado.toFixed(2)}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-2 border-t-2 border-black/10 font-black text-right">
                            Total: R$ {msg.items.reduce((sum, item) => sum + (item.valor_estimado || 0), 0).toFixed(2)}
                          </div>
                        </motion.div>
                      )}

                      {/* Cards de Eventos */}
                      {msg.eventSelect && msg.eventSelect.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.eventSelect.map((event, idx) => (
                            <motion.div
                              key={event.id}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: idx * 0.1 }}
                              whileHover={{ scale: 1.02 }}
                              className="cursor-pointer"
                              onClick={() => handleEditEvent(event)}
                            >
                              <div className="rounded-xl border-[3px] border-black bg-[#A8D8FF] shadow-[3px_3px_0px_0px_#000000] p-3 flex items-center justify-between hover:shadow-[1px_1px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                                <div>
                                  <span className="font-black text-sm block">{event.title}</span>
                                  <span className="text-xs text-black/70">{formatDateDisplay(event.date)}</span>
                                </div>
                                <span className="px-3 py-1 rounded-lg bg-black text-white font-bold text-xs">
                                  Editar ✏️
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Sugestões de Resposta */}
                      {msg.suggestedReplies && msg.suggestedReplies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {msg.suggestedReplies.map((reply, idx) => (
                            <motion.button
                              key={idx}
                              whileHover={!isLoading ? { scale: 1.05, y: -2 } : {}}
                              whileTap={!isLoading ? { scale: 0.95 } : {}}
                              onClick={() => handleSuggestedReply(reply)}
                              disabled={isLoading}
                              className={`px-3 py-1.5 rounded-full border-[2px] border-black bg-[#FFD93D] shadow-[2px_2px_0px_0px_#000000] font-bold text-xs hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {reply}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && !showOnboarding && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-2">
                    <div className="w-10 h-10 rounded-xl border-[3px] border-black bg-[#FFD93D] shadow-[2px_2px_0px_0px_#000000] flex-shrink-0 flex items-center justify-center transform -rotate-2">
                      <Bot className="w-5 h-5 text-black" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_#000000] rounded-bl-none flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={endRef} />
            </div>
          </ScrollArea>

          {/* Input Area Estilizado */}
          <div className="p-4 bg-white border-t-[3px] border-black">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  placeholder={showOnboarding ? "Escolha uma opção acima..." : "Digite sua mensagem..."}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading || showOnboarding}
                  className="w-full px-4 py-3 rounded-xl border-[3px] border-black shadow-[3px_3px_0px_0px_#000000] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] focus:outline-none resize-none bg-white disabled:bg-gray-100 font-medium"
                  rows={1}
                />
              </div>
              <motion.button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim() || showOnboarding}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-3 rounded-xl border-[3px] border-black bg-[#FF6B35] shadow-[3px_3px_0px_0px_#000000] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center"
              >
                <Send size={20} />
              </motion.button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
