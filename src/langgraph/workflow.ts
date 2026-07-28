import { StateGraph, START, END, MemorySaver } from '@langchain/langgraph';
import { WorkflowState, type WorkflowStateType } from './state';
import { routerNode } from './agents/routerAgent';
import { conversationalNode } from './agents/conversationalAgent';
import { agendaNode } from './agents/agendaAgent';
import { itensNode } from './agents/itensAgent';
import { startTrace, endTrace, startSpan, endSpan, type TraceRun } from './tracer';
import { ContextManager } from '@/core/orchestrator/contextManager';
import { getPlanSnapshot } from '@/core/orchestrator/eventManager';
import { validateEventDate } from '@/core/nlp/date-parser';
import { parseEventoId } from '@/utils/parsers';
import { wrapWithConversationalTone, type ActionType } from '@/core/orchestrator/conversationalResponse';
import type { ChatUiPayload, EventStatus, EventSnapshot } from '@/types/domain';

let currentRunId: string | null = null;

async function loadContextNode(state: WorkflowStateType): Promise<Partial<WorkflowStateType>> {
  startSpan(currentRunId!, 'loadContext', { userId: state.userId });

  const contextManager = new ContextManager();
  const { context: savedContext, history } = await contextManager.loadUserContext(state.userId);

  const SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000;
  let lastChatTime: string | null = null;
  try {
    lastChatTime = localStorage.getItem(`reune_last_chat_${state.userId}`);
  } catch { /* SSR */ }

  const isTimeout = lastChatTime ? (Date.now() - Number(lastChatTime) > SESSION_TIMEOUT_MS) : false;

  if (isTimeout && !savedContext.evento_id) {
    await contextManager.clearUserContext(state.userId);
  }

  const eventId = parseEventoId(state.eventId) || savedContext.evento_id || undefined;
  const collectedData = (savedContext.collected_data || {}) as Record<string, unknown>;

  endSpan(currentRunId!, 'loadContext', {
    hasHistory: history.length > 0,
    hasEvent: !!eventId,
    isTimeout,
  });

  return {
    messages: history,
    collectedData,
    eventId: eventId ? String(eventId) : null,
    historyLoaded: true,
  };
}

async function saveContextNode(state: WorkflowStateType): Promise<Partial<WorkflowStateType>> {
  startSpan(currentRunId!, 'saveContext', { eventId: state.eventId });

  const contextManager = new ContextManager();
  const eventId = parseEventoId(state.eventId || undefined) || undefined;
  const eventIdNum = eventId ? Number(eventId) : undefined;

  await contextManager.saveMessage(state.userId, 'user', state.userMessage, eventIdNum);
  await contextManager.saveMessage(state.userId, 'assistant', state.response, eventIdNum);

  if (state.actionExecuted?.extractedData || state.actionExecuted?.eventoId) {
    const updatedData: Record<string, unknown> = {
      ...state.collectedData,
      ...(state.actionExecuted?.extractedData ?? {}),
      evento_id: state.actionExecuted?.eventoId || state.eventId,
      has_items: state.showItems,
      menu: state.actionExecuted?.extractedData?.menu || state.collectedData.menu,
      finalidade_evento: state.actionExecuted?.extractedData?.finalidade_evento || state.collectedData.finalidade_evento,
    };

    await contextManager.updateContext(
      state.userId,
      'collecting_core',
      updatedData,
      [], 0.9, undefined,
      eventIdNum,
    );
  }

  endSpan(currentRunId!, 'saveContext');
  return {};
}

async function loadSnapshotNode(state: WorkflowStateType): Promise<Partial<WorkflowStateType>> {
  const eventId = parseEventoId(state.eventId || undefined);

  if (!eventId) return {};

  startSpan(currentRunId!, 'loadSnapshot', { eventId: String(eventId) });

  try {
    const snapshot = await getPlanSnapshot(String(eventId));
    if (!snapshot) return {};

    const hasItems = !!(snapshot.itens && snapshot.itens.length > 0);
    const isFinalized = snapshot.evento?.status === 'finalized';

    endSpan(currentRunId!, 'loadSnapshot', { hasItems, status: snapshot.evento?.status });

    return {
      snapshot: snapshot as EventSnapshot | undefined,
      showItems: hasItems && !isFinalized,
      estado: (snapshot.evento?.status || 'draft') as EventStatus,
    };
  } catch {
    endSpan(currentRunId!, 'loadSnapshot', undefined, 'snapshot_load_error');
    return {};
  }
}

async function buildPayloadNode(state: WorkflowStateType): Promise<Partial<WorkflowStateType>> {
  startSpan(currentRunId!, 'buildPayload');

  const suggestedReplies = getSuggestedReplies(state.snapshot, state.response, state.userMessage);
  let response = state.response;

  let detectedAction: ActionType | undefined;
  if (state.snapshot?.evento?.status === 'finalized') detectedAction = 'event_finalized';
  else if (state.snapshot?.evento?.status === 'created' && state.showItems) detectedAction = 'items_generated';

  if (detectedAction && state.snapshot?.evento) {
    const wrapped = wrapWithConversationalTone(
      {
        estado: state.estado,
        evento_id: state.eventId || null,
        mensagem: state.response,
        showItems: state.showItems,
        suggestedReplies,
      },
      {
        action: detectedAction,
        context: {
          eventType: state.snapshot.evento.tipo_evento,
          peopleCount: state.snapshot.evento.qtd_pessoas,
          hasItems: state.showItems,
          hasDate: !!state.snapshot.evento.data_evento,
        },
      }
    );
    response = wrapped.mensagem;
  }

  try {
    localStorage.setItem(`reune_last_chat_${state.userId}`, String(Date.now()));
  } catch { /* SSR */ }

  endSpan(currentRunId!, 'buildPayload', { suggestedRepliesCount: suggestedReplies?.length });

  return {
    response,
    suggestedReplies,
  };
}

function routeAfterRouter(state: WorkflowStateType): 'agenda' | 'itens' | 'conversational' {
  return state.route === 'itens' ? 'itens' : state.route === 'agenda' ? 'agenda' : 'conversational';
}

const checkpointer = new MemorySaver();

export const workflow = new StateGraph(WorkflowState)
  .addNode('loadContext', loadContextNode)
  .addNode('router', routerNode)
  .addNode('agenda', agendaNode)
  .addNode('itens', itensNode)
  .addNode('conversational', conversationalNode)
  .addNode('saveContext', saveContextNode)
  .addNode('loadSnapshot', loadSnapshotNode)
  .addNode('buildPayload', buildPayloadNode)
  .addEdge(START, 'loadContext')
  .addEdge('loadContext', 'router')
  .addConditionalEdges('router', routeAfterRouter, {
    agenda: 'agenda',
    itens: 'itens',
    conversational: 'conversational',
  })
  .addEdge('agenda', 'saveContext')
  .addEdge('itens', 'saveContext')
  .addEdge('conversational', 'saveContext')
  .addEdge('saveContext', 'loadSnapshot')
  .addEdge('loadSnapshot', 'buildPayload')
  .addEdge('buildPayload', END)
  .compile({ checkpointer });

function getSuggestedReplies(
  snapshot: WorkflowStateType['snapshot'],
  aiResponse: string,
  userMessage?: string,
): string[] | undefined {
  const lower = aiResponse.toLowerCase();

  if (lower.includes('quer criar') || lower.includes('posso criar')) {
    return ['Sim, criar!', 'Mudar data', 'Mudar quantidade'];
  }
  if (lower.includes('montar a lista') || lower.includes('gerar a lista') || lower.includes('gerar lista')) {
    return ['Sim, gerar lista', 'Não, depois'];
  }
  if (lower.includes('quantas pessoas') || lower.includes('para quantas')) {
    return ['10 pessoas', '15 pessoas', '20 pessoas'];
  }
  if (lower.includes('para quando') || lower.includes('que dia') || lower.includes('qual a data')) {
    return ['Este sábado', 'Próxima sexta', 'Daqui 2 semanas'];
  }
  if (lower.includes('tipo de evento') || lower.includes('que evento')) {
    return ['Churrasco', 'Jantar', 'Festa de aniversário'];
  }
  if (lower.includes('o que') && (lower.includes('servir') || lower.includes('menu'))) {
    return ['Churrasco', 'Pizza', 'Massas'];
  }

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

  return ['Continuar', 'Ver opções', 'Cancelar'];
}

export async function langGraphOrchestrate(
  userMessage: string,
  userId: string,
  eventId?: string | null,
): Promise<ChatUiPayload> {
  const threadId = userId;
  const sanitizedEventId = parseEventoId(eventId || null) || undefined;

  currentRunId = startTrace({
    threadId,
    userId,
    userMessage,
    tags: ['orchestrator', 'fase4'],
  });

  try {
    const initialState: Partial<WorkflowStateType> = {
      userMessage,
      userId,
      eventId: sanitizedEventId ? String(sanitizedEventId) : null,
    };

    const config = { configurable: { thread_id: threadId } };
    const result = await workflow.invoke(initialState, config);

    endTrace(currentRunId, {
      response: result.response,
      route: result.route,
    });

    return {
      estado: result.estado || 'draft',
      evento_id: result.eventId || null,
      mensagem: result.response || 'Desculpe, não consegui processar.',
      snapshot: result.snapshot,
      showItems: result.showItems || false,
      suggestedReplies: result.suggestedReplies,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    endTrace(currentRunId, { error: errorMessage });
    return {
      estado: 'draft',
      mensagem: 'Ops! Tive um problema técnico. Pode tentar de novo?',
      evento_id: null,
      showItems: false,
    };
  } finally {
    currentRunId = null;
  }
}

export async function listEventsOrchestrate(
  userId: string,
): Promise<ChatUiPayload & { success: boolean; events: Array<{ id: number; title: string; event_date: string; status: string }> }> {
  const { EventsRepository } = await import('@/db/repositories/events');
  const eventsRepo = new EventsRepository();
  const events = await eventsRepo.getAllOpenEvents(userId);

  return {
    success: true,
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      event_date: e.event_date,
      status: e.status,
    })),
    estado: 'idle' as EventStatus,
    evento_id: null,
    mensagem: events.length > 0
      ? `Você tem ${events.length} evento(s) em aberto. Escolha um para editar ou crie um novo.`
      : 'Você não tem eventos pendentes. Crie um novo evento para começar!',
    showItems: false,
    suggestedReplies: events.map((e) => e.title),
  };
}

export async function runWorkflow(input: {
  userMessage: string;
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userId: string;
  threadId?: string;
  eventContext?: WorkflowStateType['eventContext'];
}): Promise<{ response: string; threadId: string; trace?: TraceRun }> {
  const result = await langGraphOrchestrate(input.userMessage, input.userId, undefined);
  return {
    response: result.mensagem,
    threadId: input.threadId || input.userId,
  };
}

export async function resumeWorkflow(threadId: string): Promise<WorkflowStateType | null> {
  const config = {
    configurable: {
      thread_id: threadId,
    },
  };

  const snapshot = await workflow.getState(config);
  if (!snapshot?.values || Object.keys(snapshot.values).length === 0) {
    return null;
  }
  return snapshot.values as WorkflowStateType;
}
