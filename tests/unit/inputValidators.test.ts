import { describe, it, expect } from 'vitest';
import { validateEventData, validateItemEdit } from '@/validators/inputValidators';

describe('validateEventData', () => {
  it('deve validar dados completos corretos', () => {
    const result = validateEventData({
      tipo_evento: 'churrasco',
      qtd_pessoas: 10,
      data_evento: '2026-12-25',
    });
    expect(result.valid).toBe(true);
    expect(result.data?.tipo_evento).toBe('churrasco');
    expect(result.data?.qtd_pessoas).toBe(10);
  });

  it('deve validar com menu opcional', () => {
    const result = validateEventData({
      tipo_evento: 'jantar',
      qtd_pessoas: 15,
      menu: 'massa',
    });
    expect(result.valid).toBe(true);
    expect(result.data?.menu).toBe('massa');
  });

  it('deve rejeitar tipo_evento vazio', () => {
    const result = validateEventData({
      tipo_evento: '',
      qtd_pessoas: 10,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Tipo de evento');
  });

  it('deve rejeitar tipo_evento muito longo', () => {
    const result = validateEventData({
      tipo_evento: 'x'.repeat(150),
      qtd_pessoas: 10,
    });
    expect(result.valid).toBe(false);
  });

  it('deve rejeitar qtd_pessoas zero', () => {
    const result = validateEventData({
      tipo_evento: 'churrasco',
      qtd_pessoas: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('maior que zero');
  });

  it('deve rejeitar qtd_pessoas negativa', () => {
    const result = validateEventData({
      tipo_evento: 'churrasco',
      qtd_pessoas: -5,
    });
    expect(result.valid).toBe(false);
  });

  it('deve rejeitar qtd_pessoas acima de 10000', () => {
    const result = validateEventData({
      tipo_evento: 'festival',
      qtd_pessoas: 50000,
    });
    expect(result.valid).toBe(false);
  });

  it('deve rejeitar qtd_pessoas não inteira', () => {
    const result = validateEventData({
      tipo_evento: 'churrasco',
      qtd_pessoas: 10.5,
    });
    expect(result.valid).toBe(false);
  });

  it('deve rejeitar data_evento com formato inválido', () => {
    const result = validateEventData({
      tipo_evento: 'churrasco',
      qtd_pessoas: 10,
      data_evento: '25/12/2026',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('YYYY-MM-DD');
  });

  it('deve rejeitar data inexistente', () => {
    const result = validateEventData({
      tipo_evento: 'churrasco',
      qtd_pessoas: 10,
      data_evento: '2026-02-30',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('inexistente');
  });

  it('deve aceitar data nula', () => {
    const result = validateEventData({
      tipo_evento: 'churrasco',
      qtd_pessoas: 10,
      data_evento: null,
    });
    expect(result.valid).toBe(true);
  });

  it('deve rejeitar objeto vazio', () => {
    const result = validateEventData({});
    expect(result.valid).toBe(false);
  });

  it('deve rejeitar menu muito longo', () => {
    const result = validateEventData({
      tipo_evento: 'churrasco',
      qtd_pessoas: 10,
      menu: 'x'.repeat(300),
    });
    expect(result.valid).toBe(false);
  });

  it('deve aceitar menu vazio', () => {
    const result = validateEventData({
      tipo_evento: 'jantar',
      qtd_pessoas: 10,
      menu: '',
    });
    expect(result.valid).toBe(true);
  });
});

describe('validateItemEdit', () => {
  it('deve validar comando add válido', () => {
    const result = validateItemEdit({
      operation: 'add',
      itemName: 'cerveja',
      quantity: 10,
    });
    expect(result.valid).toBe(true);
    expect(result.data?.operation).toBe('add');
  });

  it('deve validar comando remove sem quantity', () => {
    const result = validateItemEdit({
      operation: 'remove',
      itemName: 'refrigerante',
    });
    expect(result.valid).toBe(true);
  });

  it('deve validar comando multiply com multiplier', () => {
    const result = validateItemEdit({
      operation: 'multiply',
      itemName: 'tudo',
      multiplier: 2,
    });
    expect(result.valid).toBe(true);
  });

  it('deve rejeitar operação inválida', () => {
    const result = validateItemEdit({
      operation: 'delete',
      itemName: 'cerveja',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Operação inválida');
  });

  it('deve rejeitar quantity negativa', () => {
    const result = validateItemEdit({
      operation: 'add',
      itemName: 'cerveja',
      quantity: -1,
    });
    expect(result.valid).toBe(false);
  });

  it('deve rejeitar itemName vazio em operação add', () => {
    const result = validateItemEdit({
      operation: 'add',
      itemName: '',
    });
    expect(result.valid).toBe(false);
  });
});
