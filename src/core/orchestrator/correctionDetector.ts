import { MessageAnalysis } from './analyzeMessage';

/**
 * Detecta quando usuário está corrigindo ou ajustando algo que a IA interpretou incorretamente
 */
export class CorrectionDetector {
  /**
   * Verifica se a mensagem atual é uma correção da anterior
   */
  detectCorrection(
    userText: string,
    currentAnalysis: MessageAnalysis,
    previousContext: Record<string, unknown>
  ): {
    isCorrection: boolean;
    correctedField?: string;
    reason?: string;
  } {
    // Padrões linguísticos de correção
    const correctionPatterns = [
      /não|nao|errado|na verdade|melhor|prefiro/i,
      /na verdade é|na real é|não é isso|não era/i,
      /quero mudar|mudar para|trocar para/i,
    ];

    const hasCorrection = correctionPatterns.some(pattern =>
      pattern.test(userText)
    );

    if (!hasCorrection) {
      return { isCorrection: false };
    }

    // Detectar qual campo foi corrigido
    const corrections: Array<{ field: string; reason: string }> = [];

    // Categoria diferente da anterior
    if (
      currentAnalysis.categoria_evento &&
      previousContext.categoria_evento &&
      currentAnalysis.categoria_evento !== previousContext.categoria_evento
    ) {
      corrections.push({
        field: 'categoria_evento',
        reason: 'Usuário corrigiu o tipo de evento',
      });
    }

    // Quantidade diferente da anterior
    if (
      currentAnalysis.qtd_pessoas &&
      previousContext.qtd_pessoas &&
      currentAnalysis.qtd_pessoas !== previousContext.qtd_pessoas
    ) {
      corrections.push({
        field: 'qtd_pessoas',
        reason: 'Usuário corrigiu a quantidade de pessoas',
      });
    }

    // Menu diferente do anterior
    if (
      currentAnalysis.menu &&
      previousContext.menu &&
      currentAnalysis.menu !== previousContext.menu
    ) {
      corrections.push({
        field: 'menu',
        reason: 'Usuário corrigiu o cardápio',
      });
    }

    if (corrections.length > 0) {
      return {
        isCorrection: true,
        correctedField: corrections[0].field,
        reason: corrections[0].reason,
      };
    }

    return { isCorrection: hasCorrection };
  }

  /**
   * Detecta confusão do usuário
   */
  detectConfusion(userText: string): boolean {
    const confusionPatterns = [
      /não entendi|não compreendi|não sei|confuso|perdid[oa]/i,
      /como assim|o que|hein|ué/i,
      /pode explicar|explica de novo|não ficou claro/i,
    ];

    return confusionPatterns.some(pattern => pattern.test(userText));
  }

  /**
   * Gera resposta empática para correção
   */
  generateCorrectionResponse(correctedField: string): string {
    const responses: Record<string, string> = {
      categoria_evento: 'Ah, entendi! Vamos ajustar o tipo então.',
      qtd_pessoas: 'Certo! Vou ajustar a quantidade.',
      menu: 'Beleza! Vou atualizar o cardápio.',
    };

    return (
      responses[correctedField] || 'Entendido! Vou ajustar isso pra você.'
    );
  }
}
