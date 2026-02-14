/**
 * Orquestrador Simplificado usando Groq
 * Versão final: Prioridade IA, Regex Passivo e Persistência de Contexto
 */

import { UUID, EventStatus, ChatUiPayload, ListEventsPayload, RecentEvent } from '@/types/domain';
import { processMessage, executeItemEdit } from '@/services/groqService';
import { ContextManager } from './contextManager';
import { getPlanSnapshot } from './eventManager';
import { wrapWithConversationalTone, ActionType } from './conversationalResponse';
import { EventsRepository } from '@/db/repositories/events';
import { validateEventDate } from '@/core/nlp/date-parser';
import { parseItemCommand, detectEditIntentFromMessage } from './itemCommands';

/**
 * Lista eventos recentes do usuário para edição
 * Retorna eventos em status "em aberto" (draft, collecting_core, aguardando_data, aguardando_preferencia_menu, itens_pendentes_confirmacao)
 */
export async function listUserEvents(userId: UUID): Promise<ListEventsPayload> {
  const eventsRepo = new EventsRepository();
  const events = await eventsRepo.getAllOpenEvents(userId);

  return {
    success: true,
    events
  };
}

/**
 * Função auxiliar para lidar com listagem de eventos
 */
async function handleListEvents(userId: UUID): Promise<ChatUiPayload> {
  console.log('[simpleOrchestrator] Listar eventos clicado');

  const result = await listUserEvents(userId);

  return {
    estado: 'idle' as EventStatus,
    evento_id: null,
    mensagem: result.events.length > 0
      ? `Você tem ${result.events.length} evento(s) em aberto. Escolha um para editar ou crie um novo.`
      : 'Você não tem eventos pendentes. Crie um novo evento para começar!',
    showItems: false,
    suggestedReplies: result.events.map((e: RecentEvent) => e.title),
    success: true,
    events: result.events
  };
}

export async function simpleOrchestrate(
  userText: string,
  userId: UUID,
  eventoId?: UUID,
  action?: 'list_events' | 'create_event'
): Promise<ChatUiPayload> {
  // 🔥 NOVO: Suportar ação de listar eventos
  if (action === 'list_events') {
    return await handleListEvents(userId);
  }

  // SANITIZAÇÃO: Garantir que string 'null' ou 'undefined' vira undefined
  if (eventoId === 'null' as any || eventoId === 'undefined' as any) {
    eventoId = undefined;
  }

  const contextManager = new ContextManager();

  //1. Carregar contexto e histórico
  const { context: savedContext, history } = await contextManager.loadUserContext(userId);

  //2. Verificar timeout de sessão para detectar nova conversa
  const SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 horas
  const lastChatTime = localStorage.getItem(`reune_last_chat_${userId}`);
  const isTimeout = lastChatTime ? (Date.now() - Number(lastChatTime) > SESSION_TIMEOUT_MS) : false;

  if (isTimeout) {
    if (!savedContext.evento_id) {
      // Sem evento ativo: limpar tudo normalmente
      console.log('[simpleOrchestrator] Timeout: sem evento ativo, limpando contexto');
      await contextManager.clearUserContext(userId);
      savedContext.evento_id = undefined;
    } else {
      // Há evento ativo: resetar só o histórico, preservar o evento
      console.log('[simpleOrchestrator] Timeout: evento ativo preservado, histórico resetado');
      history.length = 0;
    }
  }

  //3. Contexto de dados coletados (apenas do histórico, sem regex)
  const collectedData = (savedContext.collected_data || {}) as Record<string, unknown>;

  //3.5. Identificar ID do evento (declarado ANTES do parseItemCommand — bug fix: temporal dead zone)
  // CRÍTICO: Se eventoId undefined explicitamente, sempre null (nunca usar savedContext como fallback)
  // Isso previne race condition onde o banco ainda não processou o clearUserContext
  const currentEventId: string | null = eventoId !== undefined
    ? (eventoId || null)
    : null;

  // Verificar se é comando de edição de itens (Track 012)
  // Pré-triagem com detectEditIntentFromMessage antes de chamar o LLM
  const editIntent = detectEditIntentFromMessage(userText);

  if (editIntent.isEditCommand && currentEventId) {
    if (editIntent.confidence === 'high') {
      // Alta confiança: tentar parseItemCommand diretamente, sem chamar LLM
      const itemCommand = parseItemCommand(userText);
      if (itemCommand) {
        console.log('[simpleOrchestrator] Edição de alta confiança:', itemCommand.operation);
        try {
          const editResult = await executeItemEdit(itemCommand, currentEventId, userId);
          await contextManager.saveMessage(userId, 'user', userText, Number(currentEventId));
          await contextManager.saveMessage(userId, 'assistant', editResult.message, Number(currentEventId));
          const snapshot = await getPlanSnapshot(currentEventId);
          return {
            estado: 'created' as EventStatus,
            evento_id: currentEventId,
            mensagem: editResult.message,
            snapshot: snapshot || undefined,
            showItems: true,
            suggestedReplies: ['Editar mais itens', 'Confirmar lista', 'Adicionar participantes'],
          };
        } catch (error) {
          console.error('[simpleOrchestrator] Erro ao editar item:', error);
          return {
            estado: 'created' as EventStatus,
            evento_id: currentEventId,
            mensagem: 'Ops! Não consegui fazer essa alteração. Pode tentar de outro jeito?',
            showItems: false,
            suggestedReplies: ['Ver lista completa', 'Cancelar'],
          };
        }
      }
      // Se parseItemCommand retornou null apesar de alta confiança, cai no LLM
    }
    // Confiança média/baixa: o LLM vai decidir (contexto de event ID já está disponível)
    console.log('[simpleOrchestrator] Possível edição (confiança:', editIntent.confidence, ') — delegando ao LLM');
  }

  //4. Processar mensagem com Groq (A IA decide o tipo do evento)

  const result = await processMessage(userText, history, userId, {
    collectedData,
    evento: currentEventId ? {
      id: currentEventId,
      status: savedContext.state,
      tipo_evento: savedContext.collected_data?.tipo_evento as string | undefined,
      qtd_pessoas: savedContext.collected_data?.qtd_pessoas as number | undefined,
      data_evento: savedContext.collected_data?.data_evento as string | undefined,
    } : undefined,
    hasItems: !!(savedContext.collected_data?.has_items),
  });

  //4.5. Validação de Data (Track 007)
  // Se a IA extraiu uma data, validar antes de prosseguir
  const extractedData = result.actionExecuted?.extractedData;
  if (extractedData?.data_evento) {
    const validation = validateEventDate(String(extractedData.data_evento));
    
    if (!validation.valid) {
      // Data no passado - retornar erro com sugestão de correção
      return {
        estado: savedContext.state || 'draft',
        evento_id: currentEventId || null,
        mensagem: validation.message,
        showItems: false,
        suggestedReplies: validation.suggestedDate 
          ? [`Sim, ${validation.suggestedDate.split('-').reverse().join('/')}`, 'Digitar outra data']
          : ['Digitar outra data'],
      };
    }
    
    if (validation.warning === 'too_close') {
      // Data muito próxima - alertar mas permitir continuar
      // Vamos adicionar um aviso na mensagem, mas salvar a data
      console.log('[simpleOrchestrator] Data próxima detectada:', validation.message);
    }
  }

  //5. Identificar o ID do evento (novo ou existente)
  // 🔥 CORREÇÃO DE BUG CRÍTICO: NUNCA usar savedContext.evento_id como fallback
  // Isso evita contaminar novas sessões com eventos antigos/finalizados
  let finalEventoId: number | null | undefined =
    (typeof result.actionExecuted?.eventoId === 'string' ? Number(result.actionExecuted.eventoId) : result.actionExecuted?.eventoId)
    || (typeof currentEventId === 'string' ? Number(currentEventId) : currentEventId);

  // SANITIZAÇÃO DE SAÍDA:
  if (finalEventoId === 'null' as any || finalEventoId === 'undefined' as any) {
    finalEventoId = undefined;
  }

  //6. Salvar Mensagens
  await contextManager.saveMessage(userId, 'user', userText, finalEventoId ? Number(finalEventoId) : undefined);
  await contextManager.saveMessage(userId, 'assistant', result.response, finalEventoId ? Number(finalEventoId) : undefined);

  //7. Persistência de Contexto Inteligente
  // Se a IA extraiu dados (extractedData) mas o evento ainda não existir, salve-os no contextManager para a próxima mensagem.
  if (result.actionExecuted?.extractedData) {
    await contextManager.updateContext(
      userId,
      savedContext.state || 'collecting_core',
      { ...collectedData, ...result.actionExecuted.extractedData },
      [], 0.9, undefined, finalEventoId ? Number(finalEventoId) : undefined
    );
  }

  //8. Carregar Snapshot para a UI
  let snapshot = null;
  if (finalEventoId) {
    try {
      snapshot = await getPlanSnapshot(String(finalEventoId));
      if (!snapshot) throw new Error('Snapshot nulo');
    } catch (error) {
      console.warn('Erro ao carregar snapshot (provavel ID órfão), limpando contexto...');
      await contextManager.updateContext(userId, 'idle', {}, [], 0.5, undefined, undefined);
      // Forçar refresh para o usuário
      return {
        estado: 'draft',
        mensagem: 'Ocorreu um erro de sincronia. Por favor, tente novamente.',
        evento_id: null,
        showItems: false
      };
    }
  }

  //9. Lógica de exibição da UI
  // Exibe itens se eles existirem, exceto para eventos finalizados
  let showItems = !!(snapshot?.itens && snapshot.itens.length > 0);
  if (snapshot?.evento?.status === 'finalized') {
    showItems = false;
  }

  //10. Construir Payload completo para não quebrar o ChatWidget
  const response: ChatUiPayload = {
    estado: (snapshot?.evento?.status || 'collecting_core') as EventStatus,
    evento_id: (finalEventoId && String(finalEventoId) !== 'null') ? String(finalEventoId) : null, // Garante NULL real
    mensagem: result.response,
    snapshot: snapshot || undefined,
    showItems: showItems,
    suggestedReplies: getSuggestedReplies(snapshot, result.response, userText),
  };

  //11. Finalização
  if (snapshot?.evento?.status === 'finalized') {
    response.closeChat = true;
    response.toast = 'Evento criado com sucesso!';
  } else if (result.actionExecuted?.type === 'update_event') {
    // Para edições, finalizamos a interação se foi bem sucedido
    response.closeChat = true;
    response.toast = 'Evento atualizado com sucesso!';
    // Não mostrar itens em atualizações simples
    showItems = false;
    response.showItems = false;
  }

  //12. Camada Conversacional Humana
  let detectedAction: ActionType | undefined;
  if (snapshot?.evento?.status === 'finalized') detectedAction = 'event_finalized';
  else if (snapshot?.evento?.status === 'created' && showItems) detectedAction = 'items_generated';

  if (detectedAction) {
    return wrapWithConversationalTone(response, {
      action: detectedAction,
      context: {
        eventType: snapshot?.evento?.tipo_evento,
        peopleCount: snapshot?.evento?.qtd_pessoas,
        hasItems: showItems,
        hasDate: !!snapshot?.evento?.data_evento,
      }
    });
  }

  return response;
}

/**
 * Gera sugestões de resposta baseadas no contexto atual e na resposta da IA
 * Analisa o que a IA perguntou para oferecer sugestões relevantes
 */
function getSuggestedReplies(
  snapshot: any,
  aiResponse: string,
  userMessage?: string
): string[] | undefined {
  const lower = aiResponse.toLowerCase();

  // Detectar o que a IA perguntou — sugestões espelham a pergunta
  if (lower.includes('quer criar') || lower.includes('posso criar') || lower.includes('pode criar')) {
    return ['Sim, criar!', 'Mudar data', 'Mudar quantidade'];
  }
  if (lower.includes('montar a lista') || lower.includes('gerar a lista') || lower.includes('gerar lista') || lower.includes('monte a lista')) {
    return ['Sim, gerar lista', 'Não, depois'];
  }
  if (lower.includes('quantas pessoas') || lower.includes('para quantas')) {
    return ['10 pessoas', '15 pessoas', '20 pessoas'];
  }
  if (lower.includes('para quando') || lower.includes('que dia') || lower.includes('qual a data') || lower.includes('quando é')) {
    return ['Este sábado', 'Próxima sexta', 'Daqui 2 semanas'];
  }
  if (lower.includes('tipo de evento') || lower.includes('que evento') || lower.includes('qual o evento')) {
    return ['Churrasco', 'Jantar', 'Festa de aniversário'];
  }
  if (lower.includes('o que') && (lower.includes('servir') || lower.includes('menu') || lower.includes('cardápio'))) {
    return ['Churrasco', 'Pizza', 'Massas'];
  }

  // Fallback baseado no estado do evento
  if (!snapshot?.evento) {
    if (userMessage?.toLowerCase().includes('churrasco')) {
      return ['Churrasco para 10', 'Churrasco para 15', 'Churrasco para 20'];
    }
    return ['Criar evento', 'Ver meus eventos'];
  }

  const status = snapshot.evento.status;
  const hasItems = snapshot.itens && snapshot.itens.length > 0;

  if (status === 'finalized') {
    return ['Criar novo evento', 'Ver meus eventos'];
  }
  if (status === 'created' || hasItems) {
    return ['Ver lista completa', 'Editar itens', 'Confirmar evento'];
  }
  if (status === 'draft' || status === 'collecting_core') {
    return ['Gerar lista de itens', 'Editar dados', 'Adicionar participantes'];
  }

  return ['Continuar', 'Ver opções', 'Cancelar'];
}