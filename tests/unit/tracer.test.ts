import { describe, it, expect, beforeEach } from 'vitest';
import { startTrace, endTrace, startSpan, endSpan, getActiveRuns, isTracingEnabled } from '@/langgraph/tracer';

describe('tracer — startTrace e endTrace', () => {
  beforeEach(() => {
    const runs = getActiveRuns();
    runs.forEach((r) => {
      endTrace(r.id, { response: 'cleanup' });
    });
  });

  it('deve iniciar e finalizar um trace com métricas', () => {
    const runId = startTrace({
      threadId: 'thread-123',
      userId: 'user-1',
      userMessage: 'oi, teste',
      tags: ['test'],
    });
    expect(runId).toMatch(/^run_/);

    const run = endTrace(runId, {
      response: 'Olá! Tudo bem?',
      route: 'conversational',
    });

    expect(run).toBeDefined();
    expect(run?.threadId).toBe('thread-123');
    expect(run?.userId).toBe('user-1');
    expect(run?.response).toBe('Olá! Tudo bem?');
    expect(run?.route).toBe('conversational');
    expect(run?.metrics?.totalLatencyMs).toBeGreaterThanOrEqual(0);
    expect(run?.metrics?.estimatedTokens).toBeGreaterThan(0);
  });

  it('deve registrar spans de nós', () => {
    const runId = startTrace({
      threadId: 't1',
      userId: 'u1',
      userMessage: 'test',
    });

    startSpan(runId, 'router', { userMessage: 'test' }, ['routing']);
    endSpan(runId, 'router', { route: 'conversational' });

    startSpan(runId, 'conversational', {}, ['llm']);
    endSpan(runId, 'conversational', { responsePreview: 'Olá!' });

    const run = endTrace(runId, { response: 'Olá!' });
    expect(run?.metrics?.routerLatencyMs).toBeGreaterThanOrEqual(0);
    expect(run?.metrics?.conversationalLatencyMs).toBeGreaterThanOrEqual(0);
    expect(run?.spans.length).toBe(2);
  });

  it('deve registrar erro no trace', () => {
    const runId = startTrace({
      threadId: 't-err',
      userId: 'u-err',
      userMessage: 'test',
    });

    const run = endTrace(runId, { error: 'groq_timeout' });
    expect(run?.spans.some((s) => s.error === 'groq_timeout')).toBe(true);
  });

  it('deve registrar guardrailBlocks', () => {
    const runId = startTrace({
      threadId: 't-block',
      userId: 'u-block',
      userMessage: 'test',
    });

    startSpan(runId, 'guardrail_block', { reason: 'injection_ignore_instructions' });
    endSpan(runId, 'guardrail_block', { blocked: true });

    const run = endTrace(runId, { response: 'bloqueado' });
    expect(run?.metrics?.guardrailBlocks).toBe(1);
  });

  it('deve expirar trace após endTrace', () => {
    const runId = startTrace({
      threadId: 't-expire',
      userId: 'u-expire',
      userMessage: 'test',
    });
    endTrace(runId, { response: 'ok' });
    const active = getActiveRuns();
    expect(active.length).toBe(0);
  });
});

describe('tracer — modo sem API key', () => {
  it('isTracingEnabled deve retornar false sem API key', () => {
    expect(isTracingEnabled()).toBe(false);
  });
});
