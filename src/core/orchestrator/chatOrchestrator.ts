import { EventStatus, UUID, Item } from "@/types/domain";
import { extractSlotsByRules } from "./extractSlots";
import {
  findDraftEventByUser,
  generateItemList,
  getPlanSnapshot,
  setEventStatus,
  upsertEvent,
} from "./eventManager";
import { rpc } from "@/api/rpc";
import { getLlmSuggestions } from "@/api/llm/chat";
import { LlmMessage } from "@/types/llm";

export interface ChatUiPayload {
  estado: EventStatus | "collecting_core";
  evento_id: UUID | null;
  mensagem: string;
  suggestions?: string[];
  sugestoes_texto?: string;
  ctas?: { type: string; label: string }[];
  context?: Record<string, any>;
  snapshot?: any;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  tipo_evento?: string;
  qtd_pessoas?: number;
}

export const getGreeting = (userId: UUID): ChatUiPayload => {
  return {
    estado: "collecting_core",
    evento_id: null,
    mensagem:
      "Olá! Para começarmos, me diga qual o tipo de evento e para quantas pessoas será.",
    suggestions: ["Churrasco para 10", "Festa de aniversário para 25"],
    ctas: [],
  };
};

export const orchestrate = async (
  userText: string,
  userId: UUID,
  eventoId?: UUID,
  force_action?: boolean,
  history?: LlmMessage[]
): Promise<ChatUiPayload> => {
  console.log('[ORCHESTRATE] Iniciando orquestração', { userText, userId, eventoId, force_action });
  
  // 1) Carregar rascunho/snapshot (se houver)
  const draft = eventoId
    ? await getPlanSnapshot(eventoId)
    : await findDraftEventByUser(userId);
  console.log('[ORCHESTRATE] Draft carregado:', draft);

  // 2) Extrair slots com merge hierárquico (novo > draft)
  const slots = extractSlotsByRules(userText, {
    tipo_evento: draft?.evento?.tipo_evento,
    qtd_pessoas: draft?.evento?.qtd_pessoas,
    data_evento: draft?.evento?.data_evento,
  });
  
  let { tipo_evento, qtd_pessoas, data_evento, is_confirm } = slots;
  console.log('[ORCHESTRATE] Slots extraídos:', { tipo_evento, qtd_pessoas, data_evento, is_confirm });
  
  // Se não detectou tipo, mas a mensagem é apenas um número e o draft tinha tipo → herdamos o tipo anterior
  if (!tipo_evento && /^\d+$/.test(userText.trim()) && draft?.evento?.tipo_evento) {
    console.log('[ORCHESTRATE] Herdando tipo_evento do contexto:', draft.evento.tipo_evento);
    tipo_evento = draft.evento.tipo_evento;
  }
  
  // 3) Se há draft, atualizar o evento com os novos slots (merge persistente)
  if (draft?.evento?.id && (tipo_evento || qtd_pessoas || data_evento)) {
    try {
      await upsertEvent({
        id: draft.evento.id,
        usuario_id: userId,
        nome_evento: draft.evento.nome_evento || "Rascunho",
        tipo_evento: tipo_evento || draft.evento.tipo_evento,
        qtd_pessoas: qtd_pessoas ?? draft.evento.qtd_pessoas,
        data_evento: data_evento || draft.evento.data_evento,
        status: draft.evento.status || "collecting_core",
      });
      console.log('[ORCHESTRATE] Draft atualizado com novos slots');
    } catch (err) {
      console.warn('[ORCHESTRATE] Erro ao atualizar draft:', err);
    }
  }

  // 3) Decisão por casos:
  if (force_action && draft?.evento?.tipo_evento && draft?.evento?.qtd_pessoas) {
    console.log('[ORCHESTRATE] Caso: força ação com slots completos');
    // Forçar ação se estagnado e com slots
    const { tipo_evento, qtd_pessoas } = draft.evento;
    const evtId = draft.evento.id;

    // gera lista e salva (RPC)
    const itensGerados = await generateItemList({ tipo_evento, qtd_pessoas });
    console.log('[ORCHESTRATE] Itens gerados:', itensGerados);
    const itensComIds = itensGerados.map(item => ({
      ...item,
      id: item.id || crypto.randomUUID(),
      evento_id: evtId,
      nome_item: item.nome_item || '',
      quantidade: item.quantidade || 0,
      unidade: item.unidade || 'un',
      valor_estimado: item.valor_estimado || 0,
      categoria: item.categoria || 'geral',
      prioridade: (item.prioridade || 'B') as 'A' | 'B' | 'C',
    })) as Item[];
    await rpc.items_replace_for_event(evtId, itensComIds);
    await setEventStatus(evtId, "itens_pendentes_confirmacao");

    // snapshot final
    const snapshot = await rpc.get_event_plan(evtId);

    return {
      estado: "itens_pendentes_confirmacao",
      evento_id: evtId,
      mensagem: `Ok! Listei os itens para seu **${tipo_evento} para ${qtd_pessoas} pessoas**.`,
      snapshot,
      ctas: [
        { type: "confirm-items", label: "Confirmar lista" },
        { type: "edit-items", label: "Editar itens" },
      ],
    };
  }

  if (is_confirm && draft?.evento?.tipo_evento && draft?.evento?.qtd_pessoas) {
    console.log('[ORCHESTRATE] Caso: confirmação semântica com slots completos');
    // Confirmação semântica com slots completos → AGIR
    const { tipo_evento, qtd_pessoas } = draft.evento;
    const evtId = draft.evento.id;

    // gera lista e salva (RPC)
    const itensGerados = await generateItemList({ tipo_evento, qtd_pessoas });
    const itensComIds = itensGerados.map(item => ({
      ...item,
      id: item.id || crypto.randomUUID(),
      evento_id: evtId,
      nome_item: item.nome_item || '',
      quantidade: item.quantidade || 0,
      unidade: item.unidade || 'un',
      valor_estimado: item.valor_estimado || 0,
      categoria: item.categoria || 'geral',
      prioridade: (item.prioridade || 'B') as 'A' | 'B' | 'C',
    })) as Item[];
    await rpc.items_replace_for_event(evtId, itensComIds);
    await setEventStatus(evtId, "itens_pendentes_confirmacao");

    // snapshot final
    const snapshot = await rpc.get_event_plan(evtId);

    return {
      estado: "itens_pendentes_confirmacao",
      evento_id: evtId,
      mensagem: `Ok! Listei os itens para seu **${tipo_evento} para ${qtd_pessoas} pessoas**.`,
      snapshot,
      ctas: [
        { type: "confirm-items", label: "Confirmar lista" },
        { type: "edit-items", label: "Editar itens" },
      ],
    };
  }

  if (tipo_evento && qtd_pessoas) {
    console.log('[ORCHESTRATE] Caso: slots completos → verificar se precisa de data');
    
    // Verificar se já temos data ou se devemos perguntar
    const hasDate = draft?.evento?.data_evento || data_evento;
    console.log('[ORCHESTRATE] Merge de data:', { 
      draft_data: draft?.evento?.data_evento, 
      nova_data: data_evento, 
      hasDate 
    });
    
    if (!hasDate) {
      // Perguntar a data antes de prosseguir - NÃO GERAR ITENS AINDA
      const evtId = draft?.evento?.id ?? (
        await upsertEvent({
          usuario_id: userId,
          nome_evento: "Rascunho",
          tipo_evento,
          qtd_pessoas,
          status: "collecting_core",
        })
      ).id;
      
      console.log('[ORCHESTRATE] Pedindo data para o evento:', evtId);
      
      return {
        estado: "collecting_core",
        evento_id: evtId,
        mensagem: `Perfeito! ${tipo_evento} para ${qtd_pessoas} pessoas. Qual será a data do evento?`,
        suggestions: [],
        ctas: [],
        tipo_evento,
        qtd_pessoas,
      };
    }
    
    // Temos tipo, quantidade e data → prosseguir com geração de itens
    console.log('[ORCHESTRATE] Temos todos os dados (tipo, qtd, data) → gerando itens');
    const evtId = draft?.evento?.id ?? (
      await upsertEvent({
        usuario_id: userId,
        nome_evento: "Rascunho",
        tipo_evento,
        qtd_pessoas,
        data_evento,
        status: "collecting_core",
      })
    ).id;
    
    console.log('[ORCHESTRATE] Evento ID:', evtId);

    try {
      // gera lista e salva (RPC)
      const itensGerados = await generateItemList({ tipo_evento, qtd_pessoas });
      console.log('[ORCHESTRATE] Itens gerados:', itensGerados);
      const itensComIds = itensGerados.map(item => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        evento_id: evtId,
        nome_item: item.nome_item || '',
        quantidade: item.quantidade || 0,
        unidade: item.unidade || 'un',
        valor_estimado: item.valor_estimado || 0,
        categoria: item.categoria || 'geral',
        prioridade: (item.prioridade || 'B') as 'A' | 'B' | 'C',
      })) as Item[];
      
      await rpc.items_replace_for_event(evtId, itensComIds);
      await setEventStatus(evtId, "itens_pendentes_confirmacao");

      // snapshot final
      const snapshot = await rpc.get_event_plan(evtId);

      return {
        estado: "itens_pendentes_confirmacao",
        evento_id: evtId,
        mensagem: `Listei itens e quantidades para **${tipo_evento} de ${qtd_pessoas} pessoas**. Quer revisar antes de dividir?`,
        snapshot,
        ctas: [
          { type: "confirm-items", label: "Confirmar lista" },
          { type: "edit-items", label: "Editar itens" },
        ],
      };
    } catch (error) {
      console.error('[ORCHESTRATE] Erro ao gerar/salvar itens:', error);
      throw error;
    }
  }

  // Guarda para "quais são os itens?"
  if (draft?.evento?.status === "itens_pendentes_confirmacao" && /itens|lista/i.test(userText)) {
    console.log('[ORCHESTRATE] Caso: pergunta sobre itens - mostrando snapshot');
    return {
      estado: "itens_pendentes_confirmacao",
      evento_id: draft.evento.id,
      mensagem: "Aqui está a lista atual de itens do seu evento:",
      snapshot: await rpc.get_event_plan(draft.evento.id),
    };
  }

  if (draft?.evento?.status === "itens_pendentes_confirmacao") {
    console.log('[ORCHESTRATE] Caso: status itens_pendentes_confirmacao - usando LLM com contexto');
    
    // SEMPRE usar LLM quando já estamos neste estado para manter fluidez
    if (history && history.length > 0) {
      try {
        const systemPrompt = `Você é o UNE.AI, assistente de planejamento de eventos.
O evento atual é um ${draft.evento.tipo_evento} para ${draft.evento.qtd_pessoas} pessoas.
Os itens já foram listados e estão aguardando confirmação do usuário.
Seja conversacional, prestativo e mantenha o contexto da conversa.
Se o usuário confirmar, parabenize e pergunte sobre adicionar participantes.
Se pedir para editar, pergunte especificamente o que deseja mudar.`;

        const llmResult = await getLlmSuggestions(systemPrompt, history, 0.5);
        
        if (llmResult?.content) {
          return {
            estado: "itens_pendentes_confirmacao",
            evento_id: draft.evento.id,
            mensagem: llmResult.content,
            snapshot: draft,
          };
        }
      } catch (err) {
        console.warn('[ORCHESTRATE] LLM falhou, usando resposta padrão', err);
      }
    }
    
    // Fallback heurístico se LLM falhar
    const lower = userText.toLowerCase();
    const isConfirming = /\b(sim|ok|confirma|beleza|perfeito|pode seguir|isso|bora|quero)\b/i.test(lower);
    const isEditing = /\b(editar|mudar|alterar|modificar|ajustar)\b/i.test(lower);
    
    if (isConfirming) {
      return {
        estado: "itens_pendentes_confirmacao",
        evento_id: draft.evento.id,
        mensagem: "Ótimo! Os itens estão confirmados. Agora, quer adicionar participantes para dividir os custos?",
        snapshot: draft,
        ctas: [
          { type: "add-participants", label: "Adicionar participantes" },
          { type: "view-plan", label: "Ver plano completo" },
        ],
      };
    }
    
    if (isEditing) {
      return {
        estado: "itens_pendentes_confirmacao",
        evento_id: draft.evento.id,
        mensagem: "Sem problemas! Me diga quais itens você quer editar.",
        snapshot: draft,
      };
    }
    
    return {
      estado: "itens_pendentes_confirmacao",
      evento_id: draft.evento.id,
      mensagem: "Os itens estão listados. Você pode confirmar, editar ou me perguntar algo sobre o evento.",
      snapshot: draft,
    };
  }

  if (tipo_evento && !qtd_pessoas) {
    console.log('[ORCHESTRATE] Caso: só tipo evento - pedindo quantidade');
    // (3) só tipo → pedir quantidade
    return {
      estado: "collecting_core",
      evento_id: draft?.evento?.id ?? null,
      mensagem: `Show! Vamos de ${tipo_evento}. Para quantas pessoas?`,
      ctas: [],
      context: { tipo_evento },
    };
  }

  if (!tipo_evento && qtd_pessoas) {
    console.log('[ORCHESTRATE] Caso: só quantidade - pedindo tipo');
    // (4) só quantidade → pedir tipo
    return {
      estado: "collecting_core",
      evento_id: draft?.evento?.id ?? null,
      mensagem: `Perfeito! São ${qtd_pessoas} pessoas. Qual o tipo de evento?`,
      ctas: [],
      context: { qtd_pessoas },
    };
  }

  if (force_action) {
    console.log('[ORCHESTRATE] Caso: força ação sem progresso');
    return {
      estado: "collecting_core",
      evento_id: draft?.evento?.id ?? null,
      mensagem:
        "Parece que não estamos progredindo. O que você gostaria de fazer? Me diga o tipo de evento e o número de pessoas, por favor.",
      ctas: [],
    };
  }

  console.log('[ORCHESTRATE] Caso: resposta padrão - tentar LLM com contexto');
  
  // Heurística APENAS para casos triviais
  const lower = userText.toLowerCase();
  const isGreeting = /\b(oi|olá|ola|hey|bom dia|boa tarde|boa noite)\b/i.test(lower) && userText.length < 20;
  
  if (isGreeting) {
    return {
      estado: "collecting_core",
      evento_id: draft?.evento?.id ?? null,
      mensagem: "Olá! Estou aqui para ajudar a organizar seu evento. Me diga o tipo de evento e quantas pessoas.",
      suggestions: ["Churrasco para 10 pessoas", "Festa para 20 pessoas"],
      ctas: [],
    };
  }
  
  // Para TODO o resto: usar LLM com contexto completo
  if (history && history.length > 0) {
    try {
      const contextInfo = draft?.evento 
        ? `Contexto atual: ${draft.evento.tipo_evento || 'não definido'}, ${draft.evento.qtd_pessoas || 'não definido'} pessoas, data: ${draft.evento.data_evento || 'não definido'}`
        : 'Nenhum evento em andamento';
      
      const systemPrompt = `Você é o UNE.AI, assistente de planejamento de eventos.
${contextInfo}
Mantenha a conversa fluida e contextual. Se faltam informações (tipo, quantidade ou data), pergunte de forma natural.
Seja breve, direto e amigável. Use o contexto da conversa anterior.`;

      const llmResult = await getLlmSuggestions(systemPrompt, history, 0.5);
      
      if (llmResult?.content) {
        return {
          estado: "collecting_core",
          evento_id: draft?.evento?.id ?? null,
          mensagem: llmResult.content,
          tipo_evento: draft?.evento?.tipo_evento,
          qtd_pessoas: draft?.evento?.qtd_pessoas,
          ctas: [],
        };
      }
    } catch (err) {
      console.warn('[ORCHESTRATE] LLM falhou, usando resposta padrão', err);
    }
  }
  
  // Fallback final apenas se LLM falhar
  return {
    estado: "collecting_core",
    evento_id: draft?.evento?.id ?? null,
    mensagem: 'Me diga o tipo de evento e quantas pessoas (ex.: "churrasco para 10 pessoas").',
    suggestions: ["Churrasco para 10 pessoas", "Piquenique para 8 pessoas"],
    ctas: [],
  };
};
