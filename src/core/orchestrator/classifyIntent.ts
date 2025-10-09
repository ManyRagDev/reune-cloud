import { MessageAnalysis } from "./analyzeMessage";

export interface IntentClassification {
  intent: MessageAnalysis['intencao'];
  confidence: number;
  needsClarification: boolean;
  suggestedReplies?: string[];
}

export function classifyIntent(analysis: MessageAnalysis, context?: any): IntentClassification {
  const { intencao, nivel_confianca } = analysis;
  
  // Intents que sempre são claros
  const clearIntents = ['confirmar_evento', 'mostrar_itens', 'encerrar_conversa'];
  
  if (clearIntents.includes(intencao)) {
    return {
      intent: intencao,
      confidence: nivel_confianca,
      needsClarification: false
    };
  }

  // Criar evento - verificar se precisa de mais informações
  if (intencao === 'criar_evento') {
    const hasCategoria = !!analysis.categoria_evento;
    const hasSubtipo = !!analysis.subtipo_evento;
    const hasQtd = !!analysis.qtd_pessoas;
    
    if (!hasCategoria && hasSubtipo) {
      // Tem subtipo mas não categoria - precisa clarificar
      return {
        intent: 'criar_evento',
        confidence: nivel_confianca,
        needsClarification: true,
        suggestedReplies: ['Almoço', 'Jantar', 'Lanche']
      };
    }
    
    if (hasCategoria && !hasQtd) {
      return {
        intent: 'criar_evento',
        confidence: nivel_confianca,
        needsClarification: false
      };
    }
  }

  // Definir menu
  if (intencao === 'definir_menu') {
    return {
      intent: 'definir_menu',
      confidence: nivel_confianca,
      needsClarification: false
    };
  }

  // Editar evento
  if (intencao === 'editar_evento') {
    return {
      intent: 'editar_evento',
      confidence: nivel_confianca,
      needsClarification: false,
      suggestedReplies: ['Mudar data', 'Alterar quantidade', 'Editar menu']
    };
  }

  // Out of domain - sempre com baixa confiança
  if (intencao === 'out_of_domain') {
    return {
      intent: 'out_of_domain',
      confidence: 0.9,
      needsClarification: false
    };
  }

  // Desconhecida - precisa de clarificação
  return {
    intent: 'desconhecida',
    confidence: 0.3,
    needsClarification: true,
    suggestedReplies: ['Criar evento', 'Ver meus eventos', 'Ajuda']
  };
}
