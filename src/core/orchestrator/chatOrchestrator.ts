import { EventStatus, UUID, Item } from "@/types/domain";
import { analyzeMessage } from "./analyzeMessage";
import { classifyIntent } from "./classifyIntent";
import { getRandomTemplate } from "./chatTemplates";
import {
  findDraftEventByUser,
  generateItemList,
  getPlanSnapshot,
  setEventStatus,
  upsertEvent,
  finalizeEvent,
} from "./eventManager";
import { rpc } from "@/api/rpc";
import { getLlmSuggestions } from "@/api/llm/chat";
import { LlmMessage } from "@/types/llm";
import { ContextManager } from './contextManager';
import { getPersonalitySystemPrompt, adjustToneForState } from './personality';
import { FeedbackManager } from './feedbackManager';
import { CorrectionDetector } from './correctionDetector';
import { SituationalAnalyzer } from './situationalAnalyzer';
import { ProactiveActionsManager } from './proactiveActions';

export interface ChatUiPayload {
  estado: EventStatus | "collecting_core";
  evento_id: UUID | null;
  mensagem: string;
  suggestions?: string[];
  suggestedReplies?: string[]; // Quick replies clicáveis
  sugestoes_texto?: string;
  ctas?: { type: string; label: string }[];
  context?: Record<string, any>;
  snapshot?: any;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  tipo_evento?: string;
  qtd_pessoas?: number;
  showItems?: boolean;
  closeChat?: boolean;
  toast?: string;
}

export const getGreeting = (userId: UUID): ChatUiPayload => {
  return {
    estado: "collecting_core",
    evento_id: null,
    mensagem: getRandomTemplate('greeting'),
    suggestedReplies: ["Jantar para 10", "Churrasco para 15", "Festa para 20"],
    ctas: [],
  };
};

export const orchestrate = async (
  userText: string,
  userId: UUID,
  eventoId?: UUID,
  force_action?: boolean,
  _legacyHistory?: LlmMessage[] // Mantido por compatibilidade, mas não usado
): Promise<ChatUiPayload> => {
  const startTime = Date.now();

  // Inicializar gerenciadores
  const contextManager = new ContextManager();
  const feedbackManager = new FeedbackManager();
  const correctionDetector = new CorrectionDetector();
  const situationalAnalyzer = new SituationalAnalyzer();
  const proactiveActionsManager = new ProactiveActionsManager();

  // Carregar contexto e histórico persistido
  const { context: savedContext, history } = await contextManager.loadUserContext(userId);

  // console.log('[Orchestrator] Contexto carregado:', {
  //   state: savedContext.state,
  //   historyLength: history.length,
  //   eventoId: savedContext.evento_id,
  // });

  // Salvar mensagem do usuário
  await contextManager.saveMessage(userId, 'user', userText, eventoId ? Number(eventoId) : undefined);
  // console.log('[ORCHESTRATE] Iniciando orquestração', { userText, userId, eventoId, force_action });

  // 1) Carregar rascunho/snapshot (se houver)
  // 🔹 ALTERAÇÃO: Não carregar draft automaticamente se não houver eventoId explícito
  // Isso evita "vazamento" de eventos antigos após um reset
  let draft = eventoId
    ? await getPlanSnapshot(eventoId)
    : null;

  // console.log('[ORCHESTRATE] Draft carregado (inicial):', draft);

  // 1.5) Análise situacional proativa (APENAS em casos específicos, não toda mensagem)
  // Desabilitar proatividade quando usuário acabou de enviar mensagem com dados
  const shouldSkipProactive =
    userText.length > 5 && // Mensagem com conteúdo substancial
    (
      /\b(churrasco|pizza|feijoada|jantar|almoço|almoco|festa|evento)\b/i.test(userText) || // Menciona tipo de evento
      /\b\d+\s*(pessoa|pessoas|convidado|convidados)\b/i.test(userText) || // Menciona quantidade
      /\b\d{1,2}\/\d{1,2}\b/i.test(userText) || // Menciona data
      /\b(confirmar|confirma|ok|sim|beleza|ótimo|otimo|perfeito)\b/i.test(userText) // 🔥 CORREÇÃO: Confirmar pula proatividade
    );

  if (!force_action && draft?.evento && !shouldSkipProactive) {
    const hasItems = draft.itens && draft.itens.length > 0;
    const hasParticipants = false; // TODO: implementar quando tivermos participantes
    const lastInteractionTimestamp = savedContext.updated_at
      ? new Date(savedContext.updated_at).getTime()
      : undefined;

    const insights = situationalAnalyzer.analyzeContext(
      draft.evento,
      savedContext,
      hasItems,
      hasParticipants,
      lastInteractionTimestamp
    );

    const prioritizedInsights = situationalAnalyzer.prioritizeInsights(insights);
    const shouldShowProactive = situationalAnalyzer.shouldShowProactiveSuggestion(
      prioritizedInsights,
      contextManager.lastProactiveTimestamp
    );

    if (shouldShowProactive && prioritizedInsights.length > 0) {
      const topInsight = prioritizedInsights[0];

      // Só mostrar proatividade para casos REALMENTE proativos (não perguntar dados básicos)
      if (topInsight.type !== 'incomplete_event' || topInsight.context?.missingFields?.[0] !== 'dados_basicos') {
        const proactiveAction = proactiveActionsManager.generateProactiveAction(topInsight);

        // Se não deve executar automaticamente, retornar sugestão proativa
        if (!proactiveAction.autoExecute) {
          contextManager.lastProactiveTimestamp = Date.now();
          const formattedMessage = proactiveActionsManager.formatProactiveMessage(proactiveAction);

          await contextManager.saveMessage(
            userId,
            'assistant',
            formattedMessage,
            draft.evento.id ? Number(draft.evento.id) : undefined
          );

          return {
            estado: draft.evento.status || 'collecting_core',
            evento_id: draft.evento.id ?? null,
            mensagem: formattedMessage,
            suggestedReplies: proactiveAction.actionLabel ? [proactiveAction.actionLabel] : [],
            ctas: [],
          };
        }
      }
    }
  }

  // 2) Análise semântica da mensagem com contexto
  const analysis = await analyzeMessage(userText, {
    tipo_evento: draft?.evento?.tipo_evento,
    qtd_pessoas: draft?.evento?.qtd_pessoas,
    data_evento: draft?.evento?.data_evento,
  });
  // console.log('[ORCHESTRATE] Análise semântica:', analysis);

  // 2.5) Detectar correções e confusões
  const correction = correctionDetector.detectCorrection(userText, analysis, savedContext.collected_data);
  const isConfused = correctionDetector.detectConfusion(userText);

  if (correction.isCorrection) {
    // console.log('[Orchestrator] Correção detectada:', correction);

    // Responder empaticamente à correção
    const correctionResponse = correctionDetector.generateCorrectionResponse(
      correction.correctedField || 'geral'
    );

    await contextManager.saveMessage(
      userId,
      'assistant',
      correctionResponse,
      draft?.evento?.id ? Number(draft.evento.id) : undefined
    );

    // Atualizar contexto com dados corrigidos
    await contextManager.updateContext(
      userId,
      savedContext.state,
      {
        ...savedContext.collected_data,
        [correction.correctedField || 'last_correction']: analysis[correction.correctedField as keyof typeof analysis],
      },
      savedContext.missing_slots,
      analysis.nivel_confianca,
      analysis.intencao,
      draft?.evento?.id ? Number(draft.evento.id) : undefined
    );
  }

  if (isConfused) {
    // console.log('[Orchestrator] Confusão detectada');

    // Responder com empatia e clareza
    const confusionResponse = 'Desculpa se não fui claro. Vou te explicar melhor: estamos planejando o evento passo a passo. Me diz o que você gostaria de fazer?';

    await contextManager.saveMessage(
      userId,
      'assistant',
      confusionResponse,
      draft?.evento?.id ? Number(draft.evento.id) : undefined
    );
  }

  // 3) Classificação de intenção
  const classification = classifyIntent(analysis, draft);
  // console.log('[ORCHESTRATE] Classificação:', classification);

  // 🔹 RECUPERAÇÃO TARDIA DE DRAFT
  // Se a intenção sugere continuidade mas não temos draft, tentar recuperar o último
  if (!draft && ['editar_evento', 'adicionar_participantes', 'mostrar_itens', 'confirmar_evento', 'definir_menu'].includes(analysis.intencao)) {
    // console.log('[ORCHESTRATE] Intenção de continuidade sem draft, buscando último rascunho...');
    draft = await findDraftEventByUser(userId);
    if (draft) {
      // console.log('[ORCHESTRATE] Draft recuperado tardiamente:', draft);
    }
  }

  // 3.5) Registrar analytics e verificar se precisa clarificar
  const responseTimeMs = Date.now() - startTime;
  await feedbackManager.logInteraction(
    userId,
    analysis.intencao,
    analysis.nivel_confianca,
    'hybrid',
    {
      eventoId: draft?.evento?.id ? Number(draft.evento.id) : undefined,
      responseTimeMs,
      metadata: {
        categoria: analysis.categoria_evento,
        subtipo: analysis.subtipo_evento,
        qtd_pessoas: analysis.qtd_pessoas,
        was_correction: correction.isCorrection,
        was_confused: isConfused,
      },
    }
  );

  // Verificar se deve clarificar (apenas se não for ação forçada)
  if (!force_action) {
    const clarification = await feedbackManager.shouldClarify(
      userId,
      analysis.intencao,
      analysis.nivel_confianca
    );

    if (clarification.shouldClarify) {
      // console.log('[Orchestrator] Baixa confiança, solicitando clarificação:', clarification.reason);

      const clarificationMsg = feedbackManager.generateClarificationMessage(
        analysis.intencao,
        { ...analysis, ...draft }
      );

      await contextManager.saveMessage(
        userId,
        'assistant',
        clarificationMsg.message,
        draft?.evento?.id ? Number(draft.evento.id) : undefined
      );

      return {
        estado: draft?.evento?.status || 'collecting_core',
        evento_id: draft?.evento?.id ?? null,
        mensagem: clarificationMsg.message,
        suggestedReplies: clarificationMsg.suggestedReplies,
        ctas: [],
      };
    }
  }

  // 4) PRIORIDADE: Se já tem itens e usuário pede para ver, mostrar ANTES de qualquer lógica
  if (draft?.evento?.status === "itens_pendentes_confirmacao" &&
    analysis.intencao !== "confirmar_evento" && // 🔥 CORREÇÃO: Não interceptar confirmações
    (analysis.intencao === "mostrar_itens" || /itens|lista|mostrar|mostra|mostre/i.test(userText))) {
    // console.log('[ORCHESTRATE] Caso prioritário: mostrar itens existentes');
    const snapshot = await rpc.get_event_plan(draft.evento.id);
    const responseMsg = "Aqui está a lista de itens do seu evento:";

    await contextManager.saveMessage(userId, 'assistant', responseMsg, Number(draft.evento.id));

    return {
      estado: "itens_pendentes_confirmacao",
      evento_id: draft.evento.id,
      mensagem: responseMsg,
      snapshot,
      showItems: true,
      suggestedReplies: ["Confirmar lista", "Editar itens", "Adicionar participantes"],
    };
  }

  // 5) TRATAMENTO DE ERROS E MENSAGENS FORA DE CONTEXTO
  if (analysis.intencao === "out_of_domain") {
    const errorMsg = getRandomTemplate('erro_fora_escopo');
    await contextManager.saveMessage(userId, 'assistant', errorMsg, draft?.evento?.id ? Number(draft.evento.id) : undefined);

    return {
      estado: "collecting_core",
      evento_id: draft?.evento?.id ?? null,
      mensagem: errorMsg,
      suggestedReplies: ["Criar evento", "Ver eventos"],
      ctas: [],
    };
  }

  // 6) REINICIAR CONVERSA
  if (analysis.intencao === 'reiniciar_conversa') {
    console.log('[ORCHESTRATE] Reiniciando conversa a pedido do usuário');
    await contextManager.clearUserContext(userId);

    const resetMsg = "Claro! Vamos começar do zero 😊 Me conta: o que você quer organizar agora?";
    // Não salvamos essa mensagem no histórico antigo pois acabamos de limpar
    // Mas podemos salvar no novo histórico
    await contextManager.saveMessage(userId, 'assistant', resetMsg);

    return {
      estado: 'collecting_core',
      evento_id: null,
      mensagem: resetMsg,
      suggestedReplies: ["Jantar para 10", "Churrasco para 15", "Festa para 20"],
      ctas: [],
    };
  }

  // 7) ENCERRAR CONVERSA
  if (analysis.intencao === "encerrar_conversa") {
    const byeMsg = "Foi ótimo te ajudar! Até a próxima 👋";
    await contextManager.saveMessage(userId, 'assistant', byeMsg, draft?.evento?.id ? Number(draft.evento.id) : undefined);

    return {
      estado: draft?.evento?.status || "collecting_core",
      evento_id: draft?.evento?.id ?? null,
      mensagem: byeMsg,
      ctas: [],
    };
  }

  // 8) CONFIRMAÇÃO - Finalizar evento se já tem itens
  if (analysis.intencao === "confirmar_evento" && draft?.evento?.status === "itens_pendentes_confirmacao") {
    console.log('[ORCHESTRATE] Confirmação: finalizando evento');
    await finalizeEvent(draft.evento.id, draft.evento);

    const snapshot = await rpc.get_event_plan(draft.evento.id);
    const finalMsg = getRandomTemplate('event_finalized');

    await contextManager.saveMessage(userId, 'assistant', finalMsg, Number(draft.evento.id));
    await contextManager.updateContext(
      userId,
      'finalizado',
      { evento_finalizado: true },
      [],
      1.0,
      'confirmar_evento',
      Number(draft.evento.id)
    );

    return {
      estado: "finalizado",
      evento_id: draft.evento.id,
      mensagem: finalMsg,
      snapshot,
      showItems: true,
      closeChat: true,
      ctas: [
        { type: "view-dashboard", label: "Ver Dashboard" }
      ]
    };
  }

  // 9) CONFIRMAÇÃO - Gerar itens com dados acumulados (OTIMIZADO)
  if (analysis.intencao === "confirmar_evento") {
    console.log('[ORCHESTRATE] Confirmação detectada - verificando dados disponíveis');

    // Merge de todos os dados disponíveis
    const categoria = analysis.categoria_evento || draft?.evento?.categoria_evento;
    const subtipo = analysis.subtipo_evento || draft?.evento?.subtipo_evento;
    const qtd = analysis.qtd_pessoas || draft?.evento?.qtd_pessoas;
    const menu = analysis.menu || draft?.evento?.menu;
    const data = analysis.data_evento || draft?.evento?.data_evento;

    // Inferir tipo se necessário
    let tipo = categoria || subtipo;
    if (subtipo && !categoria && ['churrasco', 'feijoada', 'pizza'].includes(subtipo)) {
      tipo = subtipo;
    }

    // Se temos tipo e quantidade, podemos gerar itens
    if (tipo && qtd) {
      // console.log('[ORCHESTRATE] Confirmação com dados suficientes:', { tipo, qtd, menu, data });

      const evtId = draft?.evento?.id ?? (
        await upsertEvent({
          usuario_id: userId,
          nome_evento: "Rascunho",
          tipo_evento: tipo,
          categoria_evento: categoria,
          subtipo_evento: subtipo,
          menu,
          qtd_pessoas: qtd,
          data_evento: data,
          status: "collecting_core",
        })
      ).id;

      // Gerar lista de itens
      const itensGerados = await generateItemList({
        tipo_evento: tipo,
        qtd_pessoas: qtd,
        menu: menu || undefined
      });

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

      const snapshot = await rpc.get_event_plan(evtId);
      const itemsMsg = getRandomTemplate('items_generated', {
        categoria_evento: tipo,
        qtd_pessoas: qtd
      });

      await contextManager.saveMessage(userId, 'assistant', itemsMsg, Number(evtId));
      await contextManager.updateContext(
        userId,
        'itens_pendentes_confirmacao',
        { categoria_evento: tipo, subtipo_evento: subtipo, qtd_pessoas: qtd, menu, data_evento: data },
        [],
        0.9,
        'confirmar_evento',
        Number(evtId)
      );

      return {
        estado: "itens_pendentes_confirmacao",
        evento_id: evtId,
        mensagem: itemsMsg,
        snapshot,
        showItems: true,
        suggestedReplies: ["Confirmar lista", "Editar itens", "Adicionar participantes"],
        ctas: [
          { type: "confirm-items", label: "Confirmar lista" },
          { type: "edit-items", label: "Editar itens" },
        ],
      };
    }

    // Se não temos dados suficientes, continuar coletando via fluxo criar_evento
    // console.log('[ORCHESTRATE] Confirmação mas dados insuficientes, redirecionando para criar_evento');
    analysis.intencao = "criar_evento"; // Redirecionar para fluxo de coleta
  }

  // 10) CRIAR EVENTO - Coletar informações progressivamente (FLUXO FLEXÍVEL)
  if (analysis.intencao === "criar_evento") {
    // console.log('[ORCHESTRATE] Criando evento - fluxo flexível');

    // 🔹 Merge inteligente: acumular TODAS as informações fornecidas
    const categoria = analysis.categoria_evento || draft?.evento?.categoria_evento;
    const subtipo = analysis.subtipo_evento || draft?.evento?.subtipo_evento;
    const qtd = analysis.qtd_pessoas || draft?.evento?.qtd_pessoas;
    const data = analysis.data_evento || draft?.evento?.data_evento;
    const menu = analysis.menu || draft?.evento?.menu;

    // console.log('[ORCHESTRATE] Dados acumulados:', {
    //   categoria,
    //   subtipo,
    //   qtd,
    //   data_from_analysis: analysis.data_evento,
    //   data_from_draft: draft?.evento?.data_evento,
    //   data_final: data,
    //   menu
    // });

    // 🔹 Inferir categoria automaticamente se temos subtipo mas não categoria
    let tipoFinal = categoria || subtipo;
    let categoriaFinal = categoria;
    if (subtipo && !categoria) {
      // Inferir categoria baseado no subtipo
      if (['churrasco', 'feijoada', 'pizza'].includes(subtipo)) {
        categoriaFinal = 'almoço'; // subtipos típicos de almoço/jantar
      }
      tipoFinal = subtipo; // usar subtipo como tipo principal
      // console.log('[ORCHESTRATE] Categoria inferida:', categoriaFinal, 'para subtipo:', subtipo);
    }

    // 🔹 Atualizar draft com TODAS as novas informações recebidas
    let evtId: string;

    if (draft?.evento?.id) {
      // Atualizar evento existente
      // console.log('[ORCHESTRATE] Atualizando evento existente com data:', data || draft.evento.data_evento);
      await upsertEvent({
        id: draft.evento.id,
        usuario_id: userId,
        nome_evento: draft.evento.nome_evento || "Rascunho",
        tipo_evento: tipoFinal || draft.evento.tipo_evento || 'evento',
        categoria_evento: categoriaFinal || draft.evento.categoria_evento,
        subtipo_evento: subtipo || draft.evento.subtipo_evento,
        qtd_pessoas: qtd || draft.evento.qtd_pessoas,
        menu: menu || draft.evento.menu,
        data_evento: data || draft.evento.data_evento,
        status: "collecting_core",
      });
      evtId = draft.evento.id;
    } else {
      // Criar novo evento
      // console.log('[ORCHESTRATE] Criando novo evento com data:', data);
      const newEvent = await upsertEvent({
        usuario_id: userId,
        nome_evento: "Rascunho",
        tipo_evento: tipoFinal || 'evento',
        categoria_evento: categoriaFinal,
        subtipo_evento: subtipo,
        qtd_pessoas: qtd,
        menu,
        data_evento: data,
        status: "collecting_core",
      });
      evtId = newEvent.id;
    }

    // 🔹 Identificar o que está faltando de forma prioritária
    const missingFields = [];
    if (!tipoFinal) missingFields.push('tipo');
    if (!qtd) missingFields.push('quantidade');
    if (!menu) missingFields.push('menu');
    if (!data) missingFields.push('data');

    // console.log('[ORCHESTRATE] Campos faltantes:', missingFields);

    // 🔹 REGRA ESPECIAL: Se temos tipo e qtd, verificar data ANTES de gerar lista
    if (tipoFinal && qtd && missingFields.length <= 2) {
      // console.log('[ORCHESTRATE] Dados suficientes - verificando data antes de gerar lista');

      // 🔥 NOVO FLUXO: Perguntar sobre data ANTES de gerar lista
      if (!data) {
        // console.log('[ORCHESTRATE] Sem data - perguntando ANTES de gerar lista');
        const askDateMsg = `Perfeito! Vou preparar a lista para o ${tipoFinal} de ${qtd} pessoas. Deseja informar a data do evento agora?`;

        await contextManager.saveMessage(userId, 'assistant', askDateMsg, Number(evtId));
        await contextManager.updateContext(
          userId,
          'aguardando_decisao_data',
          { categoria_evento: tipoFinal, subtipo_evento: subtipo, qtd_pessoas: qtd, menu, data_evento: data },
          missingFields,
          0.85,
          'criar_evento',
          Number(evtId)
        );

        return {
          estado: "aguardando_decisao_data",
          evento_id: evtId,
          mensagem: askDateMsg,
          suggestedReplies: ["Sim", "Não"],
        };
      }

      // Se já tem data, gerar lista diretamente
      // console.log('[ORCHESTRATE] Tem data - gerando lista');
      const itensGerados = await generateItemList({
        tipo_evento: tipoFinal,
        qtd_pessoas: qtd,
        menu: menu || undefined
      });

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

      const snapshot = await rpc.get_event_plan(evtId);
      const itemsMsg = getRandomTemplate('items_generated', {
        categoria_evento: tipoFinal,
        qtd_pessoas: qtd
      });

      await contextManager.saveMessage(userId, 'assistant', itemsMsg, Number(evtId));
      await contextManager.updateContext(
        userId,
        'itens_pendentes_confirmacao',
        { categoria_evento: tipoFinal, subtipo_evento: subtipo, qtd_pessoas: qtd, menu, data_evento: data },
        missingFields,
        0.85,
        'criar_evento',
        Number(evtId)
      );

      return {
        estado: "itens_pendentes_confirmacao",
        evento_id: evtId,
        mensagem: itemsMsg,
        snapshot,
        showItems: true,
        suggestedReplies: ["Confirmar lista", "Editar itens"],
        ctas: [
          { type: "confirm-items", label: "Confirmar lista" },
          { type: "edit-items", label: "Editar itens" },
        ],
      };
    }

    // 🔹 Perguntar pelo campo mais importante que está faltando
    if (!tipoFinal) {
      const msg = getRandomTemplate('ask_tipo_evento');
      await contextManager.saveMessage(userId, 'assistant', msg, Number(evtId));
      return {
        estado: "collecting_core",
        evento_id: evtId,
        mensagem: msg,
        suggestedReplies: ["Churrasco", "Pizza", "Jantar", "Almoço"],
        ctas: [],
      };
    }

    if (!qtd) {
      const msg = getRandomTemplate('ask_qtd', { categoria_evento: tipoFinal });
      await contextManager.saveMessage(userId, 'assistant', msg, Number(evtId));
      return {
        estado: "collecting_core",
        evento_id: evtId,
        mensagem: msg,
        ctas: [],
      };
    }

    // Se chegou aqui mas ainda está faltando algo, avisar
    if (missingFields.length > 0) {
      const msg = `Ótimo! Só preciso saber mais algumas coisas: ${missingFields.join(', ')}. Pode me passar?`;
      await contextManager.saveMessage(userId, 'assistant', msg, Number(evtId));
      return {
        estado: "collecting_core",
        evento_id: evtId,
        mensagem: msg,
        ctas: [],
      };
    }

    // Fallback: gerar itens com o que temos
    // console.log('[ORCHESTRATE] Gerando itens com dados disponíveis (fallback)');
    const tipo = tipoFinal!;

    const itensGerados = await generateItemList({ tipo_evento: tipo, qtd_pessoas: qtd, menu });
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

    const snapshot = await rpc.get_event_plan(evtId);

    await contextManager.saveMessage(userId, 'assistant', getRandomTemplate('items_generated', { categoria_evento: tipo, qtd_pessoas: qtd }), Number(evtId));

    return {
      estado: "itens_pendentes_confirmacao",
      evento_id: evtId,
      mensagem: getRandomTemplate('items_generated', { categoria_evento: tipo, qtd_pessoas: qtd }),
      snapshot,
      showItems: true,
      suggestedReplies: ["Confirmar lista", "Editar itens"],
      ctas: [
        { type: "confirm-items", label: "Confirmar lista" },
        { type: "edit-items", label: "Editar itens" },
      ],
    };
  }

  // 11) DEFINIR MENU
  if (analysis.intencao === "definir_menu" && analysis.menu) {
    // console.log('[ORCHESTRATE] Definindo menu');

    if (draft?.evento?.id) {
      await upsertEvent({
        id: draft.evento.id,
        usuario_id: userId,
        nome_evento: draft.evento.nome_evento,
        tipo_evento: draft.evento.tipo_evento,
        categoria_evento: draft.evento.categoria_evento,
        subtipo_evento: draft.evento.subtipo_evento,
        qtd_pessoas: draft.evento.qtd_pessoas,
        menu: analysis.menu,
        status: draft.evento.status,
      });
    }

    // Se já tem tudo exceto data, perguntar data
    if (draft?.evento?.qtd_pessoas && !draft?.evento?.data_evento) {
      return {
        estado: "collecting_core",
        evento_id: draft.evento.id,
        mensagem: "Perfeito! Deseja adicionar a data agora?",
        suggestedReplies: ["Sim", "Não"],
        ctas: [],
      };
    }
  }

  // 11.5) STATUS: aguardando_decisao_data - Tratar resposta sobre informar data
  if (savedContext.state === "aguardando_decisao_data" && draft?.evento) {
    // console.log('[ORCHESTRATE] Aguardando decisão sobre data');

    const tipoEvento = (savedContext.collected_data?.categoria_evento as string | undefined) || draft.evento.tipo_evento;
    const qtdPessoas = (savedContext.collected_data?.qtd_pessoas as number | undefined) || draft.evento.qtd_pessoas;
    const menu = (savedContext.collected_data?.menu as string | undefined) || draft.evento.menu;

    // 🔥 Se usuário responder "Não" → Gerar lista SEM data e mostrar
    if (/\b(não|nao|n|depois|mais tarde|agora não|agora nao)\b/i.test(userText)) {
      // console.log('[ORCHESTRATE] Usuário optou por não informar data - gerando lista sem data');

      // Gerar lista de itens
      const itensGerados = await generateItemList({
        tipo_evento: tipoEvento,
        qtd_pessoas: qtdPessoas,
        menu: menu || undefined
      });

      const itensComIds = itensGerados.map(item => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        evento_id: draft.evento.id,
        nome_item: item.nome_item || '',
        quantidade: item.quantidade || 0,
        unidade: item.unidade || 'un',
        valor_estimado: item.valor_estimado || 0,
        categoria: item.categoria || 'geral',
        prioridade: (item.prioridade || 'B') as 'A' | 'B' | 'C',
      })) as Item[];

      await rpc.items_replace_for_event(draft.evento.id, itensComIds);
      await setEventStatus(draft.evento.id, "itens_pendentes_confirmacao");

      const snapshot = await rpc.get_event_plan(draft.evento.id);
      const itemsMsg = getRandomTemplate('items_generated', {
        categoria_evento: tipoEvento,
        qtd_pessoas: qtdPessoas
      }) + " Você pode adicionar a data depois se quiser.";

      await contextManager.saveMessage(userId, 'assistant', itemsMsg, Number(draft.evento.id));
      await contextManager.updateContext(
        userId,
        'itens_pendentes_confirmacao',
        { ...savedContext.collected_data, data_evento: null },
        [],
        0.9,
        'lista_gerada_sem_data',
        Number(draft.evento.id)
      );

      return {
        estado: "itens_pendentes_confirmacao",
        evento_id: draft.evento.id,
        mensagem: itemsMsg,
        snapshot,
        showItems: true,
        suggestedReplies: ["Confirmar lista", "Editar itens"],
      };
    }

    // 🔥 Se usuário responder "Sim" ou informar data → Solicitar/persistir data
    if (/\b(sim|s|quero|claro|vou)\b/i.test(userText) || analysis.data_evento) {
      // Se já veio com a data na mesma mensagem (ex: "Sim, 10/12/2025")
      if (analysis.data_evento) {
        // console.log('[ORCHESTRATE] Data informada junto com confirmação:', analysis.data_evento);

        // Atualizar evento com data
        await upsertEvent({
          id: draft.evento.id,
          usuario_id: userId,
          nome_evento: draft.evento.nome_evento || "Rascunho",
          tipo_evento: draft.evento.tipo_evento,
          categoria_evento: draft.evento.categoria_evento,
          subtipo_evento: draft.evento.subtipo_evento,
          qtd_pessoas: draft.evento.qtd_pessoas,
          menu: draft.evento.menu,
          data_evento: analysis.data_evento,
          status: "collecting_core",
        });

        // Gerar lista de itens COM data
        const itensGerados = await generateItemList({
          tipo_evento: tipoEvento,
          qtd_pessoas: qtdPessoas,
          menu: menu || undefined
        });

        const itensComIds = itensGerados.map(item => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          evento_id: draft.evento.id,
          nome_item: item.nome_item || '',
          quantidade: item.quantidade || 0,
          unidade: item.unidade || 'un',
          valor_estimado: item.valor_estimado || 0,
          categoria: item.categoria || 'geral',
          prioridade: (item.prioridade || 'B') as 'A' | 'B' | 'C',
        })) as Item[];

        await rpc.items_replace_for_event(draft.evento.id, itensComIds);
        await setEventStatus(draft.evento.id, "itens_pendentes_confirmacao");

        const snapshot = await rpc.get_event_plan(draft.evento.id);
        const itemsMsg = getRandomTemplate('items_generated', {
          categoria_evento: tipoEvento,
          qtd_pessoas: qtdPessoas
        }) + ` Data: ${analysis.data_evento}.`;

        await contextManager.saveMessage(userId, 'assistant', itemsMsg, Number(draft.evento.id));
        await contextManager.updateContext(
          userId,
          'itens_pendentes_confirmacao',
          { ...savedContext.collected_data, data_evento: analysis.data_evento },
          [],
          0.9,
          'lista_gerada_com_data',
          Number(draft.evento.id)
        );

        return {
          estado: "itens_pendentes_confirmacao",
          evento_id: draft.evento.id,
          mensagem: itemsMsg,
          snapshot,
          showItems: true,
          suggestedReplies: ["Confirmar lista", "Editar itens"],
        };
      }

      // Se apenas confirmou que quer informar, pedir data
      // console.log('[ORCHESTRATE] Usuário quer informar data - solicitando');
      const askDateMsg = "Qual será a data do evento? (ex: 25/12/2024)";
      await contextManager.saveMessage(userId, 'assistant', askDateMsg, Number(draft.evento.id));
      await contextManager.updateContext(
        userId,
        'aguardando_data',
        savedContext.collected_data,
        ['data_evento'],
        0.8,
        'solicitar_data',
        Number(draft.evento.id)
      );

      return {
        estado: "aguardando_data",
        evento_id: draft.evento.id,
        mensagem: askDateMsg,
      };
    }
  }

  // 11.6) STATUS: aguardando_data - Receber e persistir data e GERAR LISTA
  if (savedContext.state === "aguardando_data" && draft?.evento) {
    // console.log('[ORCHESTRATE] Aguardando data do evento');

    const tipoEvento = (savedContext.collected_data?.categoria_evento as string | undefined) || draft.evento.tipo_evento;
    const qtdPessoas = (savedContext.collected_data?.qtd_pessoas as number | undefined) || draft.evento.qtd_pessoas;
    const menu = (savedContext.collected_data?.menu as string | undefined) || draft.evento.menu;

    if (analysis.data_evento) {
      // console.log('[ORCHESTRATE] Data recebida:', analysis.data_evento);

      // Atualizar evento com data
      await upsertEvent({
        id: draft.evento.id,
        usuario_id: userId,
        nome_evento: draft.evento.nome_evento || "Rascunho",
        tipo_evento: draft.evento.tipo_evento,
        categoria_evento: draft.evento.categoria_evento,
        subtipo_evento: draft.evento.subtipo_evento,
        qtd_pessoas: draft.evento.qtd_pessoas,
        menu: draft.evento.menu,
        data_evento: analysis.data_evento,
        status: "collecting_core",
      });

      // 🔥 Gerar lista de itens COM data
      const itensGerados = await generateItemList({
        tipo_evento: tipoEvento,
        qtd_pessoas: qtdPessoas,
        menu: menu || undefined
      });

      const itensComIds = itensGerados.map(item => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        evento_id: draft.evento.id,
        nome_item: item.nome_item || '',
        quantidade: item.quantidade || 0,
        unidade: item.unidade || 'un',
        valor_estimado: item.valor_estimado || 0,
        categoria: item.categoria || 'geral',
        prioridade: (item.prioridade || 'B') as 'A' | 'B' | 'C',
      })) as Item[];

      await rpc.items_replace_for_event(draft.evento.id, itensComIds);
      await setEventStatus(draft.evento.id, "itens_pendentes_confirmacao");

      const snapshot = await rpc.get_event_plan(draft.evento.id);
      const itemsMsg = getRandomTemplate('items_generated', {
        categoria_evento: tipoEvento,
        qtd_pessoas: qtdPessoas
      }) + ` Data: ${analysis.data_evento}.`;

      await contextManager.saveMessage(userId, 'assistant', itemsMsg, Number(draft.evento.id));
      await contextManager.updateContext(
        userId,
        'itens_pendentes_confirmacao',
        { ...savedContext.collected_data, data_evento: analysis.data_evento },
        [],
        0.9,
        'lista_gerada_com_data',
        Number(draft.evento.id)
      );

      return {
        estado: "itens_pendentes_confirmacao",
        evento_id: draft.evento.id,
        mensagem: itemsMsg,
        snapshot,
        showItems: true,
        suggestedReplies: ["Confirmar lista", "Editar itens"],
      };
    } else {
      const retryMsg = "Não consegui identificar a data. Tente novamente no formato dd/mm/aaaa (ex: 25/12/2024)";
      await contextManager.saveMessage(userId, 'assistant', retryMsg, Number(draft.evento.id));

      return {
        estado: "aguardando_data",
        evento_id: draft.evento.id,
        mensagem: retryMsg,
      };
    }
  }

  // 12) STATUS: itens_pendentes_confirmacao - usar LLM para resposta contextual
  if (draft?.evento?.status === "itens_pendentes_confirmacao") {
    // console.log('[ORCHESTRATE] Status itens_pendentes - usando LLM');

    // 🔥 CORREÇÃO 1: Detectar confirmação explícita da lista
    if (analysis.intencao === "confirmar_evento" ||
        /confirmar\s*(lista|itens)?|lista\s*ok|tá\s*ótimo|está\s*ótimo|ta\s*otimo|esta\s*otimo|ótimo|otimo/i.test(userText)) {
      // console.log('[ORCHESTRATE] Confirmação explícita detectada - finalizando evento');
      await finalizeEvent(draft.evento.id, draft.evento);

      const snapshot = await rpc.get_event_plan(draft.evento.id);
      const finalMsg = getRandomTemplate('event_finalized');

      await contextManager.saveMessage(userId, 'assistant', finalMsg, Number(draft.evento.id));
      await contextManager.updateContext(
        userId,
        'finalizado',
        { evento_finalizado: true },
        [],
        1.0,
        'confirmar_evento',
        Number(draft.evento.id)
      );

      return {
        estado: "finalizado",
        evento_id: draft.evento.id,
        mensagem: finalMsg,
        snapshot,
        showItems: true,
        closeChat: true,
        toast: "Evento criado com sucesso!",
        ctas: [
          { type: "view-dashboard", label: "Ver Dashboard" }
        ]
      };
    }

    // 🔥 CORREÇÃO 2: Persistir data se fornecida
    if (analysis.data_evento && analysis.data_evento !== draft.evento.data_evento) {
      console.log('[ORCHESTRATE] Data persistida:', {
        from: draft.evento.data_evento,
        to: analysis.data_evento
      });

      await upsertEvent({
        id: draft.evento.id,
        usuario_id: userId,
        nome_evento: draft.evento.nome_evento || "Rascunho",
        tipo_evento: draft.evento.tipo_evento,
        categoria_evento: draft.evento.categoria_evento,
        subtipo_evento: draft.evento.subtipo_evento,
        qtd_pessoas: draft.evento.qtd_pessoas,
        menu: draft.evento.menu,
        data_evento: analysis.data_evento,
        status: draft.evento.status,
      });

      const confirmMsg = `Ótimo! Data confirmada: ${analysis.data_evento}. Está tudo pronto! Quer confirmar a lista de itens?`;
      await contextManager.saveMessage(userId, 'assistant', confirmMsg, Number(draft.evento.id));

      const snapshot = await rpc.get_event_plan(draft.evento.id);

      return {
        estado: "itens_pendentes_confirmacao",
        evento_id: draft.evento.id,
        mensagem: confirmMsg,
        snapshot,
        showItems: true,
        suggestedReplies: ["Confirmar lista", "Editar itens"],
      };
    }

    if (history && history.length > 0) {
      try {
        const basePrompt = getPersonalitySystemPrompt();
        const contextPrompt = `
**Contexto Atual:**
O evento é um ${draft.evento.tipo_evento} para ${draft.evento.qtd_pessoas} pessoas${draft.evento.menu ? ` com menu de ${draft.evento.menu}` : ''}.
Os itens já foram listados e estão aguardando confirmação.

**Seu Objetivo:**
${adjustToneForState('itens_pendentes_confirmacao')}
Se o usuário confirmar, celebre brevemente. Se pedir para editar, pergunte o que ele quer mudar.`;

        const llmResult = await getLlmSuggestions(
          basePrompt + '\n\n' + contextPrompt,
          history,
          0.7
        );

        if (llmResult?.content) {
          await contextManager.saveMessage(userId, 'assistant', llmResult.content, Number(draft.evento.id));

          return {
            estado: "itens_pendentes_confirmacao",
            evento_id: draft.evento.id,
            mensagem: llmResult.content,
            snapshot: draft,
            suggestedReplies: ["Confirmar", "Editar", "Ver lista"],
          };
        }
      } catch (err) {
        console.warn('[ORCHESTRATE] LLM falhou', err);
      }
    }

    // Fallback
    const fallbackMsg = "Os itens estão listados. Você pode confirmar, editar ou me perguntar algo sobre o evento.";
    await contextManager.saveMessage(userId, 'assistant', fallbackMsg, Number(draft.evento.id));

    return {
      estado: "itens_pendentes_confirmacao",
      evento_id: draft.evento.id,
      mensagem: fallbackMsg,
      snapshot: draft,
      suggestedReplies: ["Confirmar lista", "Editar itens", "Ver lista"],
    };
  }

  // 13) RESPOSTA PADRÃO COM LLM
  console.log('[ORCHESTRATE] Resposta padrão - usando LLM');

  if (history && history.length > 0) {
    try {
      const contextInfo = draft?.evento
        ? `${draft.evento.categoria_evento || draft.evento.tipo_evento || 'não definido'}, ${draft.evento.qtd_pessoas || 'não definido'} pessoas${draft.evento.menu ? `, menu: ${draft.evento.menu}` : ''}, data: ${draft.evento.data_evento || 'não definido'}`
        : 'Nenhum evento em andamento';

      const basePrompt = getPersonalitySystemPrompt();
      const contextPrompt = `
**Contexto Atual:**
${contextInfo}

**Seu Objetivo:**
${adjustToneForState('collecting_core')}
Se faltam informações (tipo, quantidade, menu, data), pergunte de forma natural e direta.`;

      const llmResult = await getLlmSuggestions(
        basePrompt + '\n\n' + contextPrompt,
        history,
        0.7
      );

      if (llmResult?.content) {
        await contextManager.saveMessage(userId, 'assistant', llmResult.content, draft?.evento?.id ? Number(draft.evento.id) : undefined);

        return {
          estado: "collecting_core",
          evento_id: draft?.evento?.id ?? null,
          mensagem: llmResult.content,
          suggestedReplies: ["Criar evento", "Ver eventos"],
          ctas: [],
        };
      }
    } catch (err) {
      console.warn('[ORCHESTRATE] LLM falhou', err);
    }
  }

  // 14) FALLBACK FINAL
  const fallbackFinalMsg = 'Me diga o tipo de evento e quantas pessoas (ex.: "jantar para 10 pessoas").';
  await contextManager.saveMessage(userId, 'assistant', fallbackFinalMsg, draft?.evento?.id ? Number(draft.evento.id) : undefined);

  return {
    estado: "collecting_core",
    evento_id: draft?.evento?.id ?? null,
    mensagem: fallbackFinalMsg,
    suggestedReplies: ["Jantar para 10", "Churrasco para 15", "Festa para 20"],
    ctas: [],
  };
};
