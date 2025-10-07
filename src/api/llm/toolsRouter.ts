import { validateToolParams } from './schemas';
import type { ToolSchemaName } from './schemas';
import type { ToolCall } from '@/types/tools';
import { churrascoProfile } from '@/profiles/churrasco';
import { estimateQuantityPerPerson, computeCostSplit } from '@/core/calc';
import { rpc } from '@/api/rpc';
import type { Item, Participant } from '@/types/domain';

type RunResult = { ok: boolean; data?: unknown; error?: string };

function ensureOwner(userId: string, ownerId: string): boolean {
  return String(userId) === String(ownerId);
}

export async function runToolCall(userId: string, call: ToolCall): Promise<RunResult> {
  const started = performance.now();
  const name = call?.name as ToolSchemaName;
  const args = call?.arguments ?? {};
  const idempotencyKey: string | undefined = typeof (args as Record<string, unknown>)?.idempotencyKey === 'string'
    ? (args as Record<string, unknown>).idempotencyKey as string
    : undefined;

  try {
    // Validar parâmetros com Zod
    const v = validateToolParams(name, args as unknown);
    if (!v.ok) {
      const duration_ms = Math.round(performance.now() - started);
      console.debug('[toolsRouter] invalid_params', { tool: name, duration_ms, error: v.error });
      return { ok: false, error: `invalid_params: ${v.error}` };
    }

    // ACL: conferir que userId é dono do evento
    const evento_id = (v.data as { evento_id: string }).evento_id;
    const plan = await rpc.get_event_plan(evento_id).catch((e) => {
      const msg = e instanceof Error ? e.message : String(e);
      return Promise.reject(new Error(msg.includes('42501') ? '403_not_authorized' : msg));
    });
    if (!ensureOwner(userId, plan.evento.usuario_id)) {
      const duration_ms = Math.round(performance.now() - started);
      console.debug('[toolsRouter] acl_forbidden', { tool: name, evento_id, duration_ms });
      return { ok: false, error: 'forbidden' };
    }

    // Mapear tool → handler
    switch (name) {
      case 'generateItemList': {
        const { tipo_evento, qtd_pessoas } = v.data as { tipo_evento: string; qtd_pessoas: number };
        const people = qtd_pessoas || plan.evento.qtd_pessoas;

        // Gerar itens a partir do perfil (churrasco como default)
        const base = churrascoProfile.estimate(people);
        const generated: Array<Partial<Item>> = base.map((s) => ({
          nome_item: s.nome_item,
          quantidade: s.quantidade,
          unidade: s.unidade,
          valor_estimado: s.valor_estimado ?? 0,
          categoria: s.categoria || 'geral',
          prioridade: s.prioridade || 'B',
        }));

        const persisted = await rpc.items_replace_for_event(evento_id, generated as unknown as Item[], { idempotencyKey });
        const finalPlan = await rpc.get_event_plan(evento_id);
        const duration_ms = Math.round(performance.now() - started);
        console.debug('[toolsRouter] ok generateItemList', { evento_id, count: persisted.length, duration_ms });
        return { ok: true, data: { plan: finalPlan } };
      }

      case 'confirmItems': {
        const { itens_editados } = v.data as { itens_editados?: Array<Partial<Item>> };
        if (!Array.isArray(itens_editados) || itens_editados.length === 0) {
          const duration_ms = Math.round(performance.now() - started);
          console.debug('[toolsRouter] invalid confirmItems empty', { evento_id, duration_ms });
          return { ok: false, error: 'invalid_itens_editados' };
        }
        const persisted = await rpc.items_replace_for_event(evento_id, itens_editados as unknown as Item[], { idempotencyKey });
        const finalPlan = await rpc.get_event_plan(evento_id);
        const duration_ms = Math.round(performance.now() - started);
        console.debug('[toolsRouter] ok confirmItems', { evento_id, count: persisted.length, duration_ms });
        return { ok: true, data: { plan: finalPlan } };
      }

      case 'computeCostSplit': {
        // Obter plan, calcular rateio e persistir
        const rows = computeCostSplit(plan.itens, plan.participantes);
        const persisted = await rpc.distribution_bulk_upsert(evento_id, rows, { idempotencyKey });
        const summary = await rpc.get_distribution_summary(evento_id);
        const duration_ms = Math.round(performance.now() - started);
        console.debug('[toolsRouter] ok computeCostSplit', { evento_id, rows: persisted.length, duration_ms });
        return { ok: true, data: { summary } };
      }

      case 'addParticipants': {
        const { participantes } = v.data as { participantes: Array<Partial<Participant>> };
        const normalized: Participant[] = (participantes || []).map((p) => ({
          id: (p as Record<string, unknown>).id as string | undefined,
          evento_id: evento_id,
          nome_participante: String((p as Record<string, unknown>).nome_participante ?? ''),
          contato: ((p as Record<string, unknown>).contato as string | null | undefined) ?? null,
          status_convite: ((p as Record<string, unknown>).status_convite as 'pendente' | 'confirmado' | 'recusado' | undefined) ?? 'pendente',
          preferencias: ((p as Record<string, unknown>).preferencias as Record<string, unknown> | null | undefined) ?? null,
          valor_responsavel: ((p as Record<string, unknown>).valor_responsavel as number | null | undefined) ?? null,
        })) as unknown as Participant[];
        const persisted = await rpc.participants_bulk_upsert(evento_id, normalized, { idempotencyKey });
        const duration_ms = Math.round(performance.now() - started);
        console.debug('[toolsRouter] ok addParticipants', { evento_id, count: persisted.length, duration_ms });
        return { ok: true, data: { participantes: persisted } };
      }

      case 'getPlan': {
        const plan2 = await rpc.get_event_plan(evento_id);
        const duration_ms = Math.round(performance.now() - started);
        console.debug('[toolsRouter] ok getPlan', { evento_id, duration_ms });
        return { ok: true, data: { plan: plan2 } };
      }

      default: {
        const duration_ms = Math.round(performance.now() - started);
        console.debug('[toolsRouter] unknown_tool', { tool: name, duration_ms });
        return { ok: false, error: 'unknown_tool' };
      }
    }
  } catch (e) {
    const duration_ms = Math.round(performance.now() - started);
    const msg = e instanceof Error ? e.message : String(e);
    const error = /403_not_authorized|forbidden/i.test(msg) ? 'forbidden' : msg;
    console.debug('[toolsRouter] error', { tool: name, error, duration_ms });
    return { ok: false, error };
  }
}