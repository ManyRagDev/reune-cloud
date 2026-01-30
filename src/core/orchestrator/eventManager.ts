import { Event, EventSnapshot, Item, UUID, EventStatus } from "@/types/domain";
import { getLlmSuggestions } from "@/api/llm/chat";
import { rpc } from "@/api/rpc";
import { supabase } from "@/integrations/supabase/client";
import { parseLlmItemsResponse } from "./itemAdapter";
import { parseToIsoDate } from "@/core/nlp/date-parser";

/**
 * Busca snapshot completo do evento (evento + itens + participantes)
 */
export async function getPlanSnapshot(eventoId: UUID): Promise<EventSnapshot | null> {
  console.log(`[Manager] getPlanSnapshot called with eventoId: ${eventoId}`);
  try {
    const snapshot = await rpc.get_event_plan(eventoId);
    return snapshot as EventSnapshot;
  } catch (error) {
    console.error('[Manager] Erro ao buscar snapshot:', error);
    return null;
  }
}

/**
 * Busca o rascunho (draft) mais recente do usuário
 */
export async function findDraftEventByUser(userId: UUID): Promise<EventSnapshot | null> {
  console.log(`[Manager] findDraftEventByUser called with userId: ${userId}`);
  try {
    const { data, error } = await supabase
      .from('table_reune')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      console.log('[Manager] Nenhum draft encontrado');
      return null;
    }

    console.log('[Manager] Draft encontrado:', data);

    const snapshot: EventSnapshot = {
      evento: {
        id: data.id.toString(),
        usuario_id: data.user_id,
        nome_evento: data.title,
        tipo_evento: data.tipo_evento || '',
        data_evento: data.event_date,
        qtd_pessoas: data.qtd_pessoas || 0,
        status: 'draft',
      },
      itens: [],
      participantes: [],
      distribuicao: [],
    };

    return snapshot;
  } catch (error) {
    console.error('[Manager] Erro ao buscar draft:', error);
    return null;
  }
}

/**
 * Cria ou atualiza um evento (Upsert)
 * Normaliza datas e define status inicial como 'draft'
 */
export async function upsertEvent(event: Partial<Event> & { usuario_id: UUID; created_by_ai?: boolean }): Promise<Event> {
  try {
    let eventDate: string | undefined;

    if (event.data_evento) {
      const parsedDate = parseToIsoDate(event.data_evento);
      if (parsedDate) eventDate = parsedDate;
    }

    // Fallback de data para hoje (Local) se for novo evento e sem data explícita
    if (!event.id && !eventDate) {
      const now = new Date();
      // YYYY-MM-DD Local
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      eventDate = `${year}-${month}-${day}`;
      console.log('[Manager] Data de fallback gerada (Local):', eventDate);
    }

    const eventData: any = {
      user_id: event.usuario_id,
      event_time: '12:00', // Default time to avoid timezone shifts
      status: event.status || 'draft',
      created_by_ai: event.created_by_ai ?? true,
    };

    // Populando campos opcionais
    if (event.nome_evento) eventData.title = event.nome_evento;
    if (eventDate) eventData.event_date = eventDate;
    if (event.tipo_evento) eventData.tipo_evento = event.tipo_evento;
    if (event.qtd_pessoas) eventData.qtd_pessoas = event.qtd_pessoas;
    if ((event as any).categoria_evento) eventData.categoria_evento = (event as any).categoria_evento;
    if ((event as any).subtipo_evento) eventData.subtipo_evento = (event as any).subtipo_evento;
    if ((event as any).menu) eventData.menu = (event as any).menu;
    if ((event as any).finalidade_evento) eventData.finalidade_evento = (event as any).finalidade_evento;

    const { data, error } = event.id
      ? await supabase.from('table_reune').update(eventData).eq('id', parseInt(event.id, 10)).select().single()
      : await supabase.from('table_reune').insert(eventData).select().single();

    if (error) throw error;

    return {
      id: data.id.toString(),
      usuario_id: data.user_id,
      nome_evento: data.title,
      tipo_evento: data.tipo_evento || '',
      data_evento: data.event_date,
      qtd_pessoas: data.qtd_pessoas || 0,
      status: data.status as EventStatus,
    };
  } catch (error) {
    console.error('[Manager] Erro no upsertEvent:', error);
    throw error;
  }
}

/**
 * Atualiza apenas o status do evento
 */
export async function setEventStatus(eventoId: UUID, status: EventStatus): Promise<void> {
  console.log(`[Manager] setEventStatus called with eventoId: ${eventoId}, status: ${status}`);
  try {
    const eventIdNum = typeof eventoId === 'string' ? parseInt(eventoId, 10) : eventoId;

    const { error } = await supabase
      .from('table_reune')
      .update({ status: status })
      .eq('id', eventIdNum);

    if (error) {
      console.error('[Manager] Erro ao atualizar status:', error);
      throw error;
    }
  } catch (error) {
    console.error('[Manager] Erro ao atualizar status do evento:', error);
    throw error;
  }
}

/**
 * Gera lista de itens usando a IA (com fallback)
 */
export async function generateItemList(params: {
  tipo_evento: string;
  qtd_pessoas: number;
  menu?: string;
  finalidade_evento?: string;
  excluir_alcool?: boolean;
}): Promise<Partial<Item>[]> {
  console.log('[Manager] generateItemList called with:', params);

  const perfilEvento = params.finalidade_evento
    ? `${params.tipo_evento} de ${params.finalidade_evento}`
    : params.tipo_evento;

  const excluirAlcool = params.excluir_alcool !== false;

  const systemPrompt = `Você é um especialista em planejamento e organização de eventos sociais e corporativos no Brasil.
Sua função é montar uma lista estruturada de itens e quantidades necessários.

EVENTO:
- Tipo/Perfil: "${perfilEvento}"
- Quantidade de pessoas: ${params.qtd_pessoas}
${params.menu ? `- Menu: "${params.menu}"` : ''}
${params.finalidade_evento ? `- Ocasião: "${params.finalidade_evento}"` : ''}

REGRAS:
1. Adapte os itens à cultura brasileira e ao tipo de evento.
2. Calcule quantidades para 4-5 horas de duração.
3. ${excluirAlcool ? 'NÃO inclua bebidas alcoólicas.' : 'Inclua bebidas se apropriado.'}
4. Retorne APENAS JSON válido (array de objetos).

FORMATO JSON:
[
  {
    "nome_item": string,
    "quantidade": number,
    "unidade": string,
    "valor_estimado": number,
    "categoria": "comida" | "bebida" | "descartaveis" | "decoracao" | "combustivel" | "outros",
    "prioridade": "A" | "B" | "C"
  }
]`;

  const userPrompt = `Gere a lista para o evento "${perfilEvento}" com ${params.qtd_pessoas} pessoas.`;

  try {
    const llmResponse = await getLlmSuggestions(systemPrompt, [
      { role: 'user', content: userPrompt }
    ], 0.3);

    if (!llmResponse || !llmResponse.content) {
      console.warn('[Manager] LLM vazia, usando fallback');
      return generateFallbackItems(params.tipo_evento, params.qtd_pessoas);
    }

    try {
      const items = parseLlmItemsResponse(llmResponse.content);
      console.info('[Manager] Itens gerados pela LLM:', items.length);
      return items;
    } catch (adapterError) {
      console.error('[Manager] Erro no adapter:', adapterError);
      return generateFallbackItems(params.tipo_evento, params.qtd_pessoas);
    }
  } catch (error) {
    console.error('[Manager] Erro na LLM:', error);
    return generateFallbackItems(params.tipo_evento, params.qtd_pessoas);
  }
}

function generateFallbackItems(tipo_evento: string, qtd_pessoas: number): Partial<Item>[] {
  const isChurrasco = tipo_evento.toLowerCase().includes('churrasco');

  const items = [
    {
      nome_item: isChurrasco ? 'Carne Bovina' : 'Prato Principal',
      quantidade: Math.max(1, qtd_pessoas * 0.4),
      unidade: 'kg',
      valor_estimado: 40 * qtd_pessoas * 0.4,
      categoria: 'comida',
      prioridade: 'A'
    },
    {
      nome_item: 'Refrigerante',
      quantidade: Math.max(2, qtd_pessoas * 0.6),
      unidade: 'L',
      valor_estimado: 6 * qtd_pessoas * 0.6,
      categoria: 'bebida',
      prioridade: 'A'
    }
  ];

  return items.map(i => ({ ...i, prioridade: i.prioridade as 'A' | 'B' | 'C' }));
}

/**
 * Finaliza o evento (Status: finalized)
 */
export async function finalizeEvent(eventoId: UUID): Promise<EventSnapshot | null> {
  console.log(`[Manager] finalizeEvent called with eventoId: ${eventoId}`);
  try {
    await setEventStatus(eventoId, 'finalized');
    return await getFinalSnapshot(eventoId);
  } catch (error) {
    console.error('[Manager] Erro ao finalizar evento:', error);
    throw error;
  }
}

/**
 * Retorna snapshot final do evento com itens e participantes
 */
export async function getFinalSnapshot(eventoId: UUID): Promise<EventSnapshot | null> {
  try {
    const eventIdNum = typeof eventoId === 'string' ? parseInt(eventoId, 10) : eventoId;

    const { data: evento, error: eventoError } = await supabase
      .from('table_reune')
      .select('*')
      .eq('id', eventIdNum)
      .single();

    if (eventoError || !evento) return null;

    // Busca itens
    const { data: itens } = await supabase.from('event_items').select('*').eq('event_id', eventIdNum);

    // Busca participantes
    const { data: participantes } = await supabase.from('event_participants').select('*').eq('event_id', eventIdNum);

    return {
      evento: {
        id: evento.id.toString(),
        usuario_id: evento.user_id,
        nome_evento: evento.title,
        tipo_evento: evento.tipo_evento || '',
        data_evento: evento.event_date,
        qtd_pessoas: evento.qtd_pessoas || 0,
        status: evento.status as EventStatus,
      },
      itens: (itens || []).map(item => ({
        id: item.id.toString(),
        evento_id: item.event_id.toString(),
        nome_item: item.nome_item,
        quantidade: Number(item.quantidade),
        unidade: item.unidade,
        valor_estimado: Number(item.valor_estimado),
        categoria: item.categoria,
        prioridade: item.prioridade as 'A' | 'B' | 'C',
      })),
      participantes: (participantes || []).map(p => ({
        id: p.id.toString(),
        evento_id: p.event_id.toString(),
        nome_participante: p.nome_participante,
        contato: p.contato,
        status_convite: p.status_convite as 'pendente' | 'confirmado' | 'recusado',
      })),
      distribuicao: [],
    };
  } catch (error) {
    console.error('[Manager] Erro ao buscar snapshot final:', error);
    return null;
  }
}

// Re-export auxiliar para manter compatibilidade com algumas chamadas
export async function generateEventName(params: { tipo_evento: string; qtd_pessoas: number }): Promise<string> {
  return `${params.tipo_evento.charAt(0).toUpperCase() + params.tipo_evento.slice(1)} - ${params.qtd_pessoas} pessoas`;
}
