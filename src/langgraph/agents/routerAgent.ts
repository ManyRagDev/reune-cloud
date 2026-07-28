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

function detectAgendaIntent(message: string): boolean {
  return AGENDA_INTENT_PATTERNS.some((p) => p.test(message));
}

function detectResetIntent(message: string): boolean {
  return RESET_PATTERNS.some((p) => p.test(message));
}

export async function routerNode(state: WorkflowStateType): Promise<Partial<WorkflowStateType>> {
  const { userMessage, eventId } = state;
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

  return { route: 'conversational' };
}
