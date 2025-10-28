import { UUID } from '@/types/domain';
import { ConversationAnalyticsRepository } from '@/db/repositories/conversationAnalytics';
import { UserFeedbackRepository } from '@/db/repositories/userFeedback';

/**
 * Gerencia feedback e aprendizado contínuo do UNE.AI
 */
export class FeedbackManager {
  private analyticsRepo: ConversationAnalyticsRepository;
  private feedbackRepo: UserFeedbackRepository;

  constructor() {
    this.analyticsRepo = new ConversationAnalyticsRepository();
    this.feedbackRepo = new UserFeedbackRepository();
  }

  /**
   * Registra uma interação completa com analytics
   */
  async logInteraction(
    userId: UUID,
    intent: string,
    confidenceLevel: number,
    responseType: 'template' | 'llm' | 'hybrid',
    options: {
      eventoId?: number;
      messageId?: string;
      responseTimeMs?: number;
      tokensUsed?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<string | null> {
    const analytic = await this.analyticsRepo.logInteraction(
      userId,
      intent,
      confidenceLevel,
      responseType,
      {
        ...options,
        clarificationNeeded: confidenceLevel < 0.6,
      }
    );

    return analytic?.id || null;
  }

  /**
   * Verifica se deve fazer clarificação baseado em histórico
   */
  async shouldClarify(
    userId: UUID,
    intent: string,
    confidenceLevel: number
  ): Promise<{
    shouldClarify: boolean;
    reason?: string;
  }> {
    // Sempre clarificar se confiança muito baixa
    if (confidenceLevel < 0.5) {
      return {
        shouldClarify: true,
        reason: 'low_confidence',
      };
    }

    // Verificar histórico de erros nessa intenção
    const errors = await this.analyticsRepo.getFrequentErrors(userId, 7);
    const intentError = errors.find((e) => e.intent === intent);

    if (intentError && intentError.error_count > 2) {
      return {
        shouldClarify: true,
        reason: 'frequent_errors',
      };
    }

    // Confiança média mas não crítica - não clarificar
    if (confidenceLevel >= 0.6) {
      return { shouldClarify: false };
    }

    return {
      shouldClarify: true,
      reason: 'moderate_confidence',
    };
  }

  /**
   * Gera mensagem de clarificação contextual
   */
  generateClarificationMessage(
    intent: string,
    context: Record<string, unknown>
  ): {
    message: string;
    suggestedReplies: string[];
  } {
    const clarifications: Record<string, { message: string; suggestedReplies: string[] }> = {
      criar_evento: {
        message: 'Só pra confirmar: você quer criar um evento novo?',
        suggestedReplies: ['Sim, criar novo', 'Não, quero editar'],
      },
      editar_evento: {
        message: 'Entendi que você quer editar. O que vamos mudar?',
        suggestedReplies: ['Mudar data', 'Mudar quantidade', 'Mudar cardápio'],
      },
      definir_menu: {
        message: 'Legal! Só confirmando: qual vai ser o cardápio principal?',
        suggestedReplies: ['Carne', 'Frango', 'Massa', 'Misto'],
      },
      confirmar_evento: {
        message: 'Perfeito! Posso confirmar e criar o evento?',
        suggestedReplies: ['Sim, confirmar', 'Não, revisar antes'],
      },
      desconhecida: {
        message: 'Não entendi bem. Pode reformular?',
        suggestedReplies: ['Criar evento', 'Ver eventos', 'Ajuda'],
      },
    };

    return (
      clarifications[intent] || {
        message: 'Me explica melhor o que você precisa?',
        suggestedReplies: ['Criar evento', 'Editar evento', 'Ver lista'],
      }
    );
  }

  /**
   * Registra que usuário corrigiu a IA
   */
  async recordCorrection(analyticId: string): Promise<void> {
    await this.analyticsRepo.markAsCorrected(analyticId);
  }

  /**
   * Registra que usuário ficou confuso
   */
  async recordConfusion(analyticId: string): Promise<void> {
    await this.analyticsRepo.markAsConfused(analyticId);
  }

  /**
   * Obtém métricas de performance
   */
  async getPerformanceMetrics(userId: UUID) {
    const metrics = await this.analyticsRepo.getMetrics(userId, 30);
    const feedbackStats = await this.feedbackRepo.getFeedbackStats(userId);
    const lowConfidence = await this.analyticsRepo.getLowConfidenceInteractions(
      userId,
      0.6,
      10
    );
    const errors = await this.analyticsRepo.getFrequentErrors(userId, 30);

    // Calcular taxa de sucesso
    const totalInteractions = metrics.reduce((sum, m) => sum + m.total_interactions, 0);
    const totalCorrections = metrics.reduce((sum, m) => sum + m.correction_count, 0);
    const successRate = totalInteractions > 0
      ? ((totalInteractions - totalCorrections) / totalInteractions) * 100
      : 0;

    return {
      summary: {
        total_interactions: totalInteractions,
        avg_confidence: metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.avg_confidence, 0) / metrics.length
          : 0,
        success_rate: successRate,
        clarification_rate: totalInteractions > 0
          ? (metrics.reduce((sum, m) => sum + m.clarification_count, 0) / totalInteractions) * 100
          : 0,
      },
      feedback: feedbackStats,
      recent_low_confidence: lowConfidence.slice(0, 5),
      frequent_errors: errors.slice(0, 5),
      daily_metrics: metrics.slice(0, 7),
    };
  }

  /**
   * Detecta padrões de confusão recorrentes
   */
  async detectConfusionPatterns(userId: UUID): Promise<{
    hasPatterns: boolean;
    patterns: Array<{
      intent: string;
      frequency: number;
      suggestion: string;
    }>;
  }> {
    const errors = await this.analyticsRepo.getFrequentErrors(userId, 7);

    const patterns = errors
      .filter((e) => e.error_count >= 2)
      .map((e) => ({
        intent: e.intent,
        frequency: e.error_count,
        suggestion: this.getSuggestionForIntent(e.intent),
      }));

    return {
      hasPatterns: patterns.length > 0,
      patterns,
    };
  }

  private getSuggestionForIntent(intent: string): string {
    const suggestions: Record<string, string> = {
      criar_evento: 'Tente ser mais específico sobre tipo e quantidade',
      editar_evento: 'Especifique claramente o que deseja editar',
      definir_menu: 'Descreva o cardápio principal com mais detalhes',
      desconhecida: 'Use comandos mais diretos como "criar", "editar", "confirmar"',
    };

    return suggestions[intent] || 'Tente reformular sua mensagem de forma mais clara';
  }
}
