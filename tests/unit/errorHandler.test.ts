/**
 * Testes unitários para errorHandler
 */

import { describe, it, expect, vi } from 'vitest';
import { handleChatError, detectErrorType, isRecoverableError, ChatHandledError } from '@/utils/errorHandler';
import type { ChatErrorContext } from '@/utils/errorHandler';

describe('handleChatError', () => {
  describe('tratamento de erros LLM', () => {
    it('deve retornar mensagem amigável para erro de LLM', () => {
      const error = new Error('Failed to call Groq API');
      const context: ChatErrorContext = { userId: 'user123', action: 'processMessage' };

      const result = handleChatError(error, context, 'llm_error');

      expect(result.userMessage).toContain('IA');
      expect(result.logLevel).toBe('error');
      expect(result.shouldRetry).toBe(true);
    });

    it('deve detectar erro de API Key do Groq', () => {
      const error = new Error('GROQ_API_KEY not found');
      const context: ChatErrorContext = { userId: 'user123' };

      const result = handleChatError(error, context, 'llm_error');

      expect(result.userMessage).toContain('configuração');
      expect(result.shouldRetry).toBe(false);
    });
  });

  describe('tratamento de erros de database', () => {
    it('deve retornar mensagem amigável para erro de banco', () => {
      const error = new Error('Supabase connection failed');
      const context: ChatErrorContext = { userId: 'user123' };

      const result = handleChatError(error, context, 'database_error');

      expect(result.userMessage).toContain('dados');
      expect(result.logLevel).toBe('error');
      expect(result.shouldRetry).toBe(true);
    });
  });

  describe('tratamento de erros de validação', () => {
    it('deve retornar mensagem para reformular', () => {
      const error = new Error('Validation failed: invalid input');
      const context: ChatErrorContext = { userId: 'user123' };

      const result = handleChatError(error, context, 'validation_error');

      expect(result.userMessage).toContain('reformular');
      expect(result.logLevel).toBe('warn');
      expect(result.shouldRetry).toBe(false);
    });
  });

  describe('tratamento de erros de rede', () => {
    it('deve detectar timeout e sugerir espera', () => {
      const error = new Error('Request timeout after 30000ms');
      const context: ChatErrorContext = { userId: 'user123' };

      const result = handleChatError(error, context, 'network_error');

      expect(result.userMessage).toContain('demorou');
      expect(result.shouldRetry).toBe(true);
    });

    it('deve detectar rate limit', () => {
      const error = new Error('Rate limit exceeded: 429');
      const context: ChatErrorContext = { userId: 'user123' };

      const result = handleChatError(error, context, 'network_error');

      expect(result.userMessage).toContain('Muitas solicitações');
      expect(result.shouldRetry).toBe(true);
    });
  });

  describe('erros desconhecidos', () => {
    it('deve retornar mensagem genérica', () => {
      const error = new Error('Unknown error');
      const context: ChatErrorContext = { userId: 'user123' };

      const result = handleChatError(error, context, 'unknown_error');

      expect(result.userMessage).toContain('Ops!');
      expect(result.logLevel).toBe('error');
      expect(result.shouldRetry).toBe(true);
    });

    it('deve handle erro sem mensagem', () => {
      const error = 'string error';
      const context: ChatErrorContext = { userId: 'user123' };

      const result = handleChatError(error, context, 'unknown_error');

      expect(result.userMessage).toBeTruthy();
      expect(result.logLevel).toBe('error');
    });
  });

  describe('logging', () => {
    it('deve fazer console.error com contexto detalhado', () => {
      const error = new Error('Test error');
      const context: ChatErrorContext = {
        userId: 'user123',
        eventoId: 'event456',
        action: 'testAction',
        userMessage: 'mensagem de teste',
      };

      const consoleErrorSpy = vi.spyOn(console, 'error');

      handleChatError(error, context, 'llm_error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ChatError] Detalhes do erro:',
        expect.objectContaining({
          userId: 'user123',
          eventoId: 'event456',
          action: 'testAction',
          error: 'Test error',
        })
      );
    });
  });
});

describe('detectErrorType', () => {
  it('deve detectar erro de LLM', () => {
    const error = new Error('groq timeout');
    expect(detectErrorType(error)).toBe('llm_error');
  });

  it('deve detectar erro de database', () => {
    const error = new Error('supabase connection failed');
    expect(detectErrorType(error)).toBe('database_error');
  });

  it('deve detectar erro de validação', () => {
    const error = new Error('zod validation failed');
    expect(detectErrorType(error)).toBe('validation_error');
  });

  it('deve detectar erro de rede', () => {
    const error = new Error('network connection failed');
    expect(detectErrorType(error)).toBe('network_error');
  });

  it('deve retornar unknown_error por padrão', () => {
    const error = new Error('something unexpected');
    expect(detectErrorType(error)).toBe('unknown_error');
  });

  it('deve handle valores não-Error', () => {
    expect(detectErrorType('string error')).toBe('unknown_error');
    expect(detectErrorType(null)).toBe('unknown_error');
  });
});

describe('isRecoverableError', () => {
  it('deve retornar true para erro recoverable do ChatHandledError', () => {
    const error = new ChatHandledError('Test message', true);
    expect(isRecoverableError(error)).toBe(true);
  });

  it('deve retornar false para erro não recoverable do ChatHandledError', () => {
    const error = new ChatHandledError('Test message', false);
    expect(isRecoverableError(error)).toBe(false);
  });

  it('deve detectar erros recoverable por mensagem', () => {
    const timeoutError = new Error('Request timeout');
    expect(isRecoverableError(timeoutError)).toBe(true);

    const rateLimitError = new Error('Rate limit exceeded');
    expect(isRecoverableError(rateLimitError)).toBe(true);
  });

  it('deve detectar erros não recoverable por mensagem', () => {
    const validationError = new Error('Validation failed');
    expect(isRecoverableError(validationError)).toBe(false);

    const notFoundError = new Error('Resource not found');
    expect(isRecoverableError(notFoundError)).toBe(false);

    const unauthorizedError = new Error('Unauthorized access');
    expect(isRecoverableError(unauthorizedError)).toBe(false);
  });

  it('deve retornar true por padrão', () => {
    const error = new Error('Something unexpected');
    expect(isRecoverableError(error)).toBe(true);
  });
});
