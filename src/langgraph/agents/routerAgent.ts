import type { WorkflowStateType } from '../state';
import { detectEditIntentFromMessage } from '@/core/orchestrator/itemCommands';

const AGENDA_INTENT_PATTERNS = [
  /\b(criar|novo|quero|fazer|organizar|planejar)\b/i,
  /\b(evento|churrasco|jantar|almo[cç]o|festa|anivers[aá]rio|piquenique)\b/i,
  /\b(confirmar|finalizar)\b/i,
];

const RESET_PATTERNS = [
  /\b(recome[cç]ar|resetar|reiniciar|limpar|apagar conversa|zerar tudo|novo evento)\b/i,
];

// Padrões de dados típicos de triagem/coleta de evento (números, datas, respostas curtas)
const EVENT_DATA_PATTERNS = [
  /\b\d+\s*(pessoas?|amigos?|convidados?|adultos?|crian[cç]as?)\b/i,
  /^\d+$/,
  /\b(s[aá]bado|domingo|sexta|segunda|ter[cç]a|quarta|quinta|amanh[aã]|hoje|semana que vem|pr[oó]ximo)\b/i,
  /\b(dia\s+\d{1,2}|\d{1,2}\/\d{1,2})\b/i,
  /\b(sim|bora|pode ser|pode criar|claro|com certeza|isso|ok|beleza|combinado|gerar lista)\b/i,
];

function detectAgendaIntent(message: string): boolean {
  return AGENDA_INTENT_PATTERNS.some((p) => p.test(message));
}

function detectEventDataReply(message: string): boolean {
  return EVENT_DATA_PATTERNS.some((p) => p.test(message));
}

function detectResetIntent(message: string): boolean {
  return RESET_PATTERNS.some((p) => p.test(message));
}

export async function routerNode(state: WorkflowStateType): Promise<Partial<WorkflowStateType>> {
  const { userMessage, eventId, collectedData } = state;
  const lower = userMessage.toLowerCase().trim();

  if (detectResetIntent(lower)) {
    return { route: 'agenda' };
  }

  const editIntent = detectEditIntentFromMessage(userMessage);
  if (editIntent.isEditCommand && eventId) {
    return { route: 'itens' };
  }

  if (detectAgendaIntent(lower)) {
    return { route: 'agenda' };
  }

  // Se já há um evento ativo ou coleta em andamento, respostas de dados ou confirmação vão para agenda
  const hasActiveCollection = !!(eventId || collectedData?.tipo_evento || collectedData?.qtd_pessoas);
  if (hasActiveCollection && detectEventDataReply(lower)) {
    return { route: 'agenda' };
  }

  return { route: 'conversational' };
}
