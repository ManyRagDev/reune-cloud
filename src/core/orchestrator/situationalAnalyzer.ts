import type { Event } from '@/types/domain';
import type { ConversationContext } from '@/db/repositories/conversationContexts';

/**
 * Situação detectada pelo analisador situacional
 */
export interface SituationalInsight {
  type: 'incomplete_event' | 'approaching_event' | 'stale_conversation' | 'missing_critical_info' | 'ready_for_next_step';
  priority: 'high' | 'medium' | 'low';
  message: string;
  suggestedAction?: string;
  context?: Record<string, unknown>;
}

/**
 * Analisador situacional - detecta estados, padrões e oportunidades de ação proativa
 */
export class SituationalAnalyzer {
  /**
   * Analisa a situação atual e retorna insights acionáveis
   */
  analyzeContext(
    event: Event | null,
    context: ConversationContext | null,
    hasItems: boolean,
    hasParticipants: boolean,
    lastInteractionTimestamp?: number
  ): SituationalInsight[] {
    const insights: SituationalInsight[] = [];

    // Detectar evento incompleto
    if (event) {
      const missingInfo = this.detectMissingInfo(event, hasItems, hasParticipants);
      if (missingInfo.length > 0) {
        insights.push({
          type: 'incomplete_event',
          priority: 'high',
          message: this.generateIncompletionMessage(missingInfo),
          suggestedAction: this.suggestNextStep(missingInfo[0]),
          context: { missingFields: missingInfo }
        });
      }

      // Detectar evento próximo
      const daysUntilEvent = this.getDaysUntilEvent(event.data_evento);
      if (daysUntilEvent !== null && daysUntilEvent <= 3 && daysUntilEvent >= 0) {
        insights.push({
          type: 'approaching_event',
          priority: daysUntilEvent <= 1 ? 'high' : 'medium',
          message: this.generateApproachingEventMessage(daysUntilEvent),
          suggestedAction: 'Quer revisar os detalhes finais?',
          context: { daysUntilEvent }
        });
      }
    }

    // Detectar conversa inativa
    if (lastInteractionTimestamp) {
      const hoursSinceLastInteraction = (Date.now() - lastInteractionTimestamp) / (1000 * 60 * 60);
      if (hoursSinceLastInteraction > 24 && event && event.status !== 'finalizado') {
        insights.push({
          type: 'stale_conversation',
          priority: 'low',
          message: 'Percebi que faz um tempo que não conversamos! Quer retomar o planejamento?',
          context: { hoursSinceLastInteraction }
        });
      }
    }

    // Detectar prontidão para próximo passo
    if (event && context) {
      const readyForNext = this.detectReadyForNextStep(event, context, hasItems, hasParticipants);
      if (readyForNext) {
        insights.push(readyForNext);
      }
    }

    return insights;
  }

  /**
   * Detecta informações faltantes no evento
   */
  private detectMissingInfo(event: Event, hasItems: boolean, hasParticipants: boolean): string[] {
    const missing: string[] = [];

    if (!event.data_evento || event.data_evento === '') {
      missing.push('data');
    }
    if (!event.tipo_evento || event.tipo_evento === '') {
      missing.push('tipo');
    }
    if (!event.qtd_pessoas || event.qtd_pessoas === 0) {
      missing.push('quantidade_pessoas');
    }
    // ❌ REMOVIDO: não considerar status como campo faltante
    // Status é gerenciado internamente, não é um "dado básico" que o usuário fornece
    if (!hasItems && event.status !== 'collecting_core') {
      missing.push('itens');
    }
    if (!hasParticipants && event.status === 'distrib_pendente_confirmacao') {
      missing.push('participantes');
    }

    return missing;
  }

  /**
   * Gera mensagem sobre evento incompleto
   */
  private generateIncompletionMessage(missingInfo: string[]): string {
    const messages: Record<string, string> = {
      data: 'Ainda preciso saber a data do evento.',
      tipo: 'Falta definir o tipo de evento.',
      quantidade_pessoas: 'Quantas pessoas vão participar?',
      dados_basicos: 'Vamos completar as informações básicas do evento?',
      itens: 'Que tal definirmos a lista de itens agora?',
      participantes: 'Podemos adicionar os participantes?'
    };

    const firstMissing = missingInfo[0];
    return messages[firstMissing] || 'Há alguns detalhes pendentes no planejamento.';
  }

  /**
   * Sugere próximo passo baseado na informação faltante
   */
  private suggestNextStep(missingField: string): string {
    const suggestions: Record<string, string> = {
      data: 'Me passa a data do evento?',
      tipo: 'Que tipo de evento você quer fazer?',
      quantidade_pessoas: 'Me conta quantas pessoas você espera?',
      dados_basicos: 'Vamos começar pelos dados básicos?',
      itens: 'Posso gerar uma lista de itens pra você?',
      participantes: 'Quer adicionar os participantes agora?'
    };

    return suggestions[missingField] || 'Podemos continuar o planejamento?';
  }

  /**
   * Calcula dias até o evento
   */
  private getDaysUntilEvent(dataEvento: string): number | null {
    if (!dataEvento) return null;
    
    try {
      const eventDate = new Date(dataEvento);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);
      
      const diffTime = eventDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch {
      return null;
    }
  }

  /**
   * Gera mensagem sobre evento próximo
   */
  private generateApproachingEventMessage(daysUntil: number): string {
    if (daysUntil === 0) {
      return 'Seu evento é hoje! 🎉 Tá tudo certo?';
    } else if (daysUntil === 1) {
      return 'Seu evento é amanhã! Vamos dar uma revisada nos detalhes?';
    } else if (daysUntil === 2) {
      return 'Faltam só 2 dias pro evento! Quer confirmar se está tudo ok?';
    } else {
      return `Faltam ${daysUntil} dias pro evento. Tá tudo encaminhado?`;
    }
  }

  /**
   * Detecta se está pronto para o próximo passo
   */
  private detectReadyForNextStep(
    event: Event,
    context: ConversationContext,
    hasItems: boolean,
    hasParticipants: boolean
  ): SituationalInsight | null {
    // Se tem dados básicos completos mas não tem itens
    if (
      event.status === 'collecting_core' &&
      event.data_evento &&
      event.tipo_evento &&
      event.qtd_pessoas > 0 &&
      !hasItems
    ) {
      return {
        type: 'ready_for_next_step',
        priority: 'medium',
        message: 'Legal! Agora que temos as informações básicas, posso gerar a lista de itens pra você.',
        suggestedAction: 'Quer que eu monte a lista?',
        context: { nextStep: 'generate_items' }
      };
    }

    // Se tem itens mas não confirmou
    if (
      event.status === 'itens_pendentes_confirmacao' &&
      hasItems &&
      context.state === 'awaiting_items_confirmation'
    ) {
      return {
        type: 'ready_for_next_step',
        priority: 'medium',
        message: 'A lista tá pronta! Dá uma olhada e me diz se precisa mudar algo.',
        suggestedAction: 'Tá bom assim ou quer ajustar?',
        context: { nextStep: 'confirm_items' }
      };
    }

    // Se confirmou itens mas não tem participantes
    if (
      event.status === 'distrib_pendente_confirmacao' &&
      hasItems &&
      !hasParticipants
    ) {
      return {
        type: 'ready_for_next_step',
        priority: 'high',
        message: 'Perfeito! Agora vamos adicionar os participantes pra dividir os itens.',
        suggestedAction: 'Me passa os nomes das pessoas?',
        context: { nextStep: 'add_participants' }
      };
    }

    return null;
  }

  /**
   * Prioriza insights por relevância
   */
  prioritizeInsights(insights: SituationalInsight[]): SituationalInsight[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  /**
   * Determina se deve mostrar sugestão proativa agora
   */
  shouldShowProactiveSuggestion(
    insights: SituationalInsight[],
    lastProactiveMessageTimestamp?: number
  ): boolean {
    if (insights.length === 0) return false;

    // Não mostrar proativas com muita frequência
    if (lastProactiveMessageTimestamp) {
      const hoursSinceLast = (Date.now() - lastProactiveMessageTimestamp) / (1000 * 60 * 60);
      if (hoursSinceLast < 2) return false; // Esperar ao menos 2 horas
    }

    // Mostrar se houver insights de alta prioridade
    const hasHighPriority = insights.some(i => i.priority === 'high');
    return hasHighPriority;
  }
}
