// Orquestrador básico: interpreta inputs e sugere ações
import { detectIntent } from '@/core/nlp';
import { estimateQuantityPerPerson } from '@/core/calc';
import type { AiProfile, ConversationState } from '@/types/domain';

export interface OrchestratorContext {
  profile?: AiProfile;
}

export const orchestrate = (input: string, state: ConversationState, ctx: OrchestratorContext = {}) => {
  const intent = detectIntent(input);
  switch (intent) {
    case 'create_bbq_event':
      return {
        action: 'suggest_items',
        payload: [
          { name: 'Carne', perPerson: estimateQuantityPerPerson('carne'), unit: 'g' },
          { name: 'Bebidas', perPerson: estimateQuantityPerPerson('bebidas'), unit: 'L' },
        ],
      };
    case 'create_event':
      return { action: 'create_event_draft', payload: { title: 'Novo Evento' } };
    default:
      return { action: 'none', payload: {} };
  }
};