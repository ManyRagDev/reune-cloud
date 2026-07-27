/**
 * Testes unitários para parseEventoId
 */

import { describe, it, expect } from 'vitest';
import { parseEventoId, isValidId } from '@/utils/parsers';

describe('parseEventoId', () => {
  describe('valores nulos e indefinidos', () => {
    it('deve retornar null para null', () => {
      expect(parseEventoId(null)).toBeNull();
    });

    it('deve retornar null para undefined', () => {
      expect(parseEventoId(undefined)).toBeNull();
    });

    it('deve retornar null para string vazia', () => {
      expect(parseEventoId('')).toBeNull();
    });

    it('deve retornar null para string vazia com espaços', () => {
      expect(parseEventoId('   ')).toBeNull();
    });
  });

  describe('strings literais problemáticas', () => {
    it('deve converter "null" para null', () => {
      expect(parseEventoId('null')).toBeNull();
    });

    it('deve converter "undefined" para null', () => {
      expect(parseEventoId('undefined')).toBeNull();
    });

    it('deve converter "NULL" para null', () => {
      expect(parseEventoId('NULL')).toBeNull();
    });
  });

  describe('valores válidos', () => {
    it('deve retornar o valor para string válida', () => {
      expect(parseEventoId('abc-123')).toBe('abc-123');
    });

    it('deve retornar o valor para UUID válido', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(parseEventoId(uuid)).toBe(uuid);
    });

    it('deve retornar o valor para número como string', () => {
      expect(parseEventoId('123')).toBe('123');
    });

    it('deve trim espaços', () => {
      expect(parseEventoId('  abc-123  ')).toBe('abc-123');
    });
  });
});

describe('isValidId', () => {
  describe('valores inválidos', () => {
    it('deve retornar false para null', () => {
      expect(isValidId(null)).toBe(false);
    });

    it('deve retornar false para undefined', () => {
      expect(isValidId(undefined)).toBe(false);
    });

    it('deve retornar false para string "null"', () => {
      expect(isValidId('null')).toBe(false);
    });

    it('deve retornar false para string "undefined"', () => {
      expect(isValidId('undefined')).toBe(false);
    });

    it('deve retornar false para string vazia', () => {
      expect(isValidId('')).toBe(false);
    });
  });

  describe('UUIDs válidos', () => {
    it('deve retornar true para UUID v4 válido', () => {
      expect(isValidId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('deve retornar true para UUID v4 com letras maiúsculas', () => {
      expect(isValidId('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });
  });

  describe('UUIDs inválidos', () => {
    it('deve retornar false para UUID com formato incorreto', () => {
      expect(isValidId('550e8400-e29b-41d4-a716')).toBe(false);
    });

    it('deve retornar false para string aleatória', () => {
      expect(isValidId('not-a-uuid')).toBe(false);
    });
  });

  describe('números', () => {
    it('deve retornar true para número como string', () => {
      expect(isValidId('123')).toBe(true);
    });

    it('deve retornar true para zero', () => {
      expect(isValidId('0')).toBe(true);
    });

    it('deve retornar false para texto que não é número', () => {
      expect(isValidId('abc')).toBe(false);
    });
  });
});
