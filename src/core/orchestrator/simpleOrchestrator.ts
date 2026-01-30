/**
 * Orquestrador Simplificado usando Groq
 * Versão final: Prioridade IA, Regex Passivo e Persistência de Contexto
 */

import { UUID, EventStatus, ChatUiPayload, ListEventsPayload, RecentEvent } from '@/types/domain';
import { processMessage } from '@/services/groqService';
import { ContextManager } from './contextManager';
import { getPlanSnapshot } from './eventManager';
import { wrapWithConversationalTone, ActionType } from './conversationalResponse';
import { EventsRepository } from '@/db/repositories/events';

type CollectedData = Record<string, unknown>;

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
 * Formata data de evento para 'dd/mm'
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  } catch (error) {
    console.error('[simpleOrchestrator] Erro ao formatar data:', error);
    return dateString;
  }
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

  //2. 🔥 NOVO: Verificar timeout de sessão para detectar nova conversa
  const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hora
  const lastChatTime = localStorage.getItem(`reune_last_chat_${userId}`);
  const isTimeout = lastChatTime ? (Date.now() - Number(lastChatTime) > SESSION_TIMEOUT_MS) : false;

  // Se houve timeout, forçar reset do contexto para nova sessão
  if (isTimeout) {
    console.log('[simpleOrchestrator] Timeout de sessão detectado, iniciando nova conversa');
    await contextManager.clearUserContext(userId);
    savedContext.evento_id = undefined;
  }

  //3. Extração Passiva (Regex apenas para Qtd e Data)
  const extracted = extractCollectedData(userText);
  const mergedCollected = {
    ...(savedContext.collected_data || {}),
    ...extracted,
  } as CollectedData;

  //4. Processar mensagem com Groq (A IA decide o tipo do evento)
  // 🔥 CORREÇÃO CRÍTICA: Se o eventoId foi explicitamente passado como undefined (novo evento), NUNCA usa o salvo
  // Isso previne a race condition onde o banco ainda não processou o clearUserContext
  const currentEventId: string | null = eventoId !== undefined
    ? (eventoId || null)
    : null; // 🔥 Se eventoId undefined explicitamente, sempre null (nunca usar fallback)

  const result = await processMessage(userText, history, userId, {
    collectedData: mergedCollected,
    evento: currentEventId ? {
      id: currentEventId,
      status: savedContext.state
    } : undefined
  });

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
      { ...mergedCollected, ...result.actionExecuted.extractedData },
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
    suggestedReplies: getSuggestedReplies(snapshot, result.response),
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
 * Extração passiva: Não tenta adivinhar o tipo do evento
 */
function extractCollectedData(userText: string): CollectedData {
  const text = userText.toLowerCase();
  const collected: CollectedData = {};

  // Apenas Qtd e Data via Regex (auxiliar)
  const qtd = extractPeopleCount(text);
  if (qtd) collected.qtd_pessoas = qtd;

  return collected;
}

function extractPeopleCount(text: string): number | undefined {
  const matches = text.match(/(\d+)\s*(pessoas|convidados|gente)/);
  if (matches) return Number(matches[1]);
  return undefined;
}

function getSuggestedReplies(snapshot: any, aiResponse: string): string[] | undefined {
  if (!snapshot?.evento) return ['Jantar para 10', 'Churrasco para 15', 'Festa para 20'];

  const status = snapshot.evento.status;
  if (status === 'created') return ['Confirmar lista', 'Editar itens'];
  if (status === 'draft' && !snapshot.evento.data_evento) return ['Este fim de semana', 'Próxima sexta', 'A definir'];

  return ['Entendido', 'Obrigado'];
}