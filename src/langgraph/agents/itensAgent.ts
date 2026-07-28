import type { WorkflowStateType } from '../state';
import { executeItemEdit } from '@/services/groqService';
import { parseItemCommand, detectEditIntentFromMessage } from '@/core/orchestrator/itemCommands';
import { ContextManager } from '@/core/orchestrator/contextManager';
import { getPlanSnapshot } from '@/core/orchestrator/eventManager';

export async function itensNode(state: WorkflowStateType): Promise<Partial<WorkflowStateType>> {
  const { userMessage, userId, eventId } = state;

  if (!eventId) {
    return {
      response: 'Preciso saber de qual evento você quer editar os itens.',
    };
  }

  try {
    const editIntent = detectEditIntentFromMessage(userMessage);

    if (editIntent.isEditCommand && editIntent.confidence === 'high') {
      const itemCommand = parseItemCommand(userMessage);
      if (itemCommand) {
        const editResult = await executeItemEdit(itemCommand, eventId, userId);

        const contextManager = new ContextManager();
        await contextManager.saveMessage(userId, 'user', userMessage, Number(eventId));
        await contextManager.saveMessage(userId, 'assistant', editResult.message, Number(eventId));

        const snapshot = await getPlanSnapshot(eventId);

        return {
          response: editResult.message,
          snapshot: snapshot || undefined,
          showItems: true,
          suggestedReplies: ['Editar mais itens', 'Confirmar lista', 'Adicionar participantes'],
        };
      }
    }

    return {
      response: 'Não entendi qual item você quer editar. Pode tentar de novo?',
    };
  } catch {
    return {
      response: 'Ops! Tive um problema ao editar os itens. Pode tentar de novo?',
      error: 'itens_error',
    };
  }
}
