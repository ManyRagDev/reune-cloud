/**
 * LangSmith Tracer — observabilidade do workflow LangGraph.
 * Sustenta: tracing por invocação e por nó, latência, custo estimado,
 * falhas, e insumos para avaliações de qualidade.
 *
 * Modo fallback: sem API key, loga traces estruturados no console.
 * Modo produção: com LANGCHAIN_API_KEY, envia traces ao LangSmith.
 */

import { Client, type RunTreeConfig } from 'langsmith';

const API_KEY =
  typeof import.meta !== 'undefined' && (import.meta as Record<string, unknown>).env
    ? ((import.meta as Record<string, unknown>).env as Record<string, string>).VITE_LANGSMITH_API_KEY
    : undefined;

const PROJECT = 'reune-chatbot';
const ENABLED = Boolean(API_KEY);

const client = ENABLED ? new Client({ apiKey: API_KEY! }) : null;

export interface TraceSpan {
  name: string;
  startTime: number;
  endTime?: number;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: string;
  tags?: string[];
}

export interface TraceRun {
  id: string;
  threadId: string;
  userId: string;
  userMessage: string;
  startTime: number;
  endTime?: number;
  response?: string;
  route?: string;
  spans: TraceSpan[];
  metrics?: {
    totalLatencyMs?: number;
    routerLatencyMs?: number;
    conversationalLatencyMs?: number;
    estimatedTokens?: number;
    guardrailBlocks?: number;
  };
}

const runStore = new Map<string, TraceRun>();

function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function startTrace(params: {
  threadId: string;
  userId: string;
  userMessage: string;
  tags?: string[];
}): string {
  const runId = generateRunId();
  const run: TraceRun = {
    id: runId,
    threadId: params.threadId,
    userId: params.userId,
    userMessage: params.userMessage,
    startTime: performance.now(),
    spans: [],
    metrics: {},
  };
  runStore.set(runId, run);

  console.debug(`[Tracer:${runId}] run iniciada`, {
    threadId: params.threadId,
    userId: params.userId,
    messagePreview: params.userMessage.slice(0, 80),
  });

  return runId;
}

export function startSpan(
  runId: string,
  name: string,
  inputs?: Record<string, unknown>,
  tags?: string[]
): string {
  const spanId = `span_${name}_${Date.now()}`;
  const run = runStore.get(runId);
  if (!run) return spanId;

  run.spans.push({
    name,
    startTime: performance.now(),
    inputs,
    tags,
  });

  return spanId;
}

export function endSpan(
  runId: string,
  name: string,
  outputs?: Record<string, unknown>,
  error?: string
): void {
  const run = runStore.get(runId);
  if (!run) return;

  const span = run.spans.find((s) => s.name === name && !s.endTime);
  if (!span) return;

  span.endTime = performance.now();
  span.outputs = outputs;
  if (error) span.error = error;
}

export function endTrace(runId: string, params: {
  response?: string;
  route?: string;
  error?: string;
}): TraceRun | undefined {
  const run = runStore.get(runId);
  if (!run) return undefined;

  run.endTime = performance.now();
  run.response = params.response;
  run.route = params.route;
  if (params.error) run.spans.push({
    name: 'error',
    startTime: run.startTime,
    endTime: run.endTime,
    error: params.error,
  });

  const routerSpan = run.spans.find((s) => s.name === 'router');
  const convSpan = run.spans.find((s) => s.name === 'conversational');

  run.metrics = {
    totalLatencyMs: Math.round(run.endTime - run.startTime),
    routerLatencyMs: routerSpan?.endTime ? Math.round(routerSpan.endTime - routerSpan.startTime) : undefined,
    conversationalLatencyMs: convSpan?.endTime ? Math.round(convSpan.endTime - convSpan.startTime) : undefined,
    estimatedTokens: run.response ? estimateTokens(run.response) : undefined,
    guardrailBlocks: run.spans.filter((s) => s.name === 'guardrail_block').length,
  };

  console.debug(`[Tracer:${runId}] run finalizada`, run.metrics);

  if (ENABLED && client) {
    sendToLangSmith(run).catch((err) => {
      console.warn(`[Tracer:${runId}] falha ao enviar ao LangSmith:`, err);
    });
  }

  runStore.delete(runId);
  return run;
}

async function sendToLangSmith(run: TraceRun): Promise<void> {
  if (!client) return;

  const rootConfig: RunTreeConfig = {
    name: 'chat_invocation',
    run_type: 'chain',
    inputs: { user_message: run.userMessage, thread_id: run.threadId },
    outputs: { response: run.response, route: run.route },
    id: run.id,
    project_name: PROJECT,
    extra: {
      metadata: {
        threadId: run.threadId,
        userId: run.userId,
        ...run.metrics,
      },
    },
  };

  await client.createRun(rootConfig);

  for (const span of run.spans) {
    const duration = span.endTime ? Math.round(span.endTime - span.startTime) : undefined;
    await client.createRun({
      name: span.name,
      run_type: span.name === 'router' ? 'chain' : 'llm',
      inputs: span.inputs ?? {},
      outputs: span.outputs ?? {},
      parent_run_id: run.id,
      project_name: PROJECT,
      error: span.error,
      extra: {
        metadata: {
          duration_ms: duration,
          tags: span.tags,
        },
      },
    });
  }
}

export function getActiveRuns(): TraceRun[] {
  return Array.from(runStore.values());
}

export function isTracingEnabled(): boolean {
  return ENABLED;
}
