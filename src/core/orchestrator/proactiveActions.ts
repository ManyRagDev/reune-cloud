import type { SituationalInsight } from './situationalAnalyzer';
import type { Event } from '@/types/domain';

/**
 * Ação proativa sugerida pelo sistema
 */
export interface ProactiveAction {
  type: 'suggestion' | 'reminder' | 'automation' | 'clarification';
  message: string;
  actionLabel?: string;
  autoExecute: boolean;
  context?: Record<string, unknown>;
}

/**
 * Gerenciador de ações proativas - gera sugestões, lembretes e automações
 */
export class ProactiveActionsManager {
  /**
   * Gera ação proativa baseada em insight situacional
   */
  generateProactiveAction(insight: SituationalInsight): ProactiveAction {
    switch (insight.type) {
      case 'incomplete_event':
        return this.createSuggestionAction(insight);
      
      case 'approaching_event':
        return this.createReminderAction(insight);
      
      case 'ready_for_next_step':
        return this.createNextStepAction(insight);
      
      case 'stale_conversation':
        return this.createReengagementAction(insight);
      
      case 'missing_critical_info':
        return this.createClarificationAction(insight);
      
      default:
        return {
          type: 'suggestion',
          message: insight.message,
          autoExecute: false
        };
    }
  }

  /**
   * Cria ação de sugestão
   */
  private createSuggestionAction(insight: SituationalInsight): ProactiveAction {
    return {
      type: 'suggestion',
      message: `${insight.message} ${insight.suggestedAction || ''}`,
      actionLabel: 'Continuar',
      autoExecute: false,
      context: insight.context
    };
  }

  /**
   * Cria ação de lembrete
   */
  private createReminderAction(insight: SituationalInsight): ProactiveAction {
    return {
      type: 'reminder',
      message: insight.message,
      actionLabel: insight.suggestedAction,
      autoExecute: false,
      context: insight.context
    };
  }

  /**
   * Cria ação para próximo passo
   */
  private createNextStepAction(insight: SituationalInsight): ProactiveAction {
    const nextStep = insight.context?.nextStep as string;
    const autoExecute = nextStep === 'generate_items'; // Gerar itens pode ser automático

    return {
      type: 'suggestion',
      message: insight.message,
      actionLabel: insight.suggestedAction,
      autoExecute,
      context: insight.context
    };
  }

  /**
   * Cria ação de reengajamento
   */
  private createReengagementAction(insight: SituationalInsight): ProactiveAction {
    return {
      type: 'suggestion',
      message: insight.message,
      actionLabel: 'Sim, vamos continuar!',
      autoExecute: false,
      context: insight.context
    };
  }

  /**
   * Cria ação de clarificação
   */
  private createClarificationAction(insight: SituationalInsight): ProactiveAction {
    return {
      type: 'clarification',
      message: insight.message,
      actionLabel: 'Responder',
      autoExecute: false,
      context: insight.context
    };
  }

  /**
   * Gera automações complementares baseadas no estado do evento
   */
  generateComplementaryAutomations(event: Event): ProactiveAction[] {
    const automations: ProactiveAction[] = [];

    // Se confirmou itens, sugerir adicionar participantes
    if (event.status === 'distrib_pendente_confirmacao') {
      automations.push({
        type: 'automation',
        message: 'Show! Lista confirmada. Agora vamos pros participantes?',
        actionLabel: 'Adicionar participantes',
        autoExecute: false,
        context: { action: 'add_participants' }
      });
    }

    // Se finalizou, oferecer resumo
    if (event.status === 'finalizado') {
      automations.push({
        type: 'automation',
        message: 'Prontinho! Seu evento tá todo organizado. Quer um resumo completo?',
        actionLabel: 'Ver resumo',
        autoExecute: false,
        context: { action: 'show_summary' }
      });
    }

    return automations;
  }

  /**
   * Gera lembrete contextual baseado no tempo
   */
  generateTimeBasedReminder(event: Event, daysUntil: number): ProactiveAction | null {
    if (daysUntil === 1) {
      return {
        type: 'reminder',
        message: '⏰ Ei! Seu evento é amanhã. Tá tudo confirmado?',
        actionLabel: 'Revisar evento',
        autoExecute: false,
        context: { eventId: event.id, daysUntil }
      };
    }

    if (daysUntil === 0) {
      return {
        type: 'reminder',
        message: '🎉 Hoje é o dia! Boa sorte com o evento!',
        autoExecute: false,
        context: { eventId: event.id, daysUntil }
      };
    }

    return null;
  }

  /**
   * Formata mensagem proativa com tom empático e natural
   */
  formatProactiveMessage(action: ProactiveAction): string {
    const emojis: Record<string, string> = {
      suggestion: '💡',
      reminder: '⏰',
      automation: '✨',
      clarification: '🤔'
    };

    const emoji = emojis[action.type] || '';
    let formattedMessage = action.message;

    // Adicionar emoji se não tiver
    if (emoji && !formattedMessage.includes(emoji)) {
      formattedMessage = `${emoji} ${formattedMessage}`;
    }

    // ❌ REMOVIDO: Não adicionar actionLabel no texto, ele será renderizado como botão
    // O actionLabel é passado via suggestedReplies no ChatWidget

    return formattedMessage;
  }

  /**
   * Determina se a ação deve ser executada automaticamente
   */
  shouldAutoExecute(action: ProactiveAction, userPreferences?: Record<string, unknown>): boolean {
    // Por padrão, respeitar o flag autoExecute
    if (!action.autoExecute) return false;

    // Verificar preferências do usuário (se implementado)
    if (userPreferences?.disableAutoActions === true) {
      return false;
    }

    // Apenas automações simples e seguras
    const safeAutomations = ['generate_items', 'show_summary'];
    const actionType = action.context?.action as string;
    
    return safeAutomations.includes(actionType);
  }
}
