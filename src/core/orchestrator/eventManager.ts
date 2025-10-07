import { Event, EventSnapshot, Item, UUID } from "@/types/domain";
import { getLlmSuggestions } from "@/api/llm/chat";
import { rpc } from "@/api/rpc";
import { supabase } from "@/integrations/supabase/client";
import { parseLlmItemsResponse } from "./itemAdapter";

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

export async function findDraftEventByUser(userId: UUID): Promise<EventSnapshot | null> {
  console.log(`[Manager] findDraftEventByUser called with userId: ${userId}`);
  try {
    // Busca eventos do usuário com status 'draft'
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

    // Monta o snapshot a partir dos dados do draft
    const snapshot: EventSnapshot = {
      evento: {
        id: data.id.toString(),
        usuario_id: data.user_id,
        nome_evento: data.title,
        tipo_evento: data.tipo_evento || '',
        data_evento: data.event_date,
        qtd_pessoas: data.qtd_pessoas || 0,
        status: 'collecting_core',
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

export async function upsertEvent(event: Partial<Event> & { usuario_id: UUID }): Promise<Event> {
  console.log('[Manager] upsertEvent called with:', event);
  
  try {
    const eventData: any = {
      user_id: event.usuario_id,
      title: event.nome_evento || 'Rascunho',
      description: '',
      event_date: event.data_evento ? new Date(event.data_evento).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      event_time: '12:00',
      status: event.status === 'collecting_core' ? 'draft' : event.status || 'draft',
      is_public: false,
      tipo_evento: event.tipo_evento,
      qtd_pessoas: event.qtd_pessoas,
    };

    if (event.id) {
      // Update existing event
      const eventIdNum = typeof event.id === 'string' ? parseInt(event.id, 10) : event.id;
      const { data, error } = await supabase
        .from('table_reune')
        .update(eventData)
        .eq('id', eventIdNum)
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id.toString(),
        usuario_id: data.user_id,
        nome_evento: data.title,
        tipo_evento: event.tipo_evento || '',
        data_evento: data.event_date,
        qtd_pessoas: event.qtd_pessoas || 0,
        status: data.status === 'draft' ? 'collecting_core' : data.status as Event['status'],
      };
    } else {
      // Create new event
      const { data, error } = await supabase
        .from('table_reune')
        .insert(eventData)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id.toString(),
        usuario_id: data.user_id,
        nome_evento: data.title,
        tipo_evento: event.tipo_evento || '',
        data_evento: data.event_date,
        qtd_pessoas: event.qtd_pessoas || 0,
        status: data.status === 'draft' ? 'collecting_core' : data.status as Event['status'],
      };
    }
  } catch (error) {
    console.error('[Manager] Erro ao criar/atualizar evento:', error);
    throw error;
  }
}

export async function generateItemList(params: {
  tipo_evento: string;
  qtd_pessoas: number;
}): Promise<Partial<Item>[]> {
  console.log('[Manager] generateItemList called with:', params);

  const systemPrompt = `Você é um especialista em planejamento de eventos.
Gere uma lista de itens para um evento do tipo "${params.tipo_evento}" para ${params.qtd_pessoas} pessoas.

Retorne APENAS um array JSON válido, sem markdown ou explicações.
Cada item deve ter exatamente estes campos (sem campos extras):
{
  "nome_item": string,
  "quantidade": number,
  "unidade": string,
  "valor_estimado": number,
  "categoria": string,
  "prioridade": "A" | "B" | "C"
}

Categorias comuns: comida, bebida, descartaveis, decoracao, combustivel.
Prioridade: A = essencial, B = importante, C = opcional.
Use a quantidade de pessoas para calcular as quantidades.`;

  const userPrompt = `Evento: ${params.tipo_evento}, Pessoas: ${params.qtd_pessoas}`;

  try {
    const llmResponse = await getLlmSuggestions(systemPrompt, [
      { role: 'user', content: userPrompt }
    ], 0.3);

    if (!llmResponse || !llmResponse.content) {
      console.warn('[Manager] LLM não retornou resposta, usando fallback');
      return generateFallbackItems(params.tipo_evento, params.qtd_pessoas);
    }

    // Usa o adapter robusto para processar a resposta
    try {
      const items = parseLlmItemsResponse(llmResponse.content);
      console.info('[Manager] Itens gerados pela LLM:', items.length);
      return items;
    } catch (adapterError) {
      console.error('[Manager] Erro no adapter, usando fallback:', adapterError);
      return generateFallbackItems(params.tipo_evento, params.qtd_pessoas);
    }
  } catch (error) {
    console.error('[Manager] Erro ao gerar itens com LLM:', error);
    return generateFallbackItems(params.tipo_evento, params.qtd_pessoas);
  }
}

// Função de fallback para gerar itens básicos
function generateFallbackItems(tipo_evento: string, qtd_pessoas: number): Partial<Item>[] {
  const baseItems = [
    {
      nome_item: 'Item principal',
      quantidade: Math.max(1, qtd_pessoas * 0.2),
      unidade: 'kg',
      valor_estimado: 25.90 * qtd_pessoas * 0.2,
      categoria: 'comida',
      prioridade: 'A'
    },
    {
      nome_item: 'Bebidas',
      quantidade: Math.max(1, qtd_pessoas * 0.5),
      unidade: 'L',
      valor_estimado: 8.90 * qtd_pessoas * 0.5,
      categoria: 'bebida',
      prioridade: 'A'
    },
    {
      nome_item: 'Copos/Pratos',
      quantidade: qtd_pessoas * 1.2,
      unidade: 'un',
      valor_estimado: 0.50 * qtd_pessoas * 1.2,
      categoria: 'descartaveis',
      prioridade: 'B'
    }
  ];

  // Personaliza baseado no tipo de evento
  if (tipo_evento.toLowerCase().includes('churrasco')) {
    baseItems[0].nome_item = 'Carne';
    baseItems.push({
      nome_item: 'Carvão',
      quantidade: Math.max(1, qtd_pessoas * 0.1),
      unidade: 'kg',
      valor_estimado: 12.90 * qtd_pessoas * 0.1,
      categoria: 'combustivel',
      prioridade: 'A'
    });
  } else if (tipo_evento.toLowerCase().includes('pizza')) {
    baseItems[0].nome_item = 'Pizzas';
    baseItems[0].unidade = 'un';
    baseItems[0].quantidade = Math.max(1, qtd_pessoas * 0.3);
  }

  return baseItems.map(item => ({
    ...item,
    prioridade: item.prioridade as 'A' | 'B' | 'C'
  }));
}

export async function setEventStatus(eventoId: UUID, status: Event['status']): Promise<void> {
  console.log(`[Manager] setEventStatus called with eventoId: ${eventoId}, status: ${status}`);
  try {
    const eventIdNum = typeof eventoId === 'string' ? parseInt(eventoId, 10) : eventoId;
    const mappedStatus = status === 'collecting_core' ? 'draft' : status;
    
    const { error } = await supabase
      .from('table_reune')
      .update({ status: mappedStatus })
      .eq('id', eventIdNum);

    if (error) {
      console.error('[Manager] Erro ao atualizar status:', error);
      throw error;
    }
  } catch (error) {
    console.error('[Manager] Erro ao atualizar status do evento:', error);
  }
}