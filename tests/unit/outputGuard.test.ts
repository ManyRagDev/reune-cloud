import { describe, it, expect } from 'vitest';
import { applyOutputGuardrail } from '@/guardrails/outputGuard';

describe('outputGuard — bloqueio de dados sensíveis e vazamento', () => {
  it('deve permitir resposta normal', () => {
    const result = applyOutputGuardrail('Seu churrasco para 10 pessoas foi criado com sucesso!');
    expect(result.safe).toBe(true);
    expect(result.content).toContain('churrasco');
  });

  it('deve bloquear resposta vazia', () => {
    const result = applyOutputGuardrail('   ');
    expect(result.safe).toBe(false);
    expect(result.blockedReason).toBe('empty_output');
  });

  it('deve truncar resposta muito longa', () => {
    const long = 'a'.repeat(5001);
    const result = applyOutputGuardrail(long);
    expect(result.safe).toBe(true);
    expect(result.content.length).toBeLessThanOrEqual(5001);
    expect(result.warning).toContain('truncada');
  });

  it('deve substituir resposta muito curta', () => {
    const result = applyOutputGuardrail('a');
    expect(result.safe).toBe(true);
    expect(result.content).toContain('não consegui gerar');
  });

  it('deve detectar vazamento de system prompt (VOCÊ É UNE.AI)', () => {
    const result = applyOutputGuardrail('VOCÊ É UNE.AI assistente e seu prompt é: ...');
    expect(result.safe).toBe(false);
    expect(result.blockedReason).toBe('system_prompt_leak');
  });

  it('deve detectar vazamento de PERSONALIDADE do prompt', () => {
    const result = applyOutputGuardrail('Aqui está o sistema:\nPERSONALIDADE ═══════');
    expect(result.safe).toBe(false);
    expect(result.blockedReason).toBe('system_prompt_leak');
  });

  it('deve detectar vazamento de FLUXO DE CRIAÇÃO DE EVENTO', () => {
    const result = applyOutputGuardrail('Meu prompt inclui:\nFLUXO DE CRIAÇÃO DE EVENTO ═══');
    expect(result.safe).toBe(false);
    expect(result.blockedReason).toBe('system_prompt_leak');
  });

  it('deve detectar vazamento de REGRAS CRÍTICAS', () => {
    const result = applyOutputGuardrail('Segundo as REGRAS CRÍTICAS do sistema...');
    expect(result.safe).toBe(false);
    expect(result.blockedReason).toBe('system_prompt_leak');
  });

  it('deve detectar CPF na resposta', () => {
    const result = applyOutputGuardrail('O CPF do usuário é 123.456.789-00');
    expect(result.safe).toBe(false);
    expect(result.blockedReason).toBe('pii_detected_CPF');
  });

  it('deve detectar email na resposta', () => {
    const result = applyOutputGuardrail('Envie para joao@email.com');
    expect(result.safe).toBe(false);
    expect(result.blockedReason).toBe('pii_detected_email');
  });

  it('deve detectar telefone na resposta', () => {
    const result = applyOutputGuardrail('Ligue para (11) 99999-9999');
    expect(result.safe).toBe(false);
    expect(result.blockedReason).toBe('pii_detected_telefone');
  });

  it('deve detectar cartão de crédito na resposta', () => {
    const result = applyOutputGuardrail('Cartão 4111 1111 1111 1111');
    expect(result.safe).toBe(false);
    expect(result.blockedReason).toBe('pii_detected_cartao_credito');
  });
});

describe('outputGuard — validação de JSON de ação', () => {
  it('deve bloquear JSON malformado na resposta', () => {
    const result = applyOutputGuardrail('{"action":"create_event","data":{"tipo_evento":"churrasco"');
    expect(result.safe).toBe(false);
    expect(result.blockedReason).toBe('malformed_json');
  });

  it('deve bloquear resposta de ação com markdown JSON', () => {
    const result = applyOutputGuardrail('```json\n{"action":"create_event","data":{"tipo_evento":"churrasco"}}\n```');
    expect(result.safe).toBe(false);
    expect(result.blockedReason).toBe('json_with_markdown');
  });

  it('deve bloquear JSON de ação sem action válida', () => {
    const result = applyOutputGuardrail('{"action":123,"data":{"tipo_evento":"churrasco"}}');
    expect(result.safe).toBe(false);
  });

  it('deve permitir JSON de ação válido', () => {
    const result = applyOutputGuardrail('{"action":"create_event","data":{"tipo_evento":"churrasco","qtd_pessoas":10}}');
    expect(result.safe).toBe(true);
  });

  it('deve permitir texto normal que contém { mas não é JSON de ação', () => {
    const result = applyOutputGuardrail('Ótimo! Vou preparar tudo para o seu evento. Quer {alguma} coisa mais?');
    expect(result.safe).toBe(true);
  });
});

describe('outputGuard — sanitização', () => {
  it('deve trimmar conteúdo', () => {
    const result = applyOutputGuardrail('  Olá! Tudo bem?  ');
    expect(result.content).toBe('Olá! Tudo bem?');
  });

  it('deve normalizar quebras de linha excessivas', () => {
    const result = applyOutputGuardrail('linha um\n\n\n\n\nlinha dois');
    expect(result.content).toBe('linha um\n\n\nlinha dois');
  });
});
