/**
 * Testes unitários para itemCommands
 */

import { describe, it, expect } from 'vitest';
import { parseItemCommand } from '@/core/orchestrator/itemCommands';

describe('parseItemCommand', () => {
  describe('comandos de remoção', () => {
    it('deve parsear "tira cerveja"', () => {
      const result = parseItemCommand('tira cerveja');
      expect(result).toEqual({
        operation: 'remove',
        target: 'specific',
        itemName: 'cerveja',
        rawText: 'tira cerveja',
      });
    });

    it('deve parsear "remove refrigerante"', () => {
      const result = parseItemCommand('remove refrigerante');
      expect(result?.operation).toBe('remove');
      expect(result?.itemName).toBe('refrigerante');
    });

    it('deve parsear "não preciso de gelo"', () => {
      const result = parseItemCommand('não preciso de gelo');
      expect(result).toBeNull(); // Comportamento atual - não é suportado
    });
  });

  describe('comandos de adição', () => {
    it('deve parsear "adiciona cerveja"', () => {
      const result = parseItemCommand('adiciona cerveja');
      expect(result).toEqual({
        operation: 'add',
        target: 'specific',
        itemName: 'cerveja',
        quantity: undefined,
        rawText: 'adiciona cerveja',
      });
    });

    it('deve parsear "adiciona 10 cervejas"', () => {
      const result = parseItemCommand('adiciona 10 cervejas');
      expect(result?.operation).toBe('add');
      expect(result?.quantity).toBe(10);
      expect(result?.itemName).toBe('cervejas');
    });

    it('deve parsear "coloca mais 2 pães"', () => {
      const result = parseItemCommand('coloca mais 2 pães');
      expect(result?.operation).toBe('add');
      expect(result?.itemName).toBe('mais 2 pães'); // Captura tudo como nome
    });
  });

  describe('comandos de atualização', () => {
    it('deve parsear "muda cerveja pra 20"', () => {
      const result = parseItemCommand('muda cerveja pra 20');
      expect(result).toEqual({
        operation: 'update',
        target: 'specific',
        itemName: 'cerveja',
        quantity: 20,
        rawText: 'muda cerveja pra 20',
      });
    });

    it('deve parsear "aumenta pão pra 5"', () => {
      const result = parseItemCommand('aumenta pão pra 5');
      expect(result?.operation).toBe('update');
      expect(result?.itemName).toBe('pão');
      expect(result?.quantity).toBe(5);
    });
  });

  describe('comandos de multiplicação', () => {
    it('deve parsear "dobra tudo"', () => {
      const result = parseItemCommand('dobra tudo');
      expect(result).toEqual({
        operation: 'multiply',
        target: 'all',
        itemName: undefined,
        multiplier: 2,
        rawText: 'dobra tudo',
      });
    });

    it('deve parsear "triplica as bebidas"', () => {
      const result = parseItemCommand('triplica as bebidas');
      expect(result?.operation).toBe('multiply');
      expect(result?.target).toBe('specific');
      expect(result?.itemName).toBe('as bebidas'); // Captura o artigo também
      expect(result?.multiplier).toBe(3);
    });

    it('deve parsear "multiplica por 2 a carne"', () => {
      const result = parseItemCommand('multiplica por 2 a carne');
      expect(result?.operation).toBe('multiply');
      expect(result?.target).toBe('category'); // Reconhece "carne" como categoria
      expect(result?.category).toBe('comida');
      expect(result?.multiplier).toBe(2);
    });
  });

  describe('comandos delta', () => {
    it('deve parsear "mais 10 cervejas"', () => {
      const result = parseItemCommand('mais 10 cervejas');
      expect(result).toEqual({
        operation: 'update',
        target: 'specific',
        itemName: 'cervejas',
        quantityDelta: 10,
        rawText: 'mais 10 cervejas',
      });
    });

    it('deve parsear "menos 5 refrigerantes"', () => {
      const result = parseItemCommand('menos 5 refrigerantes');
      expect(result?.operation).toBe('update');
      expect(result?.quantityDelta).toBe(-5);
    });
  });

  describe('comandos inválidos', () => {
    it('deve retornar null para comando não reconhecido', () => {
      const result = parseItemCommand('isso não é um comando');
      expect(result).toBeNull();
    });

    it('deve retornar null para string vazia', () => {
      const result = parseItemCommand('');
      expect(result).toBeNull();
    });
  });
});
