import type { WorkflowStateType } from '../state';
import { processMessage } from '@/services/groqService';

export async function agendaNode(state: WorkflowStateType): Promise<Partial<WorkflowStateType>> {
  const { userMessage, messages, userId, collectedData, eventId } = state;

  try {
    const result = await processMessage(userMessage, messages, userId, {
      collectedData,
      evento: eventId
        ? {
            id: eventId,
            status: (collectedData.event_status as string) || 'draft',
            tipo_evento: collectedData.tipo_evento as string | undefined,
            qtd_pessoas: collectedData.qtd_pessoas as number | undefined,
            data_evento: collectedData.data_evento as string | undefined,
            menu: collectedData.menu as string | undefined,
            finalidade_evento: collectedData.finalidade_evento as string | undefined,
          }
        : undefined,
      hasItems: !!(collectedData.has_items),
    });

    return {
      response: result.response,
      actionExecuted: result.actionExecuted,
      eventId: result.actionExecuted?.eventoId || eventId,
    };
  } catch {
    return {
      response: 'Ops! Tive um problema ao processar seu evento. Pode tentar de novo?',
      error: 'agenda_error',
    };
  }
}
