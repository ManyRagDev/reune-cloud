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

  console.log('[Orchestrator] Contexto carregado:', {
    state: savedContext.state,
    historyLength: history.length,
    eventoId: savedContext.evento_id,
  });

  // Salvar mensagem do usuário
  await contextManager.saveMessage(userId, 'user', userText, eventoId ? Number(eventoId) : undefined);
  console.log('[ORCHESTRATE] Iniciando orquestração', { userText, userId, eventoId, force_action });
  
  // 1) Carregar rascunho/snapshot (se houver)
  const draft = eventoId
    ? await getPlanSnapshot(eventoId)
    : await findDraftEventByUser(userId);
  console.log('[ORCHESTRATE] Draft carregado:', draft);

  // 1.5) Análise situacional proativa (antes de processar mensagem)
  if (!force_action && draft?.evento) {
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

  // 2) Análise semântica da mensagem com contexto
  const analysis = await analyzeMessage(userText, {
    tipo_evento: draft?.evento?.tipo_evento,
    qtd_pessoas: draft?.evento?.qtd_pessoas,
    data_evento: draft?.evento?.data_evento,
  });
  console.log('[ORCHESTRATE] Análise semântica:', analysis);

  // 2.5) Detectar correções e confusões
  const correction = correctionDetector.detectCorrection(userText, analysis, savedContext.collected_data);
  const isConfused = correctionDetector.detectConfusion(userText);

  if (correction.isCorrection) {
    console.log('[Orchestrator] Correção detectada:', correction);
    
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
    console.log('[Orchestrator] Confusão detectada');
    
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
  console.log('[ORCHESTRATE] Classificação:', classification);

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
      console.log('[Orchestrator] Baixa confiança, solicitando clarificação:', clarification.reason);
      
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
      (analysis.intencao === "mostrar_itens" || /itens|lista|mostrar|mostra|mostre/i.test(userText))) {
    console.log('[ORCHESTRATE] Caso prioritário: mostrar itens existentes');
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

  // 6) ENCERRAR CONVERSA
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

  // 7) CONFIRMAÇÃO - Finalizar evento se já tem itens
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
      ctas: [
        { type: "view-dashboard", label: "Ver Dashboard" }
      ]
    };
  }

  // 8) CONFIRMAÇÃO - Gerar itens se slots completos
  if (analysis.intencao === "confirmar_evento" && 
      (draft?.evento?.tipo_evento || analysis.categoria_evento || analysis.subtipo_evento) && 
      (draft?.evento?.qtd_pessoas || analysis.qtd_pessoas)) {
    console.log('[ORCHESTRATE] Confirmação semântica: gerar itens');
    
    const tipo = analysis.categoria_evento || analysis.subtipo_evento || draft?.evento?.tipo_evento;
    const qtd = analysis.qtd_pessoas || draft?.evento?.qtd_pessoas;
    const menu = analysis.menu || draft?.evento?.menu;
    
    const evtId = draft?.evento?.id ?? (
      await upsertEvent({
        usuario_id: userId,
        nome_evento: "Rascunho",
        tipo_evento: tipo!,
        categoria_evento: analysis.categoria_evento,
        subtipo_evento: analysis.subtipo_evento,
        menu,
        qtd_pessoas: qtd!,
        status: "collecting_core",
      })
    ).id;

    // Gerar lista de itens
    const itensGerados = await generateItemList({ tipo_evento: tipo!, qtd_pessoas: qtd!, menu });
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
    const itemsMsg = getRandomTemplate('items_generated', { categoria_evento: tipo, qtd_pessoas: qtd });

    await contextManager.saveMessage(userId, 'assistant', itemsMsg, Number(evtId));
    await contextManager.updateContext(
      userId,
      'itens_pendentes_confirmacao',
      { categoria_evento: tipo, qtd_pessoas: qtd, menu },
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
      suggestedReplies: ["Confirmar lista", "Editar itens"],
      ctas: [
        { type: "confirm-items", label: "Confirmar lista" },
        { type: "edit-items", label: "Editar itens" },
      ],
    };
  }

  // 9) CRIAR EVENTO - Coletar informações progressivamente
  if (analysis.intencao === "criar_evento") {
    console.log('[ORCHESTRATE] Criando evento');
    
    // Extrair dados da análise e merge com draft
    const categoria = analysis.categoria_evento || draft?.evento?.categoria_evento;
    const subtipo = analysis.subtipo_evento || draft?.evento?.subtipo_evento;
    const qtd = analysis.qtd_pessoas || draft?.evento?.qtd_pessoas;
    const data = analysis.data_evento || draft?.evento?.data_evento;
    const menu = analysis.menu || draft?.evento?.menu;

    // Caso especial: tem subtipo mas não categoria → perguntar período do dia
    if (subtipo && !categoria) {
      console.log('[ORCHESTRATE] Subtipo sem categoria: pedindo período');
      const evtId = draft?.evento?.id ?? (
        await upsertEvent({
          usuario_id: userId,
          nome_evento: "Rascunho",
          tipo_evento: subtipo,
          subtipo_evento: subtipo,
          qtd_pessoas: qtd,
          menu,
          status: "collecting_core",
        })
      ).id;

      return {
        estado: "collecting_core",
        evento_id: evtId,
        mensagem: getRandomTemplate('ask_categoria', { subtipo_evento: subtipo }),
        suggestedReplies: ["Almoço", "Jantar", "Lanche"],
        ctas: [],
      };
    }

    // Tem categoria mas não quantidade → perguntar
    if ((categoria || subtipo) && !qtd) {
      console.log('[ORCHESTRATE] Categoria sem quantidade: pedindo qtd');
      const evtId = draft?.evento?.id ?? (
        await upsertEvent({
          usuario_id: userId,
          nome_evento: "Rascunho",
          tipo_evento: categoria || subtipo!,
          categoria_evento: categoria,
          subtipo_evento: subtipo,
          menu,
          status: "collecting_core",
        })
      ).id;

      return {
        estado: "collecting_core",
        evento_id: evtId,
        mensagem: getRandomTemplate('ask_qtd', { categoria_evento: categoria || subtipo }),
        ctas: [],
      };
    }

    // Tem tipo e quantidade mas não menu → perguntar
    if ((categoria || subtipo) && qtd && !menu) {
      console.log('[ORCHESTRATE] Tem tipo e qtd, pedindo menu');
      const evtId = draft?.evento?.id ?? (
        await upsertEvent({
          usuario_id: userId,
          nome_evento: "Rascunho",
          tipo_evento: categoria || subtipo!,
          categoria_evento: categoria,
          subtipo_evento: subtipo,
          qtd_pessoas: qtd,
          status: "collecting_core",
        })
      ).id;

      return {
        estado: "collecting_core",
        evento_id: evtId,
        mensagem: getRandomTemplate('ask_menu'),
        ctas: [],
      };
    }

    // Tem tipo, quantidade e menu mas não data → perguntar
    if ((categoria || subtipo) && qtd && menu && !data) {
      console.log('[ORCHESTRATE] Tem tipo, qtd e menu, pedindo data');
      const evtId = draft?.evento?.id ?? (
        await upsertEvent({
          usuario_id: userId,
          nome_evento: "Rascunho",
          tipo_evento: categoria || subtipo!,
          categoria_evento: categoria,
          subtipo_evento: subtipo,
          qtd_pessoas: qtd,
          menu,
          status: "collecting_core",
        })
      ).id;

      return {
        estado: "collecting_core",
        evento_id: evtId,
        mensagem: getRandomTemplate('ask_data', { categoria_evento: categoria || subtipo, qtd_pessoas: qtd }),
        ctas: [],
      };
    }

    // Tem tudo → gerar lista de itens
    if ((categoria || subtipo) && qtd && menu && data) {
      console.log('[ORCHESTRATE] Slots completos: gerando itens');
      const tipo = categoria || subtipo!;
      
      const evtId = draft?.evento?.id ?? (
        await upsertEvent({
          usuario_id: userId,
          nome_evento: "Rascunho",
          tipo_evento: tipo,
          categoria_evento: categoria,
          subtipo_evento: subtipo,
          qtd_pessoas: qtd,
          menu,
          data_evento: data,
          status: "collecting_core",
        })
      ).id;

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
  }

  // 10) DEFINIR MENU
  if (analysis.intencao === "definir_menu" && analysis.menu) {
    console.log('[ORCHESTRATE] Definindo menu');
    
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
        mensagem: getRandomTemplate('menu_confirmed', { menu: analysis.menu }),
        ctas: [],
      };
    }
  }

  // 11) STATUS: itens_pendentes_confirmacao - usar LLM para resposta contextual
  if (draft?.evento?.status === "itens_pendentes_confirmacao") {
    console.log('[ORCHESTRATE] Status itens_pendentes - usando LLM');
    
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

  // 12) RESPOSTA PADRÃO COM LLM
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
  
  // 13) FALLBACK FINAL
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
