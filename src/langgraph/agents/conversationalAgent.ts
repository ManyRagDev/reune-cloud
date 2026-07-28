/**
 * ConversationalAgent — responde a mensagens conversacionais usando Groq API.
 * Delega ações complexas para o AgendaAgent quando necessário.
 */

import type { WorkflowStateType } from '../state';
import { applyInputGuardrail } from '@/guardrails/inputGuard';
import { applyOutputGuardrail } from '@/guardrails/outputGuard';
import { buildSystemPrompt } from '@/utils/promptLoader';

export async function conversationalNode(state: WorkflowStateType): Promise<Partial<WorkflowStateType>> {
  const { userMessage, messages, userId, eventContext } = state;

  const guardResult = applyInputGuardrail(userMessage);
  if (!guardResult.safe) {
    return {
      response: 'Desculpe, não posso processar essa mensagem. Pode reformular?',
      route: 'conversational',
    };
  }
  const safeMessage = guardResult.sanitized;

  try {
    const systemPrompt = buildSystemPrompt(eventContext);
    const conversationMessages = messages.filter((m) => m.role !== 'system');
    conversationMessages.push({ role: 'user', content: safeMessage });

    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('llm-chat', {
      body: {
        systemPrompt,
        messages: conversationMessages,
        temperature: 0.7,
      },
    });

    if (error) throw new Error(error.message || 'Erro ao chamar llm-chat');

    const aiResponse = (data as { content?: string })?.content;

    if (!aiResponse || aiResponse.trim().length === 0) {
      return { response: 'Desculpa, não entendi bem. Pode reformular?' };
    }

    const outputCheck = applyOutputGuardrail(aiResponse);
    const finalResponse = outputCheck.safe
      ? outputCheck.content
      : 'Desculpe, não posso mostrar essa resposta. Pode reformular?';

    const updatedMessages = [
      ...messages,
      { role: 'user' as const, content: safeMessage },
      { role: 'assistant' as const, content: finalResponse },
    ];

    return {
      response: finalResponse,
      messages: updatedMessages,
    };
  } catch {
    return {
      response: 'Ops! Tive um problema técnico. Pode tentar de novo?',
      error: 'conversational_error',
    };
  }
}
