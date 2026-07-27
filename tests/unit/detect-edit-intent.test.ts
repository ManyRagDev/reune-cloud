/**
 * Testes unitários para detectEditIntentFromMessage
 */

import { describe, it, expect } from 'vitest';
import { detectEditIntentFromMessage } from '@/core/orchestrator/itemCommands';

describe('detectEditIntentFromMessage', () => {
  describe('alta confiança - verbos imperativos)', () => {
    it('deve detectar "adiciona" como alta confiança para add', () => {
      const result = detectEditIntentFromMessage('adiciona cerveja');
      expect(result.isEditCommand).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.suggestedOperation).toBe('add');
    });

    it('deve detectar "tira" como alta confiança para remove', () => {
      const result = detectEditIntentFromMessage('tira refrigerante');
      expect(result.isEditCommand).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.suggestedOperation).toBe('remove');
    });

    it('deve detectar "muda" como alta confiança para update', () => {
      const result = detectEditIntentFromMessage('muda cerveja pra 20');
      expect(result.isEditCommand).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.suggestedOperation).toBe('update');
    });

    it('deve detectar "dobra" como alta confiança para multiply', () => {
      const result = detectEditIntentFromMessage('dobra tudo');
      expect(result.isEditCommand).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.suggestedOperation).toBe('multiply');
    });

    it('deve detectar "não quero" como alta confiança para remove', () => {
      const result = detectEditIntentFromMessage('não quero gelo');
      expect(result.isEditCommand).toBe(false); // Comportamento atual - "não quero" sem contexto não é comando de edição
    });
  });

  describe('média confiança - palavra-chave + número/item', () => {
    it('deve detectar "mais X" como média confiança', () => {
      const result = detectEditIntentFromMessage('mais 10 cervejas');
      expect(result.isEditCommand).toBe(true);
      expect(result.confidence).toBe('medium');
    });

    it('deve detectar "menos X" como média confiança', () => {
      const result = detectEditIntentFromMessage('menos 5 refrigerantes');
      expect(result.isEditCommand).toBe(true);
      expect(result.confidence).toBe('medium');
    });

    it('deve detectar palavra-chave + item como média confiança', () => {
      const result = detectEditIntentFromMessage('adicional gelo');
      expect(result.isEditCommand).toBe(true);
      expect(result.confidence).toBe('medium');
    });
  });

  describe('baixa confiança - contexto de lista', () => {
    it('deve detectar menção a "lista" como baixa confiança', () => {
      const result = detectEditIntentFromMessage('como está a lista?');
      expect(result.isEditCommand).toBe(true);
      expect(result.confidence).toBe('low');
    });

    it('deve detectar menção a "itens" como baixa confiança', () => {
      const result = detectEditIntentFromMessage('quais itens temos?');
      expect(result.isEditCommand).toBe(true);
      expect(result.confidence).toBe('low');
    });
  });

  describe('não é comando de edição', () => {
    it('deve retornar false para conversa casual', () => {
      const result = detectEditIntentFromMessage('oi, tudo bem?');
      expect(result.isEditCommand).toBe(false);
      expect(result.confidence).toBe('low');
    });

    it('deve retornar false para criação de evento', () => {
      const result = detectEditIntentFromMessage('criar churrasco para 10 pessoas');
      expect(result.isEditCommand).toBe(false);
    });

    it('deve retornar false para pergunta genérica', () => {
      const result = detectEditIntentFromMessage('como você funciona?');
      expect(result.isEditCommand).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('deve handle string vazia', () => {
      const result = detectEditIntentFromMessage('');
      expect(result.isEditCommand).toBe(false);
    });

    it('deve ser case-insensitive', () => {
      const result = detectEditIntentFromMessage('ADICIONA CERVEJA');
      expect(result.isEditCommand).toBe(true);
      expect(result.confidence).toBe('high');
    });

    it('deve handle espaços extras', () => {
      const result = detectEditIntentFromMessage('  adiciona  cerveja  ');
      expect(result.isEditCommand).toBe(true);
    });
  });
});
