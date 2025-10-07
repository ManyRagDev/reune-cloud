import { lovableFunctions } from '@/db/lovableClient';
import { LlmMessage, LlmChatResponse } from '@/types/llm';

/**
 * Chama a edge function de chat da LLM para obter sugestões.
 *
 * @param systemPrompt O prompt do sistema para guiar a LLM.
 * @param messages O histórico de mensagens da conversa.
 * @param temperature A temperatura para a geração da resposta.
 * @returns A resposta da LLM.
 */
export async function getLlmSuggestions(
  systemPrompt: string,
  messages: LlmMessage[],
  temperature = 0.3,
  idempotencyKeyPayload?: Record<string, any>
): Promise<LlmChatResponse | null> {
  console.log('[LLM] Iniciando getLlmSuggestions', { systemPrompt, messagesCount: messages.length, temperature });
  
  if (!lovableFunctions) {
    console.error('[LLM] Cliente de Functions não configurado.');
    return null;
  }

  const idempotencyKey = idempotencyKeyPayload
    ? `chat-${JSON.stringify(idempotencyKeyPayload)}`
    : undefined;

  try {
    console.log('[LLM] Fazendo requisição para /llm-chat', { idempotencyKey });
    const response = await lovableFunctions.post<LlmChatResponse>(
      '/llm-chat',
      {
        systemPrompt,
        messages,
        temperature,
      },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    );
    console.log('[LLM] Resposta recebida:', response);
    return response;
  } catch (error) {
    console.error('[LLM] Erro ao chamar a função de chat da LLM:', error);
    if (error instanceof Error) {
      console.error('[LLM] Mensagem de erro:', error.message);
      console.error('[LLM] Stack trace:', error.stack);
    }
    return null;
  }
}