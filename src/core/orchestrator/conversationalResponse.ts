/**
 * Camada de Resposta Conversacional
 * 
 * Humaniza as respostas finais do orquestrador mantendo:
 * - Ritmo natural e transições suaves
 * - Ofertas opcionais (sem fluxos obrigatórios)
 * - Tom acolhedor mas não exagerado
 */

import { ChatUiPayload } from '@/types/domain';

/**
 * Tipos de ação que geram resposta conversacional
 */
export type ActionType =
    | 'event_created'
    | 'items_generated'
    | 'items_confirmed'
    | 'event_finalized'
    | 'date_added'
    | 'participants_added'
    | 'menu_defined'
    | 'collecting_info';

/**
 * Contexto da ação para personalização
 */
export interface ActionContext {
    eventType?: string;
    peopleCount?: number;
    hasItems?: boolean;
    hasDate?: boolean;
    hasParticipants?: boolean;
    date?: string;
}

/**
 * Resultado de ação estruturado
 */
export interface ActionResult {
    action: ActionType;
    context?: ActionContext;
}

/**
 * Resposta conversacional estruturada
 */
interface ConversationalResponse {
    acknowledgment: string;
    continuation?: string;
    suggestedReplies?: string[];
}

/**
 * Templates de reconhecimento por tipo de ação
 * Cada ação tem múltiplas variações para evitar repetição
 */
const acknowledgmentTemplates: Record<ActionType, string[]> = {
    event_created: [
        "Pronto, organizei o {{eventType}} pra você 🙂",
        "Feito! {{eventType}} tá criado ✨",
        "Show! Seu {{eventType}} tá pronto 🎉",
    ],
    items_generated: [
        "Montei a lista completa pro {{eventType}} de {{peopleCount}} pessoas ✨",
        "Pronto! Aqui tá a lista pro {{eventType}} de {{peopleCount}} pessoas 📝",
        "Feito! Lista prontinha pro {{eventType}} com {{peopleCount}} pessoas 🙂",
    ],
    items_confirmed: [
        "Lista aprovada! ✅",
        "Ótimo, lista confirmada! ✅",
        "Pronto, lista fechada! ✅",
    ],
    event_finalized: [
        "Pronto! Tá tudo organizado 🎉",
        "Feito! Evento confirmado 🙂",
        "Show! Tudo certo pro seu evento ✨",
    ],
    date_added: [
        "Data marcada! {{date}} 📅",
        "Anotado! {{date}} 📅",
        "Combinado pra {{date}} 📅",
    ],
    participants_added: [
        "Participantes adicionados! ✨",
        "Pronto! Galera adicionada 🙂",
        "Feito! Pessoal tá na lista ✅",
    ],
    menu_defined: [
        "Cardápio definido! 🍽️",
        "Ótimo! Menu anotado 🙂",
        "Show! Cardápio tá pronto ✨",
    ],
    collecting_info: [
        "Entendi! 🙂",
        "Beleza! 👍",
        "Show! ✨",
    ],
};

/**
 * Ofertas de continuação passiva por tipo de ação
 * Sempre opcionais, nunca exigem resposta
 */
const continuationTemplates: Record<ActionType, string[] | null> = {
    event_created: [
        "Se quiser, posso te ajudar a convidar amigos.",
        "Quer adicionar participantes? É só me avisar.",
    ],
    items_generated: [
        "Dá uma olhada e me diz se precisa ajustar algo.",
        "Confere aí e me fala se tá tudo certo.",
        "Se quiser, posso te ajudar a convidar amigos.",
    ],
    items_confirmed: [
        "Posso ajudar a dividir entre os participantes, se quiser.",
        "Se quiser, posso distribuir entre a galera.",
    ],
    event_finalized: [
        "Se precisar de algo mais, é só chamar.",
        "Qualquer coisa, tô por aqui.",
    ],
    date_added: null, // Sem continuação, fluxo natural
    participants_added: [
        "Quer que eu divida os itens entre eles?",
    ],
    menu_defined: null, // Sem continuação, fluxo natural
    collecting_info: null, // Sem continuação, continua coletando
};

/**
 * Sugestões visuais por tipo de ação
 */
const suggestedRepliesMap: Record<ActionType, string[] | undefined> = {
    event_created: ["Convidar amigos", "Ver detalhes"],
    items_generated: ["Confirmar lista", "Editar itens"],
    items_confirmed: ["Dividir itens", "Adicionar participantes"],
    event_finalized: undefined, // Não sugerir, deixar aberto
    date_added: undefined,
    participants_added: ["Dividir itens", "Finalizar"],
    menu_defined: undefined,
    collecting_info: undefined,
};

/**
 * Substitui placeholders no template
 */
function fillTemplate(template: string, context?: ActionContext): string {
    if (!context) return template;

    return template
        .replace(/\{\{eventType\}\}/g, context.eventType || 'evento')
        .replace(/\{\{peopleCount\}\}/g, String(context.peopleCount || ''))
        .replace(/\{\{date\}\}/g, context.date || '');
}

/**
 * Seleciona template aleatório de uma lista
 */
function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Constrói resposta conversacional a partir de um resultado de ação
 */
export function buildConversationalResponse(result: ActionResult): ConversationalResponse {
    const { action, context } = result;

    // Pegar template de reconhecimento
    const ackTemplates = acknowledgmentTemplates[action] || acknowledgmentTemplates.collecting_info;
    const acknowledgment = fillTemplate(pickRandom(ackTemplates), context);

    // Pegar continuação (se houver)
    const contTemplates = continuationTemplates[action];
    const continuation = contTemplates ? fillTemplate(pickRandom(contTemplates), context) : undefined;

    // Pegar sugestões
    const suggestedReplies = suggestedRepliesMap[action];

    return {
        acknowledgment,
        continuation,
        suggestedReplies,
    };
}

/**
 * Detecta o tipo de ação a partir do estado do payload
 */
function detectActionFromPayload(payload: ChatUiPayload): ActionType {
    const estado = payload.estado;

    // Evento finalizado
    if (estado === 'finalizado' && payload.closeChat) {
        return 'event_finalized';
    }

    // Itens gerados/pendentes confirmação
    if (estado === 'itens_pendentes_confirmacao' && payload.showItems) {
        // Se a mensagem original indica confirmação, é items_confirmed
        if (payload.mensagem?.includes('aprovada') || payload.mensagem?.includes('confirmada')) {
            return 'items_confirmed';
        }
        return 'items_generated';
    }

    // Coletando informações
    if (estado === 'collecting_core') {
        return 'collecting_info';
    }

    // Default: deixar como está
    return 'collecting_info';
}

/**
 * Extrai contexto do snapshot
 */
function extractContextFromPayload(payload: ChatUiPayload): ActionContext {
    const evento = payload.snapshot?.evento;

    return {
        eventType: evento?.tipo_evento || evento?.categoria_evento || evento?.subtipo_evento,
        peopleCount: evento?.qtd_pessoas,
        hasItems: payload.showItems,
        hasDate: !!evento?.data_evento,
        hasParticipants: (payload.snapshot?.participantes?.length || 0) > 0,
        date: evento?.data_evento,
    };
}

/**
 * Wrapper principal: humaniza o payload de resposta
 * 
 * @param payload - Payload original do orquestrador
 * @param explicitAction - Ação explícita (opcional, detectada automaticamente se não fornecida)
 * @returns Payload com mensagem humanizada
 */
export function wrapWithConversationalTone(
    payload: ChatUiPayload,
    explicitAction?: ActionResult
): ChatUiPayload {
    // Se já está coletando informações ou é um fluxo intermediário, não modificar
    if (payload.estado === 'collecting_core' && !explicitAction) {
        return payload;
    }

    // Detectar ação se não foi explícita
    const action = explicitAction?.action || detectActionFromPayload(payload);
    const context = explicitAction?.context || extractContextFromPayload(payload);

    // Não modificar mensagens de coleta de dados intermediárias
    if (action === 'collecting_info') {
        return payload;
    }

    // Construir resposta conversacional
    const response = buildConversationalResponse({ action, context });

    // Montar mensagem final
    let finalMessage = response.acknowledgment;
    if (response.continuation) {
        finalMessage += '\n' + response.continuation;
    }

    // Mesclar sugestões (priorizar as do response, mas manter as originais se não houver)
    const finalSuggestions = response.suggestedReplies || payload.suggestedReplies;

    return {
        ...payload,
        mensagem: finalMessage,
        suggestedReplies: finalSuggestions,
    };
}

/**
 * Versão simplificada para casos onde só queremos a mensagem
 */
export function humanizeMessage(
    action: ActionType,
    context?: ActionContext
): string {
    const response = buildConversationalResponse({ action, context });

    let message = response.acknowledgment;
    if (response.continuation) {
        message += '\n' + response.continuation;
    }

    return message;
}
