import { EventStatus, UUID } from "@/types/domain";
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

  // 2) Extrair slots a partir da mensagem + draft
  const { tipo_evento, qtd_pessoas, is_confirm } = extractSlotsByRules(userText, {
    tipo_evento: draft?.evento?.tipo_evento,
    qtd_pessoas: draft?.evento?.qtd_pessoas,
  });
  console.log('[ORCHESTRATE] Slots extraídos:', { tipo_evento, qtd_pessoas, is_confirm });

  // 3) Decisão por casos:
  if (force_action && draft?.evento?.tipo_evento && draft?.evento?.qtd_pessoas) {
    console.log('[ORCHESTRATE] Caso: força ação com slots completos');
    // Forçar ação se estagnado e com slots
    const { tipo_evento, qtd_pessoas } = draft.evento;
    const evtId = draft.evento.id;

    // gera lista e salva (RPC)
    const itensGerados = await generateItemList({ tipo_evento, qtd_pessoas });
    console.log('[ORCHESTRATE] Itens gerados:', itensGerados);
    console.log('[ORCHESTRATE] Itens gerados:', itensGerados);
    await rpc.items_replace_for_event(evtId, itensGerados);
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
    await rpc.items_replace_for_event(evtId, itensGerados);
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
    console.log('[ORCHESTRATE] Caso: slots completos → ação determinística');
    // (1) ou (2) — COMPLETO → AGIR determinístico:
    // se não houver evento, cria rascunho
    const evtId =
      draft?.evento?.id ??
      (
        await upsertEvent({
          usuario_id: userId,
          nome_evento: "Rascunho",
          tipo_evento,
          qtd_pessoas,
          status: "collecting_core",
        })
      ).id;
    console.log('[ORCHESTRATE] Evento ID:', evtId);

    // gera lista e salva (RPC)
    const itensGerados = await generateItemList({ tipo_evento, qtd_pessoas });
    console.log('[ORCHESTRATE] Itens gerados:', itensGerados);
    await rpc.items_replace_for_event(evtId, itensGerados);
    await setEventStatus(evtId, "itens_pendentes_confirmacao");

    // snapshot final
    const snapshot = await rpc.get_event_plan(evtId);

    return {
      estado: "itens_pendentes_confirmacao",
      evento_id: evtId,
      mensagem: `Listei itens e quantidades para **${tipo_evento} de ${
        qtd_pessoas
      } pessoas**. Quer revisar antes de dividir?`,
      snapshot,
      ctas: [
        { type: "confirm-items", label: "Confirmar lista" },
        { type: "edit-items", label: "Editar itens" },
      ],
    };
  }

  if (draft?.evento?.status === "itens_pendentes_confirmacao") {
    console.log('[ORCHESTRATE] Caso: status itens_pendentes_confirmacao - chamando LLM');
    // Após a confirmação, podemos usar a LLM para sugestões
    const llmPromise = getLlmSuggestions(
      "Você é um assistente de planejamento de eventos. Com base nos itens e quantidades, gere ideias criativas e sucintas (sem números) para comidas, bebidas, decoração ou atividades. Retorne apenas as ideias em texto.",
      history ?? [],
      0.3,
      {
        evento_id: draft.evento.id,
        user_id: userId,
      }
    );

    const llmResult = await Promise.race([
      llmPromise,
      new Promise((resolve) => setTimeout(() => resolve(null), 1500)), // Timeout de 1.5s
    ]);
    console.log('[ORCHESTRATE] Resultado LLM:', llmResult);

    return {
      ...draft,
      estado: "itens_pendentes_confirmacao",
      evento_id: draft.evento.id,
      mensagem: draft.mensagem || "Itens listados. Algo mais?",
      sugestoes_texto: llmResult?.content ?? undefined,
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

  console.log('[ORCHESTRATE] Caso: resposta padrão');
  // Se nada claro, resposta breve + exemplos
  return {
    estado: "collecting_core",
    evento_id: draft?.evento?.id ?? null,
    mensagem:
      'Entendi. Me diga o tipo de evento e quantas pessoas (ex.: “churrasco para 10”).',
    suggestions: ["Churrasco para 10", "Piquenique 8 pessoas"],
    ctas: [],
  };
};