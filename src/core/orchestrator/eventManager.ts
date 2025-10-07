import { Event, EventSnapshot, Item, UUID } from "@/types/domain";
import { getLlmSuggestions } from "@/api/llm/chat";

// Mock data for stubs
const mockEvent: Event = {
  id: 'evt_123',
  usuario_id: 'user_123',
  nome_evento: 'Rascunho',
  tipo_evento: 'churrasco',
  data_evento: new Date().toISOString(),
  qtd_pessoas: 10,
  status: 'collecting_core',
};

const mockItems: Item[] = [];

const mockSnapshot: EventSnapshot = {
  evento: mockEvent,
  itens: mockItems,
  participantes: [],
  distribuicao: [],
};

export async function getPlanSnapshot(eventoId: UUID): Promise<EventSnapshot | null> {
  console.log(`[Stub] getPlanSnapshot called with eventoId: ${eventoId}`);
  if (eventoId === 'evt_123') {
    return Promise.resolve(mockSnapshot);
  }
  return Promise.resolve(null);
}

export async function findDraftEventByUser(userId: UUID): Promise<EventSnapshot | null> {
  console.log(`[Stub] findDraftEventByUser called with userId: ${userId}`);
  // Return a draft if you want to simulate finding one
  return Promise.resolve(null);
}

export async function upsertEvent(event: Partial<Event> & { usuario_id: UUID }): Promise<Event> {
  console.log('[Stub] upsertEvent called with:', event);
  const newEvent: Event = {
    id: event.id || `evt_${Math.random().toString(36).substr(2, 9)}`,
    usuario_id: event.usuario_id,
    nome_evento: event.nome_evento || 'Rascunho',
    tipo_evento: event.tipo_evento || 'indefinido',
    data_evento: event.data_evento || new Date().toISOString(),
    qtd_pessoas: event.qtd_pessoas || 0,
    status: event.status || 'collecting_core',
  };
  return Promise.resolve(newEvent);
}

export async function generateItemList(params: {
  tipo_evento: string;
  qtd_pessoas: number;
}): Promise<Partial<Item>[]> {
  console.log('[Manager] generateItemList called with:', params);

  // Chama a LLM para gerar sugestões de itens baseadas no tipo de evento e quantidade de pessoas
  const systemPrompt = `Você é um especialista em planejamento de eventos. 
Com base no tipo de evento "${params.tipo_evento}" e para ${params.qtd_pessoas} pessoas, 
gere uma lista de itens necessários com quantidades estimadas.

Retorne APENAS um array JSON válido no seguinte formato:
[
  {
    "nome_item": "Nome do item",
    "quantidade": 1.5,
    "unidade": "kg ou un ou L",
    "valor_estimado": 25.90,
    "categoria": "comida ou bebida ou descartaveis",
    "prioridade": "A ou B ou C"
  }
]

Prioridade A: Itens essenciais
Prioridade B: Itens importantes
Prioridade C: Itens opcionais

Considere a quantidade de pessoas para calcular as quantidades.`;

  const userMessage = `Gere itens para um ${params.tipo_evento} para ${params.qtd_pessoas} pessoas.`;

  try {
    const llmResponse = await getLlmSuggestions(
      systemPrompt,
      [{ role: 'user', content: userMessage }],
      0.3
    );

    if (llmResponse && llmResponse.content) {
      // Tenta extrair o JSON da resposta da LLM
      const jsonMatch = llmResponse.content.match(/\[\s*\{.*\}\s*\]/s);
      if (jsonMatch) {
        const items = JSON.parse(jsonMatch[0]);
        console.log('[Manager] Itens gerados pela LLM:', items);
        return items;
      }
    }

    console.warn('[Manager] LLM não retornou JSON válido, usando fallback');
    
  } catch (error) {
    console.error('[Manager] Erro ao chamar LLM:', error);
  }

  // Fallback para uma lista básica se a LLM falhar
  return generateFallbackItems(params.tipo_evento, params.qtd_pessoas);
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

  return baseItems;
}

export async function setEventStatus(eventoId: UUID, status: Event['status']): Promise<void> {
  console.log(`[Stub] setEventStatus called with eventoId: ${eventoId}, status: ${status}`);
  return Promise.resolve();
}