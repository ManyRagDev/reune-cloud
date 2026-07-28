/**
 * Handler padronizado para erros do chatbot
 * Centraliza logging e feedback ao usuário
 */

export type ChatErrorType =
  | 'llm_error'
  | 'database_error'
  | 'validation_error'
  | 'network_error'
  | 'unknown_error';

export interface ChatErrorContext {
  userId?: string;
  eventoId?: string;
  action?: string;
  userMessage?: string;
}

export interface ChatErrorResult {
  userMessage: string;
  logMessage: string;
  logLevel: 'error' | 'warn' | 'info';
  shouldRetry: boolean;
}

/**
 * Tratamento padronizado de erros do chat
 * Centraliza logging e gera mensagem amigável para o usuário
 */
export function handleChatError(
  error: unknown,
  context: ChatErrorContext = {},
  errorType: ChatErrorType = 'unknown_error'
): ChatErrorResult {
  const userId = context.userId || 'unknown';
  const action = context.action || 'unknown_action';
  const userMessage = context.userMessage || '';

  // Extrair informações do erro
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log detalhado para debug
  const logDetails = {
    userId,
    action,
    eventoId: context.eventoId,
    userMessage: userMessage.substring(0, 100), // Primeiros 100 caracteres
    error: errorMessage,
    type: errorType,
    timestamp: new Date().toISOString(),
  };

  // Logging com contexto
  if (errorStack) {
    console.error('[ChatError] Detalhes do erro:', {
      ...logDetails,
      stack: errorStack?.split('\n').slice(0, 3).join('\n'), // Primeiras 3 linhas
    });
  } else {
    console.error('[ChatError] Detalhes do erro:', logDetails);
  }

  // Gerar mensagem amigável para o usuário
  let userFriendlyMessage = 'Ops! Algo deu errado. Tente novamente?';
  let logLevel: 'error' | 'warn' | 'info' = 'error';
  let shouldRetry = true;

  switch (errorType) {
    case 'llm_error':
      userFriendlyMessage = 'Tive um problema ao conectar com a IA. Podemos tentar de novo?';
      logLevel = 'error';
      shouldRetry = true;
      break;

    case 'database_error':
      userFriendlyMessage = 'Problema ao salvar seus dados. Tente mais uma vez?';
      logLevel = 'error';
      shouldRetry = true;
      break;

    case 'validation_error':
      userFriendlyMessage = 'Não entendi bem. Pode reformular?';
      logLevel = 'warn';
      shouldRetry = false; // Erro de validação geralmente é problema de input
      break;

    case 'network_error':
      userFriendlyMessage = 'Problema de conexão. Verifique sua internet e tente novamente.';
      logLevel = 'warn';
      shouldRetry = true;
      break;

    case 'unknown_error':
    default:
      userFriendlyMessage = 'Ops! Algo inesperado aconteceu. Pode tentar de novo?';
      logLevel = 'error';
      shouldRetry = true;
  }

  // Erros específicos que merecem tratamento especial
  if (errorMessage.includes('GROQ_API_KEY')) {
    userFriendlyMessage = 'Erro de configuração do sistema. Entre em contato com o suporte.';
    shouldRetry = false;
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    userFriendlyMessage = 'O sistema demorou para responder. Tente novamente em instantes.';
    shouldRetry = true;
  }

  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    userFriendlyMessage = 'Muitas solicitações ao mesmo tempo. Aguarde um pouco e tente novamente.';
    shouldRetry = true;
  }

  return {
    userMessage: userFriendlyMessage,
    logMessage: `[${errorType.toUpperCase()}] ${action}: ${errorMessage}`,
    logLevel,
    shouldRetry,
  };
}

/**
 * Wrapper para funções assíncronas com tratamento de erro padronizado
 */
export async function withChatError<T>(
  fn: () => Promise<T>,
  context: ChatErrorContext = {},
  errorType: ChatErrorType = 'unknown_error'
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const handled = handleChatError(error, context, errorType);
    throw new ChatHandledError(handled.userMessage, handled.shouldRetry);
  }
}

/**
 * Erro que já foi tratado pelo handleChatError
 */
export class ChatHandledError extends Error {
  shouldRetry: boolean;

  constructor(message: string, shouldRetry: boolean) {
    super(message);
    this.name = 'ChatHandledError';
    this.shouldRetry = shouldRetry;
  }
}

/**
 * Detecta o tipo de erro baseado na mensagem ou propriedades
 */
export function detectErrorType(error: unknown): ChatErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('groq') || message.includes('llm') || message.includes('gemini') || message.includes('openai')) {
      return 'llm_error';
    }
    if (message.includes('database') || message.includes('supabase') || message.includes('postgres')) {
      return 'database_error';
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('zod')) {
      return 'validation_error';
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network_error';
    }
  }

  return 'unknown_error';
}

/**
 * Verifica se um erro é recoverable (pode ser tentado novamente)
 */
export function isRecoverableError(error: unknown): boolean {
  if (error instanceof ChatHandledError) {
    return error.shouldRetry;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Erros que geralmente são recoverables
    if (message.includes('timeout') || message.includes('rate limit')) {
      return true;
    }

    // Erros que geralmente não são recoverables
    if (message.includes('validation') || message.includes('not found') || message.includes('unauthorized')) {
      return false;
    }
  }

  return true; // Default para tentativas de retry
}
