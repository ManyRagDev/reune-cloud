/**
 * Servico de IA usando Groq API
 * Baseado no metodo do Kliper, adaptado para UNE.AI
 */

import { LlmMessage } from '@/types/llm';
import { Event, Item, UUID } from '@/types/domain';
import { rpc } from '@/api/rpc';
import { upsertEvent, setEventStatus } from '@/core/orchestrator/eventManager';
import { isValidFutureDate, parseToIsoDate } from '@/core/nlp/date-parser';

/**
 * Interface para acoes que o chatbot pode executar
 */
interface ActionData {
  action: 'create_event' | 'generate_items' | 'confirm_event' | 'update_event';
  data: {
    tipo_evento?: string;
    categoria_evento?: string;
    subtipo_evento?: string;
    qtd_pessoas?: number;
    data_evento?: string;
    menu?: string;
    finalidade_evento?: string;
    evento_id?: string;
  };
}

/**
 * Contexto atual do evento (para passar ao prompt)
 */
interface EventContext {
  evento?: {
    id?: string;
    tipo_evento?: string;
    categoria_evento?: string;
    subtipo_evento?: string;
    qtd_pessoas?: number;
    data_evento?: string;
    menu?: string;
    status?: string;
  };
  hasItems?: boolean;
  hasParticipants?: boolean;
  collectedData?: Record<string, unknown>;
}

/**
 * Gera o system prompt completo para o UNE.AI
 */
function buildSystemPrompt(context?: EventContext): string {
  const todayIso = new Date().toISOString().slice(0, 10);
  const basePrompt = `Voce e o UNE.AI, um assistente especializado em planejamento de eventos sociais.
Data atual: ${todayIso}.

**Sua Personalidade:**
- Voce e acolhedor, natural e direto na comunicacao
- Usa linguagem simples e cotidiana, sem jargoes tecnicos
- Mantem frases curtas e objetivas, com ritmo de conversa natural
- E empatico e atento as necessidades do usuario
- Demonstra entusiasmo equilibrado (nem frio, nem exagerado)

**Seu Tom de Voz:**
- Casual mas respeitoso
- Usa expressoes naturais como "otimo", "perfeito", "vamos la"
- Evita ser formal demais ou usar linguagem robotica
- Mantem coerencia emocional conforme o contexto da conversa

**Estrutura Hierarquica de Eventos:**
- categoria_evento: forma social (almoco, jantar, lanche, piquenique, cafe da manha, brunch)
- subtipo_evento: estilo culinario (churrasco, feijoada, pizza, fondue, lasanha, sushi)
- menu: prato principal especifico (lasanha, carnes, massas, frutos do mar)

**Intencoes Possiveis:**
- criar_evento: Criar um novo evento do zero
- confirmar_evento: Confirmar e finalizar um evento
- editar_evento: Alterar informacoes de um evento existente
- mostrar_itens: Mostrar lista de itens do evento
- reiniciar_conversa: Limpar tudo e comecar do zero
- encerrar_conversa: Finalizar a conversa

**Regras de Extracao:**
1. "churrasco" e subtipo_evento; categoria_evento deve ser inferida (geralmente "almoco")
2. "jantar" e categoria_evento, nao subtipo
3. Se mencionar apenas prato (ex: "lasanha"), classifique como menu
4. Datas aceitas: dd/mm/yyyy, dd/mm, "dia X de mes", ou formato ISO
5. Quantidade de pessoas: numeros seguidos de palavras como "pessoas" ou "convidados"

**Quando Executar Acoes:**
Voce deve retornar JSON APENAS quando tiver informacoes suficientes para executar uma acao. Formato do JSON:

{
  "action": "create_event" | "generate_items" | "confirm_event" | "update_event",
  "data": {
    "tipo_evento": "string",
    "categoria_evento": "string (opcional)",
    "subtipo_evento": "string (opcional)",
    "qtd_pessoas": number,
    "data_evento": "string (formato ISO: YYYY-MM-DD)",
    "menu": "string (opcional)",
    "evento_id": "string (apenas para update_event e confirm_event)"
  }
}

**Acoes Disponiveis:**
- create_event: Quando tiver tipo_evento E qtd_pessoas
- generate_items: Quando evento ja existe e precisa gerar lista de itens
- confirm_event: Quando usuario confirmar lista de itens
- update_event: Quando usuario quiser alterar dados do evento

**IMPORTANTE:**
- evento_id deve ser o ID numerico do evento quando existir
- Use os dados coletados e nao pergunte novamente o que ja foi informado
- Se retornar JSON, NAO escreva nada alem do JSON puro (sem markdown, sem explicacoes)
- Se nao tiver informacoes suficientes, continue a conversa normalmente perguntando o que falta
- Seja objetivo e nao divague`;

  if (context?.evento) {
    const evento = context.evento;
    const contextInfo = `
**Contexto Atual do Evento:**
- ID: ${evento.id || 'N/A'}
- Tipo: ${evento.tipo_evento || 'Nao definido'}
- Pessoas: ${evento.qtd_pessoas || 'Nao definido'}
- Data: ${evento.data_evento || 'Nao definida'}
- Menu: ${evento.menu || 'Nao definido'}
- Status: ${evento.status || 'N/A'}
- Itens gerados: ${context.hasItems ? 'Sim' : 'Nao'}
- Participantes: ${context.hasParticipants ? 'Sim' : 'Nao'}

Use essas informacoes como referencia, mas nao repita tudo que ja foi dito.`;

    return basePrompt + contextInfo;
  }

  if (context?.collectedData && Object.keys(context.collectedData).length > 0) {
    const collected = context.collectedData as Record<string, unknown>;
    const parts: string[] = ['\n**Dados coletados ate agora:**'];
    if (collected.categoria_evento) parts.push(`- Tipo de evento: ${collected.categoria_evento}`);
    if (collected.subtipo_evento) parts.push(`- Subtipo: ${collected.subtipo_evento}`);
    if (collected.qtd_pessoas) parts.push(`- Pessoas: ${collected.qtd_pessoas}`);
    if (collected.menu) parts.push(`- Menu: ${collected.menu}`);
    if (collected.data_evento) parts.push(`- Data: ${collected.data_evento}`);
    return basePrompt + parts.join('\n');
  }

  return basePrompt;
}

/**
 * Chama a Edge Function (llm-chat) que usa Groq server-side.
 */
async function callGroqAPI(
  systemPrompt: string,
  messages: LlmMessage[],
  temperature = 0.7
): Promise<string> {
  const { supabase } = await import('@/integrations/supabase/client');

  console.log('[GroqService] invoking llm-chat', {
    messagesCount: messages.length,
    temperature,
    systemPromptPreview: systemPrompt.slice(0, 120),
  });

  const { data, error } = await supabase.functions.invoke('llm-chat', {
    body: {
      systemPrompt,
      messages,
      temperature,
    },
  });

  if (error) {
    throw new Error(error.message || 'Erro ao chamar llm-chat');
  }

  const content = (data as any)?.content;
  if (!content) {
    throw new Error('Resposta vazia da llm-chat');
  }

  console.log('[GroqService] llm-chat response', {
    contentPreview: String(content).slice(0, 160),
  });

  return content as string;
}

/**
 * Detecta e extrai JSON de acao na resposta
 */
function detectActionJSON(content: string): ActionData | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const jsonStr = jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    if (parsed.action && parsed.data) {
      return parsed as ActionData;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Fallback para gerar itens basicos quando LLM falhar
 */
function generateFallbackItems(tipo_evento: string, qtd_pessoas: number): Partial<Item>[] {
  const isChurrasco = tipo_evento.toLowerCase().includes('churrasco');

  const baseItems = isChurrasco
    ? [
        { nome: 'Carne bovina', unidade: 'kg', categoria: 'comida', quantidade: Math.max(0.4 * qtd_pessoas, 1) },
        { nome: 'Linguica', unidade: 'kg', categoria: 'comida', quantidade: Math.max(0.2 * qtd_pessoas, 0.5) },
        { nome: 'Pao de alho', unidade: 'un', categoria: 'comida', quantidade: Math.max(2 * qtd_pessoas, 10) },
        { nome: 'Cerveja', unidade: 'L', categoria: 'bebida', quantidade: Math.max(2 * qtd_pessoas, 6) },
        { nome: 'Refrigerante', unidade: 'L', categoria: 'bebida', quantidade: Math.max(1 * qtd_pessoas, 3) },
        { nome: 'Carvao', unidade: 'kg', categoria: 'combustivel', quantidade: Math.max(1 * qtd_pessoas, 3) },
      ]
    : [
        { nome: 'Comida', unidade: 'kg', categoria: 'comida', quantidade: Math.max(0.3 * qtd_pessoas, 1) },
        { nome: 'Bebida', unidade: 'L', categoria: 'bebida', quantidade: Math.max(1 * qtd_pessoas, 2) },
      ];

  return baseItems.map(item => ({
    nome_item: item.nome,
    quantidade: Math.round(item.quantidade * 100) / 100,
    unidade: item.unidade,
    valor_estimado: 0,
    categoria: item.categoria,
    prioridade: 'B' as const,
  }));
}

/**
 * Gera lista de itens usando Groq diretamente
 */
async function generateItemsWithGroqLocal(params: {
  tipo_evento: string;
  qtd_pessoas: number;
  menu?: string;
}): Promise<Partial<Item>[]> {
  const systemPrompt = `Voce e um especialista em planejamento e organizacao de eventos sociais e corporativos.

Sua funcao e montar uma lista estruturada de itens e quantidades necessarios para o evento descrito abaixo.

EVENTO:
- Tipo: "${params.tipo_evento}"
- Quantidade de pessoas: ${params.qtd_pessoas}${params.menu ? `\n- Menu: "${params.menu}"` : ''}

Regras de geracao:
1. Pense de forma pratica e realista, considerando proporcoes adequadas a quantidade de pessoas.
2. Priorize itens realmente necessarios para a boa execucao do evento.
3. Inclua comidas, bebidas, descartaveis, combustiveis e decoracao apenas se forem adequados ao tipo de evento.
4. Mantenha as quantidades coerentes com o publico informado (nao exagere nem reduza demais).
5. Se o tipo de evento nao for totalmente claro, assuma um cenario generico e seguro.

Formato de saida:
Retorne APENAS um array JSON valido (sem markdown, texto adicional ou comentarios).
Cada item deve seguir EXATAMENTE esta estrutura:
[
  {
    "nome_item": string,
    "quantidade": number,
    "unidade": string,
    "valor_estimado": number,
    "categoria": "comida" | "bebida" | "descartaveis" | "decoracao" | "combustivel" | "outros",
    "prioridade": "A" | "B" | "C"
  }
]

Importante:
- NAO use markdown.
- NAO adicione texto explicativo antes ou depois do JSON.
- O retorno deve ser apenas o JSON puro.`;

  const userPrompt = `Evento: ${params.tipo_evento}, Pessoas: ${params.qtd_pessoas}`;

  try {
    const aiResponse = await callGroqAPI(systemPrompt, [{ role: 'user', content: userPrompt }], 0.3);

    if (!aiResponse) {
      console.warn('[GroqService] Groq nao retornou resposta, usando fallback');
      return generateFallbackItems(params.tipo_evento, params.qtd_pessoas);
    }

    const { parseLlmItemsResponse } = await import('@/core/orchestrator/itemAdapter');
    try {
      const items = parseLlmItemsResponse(aiResponse);
      console.info('[GroqService] Itens gerados pela Groq:', items.length);
      return items;
    } catch (adapterError) {
      console.error('[GroqService] Erro no adapter, usando fallback:', adapterError);
      return generateFallbackItems(params.tipo_evento, params.qtd_pessoas);
    }
  } catch (error) {
    console.error('[GroqService] Erro ao gerar itens com Groq:', error);
    return generateFallbackItems(params.tipo_evento, params.qtd_pessoas);
  }
}

/**
 * Resultado da execucao de acao
 */
interface ExecuteActionResult {
  message: string;
  eventoId?: string;
}

function resolveEventType(data: ActionData['data']): string | undefined {
  const tipo = data.tipo_evento || data.categoria_evento || data.subtipo_evento;
  return tipo ? String(tipo) : undefined;
}

function resolveEventoId(...candidates: Array<string | undefined>): string | undefined {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const text = String(candidate);
    if (/^\d+$/.test(text)) return text;
  }
  return undefined;
}

function normalizePeopleCount(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.round(parsed);
}

function buildMissingEventDataMessage(tipo?: string, qtd?: number): string {
  const missing: string[] = [];
  if (!tipo) missing.push('o tipo de evento');
  if (!qtd) missing.push('a quantidade de pessoas');
  if (missing.length === 1) {
    return 'Perfeito! So preciso de ' + missing[0] + ' para criar o evento.';
  }
  return 'Perfeito! So preciso de ' + missing.join(' e ') + ' para criar o evento.';
}

function formatDateForName(isoDate?: string): string | undefined {
  if (!isoDate) return undefined;
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function capitalizeWord(value?: string): string {
  if (!value) return 'Evento';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildEventName(tipo?: string, dataIso?: string): string {
  const base = capitalizeWord(tipo);
  const dateLabel = formatDateForName(dataIso);
  if (dateLabel) {
    return `${base} - ${dateLabel}`;
  }
  return base;
}

/**
 * Executa uma acao detectada no JSON
 */
async function executeAction(
  actionData: ActionData,
  userId: UUID,
  context?: EventContext
): Promise<ExecuteActionResult> {
  const { action, data } = actionData;
  const collected = (context?.collectedData || {}) as Record<string, unknown>;

  const merged: ActionData['data'] = {
    ...collected,
  } as ActionData['data'];

  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        (merged as any)[key] = value;
      }
    });
  }

  console.log('[GroqService] executeAction', {
    action,
    merged,
    contextEventoId: context?.evento?.id,
  });

  switch (action) {
    case 'create_event': {
      const tipo = resolveEventType(merged);
      const qtd = normalizePeopleCount(merged.qtd_pessoas);
      if (!tipo || !qtd) {
        return { message: buildMissingEventDataMessage(tipo, qtd) };
      }

      const normalizedDate = merged.data_evento ? parseToIsoDate(String(merged.data_evento)) : undefined;
      if (normalizedDate && !isValidFutureDate(normalizedDate)) {
        return { message: 'Essa data ja passou. Pode me dizer uma data futura para o evento?' };
      }

      const tipoFinal = String(merged.categoria_evento || merged.subtipo_evento || merged.tipo_evento || tipo);
      const categoriaFinal = merged.categoria_evento || (merged.subtipo_evento ? 'almoco' : undefined);
      const nomeEvento = buildEventName(tipoFinal, normalizedDate || String(merged.data_evento || ''));

      const newEvent = await upsertEvent({
        usuario_id: userId,
        nome_evento: nomeEvento,
        tipo_evento: tipoFinal,
        categoria_evento: categoriaFinal,
        subtipo_evento: merged.subtipo_evento,
        finalidade_evento: merged.finalidade_evento as string | undefined,
        qtd_pessoas: Number(qtd),
        menu: merged.menu as string | undefined,
        data_evento: normalizedDate,
        status: 'collecting_core',
      });

      if (tipoFinal && qtd) {
        const itensGerados = await generateItemsWithGroqLocal({
          tipo_evento: tipoFinal,
          qtd_pessoas: Number(qtd),
          menu: merged.menu as string | undefined,
        });

        const itensComIds = itensGerados.map(item => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          evento_id: newEvent.id,
          nome_item: item.nome_item || '',
          quantidade: item.quantidade || 0,
          unidade: item.unidade || 'un',
          valor_estimado: item.valor_estimado || 0,
          categoria: item.categoria || 'geral',
          prioridade: (item.prioridade || 'B') as 'A' | 'B' | 'C',
        })) as Item[];

        console.log('[GroqService] items_replace_for_event', {
          eventoId: newEvent.id,
          itemsCount: itensComIds.length,
        });

        await rpc.items_replace_for_event(String(newEvent.id), itensComIds);
        await setEventStatus(newEvent.id, 'itens_pendentes_confirmacao');

        return {
          message: `Perfeito! Criei o evento "${tipoFinal}" para ${qtd} pessoas e ja gerei a lista de itens. Quer dar uma olhada?`,
          eventoId: newEvent.id,
        };
      }

      return {
        message: `Otimo! Criei o evento "${tipoFinal}" para ${qtd} pessoas. Quer que eu gere a lista de itens agora?`,
        eventoId: newEvent.id,
      };
    }

    case 'generate_items': {
      const eventoId = resolveEventoId(merged.evento_id as string | undefined, context?.evento?.id);
      const tipo = resolveEventType(merged);
      const qtd = normalizePeopleCount(merged.qtd_pessoas);
      if (!tipo || !qtd) {
        return { message: 'Preciso do tipo do evento e da quantidade de pessoas para gerar os itens.' };
      }

      let eventoIdStr = eventoId;
      if (!eventoIdStr) {
        const normalizedDate = merged.data_evento ? parseToIsoDate(String(merged.data_evento)) : undefined;
        if (normalizedDate && !isValidFutureDate(normalizedDate)) {
          return { message: 'Essa data ja passou. Me diga uma data futura para eu continuar.' };
        }
        const tipoFinal = String(merged.categoria_evento || merged.subtipo_evento || merged.tipo_evento || tipo);
        const categoriaFinal = merged.categoria_evento || (merged.subtipo_evento ? 'almoco' : undefined);
        const nomeEvento = buildEventName(tipoFinal, normalizedDate || String(merged.data_evento || ''));

        const newEvent = await upsertEvent({
          usuario_id: userId,
          nome_evento: nomeEvento,
          tipo_evento: tipoFinal,
          categoria_evento: categoriaFinal,
          subtipo_evento: merged.subtipo_evento,
          finalidade_evento: merged.finalidade_evento as string | undefined,
          qtd_pessoas: Number(qtd),
          menu: merged.menu as string | undefined,
          data_evento: normalizedDate,
          status: 'collecting_core',
        });
        eventoIdStr = String(newEvent.id);
      }

      const itensGerados = await generateItemsWithGroqLocal({
        tipo_evento: String(tipo),
        qtd_pessoas: Number(qtd),
        menu: merged.menu as string | undefined,
      });

      const itensComIds = itensGerados.map(item => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        evento_id: eventoIdStr,
        nome_item: item.nome_item || '',
        quantidade: item.quantidade || 0,
        unidade: item.unidade || 'un',
        valor_estimado: item.valor_estimado || 0,
        categoria: item.categoria || 'geral',
        prioridade: (item.prioridade || 'B') as 'A' | 'B' | 'C',
      })) as Item[];

      console.log('[GroqService] items_replace_for_event', {
        eventoId: eventoIdStr,
        itemsCount: itensComIds.length,
      });

      await rpc.items_replace_for_event(eventoIdStr, itensComIds);
      await setEventStatus(eventoIdStr, 'itens_pendentes_confirmacao');

      return {
        message: 'Pronto! Gerei a lista de itens para seu evento. Quer conferir?',
        eventoId: eventoIdStr,
      };
    }

    case 'confirm_event': {
      const eventoId = resolveEventoId(merged.evento_id as string | undefined, context?.evento?.id);
      if (!eventoId) {
        return { message: 'Nao encontrei o evento para confirmar.' };
      }

      await setEventStatus(eventoId, 'finalizado');
      return {
        message: 'Perfeito! Seu evento foi confirmado e finalizado.',
        eventoId,
      };
    }

    case 'update_event': {
      const eventoId = resolveEventoId(merged.evento_id as string | undefined, context?.evento?.id);
      if (!eventoId) {
        return { message: 'Nao encontrei o evento para atualizar.' };
      }

      const updateData: Partial<Event> = {
        usuario_id: userId,
      };

      if (merged.tipo_evento) updateData.tipo_evento = String(merged.tipo_evento);
      if (merged.categoria_evento) (updateData as any).categoria_evento = merged.categoria_evento;
      if (merged.subtipo_evento) (updateData as any).subtipo_evento = merged.subtipo_evento;
      if (merged.qtd_pessoas) updateData.qtd_pessoas = Number(merged.qtd_pessoas);
      if (merged.menu) (updateData as any).menu = merged.menu;
      if (merged.finalidade_evento) (updateData as any).finalidade_evento = merged.finalidade_evento;
      if (merged.data_evento) {
        const rawDate = String(merged.data_evento);
        const parsedDate = parseToIsoDate(rawDate);
        if (parsedDate && !isValidFutureDate(parsedDate)) {
          return { message: 'Essa data ja passou. Pode escolher uma data futura?' };
        }
        updateData.data_evento = parsedDate || rawDate;
      }

      await upsertEvent({
        ...updateData,
        id: eventoId,
      } as any);

      return {
        message: 'Evento atualizado com sucesso!',
        eventoId,
      };
    }

    default:
      return { message: 'Acao nao reconhecida.' };
  }
}

/**
 * Resultado do processamento de mensagem
 */
export interface ProcessMessageResult {
  response: string;
  actionExecuted?: {
    type: ActionData['action'];
    eventoId?: string;
  };
}

/**
 * Processa uma mensagem do usuario usando Groq
 */
export async function processMessage(
  userMessage: string,
  history: LlmMessage[],
  userId: UUID,
  context?: EventContext
): Promise<ProcessMessageResult> {
  try {
    const systemPrompt = buildSystemPrompt(context);

    const conversationMessages = history.filter(msg => msg.role !== 'system');
    conversationMessages.push({ role: 'user', content: userMessage });

    const aiResponse = await callGroqAPI(systemPrompt, conversationMessages);

    const action = detectActionJSON(aiResponse);

    if (action) {
      const actionResult = await executeAction(action, userId, context);
      return {
        response: actionResult.message,
        actionExecuted: {
          type: action.action,
          eventoId: actionResult.eventoId,
        },
      };
    }

    return { response: aiResponse };
  } catch (error) {
    console.error('[GroqService] Erro ao processar mensagem:', error);
    if (error instanceof Error) {
      if (error.message.includes('GROQ_API_KEY')) {
        return { response: 'Erro de configuracao: Chave da API Groq nao encontrada.' };
      }
      return { response: `Erro ao conectar com a IA: ${error.message}` };
    }
    return { response: 'Erro ao conectar com a IA.' };
  }
}

/**
 * Gera lista de itens usando Groq diretamente (versao exportada)
 */
export async function generateItemsWithGroq(params: {
  tipo_evento: string;
  qtd_pessoas: number;
  menu?: string;
}): Promise<Partial<Item>[]> {
  return generateItemsWithGroqLocal(params);
}

/**
 * Servico Groq exportado
 */
export const GroqService = {
  processMessage,
  generateItemsWithGroq,
};
