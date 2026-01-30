/**
 * Serviço de IA usando Groq API
 * Baseado no método do Kliper, adaptado para UNE.AI
 */

import { LlmMessage } from '@/types/llm';
import { Event, Item, UUID, EventStatus } from '@/types/domain';
import { rpc } from '@/api/rpc';
import { upsertEvent, setEventStatus } from '@/core/orchestrator/eventManager';
import { isValidFutureDate, parseToIsoDate } from '@/core/nlp/date-parser';
import { PlannerEnvelope, plannerEnvelopeSchema } from '@/api/llm/plannerSchemas';
import { systemResponses } from '@/core/orchestrator/systemResponses';


interface ActionData {
  action: 'create_event' | 'generate_items' | 'confirm_event' | 'update_event';
  data: {
    tipo_evento?: string;
    categoria_evento?: string;
    subtipo_evento?: string;
    event_name?: string;
    event_description?: string;
    qtd_pessoas?: number;
    data_evento?: string;
    menu?: string;
    finalidade_evento?: string;
    descricao?: string;
    evento_id?: string;
  };
}

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
- create_event: Quando tiver tipo_evento E qtd_pessoas (Cria status 'draft')
- generate_items: Quando evento ja existe e precisa gerar lista de itens (Muda status para 'created')
- confirm_event: APENAS quando usuario confirmar EXPLICITAMENTE ("ok, confirmado", "finalizar"). NUNCA chame isso apos gerar itens se o usuario nao confirmou. (Muda para 'finalized')
- update_event: Quando usuario quiser alterar dados do evento

**IMPORTANTE:**
- evento_id deve ser o ID numerico do evento quando existir
- Use os dados coletados e nao pergunte novamente o que ja foi informado
- Se retornar JSON, NAO escreva nada alem do JSON puro (sem markdown, sem explicacoes)
- Se nao tiver informacoes suficientes, continue a conversa normalmente perguntando o que falta
- Seja objetivo e nao divague
- **INTELIGENCIA TEMPORAL:** Se o contexto ja tiver uma data definida (ex: vinda do banco de dados para feriados), USE essa data. Nao invente datas nem pergunte novamente se ja estiver no contexto.`;

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

const PLANNER_SYSTEM_PROMPT = `
Você é o Orquestrador Logístico do ReUNE.
Sua missão é extrair dados estruturados para organizar eventos.

REGRAS RÍGIDAS DE JSON (Sua resposta deve ser APENAS JSON):
1. Use SEMPRE a chave "tipo_evento" para o nome do evento (ex: "Festa Junina", "Jantar", "Churrasco").
2. Use SEMPRE a chave "qtd_pessoas" para o número de convidados (número puro).
3. Use SEMPRE a chave "data_evento" para datas (YYYY-MM-DD).
4. Use SEMPRE a chave "menu" para o prato ou comida que será servida (ex: "Massas", "Pizza", "Japonês").

INTENÇÕES:
- "create_event": APENAS para eventos NOVOS (sem ID no contexto).
- "generate_items": APENAS se o usuário pedir EXPLICITAMENTE ("gerar lista", "ver itens"). NÃO assuma isso apenas por mudar data/pessoas.
- "update_event": Para alterar dados de um evento JÁ EXISTENTE (mudança de data, pessoas, nome, etc).
- "confirm_event": Quando o usuário confirmar lista, disser "ok", "tá bom" ou "pode ser".

Exemplo de Resposta Válida:
{
  "intent": "create_event",
  "payload": {
    "tipo_evento": "Festa Junina",
    "qtd_pessoas": 20,
    "categoria_evento": "festa"
  }
}
`;

function buildPlannerPrompt(context?: EventContext): string {
  const contextPayload = {
    today: new Date().toISOString().slice(0, 10),
    evento: context?.evento || null,
    collected_data: context?.collectedData || {},
  };

  return `${PLANNER_SYSTEM_PROMPT}

Contexto (JSON):
${JSON.stringify(contextPayload)}
`;
}

function cleanGroqResponse(text: string): string {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

function parsePlannerEnvelope(content: string) {
  try {
    const cleaned = cleanGroqResponse(content);
    const parsed = JSON.parse(cleaned);
    const validated = plannerEnvelopeSchema.safeParse(parsed);
    if (!validated.success) {
      const msg = validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      return { ok: false as const, error: msg };
    }
    return { ok: true as const, data: validated.data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : 'json invalido' };
  }
}

function plannerToAction(plan: PlannerEnvelope): ActionData | null {
  if (
    plan.intent === 'create_event'
    || plan.intent === 'generate_items'
    || plan.intent === 'update_event'
    || plan.intent === 'confirm_event'
  ) {
    return {
      action: plan.intent,
      data: plan.payload as ActionData['data'],
    };
  }
  return null;
}

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

function detectActionJSON(content: string): ActionData | null {
  try {
    const cleaned = cleanGroqResponse(content);
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
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

function buildMissingEventDataMessage(tipo?: string, qtd?: number): string {
  if (tipo && !qtd) return `Legal, ${tipo}! E para quantas pessoas seria?`;
  if (!tipo && qtd) return `Entendido, para ${qtd} pessoas. E qual é o tipo do evento (ex: Churrasco, Jantar)?`;
  return "Para começar, qual o tipo de evento e quantas pessoas?";
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

async function generateItemsWithGroqLocal(params: {
  tipo_evento: string;
  qtd_pessoas: number;
  menu?: string;
  finalidade_evento?: string;
  excluir_alcool?: boolean;
}): Promise<Partial<Item>[]> {
  const perfilEvento = params.finalidade_evento
    ? `${params.tipo_evento} de ${params.finalidade_evento}`
    : params.tipo_evento;

  const excluirAlcool = params.excluir_alcool !== false;

  const systemPrompt = `
  ROLE:
  Você é um organizador de eventos brasileiro experiente (Party Planner), especializado em calcular quantidades exatas de comida e bebida para evitar desperdícios ou falta.

  TASK:
  Crie uma lista de compras detalhada e culturalmente adequada para o evento abaixo.

  CONTEXTO DO EVENTO:
  - Tipo/Perfil: "${perfilEvento}"
  - Quantidade de pessoas: ${params.qtd_pessoas}
  ${params.menu ? `- Menu/Prato Principal: "${params.menu}"` : ''}
  ${params.finalidade_evento ? `- Ocasião especial: "${params.finalidade_evento}" (adapte para essa celebração no Brasil)` : ''}

  DIRETRIZES DE INTELIGÊNCIA CULTURAL E COERÊNCIA (CRÍTICO):
  1. ADAPTAÇÃO INTELIGENTE AO TEMA:
     - Use seu conhecimento sobre a cultura brasileira para selecionar itens TÍPICOS e COERENTES com o evento.
     - A lista deve "ter a cara" do evento. Evite sugestões genéricas ou sofisticadas demais se o evento for tradicional/rústico.
     - Analise a "vibe" do evento: um "Churrasco na laje" é diferente de um "Jantar de Gala". Adapte os itens.

  2. EXEMPLOS DE PADRÕES ESPERADOS (Use como referência de raciocínio):
     - Exemplo "Festa Junina": Espera-se Paçoca, Quentão, Milho, Canjica, Cachorro-quente. (Evite itens de churrasco como Picanha ou Linguiça, a menos que explicitamente pedido Espetinho).
     - Exemplo "Churrasco": Espera-se Picanha, Linguiça, Pão de Alho, Farofa.
     - Exemplo "Natal/Ceia": Espera-se Peru/Chester, Rabanada, Frutas Secas.
     -> APLIQUE ESSE MESMO NÍVEL DE COERÊNCIA PARA QUALQUER OUTRO TEMA SOLICITADO.
     -> CASO O TEMA NÃO ESTEJA NOS EXEMPLOS (ex: "Aniversário Infantil", "Bodas", "Reunião", "Festa"): Use sua inteligência para sugerir itens clássicos e adequados a esse tipo específico de evento. NÃO use os exemplos acima se não fizerem sentido.

  3. CÁLCULO DE QUANTIDADES (HEURÍSTICA):
     - Considere um evento de 4 a 5 horas.
     - Comida (Refeição): Calcule aprox. 400g a 500g de carne/massa por pessoa.
     - Comida (Coquetel): Calcule 12 a 15 salgados por pessoa.
     - Bebida: Calcule com sobra (ex: 2 a 3 garrafas de 600ml de cerveja por pessoa se for churrasco).

  4. RESTRIÇÕES E REGRAS:
     - NÃO sugira "Bolo de aniversário" se o evento NÃO for um aniversário.
     - NÃO encha a lista apenas de descartáveis. A prioridade é a COMIDA e BEBIDA.
     - Use nomes de produtos comuns no Brasil (ex: "Alcatra" em vez de "Carne bovina", "Refrigerante 2L" em vez de "Bebida gasosa").
     - "valor_estimado": Use preços médios de mercado em Reais (R$).
     ${excluirAlcool ? '- NÃO inclua bebidas alcoólicas (cerveja, vinho, etc.) na lista. Apenas refrigerantes, sucos e água.' : ''}

  FORMATO DE SAÍDA (JSON array puro, sem markdown):
  [
    {
      "nome_item": "Picanha (ou carne principal)",
      "quantidade": 0,
      "unidade": "kg",
      "valor_estimado": 0,
      "categoria": "comida", 
      "prioridade": "A"
    }
  ]
  (Categorias permitidas: "comida", "bebida", "descartaveis", "decoracao", "combustivel", "outros")
  (Prioridades: "A" = Essencial, "B" = Importante, "C" = Opcional)

  IMPORTANTE:
  - Responda APENAS o JSON.
  - Sem texto introdutório.
  - Sem markdown (\`\`\`json).
  `;

  const userPrompt = `Gere a lista para o evento "${perfilEvento}" com ${params.qtd_pessoas} pessoas.
Siga as diretrizes culturais. Se for um evento temático, respeite as tradições. Se for um evento comum (aniversário, reunião), sugira itens adequados ao público e ocasião.`;

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

async function executeAction(actionData: ActionData, userId: UUID, context?: any): Promise<any> {
  const { action, data } = actionData;

  const merged = { ...(context?.collectedData || {}), ...data };

  let tipo = merged.tipo_evento;
  let qtd = merged.qtd_pessoas;
  let eventoIdCandidate = merged.evento_id || context?.evento?.id;

  const { ContextManager } = await import('@/core/orchestrator/contextManager');
  const contextManager = new ContextManager();

  if (action === 'create_event') {
    const currentStatus = context?.evento?.status;
    const isAdvancedStatus = ['created', 'finalized'].includes(currentStatus || '');

    if (isAdvancedStatus) {
      console.log('[GroqService] Detectado início de NOVA thread de evento. Limpando contexto anterior.');
      eventoIdCandidate = undefined;

      await contextManager.clearUserContext(userId);

      merged.finalidade_evento = data.finalidade_evento;
      merged.categoria_evento = data.categoria_evento;
      merged.subtipo_evento = data.subtipo_evento;
      merged.menu = data.menu;

      tipo = data.tipo_evento;
      qtd = data.qtd_pessoas;
    }
  }

  console.log('[GroqService] Dados Identificados:', { tipo, qtd, raw: data });

  switch (action) {
    case 'create_event':
    case 'generate_items': {
      if ((!tipo || !qtd) && action === 'generate_items') {
        console.log('[GroqService] Falta dados para gerar itens. Pedindo mais detalhes...');
      }

      if (!merged.menu) {
        const dataAny = data as any;
        const menuCandidate = dataAny.sugestao_prato || dataAny.prato || dataAny.comida || dataAny.cardapio;
        if (menuCandidate) {
          merged.menu = menuCandidate;
          console.log('[GroqService] Recuperado menu de chave alternativa:', menuCandidate);
        }
      }

      if (!tipo || !qtd) {
        return {
          message: buildMissingEventDataMessage(tipo, qtd ? Number(qtd) : undefined),
          extractedData: merged
        };
      }

      const holidayData = await rpc.get_holiday_date_by_name(tipo);
      let dataFinal = merged.data_evento;

      if (holidayData && !dataFinal) {
        dataFinal = holidayData.date;
      }

      const GENERIC_TYPES = ['jantar', 'almoco', 'almoço', 'ceia', 'lanche', 'cafe da manha', 'brunch', 'refeição', 'refeicao'];
      const isGeneric = GENERIC_TYPES.some(t => tipo?.toLowerCase().includes(t));
      const hasMenu = !!merged.menu;
      const hasDate = !!dataFinal;

      // Status inicial simplificado: sempre 'draft' durante a coleta
      let initialStatus: EventStatus = 'draft';
      let missingFieldMessage = '';

      if (!hasDate && isGeneric && !hasMenu) {
        // Logica de perguntas mantida, mas status no banco é DRAFT
        missingFieldMessage = `Combinado, um ${tipo} para ${qtd} pessoas. \n\n**Para quando é o evento e o que você pensa em servir?**`;
      } else if (!hasDate) {
        missingFieldMessage = `Combinado, um ${tipo} para ${qtd} pessoas. \n\n**Para qual data devo agendar?**`;
      } else if (isGeneric && !hasMenu) {
        missingFieldMessage = `Combinado, um ${tipo} para ${qtd} pessoas no dia ${formatDateForName(dataFinal)}. \n\nPara eu montar a lista certa: **O que você pensa em servir?**`;
      }

      const eventPayload = {
        usuario_id: userId,
        nome_evento: tipo,
        tipo_evento: tipo,
        qtd_pessoas: Number(qtd),
        data_evento: dataFinal,
        status: initialStatus,
        id: eventoIdCandidate
      };

      try {
        console.log('[GroqService] Tentando criar/atualizar evento:', {
          payload: eventPayload,
          initialStatus,
          missingFieldMessage
        });

        const newEvent = await upsertEvent(eventPayload);

        console.log('[GroqService] Evento criado/atualizado com sucesso:', {
          eventId: newEvent.id,
          tipo: newEvent.tipo_evento,
          data: newEvent.data_evento
        });

        if (missingFieldMessage) {
          return {
            message: missingFieldMessage,
            eventoId: newEvent.id,
            extractedData: merged
          };
        }

        if (action === 'generate_items' || (tipo && qtd && dataFinal)) {
          console.log('[GroqService] Gerando itens...');
          const itensGerados = await generateItemsWithGroqLocal({
            tipo_evento: String(tipo),
            qtd_pessoas: Number(qtd),
            menu: merged.menu as string | undefined,
            finalidade_evento: (merged.finalidade_evento || merged.subtipo_evento || merged.categoria_evento || merged.descricao) as string | undefined,
          });

          const itensComIds = itensGerados.map(item => ({
            ...item,
            id: item.id || crypto.randomUUID(),
            evento_id: String(newEvent.id),
            nome_item: item.nome_item || '',
            quantidade: item.quantidade || 0,
            unidade: item.unidade || 'un',
            valor_estimado: item.valor_estimado || 0,
            categoria: item.categoria || 'geral',
            prioridade: (item.prioridade || 'B') as 'A' | 'B' | 'C',
          })) as Item[];

          await rpc.items_replace_for_event(String(newEvent.id), itensComIds);

          // MUDANÇA DE STATUS: Itens gerados -> 'created'
          await setEventStatus(String(newEvent.id), 'created');

          return {
            message: `Criei sua lista para o ${tipo} (${qtd} pessoas). Quer dar uma olhada?`,
            eventoId: newEvent.id,
            extractedData: merged
          };
        }

        return {
          message: `Evento "${tipo}" criado! Data sugerida: ${dataFinal || 'a definir'}. Posso gerar a lista de itens?`,
          eventoId: newEvent.id,
          extractedData: merged
        };

      } catch (error) {
        console.error('[GroqService] Erro ao salvar evento:', error);
        return {
          message: "Tive um pequeno problema técnico ao salvar. Podemos tentar de novo?",
          extractedData: { ...merged, evento_id: undefined }
        };
      }
    }

    case 'confirm_event': {
      if (!eventoIdCandidate) return { message: 'Nao encontrei o evento para confirmar.' };
      await setEventStatus(eventoIdCandidate, 'finalized'); // NEW STATUS
      return {
        message: 'Perfeito! Seu evento foi confirmado e finalizado.',
        eventoId: eventoIdCandidate,
      };
    }

    case 'update_event': {
      if (!eventoIdCandidate) return { message: 'Não encontrei o evento para atualizar.' };

      const updateData: Partial<Event> = { usuario_id: userId };
      if (merged.tipo_evento) updateData.tipo_evento = merged.tipo_evento;
      if (merged.qtd_pessoas) updateData.qtd_pessoas = Number(merged.qtd_pessoas);
      if (merged.data_evento) updateData.data_evento = merged.data_evento;

      await upsertEvent({ ...updateData, id: eventoIdCandidate } as any);

      // Feedback mais natural
      const parts = [];
      if (merged.data_evento) parts.push(`Data alterada para ${formatDateForName(merged.data_evento as string)}`);
      if (merged.qtd_pessoas) parts.push(`Quantidade ajustada para ${merged.qtd_pessoas} pessoas`);

      return {
        message: parts.length > 0 ? `Pronto! ${parts.join('. ')}.` : 'Evento atualizado com sucesso!',
        eventoId: eventoIdCandidate
      };
    }

    default:
      return { message: 'Ação não reconhecida.' };
  }
}

export interface ProcessMessageResult {
  response: string;
  actionExecuted?: {
    type: ActionData['action'];
    eventoId?: string;
    extractedData?: Record<string, any>;
  };
}

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

    let plannerResult: ReturnType<typeof parsePlannerEnvelope> | null = null;
    try {
      const plannerPrompt = buildPlannerPrompt(context);
      const plannerResponse = await callGroqAPI(
        plannerPrompt,
        [{ role: 'user', content: userMessage }],
        0.1
      );
      plannerResult = parsePlannerEnvelope(plannerResponse);
      if (plannerResult.ok) {
        const plannedAction = plannerToAction(plannerResult.data);
        if (plannedAction) {
          const actionResult = await executeAction(plannedAction, userId, context);
          return {
            response: actionResult.message,
            actionExecuted: {
              type: plannedAction.action,
              eventoId: actionResult.eventoId,
              extractedData: actionResult.extractedData,
            },
          };
        }
      }
    } catch {
      plannerResult = { ok: false as const, error: 'planner falhou' };
    }

    const aiResponse = await callGroqAPI(systemPrompt, conversationMessages);
    const action = detectActionJSON(aiResponse);
    if (action) {
      const actionResult = await executeAction(action, userId, context);
      return {
        response: actionResult.message,
        actionExecuted: {
          type: action.action,
          eventoId: actionResult.eventoId,
          extractedData: actionResult.extractedData,
        },
      };
    }

    return { response: aiResponse || systemResponses.plannerInvalid };
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

export async function generateItemsWithGroq(params: {
  tipo_evento: string;
  qtd_pessoas: number;
  menu?: string;
}): Promise<Partial<Item>[]> {
  return generateItemsWithGroqLocal(params);
}

export const GroqService = {
  processMessage,
  generateItemsWithGroq,
};