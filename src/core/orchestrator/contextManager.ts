import { UUID } from '@/types/domain';
import { LlmMessage } from '@/types/llm';
import {
  ConversationMessagesRepository,
  ConversationMessage,
} from '@/db/repositories/conversationMessages';
import {   
  ConversationContextsRepository,
  ConversationContext,
} from '@/db/repositories/conversationContexts';

/**
 * Gerencia memória conversacional e contexto persistente
 */
export class ContextManager {
  private messagesRepo: ConversationMessagesRepository;
  private contextsRepo: ConversationContextsRepository;
  public lastProactiveTimestamp?: number;

  constructor() {
    this.messagesRepo = new ConversationMessagesRepository();
    this.contextsRepo = new ConversationContextsRepository();
  }

  /**
   * Carrega contexto conversacional completo do usuário
   */
  async loadUserContext(userId: UUID): Promise<{
    context: ConversationContext;
    history: LlmMessage[];
  }> {
    // Buscar contexto
    let context = await this.contextsRepo.getByUserId(userId);

    // Se não existe, criar inicial
    if (!context) {
      // console.log('[ContextManager] Criando contexto inicial para usuário:', userId);
      context = await this.contextsRepo.createInitial(userId);
      if (!context) {
        throw new Error('Falha ao criar contexto inicial');
      }
    }

    // Buscar histórico de mensagens
    const messages = await this.messagesRepo.getByUserId(userId, 50);
    const history = this.messagesRepo.toLlmMessages(messages);

    // console.log('[ContextManager] Contexto carregado:', {
    //   state: context.state,
    //   historyLength: history.length,
    //   eventoId: context.evento_id,
    // });

    return { context, history };
  }

  /**
   * Salva uma mensagem no histórico
   */
  async saveMessage(
    userId: UUID,
    role: 'user' | 'assistant',
    content: string,
    eventoId?: number
  ): Promise<void> {
    await this.messagesRepo.addMessage(userId, role, content, eventoId);
  }

  /**
   * Atualiza o contexto conversacional
   */
  async updateContext(
    userId: UUID,
    state: string,
    collectedData: Record<string, unknown>,
    missingSlots: string[],
    confidenceLevel: number,
    lastIntent?: string,
    eventoId?: number,
    summary?: string
  ): Promise<void> {
    await this.contextsRepo.upsert(
      userId,
      state,
      collectedData,
      missingSlots,
      confidenceLevel,
      lastIntent,
      eventoId,
      summary
    );
  }

  /**
   * Gera um resumo inteligente do histórico para passar à LLM
   * Mantém últimas N mensagens completas + resumo das anteriores
   */
  generateContextualSummary(
    messages: ConversationMessage[],
    currentContext: ConversationContext,
    maxRecentMessages = 10
  ): LlmMessage[] {
    if (messages.length <= maxRecentMessages) {
      return this.messagesRepo.toLlmMessages(messages);
    }

    // Separar mensagens antigas e recentes
    const recentMessages = messages.slice(-maxRecentMessages);
    const oldMessages = messages.slice(0, -maxRecentMessages);

    // Gerar resumo das mensagens antigas
    const summaryContent = this.summarizeOldMessages(oldMessages, currentContext);

    // Construir histórico: [resumo] + [mensagens recentes]
    const history: LlmMessage[] = [
      {
        role: 'system',
        content: summaryContent,
      },
      ...this.messagesRepo.toLlmMessages(recentMessages),
    ];

    return history;
  }

  /**
   * Resume mensagens antigas em texto condensado
   */
  private summarizeOldMessages(
    oldMessages: ConversationMessage[],
    context: ConversationContext
  ): string {
    const collectedData = context.collected_data || {};

    const summaryParts: string[] = [
      '**Resumo da conversa anterior:**',
    ];

    // Adicionar dados já coletados
    if (Object.keys(collectedData).length > 0) {
      summaryParts.push('Informações coletadas:');
      if (collectedData.categoria_evento) {
        summaryParts.push(`- Tipo de evento: ${collectedData.categoria_evento}`);
      }
      if (collectedData.subtipo_evento) {
        summaryParts.push(`- Subtipo: ${collectedData.subtipo_evento}`);
      }
      if (collectedData.qtd_pessoas) {
        summaryParts.push(`- Quantidade de pessoas: ${collectedData.qtd_pessoas}`);
      }
      if (collectedData.menu) {
        summaryParts.push(`- Menu: ${collectedData.menu}`);
      }
      if (collectedData.data_evento) {
        summaryParts.push(`- Data: ${collectedData.data_evento}`);
      }
    }

    // Adicionar resumo textual se existir
    if (context.summary) {
      summaryParts.push(`\nContexto adicional: ${context.summary}`);
    }

    summaryParts.push(
      `\nTotal de ${oldMessages.length} mensagens anteriores resumidas acima.`
    );

    return summaryParts.join('\n');
  }

  /**
   * Limpa contexto e histórico quando uma conversa é encerrada
   */
  async clearUserContext(userId: UUID): Promise<void> {
    // console.log('[ContextManager] Limpando contexto do usuário:', userId);

    // Limpar histórico de mensagens
    await this.messagesRepo.clearHistory(userId);

    // Resetar contexto para estado inicial limpo
    await this.contextsRepo.upsert(
      userId,
      'idle',
      {}, // collected_data vazio
      [], // missing_slots vazio
      0.5, // confidence default
      undefined, // last_intent
      undefined, // evento_id (vai ser null no banco)
      undefined // summary
    );

    // console.log(`[ContextManager] Contexto resetado para usuário: ${userId}`);
  }

  /**
   * Reseta contexto mas mantém histórico (para iniciar novo evento)
   */
  async resetContextKeepHistory(userId: UUID): Promise<void> {
    // console.log('[ContextManager] Resetando contexto (mantendo histórico)');
    await this.contextsRepo.createInitial(userId);
  }

  /**
   * Limpa apenas o evento_id do contexto, mantém outros dados coletados
   */
  async clearEventId(userId: UUID): Promise<void> {
    const context = await this.contextsRepo.getByUserId(userId);
    if (context?.evento_id) {
      await this.contextsRepo.upsert(
        userId,
        context.state,
        context.collected_data,
        context.missing_slots,
        context.confidence_level,
        context.last_intent,
        undefined, // evento_id = undefined
        context.summary
      );
    }
  }
}
