/**
 * Testes unitários para date-parser
 */

import { describe, it, expect } from 'vitest';
import { parseToIsoDate, validateEventDate } from '@/core/nlp/date-parser';

describe('parseToIsoDate', () => {
  it('deve parsear data no formato ISO', () => {
    expect(parseToIsoDate('2026-02-15')).toBe('2026-02-15');
  });

  it('deve parsear data no formato brasileiro dd/mm', () => {
    const result = parseToIsoDate('15/02');
    expect(result).toMatch(/\d{4}-02-15/);
  });

  it('deve parsear data no formato brasileiro dd/mm/yyyy', () => {
    expect(parseToIsoDate('15/02/2026')).toBe('2026-02-15');
  });

  it('deve parsear data por extenso', () => {
    const result = parseToIsoDate('15 de fevereiro de 2026');
    expect(result).toBe('2026-02-15');
  });

  it('deve retornar null para data inválida', () => {
    expect(parseToIsoDate('invalid')).toBeNull();
  });
});

describe('validateEventDate', () => {
  it('deve validar data futura corretamente', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const isoDate = futureDate.toISOString().split('T')[0];

    const result = validateEventDate(isoDate);
    expect(result.valid).toBe(true);
    expect(result.warning).toBeNull();
  });

  it('deve rejeitar data no passado', () => {
    const result = validateEventDate('2020-01-01');
    expect(result.valid).toBe(false);
    expect(result.warning).toBe('past');
    expect(result.message).toContain('já passou');
  });

  it('deve alertar para data muito próxima', () => {
    const nearDate = new Date();
    nearDate.setDate(nearDate.getDate() + 3);
    const isoDate = nearDate.toISOString().split('T')[0];

    const result = validateEventDate(isoDate);
    expect(result.valid).toBe(true);
    expect(result.warning).toBe('too_close');
  });

  it('deve sugerir correção para data no passado', () => {
    const result = validateEventDate('15/02/2020');
    expect(result.valid).toBe(false);
    expect(result.suggestedDate).toBeTruthy();
  });
});
