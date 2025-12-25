/**
 * Orquestrador Simplificado usando Groq
 * VersÃ£o simplificada baseada no mÃ©todo do Kliper
 */

import { UUID } from '@/types/domain';
import { ChatUiPayload } from './chatOrchestrator';
import { processMessage } from '@/services/groqService';
import { ContextManager } from './contextManager';
import { getPlanSnapshot } from './eventManager';
import { LlmMessage } from '@/types/llm';
import { rpc } from '@/api/rpc';
import { parseToIsoDate } from '@/core/nlp/date-parser';

type CollectedData = Record<string, unknown>;

/**
 * Orquestra uma mensagem do usuÃ¡rio usando Groq diretamente
 */
export async function simpleOrchestrate(
  userText: string,
  userId: UUID,
  eventoId?: UUID
): Promise<ChatUiPayload> {
  const contextManager = new ContextManager();

  // Carregar contexto e histÃ³rico
  const { context: savedContext, history } = await contextManager.loadUserContext(userId);

  // Extrair informaÃ§Ãµes da mensagem atual e mesclar ao contexto salvo
  const extracted = extractCollectedData(userText);
  const mergedCollected = {
    ...(savedContext.collected_data || {}),
    ...extracted,
  } as CollectedData;

  console.log('[ChatOrchestrator] context merge', {
    state: savedContext.state,
    eventoId: savedContext.evento_id,
    extracted,
    mergedCollected,
  });

  if (Object.keys(extracted).length > 0) {
    await contextManager.updateContext(
      userId,
      savedContext.state || 'collecting_core',
      mergedCollected,
      savedContext.missing_slots || [],
      savedContext.confidence_level || 0.5,
      savedContext.last_intent,
      savedContext.evento_id || undefined,
      savedContext.summary
    );
  }

  // Salvar mensagem do usuÃ¡rio
  await contextManager.saveMessage(userId, 'user', userText, eventoId ? Number(eventoId) : undefined);

  // Carregar snapshot do evento se existir
  let snapshot = eventoId ? await getPlanSnapshot(eventoId) : null;

  // Montar contexto para o Groq
  const eventContext = snapshot?.evento
    ? {
        evento: {
          id: snapshot.evento.id,
          tipo_evento: snapshot.evento.tipo_evento,
          categoria_evento: (snapshot.evento as any).categoria_evento,
          subtipo_evento: (snapshot.evento as any).subtipo_evento,
          qtd_pessoas: snapshot.evento.qtd_pessoas,
          data_evento: snapshot.evento.data_evento,
          menu: (snapshot.evento as any).menu,
          status: snapshot.evento.status,
        },
        hasItems: snapshot.itens && snapshot.itens.length > 0,
        hasParticipants: snapshot.participantes && snapshot.participantes.length > 0,
        collectedData: mergedCollected,
      }
    : { collectedData: mergedCollected };

  // Processar mensagem com Groq
  const result = await processMessage(userText, history, userId, eventContext);

  console.log('[ChatOrchestrator] result', {
    actionExecuted: result.actionExecuted,
    responsePreview: result.response?.slice(0, 120),
  });

  // Atualizar eventoId se uma aÃ§Ã£o criou um novo evento
  let finalEventoId = eventoId;
  if (result.actionExecuted?.eventoId) {
    finalEventoId = result.actionExecuted.eventoId;
  }

  // Salvar resposta da IA
  await contextManager.saveMessage(
    userId,
    'assistant',
    result.response,
    finalEventoId ? Number(finalEventoId) : undefined
  );

  // Recarregar snapshot se necessÃ¡rio (pode ter sido atualizado pela aÃ§Ã£o)
  if (finalEventoId) {
    snapshot = await getPlanSnapshot(finalEventoId);
  }

  // Detectar se precisa mostrar itens
  const showItems = snapshot?.itens && snapshot.itens.length > 0;

  // Construir resposta
  const response: ChatUiPayload = {
    estado: snapshot?.evento?.status || 'collecting_core',
    evento_id: snapshot?.evento?.id || finalEventoId || null,
    mensagem: result.response,
    snapshot: snapshot || undefined,
    showItems: showItems,
    suggestedReplies: getSuggestedReplies(snapshot, result.response),
  };

  // Se evento foi finalizado, adicionar flag de fechar
  if (snapshot?.evento?.status === 'finalizado') {
    response.closeChat = true;
    response.toast = 'Evento criado com sucesso!';
  }

  // Atualizar contexto persistente com dados do snapshot
  if (snapshot?.evento) {
    const nextCollected: CollectedData = {
      ...mergedCollected,
      tipo_evento: snapshot.evento.tipo_evento,
      categoria_evento: (snapshot.evento as any).categoria_evento,
      subtipo_evento: (snapshot.evento as any).subtipo_evento,
      qtd_pessoas: snapshot.evento.qtd_pessoas,
      data_evento: snapshot.evento.data_evento,
      menu: (snapshot.evento as any).menu,
      finalidade_evento: (snapshot.evento as any).finalidade_evento,
    };

    await contextManager.updateContext(
      userId,
      snapshot.evento.status || 'collecting_core',
      nextCollected,
      savedContext.missing_slots || [],
      savedContext.confidence_level || 0.5,
      savedContext.last_intent,
      Number(snapshot.evento.id),
      savedContext.summary
    );
  }

  return response;
}

function extractCollectedData(userText: string): CollectedData {
  const rawText = userText.toLowerCase();
  const text = normalizeText(rawText);
  const collected: CollectedData = {};

  const qtd = extractPeopleCount(text);
  if (qtd) collected.qtd_pessoas = qtd;

  const date = extractDateFromText(rawText);
  if (date) collected.data_evento = date;

  const tipo = extractTipoEvento(text);
  if (tipo) {
    collected.tipo_evento = tipo;
    collected.categoria_evento = tipo;
  }

  if (text.includes('churrasco')) {
    collected.subtipo_evento = 'churrasco';
  }

  if (text.includes('reveillon') || text.includes('ano novo')) {
    collected.finalidade_evento = 'reveillon';
  }

  if (text.includes('natal')) {
    collected.finalidade_evento = 'natal';
  }

  const menu = extractMenu(text);
  if (menu) collected.menu = menu;

  return collected;
}

function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function extractDateFromText(text: string): string | undefined {
  const normalized = normalizeText(text);
  if (normalized.includes('reveillon')) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const dec31 = new Date(currentYear, 11, 31);
    const targetYear = today <= dec31 ? currentYear : currentYear + 1;
    return `${targetYear}-12-31`;
  }

  const isoMatch = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoMatch) {
    return parseToIsoDate(isoMatch[0]) || isoMatch[0];
  }

  const brMatch = text.match(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/);
  if (brMatch) {
    return parseToIsoDate(brMatch[0]) || undefined;
  }

  return undefined;
}

function extractPeopleCount(text: string): number | undefined {
  const explicit = text.match(/(\d{1,3})\s*(pessoas|pessoa|convidados|convidadas)\b/);
  if (explicit) {
    const explicitNumber = Number(explicit[1]);
    return Number.isNaN(explicitNumber) ? undefined : explicitNumber;
  }

  const rangeMatch = text.match(/(\d{1,3})\s*ou\s*(\d{1,3})/);
  if (rangeMatch) {
    const a = Number(rangeMatch[1]);
    const b = Number(rangeMatch[2]);
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      return Math.max(a, b);
    }
  }

  if (!/(pessoa|pessoas|convidad|gente|galera)/.test(text)) {
    return undefined;
  }

  const matches = text.match(/\d+/g);
  if (!matches) return undefined;
  const nums = matches.map((n) => Number(n)).filter((n) => !Number.isNaN(n));
  if (!nums.length) return undefined;
  return Math.max(...nums);
}

function extractTipoEvento(text: string): string | undefined {
  const mappings: Array<{ match: string; value: string }> = [
    { match: 'jantar', value: 'jantar' },
    { match: 'almoco', value: 'almoco' },
    { match: 'churrasco', value: 'churrasco' },
    { match: 'festa', value: 'festa' },
    { match: 'piquenique', value: 'piquenique' },
    { match: 'brunch', value: 'brunch' },
    { match: 'cafe da manha', value: 'cafe da manha' },
    { match: 'lanche', value: 'lanche' },
  ];

  for (const item of mappings) {
    if (text.includes(item.match)) {
      return item.value;
    }
  }

  return undefined;
}

function extractMenu(text: string): string | undefined {
  const items: string[] = [];
  if (text.includes('chester')) items.push('chester');
  if (text.includes('peru')) items.push('peru');
  if (text.includes('champanhe') || text.includes('champagne') || text.includes('espumante')) items.push('champanhe');
  return items.length ? items.join(', ') : undefined;
}

/**
 * Gera sugestÃµes de respostas baseadas no contexto
 */
function getSuggestedReplies(
  snapshot: any,
  aiResponse: string
): string[] | undefined {
  if (!snapshot?.evento) {
    return ['Jantar para 10', 'Churrasco para 15', 'Festa para 20'];
  }

  const status = snapshot.evento.status;
  const hasItems = snapshot.itens && snapshot.itens.length > 0;

  if (status === 'itens_pendentes_confirmacao' && hasItems) {
    return ['Confirmar lista', 'Editar itens', 'Adicionar participantes'];
  }

  if (status === 'collecting_core') {
    if (!snapshot.evento.qtd_pessoas) {
      return ['10 pessoas', '15 pessoas', '20 pessoas'];
    }
    if (!snapshot.evento.data_evento) {
      return ['Hoje', 'AmanhÃ£', 'PrÃ³ximo fim de semana'];
    }
  }

  return undefined;
}

