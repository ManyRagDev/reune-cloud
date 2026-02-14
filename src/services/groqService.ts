/**
 * Serviço de IA usando Groq API
 * Baseado no método do Kliper, adaptado para UNE.AI
 */

import { LlmMessage } from '@/types/llm';
import { Event, Item, UUID, EventStatus } from '@/types/domain';
import { rpc } from '@/api/rpc';
import { upsertEvent, setEventStatus } from '@/core/orchestrator/eventManager';


interface ActionData {
  action: 'create_event' | 'generate_items' | 'confirm_event' | 'update_event' | 'edit_item';
  data: {
    tipo_evento?: string;
    qtd_pessoas?: number;
    data_evento?: string;
    menu?: string;
    finalidade_evento?: string;
    descricao?: string;
    evento_id?: string;
    // edit_item fields
    operation?: 'add' | 'remove' | 'update' | 'multiply';
    itemName?: string;
    quantity?: number;
    multiplier?: number;
    category?: string;
  };
}

interface EventContext {
  evento?: {
    id?: string;
    tipo_evento?: string;
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

  const basePrompt = `VOCÊ É UNE.AI
Assistente do ReUNE especializado em planejar eventos sociais.
Data atual: ${todayIso}

═══════════════════════════════════════════════════════════
PERSONALIDADE
═══════════════════════════════════════════════════════════
Casual, direto e eficiente. Sem formalidades excessivas.
- Tom: Amigável mas objetivo
- Frases: Curtas e diretas
- Palavras: "ótimo", "perfeito", "bora", "beleza"
- Evite: Jargões técnicos, linguagem robótica

═══════════════════════════════════════════════════════════
FLUXO DE CRIAÇÃO DE EVENTO
═══════════════════════════════════════════════════════════
1. COLETAR: tipo do evento, quantidade de pessoas, data
2. CONFIRMAR: "Churrasco para 10 no sábado. Quer criar?"
3. EXECUTAR: Retornar JSON de criação após confirmação
4. OFERECER: "Quer que eu monte a lista de itens?"

Aceite datas como: dd/mm, dd/mm/yyyy, "sábado", "dia X", "próxima sexta"

═══════════════════════════════════════════════════════════
AÇÕES DISPONÍVEIS (retornar JSON APENAS com dados completos)
═══════════════════════════════════════════════════════════
Se for ação → retorne APENAS o JSON puro (sem markdown, sem texto)
Se for conversa → responda normalmente, SEM JSON

1. Criar evento:
{"action":"create_event","data":{"tipo_evento":"churrasco","qtd_pessoas":10,"data_evento":"2026-02-15","menu":"carnes"}}

2. Gerar lista de itens:
{"action":"generate_items","data":{"evento_id":"uuid"}}

3. Confirmar/finalizar evento:
{"action":"confirm_event","data":{"evento_id":"uuid"}}

4. Editar dados do evento:
{"action":"update_event","data":{"evento_id":"uuid","qtd_pessoas":15}}

5. Editar item da lista:
{"action":"edit_item","data":{"operation":"add","itemName":"cerveja","quantity":10}}
{"action":"edit_item","data":{"operation":"remove","itemName":"refrigerante"}}
{"action":"edit_item","data":{"operation":"update","itemName":"carne","quantity":5}}
{"action":"edit_item","data":{"operation":"multiply","itemName":"tudo","multiplier":2}}

═══════════════════════════════════════════════════════════
DETECÇÃO DE COMANDOS DE EDIÇÃO DE ITENS
═══════════════════════════════════════════════════════════
ADICIONAR: "adiciona cerveja", "coloca mais 2 pães", "bota gelo"
REMOVER: "tira refrigerante", "remove cerveja", "não precisa de gelo"
ALTERAR: "muda cerveja pra 20", "aumenta pão pra 5"
MULTIPLICAR: "dobra tudo", "triplica as bebidas"

═══════════════════════════════════════════════════════════
REGRAS CRÍTICAS
═══════════════════════════════════════════════════════════
1. SEMPRE confirme antes de criar evento ou gerar itens
2. NÃO repita perguntas se dados já foram fornecidos
3. Datas: "sábado" = próximo sábado, "dia 25" = dia 25 do mês atual
4. Se contexto tiver data definida, USE-A — não pergunte de novo
5. NÃO invente dados que o usuário não forneceu

═══════════════════════════════════════════════════════════
FALLBACK
═══════════════════════════════════════════════════════════
Se não entender: "Não entendi bem. Você quer criar um evento, editar um existente ou adicionar itens na lista?"

═══════════════════════════════════════════════════════════
EXEMPLOS
═══════════════════════════════════════════════════════════
User: "churrasco 10 pessoas sábado"
AI:  "Beleza! Churrasco para 10 pessoas no sábado. Quer criar?"
User: "sim"
AI:  {"action":"create_event","data":{"tipo_evento":"churrasco","qtd_pessoas":10,"data_evento":"2026-02-15"}}
AI:  "Pronto! Quer que eu monte a lista de itens?"
User: "pode"
AI:  {"action":"generate_items","data":{"evento_id":"..."}}

User: "adiciona 10 cervejas"
AI:  {"action":"edit_item","data":{"operation":"add","itemName":"cerveja","quantity":10}}`;

  if (context?.evento) {
    const evento = context.evento;
    return basePrompt + `

═══════════════════════════════════════════════════════════
CONTEXTO DO EVENTO ATUAL
═══════════════════════════════════════════════════════════
ID: ${evento.id || 'N/A'}
Tipo: ${evento.tipo_evento || 'Não definido'}
Pessoas: ${evento.qtd_pessoas || 'Não definido'}
Data: ${evento.data_evento || 'Não definida'}
Status: ${evento.status || 'N/A'}
${context.hasItems ? '✓ Lista de itens já gerada' : '✗ Lista ainda não gerada'}

USE ESTAS INFORMAÇÕES. Não pergunte o que já está definido.`;
  }

  return basePrompt;
}

function cleanGroqResponse(text: string): string {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
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
          const mergedAny = merged as Record<string, unknown>;
          const itensGerados = await generateItemsWithGroqLocal({
            tipo_evento: String(tipo),
            qtd_pessoas: Number(qtd),
            menu: merged.menu as string | undefined,
            finalidade_evento: (mergedAny.finalidade_evento || mergedAny.subtipo_evento || mergedAny.categoria_evento || mergedAny.descricao) as string | undefined,
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

    case 'edit_item': {
      if (!eventoIdCandidate) {
        return { message: 'Preciso saber de qual evento você quer editar os itens.' };
      }
      if (!data.operation) {
        return { message: 'Não entendi qual alteração fazer na lista.' };
      }

      const isAll = data.itemName?.match(/^(tudo|todos|todas)$/i);
      const editCommand = {
        operation: data.operation,
        target: isAll ? 'all' as const : data.category ? 'category' as const : 'specific' as const,
        itemName: isAll ? undefined : data.itemName,
        quantity: data.quantity,
        multiplier: data.multiplier,
        category: data.category as any,
        rawText: '',
      };

      const editResult = await executeItemEdit(editCommand, eventoIdCandidate, userId);
      return {
        message: editResult.message,
        eventoId: eventoIdCandidate,
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

    const aiResponse = await callGroqAPI(systemPrompt, conversationMessages);

    // Fallback: resposta vazia
    if (!aiResponse || aiResponse.trim().length === 0) {
      return { response: 'Desculpa, não entendi bem. Pode reformular?' };
    }

    // Detectar ação JSON na resposta
    const action = detectActionJSON(aiResponse);
    if (action) {
      console.log('[GroqService] Ação detectada:', action.action);
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

    // Fallback: parece JSON mas não foi parseado
    if (aiResponse.includes('"action"') && aiResponse.includes('{')) {
      console.warn('[GroqService] JSON parcial detectado mas inválido:', aiResponse.slice(0, 120));
      return { response: 'Ops! Tive um problema ao processar. Pode tentar de novo?' };
    }

    return { response: aiResponse };
  } catch (error) {
    console.error('[GroqService] Erro ao processar mensagem:', error);
    if (error instanceof Error) {
      if (error.message.includes('GROQ_API_KEY')) {
        return { response: 'Erro de configuração: Chave da API Groq não encontrada.' };
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

/**
 * Executa comando de edição de itens (Track 006)
 */
export async function executeItemEdit(
  command: import('@/core/orchestrator/itemCommands').EditItemCommand,
  eventoId: string,
  _userId: UUID  // prefixo _ = intencionalmente não usado (mantido para API compatível)
): Promise<{ message: string; success: boolean }> {
  try {
    // Buscar itens atuais do evento
    // 'itens' não está nos tipos gerados pelo Supabase, então usamos any
    const supabase = (await import('@/integrations/supabase/client')).supabase;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryResult = await (supabase as any).from('itens').select('*').eq('evento_id', eventoId);
    const error = queryResult.error;
    const currentItems: any[] = queryResult.data || [];

    if (error) throw error;
    if (currentItems.length === 0) {
      return { message: 'Não encontrei itens para editar neste evento.', success: false };
    }

    let updatedItems: any[] = [...currentItems];
    let affectedItemName = '';
    
    const { findItemByName, generateEditFeedback } = await import('@/core/orchestrator/itemCommands');
    
    switch (command.operation) {
      case 'remove': {
        const itemToRemove = findItemByName(command.itemName || '', currentItems);
        if (!itemToRemove) {
          return { message: `Não encontrei "${command.itemName}" na lista.`, success: false };
        }
        affectedItemName = itemToRemove.nome_item;
        updatedItems = currentItems.filter(item => item.id !== itemToRemove.id);
        break;
      }
      
      case 'add': {
        // Verificar se já existe item similar
        const existingItem = findItemByName(command.itemName || '', currentItems);
        if (existingItem) {
          // Atualizar quantidade
          affectedItemName = existingItem.nome_item;
          const newQty = existingItem.quantidade + (command.quantity || 1);
          updatedItems = currentItems.map(item => 
            item.id === existingItem.id ? { ...item, quantidade: newQty } : item
          );
        } else {
          // Adicionar novo item
          affectedItemName = command.itemName || 'Item';
          const newItem = {
            id: crypto.randomUUID(),
            evento_id: eventoId,
            nome_item: command.itemName || 'Novo item',
            quantidade: command.quantity || 1,
            unidade: 'un',
            valor_estimado: 0,
            categoria: 'geral',
            prioridade: 'B',
            created_at: new Date().toISOString(),
          };
          updatedItems = [...currentItems, newItem];
        }
        break;
      }
      
      case 'update': {
        const itemToUpdate = findItemByName(command.itemName || '', currentItems);
        if (!itemToUpdate) {
          return { message: `Não encontrei "${command.itemName}" na lista.`, success: false };
        }
        affectedItemName = itemToUpdate.nome_item;
        
        let newQty = itemToUpdate.quantidade;
        if (command.quantity !== undefined) {
          newQty = command.quantity;
        } else if (command.quantityDelta !== undefined) {
          newQty = Math.max(0, itemToUpdate.quantidade + command.quantityDelta);
        }
        
        updatedItems = currentItems.map(item => 
          item.id === itemToUpdate.id ? { ...item, quantidade: newQty } : item
        );
        break;
      }
      
      case 'multiply': {
        if (command.target === 'all') {
          updatedItems = currentItems.map(item => ({
            ...item,
            quantidade: Math.round(item.quantidade * (command.multiplier || 2) * 100) / 100
          }));
          affectedItemName = 'todos os itens';
        } else if (command.target === 'category' && command.category) {
          updatedItems = currentItems.map(item => 
            item.categoria === command.category 
              ? { ...item, quantidade: Math.round(item.quantidade * (command.multiplier || 2) * 100) / 100 }
              : item
          );
          affectedItemName = `itens de ${command.category}`;
        } else {
          const itemToMultiply = findItemByName(command.itemName || '', currentItems);
          if (!itemToMultiply) {
            return { message: `Não encontrei "${command.itemName}" na lista.`, success: false };
          }
          affectedItemName = itemToMultiply.nome_item;
          updatedItems = currentItems.map(item => 
            item.id === itemToMultiply.id 
              ? { ...item, quantidade: Math.round(item.quantidade * (command.multiplier || 2) * 100) / 100 }
              : item
          );
        }
        break;
      }
    }
    
    // Salvar itens atualizados
    await rpc.items_replace_for_event(eventoId, updatedItems);
    
    const feedbackMessage = generateEditFeedback(command, affectedItemName);
    return { message: feedbackMessage, success: true };
    
  } catch (error) {
    console.error('[GroqService] Erro ao executar edição de item:', error);
    return { message: 'Ops! Tive um problema ao fazer essa alteração.', success: false };
  }
}

export const GroqService = {
  processMessage,
  generateItemsWithGroq,
  executeItemEdit,
};