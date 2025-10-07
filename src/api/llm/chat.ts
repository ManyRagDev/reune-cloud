import { supabase } from '@/integrations/supabase/client';
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
  
  try {
    console.log('[LLM] Chamando edge function llm-chat');
    
    const { data, error } = await supabase.functions.invoke('llm-chat', {
      body: {
        systemPrompt,
        messages,
        temperature,
      },
    });

    if (error) {
      console.error('[LLM] Erro na edge function:', error);
      return null;
    }

    console.log('[LLM] Resposta recebida:', data);
    return data as LlmChatResponse;
  } catch (error) {
    console.error('[LLM] Erro ao chamar a função de chat da LLM:', error);
    if (error instanceof Error) {
      console.error('[LLM] Mensagem de erro:', error.message);
      console.error('[LLM] Stack trace:', error.stack);
    }
    return null;
  }
}